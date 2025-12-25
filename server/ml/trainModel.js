// server/ml/trainModel.js
const fs = require('fs');
const tf = require('@tensorflow/tfjs');

console.log('🤖 Starting ML Model Training...');

// Load historical matches
const matches = JSON.parse(fs.readFileSync('./ml/historical_matches.json', 'utf-8'));
console.log(`📊 Loaded ${matches.length} matches`);

// Create team statistics lookup
const teamStats = {};

// Build team statistics from historical data
function buildTeamStats() {
  console.log('📈 Building team statistics...');
  
  matches.forEach(match => {
    const homeTeam = match.teams.home.id;
    const awayTeam = match.teams.away.id;
    
    // Initialize team stats if not exists
    if (!teamStats[homeTeam]) {
      teamStats[homeTeam] = {
        name: match.teams.home.name,
        matches: 0,
        wins: 0,
        draws: 0,
        losses: 0,
        goalsScored: 0,
        goalsConceded: 0,
        homeMatches: 0,
        homeWins: 0,
      };
    }
    
    if (!teamStats[awayTeam]) {
      teamStats[awayTeam] = {
        name: match.teams.away.name,
        matches: 0,
        wins: 0,
        draws: 0,
        losses: 0,
        goalsScored: 0,
        goalsConceded: 0,
        awayMatches: 0,
        awayWins: 0,
      };
    }
    
    // Update home team stats
    teamStats[homeTeam].matches++;
    teamStats[homeTeam].homeMatches++;
    teamStats[homeTeam].goalsScored += match.goals.home || 0;
    teamStats[homeTeam].goalsConceded += match.goals.away || 0;
    
    if (match.goals.home > match.goals.away) {
      teamStats[homeTeam].wins++;
      teamStats[homeTeam].homeWins++;
    } else if (match.goals.home === match.goals.away) {
      teamStats[homeTeam].draws++;
    } else {
      teamStats[homeTeam].losses++;
    }
    
    // Update away team stats
    teamStats[awayTeam].matches++;
    teamStats[awayTeam].awayMatches++;
    teamStats[awayTeam].goalsScored += match.goals.away || 0;
    teamStats[awayTeam].goalsConceded += match.goals.home || 0;
    
    if (match.goals.away > match.goals.home) {
      teamStats[awayTeam].wins++;
      teamStats[awayTeam].awayWins++;
    } else if (match.goals.away === match.goals.home) {
      teamStats[awayTeam].draws++;
    } else {
      teamStats[awayTeam].losses++;
    }
  });
  
  console.log(`✅ Built stats for ${Object.keys(teamStats).length} teams`);
}

