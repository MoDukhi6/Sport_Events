// app/api/news-api.ts
import { API_BASE_URL } from '../../constants/api';

export type Article = {
  title: string;
  description: string | null;
  url: string;
  urlToImage: string | null;
  source: string | null;
  publishedAt: string;
};

/**
 * Fetch sports news from your Node backend
 * category = 'all' | 'football' | 'basketball' | ...
 * page = 1, 2, 3...
 * search = optional search query
 */
export async function fetchSportsNews(
  category: string,
  page: number = 1,
  search?: string
): Promise<Article[]> {
  const params = new URLSearchParams({
    sport: category,
    page: page.toString(),
  });

  if (search && search.trim()) {
    params.append('search', search.trim());
  }

  const url = `${API_BASE_URL}/api/news?${params}`;

  console.log('📰 fetchSportsNews calling:', url);

  try {
    const res = await fetch(url);
    const data = await res.json();

    console.log('📰 fetchSportsNews response:', data);

    if (!res.ok) {
      throw new Error(
        data?.error || data?.message || 'Failed to fetch sports news'
      );
    }

    // backend already returns { articles: [...] }
    return (data.articles ?? []) as Article[];
  } catch (err) {
    console.error('❌ fetchSportsNews error:', err);
    throw err;
  }
}