// fetchData.js
export async function fetchFixtures(leagueId) {
  const API_TOKEN = '0Dp1wAE5lGy9hCRlENVZD3ZM5KYKfDoaZsk5awK0K9FVJMZ5gPtqkgufoKlp'; // your real token
  const url = `https://api.sportmonks.com/v3/football/fixtures/upcoming?filter=fixtureLeagues:[${leagueId}]&api_token=${API_TOKEN}`;

  try {
    const response = await fetch(url, { headers: { Accept: 'application/json' } });
    if (!response.ok) throw new Error(`HTTP error: ${response.status}`);
    const json = await response.json();
    return json.data; // the fixtures array
  } catch (err) {
    console.error('Error fetching fixtures:', err);
    return [];
  }
}