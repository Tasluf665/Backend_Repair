/**
 * Middleware for restricting access to admin-only routes.
 *
 * This middleware function checks if the authenticated user has admin privileges.
 * If the user is not an admin, it returns a 403 Forbidden response; otherwise, it allows access.
 *
 * @param {object} req - The HTTP request object.
 * @param {object} res - The HTTP response object.
 * @param {function} next - The next middleware function in the Express.js middleware chain.
 */
module.exports = function (req, res, next) {
  // Check if the authenticated user is an admin. If not, deny access with a 403 Forbidden response.
  if (!req.user.isAdmin)
    return res.status(403).send({ error: "Access Denied" });

  // If the user is an admin, allow them to proceed to the next middleware or route handler.
  next();
};
