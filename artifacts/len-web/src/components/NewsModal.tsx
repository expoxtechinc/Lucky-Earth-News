import { useEffect } from "react";
import { NewsItem } from "@/lib/api";

interface Props {
  item: NewsItem | null;
  onClose: () => void;
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

export default function NewsModal({ item, onClose }: Props) {
  useEffect(() => {
    if (!item) return;
    document.body.style.overflow = "hidden";
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => { document.body.style.overflow = ""; window.removeEventListener("keydown", handler); };
  }, [item, onClose]);

  if (!item) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/55 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-10 w-9 h-9 rounded-full bg-black/10 hover:bg-black/20 flex items-center justify-center text-xl transition-colors"
        >
          ×
        </button>
        {item.image && (
          <img src={item.image} alt={item.title} className="w-full h-64 object-cover rounded-t-xl" />
        )}
        <div className="p-6">
          <span className="inline-block px-2.5 py-0.5 bg-[#e8f5ee] text-[#1a6b3c] rounded-full text-xs font-semibold uppercase tracking-wide mb-3">
            {item.category}
          </span>
          <h2 className="text-2xl font-extrabold text-gray-900 leading-tight mb-2">{item.title}</h2>
          <p className="text-xs text-gray-400 mb-4">{fmtDate(item.createdAt)}</p>
          <p className="text-base text-gray-600 leading-relaxed">{item.content}</p>
          {item.video && (
            <a
              href={item.video}
              target="_blank"
              rel="noreferrer"
              className="inline-block mt-5 px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-semibold text-sm transition-colors no-underline"
            >
              ▶ Watch Video
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
