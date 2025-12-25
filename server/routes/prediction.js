// server/routes/prediction.js
const express = require('express');
const router = express.Router();
const axios = require('axios');
const predictionService = require('../ml/predictionService');

const api = axios.create({
  baseURL: 'https://v3.football.api-sports.io',
  headers: {
    'x-apisports-key': process.env.API_FOOTBALL_KEY,
  },
});

// Helper function to analyze H2H matches
function analyzeHeadToHead(h2hMatches, homeTeamId, awayTeamId) {
  if (!h2hMatches || h2hMatches.length === 0) {
    return {
      homeWins: 0,
      draws: 0,
      awayWins: 0,
      totalMatches: 0,
      lastResult: null,
      matches: []
    };
  }

  let homeWins = 0;
  let draws = 0;
  let awayWins = 0;

  h2hMatches.forEach(match => {
    const homeGoals = match.goals.home;
    const awayGoals = match.goals.away;
    const matchHomeId = match.teams.home.id;

    // Determine winner from perspective of current home team
    if (homeGoals === awayGoals) {
      draws++;
    } else if (matchHomeId === homeTeamId) {
      // Home team in this H2H match is same as current home team
      if (homeGoals > awayGoals) homeWins++;
      else awayWins++;
    } else {
      // Home team in this H2H match is the current away team
      if (homeGoals > awayGoals) awayWins++;
      else homeWins++;
    }
  });

  // Get last result
  const lastMatch = h2hMatches[0];
  const lastResult = lastMatch 
    ? `${lastMatch.teams.home.name} ${lastMatch.goals.home} - ${lastMatch.goals.away} ${lastMatch.teams.away.name}`
    : null;

  return {
    homeWins,
    draws,
    awayWins,
    totalMatches: h2hMatches.length,
    lastResult,
    matches: h2hMatches.slice(0, 5).map(m => ({
      date: m.fixture.date,
      homeTeam: m.teams.home.name,
      awayTeam: m.teams.away.name,
      homeGoals: m.goals.home,
      awayGoals: m.goals.away,
      winner: m.goals.home > m.goals.away ? 'home' : m.goals.home < m.goals.away ? 'away' : 'draw'
    }))
  };
}

// Helper function to analyze recent form
function analyzeRecentForm(matches, teamId) {
  if (!matches || matches.length === 0) {
    return [];
  }

  return matches.slice(0, 5).map(match => {
    const isHome = match.teams.home.id === teamId;
    const teamGoals = isHome ? match.goals.home : match.goals.away;
    const oppGoals = isHome ? match.goals.away : match.goals.home;

    if (teamGoals > oppGoals) return 'W';
    if (teamGoals < oppGoals) return 'L';
    return 'D';
  });
}

// Calculate goals average from recent matches
function calculateGoalsAverage(matches, teamId) {
  if (!matches || matches.length === 0) {
    return { scored: 0, conceded: 0 };
  }

  let totalScored = 0;
  let totalConceded = 0;

  matches.slice(0, 5).forEach(match => {
    const isHome = match.teams.home.id === teamId;
    const scored = isHome ? match.goals.home : match.goals.away;
    const conceded = isHome ? match.goals.away : match.goals.home;

    totalScored += scored || 0;
    totalConceded += conceded || 0;
  });

  return {
    scored: Math.round((totalScored / Math.min(matches.length, 5)) * 10) / 10,
    conceded: Math.round((totalConceded / Math.min(matches.length, 5)) * 10) / 10
  };
}

// Calculate home/away advantage
function calculateHomeAwayStats(matches, teamId) {
  if (!matches || matches.length === 0) {
    return { homeWinRate: 0, awayWinRate: 0 };
  }

  let homeWins = 0;
  let homeMatches = 0;
  let awayWins = 0;
  let awayMatches = 0;

  matches.forEach(match => {
    const isHome = match.teams.home.id === teamId;
    const won = isHome 
      ? match.goals.home > match.goals.away 
      : match.goals.away > match.goals.home;

    if (isHome) {
      homeMatches++;
      if (won) homeWins++;
    } else {
      awayMatches++;
      if (won) awayWins++;
    }
  });

  return {
    homeWinRate: homeMatches > 0 ? Math.round((homeWins / homeMatches) * 100) : 0,
    awayWinRate: awayMatches > 0 ? Math.round((awayWins / awayMatches) * 100) : 0
  };
}

