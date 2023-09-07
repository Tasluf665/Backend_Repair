const express = require("express");
const router = express.Router();
const fetch = require("node-fetch");
const Joi = require("joi");
const _ = require("lodash");

const { Order, Status, validateOrder } = require("../models/order");
const { User, Notification } = require("../models/user");
const { Product } = require("../models/product");
const asyncMiddleware = require("../middleware/async");
const auth = require("../middleware/auth");
const admin = require("../middleware/admin");

/**
 * Route handler for fetching paginated orders.
 *
 * This route handles a GET request to retrieve a paginated list of orders, optionally filtered by name.
 *
 * @route GET /api/orders
 * @param {number} req.query.pageNumber - The page number for pagination (default: 1).
 * @param {number} req.query.pageSize - The number of orders to fetch per page (default: 10).
 * @param {string} req.query.name - (Optional) A search string to filter orders by name (case-insensitive).
 * @returns {object} - A JSON response containing the paginated orders, their count, and a success message.
 */
router.get(
  "/",
  [auth, admin],
  asyncMiddleware(async (req, res) => {
    // Extract query parameters for pagination, search, and filtering.
    const pageNumber = req.query.pageNumber ? req.query.pageNumber : 1;
    const pageSize = req.query.pageSize ? req.query.pageSize : 10;

    // Determine the search pattern for Orders (case-insensitive).
    //Source: Mosh -> NodeJS -> 7. CRUD -> 11- Regular.
    //if name = tas then search = /tas/i and name = "" then search = /.*/
    const search = req.query.name ? new RegExp(req.query.name, "i") : /.*/;

    // Count the total number of orders matching the search criteria.
    const count = await Order.find({ phone: search }).count();

    // Find all orders matching the search criteria.
    await Order.find({ phone: search }).exec(function (err, instances) {
      // Separate orders into pending and non-pending categories.
      const allPendingOrders = instances.filter(
        (item) => item.status[item.status.length - 1].statusState === "Pending"
      );

      const otherOrders = instances.filter(
        (item) => item.status[item.status.length - 1].statusState !== "Pending"
      );

      // Combine pending and non-pending orders, ensuring pending orders appear first.
      let sortedOrders = [...allPendingOrders, ...otherOrders];

      // Apply pagination to the sorted orders.
      //This filtering function will filter all the orders. Let say I have 27 orders in database. if pageNumber = 1 then sortedOrders.lenght = 27. if pageNumber = 2 then sortedOrders.lenght = 17. if pageNumber = 3 then sortedOrders.lenght = 7.
      sortedOrders = sortedOrders.filter((item, index) => {
        if (index > (pageNumber - 1) * pageSize - 1) {
          return true;
        }
      });

      //Then only take 10 orders. if pageNumber = 2 then sortedOrders.lenght = 17. But I have to select only 10 orders bcz pageSize let say 10.
      sortedOrders = sortedOrders.filter((item, index) => {
        if (index < pageSize) {
          return true;
        }
      });

      // Add an 'id' field to each order based on the current page and index.
      //This maping is used to solve the number problem in Admin panel after I filter data.
      //For example search "tas" will show 10 number order because that agent is store in the 10th place of the databse so to solve this I have reassign the id number start from 1 so that date will show serially.
      sortedOrders = sortedOrders.map((item, index) => {
        item._doc.id = (pageNumber - 1) * pageSize + index + 1;

        return item._doc;
      });

      // Send a success response with the paginated orders, their count, and a success message.
      res.status(200).send({
        success: "Orders are fetched successfully",
        data: sortedOrders,
        count,
      });
    });
  })
);

/**
 * Route handler for fetching the total profit from orders.
 *
 * This route handles a GET request to calculate and retrieve the total profit generated from all orders.
 *
 * @route GET /api/orders/totalProfit
 * @returns {object} - A JSON response containing the total profit and a success message.
 */
