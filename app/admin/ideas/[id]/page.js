'use client';
import { useEffect, useState, use, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import JSZip from 'jszip';
import ImageGenerator, { IMAGE_MODELS } from '../../components/ImageGenerator';

const PLATFORMS = [
  { key: 'generated_blog',      label: 'Blog Post',   icon: '📝' },
  { key: 'generated_linkedin',  label: 'LinkedIn',    icon: '💼' },
  { key: 'generated_twitter',   label: 'X / Twitter', icon: '𝕏'  },
  { key: 'generated_instagram', label: 'Instagram',   icon: '📸' },
];

// ── Shared helpers ────────────────────────────────────────────────────────────

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

function LinkedInPostButton({ text, imageUrl }) {
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');
  async function post() {
    setStatus('posting'); setError('');
    try {
      const res = await fetch('/api/admin/linkedin/post', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, imageUrl: imageUrl || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Post failed');
      setStatus('success');
    } catch (e) { setError(e.message); setStatus('error'); }
  }
  if (status === 'success') return <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg">✓ Posted to LinkedIn</span>;
  return (
    <div className="flex items-center gap-2">
      {status === 'error' && <span className="text-xs text-red-500 max-w-xs truncate" title={error}>{error}</span>}
      <button onClick={post} disabled={status === 'posting' || !text?.trim()}
        className="text-xs font-semibold px-3 py-1.5 rounded-lg text-white transition-colors disabled:opacity-50 flex items-center gap-1.5"
        style={{ backgroundColor: '#0077b5' }}>
        {status === 'posting'
          ? <><div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />Posting…</>
          : <>{imageUrl ? '💼 Post with Image' : '💼 Post to LinkedIn'}</>}
      </button>
    </div>
  );
}

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
        {len}/{max}{over && <span className="ml-1">⚠</span>}
      </span>
    </div>
  );
}

