// server/ml/fetchTrainingData.js
const axios = require('axios');
const fs = require('fs');
require('dotenv').config();

const api = axios.create({
  baseURL: 'https://v3.football.api-sports.io',
  headers: {
    'x-apisports-key': process.env.API_FOOTBALL_KEY,
  },
});

// Major leagues to fetch data from
const LEAGUES = [
  { id: 39, name: 'Premier League' },      // England
  { id: 140, name: 'La Liga' },            // Spain
  { id: 135, name: 'Serie A' },            // Italy
  { id: 78, name: 'Bundesliga' },          // Germany
  { id: 61, name: 'Ligue 1' },             // France
  { id: 2, name: 'Champions League' },     // UEFA Champions League
];

const SEASONS = [2025, 2024, 2023]; // Current season + last 2 seasons

async function fetchHistoricalMatches() {
  console.log('🚀 Starting data collection...');
  console.log(`📊 Fetching from ${LEAGUES.length} leagues, ${SEASONS.length} seasons (2023-2025)`);
  
  const allMatches = [];
  let requestCount = 0;
  const maxRequests = 1000;

  try {
    for (const league of LEAGUES) {
      for (const season of SEASONS) {
        if (requestCount >= maxRequests) {
          console.log(`⚠️ Reached ${maxRequests} requests limit`);
          break;
        }

        console.log(`\n📥 Fetching ${league.name} - Season ${season}...`);

        try {
          const response = await api.get('/fixtures', {
            params: {
              league: league.id,
              season: season,
            },
          });

          requestCount++;
          console.log(`   Request ${requestCount}/${maxRequests}`);

          const fixtures = response.data.response || [];
          
          // Filter only finished matches (we need actual results for training)
          const finishedMatches = fixtures.filter(f => 
            f.fixture.status.short === 'FT' || 
            f.fixture.status.short === 'AET' || 
            f.fixture.status.short === 'PEN'
          );

          console.log(`   ✅ Found ${finishedMatches.length} finished matches`);

          // Add league and season info
          finishedMatches.forEach(match => {
            match.leagueInfo = {
              id: league.id,
              name: league.name,
              season: season,
            };
          });

          allMatches.push(...finishedMatches);

          // Small delay to avoid rate limiting
          await sleep(100);

        } catch (err) {
          console.error(`   ❌ Error fetching ${league.name} ${season}:`, err.message);
        }

        if (requestCount >= maxRequests) break;
      }
      if (requestCount >= maxRequests) break;
    }

    console.log(`\n✅ Data collection complete!`);
    console.log(`📊 Total matches collected: ${allMatches.length}`);
    console.log(`📡 API requests used: ${requestCount}`);

    // Save to file
    const outputPath = './ml/historical_matches.json';
    fs.writeFileSync(outputPath, JSON.stringify(allMatches, null, 2));
    console.log(`💾 Saved to: ${outputPath}`);

    // Print statistics
    printStatistics(allMatches);

    console.log('\n🎉 Ready for training! Run the training script next.');

  } catch (err) {
    console.error('❌ Fatal error:', err.message);
  }
}

function printStatistics(matches) {
  console.log('\n📈 Dataset Statistics:');
  
  const homeWins = matches.filter(m => m.goals.home > m.goals.away).length;
  const draws = matches.filter(m => m.goals.home === m.goals.away).length;
  const awayWins = matches.filter(m => m.goals.home < m.goals.away).length;

  console.log(`   Home Wins: ${homeWins} (${((homeWins/matches.length)*100).toFixed(1)}%)`);
  console.log(`   Draws: ${draws} (${((draws/matches.length)*100).toFixed(1)}%)`);
  console.log(`   Away Wins: ${awayWins} (${((awayWins/matches.length)*100).toFixed(1)}%)`);

  const byLeague = {};
  matches.forEach(m => {
    const leagueName = m.leagueInfo.name;
    byLeague[leagueName] = (byLeague[leagueName] || 0) + 1;
  });

  console.log('\n   By League:');
  Object.entries(byLeague).forEach(([league, count]) => {
    console.log(`   - ${league}: ${count} matches`);
  });

  const bySeason = {};
  matches.forEach(m => {
    const season = m.leagueInfo.season;
    bySeason[season] = (bySeason[season] || 0) + 1;
  });

  console.log('\n   By Season:');
  Object.entries(bySeason).sort().forEach(([season, count]) => {
    console.log(`   - ${season}: ${count} matches`);
  });
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Run the script
fetchHistoricalMatches().catch(console.error);