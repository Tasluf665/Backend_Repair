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

router.post(
  "/forgot-password",
  asyncMiddleware(async (req, res) => {
    const { error } = validateForgotPassword(req.body);
    if (error) return res.status(400).send({ error: error.details[0].message });

    let user = await User.findOne({ email: req.body.email });
    if (!user)
      return res
        .status(400)
        .send({ error: "User not found with this given email" });

    sendResetPasswordEmail(user.email, user._id);
    res.send({ success: "Check your email to reset your password" });
  })
);

router.get(
  "/reset-password/:token",
  asyncMiddleware(async (req, res) => {
    const { token } = req.params;

    if (!token)
      return res
        .status(401)
        .send({ error: "Access denied. No token provided" });
    try {
      jwt.verify(token, config.get("jwtPrivateKey"));
      res.render("RestPasswordForm", { token: token });
    } catch (ex) {
      res.status(400).send({ error: "Invalide token" });
    }
  })
);

router.post(
  "/reset-password/:token",
  asyncMiddleware(async (req, res) => {
    const { error } = validateResetPassword(req.body);
    if (error) return res.status(400).send({ error: error.details[0].message });

    const { token } = req.params;
    if (!token)
      return res
        .status(401)
        .send({ error: "Access denied. No token provided" });
    try {
      const decoded = jwt.verify(token, config.get("jwtPrivateKey"));

      const user = await User.findById(decoded._id);
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(req.body.password, salt);
      user.verified = true;
      await user.save();
      res.render("PasswordResetVerification");
    } catch (ex) {
      res.status(400).send({ error: "Invalide token" });
    }
  })
);

router.post(
  "/",
  asyncMiddleware(async (req, res) => {
    const { error } = validate(req.body);
    if (error) return res.status(400).send({ error: error.details[0].message });

    let user = await User.findOne({ email: req.body.email });
    if (!user)
      return res.status(400).send({ error: "Invalide email or password" });

    if (!user.password)
      return res.status(400).send({
        error: "This user does not have password. Please login in with google",
      });

    const validPassword = await bcrypt.compare(
      req.body.password,
      user.password
    );
    if (!validPassword)
      return res.status(400).send({ error: "Invalide email or password" });

    if (!user.verified) {
      sendVerificationEmail(user.email, user._id);
      return res.status(400).send({
        error:
          "Email is not verified. Please check your email to verify your account",
      });
    }

    const token = user.generateAuthToken();
    const refreshToken = user.generateRefreshToken();
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

router.post(
  "/newToken",
  asyncMiddleware(async (req, res) => {
    const refreshToken = req.header("refresh-token");
    if (!refreshToken)
      return res
        .status(401)
        .send({ error: "Access denied. No refresh token provided" });

    try {
      const decoded = jwt.verify(
        refreshToken,
        config.get("REPAIR_JWT_REFRESH_TOKEN_PRIVATE_KEY")
      );

      let user = await User.findById(decoded._id);
      if (!user)
        return res.status(400).send({ error: "Invalide email or password" });

      const token = user.generateAuthToken();
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
      res.status(400).send({ error: "Invalide token" });
    }
  })
);

function validate(user) {
  const schema = Joi.object({
    email: Joi.string().min(5).max(255).required().email(),
    password: Joi.string().min(5).max(255).required(),
  });

  return schema.validate(user);
}

function validateForgotPassword(user) {
  const schema = Joi.object({
    email: Joi.string().min(5).max(255).required().email(),
  });

  return schema.validate(user);
}

function validateResetPassword(user) {
  const schema = Joi.object({
    password: Joi.string().min(5).max(255).required(),
  });

  return schema.validate(user);
}

module.exports = router;
