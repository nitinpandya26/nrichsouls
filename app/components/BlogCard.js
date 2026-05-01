import Link from "next/link";
import CategoryBadge from "./CategoryBadge";

export default function BlogCard({ post }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex flex-col gap-4 hover:-translate-y-1 hover:shadow-md transition-all duration-200">
      <CategoryBadge category={post.category} />
      <div className="flex flex-col gap-2 flex-1">
        <h3 className="text-[#1e293b] font-bold text-lg leading-snug">
          {post.title}
        </h3>
        <p className="text-[#64748b] text-sm leading-relaxed line-clamp-3">
          {post.excerpt}
        </p>
      </div>
      <div className="flex items-center justify-between pt-2 border-t border-slate-100">
        <span className="text-xs text-[#64748b]">
          {post.date} · {post.readTime}
        </span>
        <Link
          href={`/blog/${post.slug}`}
          className="text-sm font-semibold text-[#6366f1] hover:text-[#4f46e5] transition-colors"
        >
          Read More →
        </Link>
      </div>
    </div>
  );
}
