const mongoose = require('mongoose');

const DonationSchema = new mongoose.Schema({
  donorId: {
    type: mongoose.Schema.Types.ObjectId, // Corrected: Use Types.ObjectId
    ref: 'User',
    required: true
  },
  hospitalId: {
    type: mongoose.Schema.Types.ObjectId, // Corrected: Use Types.ObjectId
    ref: 'Hospital',
    required: true
  },
  bloodType: {
    type: String,
    enum: ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'],
    required: true
  },
  status: {
    type: String,
    enum: ['scheduled', 'in_progress', 'completed', 'cancelled'],
    default: 'scheduled'
  },
  appointmentDate: {
    type: Date,
    required: true
  },
  quantity: {
    type: Number, // in ml
    required: true
  },
  notes: {
    type: String,
    maxlength: 500
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// Index for efficient querying by donor, hospital, and status
DonationSchema.index({ donorId: 1, hospitalId: 1, status: 1 });

module.exports = mongoose.model('Donation', DonationSchema);