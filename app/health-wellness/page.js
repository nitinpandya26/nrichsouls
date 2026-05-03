import BlogCard from "../components/BlogCard";
import NewsletterSection from "../components/NewsletterSection";
import { getPostsByCategory, mergeAndSort } from "../../lib/posts";
import { getNotionPostsByCategory } from "../../lib/notion";

export const revalidate = 60;

export const metadata = {
  title: "Health & Wellness — NrichSouls",
  description:
    "Science-backed wellness tips, fitness routines, and healthy lifestyle hacks that actually work.",
};

const ACCENT = "#10b981";

export default async function HealthWellnessPage() {
  const mdPosts = getPostsByCategory("health-wellness");
  let notionPosts = [];
  try { notionPosts = await getNotionPostsByCategory("health-wellness"); } catch {}
  const posts = mergeAndSort(notionPosts, mdPosts);

  return (
    <>
      {/* ── Category Hero Banner ── */}
      <section className="relative bg-gradient-to-r from-emerald-500 to-teal-600 text-white overflow-hidden">
        {/* Dot pattern */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
        />

        {/* Decorative circles / wellness shapes (right side) */}
        <div className="absolute right-0 top-0 bottom-0 w-72 overflow-hidden hidden lg:block">
          <div className="absolute top-4 right-4 w-44 h-44 border-2 border-white/20 rounded-full" />
          <div className="absolute top-10 right-10 w-28 h-28 border-2 border-white/20 rounded-full" />
          <div className="absolute bottom-4 right-8 w-36 h-36 border-2 border-white/20 rounded-full" />
          <div className="absolute top-1/2 right-28 w-14 h-14 bg-white/10 rounded-full -translate-y-1/2" />
          <div className="absolute top-8 right-36 w-6 h-6 bg-white/20 rounded-full" />
          <div className="absolute bottom-12 right-32 w-4 h-4 bg-white/20 rounded-full" />
          <div className="absolute top-1/3 right-6 w-10 h-10 border border-white/20 rounded-full" />
        </div>

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-16 flex items-center gap-6">
          <span className="text-6xl sm:text-7xl flex-shrink-0">🌿</span>
          <div>
            <span className="inline-block bg-white/20 text-white text-xs font-semibold px-3 py-1 rounded-full mb-3 tracking-wide">
              Category
            </span>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-2">
              Health &amp; Wellness
            </h1>
            <p className="text-emerald-100 text-lg max-w-2xl">
              Science-backed wellness, nutrition, sleep, and mental clarity — practical routines you can actually stick to.
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
      <NewsletterSection />
    </>
  );
}
