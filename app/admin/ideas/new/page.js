'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import ImageGenerator from '../../components/ImageGenerator';

const CATEGORIES = [
  { value: 'ai-tech-automation',        label: '🤖 AI, Tech & Automation' },
  { value: 'career-growth-remote-work', label: '📈 Career Growth & Remote Work' },
  { value: 'health-wellness',           label: '🌿 Health & Wellness' },
];
const TONES = [
  { value: 'professional',  label: 'Professional' },
  { value: 'casual',        label: 'Casual & Conversational' },
  { value: 'educational',   label: 'Educational / Deep-dive' },
  { value: 'storytelling',  label: 'Storytelling / Personal' },
];
const PROVIDERS = [
  { value: 'anthropic',                  label: 'Claude Sonnet 4.6 (default)' },
  { value: 'anthropic:claude-opus-4-7',  label: 'Claude Opus 4.7 · best' },
  { value: 'openai',                     label: 'GPT-4o (OpenAI)' },
  { value: 'openai:gpt-4o-mini',         label: 'GPT-4o Mini · faster' },
];
const CATEGORY_NAMES = {
  'ai-tech-automation':        'AI, Tech & Automation',
  'career-growth-remote-work': 'Career Growth & Remote Work',
  'health-wellness':           'Health & Wellness',
};
const PLATFORMS = [
  { key: 'blog',      label: 'Blog Post',   icon: '📝' },
  { key: 'linkedin',  label: 'LinkedIn',    icon: '💼' },
  { key: 'twitter',   label: 'X / Twitter', icon: '𝕏' },
  { key: 'instagram', label: 'Instagram',   icon: '📸' },
];

function buildPrompt(idea, category, tone) {
  const catName = CATEGORY_NAMES[category] ?? category;
  return `You are a professional content creator for NrichSouls — a blog covering AI & Tech, Career Growth, and Health & Wellness. The brand voice is practical, evidence-based, slightly personal, zero fluff.

CATEGORY: ${catName}
TONE: ${tone}
IDEA: ${idea}

Generate platform-optimised content. Return ONLY valid JSON — no markdown fences, no explanation, just the raw JSON object.

{
  "title": "compelling, specific blog post title (no clickbait)",
  "blog": "<full HTML article>",
  "linkedin": "<LinkedIn post text>",
  "twitter": "<Twitter/X thread>",
  "instagram": "<Instagram caption>"
}

BLOG rules:
- Use <h2>, <h3>, <p>, <ul>, <li>, <strong>, <em> tags only — no <html>/<body>
- Engaging hook paragraph (no "In today's world…")
- 5-6 sections, each with a clear H2 heading
- Practical, numbered or bulleted takeaways where suitable
- Closing paragraph with a clear call to action
- 900–1100 words total

LINKEDIN rules:
- First line = strong hook (no "I'm excited to share…" or "Thrilled to announce…")
- Personal insight or contrarian angle on the idea
- 3–4 bullet takeaways using • character
- End with a thought-provoking question for comments
- 200–280 words
- 4–5 relevant hashtags on the last line

TWITTER/X rules:
- Thread of exactly 7 tweets
- Tweet 1: punchy hook that makes people stop scrolling, NO numbers
- Tweets 2–6: one insight per tweet, labeled (2/7) … (6/7)
- Tweet 7: CTA + summary labeled (7/7)
- Every tweet ≤ 280 characters
- Separate tweets with exactly the string: ---

INSTAGRAM rules:
- First line: punchy opener with an emoji
- Body: value-driven content, emojis throughout, line breaks for readability
- Call to action (save this / drop a comment / follow for more)
- 150–200 words of caption
- New line, then exactly 22 hashtags starting with # separated by spaces`;
}

// ── Preview components ────────────────────────────────────────────────────────

function BlogPreview({ html }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 max-h-[500px] overflow-y-auto">
      <div className="article-content prose prose-slate max-w-none text-sm leading-relaxed"
        dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  );
}

