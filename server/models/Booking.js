// server/models/Booking.js
const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  matchId: {
    type: String,
    required: true,
  },
  matchName: {
    type: String,
    required: true,
  },
  matchDate: {
    type: Date,
    required: false,
  },
  section: {
    type: String,
    required: true,
  },
  row: {
    type: Number,
    required: true,
  },
  seatNumber: {
    type: Number,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  matchScore: {
    type: Number,
    default: 0,
  },
  bookingDate: {
    type: Date,
    default: Date.now,
  },
  status: {
    type: String,
    enum: ['confirmed', 'cancelled'],
    default: 'confirmed',
  },
}, { timestamps: true });

module.exports = mongoose.model('Booking', bookingSchema);