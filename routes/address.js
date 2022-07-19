const express = require("express");
const router = express.Router();
const { Address, validateAddress } = require("../models/address");
const asyncMiddleware = require("../middleware/async");
const auth = require("../middleware/auth");
const admin = require("../middleware/admin");

router.post(
  "/",
  auth,
  asyncMiddleware(async (req, res) => {
    const { error } = validateAddress(req.body);
    if (error) return res.status(400).send(error.details[0].message);

    const address = new Address({
      id: req.body.id,
      name: req.body.name,
      nameLocal: req.body.nameLocal,
      parentId: req.body.parentId,
      displayName: req.body.displayName,
    });

    await address.save();
    res.send(address);
  })
);

router.put(
  "/:id",
  [auth, admin],
  asyncMiddleware(async (req, res) => {
    const { error } = validateAddress(req.body);
    if (error) return res.status(400).send(error.details[0].message);

    const address = await Address.findByIdAndUpdate(
      req.params.id,
      {
        id: req.body.id,
        name: req.body.name,
        nameLocal: req.body.nameLocal,
        parentId: req.body.parentId,
        displayName: req.body.displayName,
      },
      { new: true }
    );

    if (!address)
      return res
        .status(404)
        .send("The address with the given ID was not found");

    res.send(address);
  })
);

router.delete(
  "/:id",
  [auth, admin],
  asyncMiddleware(async (req, res) => {
    const address = await Address.findByIdAndRemove(req.params.id);
    if (!address)
      return res
        .status(404)
        .send("The address with the given ID was not found");

    res.send(address);
  })
);

router.get(
  "/",
  auth,
  asyncMiddleware(async (req, res) => {
    if (!req.query.parentId) req.query.parentId = "R184640";
    const address = await Address.find({ parentId: req.query.parentId })
      .sort("displayName")
      .select("-__v");
    if (!address)
      return res
        .status(404)
        .send("The address with the given ID was not found");

    res.send(address);
  })
);

module.exports = router;
