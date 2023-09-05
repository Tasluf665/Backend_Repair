const nodemailer = require("nodemailer");
const config = require("config");
const jwt = require("jsonwebtoken");

/**
 * Send an email using Nodemailer.
 *
 * This function sends an email with the specified subject and HTML message to the recipient's email address using the configured email service.
 *
 * @param {string} email - The recipient's email address.
 * @param {string} subject - The subject of the email.
 * @param {string} message - The HTML message content of the email.
 * @returns {void} - No return value; it sends the email using Nodemailer.
 */
const sendEmail = async (email, subject, message) => {
  // Create a Nodemailer transporter with mailtrap service and authentication.
  //Source NodeJS -> Udemy-Node.js, Express, MongoDB & More The Complete Bootcamp 2020 -> 10. Authentication, Authorization and Security -> 13. Sending Emails with Nodemailer
  //I have created a mailtrap account with repair...@gmail.com
  let transporter = nodemailer.createTransport({
    host: config.get("EMAIL_HOST"),
    port: config.get("EMAIL_PORT"),
    auth: {
      user: config.get("EMAIL_USER"),
      pass: config.get("EMAIL_PASS"),
    },
  });

  // Send the email with the specified details (from, to, subject, and HTML message).
  await transporter.sendMail({
    from: "Tasluf Morshed <repairtest70@gmail.com>", // Sender's email address.
    to: email, // Recipient's email address.
    subject: subject, // Email subject.
    html: message, // HTML content of the email.
  });
};

/**
 * Send an account activation email with an activation token link.
 *
 * This function generates a JWT token containing the user's ID and sends an email with a link for activating the user's account.
 *
 * @param {string} email - The recipient's email address to send the account activation email.
 * @param {string} _id - The user's ID to be included in the activation token.
 * @returns {void} - No return value; it sends an email with the activation token link.
 */
const sendVerificationEmail = async (email, _id) => {
  // Generate a JWT token containing the user's ID with an expiration time.
  const token = jwt.sign({ _id }, config.get("jwtPrivateKey"), {
    expiresIn: config.get("EMAIL_TOKEN_EXPIRATION_TIME"),
  });

  // Define the email subject and message body with the activation token link.
  const subject = "Account Activation Link";
  const message = `<h2>Please click on the given link to activate your account. This link will expire in 20 minutes</h2>
  <p>${config.get("URL")}/api/users/authentication/${token}</p>
  `;

  // Send the email with the activation token link.
  sendEmail(email, subject, message);
};

/**
 * Send a password reset email with a reset token link.
 *
 * This function generates a JWT token containing the user's ID and sends an email with a link for resetting the account password.
 *
 * @param {string} email - The recipient's email address to send the password reset email.
 * @param {string} _id - The user's ID to be included in the reset token.
 * @returns {void} - No return value; it sends an email with the reset token link.
 */
const sendResetPasswordEmail = async (email, _id) => {
  // Generate a JWT token containing the user's ID with an expiration time.
  const token = jwt.sign({ _id }, config.get("jwtPrivateKey"), {
    expiresIn: config.get("EMAIL_TOKEN_EXPIRATION_TIME"),
  });

  // Define the email subject and message body with the reset token link.
  const subject = "Account Password Reset Link";
  const message = `<h2>Please click on the given link to reset your account password. This link will expire in 20 minutes</h2>
  <p>${config.get("URL")}/api/auth/reset-password/${token}</p>
  `;

  // Send the email with the reset token link.
  sendEmail(email, subject, message);
};

module.exports = { sendResetPasswordEmail, sendVerificationEmail };
