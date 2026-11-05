// ---------------------------------------------------------------------------
// Photo food scanning: snap a plate → the on-device model guesses the food →
// pick a portion (hand-size guides, remembered per user) → say how much was
// eaten → log. Nothing is logged without the user confirming.
// ---------------------------------------------------------------------------
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react'
import { Camera, ImagePlus, RefreshCw, Search, Sparkles, AlertCircle, CheckCircle2 } from 'lucide-react'
import clsx from 'clsx'
import toast from 'react-hot-toast'
import { apiGet } from '../api/client'
import { classifyFood, ModelUnavailableError } from '../ml/foodClassifier'
import { scanFoodFor, type ScanFood } from '../ml/foodLabels'
import {
  EATEN_OPTIONS, nutritionFor, rememberGrams, rememberedGrams,
  type Per100g, type Prediction,
} from '../ml/portion'

export interface ScannedEntry {
  mealType: string
  foodName: string
  calories: number
  proteinG: number
  carbsG: number
  fatG: number
  quantity: number
  unit: string
}

type Status = 'idle' | 'analyzing' | 'results' | 'unavailable' | 'error'

const LOW_CONFIDENCE = 0.5

/** Lets the Log Food window save a food the user picked but hasn't logged yet. */
export interface FoodScannerHandle {
  /** Logs the picked food if there is one. Resolves false if saving failed. */
  savePending: () => Promise<boolean>
}

