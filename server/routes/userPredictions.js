// server/routes/userPredictions.js
const express = require('express');
const router = express.Router();
const UserPrediction = require('../models/UserPrediction');
const User = require('../models/User');
const axios = require('axios');

const api = axios.create({
  baseURL: 'https://v3.football.api-sports.io',
  headers: {
    'x-apisports-key': process.env.API_FOOTBALL_KEY,
  },
});

// Calculate level based on points
function calculateLevel(points) {
  return Math.floor(points / 20) + 1;
}

// Get badge based on level
function getBadge(level) {
  if (level >= 20) return { name: 'Legend', icon: '👑', color: '#fbbf24' };
  if (level >= 10) return { name: 'Expert', icon: '🏆', color: '#3b82f6' };
  if (level >= 5) return { name: 'Pro', icon: '⭐', color: '#8b5cf6' };
  return { name: 'Beginner', icon: '🎮', color: '#10b981' };
}

// Create a new prediction
router.post('/', async (req, res) => {
  try {
    const { userId, matchId, homeTeam, awayTeam, predictedHomeGoals, predictedAwayGoals, matchDate } = req.body;

    // Check if user already predicted this match
    const existing = await UserPrediction.findOne({ userId, matchId });
    if (existing) {
      return res.status(400).json({ error: 'You have already predicted this match' });
    }

    // Create prediction
    const prediction = new UserPrediction({
      userId,
      matchId,
      homeTeam,
      awayTeam,
      predictedHomeGoals,
      predictedAwayGoals,
      matchDate,
    });

    await prediction.save();

    // Update user stats
    await User.findByIdAndUpdate(userId, {
      $inc: { 'gameStats.totalPredictions': 1 },
    });

    res.json({ success: true, prediction });
  } catch (err) {
    console.error('Error creating prediction:', err);
    res.status(500).json({ error: 'Failed to create prediction' });
  }
});

// Get user's predictions
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { status } = req.query;

    const query = { userId };
    if (status) query.status = status;

    const predictions = await UserPrediction.find(query).sort({ matchDate: -1 }).limit(50);

    res.json(predictions);
  } catch (err) {
    console.error('Error fetching predictions:', err);
    res.status(500).json({ error: 'Failed to fetch predictions' });
  }
});