router.get(
  "/totalProfit",
  [auth, admin],
  asyncMiddleware(async (req, res) => {
    // Retrieve all orders from the database.
    const allOrders = await Order.find();

    // Initialize the totalProfit variable to 0.0.
    let totalProfit = 0.0;

    // Iterate through each order and its associated payments to calculate the total profit.
    allOrders.forEach((order) => {
      order.payment.forEach((payment) => {
        // Parse and add the payment amount to the total profit.
        totalProfit += parseFloat(payment.amount);
      });
    });

    // Send a success response with the total profit.
    res.status(200).send({
      success: "Total Profit is fetched successfully",
      totalProfit,
    });
  })
);

/**
 * GET endpoint to retrieve the count of orders booked within the last week.
 *
 * This route fetches the count of orders that were booked within the last 7 days.
 *
 * @route GET /api/orders/weeklySells
 * @middleware [auth, admin] - Requires authentication and admin privileges.
 * @returns {object} An object containing the count of orders booked within the last week.
 * @throws {401} If the request is not authenticated.
 * @throws {403} If the user doesn't have admin privileges.
 * @throws {500} If there's a server error while processing the request.
 */
router.get(
  "/weeklySells",
  [auth, admin],
  asyncMiddleware(async (req, res) => {
    const allOrder = await Order.find();

    let count = 0;

    allOrder.forEach((order) => {
      let orderTime = new Date(order.bookingTime).getTime();
      let before = new Date().getTime() - 518400000; // 7 days in milliseconds
      let now = new Date().getTime();

      if (orderTime > before && orderTime <= now) {
        count++;
      }
    });

    res.status(200).send({
      success: "Weekly Sells is fetched successfully",
      count,
    });
  })
);

/**
 * GET endpoint to retrieve the count of orders booked for each month in the current year.
 *
 * This route fetches the count of orders booked for each month in the current year.
 *
 * @route GET /api/orders/sellsInMonth
 * @middleware [auth, admin] - Requires authentication and admin privileges.
 * @returns {object} An object containing the count of orders booked for each month.
 * @throws {401} If the request is not authenticated.
 * @throws {403} If the user doesn't have admin privileges.
 * @throws {500} If there's a server error while processing the request.
 */
router.get(
  "/sellsInMonth",
  [auth, admin],
  asyncMiddleware(async (req, res) => {
    const allOrder = await Order.find();

    // Initialize an array to store the count of orders for each month (0-based index).
    let month = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

    allOrder.forEach((order) => {
      // Check if the order was booked in the current year.
      if (
        new Date(order.bookingTime).getFullYear() === new Date().getFullYear()
      ) {
        // Get the month index (0-11) of the order and increment the count for that month.
        let monthIndex = new Date(order.bookingTime).getMonth();
        month[monthIndex] += 1;
      }
    });

    res.status(200).send({
      success: "Sells in Month is fetched successfully",
      month,
    });
  })
);

/**
 * Route handler for fetching the count of pending orders.
 *
 * This route handles a GET request to calculate and retrieve the count of orders that are in a pending state.
 *
 * @route GET /api/orders/pendingOrder
 * @returns {object} - A JSON response containing the count of pending orders and a success message.
 */
router.get(
  "/pendingOrder",
  [auth, admin],
  asyncMiddleware(async (req, res) => {
    // Retrieve all orders from the database.
    const allOrders = await Order.find();

    // Initialize the count variable to 0.
    let count = 0;

    // Iterate through each order and check if its latest status is not "Payment Complete."
    allOrders.forEach((order) => {
      const latestStatus = order.status[order.status.length - 1].statusState;

      if (latestStatus !== "Payment Complete") {
        // Increment the count for pending orders.
        count++;
      }
    });

    // Send a success response with the count of pending orders.
    res.status(200).send({
      success: "Pending orders are fetched successfully",
      count,
    });
  })
);

/**
 * Route handler for fetching the count of orders categorized by type.
 *
 * This route handles a GET request to calculate and retrieve the count of orders categorized by their type.
 *
 * @route GET /api/orders/countOrderCategory
 * @returns {object} - A JSON response containing the count of orders categorized by type and a success message.
 */
