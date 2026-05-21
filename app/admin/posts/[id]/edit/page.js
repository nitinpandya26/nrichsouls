'use client';
import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import PostForm from '../../../components/PostForm';

export default function EditPostPage({ params }) {
  const { id } = use(params);
  const router = useRouter();
  const [initialData, setInitialData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`/api/admin/posts/${id}`)
      .then((r) => r.json())
      .then(({ post, error }) => {
        if (error || !post) { setError(error ?? 'Post not found'); return; }
        // Map DB snake_case → form camelCase
        setInitialData({
          id: post.id,
          title: post.title ?? '',
          slug: post.slug ?? '',
          excerpt: post.excerpt ?? '',
          category: post.category ?? 'ai-tech-automation',
          date: post.date ?? '',
          readTime: post.read_time ?? '',
          coverImage: post.cover_image ?? '',
          content: post.content ?? '',
          published: post.published ?? false,
        });
      })
      .catch(() => setError('Failed to load post'))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleSave(data, publish) {
    setSaving(true);
    setError('');
    try {
      const res = await fetch(`/api/admin/posts/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, published: publish }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Save failed');
      if (publish) router.push('/admin');
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-slate-400 text-sm animate-pulse">Loading post…</div>
      </div>
    );
  }

  if (error && !initialData) {
    return (
      <div className="max-w-lg mx-auto mt-20 text-center">
        <p className="text-red-500 mb-4">{error}</p>
        <button onClick={() => router.push('/admin')} className="text-sm text-indigo-600 hover:underline">
          ← Back to dashboard
        </button>
      </div>
    );
  }

  return (
    <>
      {error && (
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 pt-4">
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-2">{error}</div>
        </div>
      )}
      <PostForm
        initialData={initialData}
        onSave={handleSave}
        saving={saving}
        backHref="/admin"
        backLabel="Dashboard"
        isNew={false}
      />
    </>
  );
}
