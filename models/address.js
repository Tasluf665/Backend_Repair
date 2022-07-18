const mongoose = require("mongoose");
const Joi = require("joi");

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
const Address = mongoose.model("Address", addressSchema);

function validateAddress(address) {
  const schema = Joi.object({
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