function LinkedInPreview({ text }) {
  const lines = text.split('\n');
  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-100">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">N</div>
        <div>
          <p className="text-sm font-semibold text-slate-800">Nitin Pandya</p>
          <p className="text-xs text-slate-400">Just now · 🌐</p>
        </div>
      </div>
      <div className="px-4 py-3 max-h-[400px] overflow-y-auto">
        {lines.map((line, i) => (
          <p key={i} className={`text-sm text-slate-700 leading-relaxed ${line === '' ? 'mt-3' : ''}`}>
            {line || <>&nbsp;</>}
          </p>
        ))}
      </div>
      <div className="px-4 py-2 border-t border-slate-100 flex gap-4 text-xs text-slate-400">
        <span>👍 Like</span><span>💬 Comment</span><span>♻️ Repost</span><span>✉️ Send</span>
      </div>
    </div>
  );
}

function TwitterPreview({ text }) {
  const tweets = text.split(/\n?---\n?/).map((t) => t.trim()).filter(Boolean);
  return (
    <div className="space-y-3">
      {tweets.map((tweet, i) => (
        <div key={i} className="bg-white rounded-xl border border-slate-200 px-4 py-3">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-xs flex-shrink-0">N</div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-1">
                <span className="text-sm font-semibold text-slate-800">Nitin Pandya</span>
                <span className="text-xs text-slate-400">@nitinpandya · now</span>
              </div>
              <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{tweet}</p>
              {i === 0 && tweets.length > 1 && (
                <div className="mt-2 ml-px border-l-2 border-slate-200 pl-2 text-xs text-slate-400">Thread continues ↓</div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function InstagramPreview({ text }) {
  const hashtagIdx = text.indexOf('#');
  const caption = hashtagIdx > -1 ? text.slice(0, hashtagIdx).trim() : text;
  const hashtags = hashtagIdx > -1 ? text.slice(hashtagIdx).trim() : '';
  const lines = caption.split('\n');
  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden max-w-sm mx-auto">
      <div className="w-full aspect-square bg-gradient-to-br from-indigo-500 via-purple-500 to-emerald-400 flex items-center justify-center">
        <span className="text-white/60 text-sm">Cover image goes here</span>
      </div>
      <div className="px-4 py-3">
        <div className="flex items-center justify-between mb-3">
          <div className="flex gap-4 text-xl">❤️ 💬 📤</div>
          <span className="text-xl">🔖</span>
        </div>
        <p className="text-xs font-semibold text-slate-800 mb-1">nrichsouls</p>
        <div className="max-h-40 overflow-y-auto">
          {lines.map((line, i) => (
            <p key={i} className={`text-xs text-slate-700 leading-relaxed ${line === '' ? 'mt-2' : ''}`}>
              {line || <>&nbsp;</>}
            </p>
          ))}
          {hashtags && <p className="text-xs text-indigo-500 mt-2 leading-relaxed break-words">{hashtags}</p>}
        </div>
      </div>
    </div>
  );
}

function CopyButton({ text, label = 'Copy' }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    await navigator.clipboard.writeText(text ?? '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }
  return (
    <button onClick={copy}
      className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${copied ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 hover:bg-slate-200 text-slate-600'}`}>
      {copied ? '✓ Copied' : label}
    </button>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function NewIdeaPage() {
  const router = useRouter();

  const [idea, setIdea] = useState('');
  const [category, setCategory] = useState('ai-tech-automation');
  const [tone, setTone] = useState('professional');
  const [provider, setProvider] = useState('anthropic');

  const [showPrompt, setShowPrompt] = useState(false);
  const [promptText, setPromptText] = useState('');

  const [status, setStatus] = useState('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [result, setResult] = useState(null);

  const [activeTab, setActiveTab] = useState('blog');
  const [editMode, setEditMode] = useState({});
  const [editedContent, setEditedContent] = useState({});

  const [showImgSection, setShowImgSection] = useState(false);
  const [coverImageUrl, setCoverImageUrl] = useState('');

  const [saving, setSaving] = useState(false);

  const imgInitialPrompt = result?.title
    ? `Professional blog cover image, modern minimalist design, absolutely no text: ${result.title}`
    : '';

  function togglePromptEditor() {
    if (!showPrompt) {
      setPromptText(buildPrompt(idea || '(your idea)', category, tone));
    }
    setShowPrompt((v) => !v);
  }

  function resetPrompt() {
    setPromptText(buildPrompt(idea || '(your idea)', category, tone));
  }

  function getContent(key) {
    return editedContent[key] ?? result?.[key] ?? '';
  }

  async function handleGenerate(e) {
    e.preventDefault();
    if (!idea.trim()) return;
    setStatus('generating');
    setErrorMsg('');
    setResult(null);
    setCoverImageUrl('');
    setEditedContent({});
    setEditMode({});

    try {
      const res = await fetch('/api/admin/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          idea,
          category,
          tone,
          provider,
          customPrompt: showPrompt ? promptText : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Generation failed');
      setResult(data);
      setStatus('done');
      setActiveTab('blog');
    } catch (err) {
      setErrorMsg(err.message);
      setStatus('error');
    }
  }

  async function handleSaveToIdeas() {
    if (!result) return;
    setSaving(true);
    try {
      const res = await fetch('/api/admin/ideas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          raw_idea:            idea,
          title:               result.title,
          category,
          tone,
          ai_provider:         provider,
          generated_blog:      editedContent.blog      ?? result.blog,
          generated_linkedin:  editedContent.linkedin  ?? result.linkedin,
          generated_twitter:   editedContent.twitter   ?? result.twitter,
          generated_instagram: editedContent.instagram ?? result.instagram,
          cover_image:         coverImageUrl ?? '',
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Save failed');
      router.push(`/admin/ideas/${data.idea.id}`);
    } catch (err) {
      alert(err.message);
      setSaving(false);
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">

      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <Link href="/admin/ideas" className="text-slate-400 hover:text-slate-700 transition-colors">← Ideas</Link>
        <span className="text-slate-300">/</span>
        <h1 className="text-xl font-extrabold text-slate-800">New Idea</h1>
      </div>

      {/* ── Input form ─────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 mb-6">
        <form onSubmit={handleGenerate} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Your idea <span className="text-slate-400 font-normal">(one sentence to a paragraph — AI will expand it)</span>
            </label>
            <textarea
              value={idea}
              onChange={(e) => setIdea(e.target.value)}
              placeholder="e.g. Why most people fail at building habits, and the one shift that makes them stick…"
              rows={4}
              className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 resize-none transition-all"
              disabled={status === 'generating'}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Category</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)} disabled={status === 'generating'}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:border-indigo-400 bg-white">
                {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Tone</label>
              <select value={tone} onChange={(e) => setTone(e.target.value)} disabled={status === 'generating'}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:border-indigo-400 bg-white">
                {TONES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">AI Model (text)</label>
              <select value={provider} onChange={(e) => setProvider(e.target.value)} disabled={status === 'generating'}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:border-indigo-400 bg-white">
                {PROVIDERS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
              </select>
            </div>
          </div>

          {/* Prompt editor */}
          <div>
            <button type="button" onClick={togglePromptEditor}
              className="flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-indigo-600 transition-colors">
              <span className="text-[10px]">{showPrompt ? '▲' : '▼'}</span>
              {showPrompt ? 'Hide AI prompt' : 'View / edit AI prompt'}
            </button>
            {showPrompt && (
              <div className="mt-3 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-slate-500">Edit the prompt sent to the AI. Changes apply only to this generation.</p>
                  <button type="button" onClick={resetPrompt} className="text-xs text-indigo-500 hover:text-indigo-700 font-medium">↺ Reset to auto</button>
                </div>
                <textarea
                  value={promptText}
                  onChange={(e) => setPromptText(e.target.value)}
                  rows={14}
                  className="w-full border border-indigo-200 rounded-xl px-3 py-2.5 text-xs font-mono text-slate-700 bg-indigo-50/30 focus:outline-none focus:border-indigo-400 resize-y"
                />
              </div>
            )}
          </div>

          <div className="flex items-center gap-3 pt-1">
            <button type="submit" disabled={!idea.trim() || status === 'generating'}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold px-6 py-3 rounded-xl transition-colors shadow-sm">
              {status === 'generating' ? (
                <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Generating…</>
              ) : '✨ Generate for All Platforms'}
            </button>
            {result && (
              <button type="button" onClick={() => { setResult(null); setStatus('idle'); setCoverImageUrl(''); }}
                className="text-sm text-slate-400 hover:text-slate-700">← Start over</button>
            )}
          </div>
        </form>
      </div>

      {/* Generating */}
      {status === 'generating' && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-10 text-center">
          <div className="w-12 h-12 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" style={{ borderWidth: 3 }} />
          <p className="text-slate-700 font-semibold">Writing content for 4 platforms…</p>
          <p className="text-slate-400 text-sm mt-1">This takes 20–30 seconds</p>
        </div>
      )}

      {/* Error */}
      {status === 'error' && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6">
          <p className="text-red-600 font-semibold mb-1">Generation failed</p>
          <p className="text-red-500 text-sm">{errorMsg}</p>
          {errorMsg.includes('not configured') && (
            <p className="text-red-400 text-xs mt-2">Add your API key to <code className="bg-red-100 px-1 rounded">.env.local</code> and restart the server.</p>
          )}
        </div>
      )}

      {/* Results */}
      {status === 'done' && result && (
        <div className="space-y-5">

          {/* Title + Save */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Generated title</p>
              <p className="text-lg font-extrabold text-slate-800 leading-snug">{result.title}</p>
            </div>
            <button onClick={handleSaveToIdeas} disabled={saving}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors shadow-sm shrink-0">
              {saving ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Saving…</> : '💾 Save to Ideas'}
            </button>
          </div>

          {/* Platform tabs */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="flex border-b border-slate-100 overflow-x-auto">
              {PLATFORMS.map((p) => (
                <button key={p.key} onClick={() => setActiveTab(p.key)}
                  className={`flex items-center gap-2 px-5 py-3.5 text-sm font-semibold whitespace-nowrap border-b-2 transition-colors ${
                    activeTab === p.key ? 'border-indigo-500 text-indigo-700 bg-indigo-50/50' : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                  }`}>
                  <span>{p.icon}</span>{p.label}
                </button>
              ))}
            </div>
            <div className="p-5">
              <div className="flex items-center justify-between mb-4">
                <p className="text-xs text-slate-400">
                  {activeTab === 'blog' && 'HTML article — review, then save to Ideas'}
                  {activeTab === 'linkedin' && 'Paste into LinkedIn as a post'}
                  {activeTab === 'twitter' && 'Each card = one tweet — copy all for a thread'}
                  {activeTab === 'instagram' && 'Caption + hashtags for Instagram'}
                </p>
                <div className="flex gap-2">
                  <button onClick={() => setEditMode((prev) => ({ ...prev, [activeTab]: !prev[activeTab] }))}
                    className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600">
                    {editMode[activeTab] ? 'Preview' : '✏️ Edit'}
                  </button>
                  <CopyButton text={getContent(activeTab)} />
                </div>
              </div>
              {editMode[activeTab] ? (
                <textarea
                  value={getContent(activeTab)}
                  onChange={(e) => setEditedContent((prev) => ({ ...prev, [activeTab]: e.target.value }))}
                  rows={activeTab === 'blog' ? 24 : 14}
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-xs font-mono text-slate-700 focus:outline-none focus:border-indigo-400 resize-y"
                />
              ) : (
                <>
                  {activeTab === 'blog'      && <BlogPreview      html={getContent('blog')} />}
                  {activeTab === 'linkedin'  && <LinkedInPreview  text={getContent('linkedin')} />}
                  {activeTab === 'twitter'   && <TwitterPreview   text={getContent('twitter')} />}
                  {activeTab === 'instagram' && <InstagramPreview text={getContent('instagram')} />}
                </>
              )}
            </div>
          </div>

          {/* Cover image generator */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <button type="button" onClick={() => setShowImgSection((v) => !v)}
              className="w-full flex items-center justify-between px-5 py-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors">
              <span className="flex items-center gap-2">
                <span>🖼️</span>
                {coverImageUrl ? 'Cover Image — Generated ✓' : 'Generate Cover Image (optional)'}
              </span>
              <span className="text-slate-400 text-xs">{showImgSection ? '▲ Hide' : '▼ Show'}</span>
            </button>
            {showImgSection && (
              <div className="px-5 pb-5 border-t border-slate-100 pt-4 space-y-4">
                {coverImageUrl && (
                  <div className="rounded-xl overflow-hidden border border-slate-200">
                    <img src={coverImageUrl} alt="Cover" className="w-full h-48 object-cover" />
                    <p className="text-xs text-emerald-700 font-medium bg-emerald-50 px-4 py-2 border-t border-slate-200">
                      ✓ Saved to Supabase Storage — included when you Save to Ideas
                    </p>
                  </div>
                )}
                <ImageGenerator
                  initialPrompt={imgInitialPrompt}
                  onGenerated={(url) => setCoverImageUrl(url)}
                  regenerate={!!coverImageUrl}
                />
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  );
}
