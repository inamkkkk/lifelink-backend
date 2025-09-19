// Add other environment-dependent configs here
module.exports = {
  PORT: process.env.PORT || 5000,
  MONGO_URI: process.env.MONGO_URI,
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_EXPIRE: process.env.JWT_EXPIRE || '1d', // Default to 1 day if not set
  GEOCODE_API_KEY: process.env.GEOCODE_API_KEY,
};