router.get(
  "/countOrderCategory",
  [auth, admin],
  asyncMiddleware(async (req, res) => {
    // Retrieve all orders from the database.
    const allOrders = await Order.find();

    // Initialize counters for each order category type.
    let tv = 0;
    let fridge = 0;
    let ac = 0;
    let fan = 0;

    // Iterate through each order and categorize them based on their category type.
    allOrders.forEach((order) => {
      switch (order.categoryType) {
        case "youtube-tv":
          tv++;
          break;
        case "fridge":
          fridge++;
          break;
        case "air-filter":
          ac++;
          break;
        case "fan":
          fan++;
          break;
        // Add additional cases for other category types if needed.
      }
    });

    // Send a success response with the count of orders categorized by type.
    res.status(200).send({
      success: "Categorized orders count is fetched successfully",
      count: {
        tv,
        fridge,
        ac,
        fan,
      },
    });
  })
);

/**
 * Route handler for fetching an order by its ID.
 *
 * This route handles a GET request to retrieve an order by its unique identifier (ID).
 *
 * @route GET /api/orders/:id
 * @param {string} id - The unique identifier of the order to retrieve.
 * @returns {object} - A JSON response containing the order details and a success message.
 */
router.get(
  "/:id",
  auth,
  asyncMiddleware(async (req, res) => {
    // Retrieve the order by its unique ID.
    const order = await Order.findById(req.params.id);

    // If the order does not exist, return a 404 error.
    if (!order)
      return res
        .status(404)
        .send({ error: "The order with the given ID was not found" });

    // Find the associated product for the order's category.
    //As brand and model id is store in the order. brand: '62f32a00657316510269a960', model: '62f3479a6c264d3b95fcf138', So I have to find the actual names.
    const product = await Product.findOne({
      iconName: order.categoryType,
    });

    // Find the brand and model names for the order.
    const brand = product.brands.find(
      (item) => item._id.toString() === order.brand
    );
    order.brand = brand.brandName;

    const model = brand.models.find(
      (item) => item._id.toString() === order.model
    );
    order.model = model.modelName;

    // Send a success response with the order details.
    res.send({
      success: "Order is fetched successfully",
      data: order,
    });
  })
);

//Send a push notification using Expo's API.
async function sendPushNotification(user, statusState, statusDetails) {
  const pushData = {
    to: user.expoPushToken,
    title: statusState,
    body: statusDetails,
  };

  try {
    const response = await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(pushData),
    });

    // Check the response status and handle it as needed
    if (response.ok) {
      console.log("Push notification sent successfully.");
    } else {
      console.error("Failed to send push notification.");
    }
  } catch (error) {
    console.error(
      "An error occurred while sending the push notification:",
      error
    );
  }
}

/**
 * Route handler for creating a new order.
 *
 * This route handles a POST request to create a new order based on the provided data.
 *
 * @route POST /api/orders
 * @returns {object} - A JSON response containing the created order details and a success message.
 */
router.post(
  "/",
  auth,
  asyncMiddleware(async (req, res) => {
    // Validate the request body data using Joi schema.
    const { error } = validateOrder(req.body);

    // If validation fails, return a 400 Bad Request response with the error details.
    if (error) return res.status(400).send({ error: error.details[0].message });

    // Find the user associated with the authenticated request.
    let user = await User.findById(req.user._id);

    // If the user does not exist, return a 400 Bad Request response.
    if (!user) return res.status(400).send({ error: "Invalid User ID" });

    // Create a new order based on the provided request data.
    const order = new Order(
      _.pick(req.body, [
        "name",
        "phone",
        "address",
        "arrivalDate",
        "arrivalTime",
        "category",
        "categoryType",
        "brand",
        "model",
        "problem",
        "note",
      ])
    );

    // Set the userId field of the order to the authenticated user's ID.
    order.userId = req.user._id;

    // Create a new status and add it to the order's status array.
    const status = new Status({
      statusDetails: req.body.statusDetails,
      statusState: req.body.statusState,
    });
    order.status.push(status);

    // Create a new notification and add it to the user's notifications array.
    const notification = new Notification({
      statusDetails: req.body.statusDetails,
      statusState: req.body.statusState,
      orderId: order._id,
    });
    user.notifications.push(notification);

    // Add the order's ID to the user's orders array.
    user.orders.push(order._id);

    // Save the order, user, and send a push notification using Expo's API.
    await order.save();
    await user.save();

    await sendPushNotification(
      user,
      req.body.statusState,
      req.body.statusDetails
    );

    // Send a success response with the created order details.
    res.send({
      success: "Order is successfully added",
      data: order,
    });
  })
);

