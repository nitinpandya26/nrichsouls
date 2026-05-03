"use client";

import { useState } from "react";

export default function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState(null); // null | "loading" | "success" | "error"
  const [message, setMessage] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus("loading");

    const res = await fetch("/api/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    const data = await res.json();

    if (res.ok) {
      setStatus("success");
    } else {
      setStatus("error");
      setMessage(data.error || "Something went wrong. Please try again.");
    }
  }

  if (status === "success") {
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
        onSubmit={handleSubmit}
      >
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your email address"
          className="flex-1 px-5 py-3.5 rounded-full bg-white text-[#1e293b] placeholder:text-[#94a3b8] focus:outline-none focus:ring-2 focus:ring-white/50 text-sm shadow-sm"
        />
        <button
          type="submit"
          disabled={status === "loading"}
          className="bg-white text-[#6366f1] font-bold px-7 py-3.5 rounded-full hover:bg-indigo-50 transition-colors text-sm shadow-sm whitespace-nowrap disabled:opacity-60"
        >
          {status === "loading" ? "Subscribing…" : "Subscribe →"}
        </button>
      </form>
      {status === "error" && (
        <p className="text-red-300 text-xs mt-3">{message}</p>
      )}
      {status !== "error" && (
        <p className="text-indigo-200 text-xs mt-3">
          Join 500+ readers. No spam, ever.
        </p>
      )}
    </div>
  );
}
