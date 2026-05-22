'use client';
import { useState, useRef, useCallback } from 'react';
import Link from 'next/link';

const SLIDE_PX = 540;

const TEMPLATES = {
  dark: {
    name: 'Dark Indigo',
    slideBg: '#1e1b4b',
    titleColor: '#ffffff',
    bodyColor: '#c7d2fe',
    accentColor: '#818cf8',
    brandColor: '#6366f1',
    numBg: 'rgba(99,102,241,0.2)',
    numColor: '#a5b4fc',
    decoBg: 'rgba(129,140,248,0.12)',
  },
  light: {
    name: 'Clean Light',
    slideBg: '#ffffff',
    titleColor: '#1e293b',
    bodyColor: '#334155',
    accentColor: '#4f46e5',
    brandColor: '#4f46e5',
    numBg: '#eef2ff',
    numColor: '#4f46e5',
    decoBg: '#eef2ff',
    border: '2px solid #e0e7ff',
  },
  gradient: {
    name: 'Gradient',
    slideBg: 'linear-gradient(135deg,#4338ca 0%,#7c3aed 100%)',
    titleColor: '#ffffff',
    bodyColor: '#ede9fe',
    accentColor: '#fbbf24',
    brandColor: 'rgba(255,255,255,0.75)',
    numBg: 'rgba(255,255,255,0.15)',
    numColor: 'rgba(255,255,255,0.9)',
    decoBg: 'rgba(255,255,255,0.08)',
  },
};

function CarouselSlide({ type, tmpl, title, point, pointNum, pointTotal, ctaText, divRef }) {
  const t = TEMPLATES[tmpl];
  const isGradient = tmpl === 'gradient';

  const containerStyle = {
    width: SLIDE_PX,
    height: SLIDE_PX,
    background: t.slideBg,
    border: t.border ?? 'none',
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 52,
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    boxSizing: 'border-box',
    flexShrink: 0,
    overflow: 'hidden',
  };

  return (
    <div ref={divRef} style={containerStyle}>
      {/* Decorative circles */}
      <div style={{
        position: 'absolute', top: -72, right: -72,
        width: 220, height: 220, borderRadius: '50%',
        background: t.decoBg, pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', bottom: -48, left: -48,
        width: 160, height: 160, borderRadius: '50%',
        background: t.decoBg, pointerEvents: 'none',
      }} />

      {/* Slide number (point slides only) */}
      {type === 'point' && (
        <div style={{
          position: 'absolute', top: 24, right: 24,
          background: t.numBg, color: t.numColor,
          borderRadius: 20, padding: '4px 12px',
          fontSize: 12, fontWeight: 700, letterSpacing: '0.04em',
        }}>
          {pointNum} / {pointTotal}
        </div>
      )}

      {/* Brand watermark */}
      <div style={{
        position: 'absolute', bottom: 20, left: 0, right: 0,
        textAlign: 'center', fontSize: 11, fontWeight: 700,
        color: t.brandColor, letterSpacing: '0.1em',
        textTransform: 'uppercase',
      }}>
        nrichsouls.in
      </div>

      {/* TITLE slide */}
      {type === 'title' && (
        <div style={{ textAlign: 'center', zIndex: 1 }}>
          <div style={{
            display: 'inline-block',
            background: t.numBg,
            color: t.accentColor,
            borderRadius: 20, padding: '5px 16px',
            fontSize: 11, fontWeight: 700, letterSpacing: '0.12em',
            textTransform: 'uppercase', marginBottom: 24,
          }}>
            NrichSouls
          </div>
          <div style={{
            fontSize: title?.length > 50 ? 30 : title?.length > 30 ? 34 : 38,
            fontWeight: 800, lineHeight: 1.25,
            color: t.titleColor,
          }}>
            {title || 'Your Title Here'}
          </div>
          <div style={{
            marginTop: 24, width: 48, height: 4, borderRadius: 2,
            background: t.accentColor, margin: '24px auto 0',
          }} />
        </div>
      )}

      {/* POINT slide */}
      {type === 'point' && (
        <div style={{ textAlign: 'center', zIndex: 1, padding: '0 4px' }}>
          <div style={{
            width: 36, height: 4, borderRadius: 2,
            background: t.accentColor, margin: '0 auto 28px',
          }} />
          <div style={{
            fontSize: point?.length > 120 ? 19 : point?.length > 80 ? 22 : point?.length > 50 ? 26 : 30,
            fontWeight: 700, lineHeight: 1.45,
            color: t.bodyColor,
          }}>
            {point || 'Your point here'}
          </div>
        </div>
      )}

      {/* CTA slide */}
      {type === 'cta' && (
        <div style={{ textAlign: 'center', zIndex: 1 }}>
          <div style={{
            fontSize: 42, marginBottom: 16,
          }}>
            ✨
          </div>
          <div style={{
            fontSize: ctaText?.length > 30 ? 26 : 32,
            fontWeight: 800, lineHeight: 1.3,
            color: t.titleColor, marginBottom: 12,
          }}>
            {ctaText || 'Follow for more'}
          </div>
          <div style={{
            fontSize: 14, color: t.brandColor, fontWeight: 500,
          }}>
            nrichsouls.in
          </div>
        </div>
      )}
    </div>
  );
}

