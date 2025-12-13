import type { PropsWithChildren } from 'react'

type Props = PropsWithChildren<{
  className?: string
}>

export default function Card({ className = '', children }: Props) {
  return (
    <div
      className={
        'rounded-2xl bg-lp-white shadow-card border border-black/5 ' +
        'animate-fadeIn ' +
        className
      }
    >
      {children}
    </div>
  )
}
