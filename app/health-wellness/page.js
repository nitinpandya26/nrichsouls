import BlogCard from "../components/BlogCard";
import { getPostsByCategory } from "../../lib/posts";

export const metadata = {
  title: "Health & Wellness — NrichSouls",
  description:
    "Science-backed wellness tips, fitness routines, and healthy lifestyle hacks that actually work.",
};

export default function HealthWellnessPage() {
  const posts = getPostsByCategory("health-wellness");

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
      <div className="mb-12">
        <span className="inline-block bg-[#10b981] text-white text-xs font-semibold px-3 py-1 rounded-full mb-4">
          Health &amp; Wellness
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-[#1e293b] mb-3">
          Health &amp; Wellness
        </h1>
        <p className="text-[#64748b] text-lg max-w-2xl">
          Discover science-backed wellness tips, simple fitness routines, and
          healthy lifestyle hacks that actually work. From stress relief to gut
          health, feel better and take charge of your wellbeing — without the
          overwhelm.
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