function TwitterView({ content }) {
  const tweets = (content ?? '').split('---').map((t) => t.trim()).filter(Boolean);
  if (!tweets.length) return <p className="text-slate-400 text-sm text-center py-8">No tweets yet.</p>;
  return (
    <div className="space-y-3">
      {tweets.some((t) => t.length > 280) && (
        <div className="bg-red-50 border border-red-100 text-red-600 text-xs px-3 py-2 rounded-lg">
          One or more tweets exceed 280 characters. Edit before posting.
        </div>
      )}
      <div className="space-y-2.5">
        {tweets.map((tweet, i) => (
          <div key={i} className="bg-slate-50 rounded-xl p-4 border border-slate-200">
            <div className="flex gap-3">
              <div className="w-7 h-7 rounded-full bg-slate-200 shrink-0 flex items-center justify-center text-xs font-bold text-slate-500 mt-0.5">{i + 1}</div>
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

function InstagramCaption({ content }) {
  const [groups, setGroups] = useState([]);
  const [groupsLoaded, setGroupsLoaded] = useState(false);
  const [copiedGroup, setCopiedGroup] = useState(null);

  useEffect(() => {
    fetch('/api/admin/hashtags').then((r) => r.json()).then((d) => setGroups(d.groups ?? [])).finally(() => setGroupsLoaded(true));
  }, []);

  const captionLen = content?.length ?? 0;
  const hashtagCount = (content?.match(/#\w+/g) ?? []).length;

  async function copyWithGroup(tags) {
    await navigator.clipboard.writeText(`${content ?? ''}\n\n${tags}`);
    setCopiedGroup(tags);
    setTimeout(() => setCopiedGroup(null), 2000);
  }

  return (
    <div className="space-y-4">
      <div className="bg-slate-50 rounded-xl p-5 border border-slate-200">
        <pre className="whitespace-pre-wrap text-sm text-slate-700 font-sans leading-relaxed max-h-[400px] overflow-y-auto">
          {content || <span className="text-slate-300 italic">No caption yet.</span>}
        </pre>
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-200">
          <div className="flex items-center gap-4">
            <CharBar len={captionLen} max={2200} />
            <span className={`text-xs font-semibold ${hashtagCount > 30 ? 'text-red-500' : 'text-slate-400'}`}>{hashtagCount}/30 hashtags</span>
          </div>
          <CopyButton text={content} />
        </div>
      </div>
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Hashtag Groups</p>
          <Link href="/admin/settings#hashtags" className="text-xs text-indigo-500 hover:underline">Manage groups →</Link>
        </div>
        {!groupsLoaded ? <div className="text-xs text-slate-400">Loading groups…</div> :
         groups.length === 0 ? <p className="text-xs text-slate-400">No hashtag groups saved yet. <Link href="/admin/settings#hashtags" className="text-indigo-500 hover:underline">Add one →</Link></p> : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {groups.map((g) => (
              <div key={g.name} className="bg-white border border-slate-200 rounded-xl p-3 flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-slate-700">{g.name}</p>
                  <p className="text-xs text-slate-400 mt-0.5 truncate">{g.tags}</p>
                </div>
                <button onClick={() => copyWithGroup(g.tags)}
                  className={`text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-colors shrink-0 ${copiedGroup === g.tags ? 'bg-emerald-50 text-emerald-700' : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700'}`}>
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

// ── Platform preview components ──────────────────────────────────────────────

const ACCENT = {
  'ai-tech-automation':     '#8b5cf6',
  'career-growth-remote-work': '#f59e0b',
  'health-wellness':        '#10b981',
};

function BlogPreview({ idea }) {
  const accent = ACCENT[idea.category] ?? '#6366f1';
  const html = (() => {
    let h = idea.generated_blog ?? '';
    if (idea.content_image) {
      const idx = h.indexOf('</p>');
      if (idx !== -1) {
        const fig = `<figure data-content-image="true" style="margin:24px 0;"><img src="${idea.content_image}" alt="" style="max-width:100%;border-radius:12px;display:block;" /></figure>`;
        h = h.slice(0, idx + 4) + fig + h.slice(idx + 4);
      }
    }
    return h;
  })();

  return (
    <div style={{ maxWidth: 672, margin: '0 auto', padding: '24px 0', fontFamily: 'var(--font-geist-sans, system-ui, sans-serif)' }}>
      <span style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: accent, background: `${accent}18`, padding: '3px 10px', borderRadius: 20 }}>
        {idea.category?.replace(/-/g, ' ')}
      </span>
      <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#1e293b', lineHeight: 1.25, margin: '16px 0 12px' }}>
        {idea.title || idea.raw_idea}
      </h1>
      <div style={{ display: 'flex', gap: 12, fontSize: 13, color: '#64748b', paddingBottom: 20, borderBottom: '1px solid #e2e8f0', marginBottom: 24 }}>
        <span>{new Date().toISOString().split('T')[0]}</span>
      </div>
      {idea.cover_image && (
        <div style={{ borderRadius: 16, overflow: 'hidden', marginBottom: 32, height: 280, position: 'relative' }}>
          <img src={idea.cover_image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        </div>
      )}
      {html
        ? <article className="article-content" dangerouslySetInnerHTML={{ __html: html }} />
        : <p style={{ color: '#94a3b8', textAlign: 'center', padding: '48px 0' }}>No blog content yet.</p>}
    </div>
  );
}

function LinkedInPreview({ idea }) {
  const [expanded, setExpanded] = useState(false);
  const text = idea.generated_linkedin ?? '';
  const LIMIT = 280;
  const truncated = !expanded && text.length > LIMIT;
  const display = truncated ? text.slice(0, LIMIT) : text;

  return (
    <div style={{ maxWidth: 560, margin: '0 auto', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
      <div style={{ background: '#fff', border: '1px solid #e0e0e0', borderRadius: 8, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
        {/* Header */}
        <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#0077b5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 18, flexShrink: 0 }}>NP</div>
          <div style={{ flex: 1 }}>
            <p style={{ margin: 0, fontWeight: 600, fontSize: 14, color: '#000' }}>Nitin Pandya</p>
            <p style={{ margin: 0, fontSize: 12, color: '#666' }}>Founder · NrichSouls</p>
            <p style={{ margin: 0, fontSize: 11, color: '#888', display: 'flex', alignItems: 'center', gap: 4 }}>Just now · <span style={{ fontSize: 13 }}>🌐</span></p>
          </div>
          <div style={{ width: 24, height: 24, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3, cursor: 'pointer' }}>
            {[0,1,2].map(i => <div key={i} style={{ width: 4, height: 4, borderRadius: '50%', background: '#666' }} />)}
          </div>
        </div>
        {/* Text */}
        {text && (
          <div style={{ padding: '0 16px 12px', fontSize: 14, lineHeight: 1.65, color: '#000e' }}>
            <pre style={{ margin: 0, fontFamily: 'inherit', fontSize: 'inherit', lineHeight: 'inherit', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{display}</pre>
            {truncated && <button onClick={() => setExpanded(true)} style={{ background: 'none', border: 'none', color: '#0077b5', fontWeight: 600, fontSize: 14, cursor: 'pointer', padding: 0 }}>…more</button>}
            {expanded && text.length > LIMIT && <button onClick={() => setExpanded(false)} style={{ background: 'none', border: 'none', color: '#0077b5', fontWeight: 600, fontSize: 14, cursor: 'pointer', padding: 0 }}>Show less</button>}
          </div>
        )}
        {/* Content image */}
        {idea.content_image && (
          <img src={idea.content_image} alt="" style={{ width: '100%', display: 'block' }} />
        )}
        {/* Reactions bar */}
        <div style={{ padding: '8px 16px', borderTop: '1px solid #e0e0e0' }}>
          <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid #e0e0e0', paddingBottom: 8, marginBottom: 8, fontSize: 12, color: '#666' }}>
            <span>👍 ❤️ 💡 &nbsp;Be the first to react</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-around' }}>
            {['👍 Like', '💬 Comment', '🔁 Repost', '📤 Send'].map(a => (
              <button key={a} style={{ background: 'none', border: 'none', color: '#666', fontSize: 13, fontWeight: 600, cursor: 'pointer', padding: '4px 8px', borderRadius: 4 }}>{a}</button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function XPreview({ idea }) {
  const tweets = (idea.generated_twitter ?? '').split('---').map(t => t.trim()).filter(Boolean);

  return (
    <div style={{ background: '#000', borderRadius: 12, padding: '8px 0', maxWidth: 520, margin: '0 auto', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
      {tweets.length === 0
        ? <p style={{ color: '#71767b', textAlign: 'center', padding: '32px 16px', margin: 0 }}>No tweets yet.</p>
        : tweets.map((tweet, i) => (
          <div key={i} style={{ display: 'flex', gap: 12, padding: '12px 16px', borderBottom: i < tweets.length - 1 ? '1px solid #2f3336' : 'none' }}>
            {/* Avatar + connector */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#1d9bf0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 16 }}>N</div>
              {i < tweets.length - 1 && <div style={{ width: 2, flex: 1, background: '#2f3336', margin: '4px 0', minHeight: 16 }} />}
            </div>
            {/* Content */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 4 }}>
                <span style={{ color: '#e7e9ea', fontWeight: 700, fontSize: 15 }}>Nitin Pandya</span>
                <span style={{ color: '#71767b', fontSize: 15 }}>@nrichsouls</span>
                <span style={{ color: '#71767b', fontSize: 15 }}>·</span>
                <span style={{ color: '#71767b', fontSize: 14 }}>Just now</span>
              </div>
              <p style={{ color: '#e7e9ea', fontSize: 15, lineHeight: 1.6, margin: '0 0 12px', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{tweet}</p>
              {tweet.length > 280 && (
                <p style={{ color: '#f4212e', fontSize: 12, margin: '0 0 8px', fontWeight: 600 }}>⚠ {tweet.length}/280 chars</p>
              )}
              {/* Engagement */}
              <div style={{ display: 'flex', gap: 20, color: '#71767b', fontSize: 13 }}>
                {[['💬', ''], ['🔁', ''], ['❤️', ''], ['📊', ''], ['↗', '']].map(([icon, count]) => (
                  <span key={icon} style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}>{icon}<span>{count}</span></span>
                ))}
              </div>
            </div>
          </div>
        ))}
    </div>
  );
}

function InstagramPreview({ idea, carouselItems }) {
  const [activeIdx, setActiveIdx] = useState(0);
  const images = carouselItems.filter(item => item.url).map(item => item.url);
  const displayImages = images.length > 0 ? images : idea.content_image ? [idea.content_image] : [];
  const hasMultiple = displayImages.length > 1;
  const displayImage = displayImages[activeIdx] ?? null;
  const caption = idea.generated_instagram ?? '';
  const captionPreview = caption.slice(0, 120);

  return (
    <div style={{ maxWidth: 468, margin: '0 auto', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
      <div style={{ background: '#fff', border: '1px solid #dbdbdb', borderRadius: 3 }}>
        {/* Header */}
        <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 13, flexShrink: 0 }}>N</div>
          <div style={{ flex: 1 }}>
            <span style={{ fontWeight: 600, fontSize: 14, color: '#262626' }}>nrichsouls</span>
          </div>
          {hasMultiple && (
            <span style={{ fontSize: 12, color: '#8e8e8e' }}>{activeIdx + 1}/{displayImages.length}</span>
          )}
          <span style={{ fontSize: 20, color: '#262626', cursor: 'pointer', lineHeight: 1 }}>···</span>
        </div>
        {/* Image area */}
        <div style={{ position: 'relative', background: '#efefef' }}>
          {displayImage
            ? <img src={displayImage} alt="" style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', display: 'block' }} />
            : <div style={{ width: '100%', aspectRatio: '1', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#aaa', fontSize: 13 }}>No image generated yet</div>
          }
          {hasMultiple && (
            <>
              {activeIdx > 0 && (
                <button onClick={() => setActiveIdx(i => i - 1)} style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.9)', border: 'none', borderRadius: '50%', width: 28, height: 28, cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 1px 4px rgba(0,0,0,0.2)' }}>‹</button>
              )}
              {activeIdx < displayImages.length - 1 && (
                <button onClick={() => setActiveIdx(i => i + 1)} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.9)', border: 'none', borderRadius: '50%', width: 28, height: 28, cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 1px 4px rgba(0,0,0,0.2)' }}>›</button>
              )}
              <div style={{ position: 'absolute', bottom: 10, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 4 }}>
                {displayImages.map((_, i) => (
                  <div key={i} onClick={() => setActiveIdx(i)} style={{ width: i === activeIdx ? 8 : 6, height: i === activeIdx ? 8 : 6, borderRadius: '50%', background: i === activeIdx ? '#3897f0' : 'rgba(255,255,255,0.7)', cursor: 'pointer', transition: 'all 0.15s' }} />
                ))}
              </div>
            </>
          )}
        </div>
        {/* Actions */}
        <div style={{ padding: '10px 16px 6px', display: 'flex', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: 14, flex: 1 }}>
            <span style={{ fontSize: 24, cursor: 'pointer' }}>🤍</span>
            <span style={{ fontSize: 24, cursor: 'pointer' }}>💬</span>
            <span style={{ fontSize: 24, cursor: 'pointer' }}>📤</span>
          </div>
          <span style={{ fontSize: 24, cursor: 'pointer' }}>🔖</span>
        </div>
        {/* Caption */}
        {caption && (
          <div style={{ padding: '0 16px 14px', fontSize: 14, lineHeight: 1.55, color: '#262626' }}>
            <span style={{ fontWeight: 600 }}>nrichsouls</span>{' '}
            <span style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{captionPreview}{caption.length > 120 ? '… ' : ''}</span>
            {caption.length > 120 && <span style={{ color: '#8e8e8e', cursor: 'pointer' }}>more</span>}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function IdeaDetailPage({ params }) {
  const { id } = use(params);
  const router = useRouter();

  const [idea, setIdea] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('generated_blog');
  const [liConnected, setLiConnected] = useState(null);

  const [editMode, setEditMode] = useState({});
  const [editedContent, setEditedContent] = useState({});
  const [savingTab, setSavingTab] = useState({});
  const [savedTab, setSavedTab] = useState({});
  const [showPreview, setShowPreview] = useState(false);

  function switchTab(key) {
    setActiveTab(key);
    setShowPreview(false);
  }

  // Cover image
  const [showCoverImgGen, setShowCoverImgGen] = useState(false);

  // Content image
  const [showContentImgGen, setShowContentImgGen] = useState(false);
  const [savingContentImg, setSavingContentImg] = useState(false);

  // Carousel
  const [carouselItems, setCarouselItems] = useState([]);
  const [generatingPrompts, setGeneratingPrompts] = useState(false);
  const [generatingAll, setGeneratingAll] = useState(false);
  const [savingCarousel, setSavingCarousel] = useState(false);
  const [carouselSaved, setCarouselSaved] = useState(false);
  const [carouselPromptError, setCarouselPromptError] = useState('');
  const [carouselPromptModel, setCarouselPromptModel] = useState('anthropic:claude-sonnet-4-6');
  const stopCarouselRef = useRef(false);
  const [carouselImgModel, setCarouselImgModel] = useState('dall-e-3');
  const [carouselImgSize, setCarouselImgSize] = useState('1024x1024');
  const [carouselImgQuality, setCarouselImgQuality] = useState('standard');

  // idle | checking | confirming | deleting | pushing | error
  const [pushState, setPushState] = useState('idle');
  const [pushError, setPushError] = useState('');
  const [existingPostStatus, setExistingPostStatus] = useState(null);

  useEffect(() => {
    fetch(`/api/admin/ideas/${id}`)
      .then((r) => r.json())
      .then((d) => {
        setIdea(d.idea);
        if (Array.isArray(d.idea?.carousel_images) && d.idea.carousel_images.length) {
          setCarouselItems(d.idea.carousel_images.map((url, i) => ({ prompt: `Carousel image ${i + 1}`, url, generating: false })));
        }
      })
      .finally(() => setLoading(false));
    fetch('/api/admin/linkedin/status')
      .then((r) => r.json())
      .then((d) => setLiConnected(d.connected ?? false))
      .catch(() => setLiConnected(false));
  }, [id]);

  function getContent(key) {
    return editedContent[key] ?? idea?.[key] ?? '';
  }

  function startEdit(key) {
    setEditedContent((prev) => ({ ...prev, [key]: idea?.[key] ?? '' }));
    setEditMode((prev) => ({ ...prev, [key]: true }));
  }

  function cancelEdit(key) {
    setEditMode((prev) => ({ ...prev, [key]: false }));
    setEditedContent((prev) => { const n = { ...prev }; delete n[key]; return n; });
  }

  async function saveTab(key) {
    setSavingTab((prev) => ({ ...prev, [key]: true }));
    try {
      const res = await fetch(`/api/admin/ideas/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [key]: editedContent[key] }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error ?? 'Save failed'); }
      setIdea((prev) => ({ ...prev, [key]: editedContent[key] }));
      setEditMode((prev) => ({ ...prev, [key]: false }));
      setSavedTab((prev) => ({ ...prev, [key]: true }));
      setTimeout(() => setSavedTab((prev) => ({ ...prev, [key]: false })), 2500);
    } catch (e) {
      alert('Save failed: ' + e.message);
    } finally {
      setSavingTab((prev) => ({ ...prev, [key]: false }));
    }
  }

  async function handleCoverImageGenerated(url) {
    await fetch(`/api/admin/ideas/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cover_image: url }),
    });
    setIdea((prev) => ({ ...prev, cover_image: url }));
    setShowCoverImgGen(false);
  }

  async function handleContentImageGenerated(url) {
    setSavingContentImg(true);
    try {
      await fetch(`/api/admin/ideas/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content_image: url }),
      });
      setIdea((prev) => ({ ...prev, content_image: url }));
      setShowContentImgGen(false);
    } finally {
      setSavingContentImg(false);
    }
  }

  async function generateCarouselPrompts() {
    setGeneratingPrompts(true);
    setCarouselPromptError('');
    try {
      const res = await fetch('/api/admin/generate-carousel-prompts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ blogHtml: idea.generated_blog, title: idea.title, count: 6, provider: carouselPromptModel }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed to generate prompts');
      setCarouselItems((data.prompts ?? []).map((p) => ({ prompt: p, url: '', generating: false })));
    } catch (e) {
      setCarouselPromptError(e.message);
    } finally {
      setGeneratingPrompts(false);
    }
  }

  async function generateSingleCarousel(index) {
    setCarouselItems((prev) => prev.map((item, i) => i === index ? { ...item, generating: true } : item));
    try {
      const res = await fetch('/api/admin/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: carouselItems[index].prompt, model: carouselImgModel, size: carouselImgSize, quality: carouselImgQuality || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Generation failed');
      setCarouselItems((prev) => prev.map((item, i) => i === index ? { ...item, url: data.url, generating: false } : item));
    } catch (e) {
      alert(`Image ${index + 1} failed: ${e.message}`);
      setCarouselItems((prev) => prev.map((item, i) => i === index ? { ...item, generating: false } : item));
    }
  }

  async function generateAllCarousel() {
    stopCarouselRef.current = false;
    setGeneratingAll(true);
    for (let i = 0; i < carouselItems.length; i++) {
      if (stopCarouselRef.current) break;
      await generateSingleCarousel(i);
    }
    stopCarouselRef.current = false;
    setGeneratingAll(false);
  }

  function stopCarousel() {
    stopCarouselRef.current = true;
  }

  async function saveCarousel() {
    setSavingCarousel(true);
    try {
      const urls = carouselItems.map((item) => item.url).filter(Boolean);
      await fetch(`/api/admin/ideas/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ carousel_images: urls }),
      });
      setIdea((prev) => ({ ...prev, carousel_images: urls }));
      setCarouselSaved(true);
      setTimeout(() => setCarouselSaved(false), 2500);
    } finally {
      setSavingCarousel(false);
    }
  }

  async function downloadCarouselZip() {
    const zip = new JSZip();
    const folder = zip.folder('carousel');
    const generated = carouselItems.filter((item) => item.url);
    for (let i = 0; i < generated.length; i++) {
      const res = await fetch(generated[i].url);
      const blob = await res.blob();
      folder.file(`carousel-${i + 1}.png`, blob);
    }
    const content = await zip.generateAsync({ type: 'blob' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(content);
    a.download = `carousel-${id}.zip`;
    a.click();
  }

  async function handlePushToDraft() {
    if (idea?.post_id) {
      setPushState('checking');
      try {
        const res = await fetch(`/api/admin/posts/${idea.post_id}`);
        if (!res.ok) {
          await fetch(`/api/admin/ideas/${id}`, {
            method: 'PATCH', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ post_id: null }),
          });
          setIdea((prev) => ({ ...prev, post_id: null }));
          await doPush();
          return;
        }
        const data = await res.json();
        setExistingPostStatus(data.post?.published ? 'published' : 'draft');
        setPushState('confirming');
      } catch (e) {
        setPushError(e.message);
        setPushState('error');
      }
      return;
    }
    await doPush();
  }

  async function confirmDeleteAndRePush() {
    setPushState('deleting');
    try {
      await fetch(`/api/admin/posts/${idea.post_id}`, { method: 'DELETE' });
      setIdea((prev) => ({ ...prev, post_id: null }));
      await doPush();
    } catch (e) {
      setPushError(e.message);
      setPushState('error');
    }
  }

  async function doPush() {
    setPushState('pushing');
    setPushError('');
    try {
      const res = await fetch(`/api/admin/ideas/${id}/publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Push failed');
      router.push(`/admin/posts/${data.postId}/edit`);
    } catch (e) {
      setPushError(e.message);
      setPushState('error');
    }
  }

  const isWorking = ['checking', 'deleting', 'pushing'].includes(pushState);
  const generatedCarouselCount = carouselItems.filter((i) => i.url).length;

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh] text-slate-400">
      <div className="w-6 h-6 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin mr-3" />Loading…
    </div>
  );

  if (!idea) return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <p className="text-slate-500">Idea not found. <Link href="/admin/ideas" className="text-indigo-600 hover:underline">← Back to Ideas</Link></p>
    </div>
  );

  const activeContent = getContent(activeTab);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">

      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/ideas" className="text-slate-400 hover:text-slate-700 transition-colors">← Ideas</Link>
        <span className="text-slate-300">/</span>
        <h1 className="text-xl font-extrabold text-slate-800 truncate">{idea.title || idea.raw_idea}</h1>
      </div>

      {/* Re-push confirmation modal */}
      {pushState === 'confirming' && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl p-8 max-w-sm w-full">
            {existingPostStatus === 'published' ? (
              <>
                <h3 className="text-lg font-bold text-slate-800 mb-2">Already published</h3>
                <p className="text-slate-500 text-sm mb-6">This idea's blog is already live as a published post. You cannot push it again.</p>
                <button onClick={() => setPushState('idle')} className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-2.5 rounded-xl text-sm">Close</button>
              </>
            ) : (
              <>
                <h3 className="text-lg font-bold text-slate-800 mb-2">Draft already exists</h3>
                <p className="text-slate-500 text-sm mb-6">
                  This idea already has a draft post in Dashboard. Delete the old draft and push current content as a new draft?
                </p>
                <div className="flex gap-3">
                  <button onClick={() => setPushState('idle')} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-2.5 rounded-xl text-sm">Cancel</button>
                  <button onClick={confirmDeleteAndRePush} className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-2.5 rounded-xl text-sm">Delete & Push Again</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Meta + push action */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 mb-4 flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex-1 min-w-0 space-y-1.5">
          <p className="text-sm text-slate-600 leading-relaxed">{idea.raw_idea}</p>
          <div className="flex flex-wrap gap-2 text-xs">
            <span className="bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full capitalize">{idea.category?.replace(/-/g, ' ')}</span>
            <span className="bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full capitalize">{idea.tone}</span>
            <span className="bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">{idea.ai_provider}</span>
            {idea.post_id && idea.status !== 'published' && (
              <span className="bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full font-medium">Draft in Dashboard</span>
            )}
            {idea.status === 'published' && (
              <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full font-medium">Published</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {pushError && pushState === 'error' && (
            <p className="text-xs text-red-500 max-w-[200px] truncate" title={pushError}>{pushError}</p>
          )}
          {idea.status === 'published' ? (
            <span className="text-sm font-semibold text-emerald-700 bg-emerald-50 px-4 py-2 rounded-xl">Published ✓</span>
          ) : (
            <button
              onClick={handlePushToDraft}
              disabled={!idea.generated_blog || isWorking}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors"
            >
              {isWorking && <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
              {pushState === 'checking'  ? 'Checking…'  :
               pushState === 'deleting'  ? 'Deleting…'  :
               pushState === 'pushing'   ? 'Pushing…'   :
               '→ Push Blog to Drafts'}
            </button>
          )}
        </div>
      </div>

      {/* Cover image */}
      {idea.cover_image ? (
        <div className="mb-4 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <img src={idea.cover_image} alt="Cover" className="w-full h-56 object-cover" />
          <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100">
            <p className="text-xs font-medium text-slate-500">Cover Image</p>
            <button onClick={() => setShowCoverImgGen((v) => !v)} className="text-xs text-indigo-500 hover:text-indigo-700 font-medium">
              {showCoverImgGen ? 'Hide' : '↺ Regenerate'}
            </button>
          </div>
          {showCoverImgGen && (
            <div className="px-5 pb-5 pt-2">
              <ImageGenerator
                initialPrompt={`Professional blog cover image, modern minimalist design, absolutely no text: ${idea.title || idea.raw_idea}`}
                onGenerated={handleCoverImageGenerated}
                regenerate
              />
            </div>
          )}
        </div>
      ) : (
        <div className="mb-4 bg-white rounded-2xl border border-dashed border-slate-200 p-5">
          <div className="flex items-center justify-between mb-0">
            <div>
              <p className="text-sm font-semibold text-slate-600">No cover image</p>
              <p className="text-xs text-slate-400 mt-0.5">Generate one with any OpenAI image model</p>
            </div>
            <button onClick={() => setShowCoverImgGen((v) => !v)}
              className="text-xs font-semibold text-white bg-slate-800 hover:bg-slate-900 px-4 py-2 rounded-xl transition-colors">
              {showCoverImgGen ? 'Hide' : '🎨 Generate Cover'}
            </button>
          </div>
          {showCoverImgGen && (
            <div className="mt-4 pt-4 border-t border-slate-100">
              <ImageGenerator
                initialPrompt={`Professional blog cover image, modern minimalist design, absolutely no text: ${idea.title || idea.raw_idea}`}
                onGenerated={handleCoverImageGenerated}
              />
            </div>
          )}
        </div>
      )}

      {/* Content image (inline / lead image) */}
      {idea.content_image ? (
        <div className="mb-4 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <img src={idea.content_image} alt="Content" className="w-full h-48 object-cover" />
          <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100">
            <div>
              <p className="text-xs font-medium text-slate-500">Content Image</p>
              <p className="text-xs text-slate-400">Inserted after intro paragraph · used as lead image on LinkedIn & X</p>
            </div>
            <div className="flex items-center gap-2">
              <CopyButton text={idea.content_image} label="Copy URL" />
              <button onClick={() => setShowContentImgGen((v) => !v)} className="text-xs text-indigo-500 hover:text-indigo-700 font-medium">
                {showContentImgGen ? 'Hide' : '↺ Regenerate'}
              </button>
            </div>
          </div>
          {showContentImgGen && (
            <div className="px-5 pb-5 pt-2">
              <ImageGenerator
                initialPrompt={`High-quality editorial illustration for blog article: ${idea.title || idea.raw_idea}. Photorealistic, wide format, no text overlays.`}
                onGenerated={handleContentImageGenerated}
                regenerate
              />
              {savingContentImg && <p className="text-xs text-slate-400 mt-2">Saving…</p>}
            </div>
          )}
        </div>
      ) : (
        <div className="mb-4 bg-white rounded-2xl border border-dashed border-blue-200 p-5">
          <div className="flex items-center justify-between mb-0">
            <div>
              <p className="text-sm font-semibold text-slate-600">No content image</p>
              <p className="text-xs text-slate-400 mt-0.5">Inserted after intro paragraph · used as lead image on LinkedIn & X</p>
            </div>
            <button onClick={() => setShowContentImgGen((v) => !v)}
              className="text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-xl transition-colors">
              {showContentImgGen ? 'Hide' : '🖼️ Generate Content Image'}
            </button>
          </div>
          {showContentImgGen && (
            <div className="mt-4 pt-4 border-t border-slate-100">
              <ImageGenerator
                initialPrompt={`High-quality editorial illustration for blog article: ${idea.title || idea.raw_idea}. Photorealistic, wide format, no text overlays.`}
                onGenerated={handleContentImageGenerated}
              />
              {savingContentImg && <p className="text-xs text-slate-400 mt-2">Saving…</p>}
            </div>
          )}
        </div>
      )}

      {/* Platform tabs */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden mb-4">
        <div className="flex border-b border-slate-100 overflow-x-auto">
          {PLATFORMS.map((p) => (
            <button key={p.key} onClick={() => switchTab(p.key)}
              className={`flex items-center gap-2 px-5 py-3.5 text-sm font-semibold whitespace-nowrap border-b-2 transition-colors ${
                activeTab === p.key ? 'border-indigo-500 text-indigo-700 bg-indigo-50/50' : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
              }`}>
              <span>{p.icon}</span>{p.label}
              {!idea[p.key] && <span className="text-xs text-slate-300">(empty)</span>}
              {savedTab[p.key] && <span className="text-xs text-emerald-600">✓ Saved</span>}
            </button>
          ))}
        </div>

        <div className="p-5">
          {/* Toolbar */}
          <div className="flex items-center justify-between mb-4">
            {showPreview
              ? <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg">
                  {activeTab === 'generated_blog' ? '📝 Blog preview' : activeTab === 'generated_linkedin' ? '💼 LinkedIn preview' : activeTab === 'generated_twitter' ? '𝕏 X preview' : '📸 Instagram preview'}
                </span>
              : <p className="text-xs text-slate-400">
                  {activeTab === 'generated_blog'      && 'HTML article — will render on the blog as-is'}
                  {activeTab === 'generated_linkedin'  && 'Plain text — paste directly into LinkedIn'}
                  {activeTab === 'generated_twitter'   && 'Thread separated by --- · each section = one tweet'}
                  {activeTab === 'generated_instagram' && 'Caption + hashtags for Instagram'}
                </p>
            }
            <div className="flex items-center gap-2">
              {!editMode[activeTab] && !showPreview && activeTab === 'generated_linkedin' && activeContent && (
                liConnected
                  ? <LinkedInPostButton text={activeContent} imageUrl={idea.content_image || ''} />
                  : <Link href="/admin/settings" className="text-xs text-slate-400 hover:text-indigo-600">Connect LinkedIn →</Link>
              )}
              {!editMode[activeTab] && !showPreview && (activeTab === 'generated_blog' || activeTab === 'generated_linkedin') && (
                <CopyButton text={activeContent} />
              )}
              {editMode[activeTab] ? (
                <div className="flex gap-2">
                  <button onClick={() => cancelEdit(activeTab)}
                    className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600">
                    Cancel
                  </button>
                  <button onClick={() => saveTab(activeTab)} disabled={savingTab[activeTab]}
                    className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white">
                    {savingTab[activeTab] ? 'Saving…' : 'Save'}
                  </button>
                </div>
              ) : showPreview ? (
                <button onClick={() => setShowPreview(false)}
                  className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600">
                  ← Source
                </button>
              ) : (
                <div className="flex gap-2">
                  {activeContent && (
                    <button onClick={() => setShowPreview(true)}
                      className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-600">
                      👁 Preview
                    </button>
                  )}
                  <button onClick={() => startEdit(activeTab)}
                    className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600">
                    ✏️ Edit
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Content area */}
          {editMode[activeTab] ? (
            <textarea
              value={editedContent[activeTab] ?? ''}
              onChange={(e) => setEditedContent((prev) => ({ ...prev, [activeTab]: e.target.value }))}
              rows={activeTab === 'generated_blog' ? 30 : 16}
              className="w-full border border-indigo-300 rounded-xl px-4 py-3 text-xs font-mono text-slate-700 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 resize-y"
            />
          ) : showPreview ? (
            <div className="bg-slate-50 rounded-xl overflow-y-auto max-h-[700px] p-5">
              {activeTab === 'generated_blog'      && <BlogPreview      idea={idea} />}
              {activeTab === 'generated_linkedin'  && <LinkedInPreview  idea={idea} />}
              {activeTab === 'generated_twitter'   && <XPreview         idea={idea} />}
              {activeTab === 'generated_instagram' && <InstagramPreview idea={idea} carouselItems={carouselItems} />}
            </div>
          ) : (
            <>
              {/* Lead image strip for LinkedIn & Twitter (source view only) */}
              {(activeTab === 'generated_linkedin' || activeTab === 'generated_twitter') && idea.content_image && (
                <div className="mb-4 flex items-center gap-3 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3">
                  <img src={idea.content_image} alt="" className="w-16 h-16 object-cover rounded-lg shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-blue-800">Lead Image</p>
                    <p className="text-xs text-blue-600 truncate">{idea.content_image}</p>
                  </div>
                  <CopyButton text={idea.content_image} label="Copy URL" />
                </div>
              )}
              {activeTab === 'generated_blog' && (
                activeContent
                  ? <div className="article-content prose prose-slate max-w-none text-sm leading-relaxed bg-slate-50 rounded-xl p-5 max-h-[600px] overflow-y-auto"
                      dangerouslySetInnerHTML={{ __html: activeContent }} />
                  : <p className="text-center py-12 text-slate-400 text-sm">No blog content. Go back to generate.</p>
              )}
              {activeTab === 'generated_twitter'   && <TwitterView     content={activeContent} />}
              {activeTab === 'generated_instagram' && <InstagramCaption content={activeContent} />}
              {activeTab === 'generated_linkedin' && (
                activeContent
                  ? <pre className="whitespace-pre-wrap text-sm text-slate-700 bg-slate-50 rounded-xl p-5 max-h-[500px] overflow-y-auto font-sans leading-relaxed">{activeContent}</pre>
                  : <p className="text-center py-12 text-slate-400 text-sm">No LinkedIn content yet.</p>
              )}
            </>
          )}
        </div>
      </div>

      {/* Instagram Carousel */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-800">Instagram Carousel Images</h2>
              <p className="text-xs text-slate-400 mt-0.5">5–7 images for an Instagram carousel post</p>
            </div>
            <div className="flex items-center gap-2">
              {carouselItems.length > 0 && generatedCarouselCount > 0 && (
                <>
                  <button onClick={downloadCarouselZip}
                    className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600">
                    ↓ ZIP ({generatedCarouselCount})
                  </button>
                  <button onClick={saveCarousel} disabled={savingCarousel}
                    className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${carouselSaved ? 'bg-emerald-50 text-emerald-700' : 'bg-indigo-600 hover:bg-indigo-700 text-white'} disabled:opacity-50`}>
                    {savingCarousel ? 'Saving…' : carouselSaved ? '✓ Saved' : 'Save'}
                  </button>
                </>
              )}
              {carouselItems.length > 0 && (
                generatingAll
                  ? <button onClick={stopCarousel}
                      className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-red-500 hover:bg-red-600 text-white flex items-center gap-1.5">
                      <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Stop
                    </button>
                  : <button onClick={generateAllCarousel} disabled={generatingPrompts}
                      className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white">
                      🎨 Generate All
                    </button>
              )}
              <button onClick={generateCarouselPrompts} disabled={generatingPrompts || !idea.generated_blog}
                className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-900 disabled:opacity-50 text-white flex items-center gap-1.5">
                {generatingPrompts
                  ? <><div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />Generating…</>
                  : carouselItems.length > 0 ? '↺ Prompts' : '✨ Generate Prompts'}
              </button>
            </div>
          </div>

          {/* Model pickers */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Prompt Model</label>
              <select
                value={carouselPromptModel}
                onChange={(e) => setCarouselPromptModel(e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-indigo-400 bg-white"
              >
                <optgroup label="Claude">
                  <option value="anthropic:claude-sonnet-4-6">Claude Sonnet 4.6</option>
                  <option value="anthropic:claude-opus-4-7">Claude Opus 4.7</option>
                  <option value="anthropic:claude-haiku-4-5-20251001">Claude Haiku 4.5</option>
                </optgroup>
                <optgroup label="OpenAI">
                  <option value="openai:gpt-4o">GPT-4o</option>
                  <option value="openai:gpt-4o-mini">GPT-4o Mini</option>
                </optgroup>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Image Model</label>
              <select
                value={carouselImgModel}
                onChange={(e) => {
                  const cfg = IMAGE_MODELS.find((m) => m.value === e.target.value);
                  setCarouselImgModel(e.target.value);
                  setCarouselImgSize(cfg?.defaultSize ?? '1024x1024');
                  setCarouselImgQuality(cfg?.defaultQuality ?? '');
                }}
                className="w-full border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-indigo-400 bg-white"
              >
                {IMAGE_MODELS.map((m) => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Size</label>
              <select
                value={carouselImgSize}
                onChange={(e) => setCarouselImgSize(e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-indigo-400 bg-white"
              >
                {IMAGE_MODELS.find((m) => m.value === carouselImgModel)?.sizes.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Quality</label>
              <select
                value={carouselImgQuality}
                onChange={(e) => setCarouselImgQuality(e.target.value)}
                disabled={!IMAGE_MODELS.find((m) => m.value === carouselImgModel)?.qualities.length}
                className="w-full border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-indigo-400 bg-white disabled:opacity-40"
              >
                {IMAGE_MODELS.find((m) => m.value === carouselImgModel)?.qualities.length
                  ? IMAGE_MODELS.find((m) => m.value === carouselImgModel).qualities.map((q) => (
                      <option key={q} value={q}>{q}</option>
                    ))
                  : <option value="">N/A</option>}
              </select>
            </div>
          </div>
        </div>

        {carouselPromptError && (
          <div className="mx-5 mt-4 text-xs text-red-500 bg-red-50 rounded-lg px-3 py-2">{carouselPromptError}</div>
        )}

        {carouselItems.length === 0 ? (
          <div className="px-5 py-10 text-center">
            <p className="text-slate-400 text-sm">Click "Generate Prompts" to auto-suggest carousel image prompts from the blog content.</p>
            {!idea.generated_blog && <p className="text-xs text-amber-500 mt-2">You need blog content first.</p>}
          </div>
        ) : (
          <div className="p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {carouselItems.map((item, i) => (
              <div key={i} className="border border-slate-200 rounded-xl overflow-hidden">
                {item.url ? (
                  <img src={item.url} alt={`Carousel ${i + 1}`} className="w-full h-40 object-cover" />
                ) : (
                  <div className="w-full h-40 bg-slate-100 flex items-center justify-center">
                    {item.generating
                      ? <div className="w-6 h-6 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
                      : <span className="text-slate-300 text-2xl">{i + 1}</span>}
                  </div>
                )}
                <div className="p-3 space-y-2">
                  <textarea
                    value={item.prompt}
                    onChange={(e) => setCarouselItems((prev) => prev.map((x, j) => j === i ? { ...x, prompt: e.target.value } : x))}
                    rows={3}
                    className="w-full text-xs text-slate-700 border border-slate-200 rounded-lg px-2.5 py-2 focus:outline-none focus:border-indigo-400 resize-none"
                  />
                  <button
                    onClick={() => generateSingleCarousel(i)}
                    disabled={item.generating || generatingAll}
                    className="w-full text-xs font-semibold py-1.5 rounded-lg bg-slate-800 hover:bg-slate-900 disabled:opacity-50 text-white transition-colors">
                    {item.generating ? 'Generating…' : item.url ? '↺ Regenerate' : '🎨 Generate'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
