import { Link } from "wouter";
import { NewsItem } from "@/lib/api";

interface Props {
  item: NewsItem;
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function NewsCard({ item }: Props) {
  return (
    <Link href={`/news/${item._id}`} className="no-underline block group">
      <article className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 flex flex-col h-full cursor-pointer">
        <div className="relative h-48 overflow-hidden bg-gray-100">
          {item.image ? (
            <img
              src={item.image}
              alt={item.title}
              loading="lazy"
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              onError={(e) => {
                (e.target as HTMLImageElement).parentElement!.innerHTML =
                  '<div class="w-full h-full flex items-center justify-center text-5xl bg-[#e8f5ee]">📰</div>';
              }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-5xl bg-[#e8f5ee]">📰</div>
          )}
        </div>
        <div className="p-4 flex flex-col gap-2 flex-1">
          <div className="flex items-center justify-between gap-2">
            <span className="inline-block px-2.5 py-0.5 bg-[#e8f5ee] text-[#1a6b3c] rounded-full text-xs font-semibold uppercase tracking-wide">
              {item.category}
            </span>
            <span className="text-xs text-gray-400">{fmtDate(item.createdAt)}</span>
          </div>
          <h2 className="text-base font-bold leading-snug text-gray-900 line-clamp-2 group-hover:text-[#1a6b3c] transition-colors">
            {item.title}
          </h2>
          <p className="text-sm text-gray-500 leading-relaxed line-clamp-3 flex-1">{item.content}</p>
        </div>
        <div className="px-4 py-2.5 border-t border-gray-100 flex items-center justify-between">
          <span className="text-sm font-semibold text-[#1a6b3c] group-hover:underline">Read Full Story →</span>
          {item.video && <span className="text-xs text-amber-600 font-medium">▶ Video</span>}
        </div>
      </article>
    </Link>
  );
}
