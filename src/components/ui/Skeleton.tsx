import clsx from 'clsx'

type Props = {
  className?: string
}

export default function Skeleton({ className }: Props) {
  return (
    <div
      className={clsx(
        'animate-pulse rounded-xl bg-black/10 dark:bg-white/10',
        className,
      )}
    />
  )
}
