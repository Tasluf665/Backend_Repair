const mongoose = require("mongoose");
const Joi = require("joi");

// Define a Mongoose schema for the 'model' collection. Source: Mosh -> NodeJS course -> 7. CRUD  -> 5 - Schemas
const modelSchema = new mongoose.Schema({
  modelName: {
    type: String,
    required: true,
    minlength: 1,
    maxlength: 255,
  },
});

// Define a Mongoose schema for the 'brand' collection. Source: Mosh -> NodeJS course -> 7. CRUD  -> 5 - Schemas
const brandSchema = new mongoose.Schema({
  brandName: {
    type: String,
    required: true,
    minlength: 1,
    maxlength: 255,
  },
  models: [modelSchema], //Source: Mosh -> NodeJS course -> 9. Mongoose -> 4 - Embedding Documents
});

// Create a Mongoose model for the 'Brand' collection using the 'addressSchema'. Source: Mosh -> NodeJS course -> 7. CRUD  -> 6- Models
const Brand = mongoose.model("brand", brandSchema);

// Define a Mongoose schema for the 'product' collection. Source: Mosh -> NodeJS course -> 7. CRUD  -> 5 - Schemas
const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    minlength: 1,
    maxlength: 255,
  },
  iconName: {
    type: String,
    required: true,
    minlength: 1,
    maxlength: 255,
  },
  brands: {
    type: [brandSchema], //Source: Mosh -> NodeJS course -> 9. Mongoose -> 4 - Embedding Documents
    ref: "Brand",
    required: true,
  },
});

// Create a Mongoose model for the 'Product' collection using the 'addressSchema'. Source: Mosh -> NodeJS course -> 7. CRUD  -> 6- Models
const Product = mongoose.model("Product", productSchema);

/**
 * Validate an 'product' object using Joi schema validation.
 *
 * @param {object} product - The product object to validate.
 * @returns {object} - A Joi validation result object.
 */
function validateProduct(product) {
  const schema = Joi.object({
    //https://www.youtube.com/watch?v=u9kxYilQ9l8
    name: Joi.string().min(1).max(255).required(),
    iconName: Joi.string().min(1).max(255).required(),
    brandName: Joi.string().min(1).max(255).required(),
  });

  return schema.validate(product);
}

exports.Product = Product;
exports.Brand = Brand;
exports.validateProduct = validateProduct;
