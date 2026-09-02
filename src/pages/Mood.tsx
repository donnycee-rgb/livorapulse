import {
  Smile, SmilePlus, Meh, Frown, CloudRain,
  Heart, Target, TrendingUp, TrendingDown,
  Minus, Zap, Wind,
} from 'lucide-react'
import { useMemo } from 'react'
import toast from 'react-hot-toast'
import { motion } from 'framer-motion'
import clsx from 'clsx'

import MoodTimelineChart from '../components/charts/MoodTimelineChart'
import StressLineChart from '../components/charts/StressLineChart'

import type { MoodEmoji } from '../data/types'
import { useAppStore } from '../store/useAppStore'
import { getDayKey } from '../utils/date'

// ---------------------------------------------------------------------------
// Mood level config — icons only, no emojis in UI
// ---------------------------------------------------------------------------
const MOOD_LEVELS: Array<{
  emoji: MoodEmoji
  label: string
  Icon: React.ElementType
  color: string
  bg: string
  description: string
}> = [
  {
    emoji: '😄',
    label: 'Excellent',
    Icon: SmilePlus,
    color: '#4CAF50',
    bg: '#4CAF5018',
    description: 'Feeling great and energised',
  },
  {
    emoji: '🙂',
    label: 'Good',
    Icon: Smile,
    color: '#00BCD4',
    bg: '#00BCD418',
    description: 'Positive and balanced',
  },
  {
    emoji: '😐',
    label: 'Neutral',
    Icon: Meh,
    color: '#FFA500',
    bg: '#FFA50018',
    description: 'Neither good nor bad',
  },
  {
    emoji: '😕',
    label: 'Low',
    Icon: Frown,
    color: '#FF8C00',
    bg: '#FF8C0018',
    description: 'Not quite yourself today',
  },
  {
    emoji: '😣',
    label: 'Stressed',
    Icon: CloudRain,
    color: '#FF6B6B',
    bg: '#FF6B6B18',
    description: 'Overwhelmed or anxious',
  },
]

