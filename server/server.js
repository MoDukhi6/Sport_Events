require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const axios = require('axios');

console.log('MONGODB_URI from env:', process.env.MONGODB_URI);

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB connection
async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
  } catch (err) {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1);
  }
}

// Simple health check route
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Backend (server) is running 🚀' });
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
      source: a.source?.name,
      publishedAt: a.publishedAt,
    }));

    res.json({ articles });
  } catch (err) {
    console.error('❌ Error fetching news:', err.response?.data || err.message);
    res.status(500).json({ error: 'Failed to fetch sports news' });
  }
});


connectDB().then(() => {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Server listening on http://0.0.0.0:${PORT}`);
  });
});
