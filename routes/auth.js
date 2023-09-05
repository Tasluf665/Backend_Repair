const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const Joi = require("joi");
const jwt = require("jsonwebtoken");
const config = require("config");

const { User } = require("../models/user");
const asyncMiddleware = require("../middleware/async");
const {
  sendVerificationEmail,
  sendResetPasswordEmail,
} = require("../utils/SendEmail");

/**
 * Route handler for initiating the password reset process via email.
 *
 * This route handles a POST request to initiate the password reset process for a user by sending a reset password email.
 *
 * @route POST /api/forgot-password
 * @param {object} req.body - The request body containing the email address for initiating the password reset.
 * @returns {object} - A JSON response indicating the success of the password reset initiation.
 */
router.post(
  "/forgot-password",
  asyncMiddleware(async (req, res) => {
    // Validate the request body containing the email address.
    const { error } = validateForgotPassword(req.body);

    // If validation fails, return a 400 Bad Request response with the error details.
    if (error) return res.status(400).send({ error: error.details[0].message });

    // Find the user by email address in the database.
    let user = await User.findOne({ email: req.body.email });

    // If no matching user is found, return a 400 Bad Request response.
    if (!user)
      return res
        .status(400)
        .send({ error: "User not found with this given email" });

    // Send a reset password email to the user's email address.
    sendResetPasswordEmail(user.email, user._id);

    // Send a success response indicating that the user should check their email to reset the password.
    res.send({ success: "Check your email to reset your password" });
  })
);

/**
 * Route handler for rendering the password reset form.
 *
 * This route handles a GET request to render a password reset form based on a provided reset token.
 *
 * @route GET /api/auth/reset-password/:token
 * @param {string} req.params.token - The reset token used to access the reset password form.
 * @returns {HTML} - Renders the 'ResetPasswordForm' view with the provided reset token.
 */
router.get(
  "/reset-password/:token",
  asyncMiddleware(async (req, res) => {
    // Extract the reset token from the request parameters.
    const { token } = req.params;

    // If no token is provided, return a 401 Unauthorized response.
    if (!token)
      return res
        .status(401)
        .send({ error: "Access denied. No token provided" });

    try {
      // Verify the provided reset token using the JWT secret.
      jwt.verify(token, config.get("jwtPrivateKey"));

      // Render the 'ResetPasswordForm' view with the provided reset token.
      res.render("ResetPasswordForm", { token: token });
    } catch (ex) {
      // Handle invalid tokens with a 400 Bad Request response.
      res.status(400).send({ error: "Invalid token" });
    }
  })
);

/**
 * Route handler for resetting a user's password.
 *
 * This route handles a POST request to reset a user's password based on a provided reset token.
 *
 * @route POST /api/auth/reset-password/:token
 * @param {string} req.params.token - The reset token used to validate and reset the user's password.
 * @param {object} req.body - The request body containing the new password for the user.
 * @returns {HTML} - Renders the 'PasswordResetVerification' view after successfully resetting the user's password.
 */
router.post(
  "/reset-password/:token",
  asyncMiddleware(async (req, res) => {
    // Validate the request body containing the new password.
    const { error } = validateResetPassword(req.body);

    // If validation fails, return a 400 Bad Request response with the error details.
    if (error) return res.status(400).send({ error: error.details[0].message });

    // Extract the reset token from the request parameters.
    const { token } = req.params;

    // If no token is provided, return a 401 Unauthorized response.
    if (!token)
      return res
        .status(401)
        .send({ error: "Access denied. No token provided" });

    try {
      // Verify the provided reset token using the JWT secret.
      const decoded = jwt.verify(token, config.get("jwtPrivateKey"));

      // Find the user by their ID in the database.
      const user = await User.findById(decoded._id);

      // Generate a new salt and hash the new password.
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(req.body.password, salt);

      // Set the 'verified' flag to true and save the user's updated data.
      user.verified = true;
      await user.save();

      // Render the 'PasswordResetVerification' view after successful password reset.
      res.render("PasswordResetVerification");
    } catch (ex) {
      // Handle invalid tokens with a 400 Bad Request response.
      res.status(400).send({ error: "Invalid token" });
    }
  })
);

/**
 * Route handler for user login.
 *
 * This route handles a POST request to authenticate a user's login credentials and generate an access token for the user.
 *
 * @route POST /api/auth
 * @param {object} req.body - The request body containing the user's email and password for authentication.
 * @returns {object} - A JSON response indicating the success of the login and providing the user's access token.
 */
