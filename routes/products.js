const express = require("express");
const Joi = require("joi");
const router = express.Router();
const { Product, validateProduct } = require("../models/product");
const asyncMiddleware = require("../middleware/async");
const auth = require("../middleware/auth");
const admin = require("../middleware/admin");

/**
 * GET endpoint to retrieve a list of all products.
 *
 * This route fetches a list of all available products, excluding brand details and version information.
 *
 */
router.get(
  "/",
  auth,
  asyncMiddleware(async (req, res) => {
    const products = await Product.find().select("-brands -__v");

    // Check if any products were found.
    if (!products || products.length === 0) {
      return res.status(404).send({ error: "No products found" });
    }

    res.send({
      success: "Products are fetched successfully",
      data: products,
    });
  })
);

// Define a route for handling GET requests to "/brands/:id"
router.get(
  "/brands/:id",
  // Use the "auth" middleware to authenticate the request
  auth,
  // Use an asynchronous middleware to handle the request
  asyncMiddleware(async (req, res) => {
    // Find a product by its ID using the "Product" model and exclude "__v" and "name" fields
    const product = await Product.findById(req.params.id).select("-__v -name");

    // If no product is found, return a 404 error response
    if (!product)
      return res.status(404).send({ error: "Product not found with given Id" });

    // Create a new array by mapping over the "brands" property of the product
    let result = product.brands.map((item) => {
      // Create a temporary copy of each brand item and remove the "models" property
      let temp = { ...item };
      delete temp._doc.models;
      return temp._doc;
    });

    // Send a success response with the fetched product brand data
    res.send({
      success: "Product Brand is fetched successfully",
      data: result,
    });
  })
);

// Define a route for handling GET requests to "/models/:id/:brandId"
router.get(
  "/models/:id/:brandId",
  // Use the "auth" middleware to authenticate the request
  auth,
  // Use an asynchronous middleware to handle the request
  asyncMiddleware(async (req, res) => {
    // Find a product by its ID using the "Product" model and exclude "__v" and "name" fields
    const product = await Product.findById(req.params.id).select("-__v -name");

    // If no product is found, return a 404 error response
    if (!product)
      return res.status(404).send({ error: "Product not found with given Id" });

    // Find a brand within the product's "brands" array by its ID
    const brand = await product.brands.id(req.params.brandId);

    // If no brand is found, return a 400 Bad Request error response
    if (!brand) return res.status(400).send({ error: "Invalid Brand" });

    // Send a success response with the fetched brand's "models" data
    res.send({
      success: "Data fetch successfully",
      data: brand.models,
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
    // Validate the request body using the "validateProduct" function
    const { error } = validateProduct(req.body);

    // If validation fails, return a 400 Bad Request error response with the validation error message
    if (error) return res.status(400).send({ error: error.details[0].message });

    // Create a new "Product" instance with data from the request body
    const product = new Product({
      name: req.body.name,
      iconName: req.body.iconName,
      brands: {
        brandName: req.body.brandName,
      },
    });

    // Save the newly created product to the database
    await product.save();

    // Send a success response with the added product data
    res.send({
      success: "Product is added successfully",
      data: product,
    });
  })
);

// Define a route for handling PATCH requests to "/addBrands/:id"
router.patch(
  "/addBrands/:id",
  // Use the "auth" and "admin" middlewares to authenticate and check admin privileges
  [auth, admin],
  // Use an asynchronous middleware to handle the request
  asyncMiddleware(async (req, res) => {
    // Validate the request body using the "validateBrand" function
    const { error } = validateBrand(req.body);

    // If validation fails, return a 400 Bad Request error response with the validation error message
    if (error) return res.status(400).send({ error: error.details[0].message });

    // Find a product by its ID in the database
    const product = await Product.findById(req.params.id);

    // If no product is found, return a 400 Bad Request error response
    if (!product) return res.status(400).send({ error: "Invalid product" });

    // Add a new brand to the "brands" array of the product
    product.brands.push({
      brandName: req.body.brandName,
    });

    // Save the updated product with the new brand to the database
    await product.save();

    // Send a success response with the updated product data
    res.send({
      success: "Product Brand is added successfully",
      data: product,
    });
  })
);

// Define a route for handling PATCH requests to "/addModels/:id/:brandId"
router.patch(
  "/addModels/:id/:brandId",
  // Use the "auth" and "admin" middlewares to authenticate and check admin privileges
  [auth, admin],
  // Use an asynchronous middleware to handle the request
  asyncMiddleware(async (req, res) => {
    // Validate the request body using the "validateModel" function
    const { error } = validateModel(req.body);

    // If validation fails, return a 400 Bad Request error response with the validation error message
    if (error) return res.status(400).send({ error: error.details[0].message });

    // Find a product by its ID in the database
    const product = await Product.findById(req.params.id);

    // If no product is found, return a 400 Bad Request error response
    if (!product) return res.status(400).send({ error: "Invalid product" });

    // Find a brand within the product's "brands" array by its ID
    const brand = await product.brands.id(req.params.brandId);

    // If no brand is found, return a 400 Bad Request error response
    if (!brand) return res.status(400).send({ error: "Invalid Brand" });

    // Add a new model to the "models" array of the brand
    brand.models.push({
      modelName: req.body.modelName,
    });

    // Save the updated product with the new model to the database
    await product.save();

    // Send a success response with the updated brand data
    res.send({
      success: "Product Model is added successfully",
      data: brand,
    });
  })
);

// Define a route for handling PATCH requests to "/addModelsArray/:id/:brandId"
router.patch("/addModelsArray/:id/:brandId", auth, async (req, res) => {
  // Find a product by its ID in the database
  const product = await Product.findById(req.params.id);

  // If no product is found, return a 400 Bad Request error response
  if (!product) return res.status(400).send({ error: "Invalid product" });

  // Find a brand within the product's "brands" array by its ID
  const brand = await product.brands.id(req.params.brandId);

  // If no brand is found, return a 400 Bad Request error response
  if (!brand) return res.status(400).send({ error: "Invalid Brand" });

  // Iterate over the "modelName" array in the request body and add each model to the brand's "models" array
  req.body.modelName.map((item) => {
    brand.models.push({
      modelName: item,
    });
  });

  // Save the updated product with the new models to the database
  await product.save();

  // Send a success response with the updated brand data
  res.send({
    success: "Product array of models is added successfully",
    data: brand,
  });
});

function validateBrand(brand) {
  const schema = Joi.object({
    brandName: Joi.string().min(1).max(255).required(),
  });

  return schema.validate(brand);
}

function validateModel(model) {
  const schema = Joi.object({
    modelName: Joi.string().min(1).max(255).required(),
  });

  return schema.validate(model);
}

module.exports = router;
