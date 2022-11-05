const express = require("express");
const router = express.Router();
const { Order, Status, validateOrder } = require("../models/order");
const { User, Notification } = require("../models/user");
const { Product, Brand } = require("../models/product");
const asyncMiddleware = require("../middleware/async");
const auth = require("../middleware/auth");
const admin = require("../middleware/admin");
const _ = require("lodash");
const Joi = require("joi");
const fetch = require("node-fetch");
const { findLastIndex } = require("lodash");

router.get(
  "/",
  [auth, admin],
  asyncMiddleware(async (req, res) => {
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

      res.status(200).send({
        success: "Orders is fetched successfully",
        data: sortedOrders,
        count,
      });
    });
  })
);

router.get(
  "/totalProfit",
  [auth, admin],
  asyncMiddleware(async (req, res) => {
    const allOrder = await Order.find();

    let totalProfit = 0.0;

    allOrder.forEach((order) => {
      order.payment.forEach((element) => {
        totalProfit += parseFloat(element.amount);
      });
    });

    res.status(200).send({
      success: "Total Profit is fetched successfully",
      totalProfit,
    });
  })
);

router.get(
  "/weeklySells",
  [auth, admin],
  asyncMiddleware(async (req, res) => {
    const allOrder = await Order.find();

    let count = 0;

    allOrder.forEach((order) => {
      let orderTime = new Date(order.bookingTime).getTime();
      let before = new Date().getTime() - 518400000;
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

router.get(
  "/sellsInMonth",
  [auth, admin],
  asyncMiddleware(async (req, res) => {
    const allOrder = await Order.find();

    let month = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

    allOrder.forEach((order) => {
      if (new Date(order.bookingTime).getFullYear === new Date().getFullYear) {
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

router.get(
  "/pendingOrder",
  [auth, admin],
  asyncMiddleware(async (req, res) => {
    const allOrder = await Order.find();

    let count = 0;

    allOrder.forEach((order) => {
      if (
        order.status[order.status.length - 1].statusState !== "Payment Complete"
      ) {
        count++;
      }
    });

    res.status(200).send({
      success: "Pending orders is fetched successfully",
      count,
    });
  })
);

router.get(
  "/countOrderCategory",
  [auth, admin],
  asyncMiddleware(async (req, res) => {
    const allOrder = await Order.find();

    let tv = 0;
    let fridge = 0;
    let ac = 0;
    let fan = 0;

    allOrder.forEach((order) => {
      if (order.categoryType === "youtube-tv") {
        tv++;
      } else if (order.categoryType === "fridge") {
        fridge++;
      } else if (order.categoryType === "air-filter") {
        ac++;
      } else if (order.categoryType === "fan") {
        fan++;
      }
    });

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

router.get(
  "/:id",
  auth,
  asyncMiddleware(async (req, res) => {
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
      success: "Order is fetched successfully",
      data: order,
    });
  })
);

router.post(
  "/",
  auth,
  asyncMiddleware(async (req, res) => {
    const { error } = validateOrder(req.body);
    if (error) return res.status(400).send({ error: error.details[0].message });

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
      data: order,
    });
  })
);

router.patch(
  "/accept/:orderId",
  [auth, admin],
  asyncMiddleware(async (req, res) => {
    const { error } = validateOrderAccept(req.body);
    if (error) return res.status(400).send({ error: error.details[0].message });

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

    res.send({
      success: "Order is Accepted",
      data: order,
    });
  })
);

router.patch(
  "/assigned/:orderId",
  [auth, admin],
  asyncMiddleware(async (req, res) => {
    const { error } = validateOrderAssigned(req.body);
    if (error) return res.status(400).send({ error: error.details[0].message });

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

    res.send({
      success: "Agent and Technicians are assigned to the order",
      data: order,
    });
  })
);

router.patch(
  "/repaired/:orderId",
  [auth, admin],
  asyncMiddleware(async (req, res) => {
    const { error } = validateOrderRepaired(req.body);
    if (error) return res.status(400).send({ error: error.details[0].message });

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
    res.send({
      success: "Order is Repaired",
      data: order,
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
