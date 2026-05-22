'use client';
import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

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
  if (status === 'success') return <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg">✓ Posted to LinkedIn</span>;
  return (
    <div className="flex items-center gap-2">
      {status === 'error' && <span className="text-xs text-red-500 max-w-xs truncate" title={error}>{error}</span>}
      <button onClick={post} disabled={status === 'posting' || !text?.trim()}
        className="text-xs font-semibold px-3 py-1.5 rounded-lg text-white transition-colors disabled:opacity-50 flex items-center gap-1.5"
        style={{ backgroundColor: '#0077b5' }}>
        {status === 'posting'
          ? <><div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />Posting…</>
          : <>💼 Post to LinkedIn</>}
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

function InstagramView({ content }) {
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

  const [imgPrompt, setImgPrompt] = useState('');
  const [showImgGen, setShowImgGen] = useState(false);
  const [generatingImage, setGeneratingImage] = useState(false);
  const [imgError, setImgError] = useState('');

  // idle | checking | confirming | deleting | pushing | error
  const [pushState, setPushState] = useState('idle');
  const [pushError, setPushError] = useState('');
  const [existingPostStatus, setExistingPostStatus] = useState(null);

  useEffect(() => {
    fetch(`/api/admin/ideas/${id}`)
      .then((r) => r.json())
      .then((d) => {
        setIdea(d.idea);
        if (d.idea?.title) {
          setImgPrompt(`Professional blog cover image, modern minimalist design, absolutely no text: ${d.idea.title}`);
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

  async function generateCoverImage() {
    setGeneratingImage(true);
    setImgError('');
    try {
      const res = await fetch('/api/admin/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: imgPrompt, size: '1792x1024' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Image generation failed');
      await fetch(`/api/admin/ideas/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cover_image: data.url }),
      });
      setIdea((prev) => ({ ...prev, cover_image: data.url }));
      setShowImgGen(false);
    } catch (e) {
      setImgError(e.message);
    } finally {
      setGeneratingImage(false);
    }
  }

  async function handlePushToDraft() {
    if (idea?.post_id) {
      setPushState('checking');
      try {
        const res = await fetch(`/api/admin/posts/${idea.post_id}`);
        if (!res.ok) {
          // Post was deleted but idea still references it — clear stale link and push fresh
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
            <p className="text-xs font-medium text-slate-500">Cover Image (DALL-E)</p>
            <button onClick={() => setShowImgGen((v) => !v)} className="text-xs text-indigo-500 hover:text-indigo-700 font-medium">
              {showImgGen ? 'Hide' : '↺ Regenerate'}
            </button>
          </div>
          {showImgGen && (
            <div className="px-5 pb-5 space-y-3">
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide">DALL-E 3 Prompt</label>
              <textarea value={imgPrompt} onChange={(e) => setImgPrompt(e.target.value)} rows={3}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:border-indigo-400 resize-none" />
              {imgError && <p className="text-xs text-red-500">{imgError}</p>}
              <button onClick={generateCoverImage} disabled={generatingImage || !imgPrompt.trim()}
                className="flex items-center gap-2 bg-slate-800 hover:bg-slate-900 disabled:opacity-50 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors">
                {generatingImage ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Generating…</> : '↺ Regenerate Image'}
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="mb-4 bg-white rounded-2xl border border-dashed border-slate-200 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-600">No cover image</p>
              <p className="text-xs text-slate-400 mt-0.5">Generate one with DALL-E 3 (uses OpenAI)</p>
            </div>
            <button onClick={() => setShowImgGen((v) => !v)}
              className="text-xs font-semibold text-white bg-slate-800 hover:bg-slate-900 px-4 py-2 rounded-xl transition-colors">
              {showImgGen ? 'Hide' : '🎨 Generate Image'}
            </button>
          </div>
          {showImgGen && (
            <div className="mt-4 pt-4 border-t border-slate-100 space-y-3">
              <textarea value={imgPrompt} onChange={(e) => setImgPrompt(e.target.value)} rows={3}
                placeholder="Describe the cover image…"
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:border-indigo-400 resize-none" />
              {imgError && <p className="text-xs text-red-500">{imgError}</p>}
              <button onClick={generateCoverImage} disabled={generatingImage || !imgPrompt.trim()}
                className="flex items-center gap-2 bg-slate-800 hover:bg-slate-900 disabled:opacity-50 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors">
                {generatingImage
                  ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Generating (~10s)…</>
                  : '🎨 Generate with DALL-E 3'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Platform tabs */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="flex border-b border-slate-100 overflow-x-auto">
          {PLATFORMS.map((p) => (
            <button key={p.key} onClick={() => setActiveTab(p.key)}
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
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs text-slate-400">
              {activeTab === 'generated_blog'      && 'HTML article — will render on the blog as-is'}
              {activeTab === 'generated_linkedin'  && 'Plain text — paste directly into LinkedIn'}
              {activeTab === 'generated_twitter'   && 'Thread separated by --- · each section = one tweet'}
              {activeTab === 'generated_instagram' && 'Caption + hashtags for Instagram'}
            </p>
            <div className="flex items-center gap-2">
              {activeTab === 'generated_linkedin' && !editMode[activeTab] && activeContent && (
                liConnected
                  ? <LinkedInPostButton text={activeContent} />
                  : <Link href="/admin/settings" className="text-xs text-slate-400 hover:text-indigo-600">Connect LinkedIn →</Link>
              )}
              {!editMode[activeTab] && (activeTab === 'generated_blog' || activeTab === 'generated_linkedin') && (
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
              ) : (
                <button onClick={() => startEdit(activeTab)}
                  className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600">
                  ✏️ Edit
                </button>
              )}
            </div>
          </div>

          {editMode[activeTab] ? (
            <textarea
              value={editedContent[activeTab] ?? ''}
              onChange={(e) => setEditedContent((prev) => ({ ...prev, [activeTab]: e.target.value }))}
              rows={activeTab === 'generated_blog' ? 30 : 16}
              className="w-full border border-indigo-300 rounded-xl px-4 py-3 text-xs font-mono text-slate-700 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 resize-y"
            />
          ) : (
            <>
              {activeTab === 'generated_blog' && (
                activeContent
                  ? <div className="article-content prose prose-slate max-w-none text-sm leading-relaxed bg-slate-50 rounded-xl p-5 max-h-[600px] overflow-y-auto"
                      dangerouslySetInnerHTML={{ __html: activeContent }} />
                  : <p className="text-center py-12 text-slate-400 text-sm">No blog content. Go back to generate.</p>
              )}
              {activeTab === 'generated_twitter'   && <TwitterView   content={activeContent} />}
              {activeTab === 'generated_instagram' && <InstagramView content={activeContent} />}
              {activeTab === 'generated_linkedin' && (
                activeContent
                  ? <pre className="whitespace-pre-wrap text-sm text-slate-700 bg-slate-50 rounded-xl p-5 max-h-[500px] overflow-y-auto font-sans leading-relaxed">{activeContent}</pre>
                  : <p className="text-center py-12 text-slate-400 text-sm">No LinkedIn content yet.</p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
