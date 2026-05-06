import { useEffect, useState } from "react";
import { Link, useParams } from "wouter";
import { apiFetch, NewsItem } from "@/lib/api";

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("en-US", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });
}

function generateSlug(title: string) {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function ShareButtons({ title, url }: { title: string; url: string }) {
  const [copied, setCopied] = useState(false);

  const copyLink = () => {
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`;
  const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(title + " " + url)}`;

  return (
    <div className="flex items-center gap-3 flex-wrap">
      <span className="text-sm font-semibold text-gray-500">Share:</span>
      <a
        href={twitterUrl}
        target="_blank"
        rel="noreferrer"
        className="flex items-center gap-1.5 px-3 py-1.5 bg-black text-white rounded-lg text-xs font-semibold hover:bg-gray-800 transition-colors no-underline"
      >
        𝕏 Twitter
      </a>
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noreferrer"
        className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500 text-white rounded-lg text-xs font-semibold hover:bg-green-600 transition-colors no-underline"
      >
        WhatsApp
      </a>
      <button
        onClick={copyLink}
        className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-xs font-semibold hover:bg-gray-200 transition-colors cursor-pointer"
      >
        {copied ? "✓ Copied!" : "Copy Link"}
      </button>
    </div>
  );
}

function getYouTubeId(url: string): string | null {
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/);
  return match ? match[1] : null;
}

export default function ArticlePage() {
  const { id } = useParams<{ id: string }>();
  const [article, setArticle] = useState<NewsItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    apiFetch<NewsItem>(`/news/${id}`)
      .then(data => {
        setArticle(data);
        document.title = `${data.title} — Lucky Earth News`;
      })
      .catch(() => setError("Article not found or failed to load."))
      .finally(() => setLoading(false));

    return () => { document.title = "Lucky Earth News"; };
  }, [id]);

  const pageUrl = typeof window !== "undefined" ? window.location.href : "";

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-gray-200 border-t-[#1a6b3c] rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 text-center px-4">
        <div className="text-5xl">📰</div>
        <h1 className="text-2xl font-bold text-gray-800">Article not found</h1>
        <p className="text-gray-500">{error || "This article may have been removed."}</p>
        <Link href="/" className="px-5 py-2.5 bg-[#1a6b3c] text-white rounded-lg font-semibold text-sm hover:bg-[#135230] transition-colors no-underline">
          ← Back to News
        </Link>
      </div>
    );
  }

  const ytId = article.video ? getYouTubeId(article.video) : null;
  const paragraphs = article.content.split(/\n+/).filter(Boolean);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumb bar */}
      <div className="bg-white border-b border-gray-100 sticky top-14 z-40">
        <div className="max-w-4xl mx-auto px-4 py-2.5 flex items-center gap-2 text-sm">
          <Link href="/" className="text-[#1a6b3c] font-medium hover:underline no-underline">Home</Link>
          <span className="text-gray-300">/</span>
          <Link href="/" className="text-[#1a6b3c] font-medium hover:underline no-underline">News</Link>
          <span className="text-gray-300">/</span>
          <span className="text-gray-500 truncate max-w-xs">{article.title}</span>
        </div>
      </div>

      <article className="max-w-4xl mx-auto px-4 py-8">
        {/* Category + Back */}
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <span className="inline-block px-3 py-1 bg-[#e8f5ee] text-[#1a6b3c] rounded-full text-xs font-bold uppercase tracking-wider">
            {article.category}
          </span>
          <Link
            href="/"
            className="text-sm text-gray-500 hover:text-[#1a6b3c] font-medium transition-colors no-underline flex items-center gap-1"
          >
            ← Back to all news
          </Link>
        </div>

        {/* Title */}
        <h1 className="text-2xl sm:text-4xl font-extrabold text-gray-900 leading-tight mb-4">
          {article.title}
        </h1>

        {/* Meta */}
        <div className="flex items-center gap-4 text-sm text-gray-400 mb-6 pb-6 border-b border-gray-100">
          <span>🌍 Lucky Earth News</span>
          <span>{fmtDate(article.createdAt)}</span>
        </div>

        {/* Hero image */}
        {article.image && (
          <div className="mb-8 rounded-2xl overflow-hidden shadow-md">
            <img
              src={article.image}
              alt={article.title}
              className="w-full max-h-[500px] object-cover"
              onError={e => { (e.target as HTMLImageElement).style.display = "none"; }}
            />
          </div>
        )}

        {/* Content */}
        <div className="prose prose-lg max-w-none text-gray-700 leading-relaxed mb-8 space-y-4">
          {paragraphs.length > 1 ? (
            paragraphs.map((para, i) => (
              <p key={i} className="text-base sm:text-lg leading-relaxed text-gray-700">{para}</p>
            ))
          ) : (
            <p className="text-base sm:text-lg leading-relaxed text-gray-700">{article.content}</p>
          )}
        </div>

        {/* Video */}
        {article.video && (
          <div className="mb-8">
            <h3 className="text-lg font-bold text-gray-900 mb-3">Video</h3>
            {ytId ? (
              <div className="aspect-video rounded-xl overflow-hidden shadow-md">
                <iframe
                  src={`https://www.youtube.com/embed/${ytId}`}
                  title={article.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="w-full h-full"
                />
              </div>
            ) : (
              <a
                href={article.video}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 px-5 py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-semibold text-sm transition-colors no-underline"
              >
                ▶ Watch Video
              </a>
            )}
          </div>
        )}

        {/* Share */}
        <div className="py-6 border-t border-gray-100 mb-8">
          <ShareButtons title={article.title} url={pageUrl} />
        </div>

        {/* Back CTA */}
        <div className="bg-gradient-to-br from-[#1a6b3c] to-[#0e4a2a] rounded-2xl p-6 text-center text-white">
          <h3 className="text-lg font-bold mb-2">Stay Informed</h3>
          <p className="text-sm opacity-80 mb-4">Discover more stories from around the world.</p>
          <Link
            href="/"
            className="inline-block px-6 py-2.5 bg-white text-[#1a6b3c] rounded-lg font-semibold text-sm hover:bg-gray-100 transition-colors no-underline"
          >
            View All News
          </Link>
        </div>
      </article>

      <footer className="text-center py-8 text-sm text-gray-400 border-t border-gray-100 bg-white mt-8">
        © 2026 Lucky Earth News. All rights reserved.
      </footer>
    </div>
  );
}
