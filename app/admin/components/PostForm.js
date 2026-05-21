'use client';
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import RichEditor from './RichEditor';
import ImagePicker from './ImagePicker';
import { slugify } from '../../../lib/slugify';

const CATEGORIES = [
  { value: 'ai-tech-automation',        label: '🤖 AI, Tech & Automation' },
  { value: 'career-growth-remote-work', label: '📈 Career Growth & Remote Work' },
  { value: 'health-wellness',           label: '🌿 Health & Wellness' },
];

const ACCENT = {
  'ai-tech-automation':        '#8b5cf6',
  'career-growth-remote-work': '#f59e0b',
  'health-wellness':           '#10b981',
};

// ── Side-by-side preview ──────────────────────────────────────────────────────

function ArticlePreview({ post }) {
  const accent = ACCENT[post.category] ?? '#6366f1';
  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      {/* Cover image */}
      {post.coverImage && (
        <img
          src={post.coverImage}
          alt="cover"
          className="w-full h-40 object-cover"
          onError={(e) => { e.target.style.display = 'none'; }}
        />
      )}
      {/* Mini blog post header */}
      <div className="px-6 pt-6 pb-4 border-b border-slate-100">
        <span
          className="inline-block text-xs font-semibold px-2.5 py-1 rounded-full text-white mb-3"
          style={{ backgroundColor: accent }}
        >
          {CATEGORIES.find((c) => c.value === post.category)?.label?.replace(/^.+?\s/, '') ?? post.category}
        </span>
        <h1 className="text-xl font-extrabold text-slate-800 leading-tight mb-2">
          {post.title || <span className="text-slate-300 italic">Post title</span>}
        </h1>
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span>{post.date || 'Date'}</span>
          {post.readTime && <><span>·</span><span>{post.readTime}</span></>}
        </div>
      </div>
      {/* Article content */}
      <div className="px-6 py-4 max-h-[560px] overflow-y-auto">
        {post.content ? (
          <div
            className="article-content text-sm leading-relaxed"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />
        ) : (
          <p className="text-slate-300 italic text-sm">Your content will appear here as you type…</p>
        )}
      </div>
    </div>
  );
}

// ── Main form ─────────────────────────────────────────────────────────────────

