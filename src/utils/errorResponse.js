/**
 * Custom error class for API responses.
 */
class ErrorResponse extends Error {
  /**
   * Creates an instance of ErrorResponse.
   * @param {string} message - The error message.
   * @param {number} statusCode - The HTTP status code.
   */
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
  }
}

module.exports = ErrorResponse;
