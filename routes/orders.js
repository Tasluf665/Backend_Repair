const express = require("express");
const router = express.Router();
const { Order, Status, validateOrder } = require("../models/order");
const { User } = require("../models/user");
const asyncMiddleware = require("../middleware/async");
const auth = require("../middleware/auth");
const _ = require("lodash");
const Joi = require("joi");

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

router.get(
  "/:id",
  auth,
  asyncMiddleware(async (req, res) => {
    const order = await Order.findById(req.params.id);

    if (!order)
      return res
        .status(404)
        .send({ error: "The order with the given ID was not found" });

    res.send({
      success: "Order fetched",
      order,
    });
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
