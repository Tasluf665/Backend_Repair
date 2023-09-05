const mongoose = require("mongoose");
const Joi = require("joi");

// Define a Mongoose schema for the 'address' collection. Source: Mosh -> NodeJS course -> 7. CRUD  -> 5 - Schemas
const addressSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    minlength: 1,
    maxlength: 10,
  },
  name: {
    type: String,
    required: true,
    minlength: 1,
    maxlength: 255,
  },
  nameLocal: {
    type: String,
    required: true,
    minlength: 1,
    maxlength: 255,
  },
  parentId: {
    type: String,
    required: true,
    minlength: 1,
    maxlength: 10,
  },
  displayName: {
    type: String,
    required: true,
    minlength: 1,
    maxlength: 255,
  },
});

// Create a Mongoose model for the 'Address' collection using the 'addressSchema'. Source: Mosh -> NodeJS course -> 7. CRUD  -> 6- Models
const Address = mongoose.model("Address", addressSchema);

/**
 * Validate an 'address' object using Joi schema validation.
 *
 * @param {object} address - The address object to validate.
 * @returns {object} - A Joi validation result object.
 */
function validateAddress(address) {
  const schema = Joi.object({
    //https://www.youtube.com/watch?v=u9kxYilQ9l8
    id: Joi.string().min(1).max(10).required(),
    name: Joi.string().min(1).max(255).required(),
    nameLocal: Joi.string().min(1).max(255).required(),
    parentId: Joi.string().min(1).max(10).required(),
    displayName: Joi.string().min(1).max(255).required(),
  });

  return schema.validate(address);
}

exports.Address = Address;
exports.validateAddress = validateAddress;
