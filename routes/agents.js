const express = require("express");
const router = express.Router();
const { Agent, validateAgent } = require("../models/agent");
const asyncMiddleware = require("../middleware/async");
const auth = require("../middleware/auth");
const admin = require("../middleware/admin");

/**
 * Route handler for fetching all agents.
 *
 * This route handles a GET request to retrieve a list of all agents from the database.
 * It requires authentication and admin privileges.
 *
 * @route GET /api/allAgents
 * @middleware auth - Authentication middleware to verify the user's identity.
 * @middleware admin - Middleware to ensure the user has admin privileges.
 * @returns {object} - A JSON response containing the fetched agent data.
 */
router.get(
  "/allAgents",
  [auth, admin], // Authentication and admin middleware
  asyncMiddleware(async (req, res) => {
    // Retrieve all agents from the database while excluding the '__v' field.
    let agents = await Agent.find().select("-__v");

    // Send a success response with the fetched agent data.
    res.send({ success: "Agents are fetched successfully", data: agents });
  })
);

/**
 * Route handler for paginated and filtered agent listing.
 *
 * This route handles a GET request to retrieve a paginated and filtered list of agents from the database.
 * It requires authentication and admin privileges.
 *
 * @route GET /api/agents
 * @middleware auth - Authentication middleware to verify the user's identity.
 * @middleware admin - Middleware to ensure the user has admin privileges.
 * @param {string} req.query.name - Optional query parameter for filtering agents by name (case-insensitive).
 * @param {number} req.query.pageNumber - Optional query parameter for specifying the page number (default: 1).
 * @param {number} req.query.pageSize - Optional query parameter for specifying the page size (default: total count of agents).
 * @returns {object} - A JSON response containing the paginated and filtered agent data.
 */
router.get(
  "/",
  [auth, admin], // Authentication and admin middleware
  asyncMiddleware(async (req, res) => {
    // Determine the search pattern for agent names (case-insensitive).
    //Source: Mosh -> NodeJS -> 7. CRUD -> 11- Regular.
    //if name = tas then search = /tas/i and name = "" then search = /.*/
    const search = req.query.name ? new RegExp(req.query.name, "i") : /.*/;

    // Count the total number of agents that match the search criteria.
    //Source: Mosh -> NodeJS -> 7. CRUD -> 11- Regular.
    const count = await Agent.find({ name: search }).count();

    // Determine the page number and page size for pagination.
    const pageNumber = req.query.pageNumber ? req.query.pageNumber : 1;
    const pageSize = req.query.pageSize ? req.query.pageSize : count;

    // Retrieve agents based on search criteria, skip, limit, sort, and exclude '__v' field.
    let agents = await Agent.find({ name: search })
      .skip((pageNumber - 1) * pageSize) //Source: Mosh -> NodeJS -> 7. CRUD -> 13- Pagination
      .limit(pageSize)
      .sort("name")
      .select("-__v");

    // Assign unique 'id' values to each agent for pagination.
    //This maping is used to solve the number problem in Admin panel after I filter data by names.
    //For example search "tas" will show 10 number agent because that agent is store in the 10th place of the databse so to solve this I have reassign the id number start from 1 so that date will show serially.
    agents = agents.map((item, index) => {
      item._doc.id = (pageNumber - 1) * pageSize + index + 1;
      return item._doc;
    });

    // Send a success response with the paginated and filtered agent data and total count.
    res.send({
      success: "Agents are fetched successfully",
      data: agents,
      count,
    });
  })
);

/**
 * Route handler for fetching a single agent by ID.
 *
 * This route handles a GET request to retrieve a single agent from the database based on its ID.
 * It requires authentication and admin privileges.
 *
 * @route GET /api/agents/:id
 * @middleware auth - Authentication middleware to verify the user's identity.
 * @middleware admin - Middleware to ensure the user has admin privileges.
 * @param {string} req.params.id - The ID of the agent to be retrieved.
 * @returns {object} - A JSON response containing the fetched agent data.
 */
