import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-slate-50 border-t border-slate-200 mt-auto">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
        <div className="flex flex-col md:flex-row items-center md:items-start justify-between gap-6">
          <div className="text-center md:text-left">
            <span className="text-lg font-bold text-[#6366f1]">NrichSouls</span>
            <p className="text-sm text-[#64748b] mt-1">
              Wellness, Wealth &amp; Work — Real Tips for Real-Life Wins.
            </p>
          </div>
          <nav className="flex flex-wrap justify-center gap-x-6 gap-y-2">
            {[
              { href: "/", label: "Home" },
              { href: "/ai-tech-automation", label: "AI & Tech" },
              { href: "/career-growth-remote-work", label: "Career Growth" },
              { href: "/health-wellness", label: "Health & Wellness" },
              { href: "/about", label: "About" },
              { href: "/contact", label: "Contact" },
            ].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm text-[#64748b] hover:text-[#6366f1] transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="mt-8 pt-6 border-t border-slate-200 text-center text-xs text-[#94a3b8]">
          © {new Date().getFullYear()} NrichSouls. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
