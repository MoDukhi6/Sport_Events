// useFetchEvents.ts
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