/**
 * Route handler for accepting an order.
 *
 * This route handles a PATCH request to accept an existing order identified by orderId.
 * It updates the order's status, sends notifications, and returns the updated order details.
 *
 * @route PATCH /api/orders/accept/:orderId
 * @param {string} orderId - The ID of the order to be accepted.
 * @returns {object} - A JSON response containing the updated order details and a success message.
 */
router.patch(
  "/accept/:orderId",
  [auth, admin],
  asyncMiddleware(async (req, res) => {
    // Validate the request body data using Joi schema.
    const { error } = validateOrderAccept(req.body);

    // If validation fails, return a 400 Bad Request response with the error details.
    if (error) return res.status(400).send({ error: error.details[0].message });

    // Find the order to be accepted based on the provided orderId.
    let order = await Order.findById(req.params.orderId);

    // If the order does not exist, return a 400 Bad Request response.
    if (!order) return res.status(400).send({ error: "Invalid Order ID" });

    // Find the user associated with the order.
    let user = await User.findById(order.userId);

    // If the user does not exist, return a 400 Bad Request response.
    if (!user) return res.status(400).send({ error: "Invalid User ID" });

    // Create a new status based on the request data and add it to the order's status array.
    const status = new Status({
      statusDetails: req.body.statusDetails,
      statusState: req.body.statusState,
    });
    order.status.push(status);

    // Create a new notification based on the request data and add it to the user's notifications array.
    const notification = new Notification({
      statusDetails: req.body.statusDetails,
      statusState: req.body.statusState,
      orderId: order._id,
    });
    user.notifications.push(notification);

    // Update the order's problem and note fields if provided in the request.
    order.problem = req.body.problem ? req.body.problem : order.problem;
    order.note = req.body.note ? req.body.note : order.note;

    // Save the updated order and user data.
    await order.save();
    await user.save();

    // Send a push notification to the user using Expo's API.
    await sendPushNotification(
      user,
      req.body.statusState,
      req.body.statusDetails
    );

    // Send a success response with the updated order details.
    res.send({
      success: "Order is Accepted",
      data: order,
    });
  })
);

/**
 * Route handler for assigning an order to an agent and technician.
 *
 * This route handles a PATCH request to assign an existing order identified by orderId
 * to a specific agent and technician. It updates the order's status, technicianId, sends notifications,
 * and returns the updated order details.
 *
 * @route PATCH /api/orders/assigned/:orderId
 * @param {string} orderId - The ID of the order to be assigned.
 * @returns {object} - A JSON response containing the updated order details and a success message.
 */
router.patch(
  "/assigned/:orderId",
  [auth, admin],
  asyncMiddleware(async (req, res) => {
    // Validate the request body data using Joi schema.
    const { error } = validateOrderAssigned(req.body);

    // If validation fails, return a 400 Bad Request response with the error details.
    if (error) return res.status(400).send({ error: error.details[0].message });

    // Find the order to be assigned based on the provided orderId.
    let order = await Order.findById(req.params.orderId);

    // If the order does not exist, return a 400 Bad Request response.
    if (!order) return res.status(400).send({ error: "Invalid Order ID" });

    // Find the user associated with the order.
    let user = await User.findById(order.userId);

    // If the user does not exist, return a 400 Bad Request response.
    if (!user) return res.status(400).send({ error: "Invalid User ID" });

    // Create a new status based on the request data and add it to the order's status array.
    const status = new Status({
      statusDetails: req.body.statusDetails,
      statusState: req.body.statusState,
    });
    order.status.push(status);

    // Create a new notification based on the request data and add it to the user's notifications array.
    const notification = new Notification({
      statusDetails: req.body.statusDetails,
      statusState: req.body.statusState,
      orderId: order._id,
    });
    user.notifications.push(notification);

    // Set the technicianId for the order based on the request data.
    order.technicianId = req.body.technicianId;

    // Save the updated order and user data.
    await order.save();
    await user.save();

    // Send a push notification to the user using Expo's API.
    await sendPushNotification(
      user,
      req.body.statusState,
      req.body.statusDetails
    );

    // Send a success response with the updated order details.
    res.send({
      success: "Agent and Technician are assigned to the order",
      data: order,
    });
  })
);

