// server/routes/booking.js
const express = require('express');
const router = express.Router();
const SeatPreference = require('../models/SeatPreference');
const { classifySeat, getRecommendations } = require('../utils/seatClassifier');

// Get user preferences
router.get('/preferences/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    let preferences = await SeatPreference.findOne({ userId });
    
    // If user has no preferences yet, create default ones
    if (!preferences) {
      preferences = await SeatPreference.create({
        userId,
        noiseLevel: 'moderate',
        fieldProximity: 'medium',
        viewType: 'central',
        priceRange: 'medium',
      });
    }
    
    res.json(preferences);
  } catch (err) {
    console.error('❌ Error fetching preferences:', err);
    res.status(500).json({ error: 'Failed to load preferences' });
  }
});

// Update user preferences
router.put('/preferences/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const updates = req.body;
    
    const preferences = await SeatPreference.findOneAndUpdate(
      { userId },
      { $set: updates },
      { new: true, upsert: true }
    );
    
    console.log('✅ Updated preferences for user:', userId);
    res.json(preferences);
  } catch (err) {
    console.error('❌ Error updating preferences:', err);
    res.status(500).json({ error: 'Failed to update preferences' });
  }
});

// Get AI recommendations for a match
router.post('/recommendations/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { matchId, stadiumSeats } = req.body;
    
    if (!stadiumSeats || !Array.isArray(stadiumSeats)) {
      return res.status(400).json({ 
        error: 'stadiumSeats array is required',
        example: { stadiumSeats: [{ section: 'A', row: 1, number: 5, x: 10, y: 20, available: true }] }
      });
    }
    
    // Get user preferences
    const preferences = await SeatPreference.findOne({ userId });
    
    if (!preferences) {
      return res.status(404).json({ error: 'User preferences not found. Please set preferences first.' });
    }
    
    // Stadium configuration (can be customized per stadium)
    const stadiumConfig = {
      centerX: 0,
      centerY: 0,
      maxDistance: 100,
    };
    
    // Classify all available seats
    const classifiedSeats = stadiumSeats
      .filter(seat => seat.available)
      .map(seat => classifySeat(seat, stadiumConfig));
    
    // Get top 3 recommendations
    const recommendations = getRecommendations(classifiedSeats, preferences, 3);
    
    console.log(`✅ Generated ${recommendations.length} recommendations for user ${userId}`);
    
    res.json({
      preferences: {
        noiseLevel: preferences.noiseLevel,
        fieldProximity: preferences.fieldProximity,
        viewType: preferences.viewType,
        priceRange: preferences.priceRange,
        satisfactionScore: preferences.satisfactionScore,
        totalBookings: preferences.totalBookings,
      },
      recommendations: recommendations.map(seat => ({
        section: seat.section,
        row: seat.row,
        number: seat.number,
        price: seat.classification.price,
        matchScore: seat.matchScore,
        classification: seat.classification,
        isTopPick: seat.matchScore === recommendations[0].matchScore,
      })),
    });
  } catch (err) {
    console.error('❌ Error generating recommendations:', err);
    res.status(500).json({ error: 'Failed to generate recommendations' });
  }
});

// Update satisfaction score after booking
router.post('/feedback/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { rating } = req.body; // 1-5 stars
    
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }
    
    const preferences = await SeatPreference.findOne({ userId });
    
    if (!preferences) {
      return res.status(404).json({ error: 'User preferences not found' });
    }
    
    // Update satisfaction score (weighted average)
    const newScore = Math.round(
      (preferences.satisfactionScore * preferences.totalBookings + rating * 20) / 
      (preferences.totalBookings + 1)
    );
    
    preferences.satisfactionScore = newScore;
    preferences.totalBookings += 1;
    await preferences.save();
    
    console.log(`✅ Updated satisfaction for user ${userId}: ${newScore}%`);
    
    res.json({
      satisfactionScore: newScore,
      totalBookings: preferences.totalBookings,
    });
  } catch (err) {
    console.error('❌ Error updating feedback:', err);
    res.status(500).json({ error: 'Failed to save feedback' });
  }
});

// Get all available seats for a match (with classifications)
router.get('/seats/:matchId', async (req, res) => {
  try {
    const { matchId } = req.params;
    
    // TODO: In a real app, fetch from database
    // For now, return mock data
    const mockSeats = generateMockStadiumSeats();
    
    const stadiumConfig = {
      centerX: 0,
      centerY: 0,
      maxDistance: 100,
    };
    
    const classifiedSeats = mockSeats.map(seat => 
      classifySeat(seat, stadiumConfig)
    );
    
    res.json({
      matchId,
      totalSeats: classifiedSeats.length,
      availableSeats: classifiedSeats.filter(s => s.available).length,
      seats: classifiedSeats,
    });
  } catch (err) {
    console.error('❌ Error fetching seats:', err);
    res.status(500).json({ error: 'Failed to load seats' });
  }
});

// Helper function to generate mock stadium seats
function generateMockStadiumSeats() {
  const seats = [];
  const sections = ['North', 'South', 'East', 'West'];
  
  sections.forEach((section, sectionIndex) => {
    for (let row = 1; row <= 20; row++) {
      for (let number = 1; number <= 15; number++) {
        // Calculate position based on section
        let x, y;
        switch(section) {
          case 'North':
            x = (number - 7.5) * 5;
            y = 50 - row * 2;
            break;
          case 'South':
            x = (number - 7.5) * 5;
            y = -50 + row * 2;
            break;
          case 'East':
            x = 50 - row * 2;
            y = (number - 7.5) * 5;
            break;
          case 'West':
            x = -50 + row * 2;
            y = (number - 7.5) * 5;
            break;
        }
        
        seats.push({
          section,
          row,
          number,
          x: Math.round(x),
          y: Math.round(y),
          available: Math.random() > 0.3, // 70% available
        });
      }
    }
  });
  
  return seats;
}

// Create a new booking
router.post('/create/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { matchId, matchName, matchDate, section, row, seatNumber, price, matchScore } = req.body;
    
    if (!matchId || !matchName || !section || !row || !seatNumber || !price) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        required: ['matchId', 'matchName', 'section', 'row', 'seatNumber', 'price']
      });
    }

    const Booking = require('../models/Booking');
    
    const booking = await Booking.create({
      userId,
      matchId,
      matchName,
      matchDate: matchDate ? new Date(matchDate) : null,
      section,
      row,
      seatNumber,
      price,
      matchScore: matchScore || 0,
    });
    
    console.log(`✅ Created booking for user ${userId}: ${matchName}, Match Date: ${matchDate}`);
    
    res.json({
      success: true,
      booking,
    });
  } catch (err) {
    console.error('❌ Error creating booking:', err);
    res.status(500).json({ error: 'Failed to create booking' });
  }
});

// Get user's bookings
router.get('/history/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const Booking = require('../models/Booking');
    
    const bookings = await Booking.find({ userId, status: 'confirmed' })
      .sort({ bookingDate: -1 });
    
    res.json({
      bookings,
      totalBookings: bookings.length,
    });
  } catch (err) {
    console.error('❌ Error fetching bookings:', err);
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
});

module.exports = router;