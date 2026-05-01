"use client";

import { useState } from "react";

export default function NewsletterForm() {
  const [submitted, setSubmitted] = useState(false);

  if (submitted) {
    return (
      <p className="text-white font-semibold text-sm py-4">
        ✓ You're in! Check your inbox soon.
      </p>
    );
  }

  return (
    <div className="w-full">
      <form
        className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto"
        onSubmit={(e) => {
          e.preventDefault();
          setSubmitted(true);
        }}
      >
        <input
          type="email"
          required
          placeholder="Enter your email address"
          className="flex-1 px-5 py-3.5 rounded-full bg-white text-[#1e293b] placeholder:text-[#94a3b8] focus:outline-none focus:ring-2 focus:ring-white/50 text-sm shadow-sm"
        />
        <button
          type="submit"
          className="bg-white text-[#6366f1] font-bold px-7 py-3.5 rounded-full hover:bg-indigo-50 transition-colors text-sm shadow-sm whitespace-nowrap"
        >
          Subscribe →
        </button>
      </form>
      <p className="text-indigo-200 text-xs mt-3">
        Join 500+ readers. No spam, ever.
      </p>
    </div>
  );
}