/**
 * Route handler for marking an order as repaired.
 *
 * This route handles a PATCH request to mark an existing order identified by orderId
 * as repaired. It updates the order's status, amount, sends notifications, and returns
 * the updated order details.
 *
 * @route PATCH /api/orders/repaired/:orderId
 * @param {string} orderId - The ID of the order to be marked as repaired.
 * @returns {object} - A JSON response containing the updated order details and a success message.
 */
router.patch(
  "/repaired/:orderId",
  [auth, admin],
  asyncMiddleware(async (req, res) => {
    // Validate the request body data using Joi schema.
    const { error } = validateOrderRepaired(req.body);

    // If validation fails, return a 400 Bad Request response with the error details.
    if (error) return res.status(400).send({ error: error.details[0].message });

    // Find the order to be marked as repaired based on the provided orderId.
    let order = await Order.findById(req.params.orderId);

    // If the order does not exist, return a 400 Bad Request response.
    if (!order) return res.status(400).send({ error: "Invalid Order ID" });

    // Find the user associated with the order.
    let user = await User.findById(order.userId);

    // If the user does not exist, return a 400 Bad Request response.
    if (!user) return res.status(400).send({ error: "Invalid User ID" });

    // Create a new status based on the request data and add it to the order's status array.
    const status = new Status({
      statusDetails: req.body.statusDetails,
      statusState: req.body.statusState,
    });
    order.status.push(status);

    // Create a new notification based on the request data and add it to the user's notifications array.
    const notification = new Notification({
      statusDetails: req.body.statusDetails,
      statusState: req.body.statusState,
      orderId: order._id,
    });
    user.notifications.push(notification);

    // Set the amount for the order based on the request data.
    order.amount = req.body.amount;

    // Save the updated order and user data.
    await order.save();
    await user.save();

    // Send a push notification to the user using Expo's API.
    await sendPushNotification(
      user,
      req.body.statusState,
      req.body.statusDetails
    );

    // Send a success response with the updated order details.
    res.send({
      success: "Order is marked as repaired",
      data: order,
    });
  })
);

/**
 * Validates the request body when accepting an order.
 *
 * @param {object} order - The request body to validate.
 * @returns {object} An object containing the validation result.
 * @throws {Joi.ValidationError} If the request data doesn't meet the specified constraints.
 */
function validateOrderAccept(order) {
  const schema = Joi.object({
    problem: Joi.string().min(1).max(1024),
    note: Joi.string().min(1).max(255),
    statusDetails: Joi.string().min(1).max(255).required(),
    statusState: Joi.string().min(1).max(50).required(),
  });

  return schema.validate(order);
}

/**
 * Validates the request body when assigning a technician to an order.
 *
 * @param {object} order - The request body to validate.
 * @returns {object} An object containing the validation result.
 * @throws {Joi.ValidationError} If the request data doesn't meet the specified constraints.
 */
function validateOrderAssigned(order) {
  const schema = Joi.object({
    technicianId: Joi.objectId().required(),
    statusDetails: Joi.string().min(1).max(255).required(),
    statusState: Joi.string().min(1).max(50).required(),
  });

  return schema.validate(order);
}

/**
 * Validates the request body when marking an order as repaired.
 *
 * @param {object} order - The request body to validate.
 * @returns {object} An object containing the validation result.
 * @throws {Joi.ValidationError} If the request data doesn't meet the specified constraints.
 */
function validateOrderRepaired(order) {
  const schema = Joi.object({
    amount: Joi.number().min(0).required(),
    statusDetails: Joi.string().min(1).max(255).required(),
    statusState: Joi.string().min(1).max(50).required(),
  });

  return schema.validate(order);
}

module.exports = router;
