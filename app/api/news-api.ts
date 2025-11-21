// api/news-api.ts

// 👇 Put your correct local IP address here (NOT localhost)
const BASE_URL = "http://10.0.0.10:4000"; //real IP

export type Article = {
  title: string;
  description: string | null;
  url: string;
  urlToImage: string | null;
  source: string | null;
  publishedAt: string | null;
};

export async function fetchSportsNews(sport: string = 'all', page: number = 1): Promise<Article[]> {
  const url =`${BASE_URL}/api/news` +`?sport=${encodeURIComponent(sport)}` + `&page=${encodeURIComponent(page)}`;
  
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch news: ${response.status}`);
  }

  const data = await response.json();
  return data.articles ?? [];
}
