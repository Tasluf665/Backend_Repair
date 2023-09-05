/**
 * Middleware for handling asynchronous route handlers with error handling.
 *
 * This middleware function is designed to wrap asynchronous route handlers and handle any exceptions that may occur.
 * It allows route handlers to be written with asynchronous code using 'async/await' while automatically catching and forwarding errors.
 *
 * @param {function} handler - The asynchronous route handler function.
 * @returns {function} - A middleware function that handles asynchronous route handlers.
 * Source: Mosh -> NodeJS -> 11. Handling -> 4 - Removing Try Catch
 */
module.exports = function (handler) {
  return async (req, res, next) => {
    try {
      // Execute the provided asynchronous route handler and await its completion.
      await handler(req, res);
    } catch (ex) {
      // If an exception occurs during execution, pass it to the next middleware for error handling.
      next(ex);
    }
  };
};
