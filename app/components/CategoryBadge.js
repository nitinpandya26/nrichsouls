const CATEGORY_CONFIG = {
  'ai-tech-automation': { label: 'AI, Tech & Automation', color: '#8b5cf6' },
  'career-growth-remote-work': { label: 'Career Growth', color: '#f59e0b' },
  'health-wellness': { label: 'Health & Wellness', color: '#10b981' },
};

export default function CategoryBadge({ category, color }) {
  const config = CATEGORY_CONFIG[category] ?? { label: category, color: '#6366f1' };
  const bg = color ?? config.color;

  return (
    <span
      className="inline-block text-xs font-semibold px-3 py-1 rounded-full text-white"
      style={{ backgroundColor: bg }}
    >
      {config.label}
    </span>
  );
}
