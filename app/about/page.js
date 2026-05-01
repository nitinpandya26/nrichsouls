import Link from "next/link";

export const metadata = {
  title: "About — NrichSouls",
  description:
    "Learn about NrichSouls — Wellness, Wealth & Work. Real tips for real-life wins.",
};

export default function AboutPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16">
      {/* Hero */}
      <div className="text-center mb-16">
        <h1 className="text-4xl font-extrabold text-[#1e293b] mb-4">
          About NrichSouls
        </h1>
        <p className="text-xl text-[#64748b] max-w-2xl mx-auto leading-relaxed">
          Wellness, Wealth &amp; Work — real, practical tips for people who want
          to grow in every dimension of life.
        </p>
      </div>

      {/* Mission */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8 mb-10">
        <h2 className="text-xl font-bold text-[#1e293b] mb-3">Our Mission</h2>
        <p className="text-[#64748b] leading-relaxed">
          NrichSouls exists to make three of the most impactful areas of modern
          life more accessible: leveraging AI &amp; tech to reclaim your time,
          building a career that works for you, and developing health habits
          that give you the energy to enjoy it all. Every article is written to
          be practical, evidence-grounded, and immediately actionable — no
          fluff, no hype.
        </p>
      </div>

      {/* Three pillars */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <div className="w-10 h-10 rounded-xl bg-[#ede9fe] flex items-center justify-center mb-4">
            <span className="text-xl">🤖</span>
          </div>
          <h3 className="font-bold text-[#1e293b] text-lg mb-2">
            AI, Tech &amp; Automation
          </h3>
          <p className="text-[#64748b] text-sm leading-relaxed mb-4">
            Practical guides on AI tools, no-code automation, and productivity
            systems. We cut through the noise to show you what actually saves
            time.
          </p>
          <Link
            href="/ai-tech-automation"
            className="text-sm font-semibold text-[#8b5cf6] hover:underline"
          >
            Browse articles →
          </Link>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <div className="w-10 h-10 rounded-xl bg-[#fef3c7] flex items-center justify-center mb-4">
            <span className="text-xl">💼</span>
          </div>
          <h3 className="font-bold text-[#1e293b] text-lg mb-2">
            Career Growth &amp; Remote Work
          </h3>
          <p className="text-[#64748b] text-sm leading-relaxed mb-4">
            Job hunting, resume tips, remote work strategies, and personal
            branding — whether you're climbing the ladder or going solo.
          </p>
          <Link
            href="/career-growth-remote-work"
            className="text-sm font-semibold text-[#f59e0b] hover:underline"
          >
            Browse articles →
          </Link>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <div className="w-10 h-10 rounded-xl bg-[#d1fae5] flex items-center justify-center mb-4">
            <span className="text-xl">🌿</span>
          </div>
          <h3 className="font-bold text-[#1e293b] text-lg mb-2">
            Health &amp; Wellness
          </h3>
          <p className="text-[#64748b] text-sm leading-relaxed mb-4">
            Science-backed insights on mental clarity, nutrition, sleep, and
            habit formation. Routines you can actually stick to.
          </p>
          <Link
            href="/health-wellness"
            className="text-sm font-semibold text-[#10b981] hover:underline"
          >
            Browse articles →
          </Link>
        </div>
      </div>

      {/* CTA */}
      <div className="text-center">
        <p className="text-[#64748b] mb-4">
          Have a question or want to contribute?
        </p>
        <Link
          href="/contact"
          className="inline-block bg-[#6366f1] text-white font-semibold px-7 py-3 rounded-full hover:bg-[#4f46e5] transition-colors"
        >
          Get in Touch
        </Link>
      </div>
    </div>
  );
}
