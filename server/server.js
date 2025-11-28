// server/server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const axios = require('axios');

const User = require('./models/User'); // make sure models/User.js exists

const app = express();
const PORT = process.env.PORT || 4000;

// ----- MIDDLEWARE -----
app.use(cors());
app.use(express.json());

// ----- MONGODB CONNECTION -----
const mongoUri = process.env.MONGODB_URI;
console.log('MONGODB_URI from env:', mongoUri);

mongoose
  .connect(mongoUri)
  .then(() => {
    console.log('✅ Connected to MongoDB');
  })
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1);
  });

// Simple health check route
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Backend (server) is running 🚀' });
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

// ----- PROFILE ROUTE -----
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

// Sports news route (calls NewsAPI with sport-specific queries)
app.get('/api/news', async (req, res) => {
  const rawSport = (req.query.sport || 'all').toString().toLowerCase();
  const page = Math.max(parseInt(req.query.page || '1', 10), 1);

  // Map frontend "sport" to NewsAPI query
  let q;

  switch (rawSport) {
    case 'football':
      // European football / soccer only – try to avoid NFL
      q = `(
        soccer
        OR "football"
        OR "premier league"
        OR "la liga"
        OR "serie a"
        OR "bundesliga"
        OR "champions league"
        OR "uefa"
        OR "world cup"
      ) AND NOT ("NFL" OR "american football")`;
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
      // General sports mix
      q = `(
        soccer OR "football" OR "premier league" OR "la liga" OR "champions league"
        OR basketball OR NBA OR EuroLeague
        OR tennis OR "grand slam"
        OR baseball OR MLB
        OR hockey OR NHL
        OR "Formula 1" OR F1 OR "Grand Prix"
      )`;
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
      source: a.source ? a.source.name : null,
      publishedAt: a.publishedAt,
    }));

    res.json({ articles });
  } catch (err) {
    console.error('❌ Error fetching news:', err.message);
    res.status(500).json({ error: 'Failed to fetch sports news' });
  }
});


// ----- START SERVER -----
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Server listening on http://0.0.0.0:${PORT}`);
});
