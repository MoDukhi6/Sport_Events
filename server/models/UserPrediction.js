// server/models/UserPrediction.js
const mongoose = require('mongoose');

const userPredictionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  matchId: {
    type: String,
    required: true,
  },
  homeTeam: {
    name: String,
    id: Number,
  },
  awayTeam: {
    name: String,
    id: Number,
  },
  predictedHomeGoals: {
    type: Number,
    required: true,
  },
  predictedAwayGoals: {
    type: Number,
    required: true,
  },
  actualHomeGoals: {
    type: Number,
    default: null,
  },
  actualAwayGoals: {
    type: Number,
    default: null,
  },
  pointsEarned: {
    type: Number,
    default: 0,
  },
  status: {
    type: String,
    enum: ['pending', 'correct_score', 'correct_winner', 'wrong'],
    default: 'pending',
  },
  matchDate: {
    type: Date,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Index for faster queries
userPredictionSchema.index({ userId: 1, matchId: 1 }, { unique: true });
userPredictionSchema.index({ userId: 1, status: 1 });
userPredictionSchema.index({ matchDate: 1 });

module.exports = mongoose.model('UserPrediction', userPredictionSchema);