const express = require("express");
const router = express.Router();
const { Technician, validateTechnician } = require("../models/technician");
const { Agent } = require("../models/agent");
const asyncMiddleware = require("../middleware/async");
const auth = require("../middleware/auth");
const admin = require("../middleware/admin");

// Define a route for handling GET requests to "/allTechnicians"
router.get(
  "/allTechnicians",
  // Use the "auth" and "admin" middlewares to authenticate and check admin privileges
  [auth, admin],
  // Use an asynchronous middleware to handle the request
  asyncMiddleware(async (req, res) => {
    // Find all technicians in the database and exclude the "__v" field
    let technicians = await Technician.find().select("-__v");

    // Send a success response with the fetched technicians data
    res.send({
      success: "Technicians are fetched successfully",
      data: technicians,
    });
  })
);

// Define a route for handling GET requests to "/:id"
router.get(
  "/:id",
  // Use the "auth" middleware to authenticate the request
  auth,
  // Use an asynchronous middleware to handle the request
  asyncMiddleware(async (req, res) => {
    // Find a technician by their ID in the database
    const technician = await Technician.findById(req.params.id);

    // If no technician is found, return a 404 Not Found error response
    if (!technician)
      return res
        .status(404)
        .send({ error: "The technician with the given ID was not found" });

    // Send a success response with the fetched technician data
    res.send({
      success: "Technician is fetched successfully",
      data: technician,
    });
  })
);

// Define a route for handling GET requests to "/"
router.get(
  "/",
  // Use the "auth" and "admin" middlewares to authenticate and check admin privileges
  [auth, admin],
  // Use an asynchronous middleware to handle the request
  asyncMiddleware(async (req, res) => {
    // Extract page number and page size from query parameters, with default values of 1 and 10, respectively
    const pageNumber = req.query.pageNumber ? req.query.pageNumber : 1;
    const pageSize = req.query.pageSize ? req.query.pageSize : 10;

    // Create a regular expression pattern for searching technicians by name with a case-insensitive match
    //Source: Mosh -> NodeJS -> 7. CRUD -> 11- Regular.
    //if name = tas then search = /tas/i and name = "" then search = /.*/
    const search = req.query.name ? new RegExp(req.query.name, "i") : /.*/;

    // Count the total number of technicians matching the search criteria
    const count = await Technician.find({ name: search }).count();

    // Find and fetch a paginated list of technicians based on the search criteria
    let technicians = await Technician.find({ name: search })
      .skip((pageNumber - 1) * pageSize) //Source: Mosh -> NodeJS -> 7. CRUD -> 13- Pagination
      .limit(pageSize)
      .sort("name")
      .select("-__v");

    // Add an "id" property to each technician based on their position in the paginated result
    //This maping is used to solve the number problem in Admin panel after I filter data by names.
    //For example search "tas" will show 10 number agent because that agent is store in the 10th place of the databse so to solve this I have reassign the id number start from 1 so that date will show serially.
    technicians = technicians.map((item, index) => {
      item._doc.id = (pageNumber - 1) * pageSize + index + 1;
      return item._doc;
    });

    // Send a success response with the paginated list of technicians and the total count
    res.send({
      success: "Technicians are fetched successfully",
      data: technicians,
      count,
    });
  })
);

// Define a route for handling POST requests to "/"
router.post(
  "/",
  // Use the "auth" and "admin" middlewares to authenticate and check admin privileges
  [auth, admin],
  // Use an asynchronous middleware to handle the request
  asyncMiddleware(async (req, res) => {
    // Validate the request body using the "validateTechnician" function
    const { error } = validateTechnician(req.body);

    // If validation fails, return a 400 Bad Request error response with the validation error message
    if (error) return res.status(400).send({ error: error.details[0].message });

    // Find an agent by their ID in the database
    const agent = await Agent.findById(req.body.agentId);

    // If no agent is found, return a 400 Bad Request error response
    if (!agent) return res.status(400).send({ error: "Invalid agent" });

    // Create a new "Technician" instance with data from the request body
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

    // Save the newly created technician to the database
    await technician.save();

    // Send a success response with the added technician data
    res.send({
      success: "Technician is added successfully",
      data: technician,
    });
  })
);

// Define a route for handling PUT requests to "/:id"
router.put(
  "/:id",
  // Use the "auth" and "admin" middlewares to authenticate and check admin privileges
  [auth, admin],
  // Use an asynchronous middleware to handle the request
  asyncMiddleware(async (req, res) => {
    // Validate the request body using the "validateTechnician" function
    const { error } = validateTechnician(req.body);

    // If validation fails, return a 400 Bad Request error response with the validation error message
    if (error) return res.status(400).send({ error: error.details[0].message });

    // Find an agent by their ID in the database
    const agent = await Agent.findById(req.body.agentId);

    // If no agent is found, return a 400 Bad Request error response
    if (!agent) return res.status(400).send({ error: "Invalid agent" });

    // Update the technician by their ID with data from the request body and the agent information
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
      { new: true } // Return the updated technician document
    );

    // If no technician is found, return a 404 Not Found error response
    if (!technician)
      return res
        .status(404)
        .send({ error: "The technician with the given ID was not found" });

    // Send a success response with the updated technician data
    res.send({
      success: "Technician is updated successfully",
      data: technician,
    });
  })
);

// Define a route for handling DELETE requests to "/:id"
router.delete(
  "/:id",
  // Use the "auth" and "admin" middlewares to authenticate and check admin privileges
  [auth, admin],
  // Use an asynchronous middleware to handle the request
  asyncMiddleware(async (req, res) => {
    // Find and remove a technician by their ID from the database
    const technician = await Technician.findByIdAndRemove(req.params.id);

    // If no technician is found, return a 404 Not Found error response
    if (!technician)
      return res
        .status(404)
        .send({ error: "The technician with the given ID was not found" });

    // Send a success response with the deleted technician data
    res.send({
      success: "Technician is deleted successfully",
      data: technician,
    });
  })
);

module.exports = router;
