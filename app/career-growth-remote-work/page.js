import BlogCard from "../components/BlogCard";
import { getPostsByCategory } from "../../lib/posts";
import { getNotionPostsByCategory } from "../../lib/notion";

export const revalidate = 60;

export const metadata = {
  title: "Career Growth & Remote Work — NrichSouls",
  description:
    "Tips on job hunting, remote work, personal branding, and growing your career in the modern world.",
};

const ACCENT = "#f59e0b";

export default async function CareerGrowthPage() {
  const mdPosts = getPostsByCategory("career-growth-remote-work");
  let notionPosts = [];
  try { notionPosts = await getNotionPostsByCategory("career-growth-remote-work"); } catch {}
  const mdSlugs = new Set(mdPosts.map((p) => p.slug));
  const notionOnlyPosts = notionPosts.filter((p) => !mdSlugs.has(p.slug));
  const posts = [...mdPosts, ...notionOnlyPosts]
    .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));

  return (
    <>
      {/* ── Category Hero Banner ── */}
      <section className="relative bg-gradient-to-r from-orange-500 to-amber-600 text-white overflow-hidden">
        {/* Dot pattern */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
        />

        {/* Decorative bar-chart / growth shapes (right side) */}
        <div className="absolute right-0 top-0 bottom-0 w-72 overflow-hidden hidden lg:block">
          {/* Bar chart */}
          <div className="absolute bottom-0 right-10 w-8 h-24 bg-white/15 rounded-t-lg" />
          <div className="absolute bottom-0 right-22 w-8 h-36 bg-white/15 rounded-t-lg" />
          <div className="absolute bottom-0 right-[136px] w-8 h-20 bg-white/15 rounded-t-lg" />
          <div className="absolute bottom-0 right-[180px] w-8 h-44 bg-white/15 rounded-t-lg" />
          {/* Trend line */}
          <div className="absolute bottom-[80px] right-8 h-px w-56 bg-white/25 rotate-[-20deg] origin-right" />
          {/* Arrow tip */}
          <div className="absolute top-8 right-12 text-white/25 text-5xl font-black leading-none select-none">↗</div>
          <div className="absolute top-6 right-8 w-3 h-3 rounded-full bg-white/30" />
        </div>

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-16 flex items-center gap-6">
          <span className="text-6xl sm:text-7xl flex-shrink-0">📈</span>
          <div>
            <span className="inline-block bg-white/20 text-white text-xs font-semibold px-3 py-1 rounded-full mb-3 tracking-wide">
              Category
            </span>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-2">
              Career Growth &amp; Remote Work
            </h1>
            <p className="text-amber-100 text-lg max-w-2xl">
              Job hunting, resume tips, remote work strategies, and building your personal brand for the modern world.
            </p>
          </div>
        </div>
      </section>

      {/* ── Posts Grid ── */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-14">
        {posts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
            {posts.map((post) => (
              <BlogCard key={post.slug} post={post} accentColor={ACCENT} />
            ))}
          </div>
        ) : (
          <p className="text-[#64748b]">No posts yet. Check back soon!</p>
        )}
      </div>
    </>
  );
}