// Get user game stats
router.get('/stats/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const stats = user.gameStats || {
      totalPoints: 0,
      level: 1,
      totalPredictions: 0,
      perfectPredictions: 0,
      correctWinners: 0,
      currentStreak: 0,
      longestStreak: 0,
    };

    const level = calculateLevel(stats.totalPoints);
    const badge = getBadge(level);
    const successRate = stats.totalPredictions > 0
      ? Math.round(((stats.perfectPredictions + stats.correctWinners) / stats.totalPredictions) * 100)
      : 0;

    res.json({
      ...stats,
      level,
      badge,
      successRate,
      pointsToNextLevel: (level * 20) - stats.totalPoints,
    });
  } catch (err) {
    console.error('Error fetching stats:', err);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// Check if match result is available and update predictions (manual trigger for specific user)
router.post('/check-results', async (req, res) => {
  try {
    const { userId } = req.body;

    // Find all pending predictions for this user
    const predictions = await UserPrediction.find({ userId, status: 'pending' });

    let checkedMatches = 0;
    let updatedPredictions = 0;

    for (const prediction of predictions) {
      try {
        // Fetch match result from API
        const matchResponse = await api.get('/fixtures', { params: { id: prediction.matchId } });
        const match = matchResponse.data.response[0];

        if (!match || match.fixture.status.short !== 'FT') {
          continue; // Skip if match not finished
        }

        const actualHomeGoals = match.goals.home;
        const actualAwayGoals = match.goals.away;

        let pointsEarned = 0;
        let status = 'wrong';

        // Check if exact score
        if (
          prediction.predictedHomeGoals === actualHomeGoals &&
          prediction.predictedAwayGoals === actualAwayGoals
        ) {
          pointsEarned = 3;
          status = 'correct_score';
        }
        // Check if correct winner
        else {
          const predictedWinner =
            prediction.predictedHomeGoals > prediction.predictedAwayGoals
              ? 'home'
              : prediction.predictedHomeGoals < prediction.predictedAwayGoals
              ? 'away'
              : 'draw';

          const actualWinner =
            actualHomeGoals > actualAwayGoals ? 'home' : actualHomeGoals < actualAwayGoals ? 'away' : 'draw';

          if (predictedWinner === actualWinner) {
            pointsEarned = 1;
            status = 'correct_winner';
          }
        }

        // Update prediction
        prediction.actualHomeGoals = actualHomeGoals;
        prediction.actualAwayGoals = actualAwayGoals;
        prediction.pointsEarned = pointsEarned;
        prediction.status = status;
        await prediction.save();

        // Update user stats
        const user = await User.findById(prediction.userId);
        if (user) {
          user.gameStats.totalPoints += pointsEarned;
          user.gameStats.level = calculateLevel(user.gameStats.totalPoints);

          if (status === 'correct_score') {
            user.gameStats.perfectPredictions += 1;
            user.gameStats.currentStreak += 1;
          } else if (status === 'correct_winner') {
            user.gameStats.correctWinners += 1;
            user.gameStats.currentStreak += 1;
          } else {
            user.gameStats.currentStreak = 0;
          }

          if (user.gameStats.currentStreak > user.gameStats.longestStreak) {
            user.gameStats.longestStreak = user.gameStats.currentStreak;
          }

          await user.save();
        }

        updatedPredictions++;
        checkedMatches++;
      } catch (err) {
        console.error(`Error checking match ${prediction.matchId}:`, err.message);
      }
    }

    res.json({ success: true, checkedMatches, updatedPredictions });
  } catch (err) {
    console.error('Error checking results:', err);
    res.status(500).json({ error: 'Failed to check results' });
  }
});

// Check ALL pending predictions (for cron job)
router.post('/check-all-results', async (req, res) => {
  try {
    // Find all pending predictions with matches that should have finished
    const now = new Date();
    const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000); // 2 hours buffer

    const pendingPredictions = await UserPrediction.find({
      status: 'pending',
      matchDate: { $lt: twoHoursAgo }, // Match should have finished at least 2 hours ago
    });

    console.log(`Found ${pendingPredictions.length} pending predictions to check`);

    let checkedMatches = 0;
    let updatedPredictions = 0;

    // Group predictions by matchId to avoid duplicate API calls
    const matchGroups = {};
    pendingPredictions.forEach((pred) => {
      if (!matchGroups[pred.matchId]) {
        matchGroups[pred.matchId] = [];
      }
      matchGroups[pred.matchId].push(pred);
    });

    // Check each unique match
    for (const matchId of Object.keys(matchGroups)) {
      try {
        // Fetch match result from API
        const matchResponse = await api.get('/fixtures', { params: { id: matchId } });
        const match = matchResponse.data.response[0];

        if (!match) {
          console.log(`Match ${matchId} not found in API`);
          continue;
        }

        const status = match.fixture.status.short;

        // Only process if match is finished
        if (status === 'FT' || status === 'AET' || status === 'PEN') {
          const actualHomeGoals = match.goals.home;
          const actualAwayGoals = match.goals.away;

          // Update all predictions for this match
          for (const prediction of matchGroups[matchId]) {
            let pointsEarned = 0;
            let predictionStatus = 'wrong';

            // Check if exact score
            if (
              prediction.predictedHomeGoals === actualHomeGoals &&
              prediction.predictedAwayGoals === actualAwayGoals
            ) {
              pointsEarned = 3;
              predictionStatus = 'correct_score';
            }
            // Check if correct winner
            else {
              const predictedWinner =
                prediction.predictedHomeGoals > prediction.predictedAwayGoals
                  ? 'home'
                  : prediction.predictedHomeGoals < prediction.predictedAwayGoals
                  ? 'away'
                  : 'draw';

              const actualWinner =
                actualHomeGoals > actualAwayGoals ? 'home' : actualHomeGoals < actualAwayGoals ? 'away' : 'draw';

              if (predictedWinner === actualWinner) {
                pointsEarned = 1;
                predictionStatus = 'correct_winner';
              }
            }

            // Update prediction
            prediction.actualHomeGoals = actualHomeGoals;
            prediction.actualAwayGoals = actualAwayGoals;
            prediction.pointsEarned = pointsEarned;
            prediction.status = predictionStatus;
            await prediction.save();

            // Update user stats
            const user = await User.findById(prediction.userId);
            if (user) {
              user.gameStats.totalPoints += pointsEarned;
              user.gameStats.level = calculateLevel(user.gameStats.totalPoints);

              if (predictionStatus === 'correct_score') {
                user.gameStats.perfectPredictions += 1;
                user.gameStats.currentStreak += 1;
              } else if (predictionStatus === 'correct_winner') {
                user.gameStats.correctWinners += 1;
                user.gameStats.currentStreak += 1;
              } else {
                user.gameStats.currentStreak = 0;
              }

              if (user.gameStats.currentStreak > user.gameStats.longestStreak) {
                user.gameStats.longestStreak = user.gameStats.currentStreak;
              }

              await user.save();
            }

            updatedPredictions++;
          }

          checkedMatches++;
        }
      } catch (err) {
        console.error(`Error checking match ${matchId}:`, err.message);
      }
    }

    res.json({
      success: true,
      checkedMatches,
      updatedPredictions,
      totalPending: pendingPredictions.length,
    });
  } catch (err) {
    console.error('Error in check-all-results:', err);
    res.status(500).json({ error: err.message });
  }
});

// Get leaderboard
router.get('/leaderboard', async (req, res) => {
  try {
    const topUsers = await User.find()
      .sort({ 'gameStats.totalPoints': -1 })
      .limit(10)
      .select('username email gameStats');

    const leaderboard = topUsers.map((user, index) => ({
      rank: index + 1,
      name: user.username || user.email || 'Unknown',
      points: user.gameStats.totalPoints || 0,
      level: calculateLevel(user.gameStats.totalPoints || 0),
      badge: getBadge(calculateLevel(user.gameStats.totalPoints || 0)),
      predictions: user.gameStats.totalPredictions || 0,
      successRate: user.gameStats.totalPredictions > 0
        ? Math.round(
            ((user.gameStats.perfectPredictions + user.gameStats.correctWinners) /
              user.gameStats.totalPredictions) *
              100
          )
        : 0,
    }));

    res.json(leaderboard);
  } catch (err) {
    console.error('Error fetching leaderboard:', err);
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
});

module.exports = router;