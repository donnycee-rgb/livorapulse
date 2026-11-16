import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search, Plus, Trash2, Droplets, UtensilsCrossed,
  Target, TrendingUp, X, Flame, Coffee, Sun,
  Moon, Apple, CheckCircle2, AlertCircle, Info,
  Pencil, Camera,
} from 'lucide-react'
import toast from 'react-hot-toast'
import clsx from 'clsx'
import { scheduleScoreSync, useAppStore } from '../store/useAppStore'
import { selectProgressiveGoals } from '../store/selectors'
import { apiGet, apiDel } from '../api/client'
import { pendingFor, removeFromOutbox, saveLog, subscribeOutbox } from '../offline/outbox'
import { useAuthStore } from '../store/useAuthStore'
import FoodScanner, { type FoodScannerHandle } from '../components/FoodScanner'
import { perServing } from '../ml/portion'
import YourPlate from '../components/visuals/YourPlate'
import RingGauge from '../components/ui/RingGauge'
import PageTabs from '../components/ui/PageTabs'
import { ActionButton, MiniStat, PageHeader } from '../components/ui/PageHeader'
import { HABIT } from '../theme/habits'
import { Beef, Droplet, GlassWater, Wheat } from 'lucide-react'
import { plateSentence, plateSlices } from '../lib/visualStories'
import { dismissInterrupted, interruptedThisLoad } from '../ml/scanRecovery'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface FoodEntry {
  id: string
  mealType: string
  foodName: string
  calories: number
  proteinG: number
  carbsG: number
  fatG: number
  quantity: number
  unit: string
  timestamp: string
}

interface FoodSearchResult {
  name: string
  calories: number
  proteinG: number
  carbsG: number
  fatG: number
  servingSize: string
  servingGrams?: number
  community?: string
  source?: 'local' | 'global'
}

interface DailyTotals {
  calories: number
  proteinG: number
  carbsG: number
  fatG: number
}

// ---------------------------------------------------------------------------
// Meal type config — icons only, no emojis
// ---------------------------------------------------------------------------
const MEAL_TYPES = [
  { value: 'breakfast', label: 'Breakfast', Icon: Coffee, color: '#FFA500' },
  { value: 'lunch',     label: 'Lunch',     Icon: Sun,    color: '#4CAF50' },
  { value: 'dinner',    label: 'Dinner',    Icon: Moon,   color: '#6366F1' },
  { value: 'snack',     label: 'Snack',     Icon: Apple,  color: '#00BCD4' },
]

// ---------------------------------------------------------------------------
// Food search via backend proxy
// ---------------------------------------------------------------------------
async function searchFoods(query: string): Promise<FoodSearchResult[]> {
  if (!query.trim()) return []
  try {
    const res = await apiGet<{ success: boolean; data: FoodSearchResult[] }>(
      `/api/nutrition/search?q=${encodeURIComponent(query)}`
    )
    // Search values are per 100 g; everything below works per serving.
    return (res.data ?? []).map(perServing)
  } catch { return [] }
}

// ---------------------------------------------------------------------------
// Water tracker
// ---------------------------------------------------------------------------
const TABS = [
  { key: 'overview', label: 'Overview' },
  { key: 'meals', label: 'Meals' },
  { key: 'water', label: 'Water' },
] as const
type NutritionTab = (typeof TABS)[number]['key']

