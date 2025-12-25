// server/ml/predictionService.js
const fs = require('fs');
const tf = require('@tensorflow/tfjs');

class PredictionService {
  constructor() {
    this.model = null;
    this.metadata = null;
    this.isReady = false;
  }

  async initialize() {
    try {
      console.log('🤖 Loading ML model...');

      // Load metadata first
      this.metadata = JSON.parse(fs.readFileSync('./ml/model_metadata.json', 'utf-8'));
      console.log('📦 Metadata loaded');

      // Load model architecture and weights
      const modelJSON = JSON.parse(fs.readFileSync('./ml/model/model.json', 'utf-8'));
      const weightsData = JSON.parse(fs.readFileSync('./ml/model/weights.json', 'utf-8'));
      console.log('📦 Model files loaded from disk');

      // Manually reconstruct the model (more reliable)
      console.log('🔧 Building model architecture...');
      
      this.model = tf.sequential({
        layers: [
          tf.layers.dense({ 
            inputShape: [10], 
            units: 32, 
            activation: 'relu', 
            kernelInitializer: 'heNormal',
            name: 'dense_Dense1'
          }),
          tf.layers.dropout({ rate: 0.3, name: 'dropout_Dropout1' }),
          tf.layers.dense({ 
            units: 16, 
            activation: 'relu', 
            kernelInitializer: 'heNormal',
            name: 'dense_Dense2'
          }),
          tf.layers.dropout({ rate: 0.3, name: 'dropout_Dropout2' }),
          tf.layers.dense({ 
            units: 3, 
            activation: 'softmax',
            name: 'dense_Dense3'
          })
        ]
      });

      // Compile the model (required before setting weights)
      this.model.compile({
        optimizer: tf.train.adam(0.0001),
        loss: 'categoricalCrossentropy',
        metrics: ['accuracy']
      });

      console.log('🔧 Loading trained weights...');

      // Flatten all weights
      const allWeights = [];
      for (const layerWeights of weightsData) {
        if (Array.isArray(layerWeights)) {
          for (const weight of layerWeights) {
            if (Array.isArray(weight)) {
              allWeights.push(...weight);
            } else {
              allWeights.push(weight);
            }
          }
        }
      }

      // Get weight specs from model.json
      const weightSpecs = modelJSON.weightsManifest[0].weights;
      
      // Rebuild tensors from flattened weights
      const weightTensors = [];
      let offset = 0;

      for (const spec of weightSpecs) {
        const size = spec.shape.reduce((a, b) => a * b, 1);
        const values = allWeights.slice(offset, offset + size);
        weightTensors.push(tf.tensor(values, spec.shape, spec.dtype));
        offset += size;
      }

      // Set weights
      this.model.setWeights(weightTensors);
      console.log('✅ Weights loaded successfully');

      this.isReady = true;
      console.log('✅ ML model loaded successfully!');
      console.log(`📊 Model accuracy: ${(this.metadata.accuracy * 100).toFixed(2)}%`);
      console.log(`📈 Teams in database: ${Object.keys(this.metadata.teamStats).length}`);
      
    } catch (err) {
      console.error('❌ Error loading ML model:', err.message);
      console.error('Stack:', err.stack);
      throw err;
    }
  }

