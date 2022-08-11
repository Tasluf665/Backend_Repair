const express = require("express");
const router = express.Router();
const { Technician, validateTechnician } = require("../models/technician");
const { Agent } = require("../models/agent");
const asyncMiddleware = require("../middleware/async");
const auth = require("../middleware/auth");
const admin = require("../middleware/admin");

router.get(
  "/allTechnicians",
  [auth, admin],
  asyncMiddleware(async (req, res) => {
    let technicians = await Technician.find().select("-__v");
    res.send({
      success: "Technicians is fetched successfully",
      data: technicians,
    });
  })
);

router.get(
  "/:id",
  auth,
  asyncMiddleware(async (req, res) => {
    const technician = await Technician.findById(req.params.id);

    if (!technician)
      return res
        .status(404)
        .send({ error: "The technician with the given ID was not found" });

    res.send({
      success: "Technicien is fetched successfully",
      technician,
    });
  })
);

router.get(
  "/",
  [auth, admin],
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

    technicians = technicians.map((item, index) => {
      item._doc.id = (pageNumber - 1) * pageSize + index + 1;

      return item._doc;
    });

    res.send({
      success: "Technicians is fetched successfully",
      data: technicians,
      count,
    });
  })
);

router.post(
  "/",
  [auth, admin],
  asyncMiddleware(async (req, res) => {
    const { error } = validateTechnician(req.body);
    if (error) return res.status(400).send({ error: error.details[0].message });

    const agent = await Agent.findById(req.body.agentId);
    if (!agent) return res.status(400).send({ error: "Invalide agent" });

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
    res.send({
      success: "Technician is added successfully",
      data: technician,
    });
  })
);

router.put(
  "/:id",
  [auth, admin],
  asyncMiddleware(async (req, res) => {
    const { error } = validateTechnician(req.body);
    if (error) return res.status(400).send({ error: error.details[0].message });

    const agent = await Agent.findById(req.body.agentId);
    if (!agent) return res.status(400).send({ error: "Invalide agent" });

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
        .send({ error: "The technician with the given ID was not found" });

    res.send({
      success: "Technician is updated successfully",
      data: technician,
    });
  })
);

router.delete(
  "/:id",
  [auth, admin],
  asyncMiddleware(async (req, res) => {
    const technician = await Technician.findByIdAndRemove(req.params.id);
    if (!technician)
      return res
        .status(404)
        .send({ error: "The technician with the given ID was not found" });

    res.send({
      success: "Technician is deleted successfully",
      data: technician,
    });
  })
);

module.exports = router;