// Extract features from a match
function extractFeatures(match, homeStats, awayStats) {
  // Ensure no division by zero
  const homeMatches = Math.max(homeStats.matches, 1);
  const awayMatches = Math.max(awayStats.matches, 1);
  const homeMatchesAtHome = Math.max(homeStats.homeMatches, 1);
  const awayMatchesAway = Math.max(awayStats.awayMatches, 1);
  
  // Feature 1-3: Home team performance (normalized 0-1)
  const homeWinRate = homeStats.wins / homeMatches;
  const homeGoalsPerMatch = Math.min(homeStats.goalsScored / homeMatches / 5, 1); // Cap at 5 goals
  const homeGoalsConcededPerMatch = Math.min(homeStats.goalsConceded / homeMatches / 5, 1);
  
  // Feature 4-6: Away team performance (normalized 0-1)
  const awayWinRate = awayStats.wins / awayMatches;
  const awayGoalsPerMatch = Math.min(awayStats.goalsScored / awayMatches / 5, 1);
  const awayGoalsConcededPerMatch = Math.min(awayStats.goalsConceded / awayMatches / 5, 1);
  
  // Feature 7-8: Home advantage (normalized 0-1)
  const homeWinRateAtHome = homeStats.homeWins / homeMatchesAtHome;
  const awayWinRateAway = awayStats.awayWins / awayMatchesAway;
  
  // Feature 9-10: Form and goal difference (normalized -1 to 1)
  const formDifference = (homeWinRate - awayWinRate);
  const goalDifference = (homeGoalsPerMatch - homeGoalsConcededPerMatch) - 
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

// Get match outcome (label)
function getOutcome(match) {
  const homeGoals = match.goals.home || 0;
  const awayGoals = match.goals.away || 0;
  
  if (homeGoals > awayGoals) return 0; // Home win
  if (homeGoals === awayGoals) return 1; // Draw
  return 2; // Away win
}

// Prepare training data
function prepareTrainingData() {
  console.log('🔧 Preparing training data...');
  
  const features = [];
  const labels = [];
  
  let validMatches = 0;
  let skippedMatches = 0;
  
  matches.forEach(match => {
    const homeTeamId = match.teams.home.id;
    const awayTeamId = match.teams.away.id;
    
    const homeStats = teamStats[homeTeamId];
    const awayStats = teamStats[awayTeamId];
    
    // Skip if teams don't have enough data
    if (!homeStats || !awayStats || 
        homeStats.matches < 5 || awayStats.matches < 5) {
      skippedMatches++;
      return;
    }
    
    const matchFeatures = extractFeatures(match, homeStats, awayStats);
    
    // Check for NaN or invalid values
    if (matchFeatures.some(f => isNaN(f) || !isFinite(f))) {
      skippedMatches++;
      return;
    }
    
    const outcome = getOutcome(match);
    
    features.push(matchFeatures);
    labels.push(outcome);
    validMatches++;
  });
  
  console.log(`✅ Valid matches: ${validMatches}`);
  console.log(`⚠️  Skipped matches: ${skippedMatches} (insufficient or invalid data)`);
  
  return { features, labels };
}

// Manual model save function
async function saveModelManually(model, path) {
  // Get model topology and weights
  const modelJSON = model.toJSON(null, false);
  const weights = await model.getWeights();
  
  // Convert weights to arrays
  const weightData = [];
  const weightSpecs = [];
  
  for (let i = 0; i < weights.length; i++) {
    const w = weights[i];
    const data = await w.data();
    weightData.push(Array.from(data));
    weightSpecs.push({
      name: w.name,
      shape: w.shape,
      dtype: w.dtype
    });
  }
  
  // Create directory if it doesn't exist
  if (!fs.existsSync(path)) {
    fs.mkdirSync(path, { recursive: true });
  }
  
  // Save model.json
  const modelFile = {
    modelTopology: modelJSON.modelTopology,
    weightsManifest: [{
      paths: ['weights.json'],
      weights: weightSpecs
    }]
  };
  
  fs.writeFileSync(`${path}/model.json`, JSON.stringify(modelFile, null, 2));
  
  // Save weights.json
  fs.writeFileSync(`${path}/weights.json`, JSON.stringify(weightData, null, 2));
  
  console.log(`✅ Model manually saved to ${path}/`);
}

// Create and train the model
async function trainModel(features, labels) {
  console.log('\n🧠 Creating neural network...');
  
  // Convert to tensors
  const xs = tf.tensor2d(features);
  const ys = tf.oneHot(tf.tensor1d(labels, 'int32'), 3);
  
  // Create model with adjusted architecture
  const model = tf.sequential({
    layers: [
      tf.layers.dense({ inputShape: [10], units: 32, activation: 'relu', kernelInitializer: 'heNormal' }),
      tf.layers.dropout({ rate: 0.3 }),
      tf.layers.dense({ units: 16, activation: 'relu', kernelInitializer: 'heNormal' }),
      tf.layers.dropout({ rate: 0.3 }),
      tf.layers.dense({ units: 3, activation: 'softmax' })
    ]
  });
  
  // Compile model with lower learning rate
  model.compile({
    optimizer: tf.train.adam(0.0001),
    loss: 'categoricalCrossentropy',
    metrics: ['accuracy']
  });
  
  console.log('📊 Model architecture:');
  model.summary();
  
  // Train model
  console.log('\n🏋️ Training model...');
  
  const history = await model.fit(xs, ys, {
    epochs: 100,
    validationSplit: 0.2,
    batchSize: 64,
    shuffle: true,
    callbacks: {
      onEpochEnd: (epoch, logs) => {
        if ((epoch + 1) % 20 === 0) {
          console.log(
            `Epoch ${epoch + 1}/100 - ` +
            `Loss: ${logs.loss.toFixed(4)} - ` +
            `Acc: ${(logs.acc * 100).toFixed(2)}% - ` +
            `Val Loss: ${logs.val_loss.toFixed(4)} - ` +
            `Val Acc: ${(logs.val_acc * 100).toFixed(2)}%`
          );
        }
      }
    }
  });
  
  // Get final accuracy
  const finalAccuracy = history.history.val_acc[history.history.val_acc.length - 1];
  console.log(`\n✅ Training complete!`);
  console.log(`🎯 Final validation accuracy: ${(finalAccuracy * 100).toFixed(2)}%`);
  
  // Save model manually
  console.log('\n💾 Saving model...');
  await saveModelManually(model, './ml/model');
  
  // Save team stats and metadata
  const modelMetadata = {
    teamStats: teamStats,
    version: '1.0.0',
    trainedOn: new Date().toISOString(),
    accuracy: finalAccuracy,
    totalMatches: features.length,
    features: [
      'homeWinRate',
      'homeGoalsPerMatch',
      'homeGoalsConcededPerMatch',
      'awayWinRate',
      'awayGoalsPerMatch',
      'awayGoalsConcededPerMatch',
      'homeWinRateAtHome',
      'awayWinRateAway',
      'formDifference',
      'goalDifference'
    ]
  };
  
  fs.writeFileSync('./ml/model_metadata.json', JSON.stringify(modelMetadata, null, 2));
  console.log('✅ Model metadata saved to ./ml/model_metadata.json');
  
  // Cleanup
  xs.dispose();
  ys.dispose();
  
  return { model, accuracy: finalAccuracy };
}

// Main training pipeline
async function main() {
  try {
    // Step 1: Build team statistics
    buildTeamStats();
    
    // Step 2: Prepare training data
    const { features, labels } = prepareTrainingData();
    
    if (features.length < 100) {
      throw new Error('Not enough training data!');
    }
    
    // Step 3: Train model
    const { model, accuracy } = await trainModel(features, labels);
    
    console.log('\n🎉 Training pipeline complete!');
    console.log(`📊 Dataset: ${matches.length} matches`);
    console.log(`🎯 Model accuracy: ${(accuracy * 100).toFixed(2)}%`);
    console.log(`\n✅ Ready to integrate into backend!`);
    
    process.exit(0);
    
  } catch (err) {
    console.error('❌ Error during training:', err.message);
    console.error(err.stack);
    process.exit(1);
  }
}

// Run training
main();