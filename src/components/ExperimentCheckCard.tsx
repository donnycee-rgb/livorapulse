import { useEffect, useState } from 'react'

import type { ExperimentList } from '../api/experiments'
import { fetchExperiments } from '../api/experiments'
import { ActiveExperimentCard } from './ExperimentCard'

/**
 * Dashboard prompt for a running experiment: "Did you do it today?".
 * Shown until today is answered (and for the rest of this visit after that,
 * so the answer can still be changed).
 */
export default function ExperimentCheckCard() {
  const [list, setList] = useState<ExperimentList | null>(null)
  const [answeredHere, setAnsweredHere] = useState(false)

  useEffect(() => {
    let cancelled = false
    fetchExperiments()
      .then((l) => { if (!cancelled) setList(l) })
      .catch(() => null) // the dashboard works without it
    return () => { cancelled = true }
  }, [])

  const exp = list?.active
  if (!exp || exp.dayNumber === null) return null
  if (exp.today !== null && !answeredHere) return null

  return (
    <ActiveExperimentCard
      exp={exp}
      compact
      onChange={(l) => { setList(l); setAnsweredHere(true) }}
    />
  )
}
