const mongoose = require("mongoose");
const Joi = require("joi");

const technicianSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    minlength: 1,
    maxlength: 50,
  },
  email: {
    type: String,
    minlength: 1,
    maxlength: 255,
  },
  phone: {
    type: String,
    required: true,
    minlength: 1,
    maxlength: 15,
  },
  whatsappNumber: {
    type: String,
    minlength: 1,
    maxlength: 15,
  },
  region: {
    type: String,
    required: true,
    minlength: 1,
    maxlength: 255,
  },
  city: {
    type: String,
    required: true,
    minlength: 1,
    maxlength: 255,
  },
  area: {
    type: String,
    required: true,
    minlength: 1,
    maxlength: 255,
  },
  location: {
    type: String,
    required: true,
    minlength: 1,
    maxlength: 255,
  },
  agent: {
    type: new mongoose.Schema({
      name: {
        type: String,
        required: true,
        minlength: 1,
        maxlength: 50,
      },
      phone: {
        type: String,
        required: true,
        minlength: 1,
        maxlength: 15,
      },
      region: {
        type: String,
        required: true,
        minlength: 1,
        maxlength: 255,
      },
      city: {
        type: String,
        required: true,
        minlength: 1,
        maxlength: 255,
      },
    }),

    require: true,
  },
});
const Technician = mongoose.model("Technician", technicianSchema);

function validateTechnician(technician) {
  const schema = Joi.object({
    name: Joi.string().min(1).max(50).required(),
    email: Joi.string().min(1).max(255).email(),
    phone: Joi.string().min(1).max(15).required(),
    whatsappNumber: Joi.string().min(1).max(15),
    region: Joi.string().min(1).max(255).required(),
    city: Joi.string().min(1).max(255).required(),
    area: Joi.string().min(1).max(255).required(),
    location: Joi.string().min(1).max(255).required(),
    agentId: Joi.objectId().required(),
  });

  return schema.validate(technician);
}

exports.Technician = Technician;
exports.validateTechnician = validateTechnician;
