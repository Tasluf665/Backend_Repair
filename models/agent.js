const mongoose = require("mongoose");
const Joi = require("joi");

// Define a Mongoose schema for the 'agent' collection. Source: Mosh -> NodeJS course -> 7. CRUD  -> 5 - Schemas
const agentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    minlength: 1,
    maxlength: 50,
  },
  email: {
    type: String,
    minlength: 0,
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
    minlength: 0,
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
});

// Create a Mongoose model for the 'Agent' collection using the 'agentSchema'. Source: Mosh -> NodeJS course -> 7. CRUD  -> 6- Models
const Agent = mongoose.model("Agent", agentSchema);

/**
 * Validate an 'agent' object using Joi schema validation.
 *
 * @param {object} agent - The agent object to validate.
 * @returns {object} - A Joi validation result object.
 */
function validateAgent(agent) {
  const schema = Joi.object({
    //https://www.youtube.com/watch?v=u9kxYilQ9l8
    name: Joi.string().min(1).max(50).required(),
    email: Joi.string().min(0).max(255).email(),
    phone: Joi.string().min(1).max(15).required(),
    whatsappNumber: Joi.string().min(0).max(15),
    region: Joi.string().min(1).max(255).required(),
    city: Joi.string().min(1).max(255).required(),
    area: Joi.string().min(1).max(255).required(),
    location: Joi.string().min(1).max(255).required(),
  });

  return schema.validate(agent);
}

exports.Agent = Agent;
exports.validateAgent = validateAgent;
