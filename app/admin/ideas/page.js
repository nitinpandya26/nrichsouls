'use client';
import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';

const CAT_LABELS = {
  'ai-tech-automation':      { label: 'AI & Tech',  color: '#8b5cf6', bg: '#f5f3ff' },
  'career-growth-remote-work':{ label: 'Career',    color: '#f59e0b', bg: '#fffbeb' },
  'health-wellness':          { label: 'Health',    color: '#10b981', bg: '#ecfdf5' },
};

const STATUS_STYLES = {
  draft:     'bg-slate-100 text-slate-500',
  published: 'bg-emerald-50 text-emerald-700',
};

export default function IdeasPage() {
  const [ideas, setIdeas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const fetchIdeas = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/ideas');
      const data = await res.json();
      setIdeas(data.ideas ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchIdeas(); }, [fetchIdeas]);

  async function deleteIdea(id) {
    setDeleting(id);
    await fetch(`/api/admin/ideas/${id}`, { method: 'DELETE' });
    setIdeas((prev) => prev.filter((i) => i.id !== id));
    setDeleting(null);
    setConfirmDelete(null);
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800">Ideas</h1>
          <p className="text-slate-500 text-sm mt-1">Drop a raw idea — AI turns it into content for all platforms</p>
        </div>
        <Link
          href="/admin/ideas/new"
          className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors shadow-sm"
        >
          <span className="text-base leading-none">+</span>
          New Idea
        </Link>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-slate-400">
          <div className="w-6 h-6 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin mr-3" />
          Loading ideas…
        </div>
      ) : ideas.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center justify-center py-24 text-center px-6">
          <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center text-3xl mb-5">💡</div>
          <h2 className="text-lg font-bold text-slate-700 mb-2">No ideas yet</h2>
          <p className="text-slate-400 text-sm max-w-xs mb-6">
            Drop a rough thought — even one sentence. AI will expand it into a blog post, LinkedIn post, X thread, and Instagram caption.
          </p>
          <Link
            href="/admin/ideas/new"
            className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors"
          >
            Generate your first idea →
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-slate-400 font-semibold uppercase tracking-wide border-b border-slate-100">
                <th className="px-6 py-3">Idea</th>
                <th className="px-4 py-3 hidden md:table-cell">Category</th>
                <th className="px-4 py-3 hidden sm:table-cell">AI</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 hidden sm:table-cell">Date</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {ideas.map((idea) => {
                const cat = CAT_LABELS[idea.category] ?? { label: idea.category, color: '#6366f1', bg: '#eef2ff' };
                const hasContent = !!(idea.generated_blog);
                return (
                  <tr key={idea.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-6 py-4 max-w-xs">
                      <p className="font-medium text-slate-800 line-clamp-1">
                        {idea.title || idea.raw_idea}
                      </p>
                      {idea.title && (
                        <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{idea.raw_idea}</p>
                      )}
                    </td>
                    <td className="px-4 py-4 hidden md:table-cell">
                      <span
                        className="inline-block text-xs font-semibold px-2.5 py-1 rounded-full"
                        style={{ color: cat.color, backgroundColor: cat.bg }}
                      >
                        {cat.label}
                      </span>
                    </td>
                    <td className="px-4 py-4 hidden sm:table-cell">
                      <span className="text-xs text-slate-500 capitalize">{idea.ai_provider ?? 'openai'}</span>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_STYLES[idea.status] ?? STATUS_STYLES.draft}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${idea.status === 'published' ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                        {idea.status === 'published' ? 'Blog published' : hasContent ? 'Generated' : 'Draft'}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-slate-400 text-xs hidden sm:table-cell whitespace-nowrap">
                      {new Date(idea.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/admin/ideas/${idea.id}`}
                          className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 transition-colors"
                        >
                          {hasContent ? 'View' : 'Generate'}
                        </Link>
                        <button
                          onClick={() => setConfirmDelete(idea)}
                          disabled={deleting === idea.id}
                          className="text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 transition-colors disabled:opacity-50"
                        >
                          {deleting === idea.id ? '…' : '✕'}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div className="px-6 py-3 border-t border-slate-100 text-xs text-slate-400">
            {ideas.length} idea{ideas.length !== 1 ? 's' : ''} saved
          </div>
        </div>
      )}

      {confirmDelete && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl p-8 max-w-sm w-full">
            <h3 className="text-lg font-bold text-slate-800 mb-2">Delete idea?</h3>
            <p className="text-slate-500 text-sm mb-6 line-clamp-3">
              &ldquo;{confirmDelete.title || confirmDelete.raw_idea}&rdquo; and all generated content will be permanently deleted.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDelete(null)} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-2.5 rounded-xl transition-colors text-sm">
                Cancel
              </button>
              <button
                onClick={() => deleteIdea(confirmDelete.id)}
                disabled={deleting === confirmDelete.id}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-2.5 rounded-xl transition-colors text-sm disabled:opacity-60"
              >
                {deleting === confirmDelete.id ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
