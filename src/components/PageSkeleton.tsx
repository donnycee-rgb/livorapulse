import Skeleton from './ui/Skeleton'

/**
 * Shown in the content area while a page is loading: grey shapes in the
 * layout most pages share (title, a row of stat cards, a main card and a
 * side column), so the screen never goes blank.
 */
export default function PageSkeleton() {
  return (
    <div className="space-y-5 animate-fadeIn" role="status" aria-label="Loading page">
      <div className="space-y-2">
        <Skeleton className="h-9 w-56 max-w-[60%]" />
        <Skeleton className="h-4 w-80 max-w-[85%]" />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="lp-card rounded-3xl p-4 space-y-3">
            <Skeleton className="h-8 w-8 rounded-full" />
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-6 w-20" />
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-[1fr_280px] gap-4">
        <div className="lp-card rounded-3xl p-5 space-y-4">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-52 max-sm:h-40" />
        </div>
        <div className="space-y-4">
          <div className="lp-card rounded-3xl p-5 space-y-3">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-10" />
            <Skeleton className="h-3 w-3/4" />
          </div>
          <div className="lp-card rounded-3xl p-5 space-y-3 max-sm:hidden">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3" />
            <Skeleton className="h-3 w-2/3" />
          </div>
        </div>
      </div>
      <span className="sr-only">Loading…</span>
    </div>
  )
}
