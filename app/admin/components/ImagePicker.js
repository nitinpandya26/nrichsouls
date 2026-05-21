'use client';
import { useState, useRef } from 'react';

const TABS = [
  { id: 'upload', label: 'Upload', icon: '📁' },
  { id: 'ai', label: 'AI Generate', icon: '✨' },
  { id: 'url', label: 'URL', icon: '🔗' },
];

const SIZES = [
  { value: '1792x1024', label: 'Landscape (1792×1024) — blog cover' },
  { value: '1024x1024', label: 'Square (1024×1024) — social' },
  { value: '1024x1792', label: 'Portrait (1024×1792) — Instagram' },
];

export default function ImagePicker({ value, onChange }) {
  const [tab, setTab]           = useState('upload');
  const [uploading, setUploading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [prompt, setPrompt]     = useState('');
  const [size, setSize]         = useState('1792x1024');
  const [urlInput, setUrlInput] = useState(value || '');
  const [revisedPrompt, setRevisedPrompt] = useState('');
  const [error, setError]       = useState('');
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef(null);

  async function uploadFile(file) {
    setUploading(true);
    setError('');
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/admin/upload', { method: 'POST', body: fd });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Upload failed');
      onChange?.(json.url);
    } catch (e) {
      setError(e.message);
    } finally {
      setUploading(false);
    }
  }

  async function generateImage() {
    if (!prompt.trim()) return;
    setGenerating(true);
    setError('');
    setRevisedPrompt('');
    try {
      const res = await fetch('/api/admin/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, size }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Generation failed');
      onChange?.(json.url);
      if (json.revisedPrompt && json.revisedPrompt !== prompt) {
        setRevisedPrompt(json.revisedPrompt);
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setGenerating(false);
    }
  }

  function switchTab(id) {
    setTab(id);
    setError('');
    setRevisedPrompt('');
  }

  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
      {/* Tabs */}
      <div className="flex border-b border-slate-100 bg-slate-50">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => switchTab(t.id)}
            className={`flex-1 text-xs font-semibold py-2.5 transition-colors ${
              tab === t.id
                ? 'bg-white text-indigo-700 border-b-2 border-indigo-500'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      <div className="p-4 space-y-3">
        {error && (
          <p className="text-xs text-red-500 bg-red-50 rounded-lg px-3 py-2">{error}</p>
        )}

        {/* ── Upload tab ── */}
        {tab === 'upload' && (
          <div
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              const f = e.dataTransfer.files[0];
              if (f) uploadFile(f);
            }}
            onClick={() => fileRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
              dragging
                ? 'border-indigo-400 bg-indigo-50'
                : 'border-slate-200 hover:border-indigo-300 hover:bg-slate-50'
            }`}
          >
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadFile(f); }}
            />
            {uploading ? (
              <div className="flex flex-col items-center gap-2">
                <div className="w-6 h-6 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
                <span className="text-sm text-slate-500">Uploading…</span>
              </div>
            ) : (
              <>
                <div className="text-3xl mb-2">📸</div>
                <p className="text-sm font-medium text-slate-600">
                  Drop an image here or <span className="text-indigo-600 underline">click to browse</span>
                </p>
                <p className="text-xs text-slate-400 mt-1">JPG, PNG, WebP, GIF — max 10 MB</p>
              </>
            )}
          </div>
        )}

        {/* ── AI Generate tab ── */}
        {tab === 'ai' && (
          <div className="space-y-3">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe the image… e.g. 'A focused professional reading on a modern laptop, warm afternoon light, realistic photo style'"
              rows={3}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 focus:outline-none focus:border-indigo-400 resize-none"
            />
            <div className="flex gap-2">
              <select
                value={size}
                onChange={(e) => setSize(e.target.value)}
                className="border border-slate-200 rounded-lg px-2 py-2 text-xs text-slate-700 focus:outline-none focus:border-indigo-400 bg-white"
              >
                {SIZES.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
              <button
                type="button"
                onClick={generateImage}
                disabled={generating || !prompt.trim()}
                className="flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold py-2 px-4 rounded-lg transition-colors disabled:opacity-50 shrink-0"
              >
                {generating ? (
                  <><div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> Generating…</>
                ) : (
                  <>✨ Generate</>
                )}
              </button>
            </div>
            {generating && (
              <p className="text-xs text-slate-400 text-center">Usually takes 15–30 seconds…</p>
            )}
            {revisedPrompt && (
              <div className="bg-purple-50 border border-purple-100 rounded-lg p-3">
                <p className="text-xs text-purple-600 font-semibold mb-1">DALL-E revised your prompt:</p>
                <p className="text-xs text-purple-700 leading-relaxed">{revisedPrompt}</p>
              </div>
            )}
          </div>
        )}

        {/* ── URL tab ── */}
        {tab === 'url' && (
          <div className="flex gap-2">
            <input
              type="text"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); onChange?.(urlInput); } }}
              placeholder="/images/my-photo.jpg or https://…"
              className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm font-mono text-slate-700 focus:outline-none focus:border-indigo-400"
            />
            <button
              type="button"
              onClick={() => onChange?.(urlInput)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors shrink-0"
            >
              Use
            </button>
          </div>
        )}

        {/* Current image preview */}
        {value && (
          <div className="relative mt-2">
            <img
              src={value}
              alt="cover preview"
              className="w-full h-36 object-cover rounded-lg border border-slate-200"
              onError={(e) => { e.target.style.display = 'none'; }}
            />
            <button
              type="button"
              onClick={() => { onChange?.(''); setUrlInput(''); }}
              className="absolute top-2 right-2 w-6 h-6 bg-black/50 hover:bg-black/70 text-white rounded-full text-xs flex items-center justify-center transition-colors"
              title="Remove image"
            >
              ✕
            </button>
            <p className="text-xs text-slate-400 mt-1 truncate">{value}</p>
          </div>
        )}
      </div>
    </div>
  );
}
