"use client";

import { useState } from "react";

export default function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState({});

  function validate() {
    const e = {};
    if (!form.name.trim()) e.name = "Name is required.";
    if (!form.email.trim()) e.email = "Email is required.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      e.email = "Enter a valid email.";
    if (!form.message.trim()) e.message = "Message is required.";
    return e;
  }

  function handleSubmit(e) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    // Wire up a real service here (e.g. Formspree, Resend, or a Next.js route handler)
    setSubmitted(true);
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-16">
      <div className="text-center mb-10">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-[#1e293b] mb-3">
          Get in Touch
        </h1>
        <p className="text-[#64748b]">
          Have a question, feedback, or want to collaborate? We'd love to hear
          from you.
        </p>
      </div>

      {submitted ? (
        <div className="bg-[#d1fae5] border border-[#6ee7b7] rounded-2xl p-8 text-center">
          <div className="text-3xl mb-3">✅</div>
          <h2 className="font-bold text-[#065f46] text-lg mb-1">
            Message Sent!
          </h2>
          <p className="text-[#047857] text-sm">
            Thanks for reaching out. We'll get back to you within 1–2 business
            days.
          </p>
        </div>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8 flex flex-col gap-5"
          noValidate
        >
          <div>
            <label className="block text-sm font-semibold text-[#1e293b] mb-1">
              Name
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Your name"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 text-[#1e293b] placeholder:text-[#94a3b8] focus:outline-none focus:ring-2 focus:ring-[#6366f1] text-sm"
            />
            {errors.name && (
              <p className="text-red-500 text-xs mt-1">{errors.name}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#1e293b] mb-1">
              Email
            </label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="you@example.com"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 text-[#1e293b] placeholder:text-[#94a3b8] focus:outline-none focus:ring-2 focus:ring-[#6366f1] text-sm"
            />
            {errors.email && (
              <p className="text-red-500 text-xs mt-1">{errors.email}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#1e293b] mb-1">
              Message
            </label>
            <textarea
              rows={5}
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              placeholder="Tell us what's on your mind..."
              className="w-full px-4 py-3 rounded-xl border border-slate-200 text-[#1e293b] placeholder:text-[#94a3b8] focus:outline-none focus:ring-2 focus:ring-[#6366f1] text-sm resize-none"
            />
            {errors.message && (
              <p className="text-red-500 text-xs mt-1">{errors.message}</p>
            )}
          </div>

          <button
            type="submit"
            className="bg-[#6366f1] text-white font-semibold px-7 py-3 rounded-full hover:bg-[#4f46e5] transition-colors text-sm self-start"
          >
            Send Message
          </button>
        </form>
      )}
    </div>
  );
}