// ---------------------------------------------------------------------------
// Score impact sidebar card
// ---------------------------------------------------------------------------
function ScoreImpactCard({ emoji, stressScore }: {
  emoji: MoodEmoji; stressScore: number
}) {
  const level = MOOD_LEVELS.find(m => m.emoji === emoji) ?? MOOD_LEVELS[2]
  const moodScore = MOOD_LEVELS.indexOf(level) === -1 ? 50 :
    [100, 80, 60, 40, 20][MOOD_LEVELS.indexOf(level)]
  const stressComponent = Math.max(0, 110 - (stressScore / 5) * 100)
  const mentalScore = Math.round(0.6 * moodScore + 0.4 * stressComponent)

  return (
    <div className="rounded-3xl p-4" style={{ background: `linear-gradient(135deg, #FFA5000A 0%, #FFA50005 100%)`, border: `1px solid #FFA50020` }}>
      <div className="flex items-center gap-2 mb-3">
        <div className="w-9 h-9 rounded-xl bg-lp-alert/15 flex items-center justify-center">
          <Target size={14} className="text-lp-alert" />
        </div>
        <span className="text-sm font-semibold text-black/70 dark:text-white/70">Score Impact</span>
      </div>
      <div className="flex items-baseline gap-2 mb-1">
        <span className="text-3xl font-black text-black/85 dark:text-white/90">{mentalScore}</span>
        <span className="text-xs text-black/35 dark:text-white/30">/ 100 mental score</span>
      </div>
      <p className="text-xs text-black/50 dark:text-white/45 leading-relaxed mt-2">
        {stressScore >= 4
          ? 'High stress is reducing your mental score. Try a short focus session or a walk.'
          : stressScore <= 2
          ? 'Low stress is boosting your mental score. Keep it up.'
          : 'Moderate stress. Logging your mood daily helps track patterns over time.'
        }
      </p>
      <div className="mt-3 pt-3 border-t border-black/[0.05] dark:border-white/[0.05]">
        <div className="space-y-2">
          {[
            { label: 'Mood', value: moodScore, color: level.color },
            { label: 'Stress (inverted)', value: Math.round(stressComponent), color: stressScore <= 2 ? '#4CAF50' : stressScore <= 3 ? '#FFA500' : '#FF6B6B' },
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
function WeeklySummaryCard({ moodByDay, stressByDay }: {
  moodByDay: Array<{ day: string; emoji: MoodEmoji }>
  stressByDay: Array<{ day: string; score: number }>
}) {
  const avgStress = stressByDay.length > 0
    ? (stressByDay.reduce((s, x) => s + x.score, 0) / stressByDay.length).toFixed(1)
    : '—'

  const moodCounts = MOOD_LEVELS.map(m => ({
    label: m.label,
    color: m.color,
    count: moodByDay.filter(x => x.emoji === m.emoji).length,
  })).filter(m => m.count > 0)

  const dominantMood = moodCounts.sort((a, b) => b.count - a.count)[0]
  const loggedDays = moodByDay.filter(x => x.emoji).length

  return (
    <div className="rounded-3xl p-4" style={{ background: `linear-gradient(135deg, #FFA5000A 0%, #FFA50005 100%)`, border: `1px solid #FFA50020` }}>
      <div className="flex items-center gap-2 mb-3">
        <div className="w-9 h-9 rounded-xl bg-lp-accent/15 flex items-center justify-center">
          <TrendingUp size={14} className="text-lp-accent" />
        </div>
        <span className="text-sm font-semibold text-black/70 dark:text-white/70">This Week</span>
      </div>
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-xs text-black/45 dark:text-white/40">Days logged</span>
          <span className="text-sm font-bold text-black/80 dark:text-white/80">{loggedDays} / 7</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-black/45 dark:text-white/40">Avg stress</span>
          <span className={clsx(
            'text-sm font-bold',
            Number(avgStress) <= 2 ? 'text-lp-primary' :
            Number(avgStress) <= 3 ? 'text-yellow-500' : 'text-lp-alert'
          )}>{avgStress} / 5</span>
        </div>
        {dominantMood && (
          <div className="flex items-center justify-between">
            <span className="text-xs text-black/45 dark:text-white/40">Most common mood</span>
            <span className="text-sm font-bold" style={{ color: dominantMood.color }}>
              {dominantMood.label}
            </span>
          </div>
        )}
      </div>

      {/* Weekly mood dots */}
      {moodByDay.length > 0 && (
        <div className="mt-3 pt-3 border-t border-black/[0.05] dark:border-white/[0.05]">
          <div className="flex items-center gap-1.5">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => {
              const entry = moodByDay.find(x => x.day === day)
              const level = entry ? MOOD_LEVELS.find(m => m.emoji === entry.emoji) : null
              return (
                <div key={day} className="flex-1 flex flex-col items-center gap-1">
                  <div
                    className="w-full h-2 rounded-full"
                    style={{ backgroundColor: level ? level.color : '#0000000A' }}
                  />
                  <span className="text-[8px] text-black/25 dark:text-white/20">{day.slice(0, 1)}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Wellness tip sidebar card
// ---------------------------------------------------------------------------
function WellnessTipCard({ stressScore, emoji }: {
  stressScore: number; emoji: MoodEmoji
}) {
  const tips = [
    {
      condition: stressScore >= 4,
      title: 'High stress detected',
      text: 'A 10-minute walk or a short breathing exercise can reduce cortisol levels significantly. Your physical activity and focus scores both improve when stress is managed.',
      color: '#FF6B6B',
    },
    {
      condition: emoji === '😄' || emoji === '🙂',
      title: 'Great mental state',
      text: 'You are in a positive mental state — an ideal time for deep work, creative tasks, or learning something new. Your productivity score benefits from this.',
      color: '#4CAF50',
    },
    {
      condition: stressScore === 3,
      title: 'Moderate stress',
      text: 'Moderate stress is normal. Regular logging helps you spot patterns — many users find stress peaks mid-week and drops on weekends.',
      color: '#FFA500',
    },
    {
      condition: true,
      title: 'Track your patterns',
      text: 'Logging mood daily for 7 days unlocks trend insights. You will start seeing what activities, days, or habits affect your mental wellbeing most.',
      color: '#6366F1',
    },
  ]

  const tip = tips.find(t => t.condition) ?? tips[3]

  return (
    <div
      className="rounded-2xl border p-4"
      style={{ backgroundColor: tip.color + '08', borderColor: tip.color + '25' }}
    >
      <div className="flex items-center gap-2 mb-2">
        <div className="w-6 h-6 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: tip.color + '20' }}>
          <Zap size={12} style={{ color: tip.color }} />
        </div>
        <span className="text-xs font-bold uppercase tracking-wider" style={{ color: tip.color }}>
          {tip.title}
        </span>
      </div>
      <p className="text-xs text-black/55 dark:text-white/50 leading-relaxed">{tip.text}</p>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Mood page root
// ---------------------------------------------------------------------------
export default function Mood() {
  const mood = useAppStore((s) => s.mood)
  const setMoodEmoji = useAppStore((s) => s.setMoodEmoji)
  const setStressScore = useAppStore((s) => s.setStressScore)

  const currentLevel = MOOD_LEVELS.find(m => m.emoji === mood.today.emoji) ?? MOOD_LEVELS[2]
  const stressScore = mood.today.stressScore

  const headline = useMemo(() => {
    const level = MOOD_LEVELS.find(m => m.emoji === mood.today.emoji)
    if (!level) return 'Log your mood to start tracking your mental wellbeing.'
    if (stressScore >= 4 && (level.emoji === '😕' || level.emoji === '😣')) {
      return `Mood: ${level.label} · Stress: ${stressScore}/5 — a tough day. Consider a short walk or break.`
    }
    if (stressScore <= 2 && (level.emoji === '😄' || level.emoji === '🙂')) {
      return `Mood: ${level.label} · Stress: ${stressScore}/5 — you are in a great mental state today.`
    }
    return `Mood: ${level.label} · Stress: ${stressScore}/5 — keep logging daily to see your weekly patterns.`
  }, [mood.today.emoji, stressScore])

  const stressLevels = [
    { score: 1, label: 'Very low', color: '#4CAF50', desc: 'Calm and at ease' },
    { score: 2, label: 'Low', color: '#00BCD4', desc: 'Mostly relaxed' },
    { score: 3, label: 'Moderate', color: '#FFA500', desc: 'Some tension' },
    { score: 4, label: 'High', color: '#FF8C00', desc: 'Noticeably stressed' },
    { score: 5, label: 'Very high', color: '#FF6B6B', desc: 'Overwhelmed' },
  ]

  const currentStress = stressLevels.find(s => s.score === stressScore)

  return (
    <div className="space-y-5">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-black/85 dark:text-white/90">Mood & Mindset</h1>
        <p className="text-sm text-black/45 dark:text-white/40 mt-0.5 max-w-lg">{headline}</p>
      </div>

      {/* Two-column layout */}
      <div className="grid lg:grid-cols-[1fr_280px] gap-5">

        {/* Left — main content */}
        <div className="space-y-5 min-w-0">

          {/* Today's stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-3xl p-4" style={{ background: `linear-gradient(135deg, #FFA5000A 0%, #FFA50005 100%)`, border: `1px solid #FFA50020` }}>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3"
                style={{ backgroundColor: currentLevel.bg }}>
                <currentLevel.Icon size={17} style={{ color: currentLevel.color }} />
              </div>
              <div className="text-[10px] font-bold text-black/35 dark:text-white/30 uppercase tracking-wider">Mood today</div>
              <div className="mt-1 text-xl font-black leading-none" style={{ color: currentLevel.color }}>
                {currentLevel.label}
              </div>
              <div className="mt-1 text-xs text-black/45 dark:text-white/40">{currentLevel.description}</div>
            </div>

            <div className="rounded-3xl p-4" style={{ background: `linear-gradient(135deg, #FFA5000A 0%, #FFA50005 100%)`, border: `1px solid #FFA50020` }}>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3"
                style={{ backgroundColor: (currentStress?.color ?? '#FFA500') + '18' }}>
                <Wind size={17} style={{ color: currentStress?.color ?? '#FFA500' }} />
              </div>
              <div className="text-[10px] font-bold text-black/35 dark:text-white/30 uppercase tracking-wider">Stress level</div>
              <div className="mt-1 text-xl font-black leading-none" style={{ color: currentStress?.color ?? '#FFA500' }}>
                {stressScore} / 5
              </div>
              <div className="mt-1 text-xs text-black/45 dark:text-white/40">{currentStress?.label ?? 'Moderate'}</div>
            </div>
          </div>

          {/* Mood selector — icons only */}
          <div className="rounded-3xl p-5" style={{ background: `linear-gradient(135deg, #FFA5000A 0%, #FFA50005 100%)`, border: `1px solid #FFA50020` }}>
            <div className="text-sm font-semibold text-black/80 dark:text-white/85 mb-1">How are you feeling right now?</div>
            <div className="text-xs text-black/40 dark:text-white/35 mb-4">Tap a level to log your current mood</div>
            <div className="grid grid-cols-5 gap-2">
              {MOOD_LEVELS.map((level) => {
                const active = mood.today.emoji === level.emoji
                return (
                  <motion.button
                    key={level.emoji}
                    type="button"
                    whileHover={{ y: -3 }}
                    whileTap={{ scale: 0.96 }}
                    onClick={() => {
                      setMoodEmoji(level.emoji)
                      toast.success(`Mood logged: ${level.label}`)
                    }}
                    className={clsx(
                      'relative flex flex-col items-center gap-2 py-4 rounded-2xl border transition-all duration-200 group',
                      active
                        ? 'border-transparent'
                        : 'border-black/[0.06] dark:border-white/[0.06] hover:border-black/[0.12] dark:hover:border-white/[0.12]',
                    )}
                    style={active ? { backgroundColor: level.bg, borderColor: level.color + '30' } : undefined}
                  >
                    {/* Hover tooltip */}
                    <div className="absolute -top-12 left-1/2 -translate-x-1/2 px-2.5 py-1.5 rounded-xl text-[10px] font-semibold text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none z-20 -translate-y-1 group-hover:translate-y-0"
                      style={{ background: level.color, boxShadow: `0 4px 12px ${level.color}50` }}>
                      {level.description}
                      {/* Arrow */}
                      <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0"
                        style={{ borderLeft: '5px solid transparent', borderRight: '5px solid transparent', borderTop: `5px solid ${level.color}` }} />
                    </div>

                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 group-hover:scale-110"
                      style={{ backgroundColor: active ? level.color + '25' : level.color + '12' }}
                    >
                      <level.Icon size={20} style={{ color: level.color }} />
                    </div>
                    <span
                      className="text-xs font-semibold"
                      style={{ color: active ? level.color : undefined }}
                    >
                      {level.label}
                    </span>
                  </motion.button>
                )
              })}
            </div>
          </div>

          {/* Stress logger — tap buttons */}
          <div className="rounded-3xl p-5" style={{ background: `linear-gradient(135deg, #FFA5000A 0%, #FFA50005 100%)`, border: `1px solid #FFA50020` }}>
            <div className="text-sm font-semibold text-black/80 dark:text-white/85 mb-1">Stress level</div>
            <div className="text-xs text-black/40 dark:text-white/35 mb-4">
              How stressed do you feel right now? 1 = very low, 5 = very high
            </div>
            <div className="flex gap-2">
              {stressLevels.map((s) => {
                const active = stressScore === s.score
                return (
                  <button
                    key={s.score}
                    type="button"
                    onClick={() => {
                      setStressScore(s.score)
                      toast.success(`Stress level set to ${s.score}/5 — ${s.label}`)
                    }}
                    className={clsx(
                      'relative flex-1 flex flex-col items-center gap-1.5 py-3 rounded-xl border transition-all duration-150 group',
                      active
                        ? 'border-transparent text-white'
                        : 'border-black/[0.06] dark:border-white/[0.06] text-black/55 dark:text-white/50 hover:border-black/[0.12] dark:hover:border-white/[0.12]',
                    )}
                    style={active ? { backgroundColor: s.color, borderColor: s.color } : undefined}
                  >
                    {/* Hover tooltip */}
                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 px-2 py-1 rounded-lg text-[10px] font-semibold text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none z-20 -translate-y-1 group-hover:translate-y-0"
                      style={{ background: s.color, boxShadow: `0 3px 10px ${s.color}50` }}>
                      {s.desc}
                      <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0"
                        style={{ borderLeft: '4px solid transparent', borderRight: '4px solid transparent', borderTop: `4px solid ${s.color}` }} />
                    </div>
                    <span className="text-lg font-black leading-none">{s.score}</span>
                    <span className="text-[10px] font-semibold">{s.label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Charts */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="rounded-3xl p-4" style={{ background: `linear-gradient(135deg, #FFA5000A 0%, #FFA50005 100%)`, border: `1px solid #FFA50020` }}>
              <div className="text-sm font-semibold text-black/80 dark:text-white/85">Mood this week</div>
              <div className="text-xs text-black/40 dark:text-white/35 mt-0.5 mb-3">Daily mood level</div>
              <div className="h-44">
                <MoodTimelineChart data={mood.moodByDay} />
              </div>
            </div>
            <div className="rounded-3xl p-4" style={{ background: `linear-gradient(135deg, #FFA5000A 0%, #FFA50005 100%)`, border: `1px solid #FFA50020` }}>
              <div className="text-sm font-semibold text-black/80 dark:text-white/85">Stress trend</div>
              <div className="text-xs text-black/40 dark:text-white/35 mt-0.5 mb-3">Daily stress score</div>
              <div className="h-44">
                <StressLineChart data={mood.stressByDay} />
              </div>
            </div>
          </div>
        </div>

        {/* Right sidebar */}
        <div className="space-y-4">
          <ScoreImpactCard emoji={mood.today.emoji} stressScore={stressScore} />
          <WeeklySummaryCard
            moodByDay={mood.moodByDay}
            stressByDay={mood.stressByDay}
          />
          <WellnessTipCard stressScore={stressScore} emoji={mood.today.emoji} />
        </div>
      </div>
    </div>
  )
}