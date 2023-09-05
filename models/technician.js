const mongoose = require("mongoose");
const Joi = require("joi");

// Define a Mongoose schema for the 'technician' collection. Source: Mosh -> NodeJS course -> 7. CRUD  -> 5 - Schemas
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
      //Source: Mosh -> NodeJS course -> 9. Mongoose -> 4 - Embedding Documents
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

// Create a Mongoose model for the 'Technician' collection using the 'addressSchema'. Source: Mosh -> NodeJS course -> 7. CRUD  -> 6- Models
const Technician = mongoose.model("Technician", technicianSchema);

/**
 * Validate an 'technician' object using Joi schema validation.
 *
 * @param {object} technician - The technician object to validate.
 * @returns {object} - A Joi validation result object.
 */
function validateTechnician(technician) {
  const schema = Joi.object({
    //https://www.youtube.com/watch?v=u9kxYilQ9l8
    name: Joi.string().min(1).max(50).required(),
    email: Joi.string().min(1).max(255).email(),
    phone: Joi.string().min(1).max(15).required(),
    whatsappNumber: Joi.string().min(1).max(15),
    region: Joi.string().min(1).max(255).required(),
    city: Joi.string().min(1).max(255).required(),
    area: Joi.string().min(1).max(255).required(),
    location: Joi.string().min(1).max(255).required(),
    agentId: Joi.objectId().required(), //Source: Mosh -> NodeJS course -> 9. Mongoose - Modeling -> 10 - Validating ObjectIDs
  });

  return schema.validate(technician);
}

exports.Technician = Technician;
exports.validateTechnician = validateTechnician;