// Get prediction for a specific match (ML-powered + Complete Live Data)
router.get('/match/:matchId', async (req, res) => {
  try {
    const { matchId } = req.params;

    console.log(`🤖 ML Prediction requested for match ${matchId}`);

    // Fetch match details
    const matchResponse = await api.get('/fixtures', { params: { id: matchId } });
    const match = matchResponse.data.response[0];

    if (!match) {
      return res.status(404).json({ error: 'Match not found' });
    }

    const homeTeamId = match.teams.home.id;
    const awayTeamId = match.teams.away.id;
    const homeTeamName = match.teams.home.name;
    const awayTeamName = match.teams.away.name;
    const leagueId = match.league.id;
    const season = match.league.season;

    console.log(`📊 Fetching comprehensive data for ${homeTeamName} vs ${awayTeamName}`);

    // Fetch ALL data in parallel (maximum efficiency)
    const [
      h2hResponse,
      homeRecentResponse,
      awayRecentResponse,
      homeStatsResponse,
      awayStatsResponse
    ] = await Promise.all([
      // Head-to-head history
      api.get('/fixtures/headtohead', { 
        params: { h2h: `${homeTeamId}-${awayTeamId}` } 
      }).catch(() => ({ data: { response: [] } })),
      
      // Home team recent matches (last 10 for better stats)
      api.get('/fixtures', { 
        params: { team: homeTeamId, last: 10 } 
      }).catch(() => ({ data: { response: [] } })),
      
      // Away team recent matches (last 10 for better stats)
      api.get('/fixtures', { 
        params: { team: awayTeamId, last: 10 } 
      }).catch(() => ({ data: { response: [] } })),
      
      // Home team statistics for current season
      api.get('/teams/statistics', { 
        params: { team: homeTeamId, season: season, league: leagueId } 
      }).catch(() => ({ data: { response: null } })),
      
      // Away team statistics for current season
      api.get('/teams/statistics', { 
        params: { team: awayTeamId, season: season, league: leagueId } 
      }).catch(() => ({ data: { response: null } }))
    ]);

    const h2hMatches = h2hResponse.data.response || [];
    const homeMatches = homeRecentResponse.data.response || [];
    const awayMatches = awayRecentResponse.data.response || [];
    const homeStats = homeStatsResponse.data.response;
    const awayStats = awayStatsResponse.data.response;

    console.log(`✅ Data fetched: ${h2hMatches.length} H2H, ${homeMatches.length} home matches, ${awayMatches.length} away matches`);

    // Get ML prediction (from trained model)
    const prediction = await predictionService.predict(
      homeTeamId,
      awayTeamId,
      homeTeamName,
      awayTeamName
    );

    // Analyze all the fetched data
    const h2hAnalysis = analyzeHeadToHead(h2hMatches, homeTeamId, awayTeamId);
    const homeForm = analyzeRecentForm(homeMatches, homeTeamId);
    const awayForm = analyzeRecentForm(awayMatches, awayTeamId);
    const homeGoals = calculateGoalsAverage(homeMatches, homeTeamId);
    const awayGoals = calculateGoalsAverage(awayMatches, awayTeamId);
    const homeAdvantage = calculateHomeAwayStats(homeMatches, homeTeamId);
    const awayAdvantage = calculateHomeAwayStats(awayMatches, awayTeamId);

    // Build comprehensive response
    const response = {
      matchId,
      homeTeam: { id: homeTeamId, name: homeTeamName },
      awayTeam: { id: awayTeamId, name: awayTeamName },
      
      // ML predictions (from trained model)
      predictions: prediction.predictions,
      confidence: prediction.confidence,
      
      // Live data factors
      factors: {
        // Recent form (last 5 matches)
        recentForm: {
          home: homeForm.length > 0 ? homeForm : ['W', 'L', 'D', 'W', 'L'],
          away: awayForm.length > 0 ? awayForm : ['L', 'W', 'D', 'L', 'W'],
        },
        
        // Head-to-head history
        headToHead: {
          homeWins: h2hAnalysis.homeWins,
          draws: h2hAnalysis.draws,
          awayWins: h2hAnalysis.awayWins,
          totalMatches: h2hAnalysis.totalMatches,
          lastResult: h2hAnalysis.lastResult || 'N/A',
          matches: h2hAnalysis.matches || []
        },
        
        // Home advantage statistics
        homeAdvantage: {
          homeWinRate: homeAdvantage.homeWinRate || prediction.factors.homeAdvantage.homeWinRate,
          awayWinRate: awayAdvantage.awayWinRate || prediction.factors.homeAdvantage.awayWinRate,
        },
        
        // Goals average (from recent matches)
        goalsAverage: {
          homeScored: homeGoals.scored || prediction.factors.goalsAverage.homeScored,
          homeConceded: homeGoals.conceded || prediction.factors.goalsAverage.homeConceded,
          awayScored: awayGoals.scored || prediction.factors.goalsAverage.awayScored,
          awayConceded: awayGoals.conceded || prediction.factors.goalsAverage.awayConceded,
        },
      },
      
      // Additional season statistics (if available)
      seasonStats: {
        home: homeStats ? {
          played: homeStats.fixtures.played.total,
          wins: homeStats.fixtures.wins.total,
          draws: homeStats.fixtures.draws.total,
          losses: homeStats.fixtures.loses.total,
          goalsFor: homeStats.goals.for.total.total,
          goalsAgainst: homeStats.goals.against.total.total,
          cleanSheets: homeStats.clean_sheet.total,
          failedToScore: homeStats.failed_to_score.total,
        } : null,
        away: awayStats ? {
          played: awayStats.fixtures.played.total,
          wins: awayStats.fixtures.wins.total,
          draws: awayStats.fixtures.draws.total,
          losses: awayStats.fixtures.loses.total,
          goalsFor: awayStats.goals.for.total.total,
          goalsAgainst: awayStats.goals.against.total.total,
          cleanSheets: awayStats.clean_sheet.total,
          failedToScore: awayStats.failed_to_score.total,
        } : null
      }
    };

    console.log(`✅ ML Prediction: ${homeTeamName} ${response.predictions.homeWin}% - Draw ${response.predictions.draw}% - ${awayTeamName} ${response.predictions.awayWin}%`);
    console.log(`📊 H2H: ${h2hAnalysis.homeWins}-${h2hAnalysis.draws}-${h2hAnalysis.awayWins} (${h2hAnalysis.totalMatches} matches)`);
    console.log(`⚽ Goals avg: ${homeGoals.scored} vs ${awayGoals.scored}`);

    res.json(response);
    
  } catch (err) {
    console.error('❌ Error generating prediction:', err.message);
    
    if (err.message === 'Team not found in training data') {
      return res.status(404).json({ 
        error: 'Teams not in training data',
        message: 'One or both teams were not included in the training dataset. Prediction not available.'
      });
    }
    
    res.status(500).json({ 
      error: 'Failed to generate prediction',
      details: err.message 
    });
  }
});

module.exports = router;