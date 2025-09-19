const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI); // Removed deprecated options, Mongoose 6+ handles these by default
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (err) {
    console.error(`Error connecting to MongoDB: ${err.message}`);
    // TODO: Implement a more robust error handling strategy, e.g., retry mechanism or logging to a dedicated service.
    process.exit(1);
  }
};

module.exports = connectDB;