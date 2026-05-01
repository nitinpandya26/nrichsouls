import BlogCard from "../components/BlogCard";
import { getPostsByCategory } from "../../lib/posts";

export const metadata = {
  title: "Career Growth & Remote Work — NrichSouls",
  description:
    "Tips on job hunting, remote work, personal branding, and growing your career in the modern world.",
};

export default function CareerGrowthPage() {
  const posts = getPostsByCategory("career-growth-remote-work");

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
      <div className="mb-12">
        <span className="inline-block bg-[#f59e0b] text-white text-xs font-semibold px-3 py-1 rounded-full mb-4">
          Career Growth &amp; Remote Work
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-[#1e293b] mb-3">
          Career Growth &amp; Remote Work
        </h1>
        <p className="text-[#64748b] text-lg max-w-2xl">
          Boost your career with powerful tips on job hunting, resume writing,
          and remote work success. Build your personal brand, ace interviews,
          and grow — whether you're freelancing, climbing the ladder, or just
          getting started.
        </p>
      </div>

      {posts.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.map((post) => (
            <BlogCard key={post.slug} post={post} />
          ))}
        </div>
      ) : (
        <p className="text-[#64748b]">No posts yet. Check back soon!</p>
      )}
    </div>
  );
}
