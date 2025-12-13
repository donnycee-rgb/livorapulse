import type { PropsWithChildren } from 'react'

type Props = PropsWithChildren<{
  className?: string
}>

export default function Card({ className = '', children }: Props) {
  return (
    <div
      className={
        'rounded-2xl bg-white dark:bg-slate-950 shadow-card ' +
        'border border-black/10 dark:border-white/10 ' +
        'animate-fadeIn ' +
        className
      }
    >
      {children}
    </div>
  )
}
