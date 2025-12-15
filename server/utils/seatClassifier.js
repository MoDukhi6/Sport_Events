// server/utils/seatClassifier.js

/**
 * Calculate Euclidean distance from seat to stadium center
 */
function calculateDistance(seatX, seatY, centerX = 0, centerY = 0) {
  return Math.sqrt(Math.pow(seatX - centerX, 2) + Math.pow(seatY - centerY, 2));
}

/**
 * Classify seat noise level based on distance from center
 * Closer = Louder (passionate fans)
 * Farther = Quieter (families)
 */
function classifyNoiseLevel(distance, maxDistance) {
  const ratio = distance / maxDistance;
  
  if (ratio < 0.33) return 'loud';      // Close to center
  if (ratio < 0.67) return 'moderate';  // Medium distance
  return 'quiet';                        // Far from center
}

/**
 * Classify field proximity
 */
function classifyFieldProximity(distance, maxDistance) {
  const ratio = distance / maxDistance;
  
  if (ratio < 0.33) return 'close';
  if (ratio < 0.67) return 'medium';
  return 'far';
}

/**
 * Classify view type based on seat angle
 */
function classifyViewType(seatX, seatY) {
  const angle = Math.atan2(seatY, seatX) * (180 / Math.PI);
  const absAngle = Math.abs(angle);
  
  if (absAngle < 30 || absAngle > 150) return 'central';  // Behind goals
  if (absAngle < 60 || absAngle > 120) return 'corner';   // Corner view
  return 'side';                                           // Sideline view
}

/**
 * Calculate price based on distance and view
 */
function calculatePrice(distance, maxDistance, viewType) {
  const ratio = distance / maxDistance;
  
  let basePrice = 60; // Medium tier
  
  // Closer seats are more expensive
  if (ratio < 0.33) basePrice = 120;
  else if (ratio < 0.67) basePrice = 80;
  
  // Central view premium
  if (viewType === 'central') basePrice *= 1.2;
  else if (viewType === 'corner') basePrice *= 0.9;
  
  return Math.round(basePrice);
}

/**
 * Classify a single seat
 */
function classifySeat(seat, stadiumConfig) {
  const { x, y, section, row, number } = seat;
  const { centerX = 0, centerY = 0, maxDistance = 100 } = stadiumConfig;
  
  const distance = calculateDistance(x, y, centerX, centerY);
  const noiseLevel = classifyNoiseLevel(distance, maxDistance);
  const fieldProximity = classifyFieldProximity(distance, maxDistance);
  const viewType = classifyViewType(x, y);
  const price = calculatePrice(distance, maxDistance, viewType);
  
  // Determine price range category
  let priceRange = 'medium';
  if (price < 60) priceRange = 'budget';
  else if (price > 120) priceRange = 'premium';
  
  return {
    ...seat,
    classification: {
      noiseLevel,
      fieldProximity,
      viewType,
      priceRange,
      price,
      distance,
      energyLevel: noiseLevel === 'loud' ? 'high' : noiseLevel === 'moderate' ? 'medium' : 'low',
    }
  };
}

/**
 * Calculate match score between seat and user preferences
 */
function calculateMatchScore(seat, preferences) {
  let score = 0;
  let maxScore = 0;
  
  const { classification } = seat;
  
  // Noise level match (weight: 30%)
  maxScore += 30;
  if (classification.noiseLevel === preferences.noiseLevel) {
    score += 30;
  } else if (
    (preferences.noiseLevel === 'moderate' && 
     (classification.noiseLevel === 'loud' || classification.noiseLevel === 'quiet'))
  ) {
    score += 15; // Partial match
  }
  
  // Field proximity match (weight: 25%)
  maxScore += 25;
  if (classification.fieldProximity === preferences.fieldProximity) {
    score += 25;
  } else if (
    (preferences.fieldProximity === 'medium' && 
     (classification.fieldProximity === 'close' || classification.fieldProximity === 'far'))
  ) {
    score += 12;
  }
  
  // View type match (weight: 20%)
  maxScore += 20;
  if (classification.viewType === preferences.viewType) {
    score += 20;
  } else if (
    (preferences.viewType === 'central' && classification.viewType === 'side') ||
    (preferences.viewType === 'side' && classification.viewType === 'central')
  ) {
    score += 10;
  }
  
  // Price range match (weight: 25%)
  maxScore += 25;
  if (classification.priceRange === preferences.priceRange) {
    score += 25;
  } else if (
    (preferences.priceRange === 'medium' && 
     (classification.priceRange === 'budget' || classification.priceRange === 'premium'))
  ) {
    score += 12;
  }
  
  // Convert to percentage
  return Math.round((score / maxScore) * 100);
}

/**
 * Get AI recommendations for user
 */
function getRecommendations(seats, preferences, limit = 3) {
  // Calculate match score for each seat
  const scoredSeats = seats.map(seat => ({
    ...seat,
    matchScore: calculateMatchScore(seat, preferences),
  }));
  
  // Sort by match score (highest first)
  scoredSeats.sort((a, b) => b.matchScore - a.matchScore);
  
  // Return top matches
  return scoredSeats.slice(0, limit);
}

module.exports = {
  classifySeat,
  calculateMatchScore,
  getRecommendations,
  calculateDistance,
  classifyNoiseLevel,
  classifyFieldProximity,
  classifyViewType,
  calculatePrice,
};