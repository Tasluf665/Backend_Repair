const mongoose = require("mongoose");
const Joi = require("joi");
const jwt = require("jsonwebtoken");
const config = require("config");

// Define a Mongoose schema for the 'UserSchema' collection. Source: Mosh -> NodeJS course -> 7. CRUD  -> 5 - Schemas
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

// Create a Mongoose model for the 'UserAddress' collection using the 'addressSchema'. Source: Mosh -> NodeJS course -> 7. CRUD  -> 6- Models
const UserAddress = mongoose.model("UserAddress", userAddressSchema);

// Define a Mongoose schema for the 'notification' collection. Source: Mosh -> NodeJS course -> 7. CRUD  -> 5 - Schemas
const notificationSchema = new mongoose.Schema({
  statusDetails: {
    type: String,
    required: true,
    minlength: 1,
    maxlength: 255,
  },
  orderId: {
    //Source: Mosh -> NodeJS course -> 9. Mongoose -> 2- Referencing
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

// Create a Mongoose model for the 'Notification' collection using the 'addressSchema'. Source: Mosh -> NodeJS course -> 7. CRUD  -> 6- Models
const Notification = mongoose.model("Notification", notificationSchema);

// Define a Mongoose schema for the 'user' collection. Source: Mosh -> NodeJS course -> 7. CRUD  -> 5 - Schemas
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
    enum: ["Male", "Female", "Other"], //If we only want this 3 values.
  },
  birthday: {
    type: String,
    minlength: 1,
    maxlength: 30,
  },
  addressess: [userAddressSchema], //Source: Mosh -> NodeJS course -> 9. Mongoose -> 4 - Embedding Documents
  notifications: [notificationSchema], //Source: Mosh -> NodeJS course -> 9. Mongoose -> 4 - Embedding Documents
  defaultAddress: {
    //Source: Mosh -> NodeJS course -> 9. Mongoose -> 2- Referencing
    type: mongoose.Schema.Types.ObjectId,
  },
  orders: {
    //Source: Mosh -> NodeJS course -> 9. Mongoose -> 2- Referencing
    type: [mongoose.Schema.Types.ObjectId],
    ref: "Order",
  },
});

/**
 * Generate an authentication token for the user.
 *
 * @returns {string} - A JWT authentication token.
 * Source: Mosh -> NodeJS course -> 10. Authentication -> 9- Generating, 10- Storing Secrets, 11- Setting, 12- Encapsulating
 */
userSchema.methods.generateAuthToken = function () {
  const token = jwt.sign(
    { _id: this._id, isAdmin: this.isAdmin },
    config.get("jwtPrivateKey"),
    { expiresIn: config.get("JWT_EXPIRATION_TIME") }
  );
  return token;
};

/**
 * Generate a refresh token for the user.
 *
 * @returns {string} - A JWT refresh token.
 * Source: Mosh -> NodeJS course -> 10. Authentication -> 9- Generating, 10- Storing Secrets, 11- Setting, 12- Encapsulating
 */
userSchema.methods.generateRefreshToken = function () {
  const refreshToken = jwt.sign(
    { _id: this._id, isAdmin: this.isAdmin },
    config.get("REPAIR_JWT_REFRESH_TOKEN_PRIVATE_KEY"),
    { expiresIn: config.get("JWT_REFRESH_TOKEN_EXPIRATION_TIME") }
  );
  return refreshToken;
};

// Create a Mongoose model for the 'User' collection using the 'addressSchema'. Source: Mosh -> NodeJS course -> 7. CRUD  -> 6- Models
const User = mongoose.model("User", userSchema);

/**
 * Validate an 'user' object using Joi schema validation.
 *
 * @param {object} user - The user object to validate.
 * @returns {object} - A Joi validation result object.
 */
function validateUser(user) {
  const schema = Joi.object({
    //https://www.youtube.com/watch?v=u9kxYilQ9l8
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