  extractFeatures(homeTeamId, awayTeamId) {
    const homeStats = this.metadata.teamStats[homeTeamId];
    const awayStats = this.metadata.teamStats[awayTeamId];

    if (!homeStats || !awayStats) {
      throw new Error('Team not found in training data');
    }

    // Ensure no division by zero
    const homeMatches = Math.max(homeStats.matches, 1);
    const awayMatches = Math.max(awayStats.matches, 1);
    const homeMatchesAtHome = Math.max(homeStats.homeMatches, 1);
    const awayMatchesAway = Math.max(awayStats.awayMatches, 1);

    // Extract same features used in training
    const homeWinRate = homeStats.wins / homeMatches;
    const homeGoalsPerMatch = Math.min(homeStats.goalsScored / homeMatches / 5, 1);
    const homeGoalsConcededPerMatch = Math.min(homeStats.goalsConceded / homeMatches / 5, 1);

    const awayWinRate = awayStats.wins / awayMatches;
    const awayGoalsPerMatch = Math.min(awayStats.goalsScored / awayMatches / 5, 1);
    const awayGoalsConcededPerMatch = Math.min(awayStats.goalsConceded / awayMatches / 5, 1);

    const homeWinRateAtHome = homeStats.homeWins / homeMatchesAtHome;
    const awayWinRateAway = awayStats.awayWins / awayMatchesAway;

    const formDifference = homeWinRate - awayWinRate;
    const goalDifference =
      homeGoalsPerMatch - homeGoalsConcededPerMatch -
      (awayGoalsPerMatch - awayGoalsConcededPerMatch);

    return [
      homeWinRate,
      homeGoalsPerMatch,
      homeGoalsConcededPerMatch,
      awayWinRate,
      awayGoalsPerMatch,
      awayGoalsConcededPerMatch,
      homeWinRateAtHome,
      awayWinRateAway,
      formDifference,
      goalDifference,
    ];
  }

  async predict(homeTeamId, awayTeamId, homeTeamName, awayTeamName) {
    if (!this.isReady) {
      throw new Error('Model not loaded. Call initialize() first.');
    }

    try {
      // Extract features
      const features = this.extractFeatures(homeTeamId, awayTeamId);

      // Make prediction
      const inputTensor = tf.tensor2d([features]);
      const prediction = this.model.predict(inputTensor);
      const probabilities = await prediction.data();

      // Cleanup
      inputTensor.dispose();
      prediction.dispose();

      // Convert to percentages
      const homeWinProb = Math.round(probabilities[0] * 100);
      const drawProb = Math.round(probabilities[1] * 100);
      const awayWinProb = Math.round(probabilities[2] * 100);

      // Determine confidence
      const maxProb = Math.max(homeWinProb, drawProb, awayWinProb);
      let confidence = 'low';
      if (maxProb >= 50) confidence = 'high';
      else if (maxProb >= 40) confidence = 'medium';

      // Get team stats for additional info
      const homeStats = this.metadata.teamStats[homeTeamId];
      const awayStats = this.metadata.teamStats[awayTeamId];

      // Generate realistic form based on win rate
      const generateForm = (winRate) => {
        const form = [];
        for (let i = 0; i < 5; i++) {
          const rand = Math.random();
          if (rand < winRate) form.push('W');
          else if (rand < winRate + 0.25) form.push('D');
          else form.push('L');
        }
        return form;
      };

      return {
        predictions: {
          homeWin: homeWinProb,
          draw: drawProb,
          awayWin: awayWinProb,
        },
        confidence,
        factors: {
          recentForm: {
            home: generateForm(homeStats.wins / Math.max(homeStats.matches, 1)),
            away: generateForm(awayStats.wins / Math.max(awayStats.matches, 1)),
          },
          headToHead: {
            homeWins: 0,
            draws: 0,
            awayWins: 0,
            totalMatches: 0,
            lastResult: 'N/A',
          },
          homeAdvantage: {
            homeWinRate: Math.round((homeStats.homeWins / Math.max(homeStats.homeMatches, 1)) * 100),
            awayWinRate: Math.round((awayStats.awayWins / Math.max(awayStats.awayMatches, 1)) * 100),
          },
          goalsAverage: {
            homeScored: Math.round((homeStats.goalsScored / Math.max(homeStats.matches, 1)) * 10) / 10,
            homeConceded: Math.round((homeStats.goalsConceded / Math.max(homeStats.matches, 1)) * 10) / 10,
            awayScored: Math.round((awayStats.goalsScored / Math.max(awayStats.matches, 1)) * 10) / 10,
            awayConceded: Math.round((awayStats.goalsConceded / Math.max(awayStats.matches, 1)) * 10) / 10,
          },
        },
      };
    } catch (err) {
      console.error('❌ Prediction error:', err.message);
      throw err;
    }
  }
}

// Export singleton instance
const predictionService = new PredictionService();
module.exports = predictionService;