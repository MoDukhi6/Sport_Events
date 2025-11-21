// app/api/client.ts (or wherever you like)

const BASE_URL = 'http://10.0.0.10:4000'; // real IP

export async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`);
  if (!res.ok) {
    throw new Error(`Request failed with status ${res.status}`);
  }
  return res.json();
}
