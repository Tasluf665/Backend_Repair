const express = require("express");
const router = express.Router();
const { Agent, validateAgent } = require("../models/agent");
const asyncMiddleware = require("../middleware/async");
const auth = require("../middleware/auth");

router.get(
  "/",
  auth,
  asyncMiddleware(async (req, res) => {
    const search = req.query.name ? new RegExp(req.query.name, "i") : /.*/;
    const count = await Agent.find({ name: search }).count();

    const pageNumber = req.query.pageNumber ? req.query.pageNumber : 1;
    const pageSize = req.query.pageSize ? req.query.pageSize : count;

    let agents = await Agent.find({ name: search })
      .skip((pageNumber - 1) * pageSize)
      .limit(pageSize)
      .sort("name")
      .select("-__v");

    res.send({ data: agents, count });
  })
);

router.post(
  "/",
  auth,
  asyncMiddleware(async (req, res) => {
    const { error } = validateAgent(req.body);
    if (error) return res.status(400).send({ error: error.details[0].message });

    const agent = new Agent({
      name: req.body.name,
      email: req.body.email,
      phone: req.body.phone,
      whatsappNumber: req.body.whatsappNumber,
      region: req.body.region,
      city: req.body.city,
      area: req.body.area,
      location: req.body.location,
    });

    await agent.save();
    res.send(agent);
  })
);

router.put(
  "/:id",
  auth,
  asyncMiddleware(async (req, res) => {
    const { error } = validateAgent(req.body);
    if (error) return res.status(400).send({ error: error.details[0].message });

    const agent = await Agent.findByIdAndUpdate(
      req.params.id,
      {
        name: req.body.name,
        email: req.body.email,
        phone: req.body.phone,
        whatsappNumber: req.body.whatsappNumber,
        region: req.body.region,
        city: req.body.city,
        area: req.body.area,
        location: req.body.location,
      },
      { new: true }
    );

    if (!agent)
      return res
        .status(404)
        .send({ error: "The agent with the given ID was not found" });

    res.send(agent);
  })
);

router.delete(
  "/:id",
  auth,
  asyncMiddleware(async (req, res) => {
    const agent = await Agent.findByIdAndRemove(req.params.id);
    if (!agent)
      return res.status(404).send("The agent with the given ID was not found");

    res.send(agent);
  })
);

router.get(
  "/:id",
  auth,
  asyncMiddleware(async (req, res) => {
    const agent = await Agent.findById(req.params.id);

    if (!agent)
      return res.status(404).send("The agent with the given ID was not found");

    res.send(agent);
  })
);

module.exports = router;
