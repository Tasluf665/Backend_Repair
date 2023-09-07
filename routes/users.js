const express = require("express");
const router = express.Router();
const _ = require("lodash");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const config = require("config");
const Joi = require("joi");
const axios = require("axios");

const { User, validateUser, UserAddress } = require("../models/user");
const { Order } = require("../models/order");
const auth = require("../middleware/auth");
const admin = require("../middleware/admin");
const asyncMiddleware = require("../middleware/async");
const { sendVerificationEmail } = require("../utils/SendEmail");

//For UserInfo
// Define a route for handling GET requests to "/me"
router.get(
  "/me",
  // Use the "auth" middleware to authenticate the request
  auth,
  // Use an asynchronous middleware to handle the request
  asyncMiddleware(async (req, res) => {
    // Find the user by their user ID, excluding certain fields (password, __v, isAdmin, verified, googleId, orders)
    const user = await User.findById(req.user._id).select({
      password: 0,
      __v: 0,
      isAdmin: 0,
      verified: 0,
      googleId: 0,
      orders: 0,
    });

    // Send a success response with the user's information (excluding sensitive fields)
    res.send({
      success: "User Info is fetched successfully",
      data: user,
    });
  })
);

// Define a route for handling PATCH requests to "/update"
router.patch(
  "/update",
  // Use the "auth" middleware to authenticate the request
  auth,
  // Use an asynchronous middleware to handle the request
  asyncMiddleware(async (req, res) => {
    // Validate the request body using the "validateUserUpdate" function
    const { error } = validateUserUpdate(req.body);

    // If validation fails, return a 400 Bad Request error response with the validation error message
    if (error) return res.status(400).send({ error: error.details[0].message });

    // Find the user by their user ID, excluding the password field
    let user = await User.findById(req.user._id).select("-password");

    // If no user is found, return a 400 Bad Request error response
    if (!user) return res.status(400).send({ error: "User not found" });

    // Update user properties if they are provided in the request body
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

    // Save the updated user to the database
    await user.save();

    // Send a success response to indicate that the user has been updated
    res.send({
      success: "User is updated successfully",
    });
  })
);

//-----------------------------------------------------------------------------------------------------

//For Notifications
// Define a route for handling GET requests to "/notifications"
router.get(
  "/notifications",
  // Use the "auth" middleware to authenticate the request
  auth,
  // Use an asynchronous middleware to handle the request
  asyncMiddleware(async (req, res) => {
    // Find the user by their user ID
    let user = await User.findById(req.user._id);

    // If no user is found, return a 400 Bad Request error response
    if (!user) return res.status(400).send({ error: "Invalid Id" });

    // Send a success response with the fetched notifications from the user's document
    res.send({
      success: "Notifications are fetched successfully",
      data: user.notifications,
    });
  })
);

//-----------------------------------------------------------------------------------------------------

//For User Order
// Define a route for handling GET requests to "/orders"
router.get(
  "/orders",
  // Use the "auth" middleware to authenticate the request
  auth,
  // Use an asynchronous middleware to handle the request
  asyncMiddleware(async (req, res) => {
    // Find the user by their user ID
    let user = await User.findById(req.user._id);

    // If no user is found, return a 400 Bad Request error response
    if (!user) return res.status(400).send({ error: "Invalid Id" });

    // Find orders that have IDs matching those in the user's "orders" array
    let orders = await Order.find({
      _id: { $in: user.orders },
    });

    // Send a success response with the fetched orders
    res.send({ success: "Orders are fetched successfully", data: orders });
  })
);

// Define a route for handling GET requests to "/orders/:orderId"
router.get(
  "/orders/:orderId",
  // Use the "auth" middleware to authenticate the request
  auth,
  // Use an asynchronous middleware to handle the request
  asyncMiddleware(async (req, res) => {
    // Find the user by their user ID
    let user = await User.findById(req.user._id);

    // If no user is found, return a 400 Bad Request error response
    if (!user) return res.status(400).send({ error: "Invalid Id" });

    // Check if the provided orderId exists in the user's "orders" array
    let isValidOrderId = user.orders.includes(req.params.orderId);

    // If the orderId is not valid for the user, return a 400 Bad Request error response
    if (!isValidOrderId)
      return res.status(400).send({ error: "Invalid Order Id" });

    // Find the order by its ID
    let order = await Order.findById(req.params.orderId);

    // Send a success response with the fetched order
    res.send({ success: "Order is fetched successfully", data: order });
  })
);
//-----------------------------------------------------------------------------------------------------

