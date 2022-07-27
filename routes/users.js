const express = require("express");
const router = express.Router();
const _ = require("lodash");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const config = require("config");
const Joi = require("joi");
const axios = require("axios");

const { User, validateUser } = require("../models/user");
const auth = require("../middleware/auth");
const asyncMiddleware = require("../middleware/async");
const { sendVerificationEmail } = require("../utils/SendEmail");

router.get(
  "/me",
  auth,
  asyncMiddleware(async (req, res) => {
    const user = await User.findById(req.user._id).select("-password");
    res.send(user);
  })
);

router.post(
  "/",
  asyncMiddleware(async (req, res) => {
    const { error } = validateUser(req.body);
    if (error) return res.status(400).send({ error: error.details[0].message });

    let user = await User.findOne({ email: req.body.email });
    if (user) return res.status(400).send({ error: "User already registered" });

    user = new User(_.pick(req.body, ["name", "email", "password"]));
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(user.password, salt);

    await user.save();
    sendVerificationEmail(user.email, user._id);

    res.send({
      message: "Please check your email to verify your accont",
    });
  })
);

router.get(
  "/authentication/:token",
  asyncMiddleware(async (req, res) => {
    const { token } = req.params;
    if (!token)
      return res
        .status(401)
        .send({ error: "Access denied. No token provided" });
    try {
      const decoded = jwt.verify(token, config.get("jwtPrivateKey"));
      const user = await User.findById(decoded._id);
      console.log(user);
      user.verified = true;
      user.save();
      res.render("EmailVerification");
    } catch (ex) {
      res.status(400).send({ error: "Invalide token" });
    }
  })
);

router.post("/google", async (req, res) => {
  const { error } = validateGoogleUser(req.body);
  if (error) return res.status(400).send({ error: error.details[0].message });

  const result = await axios.get(
    `https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=${req.body.accessToken}`
  );

  if (result.error)
    return res.status(401).send({ error: "Unauthorized google auth token" });

  if (result.data.email !== req.body.email)
    return res.status(401).send({ error: "Unauthorized google auth token" });

  if (
    result.data.issued_to !== process.env.REACT_NATIVE_APP_GOOGLE_CLIENT_ID &&
    result.data.issued_to !== process.env.REACT_APP_GOOGLE_CLIENT_ID
  )
    return res.status(401).send({ error: "Unauthorized google auth token" });

  let user = await User.findOne({ email: req.body.email });

  if (!user) {
    user = new User(_.pick(req.body, ["name", "email", "googleId"]));
    user.verified = true;
    await user.save();
  }

  if (!user.googleId) {
    user.googleId = req.body.googleId;
    await user.save();
  }

  const token = user.generateAuthToken();
  res.send({
    _id: user._id,
    name: user.name,
    email: user.email,
    token: token,
  });
});

function validateGoogleUser(user) {
  const schema = Joi.object({
    email: Joi.string().min(5).max(255).required().email(),
    name: Joi.string().min(5).max(255).required(),
    googleId: Joi.string().min(5).max(255).required(),
    accessToken: Joi.string().min(5).max(255).required(),
  });

  return schema.validate(user);
}

module.exports = router;
