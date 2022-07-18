const express = require("express");
const router = express.Router();
const { Technician, validateTechnician } = require("../models/technician");
const { Agent } = require("../models/agent");
const asyncMiddleware = require("../middleware/async");

router.get(
  "/",
  asyncMiddleware(async (req, res) => {
    const pageNumber = req.query.pageNumber ? req.query.pageNumber : 1;
    const pageSize = req.query.pageSize ? req.query.pageSize : 10;
    const search = req.query.name ? new RegExp(req.query.name, "i") : /.*/;

    const count = await Technician.find({ name: search }).count();

    let technicians = await Technician.find({ name: search })
      .skip((pageNumber - 1) * pageSize)
      .limit(pageSize)
      .sort("name")
      .select("-__v");

    res.send({ data: technicians, count });
  })
);

router.post(
  "/",
  asyncMiddleware(async (req, res) => {
    const { error } = validateTechnician(req.body);
    if (error) return res.status(400).send(error.details[0].message);

    const agent = await Agent.findById(req.body.agentId);
    if (!agent) return res.status(400).send("Invalide agent");

    const technician = new Technician({
      name: req.body.name,
      email: req.body.email,
      phone: req.body.phone,
      whatsappNumber: req.body.whatsappNumber,
      region: req.body.region,
      city: req.body.city,
      area: req.body.area,
      location: req.body.location,
      agent: {
        _id: agent._id,
        name: agent.name,
        phone: agent.phone,
        region: agent.region,
        city: agent.city,
      },
    });

    await technician.save();
    res.send(technician);
  })
);

router.put(
  "/:id",
  asyncMiddleware(async (req, res) => {
    const { error } = validateTechnician(req.body);
    if (error) return res.status(400).send(error.details[0].message);

    const agent = await Agent.findById(req.body.agentId);
    if (!agent) return res.status(400).send("Invalide agent");

    const technician = await Technician.findByIdAndUpdate(
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
        agent: {
          _id: agent._id,
          name: agent.name,
          phone: agent.phone,
          region: agent.region,
          city: agent.city,
        },
      },
      { new: true }
    );

    if (!technician)
      return res
        .status(404)
        .send("The technician with the given ID was not found");

    res.send(technician);
  })
);

router.delete(
  "/:id",
  asyncMiddleware(async (req, res) => {
    const technician = await Technician.findByIdAndRemove(req.params.id);
    if (!technician)
      return res
        .status(404)
        .send("The technician with the given ID was not found");

    res.send(technician);
  })
);

router.get(
  "/:id",
  asyncMiddleware(async (req, res) => {
    const technician = await Technician.findById(req.params.id);

    if (!technician)
      return res
        .status(404)
        .send("The technician with the given ID was not found");

    res.send(technician);
  })
);

module.exports = router;
