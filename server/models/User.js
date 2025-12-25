// server/models/User.js
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true },
    email:    { type: String, required: true, unique: true },
    password: { type: String, required: true }, // TODO: hash in real app
    points:   { type: Number, default: 0 },

    predictions: [
      {
        match: String,
        predictedResult: String,
        isCorrect: Boolean,
      },
    ],

    bookings: [
      {
        title: String,
        date: Date,
      },
    ],

    // Game Stats for Prediction Game
    gameStats: {
      totalPoints: {
        type: Number,
        default: 0,
      },
      level: {
        type: Number,
        default: 1,
      },
      totalPredictions: {
        type: Number,
        default: 0,
      },
      perfectPredictions: {
        type: Number,
        default: 0,
      },
      correctWinners: {
        type: Number,
        default: 0,
      },
      currentStreak: {
        type: Number,
        default: 0,
      },
      longestStreak: {
        type: Number,
        default: 0,
      },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);