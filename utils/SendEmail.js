const nodemailer = require("nodemailer");
const config = require("config");
const jwt = require("jsonwebtoken");

const sendEmail = async (email, subject, message) => {
  let transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  await transporter.sendMail({
    from: process.env.EMAIL,
    to: email,
    subject: subject,
    html: message,
  });
};

const sendVerificationEmail = async (email, _id) => {
  const token = jwt.sign({ _id }, config.get("jwtPrivateKey"), {
    expiresIn: "20m",
  });

  const subject = "Account Activation Link";
  const message = `<h2>Please click on given link to activate your account. This link will expire in 20 minutes</h2>
  <p>${process.env.URL}/api/users/authentication/${token}</p>
  `;

  sendEmail(email, subject, message);
};

const sendResetPasswordEmail = async (email, _id) => {
  const token = jwt.sign({ _id }, config.get("jwtPrivateKey"), {
    expiresIn: "20m",
  });

  const subject = "Account Password Reset Link";
  const message = `<h2>Please click on given link to reset your account password. This link will expire in 20 minutes</h2>
  <p>${process.env.URL}/api/auth/reset-password/${token}</p>
  `;

  sendEmail(email, subject, message);
};

module.exports = { sendResetPasswordEmail, sendVerificationEmail };
