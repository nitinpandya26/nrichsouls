import Link from "next/link";
import CategoryBadge from "./CategoryBadge";

const ACCENT_COLORS = {
  "ai-tech-automation": "#8b5cf6",
  "career-growth-remote-work": "#f59e0b",
  "health-wellness": "#10b981",
};

export default function BlogCard({ post, accentColor }) {
  const accent = accentColor ?? ACCENT_COLORS[post.category] ?? "#6366f1";

  return (
    <div
      className="bg-white rounded-2xl shadow-sm border border-slate-100 flex flex-col h-full overflow-hidden transition-all duration-200 hover:-translate-y-1 hover:shadow-lg"
      style={{ borderTop: `4px solid ${accent}` }}
    >
      <div className="p-6 flex flex-col flex-1 gap-3">
        <CategoryBadge category={post.category} color={accent} />

        <div className="flex flex-col gap-2 flex-1">
          <h3 className="text-[#1e293b] font-bold text-lg leading-snug">
            {post.title}
          </h3>
          <p className="text-[#64748b] text-sm leading-relaxed line-clamp-3">
            {post.excerpt}
          </p>
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-slate-100 mt-auto">
          <span className="text-xs text-[#94a3b8]">
            {post.date} · {post.readTime}
          </span>
          <Link
            href={`/blog/${post.slug}`}
            className="group text-sm font-semibold flex items-center gap-1 transition-opacity hover:opacity-80"
            style={{ color: accent }}
          >
            Read More
            <span className="inline-block transition-transform duration-150 group-hover:translate-x-0.5">
              →
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
}
