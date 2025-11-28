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
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);