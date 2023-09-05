/**
 * Error handling middleware for handling uncaught exceptions.
 *
 * This middleware function is used to handle uncaught exceptions that occur during the request processing pipeline.
 * It responds with a 500 Internal Server Error status code and a generic error message.
 *
 * @param {Error} err - The error object representing the uncaught exception.
 * @param {object} req - The HTTP request object.
 * @param {object} res - The HTTP response object.
 * @param {function} next - The next middleware function in the Express.js middleware chain.
 */
module.exports = function (err, req, res, next) {
  // Set a 500 Internal Server Error status code and send a generic error message.
  res.status(500).send("Something failed");
};
