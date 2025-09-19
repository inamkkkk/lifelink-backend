/**
 * Wrapper for async route handlers to catch errors and pass them to the error handling middleware.
 * @param {Function} fn - The asynchronous function to wrap.
 * @returns {Function} An Express middleware function.
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;
