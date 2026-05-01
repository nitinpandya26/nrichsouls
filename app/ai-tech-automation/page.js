import BlogCard from "../components/BlogCard";
import { getPostsByCategory } from "../../lib/posts";

export const metadata = {
  title: "AI, Tech & Automation — NrichSouls",
  description:
    "Step-by-step guides on AI tools, automation, and smart tech hacks to simplify your workflow.",
};

export default function AITechPage() {
  const posts = getPostsByCategory("ai-tech-automation");

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
      <div className="mb-12">
        <span className="inline-block bg-[#8b5cf6] text-white text-xs font-semibold px-3 py-1 rounded-full mb-4">
          AI, Tech &amp; Automation
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-[#1e293b] mb-3">
          AI, Tech &amp; Automation
        </h1>
        <p className="text-[#64748b] text-lg max-w-2xl">
          Demystify AI and tech tools for daily life and business growth.
          Step-by-step guides, real-world examples, and smart hacks to
          simplify your workflow — even if you're not a techie.
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
