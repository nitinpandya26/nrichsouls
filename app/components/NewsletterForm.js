"use client";

import { useState } from "react";

export default function NewsletterForm() {
  const [submitted, setSubmitted] = useState(false);

  if (submitted) {
    return (
      <p className="text-[#10b981] font-semibold text-sm py-4">
        Thanks for subscribing! We'll be in touch soon.
      </p>
    );
  }

  return (
    <form
      className="flex flex-col sm:flex-row gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        setSubmitted(true);
      }}
    >
      <input
        type="email"
        required
        placeholder="Enter your email"
        className="flex-1 px-4 py-3 rounded-full border border-indigo-200 bg-white text-[#1e293b] placeholder:text-[#94a3b8] focus:outline-none focus:ring-2 focus:ring-[#6366f1] text-sm"
      />
      <button
        type="submit"
        className="bg-[#6366f1] text-white font-semibold px-7 py-3 rounded-full hover:bg-[#4f46e5] transition-colors text-sm"
      >
        Subscribe
      </button>
    </form>
  );
}
