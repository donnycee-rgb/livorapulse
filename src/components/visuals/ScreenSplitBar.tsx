const LOOK: Record<string, { label: string; color: string }> = {
  Social: { label: 'Social media', color: '#EC4899' },
  Productive: { label: 'Work & learning', color: '#22C55E' },
  Entertainment: { label: 'Entertainment', color: '#0EA5E9' },
}

/** Where screen time went, as one bar split by category with a simple key. */
export default function ScreenSplitBar({ parts }: { parts: Array<{ category: string; minutes: number }> }) {
  const total = parts.reduce((s, p) => s + p.minutes, 0)
  if (total <= 0) return null
  const shown = parts.filter((p) => p.minutes > 0)
  return (
    <div>
      <div className="flex h-3 rounded-full overflow-hidden gap-0.5">
        {shown.map((p) => (
          <div key={p.category} style={{ width: `${(p.minutes / total) * 100}%`, background: (LOOK[p.category] ?? { color: '#94A3B8' }).color }}
            title={`${(LOOK[p.category] ?? { label: p.category }).label}: ${p.minutes} min`} />
        ))}
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
        {shown.map((p) => (
          <span key={p.category} className="flex items-center gap-1.5 text-xs text-black/55 dark:text-white/55">
            <span className="w-2 h-2 rounded-full" style={{ background: (LOOK[p.category] ?? { color: '#94A3B8' }).color }} />
            {(LOOK[p.category] ?? { label: p.category }).label} {Math.round((p.minutes / total) * 100)}%
          </span>
        ))}
      </div>
    </div>
  )
}
