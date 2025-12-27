// server/utils/cronJobs.js
const cron = require('node-cron');
const fetch = require('node-fetch');

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:4000';

// Function to check all pending predictions
async function checkAllPendingPredictions() {
  try {
    console.log('🔄 Cron Job: Checking pending predictions...');
    
    const response = await fetch(`${API_BASE_URL}/api/user-predictions/check-all-results`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (response.ok) {
      console.log(`✅ Cron Job: Checked ${data.checkedMatches} matches, updated ${data.updatedPredictions} predictions`);
    } else {
      console.error('❌ Cron Job Error:', data.error);
    }
  } catch (err) {
    console.error('❌ Cron Job Error:', err.message);
  }
}

// Schedule the cron job
function startCronJobs() {
  // Run every 2 hours at minute 0
  // Pattern: '0 */2 * * *' means "at minute 0 of every 2nd hour"
  cron.schedule('0 */2 * * *', () => {
    console.log('⏰ Running 2-hourly prediction check...');
    checkAllPendingPredictions();
  });

  console.log('✅ Cron jobs started successfully!');
  console.log('   - Check interval: Every 2 hours');
  console.log('   - Next check: Top of the next even hour (00:00, 02:00, 04:00, etc.)');
}

module.exports = { startCronJobs };