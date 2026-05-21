'use client';
import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';

const CATEGORY_LABELS = {
  'ai-tech-automation': { label: 'AI & Tech', color: '#8b5cf6', bg: '#f5f3ff' },
  'career-growth-remote-work': { label: 'Career', color: '#f59e0b', bg: '#fffbeb' },
  'health-wellness': { label: 'Health', color: '#10b981', bg: '#ecfdf5' },
};

export default function AdminDashboard() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toggling, setToggling] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [confirmDelete, setConfirmDelete] = useState(null);

  const fetchPosts = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/posts');
      if (!res.ok) throw new Error('Failed to load posts');
      const data = await res.json();
      setPosts(data.posts);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchPosts(); }, [fetchPosts]);

  async function togglePublish(post) {
    setToggling(post.id);
    try {
      const res = await fetch(`/api/admin/posts/${post.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ published: !post.published }),
      });
      if (!res.ok) throw new Error('Update failed');
      setPosts((prev) =>
        prev.map((p) => p.id === post.id ? { ...p, published: !post.published } : p)
      );
    } catch (e) {
      alert(e.message);
    } finally {
      setToggling(null);
    }
  }

  async function deletePost(id) {
    setDeleting(id);
    try {
      const res = await fetch(`/api/admin/posts/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
      setPosts((prev) => prev.filter((p) => p.id !== id));
    } catch (e) {
      alert(e.message);
    } finally {
      setDeleting(null);
      setConfirmDelete(null);
    }
  }

  const filtered = posts.filter((p) => {
    const matchSearch = !search || p.title.toLowerCase().includes(search.toLowerCase());
    const matchCat = filterCat === 'all' || p.category === filterCat;
    const matchStatus = filterStatus === 'all'
      || (filterStatus === 'published' && p.published)
      || (filterStatus === 'draft' && !p.published);
    return matchSearch && matchCat && matchStatus;
  });

  const stats = {
    total: posts.length,
    published: posts.filter((p) => p.published).length,
    drafts: posts.filter((p) => !p.published).length,
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Welcome */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800">Dashboard</h1>
          <p className="text-slate-500 text-sm mt-1">Manage all your blog posts in one place</p>
        </div>
        <Link
          href="/admin/posts/new"
          className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors shadow-sm"
        >
          ✏️ New Post
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Total Posts', value: stats.total, color: '#6366f1', bg: '#eef2ff' },
          { label: 'Published', value: stats.published, color: '#10b981', bg: '#ecfdf5' },
          { label: 'Drafts', value: stats.drafts, color: '#f59e0b', bg: '#fffbeb' },
        ].map((s) => (
          <div
            key={s.label}
            className="bg-white rounded-2xl border border-slate-100 p-5 flex flex-col gap-1 shadow-sm"
          >
            <span className="text-3xl font-extrabold" style={{ color: s.color }}>
              {loading ? '—' : s.value}
            </span>
            <span className="text-xs text-slate-500 font-medium">{s.label}</span>
          </div>
        ))}
      </div>

      {/* Filters + search */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <h2 className="text-base font-bold text-slate-800 flex-1">All Posts</h2>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <input
              type="text"
              placeholder="Search posts…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm text-slate-700 focus:outline-none focus:border-indigo-400 w-48"
            />

            <select
              value={filterCat}
              onChange={(e) => setFilterCat(e.target.value)}
              className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm text-slate-700 focus:outline-none focus:border-indigo-400"
            >
              <option value="all">All categories</option>
              <option value="ai-tech-automation">AI & Tech</option>
              <option value="career-growth-remote-work">Career</option>
              <option value="health-wellness">Health</option>
            </select>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm text-slate-700 focus:outline-none focus:border-indigo-400"
            >
              <option value="all">All statuses</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
            </select>
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex items-center justify-center py-20 text-slate-400">
            <div className="w-6 h-6 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin mr-3" />
            Loading posts…
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-16 text-center px-6">
            <p className="text-red-500 font-semibold">{error}</p>
            <button onClick={fetchPosts} className="mt-3 text-sm text-indigo-600 hover:underline">
              Try again
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400">
            <span className="text-4xl mb-3">📭</span>
            <p className="font-medium">No posts found</p>
            <p className="text-sm">Try adjusting your filters or search term</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-slate-400 font-semibold uppercase tracking-wide border-b border-slate-100">
                  <th className="px-6 py-3">Title</th>
                  <th className="px-4 py-3 hidden md:table-cell">Category</th>
                  <th className="px-4 py-3 hidden sm:table-cell">Date</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map((post) => {
                  const cat = CATEGORY_LABELS[post.category] ?? { label: post.category, color: '#6366f1', bg: '#eef2ff' };
                  return (
                    <tr key={post.id} className="hover:bg-slate-50 transition-colors group">
                      <td className="px-6 py-4 max-w-xs">
                        <p className="font-medium text-slate-800 line-clamp-2 leading-snug">
                          {post.title}
                        </p>
                        <p className="text-xs text-slate-400 mt-0.5">/blog/{post.slug}</p>
                      </td>
                      <td className="px-4 py-4 hidden md:table-cell">
                        <span
                          className="inline-block text-xs font-semibold px-2.5 py-1 rounded-full"
                          style={{ color: cat.color, backgroundColor: cat.bg }}
                        >
                          {cat.label}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-slate-500 hidden sm:table-cell whitespace-nowrap">
                        {post.date}
                      </td>
                      <td className="px-4 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${
                            post.published
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${post.published ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                          {post.published ? 'Published' : 'Draft'}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center justify-end gap-2">
                          {/* View live */}
                          {post.published && (
                            <Link
                              href={`/blog/${post.slug}`}
                              target="_blank"
                              className="text-xs text-slate-400 hover:text-indigo-600 transition-colors hidden group-hover:inline-block"
                            >
                              ↗
                            </Link>
                          )}
                          {/* Edit */}
                          <Link
                            href={`/admin/posts/${post.id}/edit`}
                            className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 transition-colors"
                          >
                            Edit
                          </Link>
                          {/* Toggle publish */}
                          <button
                            onClick={() => togglePublish(post)}
                            disabled={toggling === post.id}
                            className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50 ${
                              post.published
                                ? 'bg-slate-100 hover:bg-amber-50 text-slate-600 hover:text-amber-700'
                                : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700'
                            }`}
                          >
                            {toggling === post.id
                              ? '…'
                              : post.published
                              ? 'Unpublish'
                              : 'Publish'}
                          </button>
                          {/* Delete */}
                          <button
                            onClick={() => setConfirmDelete(post)}
                            disabled={deleting === post.id}
                            className="text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 transition-colors disabled:opacity-50"
                          >
                            {deleting === post.id ? '…' : '✕'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer row */}
        {!loading && !error && (
          <div className="px-6 py-3 border-t border-slate-100 text-xs text-slate-400">
            Showing {filtered.length} of {posts.length} posts
          </div>
        )}
      </div>

      {/* Delete confirmation modal */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl p-8 max-w-sm w-full">
            <h3 className="text-lg font-bold text-slate-800 mb-2">Delete post?</h3>
            <p className="text-slate-500 text-sm mb-6 line-clamp-3">
              &ldquo;{confirmDelete.title}&rdquo; will be permanently deleted.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDelete(null)}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-2.5 rounded-xl transition-colors text-sm"
              >
                Cancel
              </button>
              <button
                onClick={() => deletePost(confirmDelete.id)}
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
