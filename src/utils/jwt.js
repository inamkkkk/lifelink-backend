const jwt = require('jsonwebtoken');
const config = require('../config/config'); // Import the config module

/**
 * Generates a JWT token for a given user ID.
 * @param {string} id - The user's ID.
 * @returns {string} The signed JWT token.
 */
const generateToken = (id) => {
  // TODO: Consider adding more claims to the token payload for better security and context.
  // For example, add roles, permissions, or expiration time directly in the payload.
  return jwt.sign({ id }, config.JWT_SECRET, {
    expiresIn: config.JWT_EXPIRE,
  });
};

/**
 * Verifies a JWT token.
 * @param {string} token - The JWT token to verify.
 * @returns {object | null} The decoded payload if valid, otherwise null.
 */
const verifyToken = (token) => {
  try {
    // TODO: Implement logic to handle token expiration gracefully.
    // Currently, expired tokens will result in an error, which is caught and returns null.
    // Consider returning specific error types or messages for expired tokens.
    return jwt.verify(token, config.JWT_SECRET);
  } catch (err) {
    // Log the error for debugging purposes, but don't expose sensitive info to the client.
    console.error('JWT Verification Error:', err.message);
    return null;
  }
};

module.exports = { generateToken, verifyToken };