//For User Address
// Define a route for handling POST requests to "/userAddress"
router.post(
  "/userAddress",
  // Use the "auth" middleware to authenticate the request
  auth,
  // Use an asynchronous middleware to handle the request
  asyncMiddleware(async (req, res) => {
    // Validate the request body using the "validateUserAddress" function
    const { error } = validateUserAddress(req.body);

    // If validation fails, return a 400 Bad Request error response with the validation error message
    if (error) return res.status(400).send({ error: error.details[0].message });

    // Find the user by their user ID
    let user = await User.findById(req.user._id);

    // If no user is found, return a 400 Bad Request error response
    if (!user) return res.status(400).send({ error: "Invalid Id" });

    // Create a new "UserAddress" instance with data from the request body
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

    // Push the new address to the user's "addresses" array
    user.addressess.push(address);

    // If it's the first address added, set it as the default address
    if (user.addressess.length === 1) {
      user.defaultAddress = address._id;
    }

    // Set the default address based on the request body
    if (req.body.defaultAddress) user.defaultAddress = address._id;

    // Save the updated user with the new address to the database
    await user.save();

    // Send a success response with the added address information and default address ID
    res.send({
      success: "Address is added successfully",
      defaultAddress: user.defaultAddress,
      data: user.addressess,
    });
  })
);

// Define a route for handling PATCH requests to "/userAddress/:addressId"
router.patch(
  "/userAddress/:addressId",
  // Use the "auth" middleware to authenticate the request
  auth,
  // Use an asynchronous middleware to handle the request
  asyncMiddleware(async (req, res) => {
    // Validate the request body using the "validateUserAddress" function
    const { error } = validateUserAddress(req.body);

    // If validation fails, return a 400 Bad Request error response with the validation error message
    if (error) return res.status(400).send({ error: error.details[0].message });

    // Find the user by their user ID
    let user = await User.findById(req.user._id);

    // If no user is found, return a 400 Bad Request error response
    if (!user) return res.status(400).send({ error: "Invalid Id" });

    // Find the address by its ID within the user's "addresses" array
    let address = await user.addressess.id(req.params.addressId);

    // If no address is found, return a 400 Bad Request error response
    if (!address) return res.status(400).send({ error: "Address not found" });

    // Update the address with data from the request body
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

    // Set the default address based on the request body
    if (req.body.defaultAddress) user.defaultAddress = address._id;

    // Save the updated user to the database
    await user.save();

    // Send a success response with the updated address information and default address ID
    res.send({
      success: "Address is updated successfully",
      defaultAddress: user.defaultAddress,
      data: user.addressess,
    });
  })
);

// Define a route for handling DELETE requests to "/userAddress/:addressId"
router.delete(
  "/userAddress/:addressId",
  // Use the "auth" middleware to authenticate the request
  auth,
  // Use an asynchronous middleware to handle the request
  asyncMiddleware(async (req, res) => {
    // Find the user by their user ID
    let user = await User.findById(req.user._id);

    // If no user is found, return a 400 Bad Request error response
    if (!user) return res.status(400).send({ error: "Invalid Id" });

    // Find the address by its ID within the user's "addresses" array
    let address = await user.addressess.id(req.params.addressId);

    // If no address is found, return a 400 Bad Request error response
    if (!address) return res.status(400).send({ error: "Address not found" });

    // Remove the address from the user's "addresses" array
    address.remove();

    // Save the updated user to the database
    await user.save();

    // Send a success response with the deleted address information, default address ID, and remaining addresses
    res.send({
      success: "Address is deleted successfully",
      defaultAddress: user.defaultAddress,
      data: user.addressess,
    });
  })
);

//-----------------------------------------------------------------------------------------------------

//For Authentication
// Define a route for handling POST requests to create a new user
router.post("/", async (req, res) => {
  // Validate the request body using the "validateUser" function
  const { error } = validateUser(req.body);

  // If validation fails, return a 400 Bad Request error response with the validation error message
  if (error) return res.status(400).send({ error: error.details[0].message });

  // Check if a user with the provided email already exists in the database
  let user = await User.findOne({ email: req.body.email });

  // If a user with the same email exists, return a 400 Bad Request error response
  if (user) return res.status(400).send({ error: "User already registered" });

  // Create a new "User" instance with data from the request body (excluding expoPushToken)
  user = new User(
    _.pick(req.body, ["name", "email", "password", "expoPushToken"])
  );

  // Generate a salt and hash the user's password for secure storage
  const salt = await bcrypt.genSalt(10);
  user.password = await bcrypt.hash(user.password, salt);

  // Save the new user to the database
  await user.save();

  // Send a verification email to the user's email address and include a verification link
  sendVerificationEmail(user.email, user._id);

  // Send a success response to instruct the user to check their email for verification
  res.send({
    success: "Please check your email to verify your account",
  });
});

