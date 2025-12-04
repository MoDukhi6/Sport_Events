// app/api/football-api.ts
import { API_BASE_URL } from '../../constants/api';
const BASE_URL = API_BASE_URL;

export type Fixture = {
  fixture: { 
    id: number; 
    date: string; 
    status: { 
      short: string; 
      long: string;
      elapsed?: number; // Add this - minutes elapsed in match
    };
  };
  league: { id: number; name: string; country: string; logo: string };
  teams: {
    home: { id: number; name: string; logo: string };
    away: { id: number; name: string; logo: string };
  };
  goals: { home: number | null; away: number | null };
  score?: {
    halftime?: { home: number | null; away: number | null };
    fulltime?: { home: number | null; away: number | null };
  };
};

export type StandingTeam = {
  rank: number;
  team: { id: number; name: string; logo: string };
  points: number;
  goalsDiff: number;
  all: {
    played: number;
    win: number;
    draw: number;
    lose: number;
    goals: {
      for: number;
      against: number;
    };
  };
};

export type LeagueStandings = {
  id: number;
  name: string;
  country: string;
  logo: string;
  standings: StandingTeam[][];
};

/**
 * Get live matches
 * @param leagueId Optional - filter by specific league ID
 */
export async function getLiveMatches(leagueId?: number): Promise<Fixture[]> {
  const leagues = leagueId 
    ? String(leagueId) 
    : '39,140,135,78,61,2'; // Default: Top 5 leagues + Champions League
  
  const url = `${BASE_URL}/api/football/live?leagues=${leagues}`;
  
  console.log('🔴 Fetching live matches:', url);
  
  const res = await fetch(url);
  if (!res.ok) {
    const error = await res.text();
    console.error('Failed to load live matches:', error);
    throw new Error('Failed to load live matches');
  }
  
  return await res.json();
}

/**
 * Get today's fixtures
 * @param leagueId Optional - filter by specific league ID
 */
export async function getTodayFixtures(leagueId?: number): Promise<Fixture[]> {
  const leagues = leagueId 
    ? String(leagueId) 
    : '39,140,135,78,61,2'; // Default: Top 5 leagues + Champions League
  
  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  const url = `${BASE_URL}/api/football/fixtures/today?date=${today}&leagues=${leagues}`;
  
  console.log('📅 Fetching today\'s fixtures:', url);
  
  const res = await fetch(url);
  if (!res.ok) {
    const error = await res.text();
    console.error('Failed to load fixtures:', error);
    throw new Error('Failed to load fixtures');
  }
  
  return await res.json();
}

/**
 * Get league standings
 * @param leagueId League ID (39=EPL, 140=La Liga, 135=Serie A, 78=Bundesliga, 61=Ligue 1)
 * @param seasonYear Season year (e.g., 2024 for 2024/25 season)
 */
export async function getLeagueStandings(
  leagueId: number,
  seasonYear: number,
): Promise<LeagueStandings> {
  const url = `${BASE_URL}/api/football/standings?league=${leagueId}&season=${seasonYear}`;
  
  console.log('📊 Fetching standings:', url);
  
  const res = await fetch(url);
  if (!res.ok) {
    const error = await res.text();
    console.error('Failed to load standings:', error);
    throw new Error('Failed to load standings');
  }
  
  const data = await res.json();
  
  return data;
}

/**
 * Search for teams by name
 * @param query Search query
 */
export async function searchTeams(query: string): Promise<any[]> {
  const url = `${BASE_URL}/api/football/teams/search?q=${encodeURIComponent(query)}`;
  
  console.log('🔍 Searching teams:', url);
  
  const res = await fetch(url);
  if (!res.ok) {
    const error = await res.text();
    console.error('Failed to search teams:', error);
    throw new Error('Failed to search teams');
  }
  
  return await res.json();
}

/**
 * Get detailed match information by fixture ID
 * @param fixtureId Fixture ID
 */
export async function getMatchById(fixtureId: number): Promise<Fixture | null> {
  const url = `${BASE_URL}/api/football/match/${fixtureId}`;
  
  console.log('🎯 Fetching match details:', url);
  
  const res = await fetch(url);
  if (!res.ok) {
    const error = await res.text();
    console.error('Failed to load match:', error);
    throw new Error('Failed to load match');
  }
  
  return await res.json();
}

/**
 * Get team information by team ID
 * @param teamId Team ID
 */
export async function getTeamById(teamId: number): Promise<any | null> {
  const url = `${BASE_URL}/api/football/team/${teamId}`;
  
  console.log('👥 Fetching team details:', url);
  
  const res = await fetch(url);
  if (!res.ok) {
    const error = await res.text();
    console.error('Failed to load team:', error);
    throw new Error('Failed to load team');
  }
  
  return await res.json();
}

// Helper function to get current season year
export function getCurrentSeasonYear(): number {
  const now = new Date();
  // Season starts in August (month 7, 0-indexed)
  // If we're in August-December, use current year
  // If we're in January-July, use previous year
  return now.getMonth() >= 7 ? now.getFullYear() : now.getFullYear() - 1;
}

// League IDs for reference
export const LEAGUE_IDS = {
  PREMIER_LEAGUE: 39,
  LA_LIGA: 140,
  SERIE_A: 135,
  BUNDESLIGA: 78,
  LIGUE_1: 61,
  CHAMPIONS_LEAGUE: 2,
} as const;

// League names mapping
export const LEAGUE_NAMES: Record<number, string> = {
  39: 'Premier League',
  140: 'La Liga',
  135: 'Serie A',
  78: 'Bundesliga',
  61: 'Ligue 1',
  2: 'Champions League',
};