import clsx from 'clsx'

type Props = {
  checked: boolean
  onChange: (next: boolean) => void
  label: string
  description?: string
}

export default function Toggle({ checked, onChange, label, description }: Props) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <div className="text-sm font-semibold">{label}</div>
        {description && <div className="text-xs text-black/55 dark:text-white/55 mt-0.5">{description}</div>}
      </div>

      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={clsx(
          'relative inline-flex h-7 w-12 items-center rounded-full transition border',
          checked
            ? 'bg-lp-primary border-lp-primary/40'
            : 'bg-black/10 dark:bg-white/15 border-black/10 dark:border-white/10',
        )}
      >
        <span
          className={clsx(
            'inline-block h-5 w-5 transform rounded-full bg-white shadow transition',
            checked ? 'translate-x-6' : 'translate-x-1',
          )}
        />
      </button>
    </div>
  )
}
