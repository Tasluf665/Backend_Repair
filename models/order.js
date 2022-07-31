const mongoose = require("mongoose");
const Joi = require("joi");

const statusSchema = new mongoose.Schema({
  statusDetails: {
    type: String,
    required: true,
    minlength: 1,
    maxlength: 255,
  },
  statusState: {
    type: String,
    required: true,
    minlength: 1,
    maxlength: 50,
  },
  time: {
    type: Date,
    required: true,
    default: Date.now,
  },
});

const Status = mongoose.model("Status", statusSchema);

const paymentSchema = new mongoose.Schema({
  Invoice_Number: {
    type: String,
    required: true,
    minlength: 1,
    maxlength: 255,
  },
  phone: {
    type: String,
    required: true,
    minlength: 1,
    maxlength: 50,
  },
  time: {
    type: Date,
    required: true,
    default: Date.now,
  },
  amount: {
    type: Number,
    min: 0,
    required: true,
  },
  Transaction_ID: {
    type: String,
    required: true,
    minlength: 1,
    maxlength: 255,
  },
});

const Payment = mongoose.model("Payment", paymentSchema);

const orderSchema = new mongoose.Schema({
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
  address: {
    type: String,
    required: true,
    minlength: 1,
    maxlength: 255,
  },
  bookingTime: {
    type: Date,
    required: true,
    default: Date.now,
  },
  arrivalTime: {
    type: String,
    required: true,
    minlength: 1,
    maxlength: 50,
  },
  category: {
    type: String,
    required: true,
    minlength: 1,
    maxlength: 50,
  },
  categoryType: {
    type: String,
    required: true,
    minlength: 1,
    maxlength: 50,
  },
  product: {
    type: String,
    required: true,
    minlength: 1,
    maxlength: 50,
  },
  type: {
    type: String,
    required: true,
    minlength: 1,
    maxlength: 50,
  },
  problem: {
    type: String,
    required: true,
    minlength: 1,
    maxlength: 1024,
  },
  note: {
    type: String,
    minlength: 1,
    maxlength: 255,
  },
  technicianId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Technician",
  },
  amount: {
    type: Number,
    min: 0,
  },
  status: {
    type: [statusSchema],
    required: true,
  },
  status: {
    type: [paymentSchema],
  },
});
const Order = mongoose.model("Order", orderSchema);

function validateOrder(order) {
  const schema = Joi.object({
    name: Joi.string().min(1).max(50).required(),
    phone: Joi.string().min(1).max(15).required(),
    address: Joi.string().min(1).max(255).required(),
    arrivalTime: Joi.string().min(1).max(50).required(),
    category: Joi.string().min(1).max(50).required(),
    categoryType: Joi.string().min(1).max(50).required(),
    product: Joi.string().min(1).max(50).required(),
    type: Joi.string().min(1).max(50).required(),
    problem: Joi.string().min(1).max(1024).required(),
    note: Joi.string().min(1).max(255).required(),
    statusDetails: Joi.string().min(1).max(255).required(),
    statusState: Joi.string().min(1).max(50).required(),
  });

  return schema.validate(order);
}

exports.Order = Order;
exports.Status = Status;
exports.Payment = Payment;
exports.validateOrder = validateOrder;
