import clsx from 'clsx'

// ---------------------------------------------------------------------------
// Derives initials from a full name
// "Dennis Parker" → "DP"
// "jackline" → "JA"
// ---------------------------------------------------------------------------
function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
  return name.slice(0, 2).toUpperCase()
}

type Size = 'xs' | 'sm' | 'md' | 'lg'

type Props = {
  /** Full name — used to derive initials when no photo is available */
  name?: string
  /** Legacy prop — used directly if name is not provided */
  initials?: string
  /** Photo URL — if provided, shows image instead of initials */
  photoUrl?: string | null
  size?: Size
  className?: string
}

const SIZE_CLASSES: Record<Size, string> = {
  xs: 'w-6 h-6 text-[10px]',
  sm: 'w-8 h-8 text-xs',
  md: 'w-9 h-9 text-sm',
  lg: 'w-14 h-14 text-lg',
}

export default function Avatar({
  name,
  initials,
  photoUrl,
  size = 'md',
  className,
}: Props) {
  // Derive display initials — prefer name, fall back to initials prop
  const displayInitials = name ? getInitials(name) : (initials ?? '??')
  const sizeClass = SIZE_CLASSES[size]

  if (photoUrl) {
    return (
      <img
        src={photoUrl}
        alt={name ?? 'Avatar'}
        className={clsx(
          sizeClass,
          'rounded-xl object-cover flex-shrink-0 ring-2 ring-lp-primary/20',
          className,
        )}
      />
    )
  }

  return (
    <div
      className={clsx(
        sizeClass,
        'rounded-xl bg-lp-primary flex items-center justify-center',
        'text-white font-bold flex-shrink-0 shadow-sm shadow-lp-primary/30',
        className,
      )}
    >
      {displayInitials}
    </div>
  )
}