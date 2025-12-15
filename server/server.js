// server/server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const axios = require('axios');

const User = require('./models/User'); // make sure models/User.js exists

console.log('🚀 Starting Sports App Server...');
console.log('📝 MongoDB URI configured:', process.env.MONGODB_URI ? '✅' : '❌');
console.log('🔑 API Football Key configured:', process.env.API_FOOTBALL_KEY ? '✅' : '❌');
console.log('📰 News API Key configured:', process.env.NEWS_API_KEY ? '✅' : '❌');

const app = express();
const PORT = process.env.PORT || 4000;

// Import the API-Football routes
const footballRoutes = require('./football');

// Import booking routes
const bookingRoutes = require('./routes/booking');

// Middleware
app.use(cors());
app.use(express.json());

// Mount football routes
app.use('/api/football', footballRoutes);
// Mount booking routes
app.use('/api/booking', bookingRoutes);

// MongoDB connection
async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
  } catch (err) {
    console.error('❌ MongoDB connection error:', err.message);
    console.log('⚠️  Server will continue without database connection');
  }
}

// Health check route
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Sports App Backend is running 🚀',
    timestamp: new Date().toISOString(),
    config: {
      mongodb: !!process.env.MONGODB_URI,
      apiFootball: !!process.env.API_FOOTBALL_KEY,
      newsApi: !!process.env.NEWS_API_KEY,
    }
  });
});

// Register
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ message: 'Missing fields' });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: 'Email already in use' });
    }

    const user = await User.create({ username, email, password });

    res.status(201).json({
      message: 'User created',
      userId: user._id,
      username: user.username,
    });
  } catch (err) {
    console.error('❌ Register error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    console.log('🔵 Login body received:', req.body); 
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Missing email or password' });
    }

    const user = await User.findOne({ email });
    if (!user || user.password !== password) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    res.json({
      message: 'Login successful',
      userId: user._id,
      username: user.username,
      points: user.points,
    });
  } catch (err) {
    console.error('❌ Login error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Profile route
app.get('/api/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).lean();
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    console.error('❌ Get user error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Sports news route
app.get('/api/news', async (req, res) => {
  const rawSport = (req.query.sport || 'all').toString().toLowerCase();
  const page = Math.max(parseInt(req.query.page || '1', 10), 1);

  // Map frontend "sport" to NewsAPI query
  let q;

  switch (rawSport) {
    case 'football':
      q = `(soccer OR "football" OR "premier league" OR "la liga" OR "serie a" OR "bundesliga" OR "champions league" OR "uefa" OR "world cup") AND NOT ("NFL" OR "american football")`;
      break;

    case 'basketball':
      q = `basketball OR "NBA" OR "EuroLeague"`;
      break;

    case 'baseball':
      q = `baseball OR "MLB"`;
      break;

    case 'tennis':
      q = `tennis OR "ATP" OR "WTA" OR "grand slam"`;
      break;

    case 'formula1':
    case 'formula 1':
    case 'f1':
      q = `"Formula 1" OR "F1" OR "Grand Prix"`;
      break;

    case 'hockey':
      q = `hockey OR "NHL" OR "ice hockey"`;
      break;

    case 'all':
    default:
      q = `(soccer OR "football" OR "premier league" OR "la liga" OR "champions league" OR basketball OR NBA OR tennis OR baseball OR MLB OR hockey OR NHL OR "Formula 1" OR F1)`;
      break;
  }

  try {
    const response = await axios.get('https://newsapi.org/v2/everything', {
      params: {
        q,
        language: 'en',
        sortBy: 'publishedAt',
        pageSize: 10,
        page,
        apiKey: process.env.NEWS_API_KEY,
      },
    });

    const articles = (response.data.articles || []).map((a) => ({
      title: a.title,
      description: a.description,
      url: a.url,
      urlToImage: a.urlToImage,
      source: a.source?.name,
      publishedAt: a.publishedAt,
    }));

    res.json({ articles });
  } catch (err) {
    console.error('❌ Error fetching news:', err.response?.data || err.message);
    res.status(500).json({ 
      error: 'Failed to fetch sports news',
      details: err.response?.data?.message || err.message 
    });
  }
});

// API info endpoint
app.get('/api/info', (req, res) => {
  res.json({
    name: 'Sports App API',
    version: '2.0.0',
    description: 'Sports events and news API using API-Football and NewsAPI',
    endpoints: {
      health: 'GET /api/health',
      info: 'GET /api/info',
      news: 'GET /api/news?sport={sport}&page={page}',
      auth: {
        register: 'POST /api/auth/register',
        login: 'POST /api/auth/login',
      },
      users: {
        profile: 'GET /api/users/{id}',
      },
      football: {
        live: 'GET /api/football/live?leagues={leagueIds}',
        fixtures_today: 'GET /api/football/fixtures/today?leagues={leagueIds}',
        standings: 'GET /api/football/standings?league={id}&season={year}',
        teams_search: 'GET /api/football/teams/search?q={query}',
        match: 'GET /api/football/match/{id}',
        team: 'GET /api/football/team/{id}',
      }
    },
    leagues: {
      39: 'Premier League',
      140: 'La Liga',
      135: 'Serie A',
      78: 'Bundesliga',
      61: 'Ligue 1',
      2: 'Champions League',
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('❌ Unhandled error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: err.message 
  });
});

// Start server
connectDB().then(() => {
  app.listen(PORT, '0.0.0.0', () => {
    console.log('');
    console.log('✅ ========================================');
    console.log(`✅ Server listening on http://0.0.0.0:${PORT}`);
    console.log(`✅ Health check: http://0.0.0.0:${PORT}/api/health`);
    console.log(`✅ API info: http://0.0.0.0:${PORT}/api/info`);
    console.log('✅ ========================================');
    console.log('');
  });
});