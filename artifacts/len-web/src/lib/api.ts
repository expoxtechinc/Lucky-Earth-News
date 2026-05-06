const backendUrl = (import.meta.env.VITE_API_URL as string | undefined) ?? "";
export const API_BASE = backendUrl ? `${backendUrl}/api` : "/api";

export async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...options?.headers },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err.message || "Request failed");
  }
  return res.json();
}

export function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem("len_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export interface NewsItem {
  _id: string;
  title: string;
  content: string;
  image: string;
  video: string;
  category: string;
  createdAt: string;
}

export interface NewsResponse {
  news: NewsItem[];
  total: number;
  page: number;
  pages: number;
}
