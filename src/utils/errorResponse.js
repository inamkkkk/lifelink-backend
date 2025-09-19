/**
 * Custom error class for API responses.
 */
class ErrorResponse extends Error {
  /**
   * Creates an instance of ErrorResponse.
   * @param {string} message - The error message.
   * @param {number} statusCode - The HTTP status code.
   * @param {object} [details] - Optional additional details about the error.
   */
  constructor(message, statusCode, details) {
    super(message);

    // Ensure the name of this error is the same as the class name
    this.name = this.constructor.name;

    this.statusCode = statusCode;
    this.details = details;

    // Capturing the stack trace, excluding constructor call from it.
    // This is a common practice for custom error classes in Node.js
    // to ensure the stack trace is cleaner and points to the actual error origin.
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

module.exports = ErrorResponse;