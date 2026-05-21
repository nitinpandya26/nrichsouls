'use client';
import { useEffect, useState, use } from 'react';
import Link from 'next/link';

const PLATFORMS = [
  { key: 'generated_blog',      label: 'Blog Post',   icon: '📝' },
  { key: 'generated_linkedin',  label: 'LinkedIn',    icon: '💼' },
  { key: 'generated_twitter',   label: 'X / Twitter', icon: '𝕏'  },
  { key: 'generated_instagram', label: 'Instagram',   icon: '📸' },
];

// ── Shared copy button ────────────────────────────────────────────────────────

function CopyButton({ text, label = 'Copy' }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    await navigator.clipboard.writeText(text ?? '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }
  return (
    <button
      onClick={copy}
      className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${
        copied ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
      }`}
    >
      {copied ? '✓ Copied' : label}
    </button>
  );
}

// ── LinkedIn direct-post button ───────────────────────────────────────────────

function LinkedInPostButton({ text }) {
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');

  async function post() {
    setStatus('posting'); setError('');
    try {
      const res = await fetch('/api/admin/linkedin/post', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Post failed');
      setStatus('success');
    } catch (e) { setError(e.message); setStatus('error'); }
  }

  if (status === 'success') return (
    <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg">✓ Posted to LinkedIn</span>
  );

  return (
    <div className="flex items-center gap-2">
      {status === 'error' && <span className="text-xs text-red-500 max-w-xs truncate" title={error}>{error}</span>}
      <button
        onClick={post}
        disabled={status === 'posting' || !text?.trim()}
        className="text-xs font-semibold px-3 py-1.5 rounded-lg text-white transition-colors disabled:opacity-50 flex items-center gap-1.5"
        style={{ backgroundColor: '#0077b5' }}
      >
        {status === 'posting'
          ? <><div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />Posting…</>
          : <>💼 Post to LinkedIn</>}
      </button>
    </div>
  );
}

// ── Twitter: per-tweet cards with char counters ───────────────────────────────

function CharBar({ len, max }) {
  const pct = Math.min((len / max) * 100, 100);
  const over = len > max;
  const warn = len > max * 0.93;
  const color = over ? 'bg-red-500' : warn ? 'bg-amber-400' : 'bg-emerald-400';
  const textColor = over ? 'text-red-500' : warn ? 'text-amber-500' : 'text-slate-400';
  return (
    <div className="flex items-center gap-2">
      <div className="w-20 h-1.5 bg-slate-200 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className={`text-xs font-mono font-semibold tabular-nums ${textColor}`}>
        {len}/{max}
        {over && <span className="ml-1 text-red-500">⚠</span>}
      </span>
    </div>
  );
}

function TwitterView({ content }) {
  const tweets = (content ?? '').split('---').map((t) => t.trim()).filter(Boolean);

  if (!tweets.length) return (
    <p className="text-slate-400 text-sm text-center py-8">No tweets yet.</p>
  );

  const allOver = tweets.some((t) => t.length > 280);

  return (
    <div className="space-y-3">
      {allOver && (
        <div className="bg-red-50 border border-red-100 text-red-600 text-xs px-3 py-2 rounded-lg">
          One or more tweets exceed 280 characters. Edit the content before posting.
        </div>
      )}
      <div className="space-y-2.5">
        {tweets.map((tweet, i) => (
          <div key={i} className="bg-slate-50 rounded-xl p-4 border border-slate-200">
            <div className="flex gap-3">
              <div className="w-7 h-7 rounded-full bg-slate-200 shrink-0 flex items-center justify-center text-xs font-bold text-slate-500 mt-0.5">
                {i + 1}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-slate-800 whitespace-pre-wrap leading-relaxed">{tweet}</p>
                <div className="flex items-center justify-between mt-2.5">
                  <CharBar len={tweet.length} max={280} />
                  <CopyButton text={tweet} label="Copy tweet" />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="flex justify-end pt-1">
        <CopyButton text={content} label={`Copy all ${tweets.length} tweets`} />
      </div>
    </div>
  );
}

// ── Instagram: caption + hashtag group picker ─────────────────────────────────

function InstagramView({ content }) {
  const [groups, setGroups]     = useState([]);
  const [groupsLoaded, setGroupsLoaded] = useState(false);
  const [copiedGroup, setCopiedGroup]   = useState(null);

  useEffect(() => {
    fetch('/api/admin/hashtags')
      .then((r) => r.json())
      .then((d) => setGroups(d.groups ?? []))
      .finally(() => setGroupsLoaded(true));
  }, []);

  const captionLen  = content?.length ?? 0;
  const hashtagCount = (content?.match(/#\w+/g) ?? []).length;

  async function copyWithGroup(tags) {
    await navigator.clipboard.writeText(`${content ?? ''}\n\n${tags}`);
    setCopiedGroup(tags);
    setTimeout(() => setCopiedGroup(null), 2000);
  }

  return (
    <div className="space-y-4">
      {/* Caption */}
      <div className="bg-slate-50 rounded-xl p-5 border border-slate-200">
        <pre className="whitespace-pre-wrap text-sm text-slate-700 font-sans leading-relaxed max-h-[400px] overflow-y-auto">
          {content || <span className="text-slate-300 italic">No caption yet.</span>}
        </pre>
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-200">
          <div className="flex items-center gap-4">
            <CharBar len={captionLen} max={2200} />
            <span className={`text-xs font-semibold ${hashtagCount > 30 ? 'text-red-500' : 'text-slate-400'}`}>
              {hashtagCount}/30 hashtags
            </span>
          </div>
          <CopyButton text={content} />
        </div>
      </div>

      {/* Hashtag groups */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Hashtag Groups</p>
          <Link href="/admin/settings#hashtags" className="text-xs text-indigo-500 hover:underline">
            Manage groups →
          </Link>
        </div>
        {!groupsLoaded ? (
          <div className="text-xs text-slate-400">Loading groups…</div>
        ) : groups.length === 0 ? (
          <p className="text-xs text-slate-400">
            No hashtag groups saved yet.{' '}
            <Link href="/admin/settings#hashtags" className="text-indigo-500 hover:underline">Add one in Settings →</Link>
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {groups.map((g) => (
              <div key={g.name} className="bg-white border border-slate-200 rounded-xl p-3 flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-slate-700">{g.name}</p>
                  <p className="text-xs text-slate-400 mt-0.5 truncate">{g.tags}</p>
                </div>
                <button
                  onClick={() => copyWithGroup(g.tags)}
                  className={`text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-colors shrink-0 ${
                    copiedGroup === g.tags
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700'
                  }`}
                >
                  {copiedGroup === g.tags ? '✓ Copied' : 'Append & Copy'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function IdeaDetailPage({ params }) {
  const { id } = use(params);
  const [idea, setIdea]           = useState(null);
  const [loading, setLoading]     = useState(true);
  const [activeTab, setActiveTab] = useState('generated_blog');
  const [publishing, setPublishing] = useState(false);
  const [publishedSlug, setPublishedSlug] = useState(null);
  const [liConnected, setLiConnected]     = useState(null);

  useEffect(() => {
    fetch(`/api/admin/ideas/${id}`)
      .then((r) => r.json())
      .then((d) => { setIdea(d.idea); if (d.idea?.post_id) setPublishedSlug('already'); })
      .finally(() => setLoading(false));
    fetch('/api/admin/linkedin/status')
      .then((r) => r.json())
      .then((d) => setLiConnected(d.connected ?? false))
      .catch(() => setLiConnected(false));
  }, [id]);

  async function handlePublish() {
    setPublishing(true);
    try {
      const res = await fetch(`/api/admin/ideas/${id}/publish`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setPublishedSlug(data.slug);
      setIdea((prev) => ({ ...prev, status: 'published' }));
    } catch (e) {
      alert(e.message);
    } finally {
      setPublishing(false);
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh] text-slate-400">
      <div className="w-6 h-6 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin mr-3" />
      Loading…
    </div>
  );

  if (!idea) return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <p className="text-slate-500">Idea not found. <Link href="/admin/ideas" className="text-indigo-600 hover:underline">← Back to Ideas</Link></p>
    </div>
  );

  const activeContent = idea[activeTab] ?? '';

  function renderContent() {
    if (!activeContent) return (
      <div className="text-center py-12 text-slate-400">
        <p>No content generated for this platform.</p>
        <Link href="/admin/ideas/new" className="text-indigo-600 hover:underline text-sm mt-2 inline-block">
          Generate new content →
        </Link>
      </div>
    );
    if (activeTab === 'generated_blog') return (
      <div
        className="article-content prose prose-slate max-w-none text-sm leading-relaxed bg-slate-50 rounded-xl p-5 max-h-[600px] overflow-y-auto"
        dangerouslySetInnerHTML={{ __html: activeContent }}
      />
    );
    if (activeTab === 'generated_twitter') return <TwitterView content={activeContent} />;
    if (activeTab === 'generated_instagram') return <InstagramView content={activeContent} />;
    // LinkedIn — plain text
    return (
      <pre className="whitespace-pre-wrap text-sm text-slate-700 bg-slate-50 rounded-xl p-5 max-h-[500px] overflow-y-auto font-sans leading-relaxed">
        {activeContent}
      </pre>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/ideas" className="text-slate-400 hover:text-slate-700 transition-colors">← Ideas</Link>
        <span className="text-slate-300">/</span>
        <h1 className="text-xl font-extrabold text-slate-800 truncate">{idea.title || idea.raw_idea}</h1>
      </div>

      {/* Meta + actions */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 mb-4 flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex-1 min-w-0 space-y-1">
          <p className="text-sm text-slate-500">{idea.raw_idea}</p>
          <div className="flex flex-wrap gap-2 text-xs text-slate-400">
            <span className="bg-slate-100 px-2 py-0.5 rounded-full capitalize">{idea.category?.replace(/-/g, ' ')}</span>
            <span className="bg-slate-100 px-2 py-0.5 rounded-full capitalize">{idea.tone}</span>
            <span className="bg-slate-100 px-2 py-0.5 rounded-full capitalize">{idea.ai_provider}</span>
          </div>
        </div>
        <div className="flex gap-2 shrink-0">
          {idea.status === 'published' || publishedSlug ? (
            publishedSlug && publishedSlug !== 'already' ? (
              <Link href={`/blog/${publishedSlug}`} target="_blank"
                className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors">
                ✓ Live — view post ↗
              </Link>
            ) : (
              <span className="text-sm font-semibold text-emerald-600 bg-emerald-50 px-4 py-2 rounded-xl">Blog published ✓</span>
            )
          ) : (
            <button onClick={handlePublish} disabled={publishing || !idea.generated_blog}
              className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors">
              {publishing ? 'Publishing…' : '🚀 Publish Blog'}
            </button>
          )}
        </div>
      </div>

      {/* Platform tabs */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="flex border-b border-slate-100 overflow-x-auto">
          {PLATFORMS.map((p) => (
            <button key={p.key} onClick={() => setActiveTab(p.key)}
              className={`flex items-center gap-2 px-5 py-3.5 text-sm font-semibold whitespace-nowrap border-b-2 transition-colors ${
                activeTab === p.key
                  ? 'border-indigo-500 text-indigo-700 bg-indigo-50/50'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
              }`}
            >
              <span>{p.icon}</span>{p.label}
              {!idea[p.key] && <span className="text-xs text-slate-300">(empty)</span>}
            </button>
          ))}
        </div>

        <div className="p-5">
          {/* Tab-level actions (LinkedIn post button) */}
          {activeTab === 'generated_linkedin' && activeContent && (
            <div className="flex justify-end mb-3">
              {liConnected
                ? <LinkedInPostButton text={activeContent} />
                : <Link href="/admin/settings" className="text-xs text-slate-400 hover:text-indigo-600 transition-colors">Connect LinkedIn to post →</Link>}
            </div>
          )}

          {/* Blog & LinkedIn get a top-right copy button; Twitter/Instagram handle their own */}
          {(activeTab === 'generated_blog' || activeTab === 'generated_linkedin') && activeContent && (
            <div className="flex justify-end mb-3">
              <CopyButton text={activeContent} />
            </div>
          )}

          {renderContent()}
        </div>
      </div>
    </div>
  );
}
