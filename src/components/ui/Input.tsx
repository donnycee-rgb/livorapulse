import clsx from 'clsx'
import type { InputHTMLAttributes } from 'react'

type Props = InputHTMLAttributes<HTMLInputElement> & {
  label?: string
  helperText?: string
}

export default function Input({ label, helperText, className, ...props }: Props) {
  return (
    <label className="block">
      {label && <div className="text-xs font-semibold text-black/60 dark:text-white/60 mb-1">{label}</div>}
      <input
        {...props}
        className={clsx(
          'w-full rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-slate-900 ' +
            'px-3 py-2 text-sm text-black/90 dark:text-white/90 outline-none ' +
            'focus:ring-2 focus:ring-lp-accent/40',
          className,
        )}
      />
      {helperText && <div className="mt-1 text-xs text-black/50 dark:text-white/50">{helperText}</div>}
    </label>
  )
}