router.get(
  "/:id",
  [auth, admin], // Authentication and admin middleware
  asyncMiddleware(async (req, res) => {
    // Find the agent by ID in the database.
    const agent = await Agent.findById(req.params.id);

    // If no matching agent is found, return a 404 Not Found response.
    if (!agent)
      return res
        .status(404)
        .send({ error: "The agent with the given ID was not found" });

    // Send a success response with the fetched agent data.
    res.send({
      success: "Agent is fetched successfully",
      data: agent,
    });
  })
);

/**
 * Route handler for adding a new agent.
 *
 * This route handles a POST request to add a new agent to the database.
 * It requires authentication and admin privileges.
 *
 * @route POST /api/agents
 * @middleware auth - Authentication middleware to verify the user's identity.
 * @middleware admin - Middleware to ensure the user has admin privileges.
 * @param {object} req.body - The request body containing the agent data to be added.
 * @returns {object} - A JSON response indicating the success of the agent addition.
 */
router.post(
  "/",
  [auth, admin], // Authentication and admin middleware
  asyncMiddleware(async (req, res) => {
    // Validate the agent data in the request body.
    const { error } = validateAgent(req.body);

    // If validation fails, return a 400 Bad Request response with the error details.
    if (error) return res.status(400).send({ error: error.details[0].message });

    // Create a new 'Agent' document based on the request body data.
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

    // Save the new agent document to the database.
    await agent.save();

    // Send a success response with the added agent data.
    res.send({
      success: "Agent is added successfully",
      data: agent,
    });
  })
);

/**
 * Route handler for updating an existing agent by ID.
 *
 * This route handles a PUT request to update an agent in the database based on its ID.
 * It requires authentication and admin privileges.
 *
 * @route PUT /api/agents/:id
 * @middleware auth - Authentication middleware to verify the user's identity.
 * @middleware admin - Middleware to ensure the user has admin privileges.
 * @param {string} req.params.id - The ID of the agent to be updated.
 * @param {object} req.body - The request body containing the updated agent data.
 * @returns {object} - A JSON response indicating the success of the agent update.
 */
router.put(
  "/:id",
  [auth, admin], // Authentication and admin middleware
  asyncMiddleware(async (req, res) => {
    // Validate the agent data in the request body.
    const { error } = validateAgent(req.body);

    // If validation fails, return a 400 Bad Request response with the error details.
    if (error) return res.status(400).send({ error: error.details[0].message });

    // Find and update the agent document by ID, and return the updated document.
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

    // If no matching agent is found, return a 404 Not Found response.
    if (!agent)
      return res
        .status(404)
        .send({ error: "The agent with the given ID was not found" });

    // Send a success response with the updated agent data.
    res.send({
      success: "Agent is updated successfully",
      data: agent,
    });
  })
);

/**
 * Route handler for deleting an existing agent by ID.
 *
 * This route handles a DELETE request to remove an agent from the database based on its ID.
 * It requires authentication and admin privileges.
 *
 * @route DELETE /api/agents/:id
 * @middleware auth - Authentication middleware to verify the user's identity.
 * @middleware admin - Middleware to ensure the user has admin privileges.
 * @param {string} req.params.id - The ID of the agent to be deleted.
 * @returns {object} - A JSON response indicating the success of the agent deletion.
 */
router.delete(
  "/:id",
  [auth, admin], // Authentication and admin middleware
  asyncMiddleware(async (req, res) => {
    // Find and remove the agent document by ID, and return the removed document.
    const agent = await Agent.findByIdAndRemove(req.params.id);

    // If no matching agent is found, return a 404 Not Found response.
    if (!agent)
      return res
        .status(404)
        .send({ error: "The agent with the given ID was not found" });

    // Send a success response with the deleted agent data.
    res.send({
      success: "Agent is deleted successfully",
      data: agent,
    });
  })
);

module.exports = router;
