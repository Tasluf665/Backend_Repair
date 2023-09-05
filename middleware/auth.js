// Import the JWT library for token operations. Source: Mosh -> NodeJS course -> 10. Authentication -> 9- Generating, 10- Storing Secrets, 11- Setting, 12- Encapsulating and 13- Authorization
const jwt = require("jsonwebtoken");
// Config for configuration management. Source: Mosh -> NodeJS course -> 5. Express -> 7 - Configuration
const config = require("config");

/**
 * Authentication middleware for verifying JSON Web Tokens (JWT).
 *
 * This middleware function is used to verify the authenticity of incoming requests by checking the presence and validity of a JWT.
 * If a valid JWT is found in the 'x-auth-token' header, it decodes the token and attaches the user information to the request object for further processing.
 *
 * @param {object} req - The HTTP request object.
 * @param {object} res - The HTTP response object.
 * @param {function} next - The next middleware function in the Express.js middleware chain.
 */
function auth(req, res, next) {
  // Extract the JWT from the 'x-auth-token' header.
  const token = req.header("x-auth-token");

  // If no token is provided, return a 401 Unauthorized response.
  if (!token)
    return res.status(401).send({ error: "Access denied. No token provided" });

  try {
    // Verify the token using the configured JWT private key.
    const decoded = jwt.verify(token, config.get("jwtPrivateKey"));

    // Attach the decoded user information to the request object for further processing.
    req.user = decoded;

    // Continue to the next middleware or route handler.
    next();
  } catch (ex) {
    // If the token is invalid, return a 400 Bad Request response.
    res.status(400).send({ error: "Invalid token" });
  }
}

module.exports = auth;
