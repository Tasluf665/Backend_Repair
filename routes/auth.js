const express = require("express");
const router = express.Router();
const { User } = require("../models/user");
const bcrypt = require("bcrypt");
const Joi = require("joi");
const asyncMiddleware = require("../middleware/async");
const { sendVerificationEmail } = require("../utils/SendEmail");

router.post(
  "/",
  asyncMiddleware(async (req, res) => {
    const { error } = validate(req.body);
    if (error) return res.status(400).send({ error: error.details[0].message });

    let user = await User.findOne({ email: req.body.email });
    if (!user)
      return res.status(400).send({ error: "Invalide email or password" });

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
    res.send({
      _id: user._id,
      name: user.name,
      email: user.email,
      token: token,
    });
  })
);

function validate(user) {
  const schema = Joi.object({
    email: Joi.string().min(5).max(255).required().email(),
    password: Joi.string().min(5).max(255).required(),
  });

  return schema.validate(user);
}

module.exports = router;
