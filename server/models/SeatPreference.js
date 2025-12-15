// server/models/SeatPreference.js
const mongoose = require('mongoose');

const seatPreferenceSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
  },
  noiseLevel: {
    type: String,
    enum: ['quiet', 'moderate', 'loud'],
    default: 'moderate',
  },
  fieldProximity: {
    type: String,
    enum: ['close', 'medium', 'far'],
    default: 'medium',
  },
  viewType: {
    type: String,
    enum: ['central', 'side', 'corner'],
    default: 'central',
  },
  priceRange: {
    type: String,
    enum: ['budget', 'medium', 'premium'],
    default: 'medium',
  },
  familyFriendly: {
    type: Boolean,
    default: false,
  },
  accessibility: {
    type: Boolean,
    default: false,
  },
  satisfactionScore: {
    type: Number,
    default: 50,
    min: 0,
    max: 100,
  },
  totalBookings: {
    type: Number,
    default: 0,
  },
}, { timestamps: true });

module.exports = mongoose.model('SeatPreference', seatPreferenceSchema);