"use client";

import Link from "next/link";

export default function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur supports-[backdrop-filter]:bg-white/60 bg-white/70 border-b border-[#e8e2cf]">
      <div className="mx-auto max-w-7xl px-4 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#ffdc6b] via-[#fca5a5] to-[#a78bfa] shadow-inner"></div>
          <span className="text-2xl font-extrabold tracking-wide text-[#5b217f] group-hover:text-[#7c2da3] transition-colors">
            StoryPal
          </span>
        </Link>
        <nav className="hidden md:flex items-center gap-6 text-[#5b217f]">
          <Link href="/" className="hover:underline underline-offset-4">
            Home
          </Link>
          <Link href="/parent" className="hover:underline underline-offset-4">
            Parent
          </Link>
          <Link href="/child" className="hover:underline underline-offset-4">
            Child
          </Link>
        </nav>
      </div>
    </header>
  );
}


