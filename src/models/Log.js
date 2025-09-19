const mongoose = require('mongoose');

const LogSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['info', 'warn', 'error', 'debug'],
    default: 'info',
  },
  module: {
    type: String,
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

// TODO: Add a query to find logs by a date range.
LogSchema.statics.findByDateRange = function (startDate, endDate) {
  return this.find({
    timestamp: {
      $gte: startDate,
      $lte: endDate,
    },
  });
};

LogSchema.index({ timestamp: -1 });
LogSchema.index({ type: 1, module: 1 });

module.exports = mongoose.model('Log', LogSchema);