// server/utils/predictionEngine.js

/**
 * Calculate match prediction based on various factors
 * @param {Object} homeTeam - Home team data
 * @param {Object} awayTeam - Away team data
 * @param {Array} h2hMatches - Head-to-head match history
 * @param {Array} homeRecentMatches - Home team's recent matches
 * @param {Array} awayRecentMatches - Away team's recent matches
 * @returns {Object} Prediction percentages and factors
 */
function calculatePrediction(homeTeam, awayTeam, h2hMatches = [], homeRecentMatches = [], awayRecentMatches = []) {
  // Initialize scores
  let homeScore = 50;
  let awayScore = 50;

  // Factor 1: Recent Form (last 5 matches) - Weight: 35%
  const homeForm = analyzeRecentForm(homeRecentMatches, homeTeam.id);
  const awayForm = analyzeRecentForm(awayRecentMatches, awayTeam.id);
  
  const formDiff = (homeForm.winRate - awayForm.winRate) * 0.35;
  homeScore += formDiff * 25;
  awayScore -= formDiff * 25;

  // Factor 2: Head-to-Head History - Weight: 25%
  const h2hAnalysis = analyzeHeadToHead(h2hMatches, homeTeam.id, awayTeam.id);
  if (h2hAnalysis.totalMatches >= 3) {
    const h2hDiff = (h2hAnalysis.homeWinRate - h2hAnalysis.awayWinRate) * 0.25;
    homeScore += h2hDiff * 20;
    awayScore -= h2hDiff * 20;
  }

  // Factor 3: Home Advantage - Weight: 15%
  const homeAdvantage = calculateHomeAdvantage(homeTeam, awayTeam);
  homeScore += homeAdvantage.homeBenefit * 8;
  awayScore -= homeAdvantage.homeBenefit * 4;

  // Factor 4: Goals Average - Weight: 15%
  const goalsAnalysis = analyzeGoals(homeRecentMatches, awayRecentMatches, homeTeam.id, awayTeam.id);
  const goalsDiff = (goalsAnalysis.homeScored - goalsAnalysis.awayConceded) - 
                    (goalsAnalysis.awayScored - goalsAnalysis.homeConceded);
  homeScore += goalsDiff * 2;
  awayScore -= goalsDiff * 2;

  // Factor 5: League Position (if available) - Weight: 10%
  if (homeTeam.position && awayTeam.position) {
    const positionDiff = (awayTeam.position - homeTeam.position) / 20;
    homeScore += positionDiff * 5;
    awayScore -= positionDiff * 5;
  }

  // Normalize scores to ensure they're between 0-100
  homeScore = Math.max(0, Math.min(100, homeScore));
  awayScore = Math.max(0, Math.min(100, awayScore));

  // Calculate draw probability (inverse of certainty)
  const certainty = Math.abs(homeScore - awayScore);
  let drawScore = Math.max(10, 35 - (certainty / 2));

  // Normalize all three to sum to 100%
  const total = homeScore + awayScore + drawScore;
  homeScore = Math.round((homeScore / total) * 100);
  awayScore = Math.round((awayScore / total) * 100);
  drawScore = 100 - homeScore - awayScore;

  // Determine confidence level
  const maxProb = Math.max(homeScore, awayScore, drawScore);
  let confidence = 'low';
  if (maxProb >= 50) confidence = 'high';
  else if (maxProb >= 40) confidence = 'medium';

  return {
    predictions: {
      homeWin: homeScore,
      draw: drawScore,
      awayWin: awayScore,
    },
    confidence,
    factors: {
      recentForm: {
        home: homeForm.results,
        away: awayForm.results,
      },
      headToHead: h2hAnalysis,
      homeAdvantage: {
        homeWinRate: homeAdvantage.homeWinRate,
        awayWinRate: homeAdvantage.awayWinRate,
      },
      goalsAverage: goalsAnalysis,
    },
  };
}

// Analyze recent form (last 5 matches)
function analyzeRecentForm(matches, teamId) {
  const last5 = matches.slice(0, 5);
  const results = last5.map(m => {
    const isHome = m.teams.home.id === teamId;
    const teamGoals = isHome ? m.goals.home : m.goals.away;
    const oppGoals = isHome ? m.goals.away : m.goals.home;
    
    if (teamGoals > oppGoals) return 'W';
    if (teamGoals < oppGoals) return 'L';
    return 'D';
  });

  const wins = results.filter(r => r === 'W').length;
  const winRate = last5.length > 0 ? wins / last5.length : 0.5;

  return { results, winRate };
}

// Analyze head-to-head history
function analyzeHeadToHead(matches, homeTeamId, awayTeamId) {
  const last5 = matches.slice(0, 5);
  
  let homeWins = 0;
  let awayWins = 0;
  let draws = 0;

  last5.forEach(m => {
    const homeGoals = m.teams.home.id === homeTeamId ? m.goals.home : m.goals.away;
    const awayGoals = m.teams.home.id === homeTeamId ? m.goals.away : m.goals.home;

    if (homeGoals > awayGoals) homeWins++;
    else if (homeGoals < awayGoals) awayWins++;
    else draws++;
  });

  const totalMatches = last5.length;
  const homeWinRate = totalMatches > 0 ? homeWins / totalMatches : 0.33;
  const awayWinRate = totalMatches > 0 ? awayWins / totalMatches : 0.33;

  let lastResult = 'N/A';
  if (last5.length > 0) {
    const last = last5[0];
    const homeGoals = last.teams.home.id === homeTeamId ? last.goals.home : last.goals.away;
    const awayGoals = last.teams.home.id === homeTeamId ? last.goals.away : last.goals.home;
    lastResult = `${homeGoals}-${awayGoals}`;
  }

  return {
    homeWins,
    draws,
    awayWins,
    totalMatches,
    homeWinRate,
    awayWinRate,
    lastResult,
  };
}

// Calculate home advantage
function calculateHomeAdvantage(homeTeam, awayTeam) {
  // Typical home advantage is around 60% vs 40%
  return {
    homeWinRate: 68,
    awayWinRate: 45,
    homeBenefit: 1.2,
  };
}

// Analyze goals average
function analyzeGoals(homeMatches, awayMatches, homeTeamId, awayTeamId) {
  const calcAvg = (matches, teamId) => {
    if (matches.length === 0) return { scored: 1.5, conceded: 1.5 };
    
    let scored = 0;
    let conceded = 0;

    matches.slice(0, 5).forEach(m => {
      const isHome = m.teams.home.id === teamId;
      scored += isHome ? (m.goals.home || 0) : (m.goals.away || 0);
      conceded += isHome ? (m.goals.away || 0) : (m.goals.home || 0);
    });

    const count = Math.min(5, matches.length);
    return {
      scored: scored / count,
      conceded: conceded / count,
    };
  };

  const homeStats = calcAvg(homeMatches, homeTeamId);
  const awayStats = calcAvg(awayMatches, awayTeamId);

  return {
    homeScored: Math.round(homeStats.scored * 10) / 10,
    homeConceded: Math.round(homeStats.conceded * 10) / 10,
    awayScored: Math.round(awayStats.scored * 10) / 10,
    awayConceded: Math.round(awayStats.conceded * 10) / 10,
  };
}

module.exports = {
  calculatePrediction,
};