import { useEffect, useState } from 'react'
import { useAppStore } from '../store/useAppStore'

export function useStoreHydration() {
  const [hydrated, setHydrated] = useState(useAppStore.persist.hasHydrated())

  useEffect(() => {
    const unsub = useAppStore.persist.onFinishHydration(() => setHydrated(true))
    // in case hydration already finished before effect
    setHydrated(useAppStore.persist.hasHydrated())
    return () => {
      unsub()
    }
  }, [])

  return hydrated
}
