'use client';
import { useState, useEffect } from 'react';

export const IMAGE_MODELS = [
  {
    value:          'gpt-image-2',
    label:          'GPT Image 2 · newest',
    sizes:          ['auto', '1024x1024', '1024x1536', '1536x1024'],
    defaultSize:    'auto',
    qualities:      ['auto', 'low', 'medium', 'high'],
    defaultQuality: 'auto',
  },
  {
    value:          'gpt-image-1',
    label:          'GPT Image 1',
    sizes:          ['auto', '1024x1024', '1024x1536', '1536x1024'],
    defaultSize:    'auto',
    qualities:      ['auto', 'low', 'medium', 'high'],
    defaultQuality: 'auto',
  },
  {
    value:          'dall-e-3',
    label:          'DALL-E 3',
    sizes:          ['1792x1024', '1024x1024', '1024x1792'],
    defaultSize:    '1792x1024',
    qualities:      ['standard', 'hd'],
    defaultQuality: 'standard',
  },
  {
    value:          'dall-e-2',
    label:          'DALL-E 2 · fastest',
    sizes:          ['1024x1024', '512x512', '256x256'],
    defaultSize:    '1024x1024',
    qualities:      [],
    defaultQuality: null,
  },
];

/**
 * Reusable image generation panel.
 *
 * Props:
 *   initialPrompt  — seed text for the prompt textarea (updates when parent changes)
 *   onGenerated(url) — called with the Supabase URL after successful generation
 *   regenerate     — if true, shows "Regenerate" label instead of "Generate"
 */
export default function ImageGenerator({ initialPrompt = '', onGenerated, regenerate = false }) {
  const [model, setModel]   = useState('dall-e-3');
  const [size, setSize]     = useState('1792x1024');
  const [quality, setQuality] = useState('standard');
  const [prompt, setPrompt] = useState(initialPrompt);
  const [generating, setGenerating] = useState(false);
  const [error, setError]   = useState('');

  useEffect(() => {
    if (initialPrompt) setPrompt(initialPrompt);
  }, [initialPrompt]);

  function handleModelChange(newModel) {
    const cfg = IMAGE_MODELS.find((m) => m.value === newModel);
    setModel(newModel);
    setSize(cfg.defaultSize);
    setQuality(cfg.defaultQuality ?? '');
  }

  const modelConfig = IMAGE_MODELS.find((m) => m.value === model);

  async function generate() {
    setGenerating(true);
    setError('');
    try {
      const res = await fetch('/api/admin/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          model,
          size,
          quality: quality || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Image generation failed');
      onGenerated(data.url);
    } catch (e) {
      setError(e.message);
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Prompt */}
      <div>
        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
          Image Prompt
        </label>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={3}
          placeholder="Describe the cover image…"
          className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:border-indigo-400 resize-none"
        />
      </div>

      {/* Model + Size + Quality */}
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Model</label>
          <select
            value={model}
            onChange={(e) => handleModelChange(e.target.value)}
            className="w-full border border-slate-200 rounded-lg px-2.5 py-2 text-xs text-slate-700 focus:outline-none focus:border-indigo-400 bg-white"
          >
            {IMAGE_MODELS.map((m) => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Size</label>
          <select
            value={size}
            onChange={(e) => setSize(e.target.value)}
            className="w-full border border-slate-200 rounded-lg px-2.5 py-2 text-xs text-slate-700 focus:outline-none focus:border-indigo-400 bg-white"
          >
            {modelConfig?.sizes.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Quality</label>
          <select
            value={quality}
            onChange={(e) => setQuality(e.target.value)}
            disabled={!modelConfig?.qualities.length}
            className="w-full border border-slate-200 rounded-lg px-2.5 py-2 text-xs text-slate-700 focus:outline-none focus:border-indigo-400 bg-white disabled:opacity-40"
          >
            {modelConfig?.qualities.length
              ? modelConfig.qualities.map((q) => <option key={q} value={q}>{q}</option>)
              : <option value="">N/A</option>}
          </select>
        </div>
      </div>

      {error && <p className="text-xs text-red-500">{error}</p>}

      <button
        onClick={generate}
        disabled={generating || !prompt.trim()}
        className="flex items-center gap-2 bg-slate-800 hover:bg-slate-900 disabled:opacity-50 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors"
      >
        {generating ? (
          <>
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Generating (~10–20s)…
          </>
        ) : regenerate ? '↺ Regenerate Image' : '🎨 Generate Image'}
      </button>

      <p className="text-xs text-slate-400">
        GPT Image 1 = OpenAI&apos;s latest · DALL-E 3 = high quality · DALL-E 2 = fastest & cheapest
      </p>
    </div>
  );
}