// Define a route for handling GET requests to "/authentication/:token"
router.get(
  "/authentication/:token",
  // Use an asynchronous middleware to handle the request
  asyncMiddleware(async (req, res) => {
    // Extract the "token" parameter from the request URL
    const { token } = req.params;

    // Check if a token is provided in the request
    if (!token)
      return res
        .status(401)
        .send({ error: "Access denied. No token provided" });

    try {
      // Verify the authenticity of the token using the private key from the configuration
      const decoded = jwt.verify(token, config.get("jwtPrivateKey"));

      // Find the user by their user ID from the decoded token
      const user = await User.findById(decoded._id);

      // Set the "verified" field of the user to true to mark them as verified
      user.verified = true;

      // Save the updated user document in the database
      user.save();

      // Render a view/template called "EmailVerification" to inform the user of successful verification
      res.render("EmailVerification");
    } catch (ex) {
      // If the token is invalid or has expired, return a 400 Bad Request error response
      res.status(400).send({ error: "Invalid token" });
    }
  })
);

// Define a route for handling POST requests to authenticate users via Google OAuth
router.post("/google", async (req, res) => {
  // Validate the request body using the "validateGoogleUser" function
  const { error } = validateGoogleUser(req.body);

  // If validation fails, return a 400 Bad Request error response with the validation error message
  if (error) return res.status(400).send({ error: error.details[0].message });

  // Make a request to Google's tokeninfo endpoint to verify the access token
  const result = await axios.get(
    `https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=${req.body.accessToken}`
  );

  // If an error is present in the result, return a 401 Unauthorized error response
  if (result.error)
    return res.status(401).send({ error: "Unauthorized Google auth token" });

  // Check if the email from the result matches the email in the request body
  if (result.data.email !== req.body.email)
    return res.status(401).send({ error: "Unauthorized Google auth token" });

  // Check if the "issued_to" field of the result matches valid Google client IDs from the configuration
  if (
    result.data.issued_to !== config.get("REACT_NATIVE_APP_GOOGLE_CLIENT_ID") &&
    result.data.issued_to !==
      config.get("REACT_NATIVE_APP_GOOGLE_STANDAL_ONE_CLIENT_ID") &&
    result.data.issued_to !== config.get("REACT_APP_GOOGLE_CLIENT_ID")
  )
    return res.status(401).send({ error: "Unauthorized Google auth token" });

  // Find a user with the provided email in the database
  let user = await User.findOne({ email: req.body.email });

  // If no user is found, create a new user with data from the request body and mark them as verified
  if (!user) {
    user = new User(
      _.pick(req.body, ["name", "email", "googleId", "expoPushToken"])
    );
    user.verified = true;
    await user.save();
  }

  // If the user doesn't have a Google ID, set it from the request body and save the user
  if (!user.googleId) {
    user.googleId = req.body.googleId;
    await user.save();
  }

  // Generate an authentication token and a refresh token for the user
  const token = user.generateAuthToken();
  const refreshToken = user.generateRefreshToken();

  // Send a success response with user information, authentication token, and refresh token
  res.send({
    success: "Google Login Successfully",
    data: {
      _id: user._id,
      name: user.name,
      email: user.email,
      token: token,
      refreshToken: refreshToken,
    },
  });
});

//For user Number
// Define a route for handling GET requests to fetch the total number of verified non-admin users
router.get(
  "/userNumber",
  // Use the "auth" and "admin" middlewares to authenticate and authorize the request
  [auth, admin],
  // Use an asynchronous middleware to handle the request
  asyncMiddleware(async (req, res) => {
    // Find all users in the database
    const allUsers = await User.find();

    // Initialize a variable to count the verified non-admin users
    let count = 0;

    // Iterate through all users and count those who are verified and not admin
    allUsers.forEach((user) => {
      if (!user.isAdmin && user.verified) {
        count++;
      }
    });

    // Send a 200 OK response with the count of verified non-admin users
    res.status(200).send({
      success: "Total user count is fetched successfully",
      count,
    });
  })
);

function validateGoogleUser(user) {
  const schema = Joi.object({
    email: Joi.string().min(1).max(255).required().email(),
    name: Joi.string().min(1).max(255).required(),
    expoPushToken: Joi.string().min(1).max(255),
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
