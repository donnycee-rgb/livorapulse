import clsx from 'clsx'

/**
 * The LivoraPulse logo mark: the two figures from the favicon logo, without
 * the wordmark (public/logos/mark.svg is public/logos/1.svg cropped).
 * Height sets the size; the width follows (about 4:3).
 */
export default function BrandMark({ className }: { className?: string }) {
  return (
    <img
      src="/logos/mark.svg"
      alt=""
      aria-hidden
      draggable={false}
      width={86}
      height={64}
      className={clsx('h-9 w-auto select-none flex-shrink-0', className)}
    />
  )
}
