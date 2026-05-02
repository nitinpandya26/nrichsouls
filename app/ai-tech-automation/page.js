import BlogCard from "../components/BlogCard";
import { getPostsByCategory, parseDateTs } from "../../lib/posts";
import { getNotionPostsByCategory } from "../../lib/notion";

export const revalidate = 60;

export const metadata = {
  title: "AI, Tech & Automation — NrichSouls",
  description:
    "Step-by-step guides on AI tools, automation, and smart tech hacks to simplify your workflow.",
};

const ACCENT = "#8b5cf6";

export default async function AITechPage() {
  const mdPosts = getPostsByCategory("ai-tech-automation");
  let notionPosts = [];
  try { notionPosts = await getNotionPostsByCategory("ai-tech-automation"); } catch {}
  const mdSlugs = new Set(mdPosts.map((p) => p.slug));
  const notionOnlyPosts = notionPosts.filter((p) => !mdSlugs.has(p.slug));
  const posts = [...mdPosts, ...notionOnlyPosts]
    .sort((a, b) => parseDateTs(b.date) - parseDateTs(a.date));

  return (
    <>
      {/* ── Category Hero Banner ── */}
      <section className="relative bg-gradient-to-r from-indigo-600 to-purple-700 text-white overflow-hidden">
        {/* Dot pattern */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
        />

        {/* Decorative circuit shapes (right side) */}
        <div className="absolute right-0 top-0 bottom-0 w-72 overflow-hidden hidden lg:block">
          <div className="absolute top-6 right-8 w-36 h-36 border-2 border-white/20 rounded-xl" />
          <div className="absolute top-14 right-14 w-20 h-20 border-2 border-white/20 rounded-lg" />
          <div className="absolute bottom-6 right-10 w-28 h-28 border-2 border-white/20 rounded-xl rotate-12" />
          <div className="absolute top-1/2 right-6 h-px w-48 bg-white/20 -translate-y-1/2" />
          <div className="absolute top-1/3 right-0 h-px w-36 bg-white/20" />
          <div className="absolute top-1/2 right-24 w-3 h-3 rounded-full bg-white/30" />
          <div className="absolute bottom-1/3 right-16 w-2 h-2 rounded-full bg-white/30" />
          <div className="absolute top-8 right-32 w-5 h-5 border border-white/20 rounded" />
        </div>

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-16 flex items-center gap-6">
          <span className="text-6xl sm:text-7xl flex-shrink-0">🤖</span>
          <div>
            <span className="inline-block bg-white/20 text-white text-xs font-semibold px-3 py-1 rounded-full mb-3 tracking-wide">
              Category
            </span>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-2">
              AI, Tech &amp; Automation
            </h1>
            <p className="text-purple-200 text-lg max-w-2xl">
              Demystify AI tools, automate your workflows, and boost productivity — even if you&apos;re not a techie.
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
