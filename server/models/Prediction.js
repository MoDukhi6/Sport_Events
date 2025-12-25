// server/models/Prediction.js
const mongoose = require('mongoose');

const predictionSchema = new mongoose.Schema({
  matchId: {
    type: String,
    required: true,
    unique: true,
  },
  homeTeam: {
    id: Number,
    name: String,
  },
  awayTeam: {
    id: Number,
    name: String,
  },
  predictions: {
    homeWin: Number,    // Percentage 0-100
    draw: Number,       // Percentage 0-100
    awayWin: Number,    // Percentage 0-100
  },
  confidence: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium',
  },
  factors: {
    recentForm: {
      home: [String],  // ['W', 'L', 'D', 'W', 'W']
      away: [String],
    },
    headToHead: {
      homeWins: Number,
      draws: Number,
      awayWins: Number,
      lastResult: String,
    },
    homeAdvantage: {
      homeWinRate: Number,
      awayWinRate: Number,
    },
    goalsAverage: {
      homeScored: Number,
      homeConceded: Number,
      awayScored: Number,
      awayConceded: Number,
    },
  },
  lastUpdated: {
    type: Date,
    default: Date.now,
  },
}, { timestamps: true });

module.exports = mongoose.model('Prediction', predictionSchema);