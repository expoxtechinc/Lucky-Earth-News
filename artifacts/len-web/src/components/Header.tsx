import { Link, useRoute } from "wouter";

export default function Header() {
  const [isHome] = useRoute("/");
  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 text-gray-900 no-underline">
          <span className="text-2xl">🌍</span>
          <span className="font-semibold text-lg">
            Lucky Earth <strong className="text-[#1a6b3c]">News</strong>
          </span>
        </Link>
        <nav className="flex gap-1">
          <Link
            href="/"
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors no-underline ${
              isHome ? "bg-[#e8f5ee] text-[#1a6b3c]" : "text-gray-500 hover:text-[#1a6b3c] hover:bg-[#e8f5ee]"
            }`}
          >
            Home
          </Link>
          <Link
            href="/admin"
            className="px-3 py-1.5 rounded-md text-sm font-semibold text-[#1a6b3c] hover:bg-[#e8f5ee] transition-colors no-underline"
          >
            Admin
          </Link>
        </nav>
      </div>
    </header>
  );
}