export default function PostForm({
  initialData = {},
  onSave,        // async (data, publish) => { }
  saving = false,
  backHref = '/admin',
  backLabel = 'Dashboard',
  isNew = false,
}) {
  const [title, setTitle]         = useState(initialData.title ?? '');
  const [slug, setSlug]           = useState(initialData.slug ?? '');
  const [slugManual, setSlugManual] = useState(!!initialData.slug);
  const [excerpt, setExcerpt]     = useState(initialData.excerpt ?? '');
  const [category, setCategory]   = useState(initialData.category ?? 'ai-tech-automation');
  const [date, setDate]           = useState(initialData.date ?? new Date().toISOString().split('T')[0]);
  const [readTime, setReadTime]   = useState(initialData.readTime ?? '');
  const [coverImage, setCoverImage] = useState(initialData.coverImage ?? '');
  const [content, setContent]     = useState(initialData.content ?? '');
  const [published, setPublished] = useState(initialData.published ?? false);
  const [dirty, setDirty]         = useState(false);

  // Auto-generate slug from title (only when not manually set)
  useEffect(() => {
    if (!slugManual && title) {
      setSlug(slugify(title));
    }
  }, [title, slugManual]);

  // Mark dirty on any change
  useEffect(() => { setDirty(true); }, [title, slug, excerpt, category, date, readTime, coverImage, content]);

  const getData = useCallback(() => ({
    title, slug, excerpt, category, date, readTime,
    coverImage, content, published,
  }), [title, slug, excerpt, category, date, readTime, coverImage, content, published]);

  function handleSave(publish) {
    onSave?.(getData(), publish);
  }

  const previewPost = { title, category, date, readTime, content, coverImage };

  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-6">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link href={backHref} className="text-slate-400 hover:text-slate-700 transition-colors text-sm">
            ← {backLabel}
          </Link>
          <span className="text-slate-300">/</span>
          <h1 className="text-lg font-extrabold text-slate-800">
            {isNew ? 'New Post' : 'Edit Post'}
          </h1>
          {dirty && !isNew && (
            <span className="text-xs text-amber-500 bg-amber-50 px-2 py-0.5 rounded-full">Unsaved changes</span>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          {!isNew && initialData.slug && (
            <Link
              href={`/blog/${initialData.slug}`}
              target="_blank"
              className="text-xs text-slate-500 hover:text-indigo-600 transition-colors hidden sm:block"
            >
              View live ↗
            </Link>
          )}
          <button
            onClick={() => handleSave(false)}
            disabled={saving}
            className="text-sm font-semibold px-4 py-2 rounded-xl border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 text-slate-600 hover:text-indigo-700 transition-colors disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Save Draft'}
          </button>
          <button
            onClick={() => handleSave(true)}
            disabled={saving}
            className="text-sm font-semibold px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white transition-colors disabled:opacity-50 shadow-sm"
          >
            {saving ? 'Publishing…' : published ? '✓ Update & Publish' : '🚀 Publish'}
          </button>
        </div>
      </div>

      {/* Two-column layout: editor left, preview right */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

        {/* ── Left: metadata + editor ── */}
        <div className="space-y-4">

          {/* Title */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Your post title"
                className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-800 font-semibold focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
              />
            </div>

            {/* Slug */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                Slug
                {!slugManual && <span className="ml-1 font-normal text-slate-400">(auto-generated)</span>}
              </label>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 shrink-0">/blog/</span>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => { setSlug(e.target.value); setSlugManual(true); }}
                  placeholder="post-slug"
                  className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 font-mono focus:outline-none focus:border-indigo-400"
                />
                {slugManual && (
                  <button
                    type="button"
                    onClick={() => { setSlugManual(false); setSlug(slugify(title)); }}
                    className="text-xs text-slate-400 hover:text-indigo-600 transition-colors shrink-0"
                  >
                    Reset
                  </button>
                )}
              </div>
            </div>

            {/* Excerpt */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Excerpt</label>
              <textarea
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
                placeholder="Short description shown in post cards and meta tags"
                rows={2}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 focus:outline-none focus:border-indigo-400 resize-none"
              />
            </div>

            {/* Meta row: category, date, readTime */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-2 py-2 text-xs text-slate-700 focus:outline-none focus:border-indigo-400 bg-white"
                >
                  {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Date</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-2 py-2 text-xs text-slate-700 focus:outline-none focus:border-indigo-400"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Read time</label>
                <input
                  type="text"
                  value={readTime}
                  onChange={(e) => setReadTime(e.target.value)}
                  placeholder="5 min read"
                  className="w-full border border-slate-200 rounded-lg px-2 py-2 text-xs text-slate-700 focus:outline-none focus:border-indigo-400"
                />
              </div>
            </div>

            {/* Cover image */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Cover image</label>
              <ImagePicker value={coverImage} onChange={setCoverImage} />
            </div>

            {/* Publish toggle */}
            <div className="flex items-center gap-3 pt-1 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setPublished(!published)}
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${published ? 'bg-emerald-500' : 'bg-slate-200'}`}
              >
                <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform ${published ? 'translate-x-4' : 'translate-x-0.5'}`} />
              </button>
              <span className="text-sm text-slate-600 font-medium">
                {published ? 'Published — visible on the site' : 'Draft — not visible publicly'}
              </span>
            </div>
          </div>

          {/* Rich text editor */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Content</label>
            <RichEditor value={content} onChange={setContent} placeholder="Start writing your post…" />
          </div>
        </div>

        {/* ── Right: live preview ── */}
        <div className="hidden xl:block">
          <div className="sticky top-[calc(3.5rem+1.5rem)]">
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Live Preview</label>
              <span className="text-xs text-slate-400">Updates as you type</span>
            </div>
            <ArticlePreview post={previewPost} />
          </div>
        </div>
      </div>
    </div>
  );
}
