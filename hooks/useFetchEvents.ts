/*// useFetchEvents.ts
import { useEffect, useState } from 'react';
import { fetchFixtures } from '../scripts/fetchData'; // or your correct path

export default function useFetchEvents(leagueId: string | undefined) {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!leagueId) {
      setEvents([]);
      setLoading(false);
      return;
    }

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchFixtures(leagueId);
        setEvents(Array.isArray(data) ? data : []);
      } catch (err: any) {
        setError(err.message || 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [leagueId]);

  return { events, loading, error };
}
*/

// hooks/useFetchEvents.ts
import { useEffect, useState } from 'react';
import { API_BASE_URL } from '../constants/api';

export type SportType =
  | 'all'
  | 'football'
  | 'basketball'
  | 'baseball'
  | 'tennis'
  | 'formula1'
  | 'hockey';

export type NewsArticle = {
  title: string;
  description: string | null;
  url: string;
  urlToImage: string | null;
  source: string | null;
  publishedAt: string;
};

export function useFetchEvents(sport: SportType) {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        setLoading(true);
        setError(null);

        const url = `${API_BASE_URL}/api/news?sport=${encodeURIComponent(
          sport
        )}&page=1`;

        console.log('📰 Fetching news from:', url);

        const res = await fetch(url);
        const data = await res.json();

        console.log('📰 News response:', data);

        if (!res.ok) {
          throw new Error(data?.error || data?.message || 'Failed to fetch news');
        }

        setArticles(data.articles || []);
      } catch (e: any) {
        console.log('❌ Error fetching news:', e?.message || e);
        setError(e?.message ?? 'Failed to fetch news');
      } finally {
        setLoading(false);
      }
    };

    fetchNews();
  }, [sport]);

  return { articles, loading, error };
}

// Allow both default and named import
export default useFetchEvents;