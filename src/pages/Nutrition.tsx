import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search, Plus, Trash2, Droplets, UtensilsCrossed,
  Target, TrendingUp, X, Flame, Coffee, Sun,
  Moon, Apple, CheckCircle2, AlertCircle, Info,
  Pencil,
} from 'lucide-react'
import toast from 'react-hot-toast'
import clsx from 'clsx'
import { useAppStore } from '../store/useAppStore'
import { apiGet, apiPost, apiDel } from '../api/client'

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
    return res.data ?? []
  } catch { return [] }
}

// ---------------------------------------------------------------------------
// Water tracker
// ---------------------------------------------------------------------------
function WaterTracker({ glasses, goal, onAdd }: {
  glasses: number; goal: number; onAdd: () => void
}) {
  const pct = Math.min(Math.round((glasses / goal) * 100), 100)
  return (
    <div className="rounded-3xl p-4" style={{ background: `linear-gradient(135deg, #FF6B6B08 0%, #FF6B6B04 100%)`, border: `1px solid #FF6B6B18` }}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-2xl bg-blue-500/15 flex items-center justify-center">
            <Droplets size={14} className="text-blue-500" />
          </div>
          <span className="text-sm font-semibold text-black/70 dark:text-white/70">Water</span>
        </div>
        <button type="button" onClick={onAdd}
          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-500/10 text-blue-500 text-xs font-semibold hover:bg-blue-500/20 transition-all">
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
    <div className="rounded-3xl p-4" style={{ background: `linear-gradient(135deg, #FF6B6B08 0%, #FF6B6B04 100%)`, border: `1px solid #FF6B6B18` }}>
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
function AddFoodModal({ open, onClose, onSave }: {
  open: boolean
  onClose: () => void
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
  const [manualMode, setManualMode] = useState(false)
  const [manualName, setManualName] = useState('')
  const [manualCal, setManualCal] = useState('')
  const [manualProtein, setManualProtein] = useState('')
  const [manualCarbs, setManualCarbs] = useState('')
  const [manualFat, setManualFat] = useState('')

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
            <button type="button" onClick={() => setManualMode(false)}
              className={clsx('flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all',
                !manualMode ? 'bg-white dark:bg-slate-800 text-black/80 dark:text-white/80 shadow-sm' : 'text-black/40 dark:text-white/35')}>
              <Search size={12} /> Search database
            </button>
            <button type="button" onClick={() => setManualMode(true)}
              className={clsx('flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all',
                manualMode ? 'bg-white dark:bg-slate-800 text-black/80 dark:text-white/80 shadow-sm' : 'text-black/40 dark:text-white/35')}>
              <Pencil size={12} /> Manual entry
            </button>
          </div>

          {!manualMode ? (
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
          {(selected || manualMode) && (
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
        </div>
      </motion.div>
    </motion.div>
  )
}

// ---------------------------------------------------------------------------
// Nutrition page root
// ---------------------------------------------------------------------------
export default function Nutrition() {
  const goals = useAppStore((s) => s.goals)
  const calorieGoal = (goals as any).goalCaloriesPerDay ?? 2000
  const waterGoal = 8

  const [entries, setEntries] = useState<FoodEntry[]>([])
  const [totals, setTotals] = useState<DailyTotals>({ calories: 0, proteinG: 0, carbsG: 0, fatG: 0 })
  const [glasses, setGlasses] = useState(0)
  const [modalOpen, setModalOpen] = useState(false)
  const [loading, setLoading] = useState(true)

  const fetchData = async () => {
    try {
      const [nutrition, water] = await Promise.all([
        apiGet<{ success: boolean; data: { entries: FoodEntry[]; totals: DailyTotals } }>('/api/nutrition/today'),
        apiGet<{ success: boolean; data: { glasses: number } }>('/api/nutrition/water/today'),
      ])
      setEntries(nutrition.data.entries)
      setTotals(nutrition.data.totals)
      setGlasses(water.data.glasses)
    } catch { /* non-fatal */ }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchData() }, [])

  const handleSaveFood = async (entry: Omit<FoodEntry, 'id' | 'timestamp'>) => {
    await apiPost('/api/nutrition', entry)
    toast.success('Food logged!')
    await fetchData()
  }

  const handleDelete = async (id: string) => {
    try {
      await apiDel(`/api/nutrition/${id}`)
      toast.success('Entry removed')
      await fetchData()
    } catch { toast.error('Failed to delete') }
  }

  const handleAddWater = async () => {
    try {
      await apiPost('/api/nutrition/water', { glasses: 1 })
      setGlasses(g => g + 1)
      toast.success('Water logged!')
    } catch { toast.error('Failed to log water') }
  }

  const calPct = Math.min(Math.round((totals.calories / calorieGoal) * 100), 100)
  const calColor = calPct > 110 ? '#FF6B6B' : calPct >= 80 ? '#4CAF50' : '#FFA500'

  const groupedEntries = MEAL_TYPES.map(m => ({
    ...m,
    entries: entries.filter(e => e.mealType === m.value),
  })).filter(m => m.entries.length > 0)

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-black/85 dark:text-white/90">Nutrition</h1>
          <p className="text-sm text-black/45 dark:text-white/40 mt-0.5">
            {totals.calories === 0
              ? 'Log your meals to track daily nutrition'
              : `${Math.round(totals.calories)} kcal logged · ${calPct >= 100 ? 'Goal reached!' : `${calorieGoal - Math.round(totals.calories)} kcal remaining`}`}
          </p>
        </div>
        <button type="button" onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 text-white text-sm font-bold rounded-2xl hover:shadow-lg hover:shadow-lp-primary/25 hover:scale-[1.02] transition-all duration-200 flex-shrink-0" style={{ background: 'linear-gradient(135deg, #4CAF50, #00BCD4)' }}>
          <Plus size={15} /> Log Food
        </button>
      </div>

      <div className="grid lg:grid-cols-[1fr_280px] gap-5">
        <div className="space-y-5 min-w-0">

          {/* Calorie progress */}
          <div className="rounded-3xl p-5" style={{ background: `linear-gradient(135deg, #FF6B6B08 0%, #FF6B6B04 100%)`, border: `1px solid #FF6B6B18` }}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: calColor + '18' }}>
                  <Flame size={16} style={{ color: calColor }} />
                </div>
                <div>
                  <div className="text-sm font-semibold text-black/80 dark:text-white/85">Calories today</div>
                  <div className="text-xs text-black/40 dark:text-white/35">Goal: {calorieGoal.toLocaleString()} kcal</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-black" style={{ color: calColor }}>{Math.round(totals.calories)}</div>
                <div className="text-xs text-black/35 dark:text-white/30">kcal</div>
              </div>
            </div>
            <div className="h-3 rounded-full bg-black/[0.06] dark:bg-white/[0.06] overflow-hidden">
              <motion.div className="h-full rounded-full" style={{ backgroundColor: calColor }}
                initial={{ width: 0 }} animate={{ width: `${calPct}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }} />
            </div>
            <div className="flex justify-between text-xs text-black/35 dark:text-white/30 mt-1.5">
              <span>0</span>
              <span className="font-semibold" style={{ color: calColor }}>{calPct}%</span>
              <span>{calorieGoal.toLocaleString()}</span>
            </div>
          </div>

          {/* Meals */}
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="w-6 h-6 rounded-full border-2 border-t-lp-primary border-black/10 animate-spin" />
            </div>
          ) : groupedEntries.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-black/[0.10] dark:border-white/[0.10] p-10 text-center">
              <div className="w-14 h-14 rounded-2xl bg-lp-primary/10 flex items-center justify-center mx-auto mb-3">
                <UtensilsCrossed size={24} className="text-lp-primary/60" />
              </div>
              <p className="text-sm font-semibold text-black/50 dark:text-white/45">No meals logged yet</p>
              <p className="text-xs text-black/30 dark:text-white/25 mt-1 mb-4">Tap Log Food to add your first meal</p>
              <button type="button" onClick={() => setModalOpen(true)}
                className="px-4 py-2 bg-lp-primary text-white text-xs font-semibold rounded-xl hover:bg-green-500 transition-all">
                Log your first meal
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {groupedEntries.map(meal => (
                <div key={meal.value} className="rounded-3xl p-4" style={{ background: `linear-gradient(135deg, #FF6B6B08 0%, #FF6B6B04 100%)`, border: `1px solid #FF6B6B18` }}>
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
                        className="flex items-center gap-3 px-3 py-2 rounded-2xl transition-colors group" style={{ background: '#FF6B6B06', border: '1px solid #FF6B6B12' }}>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-black/75 dark:text-white/70 truncate">{entry.foodName}</div>
                          <div className="text-xs text-black/35 dark:text-white/30 mt-0.5">
                            {entry.quantity} × {entry.unit}
                            {entry.proteinG > 0 && ` · P: ${Math.round(entry.proteinG)}g`}
                            {entry.carbsG > 0 && ` · C: ${Math.round(entry.carbsG)}g`}
                            {entry.fatG > 0 && ` · F: ${Math.round(entry.fatG)}g`}
                          </div>
                        </div>
                        <div className="text-sm font-bold text-black/65 dark:text-white/60 flex-shrink-0">
                          {Math.round(entry.calories)} kcal
                        </div>
                        <button type="button" onClick={() => handleDelete(entry.id)}
                          className="w-6 h-6 rounded-lg flex items-center justify-center text-black/20 dark:text-white/20 hover:text-lp-alert hover:bg-lp-alert/10 transition-all opacity-0 group-hover:opacity-100">
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

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Score impact */}
          <div className="rounded-3xl p-4" style={{ background: `linear-gradient(135deg, #FF6B6B08 0%, #FF6B6B04 100%)`, border: `1px solid #FF6B6B18` }}>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-9 h-9 rounded-2xl bg-lp-primary/15 flex items-center justify-center">
                <Target size={14} className="text-lp-primary" />
              </div>
              <span className="text-sm font-semibold text-black/70 dark:text-white/70">Score Impact</span>
            </div>
            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-3xl font-black text-black/85 dark:text-white/90">{calPct}</span>
              <span className="text-xs text-black/35 dark:text-white/30">% of calorie goal</span>
            </div>
            <p className="text-xs text-black/50 dark:text-white/45 leading-relaxed">
              {totals.calories === 0
                ? 'Log your meals to see your nutrition score impact.'
                : calPct > 110 ? 'Over your calorie goal — this affects your nutrition score.'
                : calPct >= 80 ? 'On track — hitting your goal keeps your score high.'
                : 'Keep logging — reaching your goal improves your score.'}
            </p>
            <div className="mt-3 h-1.5 rounded-full bg-black/[0.06] dark:bg-white/[0.06] overflow-hidden">
              <motion.div className="h-full rounded-full" style={{ backgroundColor: calColor }}
                initial={{ width: 0 }} animate={{ width: `${Math.min(calPct, 100)}%` }}
                transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 }} />
            </div>
          </div>

          <WaterTracker glasses={glasses} goal={waterGoal} onAdd={handleAddWater} />

          {totals.proteinG + totals.carbsG + totals.fatG > 0 && (
            <MacrosCard protein={totals.proteinG} carbs={totals.carbsG} fat={totals.fatG} />
          )}

          {/* Summary */}
          <div className="rounded-3xl p-4" style={{ background: `linear-gradient(135deg, #FF6B6B08 0%, #FF6B6B04 100%)`, border: `1px solid #FF6B6B18` }}>
            <div className="text-xs font-bold text-black/30 dark:text-white/25 uppercase tracking-widest mb-3">Today</div>
            <div className="space-y-2">
              {[
                { label: 'Meals logged', value: `${entries.length} entries` },
                { label: 'Water',        value: `${glasses} / ${waterGoal} glasses` },
                { label: 'Protein',      value: `${Math.round(totals.proteinG)}g` },
                { label: 'Remaining',    value: `${Math.max(0, calorieGoal - Math.round(totals.calories))} kcal` },
              ].map(s => (
                <div key={s.label} className="flex items-center justify-between">
                  <span className="text-xs text-black/45 dark:text-white/40">{s.label}</span>
                  <span className="text-sm font-bold text-black/75 dark:text-white/70">{s.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {modalOpen && (
          <AddFoodModal open={modalOpen} onClose={() => setModalOpen(false)} onSave={handleSaveFood} />
        )}
      </AnimatePresence>
    </div>
  )
}