module.exports = {
  PORT: process.env.PORT || 5000,
  MONGO_URI: process.env.MONGO_URI,
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_EXPIRE: process.env.JWT_EXPIRE,
  GEOCODE_API_KEY: process.env.GEOCODE_API_KEY,
  // Add other environment-dependent configs here
};
