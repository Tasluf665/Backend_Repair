const express = require("express");
const router = express.Router();
const { Order, Status, validateOrder } = require("../models/order");
const { User } = require("../models/user");
const asyncMiddleware = require("../middleware/async");
const auth = require("../middleware/auth");
const _ = require("lodash");
const Joi = require("joi");

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
        "arrivalTime",
        "category",
        "categoryType",
        "product",
        "type",
        "problem",
        "note",
      ])
    );

    const status = new Status({
      statusDetails: req.body.statusDetails,
      statusState: req.body.statusState,
    });

    order.status.push(status);
    user.orders.push(order._id);

    await order.save();
    await user.save();

    res.send(order);
  })
);

router.patch(
  "/accept/:orderId",
  auth,
  asyncMiddleware(async (req, res) => {
    const { error } = validateOrderAccept(req.body);
    if (error) return res.status(400).send(error.details[0].message);

    let user = await User.findById(req.user._id);
    if (!user) return res.status(400).send({ error: "Invalide Id" });

    let order = await Order.findById(req.params.orderId);
    if (!order) return res.status(400).send({ error: "Invalide Order ID" });

    const status = new Status({
      statusDetails: req.body.statusDetails,
      statusState: req.body.statusState,
    });

    order.problem = req.body.problem ? req.body.problem : order.problem;
    order.note = req.body.note ? req.body.note : order.note;
    order.status.push(status);

    await order.save();
    res.send(order);
  })
);

router.patch(
  "/assigned/:orderId",
  auth,
  asyncMiddleware(async (req, res) => {
    const { error } = validateOrderAssigned(req.body);
    if (error) return res.status(400).send(error.details[0].message);

    let user = await User.findById(req.user._id);
    if (!user) return res.status(400).send({ error: "Invalide Id" });

    let order = await Order.findById(req.params.orderId);
    if (!order) return res.status(400).send({ error: "Invalide Order ID" });

    const status = new Status({
      statusDetails: req.body.statusDetails,
      statusState: req.body.statusState,
    });

    order.technicianId = req.body.technicianId;
    order.status.push(status);

    await order.save();
    res.send(order);
  })
);

router.patch(
  "/repaired/:orderId",
  auth,
  asyncMiddleware(async (req, res) => {
    const { error } = validateOrderRepaired(req.body);
    if (error) return res.status(400).send(error.details[0].message);

    let user = await User.findById(req.user._id);
    if (!user) return res.status(400).send({ error: "Invalide Id" });

    let order = await Order.findById(req.params.orderId);
    if (!order) return res.status(400).send({ error: "Invalide Order ID" });

    const status = new Status({
      statusDetails: req.body.statusDetails,
      statusState: req.body.statusState,
    });

    order.amount = req.body.amount;
    order.status.push(status);

    await order.save();
    res.send(order);
  })
);

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
