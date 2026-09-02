import { useMemo, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import {
  Activity, BarChart3, Flame, Leaf, Trophy,
  TrendingUp, Navigation, Timer, Star, Lock,
  CheckCircle2, Edit3, Save, X,
} from 'lucide-react'
import { motion } from 'framer-motion'
import { Camera } from 'lucide-react'

import { useAppStore } from '../store/useAppStore'
import { selectLifePulseScore } from '../store/selectors'
import { getDayKey } from '../utils/date'

// ---------------------------------------------------------------------------
// Score ring (mini version)
// ---------------------------------------------------------------------------
function MiniScoreRing({ score }: { score: number }) {
  const r = 38
  const circ = 2 * Math.PI * r
  const color = score >= 80 ? '#4CAF50' : score >= 60 ? '#FFA500' : score >= 40 ? '#00BCD4' : '#FF6B6B'
  const label = score >= 80 ? 'Excellent' : score >= 60 ? 'Good' : score >= 40 ? 'Fair' : 'Needs work'

  return (
    <div className="flex items-center gap-4">
      <div className="relative w-24 h-24 flex-shrink-0">
        <svg viewBox="0 0 84 84" className="w-full h-full -rotate-90">
          <circle cx="42" cy="42" r={r} fill="none" stroke="currentColor"
            strokeWidth="6" className="text-black/[0.07] dark:text-white/[0.08]" />
          <circle cx="42" cy="42" r={r} fill="none" stroke={color}
            strokeWidth="6" strokeLinecap="round"
            strokeDasharray={circ}
            strokeDashoffset={circ * (1 - score / 100)}
            style={{ transition: 'stroke-dashoffset 0.8s ease' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xl font-black leading-none" style={{ color }}>{score}</span>
          <span className="text-[9px] text-black/35 dark:text-white/30 uppercase tracking-wider">/100</span>
        </div>
      </div>
      <div>
        <div className="text-xs text-black/40 dark:text-white/35 uppercase tracking-wider font-semibold">LifePulse Score</div>
        <div className="text-2xl font-black mt-0.5" style={{ color }}>{label}</div>
        <div className="text-xs text-black/40 dark:text-white/35 mt-1">Based on today's data</div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Achievement badge
// ---------------------------------------------------------------------------
interface BadgeProps {
  label: string
  description: string
  Icon: React.ElementType
  color: string
  unlocked: boolean
}

function Badge({ label, description, Icon, color, unlocked }: BadgeProps) {
  return (
    <div className={`flex items-center gap-3 p-3 rounded-xl transition-all duration-200 ${
      unlocked
        ? 'bg-white dark:bg-slate-900 border border-black/[0.06] dark:border-white/[0.06] shadow-card'
        : 'bg-black/[0.02] dark:bg-white/[0.02] border border-black/[0.04] dark:border-white/[0.04]'
    }`}>
      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: unlocked ? color + '18' : '#00000008' }}>
        {unlocked
          ? <Icon size={18} style={{ color }} />
          : <Lock size={16} className="text-black/20 dark:text-white/20" />
        }
      </div>
      <div className="min-w-0">
        <div className={`text-sm font-semibold ${unlocked ? 'text-black/80 dark:text-white/80' : 'text-black/30 dark:text-white/25'}`}>
          {label}
        </div>
        <div className="text-xs text-black/35 dark:text-white/30 mt-0.5 truncate">{description}</div>
      </div>
      {unlocked && (
        <CheckCircle2 size={14} className="flex-shrink-0" style={{ color }} />
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Profile page
// ---------------------------------------------------------------------------
export default function Profile() {
  const user = useAppStore((s) => s.user)
  const updateProfile = useAppStore((s) => s.updateProfile)
  const score = useAppStore(selectLifePulseScore)
  const physical = useAppStore((s) => s.physical)
  const productivity = useAppStore((s) => s.productivity)
  const environment = useAppStore((s) => s.environment)

  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(user.name)
  const [email, setEmail] = useState(user.email)
  const [saving, setSaving] = useState(false)
  const [photoUrl, setPhotoUrl] = useState<string | null>(user.avatarUrl ?? null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) { toast.error("Photo must be under 2MB"); return }
    const reader = new FileReader()
    reader.onload = (ev) => {
      const url = ev.target?.result as string
      setPhotoUrl(url)
      updateProfile({ avatarUrl: url })
      toast.success("Photo updated")
    }
    reader.readAsDataURL(file)
  }

  // Streak from localStorage (set by backend)
  const streak = parseInt(localStorage.getItem('lp_streak') || '0', 10)

  // Derived stats
  const totalActivities = physical.activityLog.length
  const totalSteps = physical.weeklySteps.reduce((s, x) => s + x.steps, 0)
  const totalFocusMin = productivity.focusMinutesByDay.reduce((s, x) => s + x.minutes, 0)
  const totalEcoActions = environment.ecoActions.length
  const totalDistanceKm = physical.weeklyDistanceKm.reduce((s, x) => s + x.km, 0)

  // Achievements
  const achievements: BadgeProps[] = [
    {
      label: 'First Steps',
      description: 'Log your first walk',
      Icon: Navigation,
      color: '#4CAF50',
      unlocked: totalActivities >= 1,
    },
    {
      label: 'Step Champion',
      description: 'Hit 8,000 steps in a day',
      Icon: Activity,
      color: '#4CAF50',
      unlocked: physical.weeklySteps.some(x => x.steps >= 8000),
    },
    {
      label: 'Deep Focus',
      description: 'Complete a 60+ min focus session',
      Icon: Timer,
      color: '#6366F1',
      unlocked: productivity.focusSessions.some(s => s.durationSec >= 3600),
    },
    {
      label: 'Productive Week',
      description: 'Log focus sessions 5 days in a row',
      Icon: BarChart3,
      color: '#6366F1',
      unlocked: productivity.focusMinutesByDay.filter(x => x.minutes > 0).length >= 5,
    },
    {
      label: 'Eco Warrior',
      description: 'Log 10 eco actions',
      Icon: Leaf,
      color: '#34A853',
      unlocked: totalEcoActions >= 10,
    },
    {
      label: 'Streak Master',
      description: 'Maintain a 7-day streak',
      Icon: Flame,
      color: '#FFA500',
      unlocked: streak >= 7,
    },
    {
      label: 'High Scorer',
      description: 'Reach a LifePulse Score of 80+',
      Icon: Star,
      color: '#FFA500',
      unlocked: score >= 80,
    },
    {
      label: 'All-Rounder',
      description: 'Log data in all 5 dimensions',
      Icon: Trophy,
      color: '#00BCD4',
      unlocked: totalActivities > 0 && totalFocusMin > 0 && totalEcoActions > 0,
    },
  ]

  const unlockedCount = achievements.filter(a => a.unlocked).length

  const handleSave = () => {
    setSaving(true)
    setTimeout(() => {
      updateProfile({
        name: name.trim() || user.name,
        email: email.trim() || user.email,
      })
      setSaving(false)
      setEditing(false)
      toast.success('Profile updated')
    }, 350)
  }

  return (
    <div className="space-y-5">

      {/* Header */}
      <h1 className="text-2xl font-black text-black/85 dark:text-white/90">Profile</h1>

      {/* Two-column layout */}
      <div className="grid lg:grid-cols-[1fr_320px] gap-5">

        {/* Left — profile details + achievements */}
        <div className="space-y-5">

          {/* Profile card */}
          <div className="rounded-3xl p-6" style={{ background: `linear-gradient(135deg, #4CAF5008 0%, #4CAF5004 100%)`, border: `1px solid #4CAF5018` }}>
            <div className="flex items-start justify-between gap-4 mb-6">
              <div className="flex items-center gap-4">
                {/* Avatar with photo upload */}
                <div className="relative flex-shrink-0">
                  <div className="w-16 h-16 rounded-2xl overflow-hidden bg-lp-primary flex items-center justify-center text-white text-xl font-black shadow-lg shadow-lp-primary/25">
                    {photoUrl
                      ? <img src={photoUrl} alt={user.name} className="w-full h-full object-cover" />
                      : <span>{user.name.trim().split(/\s+/).slice(0,2).map((p: string) => p[0]).join('').toUpperCase()}</span>
                    }
                  </div>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute -bottom-1.5 -right-1.5 w-6 h-6 rounded-lg bg-white dark:bg-slate-800 border border-black/10 dark:border-white/10 shadow-sm flex items-center justify-center hover:bg-lp-primary hover:border-lp-primary hover:text-white transition-all duration-200 text-black/40 dark:text-white/40"
                    title="Upload photo"
                  >
                    <Camera size={11} />
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoChange}
                    className="hidden"
                  />
                </div>
                <div>
                  <div className="text-lg font-bold text-black/85 dark:text-white/90">{user.name}</div>
                  <div className="text-sm text-black/40 dark:text-white/35 mt-0.5">{user.email}</div>
                  <div className="flex items-center gap-2 mt-2">
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-lp-primary/10 border border-lp-primary/20">
                      <Flame size={12} className="text-lp-primary" />
                      <span className="text-xs font-bold text-lp-primary">{streak} day streak</span>
                    </div>
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/[0.05] dark:bg-white/[0.05] border border-black/[0.06] dark:border-white/[0.06]">
                      <Trophy size={12} className="text-black/40 dark:text-white/40" />
                      <span className="text-xs font-semibold text-black/50 dark:text-white/45">{unlockedCount}/{achievements.length} badges</span>
                    </div>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => editing ? handleSave() : setEditing(true)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-200 ${
                  editing
                    ? 'bg-lp-primary text-white hover:bg-green-500'
                    : 'bg-black/[0.05] dark:bg-white/[0.06] text-black/55 dark:text-white/50 hover:bg-black/[0.09] dark:hover:bg-white/[0.10]'
                }`}
              >
                {editing ? <><Save size={13} /> Save</> : <><Edit3 size={13} /> Edit</>}
              </button>
            </div>

            {/* Edit form */}
            {editing ? (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                {/* Photo upload in edit mode */}
                <div>
                  <div className="text-xs font-semibold text-black/50 dark:text-white/45 uppercase tracking-wider mb-2">Profile photo</div>
                  <div className="flex items-center gap-4">
                    <div className="relative flex-shrink-0">
                      <div className="w-16 h-16 rounded-2xl overflow-hidden bg-lp-primary flex items-center justify-center text-white text-xl font-black shadow-md">
                        {photoUrl
                          ? <img src={photoUrl} alt={user.name} className="w-full h-full object-cover" />
                          : <span>{user.name.trim().split(/\s+/).slice(0, 2).map((p: string) => p[0]).join('').toUpperCase()}</span>
                        }
                      </div>
                    </div>
                    <div className="space-y-2">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold bg-black/[0.05] dark:bg-white/[0.06] text-black/60 dark:text-white/55 hover:bg-lp-primary/10 hover:text-lp-primary border border-black/[0.07] dark:border-white/[0.07] hover:border-lp-primary/25 transition-all duration-150"
                      >
                        <Camera size={13} />
                        {photoUrl ? 'Change photo' : 'Upload photo'}
                      </button>
                      {photoUrl && (
                        <button
                          type="button"
                          onClick={() => {
                            setPhotoUrl(null)
                            updateProfile({ avatarUrl: null })
                            toast.success('Photo removed')
                          }}
                          className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-lp-alert/70 hover:bg-lp-alert/10 hover:text-lp-alert transition-all duration-150"
                        >
                          <X size={13} />
                          Remove photo
                        </button>
                      )}
                      <p className="text-[10px] text-black/30 dark:text-white/25">
                        JPG, PNG or GIF · Max 2MB
                      </p>
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoChange}
                      className="hidden"
                    />
                  </div>
                </div>

                <div className="h-px bg-black/[0.05] dark:bg-white/[0.05]" />

                <div className="grid md:grid-cols-2 gap-3">
                  <div>
                    <div className="text-xs font-semibold text-black/50 dark:text-white/45 uppercase tracking-wider mb-1.5">Full name</div>
                    <input
                      value={name}
                      onChange={e => setName(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-black/[0.08] dark:border-white/[0.08] bg-black/[0.02] dark:bg-white/[0.03] text-sm text-black/75 dark:text-white/70 focus:outline-none focus:ring-2 focus:ring-lp-primary/40 transition-all"
                    />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-black/50 dark:text-white/45 uppercase tracking-wider mb-1.5">Email</div>
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-black/[0.08] dark:border-white/[0.08] bg-black/[0.02] dark:bg-white/[0.03] text-sm text-black/75 dark:text-white/70 focus:outline-none focus:ring-2 focus:ring-lp-primary/40 transition-all"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => { setEditing(false); setName(user.name); setEmail(user.email) }}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-black/[0.05] dark:bg-white/[0.06] text-black/55 dark:text-white/50 hover:bg-black/[0.09] transition-all"
                  >
                    <X size={13} /> Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-lp-primary text-white hover:bg-green-500 transition-all disabled:opacity-50"
                  >
                    <Save size={13} /> {saving ? 'Saving…' : 'Save changes'}
                  </button>
                </div>
              </motion.div>
            ) : (
              /* Quick stats grid */
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: 'Activities', value: totalActivities, Icon: Activity, color: '#4CAF50' },
                  { label: 'Steps this week', value: totalSteps.toLocaleString(), Icon: Navigation, color: '#00BCD4' },
                  { label: 'Focus minutes', value: `${totalFocusMin}m`, Icon: Timer, color: '#6366F1' },
                  { label: 'Eco actions', value: totalEcoActions, Icon: Leaf, color: '#34A853' },
                ].map(({ label, value, Icon, color }) => (
                  <div key={label} className="bg-black/[0.02] dark:bg-white/[0.03] rounded-xl p-3">
                    <div className="w-9 h-9 rounded-2xl flex items-center justify-center mb-2"
                      style={{ backgroundColor: color + '15' }}>
                      <Icon size={14} style={{ color }} />
                    </div>
                    <div className="text-lg font-black text-black/80 dark:text-white/80 leading-none">{value}</div>
                    <div className="text-[10px] text-black/35 dark:text-white/30 mt-0.5">{label}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Achievements */}
          <div className="rounded-3xl p-5" style={{ background: `linear-gradient(135deg, #4CAF5008 0%, #4CAF5004 100%)`, border: `1px solid #4CAF5018` }}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-sm font-semibold text-black/80 dark:text-white/85">Achievements</div>
                <div className="text-xs text-black/40 dark:text-white/35 mt-0.5">
                  {unlockedCount} of {achievements.length} badges unlocked
                </div>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-lp-primary/10 border border-lp-primary/20">
                <Trophy size={13} className="text-lp-primary" />
                <span className="text-xs font-bold text-lp-primary">{unlockedCount}/{achievements.length}</span>
              </div>
            </div>

            {/* Progress bar */}
            <div className="mb-4">
              <div className="h-1.5 rounded-full bg-black/[0.06] dark:bg-white/[0.06] overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-lp-primary"
                  initial={{ width: 0 }}
                  animate={{ width: `${(unlockedCount / achievements.length) * 100}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-2">
              {achievements.map((a) => (
                <Badge key={a.label} {...a} />
              ))}
            </div>
          </div>
        </div>

        {/* Right — score + streak */}
        <div className="space-y-4">

          {/* Score card */}
          <div className="rounded-3xl p-5" style={{ background: `linear-gradient(135deg, #4CAF5008 0%, #4CAF5004 100%)`, border: `1px solid #4CAF5018` }}>
            <div className="text-xs font-bold text-black/35 dark:text-white/30 uppercase tracking-wider mb-4">Today's Score</div>
            <MiniScoreRing score={score} />

            <div className="mt-4 pt-4 border-t border-black/[0.05] dark:border-white/[0.05] space-y-2">
              {[
                { label: 'Physical', value: Math.min(Math.round((physical.weeklySteps.find(x => x.day === getDayKey())?.steps ?? 0) / 8000 * 100), 100), color: '#4CAF50' },
                { label: 'Productivity', value: Math.min(Math.round((productivity.focusMinutesByDay.find(x => x.day === getDayKey())?.minutes ?? 0) / 120 * 100), 100), color: '#6366F1' },
                { label: 'Eco', value: Math.min(environment.ecoActions.filter(a => new Date(a.timestamp).toDateString() === new Date().toDateString()).length * 25, 100), color: '#34A853' },
              ].map((d) => (
                <div key={d.label}>
                  <div className="flex justify-between text-[10px] mb-1">
                    <span className="text-black/35 dark:text-white/30">{d.label}</span>
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

          {/* Streak card */}
          <div className="rounded-3xl p-5" style={{ background: `linear-gradient(135deg, #4CAF5008 0%, #4CAF5004 100%)`, border: `1px solid #4CAF5018` }}>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-9 h-9 rounded-2xl bg-lp-primary/15 flex items-center justify-center">
                <Flame size={14} className="text-lp-primary" />
              </div>
              <span className="text-sm font-semibold text-black/70 dark:text-white/70">Daily Streak</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-5xl font-black text-black/85 dark:text-white/90">{streak}</span>
              <span className="text-lg text-black/35 dark:text-white/30 font-semibold">days</span>
            </div>
            <p className="text-xs text-black/40 dark:text-white/35 mt-2 leading-relaxed">
              {streak === 0
                ? 'Log data today to start your streak.'
                : streak < 7
                ? `${7 - streak} more days to earn the Streak Master badge.`
                : `Impressive — you have maintained a ${streak}-day streak!`
              }
            </p>
          </div>

          {/* Distance card */}
          <div className="rounded-3xl p-5" style={{ background: `linear-gradient(135deg, #4CAF5008 0%, #4CAF5004 100%)`, border: `1px solid #4CAF5018` }}>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-9 h-9 rounded-2xl bg-lp-accent/15 flex items-center justify-center">
                <TrendingUp size={14} className="text-lp-accent" />
              </div>
              <span className="text-sm font-semibold text-black/70 dark:text-white/70">This Week</span>
            </div>
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs text-black/45 dark:text-white/40">Distance walked</span>
                <span className="text-sm font-bold text-black/80 dark:text-white/80">{totalDistanceKm.toFixed(1)} km</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-black/45 dark:text-white/40">Focus sessions</span>
                <span className="text-sm font-bold text-black/80 dark:text-white/80">
                  {productivity.focusSessions.length}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-black/45 dark:text-white/40">Eco actions</span>
                <span className="text-sm font-bold text-lp-primary">{totalEcoActions}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}