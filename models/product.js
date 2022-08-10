const mongoose = require("mongoose");
const Joi = require("joi");

const modelSchema = new mongoose.Schema({
  modelName: {
    type: String,
    required: true,
    minlength: 1,
    maxlength: 255,
  },
});

const brandSchema = new mongoose.Schema({
  brandName: {
    type: String,
    required: true,
    minlength: 1,
    maxlength: 255,
  },
  models: [modelSchema],
});

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
    type: [brandSchema],
    required: true,
  },
});
const Product = mongoose.model("Product", productSchema);

function validateProduct(product) {
  const schema = Joi.object({
    name: Joi.string().min(1).max(255).required(),
    iconName: Joi.string().min(1).max(255).required(),
    brandName: Joi.string().min(1).max(255).required(),
  });

  return schema.validate(product);
}

exports.Product = Product;
exports.validateProduct = validateProduct;
