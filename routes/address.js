const express = require("express"); // Import Express.js for route handling.
const router = express.Router(); // Create an Express Router instance.
const { Address, validateAddress } = require("../models/address"); // Import the 'Address' model and validation function.
const asyncMiddleware = require("../middleware/async"); // Import middleware for handling asynchronous operations.
const auth = require("../middleware/auth"); // Import authentication middleware.
const admin = require("../middleware/admin"); // Import middleware for admin role checks.

/**
 * Route handler for fetching addresses.
 *
 * This route handles GET requests to retrieve addresses based on optional query parameters.
 * If no 'id' query parameter is provided, it defaults to fetching addresses with the ID 'R184640'.
 *
 * @route GET /api/address
 * @middleware auth - Authentication middleware to verify the user's identity.
 * @param {string} req.query.id - Optional query parameter for specifying the address ID to retrieve.
 * @returns {object} - A JSON response containing the fetched address data.
 */
router.get(
  "/",
  auth, // Authentication middleware
  asyncMiddleware(async (req, res) => {
    // Default to 'R184640' if no 'id' query parameter is provided.
    if (!req.query.id) req.query.id = "R184640";

    // Retrieve addresses from the database based on the 'parentId' query parameter.
    const address = await Address.find({ parentId: req.query.id })
      .sort("displayName")
      .select("-__v");

    // If no addresses are found, return a 404 error response.
    if (!address)
      return res
        .status(404)
        .send({ error: "The address with the given ID was not found" });

    // Send a success response with the fetched address data.
    res.send({
      success: "Address is fetched successfully",
      data: address,
    });
  })
);

/**
 * Route handler for adding a new address.
 *
 * This route handles POST requests to add a new address to the database.
 * It requires authentication and admin privileges.
 *
 * @route POST /api/address
 * @middleware auth - Authentication middleware to verify the user's identity.
 * @middleware admin - Middleware to ensure the user has admin privileges.
 * @param {object} req.body - The request body containing the address data to be added.
 * @returns {object} - A JSON response indicating the success of the address addition.
 */
router.post(
  "/",
  [auth, admin], // Authentication and admin middleware
  asyncMiddleware(async (req, res) => {
    // Validate the address data in the request body.
    const { error } = validateAddress(req.body);

    // If validation fails, return a 400 Bad Request response with the error details.
    if (error) return res.status(400).send({ error: error.details[0].message });

    // Create a new 'Address' document based on the request body data.
    const address = new Address({
      id: req.body.id,
      name: req.body.name,
      nameLocal: req.body.nameLocal,
      parentId: req.body.parentId,
      displayName: req.body.displayName,
    });

    // Save the new address document to the database.
    await address.save();

    // Send a success response with the added address data.
    res.send({
      success: "Address is added successfully",
      data: address,
    });
  })
);

/**
 * Route handler for updating an existing address by ID.
 *
 * This route handles PUT requests to update an address in the database based on its ID.
 * It requires authentication and admin privileges.
 *
 * @route PUT /api/address/:id
 * @middleware auth - Authentication middleware to verify the user's identity.
 * @middleware admin - Middleware to ensure the user has admin privileges.
 * @param {string} req.params.id - The ID of the address to be updated.
 * @param {object} req.body - The request body containing the updated address data.
 * @returns {object} - A JSON response indicating the success of the address update.
 */
router.put(
  "/:id",
  [auth, admin], // Authentication and admin middleware
  asyncMiddleware(async (req, res) => {
    // Validate the address data in the request body.
    const { error } = validateAddress(req.body);

    // If validation fails, return a 400 Bad Request response with the error details.
    if (error) return res.status(400).send({ error: error.details[0].message });

    // Find and update the address document by ID, and return the updated document.
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

    // If no matching address is found, return a 404 Not Found response.
    if (!address)
      return res
        .status(404)
        .send({ error: "The address with the given ID was not found" });

    // Send a success response with the updated address data.
    res.send({
      success: "Address is updated successfully",
      data: address,
    });
  })
);

/**
 * Route handler for deleting an existing address by ID.
 *
 * This route handles DELETE requests to remove an address from the database based on its ID.
 * It requires authentication and admin privileges.
 *
 * @route DELETE /api/address/:id
 * @middleware auth - Authentication middleware to verify the user's identity.
 * @middleware admin - Middleware to ensure the user has admin privileges.
 * @param {string} req.params.id - The ID of the address to be deleted.
 * @returns {object} - A JSON response indicating the success of the address deletion.
 */
router.delete(
  "/:id",
  [auth, admin], // Authentication and admin middleware
  asyncMiddleware(async (req, res) => {
    // Find and remove the address document by ID, and return the removed document.
    const address = await Address.findByIdAndRemove(req.params.id);

    // If no matching address is found, return a 404 Not Found response.
    if (!address)
      return res
        .status(404)
        .send({ error: "The address with the given ID was not found" });

    // Send a success response with the deleted address data.
    res.send({
      success: "Address is deleted successfully",
      data: address,
    });
  })
);

module.exports = router;
