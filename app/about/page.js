import Link from "next/link";
import Image from "next/image";

export const metadata = {
  title: "About — NrichSouls",
  description:
    "About Nitin Pandya — Data & AI professional, blogger, and the mind behind NrichSouls.",
};

export default function AboutPage() {
  return (
    <>
      {/* ── Hero Banner ── */}
      <section className="relative bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-400 text-white overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.12]"
          style={{
            backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
        />
        <div className="absolute right-0 top-0 bottom-0 w-80 overflow-hidden hidden lg:block">
          <span className="absolute top-8 right-16 text-6xl opacity-20 select-none">🤖</span>
          <span className="absolute top-1/2 right-6 -translate-y-1/2 text-7xl opacity-20 select-none">📈</span>
          <span className="absolute bottom-8 right-20 text-6xl opacity-20 select-none">🌿</span>
          <div className="absolute top-4 right-4 w-40 h-40 border-2 border-white/10 rounded-full" />
          <div className="absolute bottom-4 right-12 w-24 h-24 border-2 border-white/10 rounded-full" />
        </div>
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 py-20 text-center">
          <span className="inline-block bg-white/20 backdrop-blur-sm text-white text-xs font-semibold px-4 py-1.5 rounded-full mb-5 tracking-wide">
            The Person Behind NrichSouls
          </span>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-4">
            About Nitin Pandya
          </h1>
          <p className="text-lg sm:text-xl text-white/85 max-w-2xl mx-auto leading-relaxed">
            One Mind. Real Impact. Continuous Curiosity.
          </p>
        </div>
      </section>

      {/* ── Personal Intro ── */}
      <section className="bg-white py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-12 items-center">

            {/* Photo */}
            <div className="md:col-span-2 flex justify-center">
              <div className="relative w-64 h-80 md:w-full md:h-96 rounded-2xl overflow-hidden shadow-xl">
                <Image
                  src="/nitin_image.webp"
                  alt="Nitin Pandya"
                  fill
                  className="object-cover object-top"
                  sizes="(max-width: 768px) 256px, 400px"
                  priority
                />
              </div>
            </div>

            {/* Bio */}
            <div className="md:col-span-3">
              <span className="text-xs font-semibold text-[#6366f1] uppercase tracking-widest mb-3 block">
                Hey there 👋
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#1e293b] mb-4 leading-snug">
                I&apos;m Nitin Pandya
              </h2>
              <div className="space-y-4 text-[#334155] leading-relaxed">
                <p>
                  I&apos;m a Data &amp; AI professional from Mumbai. I thrive at the intersection of tech, purpose, and people. This blog is my digital corner — where I simplify complex ideas, share lived experiences, and explore the tools and tactics that help us grow in career, health, and mindset.
                </p>
                <p>
                  With <strong className="text-[#1e293b]"> years of experience</strong> in the industry, I&apos;ve worked with global brands like <strong className="text-[#1e293b]">Sony, Apple, Fractal, and Mercer</strong>. I&apos;ve led data transformations, built AI models, and created business impact that matters.
                </p>
                <p>
                  Beyond boardrooms and dashboards, I believe in conscious living: managing fitness, family, and focus while riding the fast-evolving wave of tech.
                </p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── Why This Blog? ── */}
      <section className="bg-[#f8fafc] py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#1e293b]">
              Why This Blog?
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              {
                icon: "🌍",
                title: "Real-World Context",
                desc: "Real-world impact comes from real-life context. Every piece of advice here is grounded in actual experience, not theory.",
                bg: "bg-indigo-50",
                border: "border-t-4 border-indigo-500",
                text: "text-indigo-700",
              },
              {
                icon: "⚖️",
                title: "Hustle & Healing",
                desc: "I've seen both sides — the grind and the recovery. This blog holds space for both, without pretending one doesn't exist.",
                bg: "bg-purple-50",
                border: "border-t-4 border-purple-500",
                text: "text-purple-700",
              },
              {
                icon: "💡",
                title: "No Jargon",
                desc: "Good ideas deserve better explanations. Complex topics, made clear — without the buzzwords and filler.",
                bg: "bg-emerald-50",
                border: "border-t-4 border-emerald-500",
                text: "text-emerald-700",
              },
            ].map((item) => (
              <div
                key={item.title}
                className={`${item.bg} ${item.border} rounded-2xl p-6 transition-all duration-200 hover:-translate-y-1 hover:shadow-md`}
              >
                <span className="text-3xl mb-3 block">{item.icon}</span>
                <h3 className={`font-bold text-lg mb-2 ${item.text}`}>{item.title}</h3>
                <p className="text-[#64748b] text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── What You'll Find Here ── */}
      <section className="bg-white py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#1e293b]">
              What You&apos;ll Find Here
            </h2>
            <p className="text-[#64748b] mt-2">
              Three focus areas, one goal: helping you grow
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                emoji: "🚀",
                title: "AI, Tech & Automation",
                desc: "Practical, no-fluff breakdowns of emerging tools, models, and AI use cases. Whether you're a founder automating workflows or a freelancer building smart systems.",
                href: "/ai-tech-automation",
                linkColor: "#8b5cf6",
                gradient: "from-indigo-50 to-purple-50",
                border: "border-t-4 border-indigo-500",
              },
              {
                emoji: "💡",
                title: "Health & Wellness",
                desc: "Productivity without burnout. Wellness without overwhelm. Habits, tools, and reflections that help you stay consistent — especially when life is packed.",
                href: "/health-wellness",
                linkColor: "#10b981",
                gradient: "from-emerald-50 to-teal-50",
                border: "border-t-4 border-emerald-500",
              },
              {
                emoji: "📈",
                title: "Career & Growth",
                desc: "From writing resumes to leading teams — strategies that work for switching domains, mastering impostor syndrome, and the lessons learned when they didn't.",
                href: "/career-growth-remote-work",
                linkColor: "#f59e0b",
                gradient: "from-orange-50 to-amber-50",
                border: "border-t-4 border-amber-500",
              },
            ].map((card) => (
              <div
                key={card.title}
                className={`bg-gradient-to-br ${card.gradient} ${card.border} rounded-2xl p-6 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg flex flex-col`}
              >
                <span className="text-4xl mb-4 block">{card.emoji}</span>
                <h3 className="font-bold text-[#1e293b] text-lg mb-2">{card.title}</h3>
                <p className="text-[#64748b] text-sm leading-relaxed mb-5 flex-1">{card.desc}</p>
                <Link
                  href={card.href}
                  className="text-sm font-semibold hover:underline inline-flex items-center gap-1"
                  style={{ color: card.linkColor }}
                >
                  Explore →
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
