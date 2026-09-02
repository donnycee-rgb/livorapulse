import { Plus, Leaf, Target, TrendingUp, Wind, Car, Bike, Footprints, Award, Zap } from 'lucide-react'
import { useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { motion } from 'framer-motion'
import clsx from 'clsx'

import RecyclePlasticBarChart from '../components/charts/RecyclePlasticBarChart'
import TransportModeChart from '../components/charts/TransportModeChart'
import CarbonLineChart from '../components/charts/CarbonLineChart'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Modal from '../components/ui/Modal'

import type { TransportMode } from '../data/types'
import { useAppStore } from '../store/useAppStore'
import { getDayKey } from '../utils/date'

// ---------------------------------------------------------------------------
// Transport mode config
// ---------------------------------------------------------------------------
const TRANSPORT_OPTIONS: Array<{
  mode: TransportMode
  Icon: React.ElementType
  color: string
  co2Label: string
  context: string
}> = [
  {
    mode: 'Walking',
    Icon: Footprints,
    color: '#4CAF50',
    co2Label: '0 kg CO₂',
    context: 'Zero emissions — best for your eco score',
  },
  {
    mode: 'Cycling',
    Icon: Bike,
    color: '#00BCD4',
    co2Label: '~0.02 kg CO₂',
    context: 'Near-zero emissions — great choice',
  },
  {
    mode: 'Driving',
    Icon: Car,
    color: '#FF6B6B',
    co2Label: '~2.4 kg CO₂',
    context: 'Higher emissions — reduces your eco score',
  },
]

// ---------------------------------------------------------------------------
// Stat card
// ---------------------------------------------------------------------------
function StatCard({ label, value, context, icon, color }: {
  label: string; value: string; context: string
  icon: React.ReactNode; color: string
}) {
  return (
    <div className="rounded-3xl p-4" style={{ background: `linear-gradient(135deg, #34A8530A 0%, #34A85305 100%)`, border: `1px solid #34A85320` }}>
      <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3"
        style={{ backgroundColor: color + '18' }}>
        <div style={{ color }}>{icon}</div>
      </div>
      <div className="text-[10px] font-bold text-black/35 dark:text-white/30 uppercase tracking-wider">{label}</div>
      <div className="mt-1 text-xl font-black text-black/85 dark:text-white/90 leading-none">{value}</div>
      <div className="mt-1 text-xs text-black/45 dark:text-white/40 leading-relaxed">{context}</div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Score impact sidebar card
// ---------------------------------------------------------------------------
function ScoreImpactCard({ ecoActions, carbonKg }: {
  ecoActions: number; carbonKg: number
}) {
  const recycleScore = Math.min(Math.round((ecoActions / 4) * 100), 100)
  const carbonScore = Math.max(0, Math.round(110 - (carbonKg / 8) * 100))
  const ecoScore = Math.round(0.55 * recycleScore + 0.45 * carbonScore)
  const actionsNeeded = Math.max(0, 4 - ecoActions)

  return (
    <div className="rounded-3xl p-4" style={{ background: `linear-gradient(135deg, #34A8530A 0%, #34A85305 100%)`, border: `1px solid #34A85320` }}>
      <div className="flex items-center gap-2 mb-3">
        <div className="w-9 h-9 rounded-xl bg-lp-primary/15 flex items-center justify-center">
          <Target size={14} className="text-lp-primary" />
        </div>
        <span className="text-sm font-semibold text-black/70 dark:text-white/70">Score Impact</span>
      </div>
      <div className="flex items-baseline gap-2 mb-1">
        <span className="text-3xl font-black text-black/85 dark:text-white/90">{ecoScore}</span>
        <span className="text-xs text-black/35 dark:text-white/30">/ 100 eco score</span>
      </div>
      {ecoScore >= 90 ? (
        <p className="text-xs text-lp-primary font-semibold mt-2">Excellent eco habits today!</p>
      ) : actionsNeeded > 0 ? (
        <p className="text-xs text-black/50 dark:text-white/45 leading-relaxed mt-2">
          Log <span className="font-bold text-lp-primary">{actionsNeeded} more eco {actionsNeeded === 1 ? 'action' : 'actions'}</span> today to reach your daily eco goal.
        </p>
      ) : (
        <p className="text-xs text-black/50 dark:text-white/45 leading-relaxed mt-2">
          Daily eco goal reached. Keep reducing your carbon footprint.
        </p>
      )}
      <div className="mt-3 pt-3 border-t border-black/[0.05] dark:border-white/[0.05]">
        <div className="space-y-2">
          {[
            { label: 'Eco actions', value: recycleScore, color: '#4CAF50' },
            { label: 'Carbon footprint', value: carbonScore, color: '#00BCD4' },
          ].map((d) => (
            <div key={d.label}>
              <div className="flex justify-between text-[10px] mb-1">
                <span className="text-black/30 dark:text-white/25">{d.label}</span>
                <span className="font-semibold" style={{ color: d.color }}>{d.value}</span>
              </div>
              <div className="h-1 rounded-full bg-black/[0.06] dark:bg-white/[0.06] overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  style={{ backgroundColor: d.color }}
                  initial={{ width: 0 }}
                  animate={{ width: `${d.value}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Weekly summary sidebar card
// ---------------------------------------------------------------------------
function WeeklySummaryCard({ carbonByDay, recycledByDay }: {
  carbonByDay: Array<{ day: string; kg: number }>
  recycledByDay: Array<{ day: string; items: number }>
}) {
  const totalCarbon = carbonByDay.reduce((s, x) => s + x.kg, 0)
  const totalRecycled = recycledByDay.reduce((s, x) => s + x.items, 0)
  const activeDays = recycledByDay.filter(x => x.items > 0).length

  return (
    <div className="rounded-3xl p-4" style={{ background: `linear-gradient(135deg, #34A8530A 0%, #34A85305 100%)`, border: `1px solid #34A85320` }}>
      <div className="flex items-center gap-2 mb-3">
        <div className="w-9 h-9 rounded-xl bg-lp-accent/15 flex items-center justify-center">
          <TrendingUp size={14} className="text-lp-accent" />
        </div>
        <span className="text-sm font-semibold text-black/70 dark:text-white/70">This Week</span>
      </div>
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-xs text-black/45 dark:text-white/40">Carbon saved</span>
          <span className="text-sm font-bold text-lp-primary">{totalCarbon.toFixed(1)} kg CO₂</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-black/45 dark:text-white/40">Items recycled</span>
          <span className="text-sm font-bold text-black/80 dark:text-white/80">{totalRecycled}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-black/45 dark:text-white/40">Eco-active days</span>
          <span className="text-sm font-bold text-black/80 dark:text-white/80">{activeDays} / 7</span>
        </div>
      </div>
      <div className="mt-3 pt-3 border-t border-black/[0.05] dark:border-white/[0.05]">
        <div className="flex items-end gap-1 h-10">
          {recycledByDay.map((x) => {
            const h = Math.max(3, Math.round((x.items / 5) * 40))
            return (
              <div key={x.day} className="flex-1 flex flex-col items-center gap-0.5">
                <div
                  className="w-full rounded-sm"
                  style={{
                    height: h,
                    backgroundColor: x.items > 0 ? '#4CAF50' : '#0000000A',
                  }}
                />
                <span className="text-[8px] text-black/25 dark:text-white/20">{x.day.slice(0, 1)}</span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Eco tip sidebar card
// ---------------------------------------------------------------------------
function EcoTipCard({ transportMode, ecoActions }: {
  transportMode: TransportMode; ecoActions: number
}) {
  const tips = [
    {
      condition: transportMode === 'Driving',
      text: 'You drove today. Consider walking or cycling tomorrow — even one car-free day per week reduces your annual carbon footprint by over 100 kg.',
    },
    {
      condition: ecoActions === 0,
      text: 'Log your first eco action today — something as simple as recycling a bottle counts and contributes to your eco score.',
    },
    {
      condition: ecoActions >= 1 && ecoActions < 4,
      text: `${4 - ecoActions} more eco actions today to hit your daily goal. Small actions — recycling, avoiding plastic, choosing low-impact transport — all add up.`,
    },
    {
      condition: ecoActions >= 4,
      text: 'Daily eco goal reached. Consistent eco habits across a week can offset up to 5 kg of CO₂ — equivalent to a 20 km drive.',
    },
  ]
  const tip = tips.find(t => t.condition) ?? tips[1]

  return (
    <div className="bg-lp-primary/[0.06] border border-lp-primary/20 rounded-2xl p-4">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-6 h-6 rounded-lg bg-lp-primary/20 flex items-center justify-center">
          <Zap size={12} className="text-lp-primary" />
        </div>
        <span className="text-xs font-bold text-lp-primary uppercase tracking-wider">Eco tip</span>
      </div>
      <p className="text-xs text-black/55 dark:text-white/50 leading-relaxed">{tip.text}</p>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Environment page root
// ---------------------------------------------------------------------------
export default function Environment() {
  const env = useAppStore((s) => s.environment)
  const addEcoAction = useAppStore((s) => s.addEcoAction)
  const setTransportMode = useAppStore((s) => s.setTransportMode)

  const [open, setOpen] = useState(false)
  const [actionType, setActionType] = useState('Recycled plastic')
  const [impact, setImpact] = useState('0.4')

  const day = getDayKey()
  const todayActions = useMemo(() =>
    env.ecoActions.filter(a => {
      const d = new Date(a.timestamp)
      const now = new Date()
      return d.toDateString() === now.toDateString()
    }),
    [env.ecoActions]
  )
  const todayCarbonSaved = todayActions.reduce((s, a) => s + a.impactKgCO2, 0)
  const todayRecycled = env.recycledItemsByDay.find(x => x.day === day)?.items ?? 0
  const recent = useMemo(() => env.ecoActions.slice(0, 6), [env.ecoActions])

  const headline = useMemo(() => {
    if (todayActions.length === 0 && env.transportMode === 'Driving') {
      return 'No eco actions logged yet today and you drove — consider logging a sustainable action.'
    }
    if (todayActions.length === 0) {
      return 'No eco actions logged yet today — even one small action improves your eco score.'
    }
    if (todayActions.length >= 4) {
      return `${todayActions.length} eco actions logged today — daily eco goal reached. You saved ${todayCarbonSaved.toFixed(1)} kg CO₂.`
    }
    return `${todayActions.length} eco ${todayActions.length === 1 ? 'action' : 'actions'} logged today, saving ${todayCarbonSaved.toFixed(1)} kg CO₂. ${4 - todayActions.length} more to hit your daily goal.`
  }, [todayActions, todayCarbonSaved, env.transportMode])

  // Quick eco actions for one-tap logging
  const QUICK_ACTIONS = [
    { label: 'Recycled items', type: 'Recycled items', impactKgCO2: 0.3 },
    { label: 'Avoided plastic', type: 'Avoided plastic', impactKgCO2: 0.2 },
    { label: 'Zero-emission day', type: 'Zero-emission day', impactKgCO2: 1.2 },
    { label: 'Used reusable bag', type: 'Used reusable bag', impactKgCO2: 0.1 },
  ]

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-black/85 dark:text-white/90">Environment</h1>
          <p className="text-sm text-black/45 dark:text-white/40 mt-0.5 max-w-lg">{headline}</p>
        </div>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 text-white text-sm font-bold rounded-2xl hover:shadow-lg hover:scale-[1.02] transition-all duration-200 flex-shrink-0" style={{ background: 'linear-gradient(135deg, #4CAF50, #00BCD4)' }}
        >
          <Plus size={15} />
          Log eco action
        </button>
      </div>

      {/* Two-column layout */}
      <div className="grid lg:grid-cols-[1fr_280px] gap-5">

        {/* Left — main content */}
        <div className="space-y-5 min-w-0">

          {/* Today's stats */}
          <div className="grid grid-cols-3 gap-3">
            <StatCard
              label="Carbon saved"
              value={`${todayCarbonSaved.toFixed(1)} kg`}
              context={todayCarbonSaved > 0 ? 'CO₂ offset today' : 'Log eco actions to offset carbon'}
              icon={<Wind size={17} />}
              color="#4CAF50"
            />
            <StatCard
              label="Eco actions"
              value={`${todayActions.length} / 4`}
              context={todayActions.length >= 4 ? 'Daily goal reached' : `${4 - todayActions.length} more to reach daily goal`}
              icon={<Leaf size={17} />}
              color="#34A853"
            />
            <StatCard
              label="Transport"
              value={env.transportMode}
              context={
                env.transportMode === 'Walking' ? 'Zero emissions today' :
                env.transportMode === 'Cycling' ? 'Near-zero emissions' :
                'Higher emission mode'
              }
              icon={<Car size={17} />}
              color={env.transportMode === 'Driving' ? '#FF6B6B' : env.transportMode === 'Cycling' ? '#00BCD4' : '#4CAF50'}
            />
          </div>

          {/* Transport mode selector */}
          <div className="rounded-3xl p-5" style={{ background: `linear-gradient(135deg, #34A8530A 0%, #34A85305 100%)`, border: `1px solid #34A85320` }}>
            <div className="text-sm font-semibold text-black/80 dark:text-white/85 mb-1">Today's transport mode</div>
            <div className="text-xs text-black/40 dark:text-white/35 mb-4">How did you get around today?</div>
            <div className="grid grid-cols-3 gap-3">
              {TRANSPORT_OPTIONS.map(({ mode, Icon, color, co2Label, context }) => {
                const active = env.transportMode === mode
                return (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => { setTransportMode(mode); toast.success(`Transport set to ${mode}`) }}
                    className={clsx(
                      'flex flex-col items-start gap-2 p-4 rounded-xl border transition-all duration-200 text-left',
                      active
                        ? 'border-transparent'
                        : 'border-black/[0.06] dark:border-white/[0.06] hover:border-black/[0.12] dark:hover:border-white/[0.12]',
                    )}
                    style={active ? { backgroundColor: color + '15', borderColor: color + '30' } : undefined}
                  >
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: color + (active ? '25' : '12') }}>
                      <Icon size={16} style={{ color }} />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-black/80 dark:text-white/80">{mode}</div>
                      <div className="text-[10px] font-semibold mt-0.5" style={{ color }}>{co2Label}</div>
                      <div className="text-[10px] text-black/35 dark:text-white/30 mt-0.5 leading-relaxed">{context}</div>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Quick eco actions */}
          <div className="rounded-3xl p-5" style={{ background: `linear-gradient(135deg, #34A8530A 0%, #34A85305 100%)`, border: `1px solid #34A85320` }}>
            <div className="text-sm font-semibold text-black/80 dark:text-white/85 mb-1">Quick log</div>
            <div className="text-xs text-black/40 dark:text-white/35 mb-4">Tap to instantly log a common eco action</div>
            <div className="grid grid-cols-2 gap-2">
              {QUICK_ACTIONS.map((a) => (
                <button
                  key={a.label}
                  type="button"
                  onClick={() => {
                    addEcoAction({ type: a.type, impactKgCO2: a.impactKgCO2 })
                    toast.success(`${a.label} logged — saved ${a.impactKgCO2} kg CO₂`)
                  }}
                  className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-black/[0.03] dark:bg-white/[0.04] hover:bg-lp-primary/10 dark:hover:bg-lp-primary/10 border border-transparent hover:border-lp-primary/20 transition-all duration-150 group text-left"
                >
                  <div className="w-6 h-6 rounded-lg bg-lp-primary/15 flex items-center justify-center flex-shrink-0">
                    <Leaf size={12} className="text-lp-primary" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-black/65 dark:text-white/60 group-hover:text-black/80 dark:group-hover:text-white/80 truncate">{a.label}</div>
                    <div className="text-[10px] text-lp-primary/70">-{a.impactKgCO2} kg CO₂</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Recent eco actions */}
          <div className="rounded-3xl p-5" style={{ background: `linear-gradient(135deg, #34A8530A 0%, #34A85305 100%)`, border: `1px solid #34A85320` }}>
            <div className="text-sm font-semibold text-black/80 dark:text-white/85 mb-1">Eco actions log</div>
            <div className="text-xs text-black/40 dark:text-white/35 mb-4">Your recent sustainable actions</div>
            {recent.length === 0 ? (
              <div className="py-8 text-center">
                <div className="w-12 h-12 rounded-2xl bg-black/[0.04] dark:bg-white/[0.04] flex items-center justify-center mx-auto mb-3">
                  <Leaf size={20} className="text-black/20 dark:text-white/20" />
                </div>
                <p className="text-sm font-medium text-black/40 dark:text-white/35">No eco actions logged yet</p>
                <p className="text-xs text-black/30 dark:text-white/25 mt-1">Tap a quick action above or use the log button</p>
              </div>
            ) : (
              <div className="space-y-2">
                {recent.map((a, i) => (
                  <motion.div
                    key={a.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="flex items-center gap-3 p-3 rounded-xl bg-black/[0.02] dark:bg-white/[0.03] hover:bg-black/[0.04] dark:hover:bg-white/[0.05] transition-colors duration-150"
                  >
                    <div className="w-9 h-9 rounded-xl bg-lp-primary/10 flex items-center justify-center flex-shrink-0">
                      <Leaf size={14} className="text-lp-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-black/75 dark:text-white/75 truncate">{a.type}</div>
                      <div className="text-xs text-black/35 dark:text-white/30 mt-0.5">
                        {new Date(a.timestamp).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                      </div>
                    </div>
                    <div className="flex-shrink-0">
                      <span className="px-2.5 py-1 rounded-lg bg-lp-primary/10 text-xs font-bold text-lp-primary">
                        -{a.impactKgCO2.toFixed(1)} kg CO₂
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* Charts — real data only */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="rounded-3xl p-4" style={{ background: `linear-gradient(135deg, #34A8530A 0%, #34A85305 100%)`, border: `1px solid #34A85320` }}>
              <div className="text-sm font-semibold text-black/80 dark:text-white/85">Recycling this week</div>
              <div className="text-xs text-black/40 dark:text-white/35 mt-0.5 mb-3">Items recycled per day</div>
              <div className="h-44">
                <RecyclePlasticBarChart recycled={env.recycledItemsByDay} plastic={env.plasticUsageByDay} />
              </div>
            </div>
            <div className="rounded-3xl p-4" style={{ background: `linear-gradient(135deg, #34A8530A 0%, #34A85305 100%)`, border: `1px solid #34A85320` }}>
              <div className="text-sm font-semibold text-black/80 dark:text-white/85">Transport split</div>
              <div className="text-xs text-black/40 dark:text-white/35 mt-0.5 mb-3">Trips by mode this week</div>
              <div className="h-44">
                <TransportModeChart data={env.transportModeSplit} />
              </div>
            </div>
            <div className="md:col-span-2 bg-white dark:bg-slate-900 rounded-3xl p-4">
              <div className="text-sm font-semibold text-black/80 dark:text-white/85">Carbon impact</div>
              <div className="text-xs text-black/40 dark:text-white/35 mt-0.5 mb-3">kg CO₂ saved per day</div>
              <div className="h-44">
                <CarbonLineChart data={env.carbonKgByDay} />
              </div>
            </div>
          </div>
        </div>

        {/* Right sidebar */}
        <div className="space-y-4">
          <ScoreImpactCard
            ecoActions={todayActions.length}
            carbonKg={todayCarbonSaved}
          />
          <WeeklySummaryCard
            carbonByDay={env.carbonKgByDay}
            recycledByDay={env.recycledItemsByDay}
          />
          <EcoTipCard
            transportMode={env.transportMode}
            ecoActions={todayActions.length}
          />
          {todayActions.length >= 4 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-lp-primary/[0.08] border border-lp-primary/20 rounded-2xl p-4 flex items-center gap-3"
            >
              <div className="w-9 h-9 rounded-xl bg-lp-primary/20 flex items-center justify-center flex-shrink-0">
                <Award size={16} className="text-lp-primary" />
              </div>
              <div>
                <div className="text-sm font-semibold text-black/75 dark:text-white/75">Eco goal reached</div>
                <div className="text-xs text-black/45 dark:text-white/40 mt-0.5">4 eco actions logged today</div>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Custom eco action modal */}
      <Modal open={open} onClose={() => setOpen(false)} title="Log eco action">
        <p className="text-sm text-black/55 dark:text-white/45 -mt-1 mb-4">
          Log a custom sustainable action and its estimated carbon impact.
        </p>
        <div className="grid md:grid-cols-2 gap-3">
          <Input
            label="Action description"
            value={actionType}
            onChange={(e) => setActionType(e.target.value)}
            placeholder="e.g. Composted food waste"
          />
          <Input
            label="CO₂ reduced (kg)"
            value={impact}
            onChange={(e) => setImpact(e.target.value)}
            inputMode="decimal"
          />
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
          <Button
            onClick={() => {
              const imp = Math.max(0, Number(impact) || 0)
              addEcoAction({ type: actionType.trim() || 'Eco action', impactKgCO2: imp })
              setOpen(false)
              toast.success('Eco action logged')
            }}
          >
            Save
          </Button>
        </div>
      </Modal>
    </div>
  )
}