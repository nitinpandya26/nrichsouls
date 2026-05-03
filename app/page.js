import Link from "next/link";
import BlogCard from "./components/BlogCard";
import NewsletterSection from "./components/NewsletterSection";
import { getAllPosts, mergeAndSort } from "../lib/posts";
import { getNotionPosts } from "../lib/notion";

export const revalidate = 60;

const CATEGORIES = [
  {
    href: "/ai-tech-automation",
    emoji: "🤖",
    title: "AI, Tech & Automation",
    desc: "Demystify AI tools, automate workflows, and boost productivity — even if you're not a techie.",
    gradient: "from-indigo-500 to-purple-600",
    shadow: "hover:shadow-purple-200",
    accent: "#8b5cf6",
  },
  {
    href: "/career-growth-remote-work",
    emoji: "📈",
    title: "Career Growth",
    desc: "Job hunting, resume tips, remote work strategies, and building your personal brand.",
    gradient: "from-orange-400 to-amber-500",
    shadow: "hover:shadow-amber-200",
    accent: "#f59e0b",
  },
  {
    href: "/health-wellness",
    emoji: "🌿",
    title: "Health & Wellness",
    desc: "Science-backed wellness, nutrition, sleep, and mental clarity — routines you can stick to.",
    gradient: "from-emerald-400 to-teal-500",
    shadow: "hover:shadow-emerald-200",
    accent: "#10b981",
  },
];

export default async function HomePage() {
  const mdPosts = getAllPosts();
  let notionPosts = [];
  try { notionPosts = await getNotionPosts(); } catch {}
  const featured = mergeAndSort(notionPosts, mdPosts).slice(0, 3);

  return (
    <>
      {/* ── Hero ── */}
      <section className="relative bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-400 text-white py-28 px-4 overflow-hidden">
        {/* Dot pattern overlay */}
        <div
          className="absolute inset-0 opacity-[0.12]"
          style={{
            backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
        />
        <div className="relative max-w-4xl mx-auto text-center">
          <span className="inline-block bg-white/20 backdrop-blur-sm text-white text-xs font-semibold px-4 py-1.5 rounded-full mb-6 tracking-wide">
            Practical Insights · Free Forever
          </span>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight mb-5">
            Wellness, Wealth &amp; Work
          </h1>
          <p className="text-lg sm:text-xl text-white/90 max-w-2xl mx-auto mb-10 leading-relaxed">
            Your go-to blog for AI &amp; Tech, Career Growth, and Health &amp; Wellness
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center flex-wrap">
            <Link
              href="/ai-tech-automation"
              className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold px-7 py-3 rounded-full hover:opacity-90 transition-opacity shadow-lg shadow-purple-500/30"
            >
              🤖 AI &amp; Tech
            </Link>
            <Link
              href="/career-growth-remote-work"
              className="bg-gradient-to-r from-orange-500 to-amber-500 text-white font-semibold px-7 py-3 rounded-full hover:opacity-90 transition-opacity shadow-lg shadow-amber-500/30"
            >
              📈 Career Growth
            </Link>
            <Link
              href="/health-wellness"
              className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold px-7 py-3 rounded-full hover:opacity-90 transition-opacity shadow-lg shadow-emerald-500/30"
            >
              🌿 Health &amp; Wellness
            </Link>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 animate-bounce">
          <svg className="w-6 h-6 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </section>

      {/* ── Explore Categories ── */}
      <section className="bg-[#f8fafc] py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#1e293b]">
              Explore Categories
            </h2>
            <p className="text-[#64748b] mt-2">
              Dive deep into the topics that matter most to you
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {CATEGORIES.map((cat) => (
              <Link
                key={cat.href}
                href={cat.href}
                className={`group relative bg-gradient-to-br ${cat.gradient} rounded-2xl p-8 text-white overflow-hidden transition-all duration-200 hover:scale-[1.02] hover:shadow-2xl ${cat.shadow}`}
              >
                {/* Subtle inner glow */}
                <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-5 transition-opacity rounded-2xl" />
                <div className="relative">
                  <span className="text-5xl mb-4 block">{cat.emoji}</span>
                  <h3 className="text-xl font-bold mb-2">{cat.title}</h3>
                  <p className="text-white/80 text-sm leading-relaxed mb-5">
                    {cat.desc}
                  </p>
                  <span className="inline-flex items-center gap-1 text-sm font-semibold text-white/90 group-hover:gap-2 transition-all">
                    Explore
                    <span className="transition-transform duration-150 group-hover:translate-x-0.5">→</span>
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── About Strip ── */}
      <section className="bg-white py-14 px-4">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div>
            <span className="text-xs font-semibold text-[#6366f1] uppercase tracking-widest mb-2 block">
              About NrichSouls
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#1e293b] mb-4 leading-snug">
              What is NrichSouls?
            </h2>
            <p className="text-[#64748b] leading-relaxed">
              NrichSouls is a free blog for curious, ambitious people who want
              to grow in every area of life. We publish practical, no-fluff
              insights across AI &amp; Tech, Career Growth, and Health &amp;
              Wellness — so you can work smarter, earn more, and feel better.
            </p>
            <Link href="/about" className="inline-block mt-5 text-sm font-semibold text-[#6366f1] hover:underline">
              Learn more about us →
            </Link>
          </div>
          <div className="grid grid-cols-3 gap-4">
            {[
              { value: "3", label: "Categories" },
              { value: "40+", label: "Articles" },
              { value: "Free", label: "Forever" },
            ].map((stat) => (
              <div
                key={stat.label}
                className="bg-[#f8fafc] rounded-2xl border border-slate-100 p-5 text-center flex flex-col items-center gap-1"
              >
                <span className="text-2xl sm:text-3xl font-extrabold text-[#6366f1]">
                  {stat.value}
                </span>
                <span className="text-xs text-[#64748b] font-medium">{stat.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Latest Articles ── */}
      <section className="bg-[#f8fafc] py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-[#1e293b]">Latest Articles</h2>
            <Link href="/ai-tech-automation" className="text-sm text-[#6366f1] font-medium hover:underline">
              View all →
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
            {featured.map((post) => (
              <BlogCard key={post.slug} post={post} />
            ))}
          </div>
        </div>
      </section>

      {/* ── Newsletter ── */}
      <NewsletterSection />
    </>
  );
}
