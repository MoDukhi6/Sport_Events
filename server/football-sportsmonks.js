const express = require('express');
const axios = require('axios');

const router = express.Router();

if (!process.env.SPORTMONKS_API_KEY) {
  console.warn(
    '⚠ SPORTMONKS_API_KEY is not set in .env – football routes will fail'
  );
}

// Axios instance for SportMonks
const api = axios.create({
  baseURL: 'https://api.sportmonks.com/v3/football',
  params: {
    api_token: process.env.SPORTMONKS_API_KEY,
  },
});

// 🔑 IMPORTANT: Sportsmonks uses specific Season IDs, not just years
// You need to find the current season IDs for each league from Sportsmonks API
// These are PLACEHOLDER IDs - you'll need to fetch real ones
const SEASON_MAPPINGS = {
  // Premier League (England) - League ID 39 in API-Sports = 8 in Sportsmonks
  8: {
    2024: 23810, // 2024/25 season
    2023: 23273,
    2022: 22697,
  },
  // La Liga (Spain) - League ID 140 in API-Sports = 564 in Sportsmonks
  564: {
    2024: 23780,
    2023: 23244,
    2022: 22667,
  },
  // Bundesliga (Germany) - League ID 78 in API-Sports = 82 in Sportsmonks
  82: {
    2024: 23749,
    2023: 23213,
    2022: 22636,
  },
  // Serie A (Italy) - League ID 135 in API-Sports = 384 in Sportsmonks
  384: {
    2024: 23763,
    2023: 23227,
    2022: 22650,
  },
  // Ligue 1 (France) - League ID 61 in API-Sports = 301 in Sportsmonks
  301: {
    2024: 23734,
    2023: 23198,
    2022: 22621,
  },
};

// Map API-Sports league IDs to Sportsmonks league IDs
const LEAGUE_ID_MAPPING = {
  39: 8,     // Premier League
  140: 564,  // La Liga
  78: 82,    // Bundesliga
  135: 384,  // Serie A
  61: 301,   // Ligue 1
};

function convertLeagueId(apiSportsId) {
  return LEAGUE_ID_MAPPING[apiSportsId] || apiSportsId;
}

function getSeasonId(leagueId, year) {
  const league = SEASON_MAPPINGS[leagueId];
  if (!league) return null;
  return league[year] || null;
}

function getCurrentSeasonYear() {
  const now = new Date();
  return now.getMonth() >= 6 ? now.getFullYear() : now.getFullYear() - 1;
}

// LIVE matches
router.get('/sportsmonks/live', async (req, res) => {
  try {
    let { leagueId } = req.query;
    
    if (leagueId) {
      leagueId = convertLeagueId(parseInt(leagueId));
    }
    
    console.log('🔴 Fetching LIVE matches from Sportsmonks...');
    
    const params = { 
      include: 'scores;participants;state;league',
    };
    
    if (leagueId) {
      params.filters = `fixtureLeagues:${leagueId}`;
    }
    
    const { data } = await api.get('/livescores/inplay', { params });
    
    console.log('✅ Live matches response:', data.data?.length || 0, 'matches');
    
    res.json(data.data || []);
  } catch (err) {
    console.error('❌ Sportsmonks /live error:', err.response?.data || err.message);
    res.status(500).json({ 
      error: 'Failed to load live matches',
      details: err.response?.data?.message || err.message 
    });
  }
});

// TODAY fixtures
router.get('/sportsmonks/fixtures/today', async (req, res) => {
  try {
    let { leagueId } = req.query;
    const today = new Date().toISOString().slice(0, 10);
    
    if (leagueId) {
      leagueId = convertLeagueId(parseInt(leagueId));
    }
    
    console.log(`📅 Fetching fixtures for ${today} from Sportsmonks...`);
    
    const params = {
      filters: `fixtureDate:${today}`,
      include: 'scores;participants;state;league',
    };
    
    if (leagueId) {
      params.filters += `;fixtureLeagues:${leagueId}`;
    }
    
    const { data } = await api.get('/fixtures', { params });
    
    console.log('✅ Today fixtures:', data.data?.length || 0, 'matches');
    
    res.json(data.data || []);
  } catch (err) {
    console.error('❌ Sportsmonks /fixtures/today error:', err.response?.data || err.message);
    res.status(500).json({ 
      error: 'Failed to load fixtures',
      details: err.response?.data?.message || err.message 
    });
  }
});

