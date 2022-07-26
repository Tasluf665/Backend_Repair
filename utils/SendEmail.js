const nodemailer = require("nodemailer");
const config = require("config");
const jwt = require("jsonwebtoken");

const sendVerificationEmail = async (email, _id) => {
  const token = jwt.sign({ _id }, config.get("jwtPrivateKey"), {
    expiresIn: "20m",
  });

  let transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL, // generated ethereal user
      pass: process.env.EMAIL_PASSWORD, // generated ethereal password
    },
  });

  let info = await transporter.sendMail({
    from: process.env.EMAIL, // sender address
    to: email, // list of receivers
    subject: "Account Activation Link", // Subject line
    html: `<h2>Please click on given link to activate your account</h2>
      <p>${process.env.URL}/api/users/authentication/${token}</p>
      `,
  });

  console.log("Message sent: %s", info.messageId);
};

const sendResetPasswordEmail = async (email) => {
  const token = jwt.sign({ email }, config.get("jwtPrivateKey"), {
    expiresIn: "20m",
  });

  let transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL, // generated ethereal user
      pass: process.env.EMAIL_PASSWORD, // generated ethereal password
    },
  });

  let info = await transporter.sendMail({
    from: process.env.EMAIL, // sender address
    to: email, // list of receivers
    subject: "Account Password Reset Link", // Subject line
    html: `<h2>Please click on given link to reset your account password</h2>
      <p>${process.env.URL}/reset-password/${token}</p>
      `,
  });

  console.log("Message sent: %s", info.messageId);
};

module.exports = { sendResetPasswordEmail, sendVerificationEmail };