const FoodScanner = forwardRef<FoodScannerHandle, {
  mealType: string
  onSave: (entry: ScannedEntry) => Promise<void>
  onSearchInstead: () => void
  /** Called with true while a food is picked and ready to log but not saved. */
  onPendingChange?: (pending: boolean) => void
}>(function FoodScanner({ mealType, onSave, onSearchInstead, onPendingChange }, ref) {
  const fileRef = useRef<HTMLInputElement>(null)
  const imgRef = useRef<HTMLImageElement>(null)
  const [photoUrl, setPhotoUrl] = useState<string | null>(null)
  const [status, setStatus] = useState<Status>('idle')
  const [predictions, setPredictions] = useState<Prediction[]>([])
  const [chosen, setChosen] = useState<{ label: string; food: ScanFood } | null>(null)
  const [per100g, setPer100g] = useState<Per100g | null>(null)
  const [grams, setGrams] = useState(0)
  const [portionLabel, setPortionLabel] = useState('')
  const [eaten, setEaten] = useState(1)
  const [saving, setSaving] = useState(false)
  const [loggedCount, setLoggedCount] = useState(0)

  // Free the photo's memory when it changes or the scanner closes.
  useEffect(() => () => { if (photoUrl) URL.revokeObjectURL(photoUrl) }, [photoUrl])

  const openCamera = () => fileRef.current?.click()

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = '' // allow picking the same photo again
    if (!file) return
    setPhotoUrl(URL.createObjectURL(file))
    setChosen(null); setPer100g(null); setPredictions([]); setLoggedCount(0)
    setStatus('analyzing')
  }

  const analyze = async () => {
    const img = imgRef.current
    if (!img) return
    try {
      const preds = (await classifyFood(img, 3)).filter((p) => scanFoodFor(p.label))
      setPredictions(preds)
      setStatus('results')
    } catch (err) {
      setStatus(err instanceof ModelUnavailableError ? 'unavailable' : 'error')
    }
  }

  const choose = async (label: string) => {
    const food = scanFoodFor(label)
    if (!food) return
    setChosen({ label, food }); setPer100g(null); setEaten(1)
    const remembered = rememberedGrams(food.foodId)
    const def = food.portions[Math.min(1, food.portions.length - 1)]
    const match = food.portions.find((p) => p.grams === remembered)
    setGrams(remembered ?? def.grams)
    setPortionLabel(match?.label ?? (remembered ? 'Your usual' : def.label))
    try {
      const res = await apiGet<{ success: boolean; data: Per100g }>(`/api/nutrition/local/${food.foodId}`)
      setPer100g(res.data)
    } catch {
      toast.error('Could not load nutrition info. Check your connection.')
      setChosen(null)
    }
  }

  const totals = per100g ? nutritionFor(per100g, grams, eaten) : null
  const pending = !!chosen && !!totals && grams > 0

  useEffect(() => { onPendingChange?.(pending) }, [pending, onPendingChange])

  /** Saves the picked food. Returns false if it could not be saved. */
  const log = async (): Promise<boolean> => {
    if (!chosen || !totals || grams <= 0) return true
    setSaving(true)
    try {
      const eatenLabel = EATEN_OPTIONS.find((o) => o.fraction === eaten)?.label ?? ''
      const eatenGrams = Math.round(grams * eaten)
      await onSave({
        mealType,
        foodName: chosen.food.name,
        ...totals,
        quantity: 1,
        unit: eaten === 1
          ? `${portionLabel} (≈${eatenGrams} g)`
          : `${portionLabel}, ate ${eatenLabel.toLowerCase()} (≈${eatenGrams} g)`,
      })
      rememberGrams(chosen.food.foodId, grams)
      setLoggedCount((n) => n + 1)
      setChosen(null); setPer100g(null)
      return true
    } catch {
      toast.error('Failed to save. Try again.')
      return false
    } finally {
      setSaving(false)
    }
  }

  useImperativeHandle(ref, () => ({ savePending: log }))

  const fileInput = (
    <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={onFile} />
  )

  // ── No photo yet ──────────────────────────────────────────────────────────
  if (!photoUrl) {
    return (
      <div className="space-y-3">
        {fileInput}
        <button type="button" onClick={openCamera}
          className="w-full flex flex-col items-center gap-2 py-8 rounded-2xl border-2 border-dashed border-lp-primary/30 bg-lp-primary/[0.04] hover:bg-lp-primary/[0.08] transition-all">
          <div className="w-12 h-12 rounded-2xl bg-lp-primary/15 flex items-center justify-center">
            <Camera size={22} className="text-lp-primary" />
          </div>
          <span className="text-sm font-semibold text-black/70 dark:text-white/75">Take a photo of your plate</span>
          <span className="text-xs text-black/40 dark:text-white/35">or choose one from your gallery</span>
        </button>
        <p className="text-[11px] text-black/35 dark:text-white/30 text-center leading-relaxed">
          Scanning runs on your phone. Your photo is not uploaded.
        </p>
      </div>
    )
  }

  // ── Photo taken ───────────────────────────────────────────────────────────
  return (
    <div className="space-y-4">
      {fileInput}
      <div className="relative rounded-2xl overflow-hidden bg-black/5">
        <img ref={imgRef} src={photoUrl} alt="Your meal" onLoad={analyze}
          className="w-full max-h-52 object-cover" />
        <button type="button" onClick={openCamera}
          className="absolute top-2 right-2 flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-black/55 text-white text-xs font-semibold backdrop-blur-sm">
          <RefreshCw size={11} /> Retake
        </button>
      </div>

      {status === 'analyzing' && (
        <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-lp-primary/[0.06] border border-lp-primary/20">
          <div className="w-4 h-4 rounded-full border-2 border-t-lp-primary border-lp-primary/20 animate-spin flex-shrink-0" />
          <span className="text-xs text-lp-primary font-medium">Recognising your food… (the first scan takes a few seconds)</span>
        </div>
      )}

      {(status === 'unavailable' || status === 'error') && (
        <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl bg-black/[0.03] dark:bg-white/[0.03] border border-black/[0.06] dark:border-white/[0.06]">
          <AlertCircle size={14} className="text-black/40 dark:text-white/35 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-xs font-semibold text-black/55 dark:text-white/50">
              {status === 'unavailable' ? 'Photo scanning is still being trained' : 'Could not scan this photo'}
            </p>
            <p className="text-[11px] text-black/40 dark:text-white/35 mt-0.5">
              {status === 'unavailable'
                ? 'It will be available soon. For now, search for your food instead.'
                : 'Try again with better light, or search for your food instead.'}
            </p>
          </div>
        </div>
      )}

      {status === 'results' && !chosen && (
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-black/45 dark:text-white/40 uppercase tracking-widest">
            <Sparkles size={12} className="text-lp-primary" />
            {loggedCount > 0 ? 'Anything else on the plate?' : 'Is this your food?'}
          </div>
          {predictions.length > 0 && predictions[0].probability < LOW_CONFIDENCE && loggedCount === 0 && (
            <p className="text-[11px] text-black/40 dark:text-white/35">Not very sure about this one. Pick the right food or search.</p>
          )}
          {predictions.map((p) => {
            const food = scanFoodFor(p.label)!
            const pct = Math.round(p.probability * 100)
            return (
              <button key={p.label} type="button" onClick={() => choose(p.label)}
                className="w-full text-left px-3 py-2.5 rounded-xl border border-black/[0.07] dark:border-white/[0.07] hover:border-lp-primary/40 hover:bg-lp-primary/[0.05] transition-all">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-black/75 dark:text-white/75">{food.name}</span>
                  <span className="text-xs font-semibold text-lp-primary">{pct}%</span>
                </div>
                <div className="mt-1.5 h-1 rounded-full bg-black/[0.06] dark:bg-white/[0.06] overflow-hidden">
                  <div className="h-full rounded-full bg-lp-primary" style={{ width: `${pct}%` }} />
                </div>
              </button>
            )
          })}
        </div>
      )}

      {chosen && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-black/80 dark:text-white/85">{chosen.food.name}</span>
            <button type="button" onClick={() => { setChosen(null); setPer100g(null) }}
              className="text-xs font-semibold text-lp-primary">Change</button>
          </div>

          <div>
            <div className="text-xs font-semibold text-black/45 dark:text-white/40 uppercase tracking-widest mb-2">How much was served?</div>
            <div className="grid grid-cols-2 gap-1.5">
              {chosen.food.portions.map((p) => (
                <button key={p.label} type="button" onClick={() => { setGrams(p.grams); setPortionLabel(p.label) }}
                  className={clsx('px-3 py-2 rounded-xl border text-left transition-all',
                    grams === p.grams
                      ? 'bg-lp-primary/10 border-lp-primary/40'
                      : 'border-black/[0.07] dark:border-white/[0.07] hover:border-black/[0.15]')}>
                  <div className="text-xs font-semibold text-black/75 dark:text-white/75">{p.label}</div>
                  <div className="text-[11px] text-black/40 dark:text-white/35">{p.hint ? `${p.hint} · ` : ''}{p.grams} g</div>
                </button>
              ))}
            </div>
            <label className="flex items-center gap-2 mt-2">
              <span className="text-[11px] text-black/40 dark:text-white/35">Or enter grams:</span>
              <input type="number" inputMode="numeric" min={1} value={grams || ''}
                onChange={(e) => { setGrams(Math.max(0, Number(e.target.value) || 0)); setPortionLabel('Custom') }}
                className="w-20 px-2 py-1 rounded-lg border border-black/[0.08] dark:border-white/[0.08] bg-black/[0.03] dark:bg-white/[0.04] text-black/80 dark:text-white/80 text-xs focus:outline-none focus:border-lp-primary/40" />
              <span className="text-[11px] text-black/40 dark:text-white/35">g</span>
            </label>
          </div>

          <div>
            <div className="text-xs font-semibold text-black/45 dark:text-white/40 uppercase tracking-widest mb-2">How much did you eat?</div>
            <div className="grid grid-cols-4 gap-1.5">
              {EATEN_OPTIONS.map((o) => (
                <button key={o.label} type="button" onClick={() => setEaten(o.fraction)}
                  className={clsx('py-2 rounded-xl border text-xs font-semibold transition-all',
                    eaten === o.fraction
                      ? 'bg-lp-primary text-white border-transparent'
                      : 'border-black/[0.07] dark:border-white/[0.07] text-black/55 dark:text-white/50')}>
                  {o.label}
                </button>
              ))}
            </div>
          </div>

          <div className="px-3 py-2.5 rounded-xl bg-black/[0.03] dark:bg-white/[0.04]">
            {totals ? (
              <>
                <div className="flex items-baseline justify-between">
                  <span className="text-xs text-black/45 dark:text-white/40">Estimated</span>
                  <span className="text-lg font-black text-black/80 dark:text-white/85">{totals.calories} kcal</span>
                </div>
                <div className="text-[11px] text-black/40 dark:text-white/35 mt-0.5">
                  P {totals.proteinG}g · C {totals.carbsG}g · F {totals.fatG}g · ≈{Math.round(grams * eaten)} g eaten
                </div>
              </>
            ) : (
              <div className="text-xs text-black/40 dark:text-white/35">Loading nutrition info…</div>
            )}
          </div>

          <button type="button" onClick={log} disabled={!totals || grams <= 0 || saving}
            className="w-full py-2.5 rounded-xl text-sm font-semibold bg-lp-primary text-white hover:bg-green-500 transition-all disabled:opacity-40">
            {saving ? 'Saving…' : 'Log this food'}
          </button>
        </div>
      )}

      {loggedCount > 0 && !chosen && (
        <div className="flex items-center gap-1.5 text-xs text-lp-primary font-semibold">
          <CheckCircle2 size={12} /> {loggedCount} item{loggedCount > 1 ? 's' : ''} logged from this photo
        </div>
      )}

      {!chosen && status !== 'analyzing' && (
        <div className="flex gap-2">
          <button type="button" onClick={onSearchInstead}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold bg-black/[0.05] dark:bg-white/[0.06] text-black/60 dark:text-white/55">
            <Search size={12} /> {status === 'results' ? 'Not listed? Search' : 'Search instead'}
          </button>
          <button type="button" onClick={openCamera}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold bg-black/[0.05] dark:bg-white/[0.06] text-black/60 dark:text-white/55">
            <ImagePlus size={12} /> New photo
          </button>
        </div>
      )}
    </div>
  )
})

export default FoodScanner
