import NewsletterForm from "./NewsletterForm";

export default function NewsletterSection() {
  return (
    <section className="relative bg-gradient-to-br from-[#6366f1] to-[#8b5cf6] py-20 px-4 overflow-hidden">
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)",
          backgroundSize: "20px 20px",
        }}
      />
      <div className="relative max-w-xl mx-auto text-center">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-3">
          Stay in the Loop
        </h2>
        <p className="text-indigo-200 mb-8 leading-relaxed">
          Get our best articles on AI, Career, and Health delivered straight to your inbox.
        </p>
        <NewsletterForm />
      </div>
    </section>
  );
}
