import type { ReactNode } from 'react'

import Card from './Card'

type Props = {
  title: string
  subtitle?: string
  right?: ReactNode
  icon?: ReactNode
}

export default function PageHero({ title, subtitle, right, icon }: Props) {
  return (
    <Card
      className={
        'relative overflow-hidden p-4 md:p-6 ' +
        // subtle gradient in light mode only
        "before:content-[''] before:absolute before:inset-0 before:pointer-events-none " +
        'before:bg-gradient-to-br before:from-lp-accent/10 before:via-transparent before:to-lp-primary/10 before:opacity-70 ' +
        'dark:before:opacity-0'
      }
    >
      <div className="relative flex items-start justify-between gap-4">
        <div className="flex items-start gap-4 min-w-0">
          {icon ? (
            <div className="hidden md:flex h-12 w-12 rounded-2xl bg-white/70 border border-black/10 items-center justify-center shadow-[0_14px_40px_rgba(15,23,42,0.10)] dark:hidden">
              {icon}
            </div>
          ) : null}

          <div className="min-w-0">
            <div className="text-lg font-bold text-lp-secondary dark:text-white tracking-tight">{title}</div>
            {subtitle ? (
              <div className="text-sm text-black/60 dark:text-white/60 mt-0.5 leading-relaxed">
                {subtitle}
              </div>
            ) : null}
          </div>
        </div>

        {right ? <div className="shrink-0">{right}</div> : null}
      </div>
    </Card>
  )
}
