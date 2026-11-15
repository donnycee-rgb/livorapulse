/**
 * A plant that grows a leaf for each eco action this week. With none yet,
 * it's a small seedling waiting for the first one.
 */
export default function GrowingPlant({ leaves }: { leaves: number }) {
  const n = Math.min(14, Math.max(0, leaves))
  const stemTop = 150 - Math.min(110, 30 + n * 8) // the stem grows with the leaves
  const leafPos = Array.from({ length: n }, (_, i) => {
    const y = 140 - (i + 1) * ((140 - stemTop) / (n + 0.5))
    const left = i % 2 === 0
    return { y, left, size: 0.75 + 0.25 * ((i % 3) / 2) }
  })

  return (
    <svg viewBox="0 0 160 190" className="w-40 h-48 max-sm:w-32 max-sm:h-40" role="img"
      aria-label={n ? `A plant with ${n} ${n === 1 ? 'leaf' : 'leaves'}` : 'A seedling'}>
      {/* stem */}
      <path d={`M80 150 C 78 ${(150 + stemTop) / 2}, 82 ${(150 + stemTop) / 2}, 80 ${stemTop}`} stroke="#4C8B3F" strokeWidth="4" fill="none" strokeLinecap="round" />
      {/* leaves */}
      {leafPos.map(({ y, left, size }, i) => (
        <g key={i} transform={`translate(80 ${y}) scale(${left ? -size : size} ${size})`}>
          <path d="M0 0 C 10 -14, 30 -14, 38 -2 C 28 6, 10 8, 0 0 Z" fill={i % 2 ? '#5FAE4E' : '#3D9A41'} />
          <path d="M2 -1 C 14 -6, 24 -6, 34 -2" stroke="#2E7D32" strokeWidth="0.8" fill="none" opacity="0.5" />
        </g>
      ))}
      {/* a bud on top once it's grown */}
      {n >= 7 && <circle cx="80" cy={stemTop - 4} r="6" fill="#F5A623" />}
      {n === 0 && <path d="M80 140 C 74 132, 70 130, 66 131 M80 140 C 86 132, 90 130, 94 131" stroke="#5FAE4E" strokeWidth="3" fill="none" strokeLinecap="round" />}
      {/* pot */}
      <path d="M48 150 H112 L104 186 H56 Z" fill="#C2703D" />
      <rect x="44" y="144" width="72" height="10" rx="3" fill="#D98A52" />
    </svg>
  )
}
