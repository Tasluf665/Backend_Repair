const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const { Order, Payment, Status } = require("../models/order");
const { Notification, User } = require("../models/user");
const fetch = require("node-fetch");
const asyncMiddleware = require("../middleware/async");
const config = require("config");

const { initPayment } = require("../controller/paymentController");
const {
  sendPushNotification,
} = require("../controller/notificationController");

// Define a route for handling GET requests with an order ID parameter
//Source: Bohubrihi NodeJs -> 8. Project - E-Commerce Site with Payment Gateway (SSLCommerz) -> 8. Payment Gateway (SSLCommerz)
router.get("/:orderId", auth, asyncMiddleware(initPayment));

// Define a route for handling POST requests when a payment is successful
//Source: Bohubrihi NodeJs -> 8. Project - E-Commerce Site with Payment Gateway (SSLCommerz) -> 8. Payment Gateway (SSLCommerz)
router.post(
  "/paymentSuccess",
  // Use an asynchronous middleware to handle the request
  asyncMiddleware(async (req, res) => {
    // Send a request to the SSLCommerz validator API to validate the transaction
    let response = await fetch(
      `https://sandbox.sslcommerz.com/validator/api/validationserverAPI.php?val_id=${
        req.body.val_id
      }&store_id=${config.get("SSLCOMMERZ_STORE_ID")}&store_passwd=${config.get(
        "SSLCOMMERZ_STORE_PASSWD"
      )}&format=json`
    );
    // Parse the response JSON data
    let result = await response.json();

    // If the transaction status is not "VALID," return a 400 Bad Request error
    if (!result.status === "VALID")
      return res.status(400).send({ error: "Invalide transection" });

    // Find the order by its ID from the validation result
    let order = await Order.findById(result.value_a);
    // If no order is found, return a 400 Bad Request error
    if (!order) return res.status(400).send({ error: "Invalide Order ID" });

    // Find the user by their ID from the validation result
    let user = await User.findById(result.value_b);
    // If no user is found, return a 400 Bad Request error
    if (!user) return res.status(400).send({ error: "Invalide User ID" });

    // Create a new payment record based on the validation result
    const payment = new Payment({
      tran_id: result.tran_id,
      amount: result.amount,
      card_type: result.card_type,
      bank_tran_id: result.bank_tran_id,
      card_issuer: result.card_issuer,
      tran_date: result.tran_date,
    });

    // Add the payment record to the order's payment history
    order.payment.push(payment);

    // Create a new status record indicating payment completion
    const status = new Status({
      statusDetails: "Your payment has been completed",
      statusState: "Payment Complete",
    });

    // Add the status record to the order's status history
    order.status.push(status);

    // Create a notification for the user about the payment completion
    const notification = new Notification({
      statusDetails: "Your payment has been completed",
      statusState: "Payment Complete",
      orderId: order._id,
    });

    // Add the notification to the user's notification list
    user.notifications.push(notification);

    // Save the updated order and user records
    await order.save();
    await user.save();

    // Send a push notification to the user about the payment completion
    await sendPushNotification(
      user,
      req.body.statusState,
      req.body.statusDetails
    );

    // Render a "PaymentSuccess" view
    res.render("PaymentSuccess");
  })
);

// Define a route for handling POST requests when a payment is canceled
router.post("/paymentCancel", (req, res) => {
  // Render a "PaymentCancel" view to inform the user about the payment cancellation
  res.render("PaymentCancel");
});

// Define a route for handling POST requests when a payment fails
router.post("/paymentFail", (req, res) => {
  // Render a "PaymentFail" view to inform the user about the payment failure
  res.render("PaymentFail");
});

module.exports = router;
