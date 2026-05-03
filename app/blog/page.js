import Link from "next/link";
import Image from "next/image";
import { getNotionPosts } from "../../lib/notion";
import { getAllPosts, mergeAndSort } from "../../lib/posts";

export const revalidate = 60; // regenerate at most every 60 seconds

export const metadata = {
  title: "Blog — NrichSouls",
  description:
    "All articles on AI & Tech, Career Growth, and Health & Wellness from NrichSouls.",
};

const ACCENT = {
  "ai-tech-automation": { color: "#8b5cf6", label: "AI & Tech" },
  "career-growth-remote-work": { color: "#f59e0b", label: "Career Growth" },
  "health-wellness": { color: "#10b981", label: "Health & Wellness" },
};

export default async function BlogPage() {
  let posts = [];
  let error = null;

  // Markdown posts have full HTML + cover images (source of truth for existing posts)
  const mdPosts = getAllPosts();

  try {
    const notionPosts = await getNotionPosts();
    // Notion is the CMS — its metadata (date, title, tags) takes priority.
    // Only add markdown posts not yet in Notion as a fallback.
    posts = mergeAndSort(notionPosts, mdPosts);
  } catch (e) {
    error = e.message;
    posts = mdPosts; // fall back to markdown-only if Notion is down
  }

  return (
    <>
      {/* ── Hero ── */}
      <section className="relative bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 text-white overflow-hidden">
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
        />
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 text-center" style={{ paddingTop: "4.5rem", paddingBottom: "4.5rem" }}>
          <span className="inline-block bg-white/20 backdrop-blur-sm text-white text-xs font-semibold px-4 py-1.5 rounded-full mb-5 tracking-wide">
            All Articles
          </span>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-4">
            The NrichSouls Blog
          </h1>
          <p className="text-lg text-white/85 max-w-xl mx-auto leading-relaxed">
            Practical insights on AI, career growth, and wellness — updated regularly.
          </p>
        </div>
      </section>

      {/* ── Posts ── */}
      <section className="bg-[#f8fafc] py-14 px-4">
        <div className="max-w-6xl mx-auto">
          {error ? (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center">
              <p className="text-red-600 font-semibold mb-1">Could not load posts</p>
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          ) : posts.length === 0 ? (
            <p className="text-[#64748b] text-center py-12">
              No published posts yet — check back soon!
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
              {posts.map((post) => {
                const accent = ACCENT[post.category] ?? { color: "#6366f1", label: post.category };
                return (
                  <div
                    key={post.slug || post.id}
                    className="bg-white rounded-2xl shadow-sm border border-slate-100 flex flex-col overflow-hidden transition-all duration-200 hover:-translate-y-1 hover:shadow-lg"
                    style={post.coverImage ? {} : { borderTop: `4px solid ${accent.color}` }}
                  >
                    {post.coverImage && (
                      <div className="relative w-full h-48 flex-shrink-0">
                        <Image
                          src={post.coverImage}
                          alt={post.title}
                          fill
                          className="object-cover"
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                          unoptimized
                        />
                        <div className="absolute bottom-0 left-0 right-0 h-1" style={{ backgroundColor: accent.color }} />
                      </div>
                    )}

                    <div className="p-6 flex flex-col flex-1 gap-3">
                      <span
                        className="inline-block text-xs font-semibold px-3 py-1 rounded-full text-white w-fit"
                        style={{ backgroundColor: accent.color }}
                      >
                        {accent.label}
                      </span>

                      <div className="flex flex-col gap-2 flex-1">
                        <h2 className="text-[#1e293b] font-bold text-lg leading-snug">
                          {post.title}
                        </h2>
                        {post.excerpt && (
                          <p className="text-[#64748b] text-sm leading-relaxed line-clamp-3">
                            {post.excerpt}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t border-slate-100 mt-auto">
                        <span className="text-xs text-[#94a3b8]">
                          {post.date}{post.readTime ? ` · ${post.readTime}` : ''}
                        </span>
                        <Link
                          href={`/blog/${post.slug}`}
                          className="group text-sm font-semibold flex items-center gap-1 hover:opacity-80 transition-opacity"
                          style={{ color: accent.color }}
                        >
                          Read More
                          <span className="inline-block transition-transform duration-150 group-hover:translate-x-0.5">→</span>
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
