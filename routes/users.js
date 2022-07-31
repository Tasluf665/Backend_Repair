const express = require("express");
const router = express.Router();
const _ = require("lodash");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const config = require("config");
const Joi = require("joi");
const axios = require("axios");

const { User, validateUser, UserAddress } = require("../models/user");
const auth = require("../middleware/auth");
const asyncMiddleware = require("../middleware/async");
const { sendVerificationEmail } = require("../utils/SendEmail");

router.get(
  "/me",
  auth,
  asyncMiddleware(async (req, res) => {
    const user = await User.findById(req.user._id).select({
      password: 0,
      __v: 0,
      isAdmin: 0,
      verified: 0,
      googleId: 0,
    });
    res.send(user);
  })
);

router.post(
  "/userAddress",
  auth,
  asyncMiddleware(async (req, res) => {
    const { error } = validateUserAddress(req.body);
    if (error) return res.status(400).send({ error: error.details[0].message });

    let user = await User.findById(req.user._id);
    if (!user) return res.status(400).send({ error: "Invalide Id" });

    const address = new UserAddress(
      _.pick(req.body, [
        "address",
        "area",
        "city",
        "name",
        "phone",
        "region",
        "office",
      ])
    );

    user.addressess.push(address);
    if (user.addressess.length === 1) {
      user.defaultAddress = address._id;
    }

    if (req.body.defaultAddress) user.defaultAddress = address._id;

    await user.save();

    res.send({
      success: "Address is added",
      defaultAddress: user.defaultAddress,
      addressess: user.addressess,
    });
  })
);

router.patch(
  "/userAddress/:addressId",
  auth,
  asyncMiddleware(async (req, res) => {
    const { error } = validateUserAddress(req.body);
    if (error) return res.status(400).send({ error: error.details[0].message });

    let user = await User.findById(req.user._id);
    if (!user) return res.status(400).send({ error: "Invalide Id" });

    let address = await user.addressess.id(req.params.addressId);
    if (!address) return res.status(400).send({ error: "Address not found" });

    address.set(
      _.pick(req.body, [
        "address",
        "area",
        "city",
        "name",
        "phone",
        "region",
        "office",
      ])
    );

    if (req.body.defaultAddress) user.defaultAddress = address._id;
    await user.save();

    res.send({
      success: "Address is updated",
      defaultAddress: user.defaultAddress,
      addressess: user.addressess,
    });
  })
);

router.delete(
  "/userAddress/:addressId",
  auth,
  asyncMiddleware(async (req, res) => {
    let user = await User.findById(req.user._id);
    if (!user) return res.status(400).send({ error: "Invalide Id" });

    let address = await user.addressess.id(req.params.addressId);
    if (!address) return res.status(400).send({ error: "Address not found" });

    address.remove();

    await user.save();

    res.send({
      success: "Address is deleted",
      defaultAddress: user.defaultAddress,
      addressess: user.addressess,
    });
  })
);

router.patch(
  "/update",
  auth,
  asyncMiddleware(async (req, res) => {
    const { error } = validateUserUpdate(req.body);
    if (error) return res.status(400).send({ error: error.details[0].message });

    let user = await User.findById(req.user._id).select("-password");
    if (!user) return res.status(400).send({ error: "User not found" });

    if (req.body.name) {
      user.name = req.body.name;
    }
    if (req.body.phone) {
      user.phone = req.body.phone;
    }
    if (req.body.gender) {
      user.gender = req.body.gender;
    }
    if (req.body.birthday) {
      user.birthday = req.body.birthday;
    }

    await user.save();
    res.send({
      success: "User is updated successfully",
    });
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

router.post(
  "/google",
  asyncMiddleware(async (req, res) => {
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
  })
);

function validateGoogleUser(user) {
  const schema = Joi.object({
    email: Joi.string().min(1).max(255).required().email(),
    name: Joi.string().min(1).max(255).required(),
    googleId: Joi.string().min(5).max(255).required(),
    accessToken: Joi.string().min(5).max(255).required(),
  });

  return schema.validate(user);
}

function validateUserUpdate(user) {
  const schema = Joi.object({
    name: Joi.string().min(1).max(255),
    phone: Joi.string().min(1).max(255),
    gender: Joi.string().min(1).max(255),
    birthday: Joi.string().min(1).max(30),
  });

  return schema.validate(user);
}

function validateUserAddress(user) {
  const schema = Joi.object({
    address: Joi.string().min(1).max(255).required(),
    area: Joi.string().min(1).max(255).required(),
    city: Joi.string().min(1).max(255).required(),
    name: Joi.string().min(1).max(255).required(),
    phone: Joi.string().min(1).max(255).required(),
    region: Joi.string().min(1).max(255).required(),
    office: Joi.boolean().required(),
    defaultAddress: Joi.boolean(),
  });

  return schema.validate(user);
}

module.exports = router;
