import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import CategoryBadge from "../../components/CategoryBadge";
import { getPostBySlug, getAllPosts } from "../../../lib/posts";

export async function generateStaticParams() {
  const posts = getAllPosts();
  return posts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) return {};
  return {
    title: `${post.title} — NrichSouls`,
    description: post.excerpt,
  };
}

const BACK_LINKS = {
  "ai-tech-automation": { href: "/ai-tech-automation", label: "AI, Tech & Automation" },
  "career-growth-remote-work": { href: "/career-growth-remote-work", label: "Career Growth" },
  "health-wellness": { href: "/health-wellness", label: "Health & Wellness" },
};

export default async function BlogPostPage({ params }) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) notFound();

  const back = BACK_LINKS[post.category] ?? { href: "/", label: "Home" };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
      {/* Back link */}
      <Link
        href={back.href}
        className="inline-flex items-center gap-1 text-sm text-[#6366f1] hover:underline mb-8"
      >
        ← Back to {back.label}
      </Link>

      {/* Category badge */}
      <div className="mb-4">
        <CategoryBadge category={post.category} />
      </div>

      {/* Title */}
      <h1 className="text-3xl sm:text-4xl font-extrabold text-[#1e293b] leading-tight mb-4">
        {post.title}
      </h1>

      {/* Meta */}
      <div className="flex items-center gap-3 text-sm text-[#64748b] mb-8 pb-6 border-b border-slate-200">
        <span>{post.date}</span>
        <span>·</span>
        <span>{post.readTime}</span>
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
          />
        </div>
      )}

      {/* Content */}
      <article
        className="article-content"
        dangerouslySetInnerHTML={{ __html: post.content }}
      />
    </div>
  );
}
