/**
 * Wrapper for async route handlers to catch errors and pass them to the error handling middleware.
 * @param {Function} fn - The asynchronous function to wrap.
 * @returns {Function} An Express middleware function.
 */
const asyncHandler = (fn) => async (req, res, next) => {
  try {
    await fn(req, res, next);
  } catch (error) {
    // TODO: Add more specific error handling or logging here if needed.
    // For now, we pass the error to the next middleware in the chain.
    next(error);
  }
};

module.exports = asyncHandler;