function WaterTracker({ glasses, goal, onAdd }: {
  glasses: number; goal: number; onAdd: () => void
}) {
  const pct = Math.min(Math.round((glasses / goal) * 100), 100)
  return (
    <div className="rounded-3xl p-4 lp-card">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-2xl bg-blue-500/15 flex items-center justify-center">
            <Droplets size={14} className="text-blue-500" />
          </div>
          <span className="text-sm font-semibold text-black/70 dark:text-white/70">Water</span>
        </div>
        <button type="button" onClick={onAdd}
          className="flex items-center gap-1 px-2.5 py-1 max-sm:px-3.5 max-sm:py-2 rounded-lg bg-blue-500/10 text-blue-500 text-xs font-semibold hover:bg-blue-500/20 transition-all">
          <Plus size={11} /> +1 glass
        </button>
      </div>
      <div className="flex items-baseline gap-1.5 mb-2">
        <span className="text-2xl font-black text-black/85 dark:text-white/90">{glasses}</span>
        <span className="text-xs text-black/35 dark:text-white/30">/ {goal} glasses</span>
      </div>
      <div className="flex gap-1 mb-2">
        {Array.from({ length: goal }).map((_, i) => (
          <div key={i} className={clsx(
            'flex-1 h-4 rounded-sm transition-all duration-300',
            i < glasses ? 'bg-blue-500' : 'bg-black/[0.06] dark:bg-white/[0.06]'
          )} />
        ))}
      </div>
      <div className="text-xs text-black/40 dark:text-white/35">
        {glasses >= goal
          ? <span className="flex items-center gap-1 text-blue-500 font-semibold"><CheckCircle2 size={11} /> Daily goal reached!</span>
          : `${goal - glasses} more glass${goal - glasses === 1 ? '' : 'es'} to go`}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Macros donut (SVG)
// ---------------------------------------------------------------------------
function MacrosCard({ protein, carbs, fat }: { protein: number; carbs: number; fat: number }) {
  const total = protein + carbs + fat
  if (total === 0) return null

  const pPct = Math.round((protein / total) * 100)
  const cPct = Math.round((carbs / total) * 100)
  const fPct = 100 - pPct - cPct

  const macros = [
    { label: 'Protein', value: Math.round(protein), color: '#4CAF50', pct: pPct },
    { label: 'Carbs',   value: Math.round(carbs),   color: '#FFA500', pct: cPct },
    { label: 'Fat',     value: Math.round(fat),      color: '#FF6B6B', pct: fPct },
  ]

  const r = 36; const cx = 44; const cy = 44; const circ = 2 * Math.PI * r
  let offset = 0
  const segments = macros.map(m => {
    const dash = (m.pct / 100) * circ
    const seg = { dash, offset, color: m.color }
    offset += dash
    return seg
  })

  return (
    <div className="rounded-3xl p-4 lp-card">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-9 h-9 rounded-2xl bg-lp-primary/15 flex items-center justify-center">
          <TrendingUp size={14} className="text-lp-primary" />
        </div>
        <span className="text-sm font-semibold text-black/70 dark:text-white/70">Macros today</span>
      </div>
      <div className="flex items-center gap-4">
        <svg width="88" height="88" viewBox="0 0 88 88">
          <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(0,0,0,0.06)" strokeWidth="10" />
          {segments.map((s, i) => (
            <circle key={i} cx={cx} cy={cy} r={r} fill="none"
              stroke={s.color} strokeWidth="10"
              strokeDasharray={`${s.dash} ${circ - s.dash}`}
              strokeDashoffset={circ / 4 - s.offset}
              strokeLinecap="round" />
          ))}
          <text x={cx} y={cy - 4} textAnchor="middle" fill="rgba(0,0,0,0.4)" fontSize="9">total</text>
          <text x={cx} y={cy + 8} textAnchor="middle" fill="rgba(0,0,0,0.75)" fontSize="11" fontWeight="bold">{Math.round(total)}g</text>
        </svg>
        <div className="flex-1 space-y-2">
          {macros.map(m => (
            <div key={m.label}>
              <div className="flex justify-between text-xs mb-0.5">
                <span className="text-black/45 dark:text-white/40">{m.label}</span>
                <span className="font-semibold" style={{ color: m.color }}>{m.value}g</span>
              </div>
              <div className="h-1 rounded-full bg-black/[0.06] dark:bg-white/[0.06] overflow-hidden">
                <motion.div className="h-full rounded-full" style={{ backgroundColor: m.color }}
                  initial={{ width: 0 }} animate={{ width: `${m.pct}%` }}
                  transition={{ duration: 0.6, ease: 'easeOut' }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Add food modal — no emojis
// ---------------------------------------------------------------------------
function AddFoodModal({ open, onClose, onSave, scanInterrupted = false }: {
  open: boolean
  onClose: () => void
  /** Reopened after the phone closed the page during a photo */
  scanInterrupted?: boolean
  onSave: (entry: Omit<FoodEntry, 'id' | 'timestamp'>) => Promise<void>
}) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<FoodSearchResult[]>([])
  const [searched, setSearched] = useState(false)
  const [searching, setSearching] = useState(false)
  const [selected, setSelected] = useState<FoodSearchResult | null>(null)
  const [mealType, setMealType] = useState('breakfast')
  const [quantity, setQuantity] = useState('1')
  const [saving, setSaving] = useState(false)
  const [mode, setMode] = useState<'scan' | 'search' | 'manual'>('scan')
  const manualMode = mode === 'manual'
  const [manualName, setManualName] = useState('')
  const [manualCal, setManualCal] = useState('')
  const [manualProtein, setManualProtein] = useState('')
  const [manualCarbs, setManualCarbs] = useState('')
  const [manualFat, setManualFat] = useState('')
  const scannerRef = useRef<FoodScannerHandle>(null)
  const [scanPending, setScanPending] = useState(false)
  const [finishing, setFinishing] = useState(false)

  // Done in Scan mode: log a food the user picked but didn't tap "Log this food" for.
  const handleScanDone = async () => {
    setFinishing(true)
    const saved = (await scannerRef.current?.savePending()) ?? true
    setFinishing(false)
    if (saved) onClose()
  }

  const handleSearch = useCallback(async () => {
    if (query.trim().length < 2) return
    setSearching(true)
    setSearched(false)
    setSelected(null)
    const res = await searchFoods(query)
    setResults(res)
    setSearched(true)
    setSearching(false)
  }, [query])

  const handleSave = async () => {
    if (!selected && !manualMode) { toast.error('Select a food first'); return }
    setSaving(true)
    try {
      const q = Math.max(0.1, Number(quantity) || 1)
      const entry = manualMode ? {
        mealType,
        foodName: manualName.trim() || 'Custom food',
        calories: (Number(manualCal) || 0) * q,
        proteinG: (Number(manualProtein) || 0) * q,
        carbsG: (Number(manualCarbs) || 0) * q,
        fatG: (Number(manualFat) || 0) * q,
        quantity: q,
        unit: 'serving',
      } : {
        mealType,
        foodName: selected!.name,
        calories: selected!.calories * q,
        proteinG: selected!.proteinG * q,
        carbsG: selected!.carbsG * q,
        fatG: selected!.fatG * q,
        quantity: q,
        unit: selected!.servingSize,
      }
      await onSave(entry)
      onClose()
      setQuery(''); setResults([]); setSelected(null); setSearched(false)
      setManualName(''); setManualCal(''); setManualProtein('')
      setManualCarbs(''); setManualFat(''); setQuantity('1')
    } catch { toast.error('Failed to save. Try again.') }
    finally { setSaving(false) }
  }

  if (!open) return null

  return (
    <motion.div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        className="relative bg-white dark:bg-slate-900 rounded-2xl border border-black/[0.08] dark:border-white/[0.08] shadow-2xl w-full max-w-md max-h-[85vh] overflow-y-auto"
        initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 20 }} transition={{ duration: 0.2 }}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-black/[0.06] dark:border-white/[0.06]">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-2xl bg-lp-primary/15 flex items-center justify-center">
              <UtensilsCrossed size={14} className="text-lp-primary" />
            </div>
            <h3 className="text-base font-bold text-black/85 dark:text-white/90">Log Food</h3>
          </div>
          <button type="button" onClick={onClose}
            className="w-9 h-9 rounded-2xl flex items-center justify-center text-black/30 dark:text-white/30 hover:text-black/60 transition-colors">
            <X size={14} />
          </button>
        </div>

        <div className="p-5 space-y-4">

          {/* Meal type */}
          <div>
            <div className="text-xs font-semibold text-black/45 dark:text-white/40 uppercase tracking-widest mb-2">Meal type</div>
            <div className="grid grid-cols-4 gap-1.5">
              {MEAL_TYPES.map(m => (
                <button key={m.value} type="button" onClick={() => setMealType(m.value)}
                  className={clsx(
                    'flex flex-col items-center gap-1.5 py-2.5 rounded-xl border text-xs font-semibold transition-all',
                    mealType === m.value
                      ? 'border-transparent text-white'
                      : 'border-black/[0.07] dark:border-white/[0.07] text-black/50 dark:text-white/45 hover:border-black/[0.15]'
                  )}
                  style={mealType === m.value ? { backgroundColor: m.color } : undefined}>
                  <m.Icon size={15} style={mealType !== m.value ? { color: m.color } : undefined} />
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* Mode toggle */}
          <div className="flex gap-1.5 p-1 bg-black/[0.04] dark:bg-white/[0.05] rounded-xl">
            <button type="button" onClick={() => setMode('scan')}
              className={clsx('flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all',
                mode === 'scan' ? 'bg-white dark:bg-slate-800 text-black/80 dark:text-white/80 shadow-sm' : 'text-black/40 dark:text-white/35')}>
              <Camera size={12} /> Scan
            </button>
            <button type="button" onClick={() => setMode('search')}
              className={clsx('flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all',
                mode === 'search' ? 'bg-white dark:bg-slate-800 text-black/80 dark:text-white/80 shadow-sm' : 'text-black/40 dark:text-white/35')}>
              <Search size={12} /> Search
            </button>
            <button type="button" onClick={() => setMode('manual')}
              className={clsx('flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all',
                manualMode ? 'bg-white dark:bg-slate-800 text-black/80 dark:text-white/80 shadow-sm' : 'text-black/40 dark:text-white/35')}>
              <Pencil size={12} /> Manual
            </button>
          </div>

          {mode === 'scan' ? (
            <FoodScanner ref={scannerRef} mealType={mealType} onSave={onSave} interrupted={scanInterrupted}
              onSearchInstead={() => setMode('search')} onPendingChange={setScanPending} />
          ) : !manualMode ? (
            <>
              {/* Search row */}
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-black/30 dark:text-white/30" />
                  <input value={query} onChange={e => setQuery(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSearch()}
                    placeholder="e.g. banana, chicken breast..."
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-black/[0.08] dark:border-white/[0.08] bg-black/[0.03] dark:bg-white/[0.04] text-black/80 dark:text-white/80 text-sm focus:outline-none focus:border-lp-primary/40 focus:ring-1 focus:ring-lp-primary/30" />
                </div>
                <button type="button" onClick={handleSearch}
                  disabled={searching || query.trim().length < 2}
                  className="px-4 py-2.5 rounded-xl bg-lp-primary text-white text-sm font-semibold hover:bg-green-500 transition-all disabled:opacity-40 flex items-center gap-1.5 flex-shrink-0">
                  {searching
                    ? <div className="w-4 h-4 rounded-full border-2 border-t-white border-white/30 animate-spin" />
                    : <Search size={13} />}
                  {searching ? 'Searching' : 'Search'}
                </button>
              </div>

              {/* Searching state */}
              {searching && (
                <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-lp-primary/[0.06] border border-lp-primary/20">
                  <div className="w-4 h-4 rounded-full border-2 border-t-lp-primary border-lp-primary/20 animate-spin flex-shrink-0" />
                  <span className="text-xs text-lp-primary font-medium">Searching food database…</span>
                </div>
              )}

              {/* Results */}
              {!searching && results.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-[11px] text-black/35 dark:text-white/30">{results.length} results — tap to select</p>
                  <div className="max-h-48 overflow-y-auto space-y-1.5">
                    {results.map((r, i) => (
                      <button key={i} type="button" onClick={() => setSelected(r)}
                        className={clsx('w-full text-left px-3 py-2.5 rounded-xl border transition-all',
                          selected?.name === r.name
                            ? 'bg-lp-primary/10 border-lp-primary/40'
                            : 'border-black/[0.06] dark:border-white/[0.06] hover:bg-black/[0.04] dark:hover:bg-white/[0.04]'
                        )}>
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <span className="text-sm font-medium text-black/75 dark:text-white/75 leading-tight">{r.name}</span>
                            {r.community && (
                              <span className="ml-1.5 text-[10px] px-1.5 py-0.5 rounded-md bg-lp-primary/10 text-lp-primary/70 font-medium">{r.community}</span>
                            )}
                          </div>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            {r.source === 'local' && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-lp-primary/10 text-lp-primary font-bold">KE</span>
                            )}
                            {selected?.name === r.name && (
                              <CheckCircle2 size={14} className="text-lp-primary" />
                            )}
                          </div>
                        </div>
                        <div className="text-xs text-black/40 dark:text-white/35 mt-0.5">
                          {r.calories} kcal · P {r.proteinG}g · C {r.carbsG}g · F {r.fatG}g
                          <span className="ml-1 text-black/25 dark:text-white/20">/ {r.servingSize}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* No results */}
              {!searching && searched && results.length === 0 && (
                <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-black/[0.03] dark:bg-white/[0.03] border border-black/[0.06] dark:border-white/[0.06]">
                  <AlertCircle size={14} className="text-black/35 dark:text-white/30 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-black/50 dark:text-white/45">No results for "{query}"</p>
                    <p className="text-[11px] text-black/35 dark:text-white/30">Try different keywords or use Manual entry</p>
                  </div>
                </div>
              )}

              {/* Initial hint */}
              {!searching && !searched && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-black/[0.02] dark:bg-white/[0.02]">
                  <Info size={13} className="text-black/30 dark:text-white/25 flex-shrink-0" />
                  <p className="text-xs text-black/35 dark:text-white/30">Type a food name and tap Search</p>
                </div>
              )}
            </>
          ) : (
            /* Manual entry */
            <div className="space-y-3">
              <input value={manualName} onChange={e => setManualName(e.target.value)}
                placeholder="Food name"
                className="w-full px-4 py-2.5 rounded-xl border border-black/[0.08] dark:border-white/[0.08] bg-black/[0.03] dark:bg-white/[0.04] text-black/80 dark:text-white/80 text-sm focus:outline-none focus:border-lp-primary/40" />
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: 'Calories (kcal)', value: manualCal, set: setManualCal },
                  { label: 'Protein (g)',     value: manualProtein, set: setManualProtein },
                  { label: 'Carbs (g)',       value: manualCarbs, set: setManualCarbs },
                  { label: 'Fat (g)',         value: manualFat, set: setManualFat },
                ].map(f => (
                  <label key={f.label} className="block">
                    <div className="text-[10px] font-semibold text-black/40 dark:text-white/35 uppercase tracking-wider mb-1">{f.label}</div>
                    <input type="number" value={f.value} onChange={e => f.set(e.target.value)}
                      placeholder="0" inputMode="decimal"
                      className="w-full px-3 py-2 rounded-xl border border-black/[0.08] dark:border-white/[0.08] bg-black/[0.03] dark:bg-white/[0.04] text-black/80 dark:text-white/80 text-sm focus:outline-none focus:border-lp-primary/40" />
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Quantity */}
          {mode !== 'scan' && (selected || manualMode) && (
            <div>
              <div className="text-xs font-semibold text-black/45 dark:text-white/40 uppercase tracking-widest mb-1.5">
                Quantity {selected ? `(× ${selected.servingSize})` : '(× serving)'}
              </div>
              <input type="number" value={quantity} onChange={e => setQuantity(e.target.value)}
                placeholder="1" inputMode="decimal" min="0.1" step="0.5"
                className="w-full px-4 py-2.5 rounded-xl border border-black/[0.08] dark:border-white/[0.08] bg-black/[0.03] dark:bg-white/[0.04] text-black/80 dark:text-white/80 text-sm focus:outline-none focus:border-lp-primary/40" />
              {selected && (
                <p className="text-xs text-black/35 dark:text-white/30 mt-1">
                  Total: {Math.round(selected.calories * (Number(quantity) || 1))} kcal
                </p>
              )}
            </div>
          )}

          {/* Actions */}
          {mode === 'scan' ? (
            <button type="button" onClick={handleScanDone} disabled={finishing}
              className={clsx('w-full py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-40',
                scanPending
                  ? 'bg-lp-primary text-white hover:bg-green-500'
                  : 'bg-black/[0.05] dark:bg-white/[0.06] text-black/60 dark:text-white/55 hover:bg-black/[0.09]')}>
              {finishing ? 'Saving…' : scanPending ? 'Log & close' : 'Done'}
            </button>
          ) : (
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-black/[0.05] dark:bg-white/[0.06] text-black/60 dark:text-white/55 hover:bg-black/[0.09] transition-all">
              Cancel
            </button>
            <button type="button" onClick={handleSave}
              disabled={saving || (!selected && !manualMode)}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-lp-primary text-white hover:bg-green-500 hover:shadow-lg hover:shadow-lp-primary/25 transition-all disabled:opacity-40">
              {saving ? 'Saving…' : 'Log Food'}
            </button>
          </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}

// ---------------------------------------------------------------------------
// Nutrition page root
// ---------------------------------------------------------------------------
export default function Nutrition() {
  const calorieGoal = useAppStore((s) => selectProgressiveGoals(s).goalCaloriesPerDay)
  const waterGoal = 8

  const [entries, setEntries] = useState<FoodEntry[]>([])
  const [totals, setTotals] = useState<DailyTotals>({ calories: 0, proteinG: 0, carbsG: 0, fatG: 0 })
  const [glasses, setGlasses] = useState(0)
  // If the phone closed the page while the camera was open, reopen the scanner and explain
  const [scanInterrupted] = useState(interruptedThisLoad)
  const [modalOpen, setModalOpen] = useState(scanInterrupted)
  const [loading, setLoading] = useState(true)

  const userId = useAuthStore((s) => s.user?.id)
  // What the server last told us; meals and water still waiting on the phone are added on top
  const [server, setServer] = useState<{ entries: FoodEntry[]; glasses: number }>({ entries: [], glasses: 0 })
  const [, setOutboxTick] = useState(0)
  useEffect(() => subscribeOutbox(() => setOutboxTick((n) => n + 1)), [])

  const fetchData = async () => {
    try {
      const [nutrition, water] = await Promise.all([
        apiGet<{ success: boolean; data: { entries: FoodEntry[]; totals: DailyTotals } }>('/api/nutrition/today'),
        apiGet<{ success: boolean; data: { glasses: number } }>('/api/nutrition/water/today'),
      ])
      setServer({ entries: nutrition.data.entries, glasses: water.data.glasses })
    } catch { /* offline: keep what we had, plus what's waiting on the phone */ }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchData() }, [])
  // When waiting meals upload, show the server's copy
  useEffect(() => subscribeOutbox(() => { if (pendingFor(userId, '/api/nutrition').length === 0) void fetchData() }), [userId])

  // Today's meals and glasses that are saved on the phone but not uploaded yet
  const isToday = (iso: string) => new Date(iso).toDateString() === new Date().toDateString()
  const waitingMeals: FoodEntry[] = pendingFor(userId, '/api/nutrition')
    .filter((i) => isToday(String(i.body.timestamp ?? i.createdAt)))
    .map((i) => ({ ...(i.body as unknown as Omit<FoodEntry, 'id' | 'timestamp'>), id: `waiting-${i.id}`, timestamp: String(i.body.timestamp ?? i.createdAt) }))
  const waitingGlasses = pendingFor(userId, '/api/nutrition/water')
    .filter((i) => isToday(String(i.body.timestamp ?? i.createdAt)))
    .reduce((n, i) => n + (Number(i.body.glasses) || 1), 0)

  useEffect(() => {
    const all = [...server.entries, ...waitingMeals]
    setEntries(all)
    setTotals({
      calories: all.reduce((n, e) => n + e.calories, 0),
      proteinG: all.reduce((n, e) => n + e.proteinG, 0),
      carbsG: all.reduce((n, e) => n + e.carbsG, 0),
      fatG: all.reduce((n, e) => n + e.fatG, 0),
    })
    setGlasses(server.glasses + waitingGlasses)
  }, [server, waitingMeals.length, waitingGlasses]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleSaveFood = async (entry: Omit<FoodEntry, 'id' | 'timestamp'>) => {
    const result = await saveLog('/api/nutrition', { ...entry, timestamp: new Date().toISOString() })
    if (result === 'queued') return // shown from the phone until it uploads
    scheduleScoreSync()
    toast.success('Food logged!')
    await fetchData()
  }

  const handleDelete = async (id: string) => {
    if (id.startsWith('waiting-')) { // never uploaded: just take it off the phone
      removeFromOutbox(id.slice('waiting-'.length))
      toast.success('Entry removed')
      return
    }
    try {
      await apiDel(`/api/nutrition/${id}`)
      scheduleScoreSync()
      toast.success('Entry removed')
      await fetchData()
    } catch { toast.error('Failed to delete') }
  }

  const handleAddWater = async () => {
    try {
      const result = await saveLog('/api/nutrition/water', { glasses: 1, timestamp: new Date().toISOString() })
      if (result === 'queued') return // counted from the phone until it uploads
      scheduleScoreSync() // water counts toward the streak
      setServer((v) => ({ ...v, glasses: v.glasses + 1 }))
      toast.success('Water logged!')
    } catch { toast.error('Failed to log water') }
  }

  const [tab, setTab] = useState<NutritionTab>('overview')
  const calPct = Math.min(Math.round((totals.calories / calorieGoal) * 100), 100)
  const plate = plateSlices(totals)
  const calColor = calPct > 110 ? '#FF6B6B' : calPct >= 80 ? HABIT.steps.hex : HABIT.meals.hex

  const groupedEntries = MEAL_TYPES.map(m => ({
    ...m,
    entries: entries.filter(e => e.mealType === m.value),
  })).filter(m => m.entries.length > 0)

  return (
    <div className="space-y-5">

      {/* Header */}
      <PageHeader icon={UtensilsCrossed} tint={HABIT.meals.rgb} title="Nutrition"
        subtitle={totals.calories === 0
          ? 'Log your meals to track today'
          : `${Math.round(totals.calories)} kcal so far · ${calPct >= 100 ? 'goal reached' : `${calorieGoal - Math.round(totals.calories)} kcal to go`}`} />

      {/* Hero: today's calories as a ring, macros and water beside it */}
      <section className="lp-card rounded-3xl p-5 relative overflow-hidden" aria-label="Today's food">
        <div className="pointer-events-none absolute -top-16 -left-16 w-48 h-48 rounded-full blur-3xl" style={{ background: `rgb(${HABIT.meals.rgb} / 0.12)` }} />
        {/* Phones: stacked. Wide screens: the ring and number on the left,
            the stats and buttons on the right, so the row is filled. */}
        <div className="relative grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)] lg:items-center lg:gap-8">
          <div className="relative flex items-center gap-5">
            <RingGauge value={totals.calories / calorieGoal} color={calColor} size={124} stroke={11}
              label={`${Math.round(totals.calories)} of ${calorieGoal} kcal`}>
              <span className="text-[26px] font-extrabold leading-none text-ui-ink tabular-nums">{Math.round(totals.calories)}</span>
              <span className="text-[11px] text-ui-muted mt-1">of {calorieGoal.toLocaleString()} kcal</span>
            </RingGauge>
            <div className="min-w-0 flex flex-col [&>*]:flex-1">
              <div className="text-[12px] font-semibold text-ui-muted">Calories today</div>
              <div className="text-[28px] font-extrabold text-ui-ink leading-tight tabular-nums">{calPct}%</div>
              <div className="text-[12px] font-semibold" style={{ color: calColor }}>
                {totals.calories === 0 ? 'Nothing logged yet' : calPct > 110 ? 'Over your goal' : calPct >= 80 ? 'On track' : `${Math.max(0, calorieGoal - Math.round(totals.calories))} kcal left`}
              </div>
            </div>
          </div>
          <div className="space-y-3">
            <div className="relative grid grid-cols-4 gap-2">
              <MiniStat icon={Beef} tint="236 72 153" value={`${Math.round(totals.proteinG)}g`} label="Protein" />
              <MiniStat icon={Wheat} tint={HABIT.meals.rgb} value={`${Math.round(totals.carbsG)}g`} label="Carbs" />
              <MiniStat icon={Droplet} tint="234 179 8" value={`${Math.round(totals.fatG)}g`} label="Fat" />
              <MiniStat icon={GlassWater} tint={HABIT.water.rgb} value={`${glasses}/${waterGoal}`} label="Water" />
            </div>
            <div className="relative grid grid-cols-2 sm:flex gap-2">
              <ActionButton icon={Plus} primary onClick={() => setModalOpen(true)}>Log food</ActionButton>
              <ActionButton icon={GlassWater} onClick={handleAddWater}>+1 glass</ActionButton>
            </div>
          </div>
        </div>
      </section>

      <PageTabs label="Nutrition sections" value={tab} onChange={setTab} tabs={TABS} />

      {tab === 'overview' && (
        <div className="grid lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] gap-4">
          {/* Your plate: today's food as slices of a plate, with what's missing */}
          {plate ? (
            <div className="rounded-3xl p-5 lp-card min-w-0">
              <div className="text-[12px] font-semibold text-ui-muted mb-1">Your plate today</div>
              <p className="text-[17px] font-bold text-ui-ink leading-snug mb-4">{plateSentence(plate)}</p>
              <YourPlate slices={plate} />
            </div>
          ) : (
            <div className="lp-card rounded-3xl p-6 flex flex-col items-center justify-center text-center min-w-0">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3" style={{ background: `rgb(${HABIT.meals.rgb} / 0.14)`, color: HABIT.meals.hex }}>
                <UtensilsCrossed size={22} />
              </div>
              <p className="text-sm font-bold text-ui-ink">Your plate fills in as you log meals</p>
              <p className="text-xs text-ui-muted mt-1">See how today's food compares with a balanced plate</p>
            </div>
          )}

          {/* Today's meals at a glance; the full list is on the Meals tab */}
          <div className="rounded-3xl p-5 lp-card min-w-0 flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <div className="text-[15px] font-bold text-ui-ink">Today's meals</div>
              {entries.length > 0 && <span className="text-[12px] font-semibold text-ui-muted rounded-full bg-ui-raised px-2.5 py-1">{entries.length}</span>}
            </div>
            {entries.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center py-6">
                <p className="text-sm font-semibold text-ui-ink">Nothing logged yet</p>
                <p className="text-xs text-ui-muted mt-1 mb-4">Search a food or scan your plate</p>
                <button type="button" onClick={() => setModalOpen(true)}
                  className="h-10 px-4 rounded-2xl text-sm font-bold bg-lp-btn text-lp-btn-ink active:scale-[0.98] transition">
                  Log your first meal
                </button>
              </div>
            ) : (
              <>
                <ul className="space-y-2">
                  {[...entries].reverse().slice(0, 5).map((e) => {
                    const meal = MEAL_TYPES.find((m) => m.value === e.mealType)
                    return (
                      <li key={e.id} className="flex items-center gap-3 rounded-2xl bg-ui-raised px-3 py-2.5">
                        {meal && (
                          <span className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: meal.color + '22' }}>
                            <meal.Icon size={14} style={{ color: meal.color }} />
                          </span>
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-semibold text-ui-ink truncate">{e.foodName}</div>
                          <div className="text-[11px] text-ui-muted">{meal?.label ?? e.mealType}{e.id.startsWith('waiting-') ? ' · waiting to upload' : ''}</div>
                        </div>
                        <span className="text-sm font-bold text-ui-ink tabular-nums flex-shrink-0">{Math.round(e.calories)} kcal</span>
                      </li>
                    )
                  })}
                </ul>
                <button type="button" onClick={() => setTab('meals')}
                  className="mt-auto pt-3 text-sm font-semibold text-lp-primary hover:underline self-start">
                  {entries.length > 5 ? `See all ${entries.length} meals` : 'See all meals'}
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {tab === 'meals' && (
        <div className="space-y-4">
          {/* Meals */}
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="w-6 h-6 rounded-full border-2 border-t-lp-primary border-black/10 animate-spin" />
            </div>
          ) : groupedEntries.length === 0 ? (
            <div className="lp-card rounded-3xl border-dashed p-10 text-center">
              <div className="w-14 h-14 rounded-2xl bg-lp-primary/10 flex items-center justify-center mx-auto mb-3">
                <UtensilsCrossed size={24} className="text-lp-primary/60" />
              </div>
              <p className="text-sm font-semibold text-black/50 dark:text-white/45">No meals logged yet</p>
              <p className="text-xs text-black/30 dark:text-white/25 mt-1 mb-4">Tap Log Food to add your first meal</p>
              <button type="button" onClick={() => setModalOpen(true)}
                className="px-4 h-10 bg-lp-btn text-lp-btn-ink text-sm font-bold rounded-2xl active:scale-[0.98] transition">
                Log your first meal
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {groupedEntries.map(meal => (
                <div key={meal.value} className="rounded-3xl p-4 lp-card">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-9 h-9 rounded-2xl flex items-center justify-center" style={{ backgroundColor: meal.color + '18' }}>
                      <meal.Icon size={14} style={{ color: meal.color }} />
                    </div>
                    <div className="text-sm font-semibold text-black/75 dark:text-white/75">{meal.label}</div>
                    <div className="ml-auto text-xs font-semibold" style={{ color: meal.color }}>
                      {Math.round(meal.entries.reduce((s, e) => s + e.calories, 0))} kcal
                    </div>
                  </div>
                  <div className="space-y-2">
                    {meal.entries.map(entry => (
                      <motion.div key={entry.id}
                        initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-2xl bg-ui-raised transition-colors group">
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-black/75 dark:text-white/70 truncate">{entry.foodName}</div>
                          <div className="text-xs text-black/35 dark:text-white/30 mt-0.5">
                            {entry.quantity} × {entry.unit}
                            {entry.proteinG > 0 && ` · P: ${Math.round(entry.proteinG)}g`}
                            {entry.carbsG > 0 && ` · C: ${Math.round(entry.carbsG)}g`}
                            {entry.fatG > 0 && ` · F: ${Math.round(entry.fatG)}g`}
                            {entry.id.startsWith('waiting-') && ' · waiting to upload'}
                          </div>
                        </div>
                        <div className="text-sm font-bold text-black/65 dark:text-white/60 flex-shrink-0">
                          {Math.round(entry.calories)} kcal
                        </div>
                        <button type="button" onClick={() => handleDelete(entry.id)}
                          aria-label={`Remove ${entry.foodName}`} className="w-8 h-8 rounded-lg flex items-center justify-center text-ui-muted hover:text-lp-alert hover:bg-lp-alert/10 transition-all sm:opacity-0 sm:group-hover:opacity-100">
                          <Trash2 size={12} />
                        </button>
                      </motion.div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'water' && (
        <div className="max-w-md">
          <WaterTracker glasses={glasses} goal={waterGoal} onAdd={handleAddWater} />
        </div>
      )}

      <AnimatePresence>
        {modalOpen && (
          <AddFoodModal open={modalOpen} onClose={() => { dismissInterrupted(); setModalOpen(false) }} onSave={handleSaveFood} scanInterrupted={scanInterrupted} />
        )}
      </AnimatePresence>
    </div>
  )
}