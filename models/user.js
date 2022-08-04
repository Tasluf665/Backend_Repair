const mongoose = require("mongoose");
const Joi = require("joi");
const jwt = require("jsonwebtoken");
const config = require("config");

const userAddressSchema = new mongoose.Schema({
  address: {
    type: String,
    required: true,
    minlength: 1,
    maxlength: 255,
  },
  area: {
    type: String,
    required: true,
    minlength: 1,
    maxlength: 255,
  },
  city: {
    type: String,
    required: true,
    minlength: 1,
    maxlength: 255,
  },
  name: {
    type: String,
    required: true,
    minlength: 1,
    maxlength: 255,
  },
  phone: {
    type: String,
    required: true,
    minlength: 1,
    maxlength: 255,
  },
  region: {
    type: String,
    required: true,
    minlength: 1,
    maxlength: 255,
  },
  office: {
    type: Boolean,
    required: true,
    default: false,
  },
});

const UserAddress = mongoose.model("UserAddress", userAddressSchema);

const notificationSchema = new mongoose.Schema({
  statusDetails: {
    type: String,
    required: true,
    minlength: 1,
    maxlength: 255,
  },
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Order",
  },
  statusState: {
    type: String,
    required: true,
    minlength: 1,
    maxlength: 50,
  },
  time: {
    type: Date,
    required: true,
    default: Date.now,
  },
});

const Notification = mongoose.model("Notification", notificationSchema);

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    minlength: 1,
    maxlength: 255,
  },
  email: {
    type: String,
    required: true,
    minlength: 1,
    maxlength: 255,
    unique: true,
  },
  expoPushToken: {
    type: String,
    minlength: 1,
    maxlength: 255,
    unique: true,
  },
  password: {
    type: String,
    minlength: 5,
    maxlength: 1024,
  },
  isAdmin: {
    type: Boolean,
    default: false,
    required: true,
  },
  verified: {
    type: Boolean,
    default: false,
    required: true,
  },
  googleId: {
    type: String,
    minlength: 5,
    maxlength: 30,
  },
  phone: {
    type: String,
    minlength: 1,
    maxlength: 20,
  },
  gender: {
    type: String,
    enum: ["Male", "Female", "Other"],
  },
  birthday: {
    type: String,
    minlength: 1,
    maxlength: 30,
  },
  addressess: [userAddressSchema],
  notifications: [notificationSchema],
  defaultAddress: {
    type: mongoose.Schema.Types.ObjectId,
  },
  orders: {
    type: [mongoose.Schema.Types.ObjectId],
    ref: "Order",
  },
});

userSchema.methods.generateAuthToken = function () {
  const token = jwt.sign(
    { _id: this._id, isAdmin: this.isAdmin },
    config.get("jwtPrivateKey")
  );
  return token;
};

const User = mongoose.model("User", userSchema);

function validateUser(user) {
  const schema = Joi.object({
    name: Joi.string().min(1).max(255).required(),
    expoPushToken: Joi.string().min(1).max(255),
    email: Joi.string().min(1).max(255).required().email(),
    password: Joi.string().min(5).max(255),
    googleId: Joi.string().min(5).max(30),
  });

  return schema.validate(user);
}

exports.User = User;
exports.validateUser = validateUser;
exports.UserAddress = UserAddress;
exports.Notification = Notification;
