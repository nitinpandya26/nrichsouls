"use client";

import { useState } from "react";

export default function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState({});
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState("");

  function validate() {
    const e = {};
    if (!form.name.trim()) e.name = "Name is required.";
    if (!form.email.trim()) e.email = "Email is required.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      e.email = "Enter a valid email.";
    if (!form.message.trim()) e.message = "Message is required.";
    return e;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setSending(true);
    setSendError("");
    try {
      const res = await fetch("https://formspree.io/f/xeenqyeq", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setSubmitted(true);
      } else {
        setSendError("Something went wrong. Please try again or email us directly.");
      }
    } catch {
      setSendError("Network error. Please check your connection and try again.");
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      {/* ── Hero Banner ── */}
      <section className="relative bg-gradient-to-r from-purple-600 to-indigo-600 text-white overflow-hidden">
        {/* Dot pattern */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
        />

        {/* Decorative icons right */}
        <div className="absolute right-0 top-0 bottom-0 w-72 overflow-hidden hidden lg:block">
          <span className="absolute top-8 right-16 text-5xl opacity-20 select-none">📧</span>
          <span className="absolute top-1/2 right-8 -translate-y-1/2 text-6xl opacity-20 select-none">💬</span>
          <span className="absolute bottom-8 right-20 text-5xl opacity-20 select-none">🤝</span>
          <div className="absolute top-4 right-4 w-40 h-40 border-2 border-white/10 rounded-full" />
          <div className="absolute bottom-4 right-10 w-24 h-24 border-2 border-white/10 rounded-full" />
        </div>

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 py-18 text-center" style={{ paddingTop: "4.5rem", paddingBottom: "4.5rem" }}>
          <span className="inline-block bg-white/20 backdrop-blur-sm text-white text-xs font-semibold px-4 py-1.5 rounded-full mb-5 tracking-wide">
            Say Hello
          </span>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-4">
            Get in Touch
          </h1>
          <p className="text-lg text-white/85 max-w-xl mx-auto leading-relaxed">
            Questions, feedback, collaboration ideas — we&apos;d love to hear from you.
          </p>
        </div>
      </section>

      {/* ── Main Content ── */}
      <section className="bg-[#f8fafc] py-14 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">

            {/* ── Left: Contact Info Panel (40%) ── */}
            <div className="lg:col-span-2 bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl p-8 text-white flex flex-col gap-6">
              <div>
                <h2 className="text-xl font-bold mb-1">Contact Information</h2>
                <p className="text-indigo-200 text-sm">Reach out through any of these channels</p>
              </div>

              <div className="flex flex-col gap-4">
                {[
                  { icon: "📍", label: "Location", value: "India — serving readers worldwide" },
                  { icon: "⏱️", label: "Response Time", value: "1–2 business days" },
                ].map((item) => (
                  <div key={item.label} className="bg-white/10 rounded-xl p-4 flex items-start gap-3">
                    <span className="text-xl flex-shrink-0">{item.icon}</span>
                    <div>
                      <p className="text-xs text-indigo-200 font-semibold uppercase tracking-wide mb-0.5">{item.label}</p>
                      <p className="text-white text-sm">{item.value}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Social links */}
              <div>
                <p className="text-xs text-indigo-200 font-semibold uppercase tracking-wide mb-3">Follow Us</p>
                <div className="flex gap-3">
                  {[
                    { label: "X", href: "https://twitter.com/nrichsouls" },
                    { label: "LinkedIn", href: "https://www.linkedin.com/in/nitinpandya/" },
                    { label: "Instagram", href: "https://instagram.com/nrichsouls" },
                  ].map((s) => (
                    <a
                      key={s.label}
                      href={s.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-white/15 hover:bg-white/25 text-white text-xs font-semibold px-3 py-2 rounded-lg transition-colors"
                    >
                      {s.label}
                    </a>
                  ))}
                </div>
              </div>
            </div>

            {/* ── Right: Form (60%) ── */}
            <div className="lg:col-span-3">
              {submitted ? (
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-10 text-center flex flex-col items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center text-3xl">
                    ✅
                  </div>
                  <h2 className="font-bold text-[#1e293b] text-xl">Message Sent!</h2>
                  <p className="text-[#64748b] max-w-sm leading-relaxed">
                    Thanks for reaching out. We&apos;ll get back to you within 1–2 business days.
                  </p>
                </div>
              ) : (
                <form
                  onSubmit={handleSubmit}
                  className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8 flex flex-col gap-5"
                  noValidate
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    {/* Name */}
                    <div>
                      <label className="block text-sm font-semibold text-[#1e293b] mb-1">
                        Name
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94a3b8]">👤</span>
                        <input
                          type="text"
                          value={form.name}
                          onChange={(e) => setForm({ ...form, name: e.target.value })}
                          placeholder="Your name"
                          className="w-full pl-9 pr-4 py-3 rounded-xl border border-slate-200 text-[#1e293b] placeholder:text-[#94a3b8] focus:outline-none focus:ring-2 focus:ring-[#6366f1] text-sm"
                        />
                      </div>
                      {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                    </div>

                    {/* Email */}
                    <div>
                      <label className="block text-sm font-semibold text-[#1e293b] mb-1">
                        Email
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94a3b8]">✉️</span>
                        <input
                          type="email"
                          value={form.email}
                          onChange={(e) => setForm({ ...form, email: e.target.value })}
                          placeholder="you@example.com"
                          className="w-full pl-9 pr-4 py-3 rounded-xl border border-slate-200 text-[#1e293b] placeholder:text-[#94a3b8] focus:outline-none focus:ring-2 focus:ring-[#6366f1] text-sm"
                        />
                      </div>
                      {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                    </div>
                  </div>

                  {/* Subject */}
                  <div>
                    <label className="block text-sm font-semibold text-[#1e293b] mb-1">
                      Subject
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94a3b8]">📋</span>
                      <select
                        value={form.subject}
                        onChange={(e) => setForm({ ...form, subject: e.target.value })}
                        className="w-full pl-9 pr-4 py-3 rounded-xl border border-slate-200 text-[#1e293b] focus:outline-none focus:ring-2 focus:ring-[#6366f1] text-sm bg-white appearance-none"
                      >
                        <option value="">Select a topic…</option>
                        <option value="general">General Enquiry</option>
                        <option value="collaboration">Collaboration</option>
                        <option value="feedback">Feedback</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                  </div>

                  {/* Message */}
                  <div>
                    <label className="block text-sm font-semibold text-[#1e293b] mb-1">
                      Message
                    </label>
                    <textarea
                      rows={6}
                      value={form.message}
                      onChange={(e) => setForm({ ...form, message: e.target.value })}
                      placeholder="Tell us what's on your mind…"
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 text-[#1e293b] placeholder:text-[#94a3b8] focus:outline-none focus:ring-2 focus:ring-[#6366f1] text-sm resize-none"
                    />
                    {errors.message && <p className="text-red-500 text-xs mt-1">{errors.message}</p>}
                  </div>

                  {/* Submit */}
                  {sendError && (
                    <p className="text-red-500 text-sm text-center">{sendError}</p>
                  )}
                  <button
                    type="submit"
                    disabled={sending}
                    className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold py-3.5 rounded-xl hover:opacity-90 transition-opacity flex items-center justify-center gap-2 text-sm disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    <span>{sending ? "Sending…" : "Send Message"}</span>
                    {!sending && <span>→</span>}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

    </>
  );
}
