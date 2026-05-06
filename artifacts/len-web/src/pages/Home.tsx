import { useState, useEffect, useCallback } from "react";
import { apiFetch, NewsItem, NewsResponse } from "@/lib/api";
import NewsCard from "@/components/NewsCard";

export default function Home() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCat, setSelectedCat] = useState("all");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    apiFetch<string[]>("/news/categories")
      .then(setCategories)
      .catch(() => {});
  }, []);

  const fetchNews = useCallback(async (reset: boolean, pg: number, cat: string, q: string) => {
    if (reset) setLoading(true); else setLoadingMore(true);
    try {
      const params = new URLSearchParams({ page: String(pg), limit: "12" });
      if (cat !== "all") params.set("category", cat);
      if (q) params.set("search", q);
      const data = await apiFetch<NewsResponse>(`/news?${params}`);
      setNews(prev => reset ? data.news : [...prev, ...data.news]);
      setTotalPages(data.pages);
    } catch {}
    finally { setLoading(false); setLoadingMore(false); }
  }, []);

  useEffect(() => {
    setPage(1);
    fetchNews(true, 1, selectedCat, search);
  }, [selectedCat, search, fetchNews]);

  const handleLoadMore = () => {
    const next = page + 1;
    setPage(next);
    fetchNews(false, next, selectedCat, search);
  };

  const handleSearch = () => {
    setSearch(searchInput.trim());
    setSelectedCat("all");
  };

  return (
    <div>
      {/* Hero */}
      <div className="bg-gradient-to-br from-[#1a6b3c] to-[#0e4a2a] text-white py-14 px-4 text-center">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl sm:text-5xl font-extrabold leading-tight mb-3">
            Your World. <span className="text-amber-400">Your News.</span>
          </h1>
          <p className="text-base sm:text-lg opacity-85 mb-8">
            Real stories, real time — delivered fresh from every corner of the globe.
          </p>
          <div className="flex gap-2 max-w-lg mx-auto">
            <input
              type="text"
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSearch()}
              placeholder="Search news..."
              className="flex-1 px-4 py-3 rounded-lg text-gray-900 text-base outline-none focus:ring-2 focus:ring-amber-400"
            />
            <button
              onClick={handleSearch}
              className="px-5 py-3 bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded-lg transition-colors whitespace-nowrap"
            >
              Search
            </button>
          </div>
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Category filters */}
        <div className="overflow-x-auto -mx-4 px-4 mb-6">
          <div className="flex gap-2 w-max">
            {["all", ...categories].map(cat => (
              <button
                key={cat}
                onClick={() => { setSelectedCat(cat); setSearchInput(""); setSearch(""); }}
                className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-all whitespace-nowrap cursor-pointer ${
                  selectedCat === cat
                    ? "bg-[#1a6b3c] border-[#1a6b3c] text-white"
                    : "bg-white border-gray-200 text-gray-500 hover:border-[#1a6b3c] hover:text-[#1a6b3c]"
                }`}
              >
                {cat === "all" ? "All" : cat}
              </button>
            ))}
          </div>
        </div>

        {/* News grid */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-10 h-10 border-4 border-gray-200 border-t-[#1a6b3c] rounded-full animate-spin" />
          </div>
        ) : news.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            <div className="text-5xl mb-4">📰</div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No news found</h3>
            <p className="text-sm">Try a different search or category.</p>
            <p className="text-xs mt-3 text-gray-400">
              If this is your first time, visit <a href="/admin" className="text-[#1a6b3c] font-medium">Admin</a> and click "Seed DB" to load sample articles.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {news.map(item => (
              <NewsCard key={item._id} item={item} />
            ))}
          </div>
        )}

        {/* Load more */}
        {page < totalPages && !loading && (
          <div className="text-center mt-8">
            <button
              onClick={handleLoadMore}
              disabled={loadingMore}
              className="px-8 py-3 bg-white border-2 border-[#1a6b3c] text-[#1a6b3c] font-semibold rounded-lg hover:bg-[#1a6b3c] hover:text-white transition-all disabled:opacity-50"
            >
              {loadingMore ? "Loading…" : "Load More"}
            </button>
          </div>
        )}
      </main>

      <footer className="text-center py-8 text-sm text-gray-400 border-t border-gray-100 bg-white mt-8">
        © 2026 Lucky Earth News. All rights reserved.
      </footer>
    </div>
  );
}
