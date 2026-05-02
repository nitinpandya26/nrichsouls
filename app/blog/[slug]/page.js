import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import CategoryBadge from "../../components/CategoryBadge";
import { getPostBySlug, getAllPosts } from "../../../lib/posts";
import { getNotionPostBySlug, getNotionPostContent } from "../../../lib/notion";

export const revalidate = 60;    // Notion edits reflect within 60 seconds
export const dynamicParams = true; // render new Notion slugs on first visit, no redeploy needed

const BACK_LINKS = {
  "ai-tech-automation": { href: "/ai-tech-automation", label: "AI, Tech & Automation" },
  "career-growth-remote-work": { href: "/career-growth-remote-work", label: "Career Growth" },
  "health-wellness": { href: "/health-wellness", label: "Health & Wellness" },
};

const ACCENT_COLORS = {
  "ai-tech-automation": "#8b5cf6",
  "career-growth-remote-work": "#f59e0b",
  "health-wellness": "#10b981",
};

export async function generateStaticParams() {
  const markdownPosts = getAllPosts();
  return markdownPosts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;

  // Prefer markdown (authoritative for existing posts)
  const mdPost = getPostBySlug(slug);
  if (mdPost) {
    return {
      title: `${mdPost.title} — NrichSouls`,
      description: mdPost.excerpt,
    };
  }

  // Fall back to Notion (for posts written directly in Notion with no markdown file)
  try {
    const notionPost = await getNotionPostBySlug(slug);
    if (notionPost) {
      return {
        title: `${notionPost.title} — NrichSouls`,
        description: notionPost.excerpt,
      };
    }
  } catch {}

  return {};
}

export default async function BlogPostPage({ params }) {
  const { slug } = await params;

  let post = null;
  let content = null;
  let isNotion = false;

  // ── Prefer markdown (full HTML structure + cover images) ──────────────────
  const mdPost = getPostBySlug(slug);
  if (mdPost) {
    post = mdPost;
    content = mdPost.content;
  } else {
    // ── Fall back to Notion (for posts written directly in Notion) ────────
    try {
      const notionPost = await getNotionPostBySlug(slug);
      if (notionPost) {
        content = await getNotionPostContent(notionPost.id);
        post = notionPost;
        isNotion = true;
      }
    } catch {}
  }

  if (!post) notFound();

  const back = BACK_LINKS[post.category] ?? { href: "/blog", label: "Blog" };
  const accent = ACCENT_COLORS[post.category] ?? "#6366f1";

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
      {/* Back link */}
      <Link
        href={back.href}
        className="inline-flex items-center gap-1 text-sm hover:underline mb-8"
        style={{ color: accent }}
      >
        ← Back to {back.label}
      </Link>

      {/* Category badge */}
      <div className="mb-4">
        <CategoryBadge category={post.category} color={accent} />
      </div>

      {/* Title */}
      <h1 className="text-3xl sm:text-4xl font-extrabold text-[#1e293b] leading-tight mb-4">
        {post.title}
      </h1>

      {/* Meta */}
      <div className="flex items-center gap-3 text-sm text-[#64748b] mb-8 pb-6 border-b border-slate-200">
        <span>{post.date}</span>
        {post.readTime && <><span>·</span><span>{post.readTime}</span></>}
      </div>

      {/* Cover image */}
      {post.coverImage && (
        <div className="relative w-full h-64 sm:h-80 rounded-2xl overflow-hidden mb-10 shadow-sm">
          <Image
            src={post.coverImage}
            alt={post.title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 768px"
            priority
            unoptimized={isNotion}
          />
        </div>
      )}

      {/* Content */}
      <article
        className="article-content"
        dangerouslySetInnerHTML={{ __html: content }}
      />
    </div>
  );
}
