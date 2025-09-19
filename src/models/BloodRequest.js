const mongoose = require('mongoose');

const BloodRequestSchema = new mongoose.Schema({
  recipientId: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
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
    required: true
  },
  urgency: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  status: {
    type: String,
    enum: ['pending', 'matched', 'fulfilled', 'cancelled'],
    default: 'pending'
  },
  matchedDonorIds: [{
    type: mongoose.Schema.ObjectId,
    ref: 'User'
  }],
  // TODO: Add a field to store the expiry date of the blood request.
  // expiryDate: {
  //   type: Date,
  //   required: true
  // },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// Index for efficient querying by recipient, hospital, bloodType, and status
BloodRequestSchema.index({ recipientId: 1, hospitalId: 1, bloodType: 1, status: 1 });
BloodRequestSchema.index({ bloodType: 1, urgency: 1, status: 1 });
// TODO: Add indexes for fields that will be frequently queried, e.g., status and createdAt.

module.exports = mongoose.model('BloodRequest', BloodRequestSchema);