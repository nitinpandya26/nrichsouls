const CATEGORY_CONFIG = {
  'ai-tech-automation': {
    label: 'AI, Tech & Automation',
    bg: 'bg-[#8b5cf6]',
  },
  'career-growth-remote-work': {
    label: 'Career Growth',
    bg: 'bg-[#f59e0b]',
  },
  'health-wellness': {
    label: 'Health & Wellness',
    bg: 'bg-[#10b981]',
  },
};

export default function CategoryBadge({ category }) {
  const config = CATEGORY_CONFIG[category] ?? {
    label: category,
    bg: 'bg-slate-400',
  };

  return (
    <span
      className={`inline-block text-xs font-semibold px-3 py-1 rounded-full text-white ${config.bg}`}
    >
      {config.label}
    </span>
  );
}