// STANDINGS - Fixed version
router.get('/sportsmonks/standings', async (req, res) => {
  try {
    let { leagueId, seasonId } = req.query;
    
    if (!leagueId) {
      return res.status(400).json({ error: 'leagueId is required' });
    }
    
    // Convert API-Sports league ID to Sportsmonks ID
    const originalLeagueId = leagueId;
    leagueId = convertLeagueId(parseInt(leagueId));
    
    console.log(`🔄 Converted league ID ${originalLeagueId} -> ${leagueId}`);
    
    // If seasonId is a year, try to convert it
    if (seasonId && seasonId.length === 4) {
      const year = parseInt(seasonId);
      const actualSeasonId = getSeasonId(leagueId, year);
      
      if (actualSeasonId) {
        seasonId = actualSeasonId;
        console.log(`🔄 Converted year ${year} to season ID ${seasonId}`);
      }
    }
    
    // If still no season ID, fetch current season from league
    if (!seasonId) {
      console.log('📡 Fetching league info to get current season...');
      try {
        const leagueRes = await api.get(`/leagues/${leagueId}`, {
          params: { include: 'currentseason' }
        });
        
        if (leagueRes.data?.data?.currentseason) {
          seasonId = leagueRes.data.data.currentseason.id;
          console.log(`✅ Found current season: ${seasonId}`);
        }
      } catch (leagueErr) {
        console.error('Failed to fetch league info:', leagueErr.message);
      }
    }
    
    if (!seasonId) {
      return res.status(400).json({ 
        error: 'Could not determine season ID',
        help: 'Try fetching seasons first: GET /api/sportsmonks/leagues/:leagueId/seasons'
      });
    }
    
    console.log(`📊 Fetching standings for league ${leagueId}, season ${seasonId}...`);
    
    const { data } = await api.get(`/standings/seasons/${seasonId}`, {
      params: { 
        include: 'participant',
        filters: `standingLeagues:${leagueId}`
      },
    });
    
    console.log('✅ Standings data received:', data.data?.length || 0, 'entries');
    
    if (data.data && data.data.length > 0) {
      const standings = data.data;
      
      // Filter for overall/total standings
      const overallStandings = standings
        .filter(s => !s.type || s.type === 'total' || s.type === 'overall')
        .sort((a, b) => (a.position || 0) - (b.position || 0));
      
      // Transform to match your frontend format
      const transformed = {
        id: parseInt(originalLeagueId),
        name: standings[0]?.league?.name || 'Unknown League',
        country: standings[0]?.league?.country?.name || 'Unknown',
        logo: standings[0]?.league?.image_path || '',
        standings: [
          overallStandings.map(item => ({
            rank: item.position || 0,
            team: {
              id: item.participant?.id || 0,
              name: item.participant?.name || 'Unknown',
              logo: item.participant?.image_path || '',
            },
            points: item.points || 0,
            goalsDiff: ((item.result?.overall?.goals_scored || 0) - (item.result?.overall?.goals_against || 0)),
            all: {
              played: item.result?.overall?.games_played || 0,
              win: item.result?.overall?.won || 0,
              draw: item.result?.overall?.draw || 0,
              lose: item.result?.overall?.lost || 0,
              goals: {
                for: item.result?.overall?.goals_scored || 0,
                against: item.result?.overall?.goals_against || 0,
              },
            },
          }))
        ],
      };
      
      console.log('✅ Transformed standings:', transformed.standings[0]?.length || 0, 'teams');
      
      res.json(transformed);
    } else {
      console.log('⚠️  No standings data found');
      res.json({ 
        id: parseInt(originalLeagueId),
        name: 'Unknown',
        country: 'Unknown',
        logo: '',
        standings: [[]]
      });
    }
  } catch (err) {
    console.error('❌ Sportsmonks /standings error:', err.response?.data || err.message);
    console.error('Full error:', err);
    res.status(500).json({ 
      error: 'Failed to load standings',
      details: err.response?.data?.message || err.message 
    });
  }
});

// Get available seasons for a league
router.get('/sportsmonks/leagues/:leagueId/seasons', async (req, res) => {
  try {
    let { leagueId } = req.params;
    
    leagueId = convertLeagueId(parseInt(leagueId));
    
    console.log(`📅 Fetching seasons for league ${leagueId}...`);
    
    const { data } = await api.get(`/leagues/${leagueId}`, {
      params: { include: 'seasons' }
    });
    
    const seasons = data.data?.seasons || [];
    
    console.log(`✅ Found ${seasons.length} seasons`);
    
    res.json(seasons);
  } catch (err) {
    console.error('❌ Error fetching seasons:', err.response?.data || err.message);
    res.status(500).json({ 
      error: 'Failed to fetch seasons',
      details: err.response?.data?.message || err.message 
    });
  }
});

module.exports = router;