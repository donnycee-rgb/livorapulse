import clsx from 'clsx'
import type { ButtonHTMLAttributes, PropsWithChildren } from 'react'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'

type Props = PropsWithChildren<
  ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: Variant
    loading?: boolean
  }
>

const base =
  'inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold ' +
  'transition active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed'

const variants: Record<Variant, string> = {
  primary:
    'bg-lp-secondary text-white shadow-card hover:opacity-95',
  secondary:
    'bg-lp-primary text-white shadow-card hover:opacity-95',
  ghost:
    'bg-transparent hover:bg-black/5 dark:hover:bg-white/10 text-black/70 dark:text-white/80',
  danger:
    'bg-lp-alert text-white shadow-card hover:opacity-95',
}

export default function Button({
  variant = 'primary',
  loading = false,
  className,
  children,
  disabled,
  ...props
}: Props) {
  return (
    <button
      {...props}
      disabled={disabled || loading}
      className={clsx(base, variants[variant], className)}
    >
      {loading && (
        <span
          className="inline-block h-4 w-4 rounded-full border-2 border-white/40 border-t-white animate-spin"
          aria-label="Loading"
        />
      )}
      {children}
    </button>
  )
}
