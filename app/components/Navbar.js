"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/ai-tech-automation", label: "AI & Tech", dot: "#8b5cf6" },
  { href: "/career-growth-remote-work", label: "Career Growth", dot: "#f59e0b" },
  { href: "/health-wellness", label: "Health", dot: "#10b981" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

export default function Navbar() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-slate-100 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <Link href="/" className="text-xl font-bold text-[#6366f1] tracking-tight">
          NrichSouls
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-6">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            const activeColor = link.dot ?? "#6366f1";
            return (
              <Link
                key={link.href}
                href={link.href}
                className="relative group flex items-center gap-1.5 text-sm font-medium pb-1 transition-colors"
                style={{ color: isActive ? activeColor : undefined }}
              >
                {/* Colored dot for category links */}
                {link.dot && (
                  <span
                    className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: link.dot }}
                  />
                )}
                <span className={!isActive ? "text-[#1e293b] group-hover:text-[#374151]" : ""}>
                  {link.label}
                </span>
                {/* Animated underline */}
                <span
                  className={`absolute bottom-0 left-0 h-[2px] transition-all duration-200 ${
                    isActive ? "w-full" : "w-0 group-hover:w-full"
                  }`}
                  style={{ backgroundColor: activeColor }}
                />
              </Link>
            );
          })}
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden p-2 rounded-lg text-[#1e293b] hover:bg-slate-100 transition-colors"
          onClick={() => setMenuOpen((prev) => !prev)}
          aria-label="Toggle menu"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {menuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-slate-100 bg-white px-4 py-3 flex flex-col gap-1">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            const activeColor = link.dot ?? "#6366f1";
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-2 py-2 px-3 rounded-lg text-sm font-medium transition-colors hover:bg-slate-50"
                style={
                  isActive
                    ? { backgroundColor: `${activeColor}18`, color: activeColor }
                    : { color: "#1e293b" }
                }
              >
                {link.dot && (
                  <span
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: link.dot }}
                  />
                )}
                {link.label}
              </Link>
            );
          })}
        </div>
      )}
    </nav>
  );
}
