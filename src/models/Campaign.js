const mongoose = require('mongoose');

const CampaignSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please add a campaign title'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Please add a campaign description']
  },
  hospitalId: {
    type: mongoose.Schema.ObjectId,
    ref: 'Hospital',
    required: true
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      required: true
    },
    coordinates: {
      type: [Number],
      required: true,
      index: '2dsphere' // Geospatial index
    },
    properties: {
      city: String,
      country: String,
      address: String
    }
  },
  status: {
    type: String,
    enum: ['upcoming', 'ongoing', 'completed'],
    default: 'upcoming'
  },
  participants: [{
    type: mongoose.Schema.ObjectId,
    ref: 'User'
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// Ensure endDate is after startDate
CampaignSchema.pre('save', function (next) {
  if (this.startDate && this.endDate && this.startDate > this.endDate) {
    return next(new Error('End date must be after start date.'));
  }
  next();
});

CampaignSchema.index({ hospitalId: 1, status: 1 });
CampaignSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Campaign', CampaignSchema);