export default function CarouselBuilderPage() {
  const [tmpl, setTmpl] = useState('dark');
  const [title, setTitle] = useState('');
  const [points, setPoints] = useState(['', '', '', '', '']);
  const [ctaText, setCtaText] = useState('Follow for more insights');
  const [exporting, setExporting] = useState(false);
  const [exportDone, setExportDone] = useState(false);

  const slideRefs = useRef([]);

  const filledPoints = points.filter((p) => p.trim());

  const slides = [
    { type: 'title' },
    ...filledPoints.map((p, i) => ({ type: 'point', point: p, pointNum: i + 1, pointTotal: filledPoints.length })),
    { type: 'cta' },
  ];

  function updatePoint(i, val) {
    setPoints((prev) => prev.map((p, idx) => (idx === i ? val : p)));
  }

  function addPoint() {
    if (points.length < 9) setPoints((prev) => [...prev, '']);
  }

  function removePoint(i) {
    if (points.length <= 1) return;
    setPoints((prev) => prev.filter((_, idx) => idx !== i));
  }

  const handleExport = useCallback(async () => {
    if (exporting) return;
    setExporting(true);
    setExportDone(false);
    try {
      const [{ default: html2canvas }, { default: JSZip }] = await Promise.all([
        import('html2canvas'),
        import('jszip'),
      ]);

      const zip = new JSZip();
      const folder = zip.folder('carousel');

      for (let i = 0; i < slideRefs.current.length; i++) {
        const el = slideRefs.current[i];
        if (!el) continue;
        const canvas = await html2canvas(el, {
          scale: 2,
          useCORS: true,
          allowTaint: true,
          logging: false,
          width: SLIDE_PX,
          height: SLIDE_PX,
        });
        const blob = await new Promise((res) => canvas.toBlob(res, 'image/png'));
        folder.file(`slide-${String(i + 1).padStart(2, '0')}.png`, blob);
      }

      const content = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(content);
      const a = document.createElement('a');
      a.href = url;
      a.download = `carousel-${Date.now()}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setExportDone(true);
      setTimeout(() => setExportDone(false), 3000);
    } catch (e) {
      alert('Export failed: ' + e.message);
    } finally {
      setExporting(false);
    }
  }, [exporting]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link href="/admin" className="text-sm text-slate-400 hover:text-slate-600 transition-colors">
              Dashboard
            </Link>
            <span className="text-slate-300">/</span>
            <span className="text-sm text-slate-600 font-medium">Carousel Builder</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-800">Carousel Builder</h1>
          <p className="text-slate-500 text-sm mt-1">Design slides for Instagram & LinkedIn carousels</p>
        </div>
        <button
          onClick={handleExport}
          disabled={exporting || !title.trim() || filledPoints.length === 0}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold px-5 py-2.5 rounded-xl transition-colors shadow-sm text-sm"
        >
          {exporting ? (
            <>
              <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              Exporting…
            </>
          ) : exportDone ? (
            <>✓ Downloaded!</>
          ) : (
            <>⬇ Export ZIP</>
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-8 items-start">
        {/* ── Left panel: controls ── */}
        <div className="space-y-6">
          {/* Template picker */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <h2 className="text-sm font-bold text-slate-700 mb-3">Template</h2>
            <div className="grid grid-cols-3 gap-2">
              {Object.entries(TEMPLATES).map(([key, t]) => (
                <button
                  key={key}
                  onClick={() => setTmpl(key)}
                  className={`relative h-16 rounded-xl overflow-hidden border-2 transition-all ${
                    tmpl === key ? 'border-indigo-500 ring-2 ring-indigo-200' : 'border-transparent'
                  }`}
                  style={{ background: t.slideBg }}
                  title={t.name}
                >
                  <span className="absolute inset-0 flex items-center justify-center text-xs font-bold"
                    style={{ color: t.titleColor }}>
                    {t.name.split(' ')[0]}
                  </span>
                  {tmpl === key && (
                    <span className="absolute top-1 right-1 w-4 h-4 bg-indigo-500 rounded-full flex items-center justify-center text-white text-[10px]">✓</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <label className="block text-sm font-bold text-slate-700 mb-2">Title</label>
            <textarea
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter your carousel title…"
              rows={3}
              maxLength={80}
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-indigo-400 resize-none"
            />
            <p className="text-xs text-slate-400 mt-1 text-right">{title.length}/80</p>
          </div>

          {/* Points */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-bold text-slate-700">
                Slides ({filledPoints.length} filled)
              </label>
              <button
                onClick={addPoint}
                disabled={points.length >= 9}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                + Add slide
              </button>
            </div>
            <div className="space-y-2">
              {points.map((p, i) => (
                <div key={i} className="flex gap-2 items-start">
                  <div className="w-6 h-6 rounded-full bg-indigo-50 text-indigo-600 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-2">
                    {i + 1}
                  </div>
                  <textarea
                    value={p}
                    onChange={(e) => updatePoint(i, e.target.value)}
                    placeholder={`Slide ${i + 1} content…`}
                    rows={2}
                    maxLength={160}
                    className="flex-1 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-indigo-400 resize-none"
                  />
                  <button
                    onClick={() => removePoint(i)}
                    disabled={points.length <= 1}
                    className="mt-2 text-slate-300 hover:text-red-400 disabled:opacity-20 transition-colors text-lg leading-none"
                    title="Remove slide"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <label className="block text-sm font-bold text-slate-700 mb-2">CTA Text (last slide)</label>
            <input
              type="text"
              value={ctaText}
              onChange={(e) => setCtaText(e.target.value)}
              maxLength={50}
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-indigo-400"
            />
          </div>

          {/* Export info */}
          <div className="bg-indigo-50 rounded-2xl border border-indigo-100 p-4 text-xs text-indigo-700 space-y-1">
            <p className="font-semibold">Export info</p>
            <p>• {slides.length} slides total ({filledPoints.length} content + title + CTA)</p>
            <p>• 1080 × 1080 px PNG (Instagram / LinkedIn square)</p>
            <p>• Downloaded as a ZIP file</p>
          </div>
        </div>

        {/* ── Right panel: slide previews ── */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-slate-700">Preview — {slides.length} slides</h2>
            <span className="text-xs text-slate-400">Scroll to see all slides</span>
          </div>
          <div className="grid grid-cols-2 gap-4 overflow-y-auto max-h-[80vh]">
            {slides.map((slide, i) => (
              <div key={i} className="relative">
                <div className="text-xs text-slate-400 font-medium mb-1.5 text-center">
                  {i + 1} / {slides.length} ·{' '}
                  {slide.type === 'title' ? 'Title' : slide.type === 'cta' ? 'CTA' : `Point ${slide.pointNum}`}
                </div>
                <div
                  className="rounded-2xl overflow-hidden shadow-md"
                  style={{ transform: 'scale(0.5)', transformOrigin: 'top left', width: SLIDE_PX, height: SLIDE_PX, marginBottom: -(SLIDE_PX / 2) - 8 }}
                >
                  <CarouselSlide
                    type={slide.type}
                    tmpl={tmpl}
                    title={title}
                    point={slide.point}
                    pointNum={slide.pointNum}
                    pointTotal={slide.pointTotal}
                    ctaText={ctaText}
                    divRef={(el) => {
                      slideRefs.current[i] = el;
                    }}
                  />
                </div>
                {/* Spacer to compensate scale transform */}
                <div style={{ height: SLIDE_PX / 2 }} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
