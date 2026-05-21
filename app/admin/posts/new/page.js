'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import PostForm from '../../components/PostForm';

export default function NewPostPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleSave(data, publish) {
    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/admin/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, published: publish }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Save failed');
      router.push('/admin');
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      {error && (
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 pt-4">
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-2">{error}</div>
        </div>
      )}
      <PostForm
        initialData={{}}
        onSave={handleSave}
        saving={saving}
        backHref="/admin"
        backLabel="Dashboard"
        isNew={true}
      />
    </>
  );
}
