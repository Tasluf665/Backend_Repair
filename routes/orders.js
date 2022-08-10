const express = require("express");
const router = express.Router();
const { Order, Status, validateOrder } = require("../models/order");
const { User, Notification } = require("../models/user");
const { Product, Brand } = require("../models/product");
const asyncMiddleware = require("../middleware/async");
const auth = require("../middleware/auth");
const _ = require("lodash");
const Joi = require("joi");
const fetch = require("node-fetch");
const mongoose = require("mongoose");

router.get("/", async (req, res) => {
  const pageNumber = req.query.pageNumber ? req.query.pageNumber : 1;
  const pageSize = req.query.pageSize ? req.query.pageSize : 10;
  const search = req.query.name ? new RegExp(req.query.name, "i") : /.*/;

  const count = await Order.find({ phone: search }).count();

  await Order.find({ phone: search }).exec(function (err, instances) {
    const allPendingOrders = instances.filter(
      (item) => item.status[item.status.length - 1].statusState === "Pending"
    );

    const otherOrders = instances.filter(
      (item) => item.status[item.status.length - 1].statusState !== "Pending"
    );
    let sortedOrders = [...allPendingOrders, ...otherOrders];

    sortedOrders = sortedOrders.filter((item, index) => {
      if (index > (pageNumber - 1) * pageSize - 1) {
        return true;
      }
    });

    sortedOrders = sortedOrders.filter((item, index) => {
      if (index < pageSize) {
        return true;
      }
    });

    sortedOrders = sortedOrders.map((item, index) => {
      item._doc.id = (pageNumber - 1) * pageSize + index + 1;

      return item._doc;
    });

    res.status(200).send({ data: sortedOrders, count });
  });
});

router.post(
  "/",
  auth,
  asyncMiddleware(async (req, res) => {
    const { error } = validateOrder(req.body);
    if (error) return res.status(400).send(error.details[0].message);

    let user = await User.findById(req.user._id);
    if (!user) return res.status(400).send({ error: "Invalide Id" });

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
    order.userId = req.user._id;

    const status = new Status({
      statusDetails: req.body.statusDetails,
      statusState: req.body.statusState,
    });
    order.status.push(status);

    const notification = new Notification({
      statusDetails: req.body.statusDetails,
      statusState: req.body.statusState,
      orderId: order._id,
    });
    user.notifications.push(notification);

    user.orders.push(order._id);

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

    res.send({
      success: "Order is successfully added",
      order,
    });
  })
);

router.patch(
  "/accept/:orderId",
  auth,
  asyncMiddleware(async (req, res) => {
    const { error } = validateOrderAccept(req.body);
    if (error) return res.status(400).send(error.details[0].message);

    let order = await Order.findById(req.params.orderId);
    if (!order) return res.status(400).send({ error: "Invalide Order ID" });

    let user = await User.findById(order.userId);
    if (!user) return res.status(400).send({ error: "Invalide Id" });

    const status = new Status({
      statusDetails: req.body.statusDetails,
      statusState: req.body.statusState,
    });
    order.status.push(status);

    const notification = new Notification({
      statusDetails: req.body.statusDetails,
      statusState: req.body.statusState,
      orderId: order._id,
    });
    user.notifications.push(notification);

    order.problem = req.body.problem ? req.body.problem : order.problem;
    order.note = req.body.note ? req.body.note : order.note;

    await order.save();
    await user.save();

    await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        to: user.expoPushToken,
        title: status.statusState,
        body: status.statusDetails,
      }),
    });

    res.send(order);
  })
);

router.patch(
  "/assigned/:orderId",
  auth,
  asyncMiddleware(async (req, res) => {
    const { error } = validateOrderAssigned(req.body);
    if (error) return res.status(400).send(error.details[0].message);

    let order = await Order.findById(req.params.orderId);
    if (!order) return res.status(400).send({ error: "Invalide Order ID" });

    let user = await User.findById(order.userId);
    if (!user) return res.status(400).send({ error: "Invalide Id" });

    const status = new Status({
      statusDetails: req.body.statusDetails,
      statusState: req.body.statusState,
    });
    order.status.push(status);

    const notification = new Notification({
      statusDetails: req.body.statusDetails,
      statusState: req.body.statusState,
      orderId: order._id,
    });
    user.notifications.push(notification);

    order.technicianId = req.body.technicianId;
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

    res.send(order);
  })
);

router.patch(
  "/repaired/:orderId",
  auth,
  asyncMiddleware(async (req, res) => {
    const { error } = validateOrderRepaired(req.body);
    if (error) return res.status(400).send(error.details[0].message);

    let order = await Order.findById(req.params.orderId);
    if (!order) return res.status(400).send({ error: "Invalide Order ID" });

    let user = await User.findById(order.userId);
    if (!user) return res.status(400).send({ error: "Invalide Id" });

    const status = new Status({
      statusDetails: req.body.statusDetails,
      statusState: req.body.statusState,
    });
    order.status.push(status);

    const notification = new Notification({
      statusDetails: req.body.statusDetails,
      statusState: req.body.statusState,
      orderId: order._id,
    });
    user.notifications.push(notification);

    order.amount = req.body.amount;

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
    res.send(order);
  })
);

router.get("/:id", auth, async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order)
    return res
      .status(404)
      .send({ error: "The order with the given ID was not found" });

  const product = await Product.findOne({
    iconName: order.categoryType,
  });

  const brand = product.brands.find(
    (item) => item._id.toString() === order.brand
  );
  order.brand = brand.brandName;

  const model = brand.models.find(
    (item) => item._id.toString() === order.model
  );
  order.model = model.modelName;

  res.send({
    success: "Order fetched",
    order,
  });
});

function validateOrderAccept(order) {
  const schema = Joi.object({
    problem: Joi.string().min(1).max(1024),
    note: Joi.string().min(1).max(255),
    statusDetails: Joi.string().min(1).max(255).required(),
    statusState: Joi.string().min(1).max(50).required(),
  });

  return schema.validate(order);
}

function validateOrderAssigned(order) {
  const schema = Joi.object({
    technicianId: Joi.objectId().required(),
    statusDetails: Joi.string().min(1).max(255).required(),
    statusState: Joi.string().min(1).max(50).required(),
  });

  return schema.validate(order);
}

function validateOrderRepaired(order) {
  const schema = Joi.object({
    amount: Joi.number().min(0).required(),
    statusDetails: Joi.string().min(1).max(255).required(),
    statusState: Joi.string().min(1).max(50).required(),
  });

  return schema.validate(order);
}

module.exports = router;
