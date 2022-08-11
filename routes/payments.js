const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const { Order, Payment, Status } = require("../models/order");
const { Notification, User } = require("../models/user");
const fetch = require("node-fetch");
const asyncMiddleware = require("../middleware/async");

const { initPayment } = require("../controller/paymentController");

router.get("/:orderId", asyncMiddleware(initPayment));

router.post(
  "/paymentSuccess",
  asyncMiddleware(async (req, res) => {
    let response = await fetch(
      `https://sandbox.sslcommerz.com/validator/api/validationserverAPI.php?val_id=${req.body.val_id}&store_id=${process.env.SSLCOMMERZ_STORE_ID}&store_passwd=${process.env.SSLCOMMERZ_STORE_PASSWD}&format=json`
    );
    let result = await response.json();

    if (!result.status === "VALID")
      return res.status(400).send({ error: "Invalide transection" });

    let order = await Order.findById(result.value_a);
    if (!order) return res.status(400).send({ error: "Invalide Order ID" });

    let user = await User.findById(result.value_b);
    if (!user) return res.status(400).send({ error: "Invalide User ID" });

    const payment = new Payment({
      tran_id: result.tran_id,
      amount: result.amount,
      card_type: result.card_type,
      bank_tran_id: result.bank_tran_id,
      card_issuer: result.card_issuer,
      tran_date: result.tran_date,
    });
    order.payment.push(payment);

    const status = new Status({
      statusDetails: "Your payment has been complete",
      statusState: "Payment Complete",
    });
    order.status.push(status);

    const notification = new Notification({
      statusDetails: "Your payment has been complete",
      statusState: "Payment Complete",
      orderId: order._id,
    });
    user.notifications.push(notification);

    await order.save();
    await user.save();

    await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        to: user.expoPushToken,
        title: req.body.statusState,
        body: req.body.statusDetails,
      }),
    });

    res.render("PaymentSuccess");
  })
);

router.post("/paymentCancel", (req, res) => {
  res.render("PaymentCancel");
});

router.post("/paymentFail", (req, res) => {
  res.render("PaymentFail");
});

module.exports = router;
