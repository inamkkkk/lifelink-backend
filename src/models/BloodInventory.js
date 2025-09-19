const mongoose = require('mongoose');

const BloodInventorySchema = new mongoose.Schema({
  hospitalId: {
    type: mongoose.Schema.ObjectId,
    ref: 'Hospital',
    required: true
  },
  bloodType: {
    type: String,
    enum: ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'],
    required: true
  },
  quantity: {
    type: Number, // in ml
    required: true,
    min: 0
  },
  expiryDate: {
    type: Date,
    required: true
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// Compound index for unique inventory per hospital and blood type
BloodInventorySchema.index({ hospitalId: 1, bloodType: 1 }, { unique: true });

module.exports = mongoose.model('BloodInventory', BloodInventorySchema);
