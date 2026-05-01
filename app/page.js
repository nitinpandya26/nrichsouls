import Link from "next/link";
import BlogCard from "./components/BlogCard";
import NewsletterForm from "./components/NewsletterForm";
import { getFeaturedPosts } from "../lib/posts";

export default function HomePage() {
  const featured = getFeaturedPosts(3);

  return (
    <>
      {/* Hero */}
      <section className="bg-gradient-to-br from-[#6366f1] to-[#8b5cf6] text-white py-24 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight leading-tight mb-4">
            Wellness, Wealth &amp; Work
          </h1>
          <p className="text-lg sm:text-xl text-indigo-100 max-w-2xl mx-auto mb-10">
            Real tips for real-life wins — practical insights on AI & Tech,
            Career Growth, and Health & Wellness.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center flex-wrap">
            <Link
              href="/ai-tech-automation"
              className="bg-white text-[#6366f1] font-semibold px-6 py-3 rounded-full hover:bg-indigo-50 transition-colors shadow"
            >
              AI &amp; Tech
            </Link>
            <Link
              href="/career-growth-remote-work"
              className="bg-[#f59e0b] text-white font-semibold px-6 py-3 rounded-full hover:bg-[#d97706] transition-colors shadow"
            >
              Career Growth
            </Link>
            <Link
              href="/health-wellness"
              className="bg-[#10b981] text-white font-semibold px-6 py-3 rounded-full hover:bg-[#059669] transition-colors shadow"
            >
              Health &amp; Wellness
            </Link>
          </div>
        </div>
      </section>

      {/* Latest Posts */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
        <h2 className="text-2xl font-bold text-[#1e293b] mb-8">
          Latest Articles
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {featured.map((post) => (
            <BlogCard key={post.slug} post={post} />
          ))}
        </div>
      </section>

      {/* Newsletter */}
      <section className="bg-[#eef2ff] border-y border-indigo-100 py-16 px-4">
        <div className="max-w-xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-[#1e293b] mb-2">
            Stay in the Loop
          </h2>
          <p className="text-[#64748b] mb-6">
            Get our best articles on AI, Career, and Health delivered to your
            inbox. No spam, unsubscribe anytime.
          </p>
          <NewsletterForm />
        </div>
      </section>
    </>
  );
}
