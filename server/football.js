// server/football.js
const express = require('express');
const axios = require('axios');

const router = express.Router();

if (!process.env.API_FOOTBALL_KEY) {
  console.warn('⚠️  API_FOOTBALL_KEY is not set in .env – football routes will fail');
}

const api = axios.create({
  baseURL: 'https://v3.football.api-sports.io',
  headers: {
    'x-apisports-key': process.env.API_FOOTBALL_KEY,
  },
});

// Helper to get current season year
function getCurrentSeasonYear() {
  return 2023; // Default to 2023 for free plan
}

// 1) Live matches
router.get('/live', async (req, res) => {
  try {
    let leagues = req.query.leagues || req.query.leagueId;
    
    if (!leagues) {
      leagues = '39,140,135,78,61,2';
    }
    
    const leagueArray = String(leagues).split(',');

    const promises = leagueArray.map((leagueId) =>
      api.get('/fixtures', {
        params: {
          live: 'all',
          league: leagueId.trim(),
        },
      })
    );

    const results = await Promise.all(promises);
    const fixtures = results.flatMap((r) => r.data.response || []);

    res.json(fixtures);
  } catch (err) {
    console.error('❌ football/live error:', err.response?.data || err.message);
    res.status(500).json({ 
      error: 'Failed to load live matches',
      details: err.response?.data?.message || err.message 
    });
  }
});

// 2) Fixtures by date (includes all match statuses)
router.get('/fixtures/today', async (req, res) => {
  try {
    const date = req.query.date || new Date().toISOString().slice(0, 10);
    
    let leagues = req.query.leagues || req.query.leagueId;
    
    if (!leagues) {
      leagues = '39,140,135,78,61,2';
    }
    
    const leagueArray = String(leagues).split(',');

    console.log(`📅 Fetching ALL fixtures for date: ${date}, leagues: ${leagues}`);

    const promises = leagueArray.map((leagueId) =>
      api.get('/fixtures', {
        params: {
          date: date,
          league: leagueId.trim(),
          season: 2025, // Current season
          timezone: 'UTC',
        },
      })
    );

    const results = await Promise.all(promises);
    let fixtures = results.flatMap((r) => r.data.response || []);

    // If it's today, also get live matches and merge them
    const today = new Date().toISOString().slice(0, 10);
    if (date === today) {
      console.log(`📅 Date is today, fetching live matches too...`);
      
      const livePromises = leagueArray.map((leagueId) =>
        api.get('/fixtures', {
          params: {
            live: 'all',
            league: leagueId.trim(),
          },
        })
      );

      const liveResults = await Promise.all(livePromises);
      const liveFixtures = liveResults.flatMap((r) => r.data.response || []);
      
      console.log(`🔴 Found ${liveFixtures.length} live matches`);

      // Merge live fixtures with scheduled fixtures (avoid duplicates)
      const fixtureIds = new Set(fixtures.map(f => f.fixture.id));
      const newLiveFixtures = liveFixtures.filter(f => !fixtureIds.has(f.fixture.id));
      
      fixtures = [...liveFixtures, ...fixtures];
    }

    console.log(`✅ Total fixtures for ${date}: ${fixtures.length}`);
    
    // Log sample fixtures for debugging
    if (fixtures.length > 0) {
      console.log(`📊 Sample fixtures:`, fixtures.slice(0, 3).map(f => ({
        home: f.teams.home.name,
        away: f.teams.away.name,
        status: f.fixture.status.short,
        date: f.fixture.date,
      })));
    }

    res.json(fixtures);
  } catch (err) {
    console.error('❌ football/fixtures/today error:', err.response?.data || err.message);
    res.status(500).json({ 
      error: 'Failed to load fixtures',
      details: err.response?.data?.message || err.message 
    });
  }
});

// 3) Standings for a league
router.get('/standings', async (req, res) => {
  try {
    let league = req.query.league || req.query.leagueId;
    let season = req.query.season || req.query.seasonId;
    
    if (!league) {
      return res.status(400).json({ 
        error: 'league parameter is required',
        example: '/api/football/standings?league=39&season=2024'
      });
    }

    if (!season) {
      season = getCurrentSeasonYear();
    }

    const response = await api.get('/standings', {
      params: { 
        league: league, 
        season: season 
      },
    });

    const leagueData = response.data.response[0]?.league;
    
    if (!leagueData) {
      return res.json({
        id: parseInt(league),
        name: 'Unknown League',
        country: 'Unknown',
        logo: '',
        standings: [[]]
      });
    }

    res.json(leagueData);
  } catch (err) {
    console.error('❌ football/standings error:', err.response?.data || err.message);
    
    if (err.response?.status === 429) {
      return res.status(429).json({ 
        error: 'API rate limit reached',
        message: 'You have reached your daily API request limit. Please try again tomorrow.'
      });
    }
    
    res.status(500).json({ 
      error: 'Failed to load standings',
      details: err.response?.data?.message || err.message,
      apiError: err.response?.data
    });
  }
});

// 4) Search teams
router.get('/teams/search', async (req, res) => {
  try {
    const q = req.query.q;
    if (!q) {
      return res.json([]);
    }

    const response = await api.get('/teams', { 
      params: { search: q } 
    });
    
    const teams = response.data.response || [];

    res.json(teams);
  } catch (err) {
    console.error('❌ football/teams/search error:', err.response?.data || err.message);
    res.status(500).json({ 
      error: 'Failed to search teams',
      details: err.response?.data?.message || err.message 
    });
  }
});

// 5) Match details
router.get('/match/:id', async (req, res) => {
  try {
    const id = req.params.id;

    const response = await api.get('/fixtures', { 
      params: { id } 
    });
    
    const match = response.data.response[0];

    res.json(match || null);
  } catch (err) {
    console.error('❌ football/match error:', err.response?.data || err.message);
    res.status(500).json({ 
      error: 'Failed to load match',
      details: err.response?.data?.message || err.message 
    });
  }
});

// 6) Team profile
router.get('/team/:id', async (req, res) => {
  try {
    const id = req.params.id;

    const response = await api.get('/teams', { 
      params: { id } 
    });
    
    const team = response.data.response[0];

    res.json(team || null);
  } catch (err) {
    console.error('❌ football/team error:', err.response?.data || err.message);
    res.status(500).json({ 
      error: 'Failed to load team',
      details: err.response?.data?.message || err.message 
    });
  }
});

// 7) Get fixtures by round (for knockout stages)
router.get('/fixtures/round', async (req, res) => {
  try {
    const { league, season, round } = req.query;
    
    if (!league || !season || !round) {
      return res.status(400).json({ 
        error: 'league, season, and round parameters are required',
        example: '/api/football/fixtures/round?league=2&season=2022&round=Round of 16'
      });
    }

    const response = await api.get('/fixtures', {
      params: { 
        league,
        season,
        round
      },
    });
    
    const fixtures = response.data.response || [];

    res.json(fixtures);
  } catch (err) {
    console.error('❌ football/fixtures/round error:', err.response?.data || err.message);
    res.status(500).json({ 
      error: 'Failed to load fixtures',
      details: err.response?.data?.message || err.message 
    });
  }
});

module.exports = router;