router.post(
  "/",
  asyncMiddleware(async (req, res) => {
    // Validate the request body containing the user's email and password.
    const { error } = validate(req.body);

    // If validation fails, return a 400 Bad Request response with the error details.
    if (error) return res.status(400).send({ error: error.details[0].message });

    // Find the user by their email in the database.
    let user = await User.findOne({ email: req.body.email });

    // If no user is found with the provided email, return a 400 Bad Request response.
    if (!user)
      return res.status(400).send({ error: "Invalid email or password" });

    // Check if the user has a password set; if not, return a message indicating that the user should log in with Google.
    if (!user.password)
      return res.status(400).send({
        error: "This user does not have a password. Please log in with Google",
      });

    // Validate the user's password by comparing the provided password with the stored hashed password.
    const validPassword = await bcrypt.compare(
      req.body.password,
      user.password
    );

    // If the password is invalid, return a 400 Bad Request response.
    if (!validPassword)
      return res.status(400).send({ error: "Invalid email or password" });

    // If the user's email is not verified, send a verification email and return a message.
    if (!user.verified) {
      sendVerificationEmail(user.email, user._id);
      return res.status(400).send({
        error:
          "Email is not verified. Please check your email to verify your account",
      });
    }

    // Generate an access token and a refresh token for the authenticated user.
    const token = user.generateAuthToken();
    const refreshToken = user.generateRefreshToken();

    // Send a success response with user information and tokens.
    res.send({
      success: "Login Successfully",
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        token: token,
        refreshToken: refreshToken,
      },
    });
  })
);

/**
 * Route handler for generating a new access token using a refresh token.
 *
 * This route handles a POST request to generate a new access token using a provided refresh token.
 *
 * @route POST /api/auth/newToken
 * @param {string} req.header("refresh-token") - The refresh token used to generate a new access token.
 * @returns {object} - A JSON response indicating the success of token generation and providing the new access token.
 */
router.post(
  "/newToken",
  asyncMiddleware(async (req, res) => {
    // Extract the refresh token from the request headers.
    const refreshToken = req.header("refresh-token");

    // If no refresh token is provided, return a 401 Unauthorized response.
    if (!refreshToken)
      return res
        .status(401)
        .send({ error: "Access denied. No refresh token provided" });

    try {
      // Verify the provided refresh token using the configured private key.
      const decoded = jwt.verify(
        refreshToken,
        config.get("REPAIR_JWT_REFRESH_TOKEN_PRIVATE_KEY")
      );

      // Find the user by their ID in the database.
      let user = await User.findById(decoded._id);

      // If no user is found with the provided ID, return a 400 Bad Request response.
      if (!user)
        return res.status(400).send({ error: "Invalid email or password" });

      // Generate a new access token for the authenticated user.
      const token = user.generateAuthToken();

      // Send a success response with user information and the new access token.
      res.send({
        success: "New Token Generated Successfully",
        data: {
          _id: user._id,
          name: user.name,
          email: user.email,
          token: token,
          refreshToken: refreshToken,
        },
      });
    } catch (ex) {
      // Handle invalid tokens with a 400 Bad Request response.
      res.status(400).send({ error: "Invalid token" });
    }
  })
);

/**
 * Validate user login credentials.
 *
 * This function validates the provided user login credentials, including email and password.
 *
 * @param {object} user - The user object containing email and password for validation.
 * @returns {object} - A validation result object containing an 'error' field if validation fails.
 */
function validate(user) {
  // Define a Joi schema to validate the user object.
  const schema = Joi.object({
    email: Joi.string().min(5).max(255).required().email(),
    password: Joi.string().min(5).max(255).required(),
  });

  // Validate the user object against the defined schema and return the result.
  return schema.validate(user);
}

/**
 * Validate the request to initiate a password reset.
 *
 * This function validates the provided user email for initiating a password reset.
 *
 * @param {object} user - The user object containing the email for validation.
 * @returns {object} - A validation result object containing an 'error' field if validation fails.
 */
function validateForgotPassword(user) {
  // Define a Joi schema to validate the user object for initiating a password reset.
  const schema = Joi.object({
    email: Joi.string().min(5).max(255).required().email(),
  });

  // Validate the user object against the defined schema and return the result.
  return schema.validate(user);
}

/**
 * Validate the request to reset a user's password.
 *
 * This function validates the provided new password when resetting a user's password.
 *
 * @param {object} user - The user object containing the new password for validation.
 * @returns {object} - A validation result object containing an 'error' field if validation fails.
 */
function validateResetPassword(user) {
  // Define a Joi schema to validate the user object for resetting a password.
  const schema = Joi.object({
    password: Joi.string().min(5).max(255).required(),
  });

  // Validate the user object against the defined schema and return the result.
  return schema.validate(user);
}

module.exports = router;
