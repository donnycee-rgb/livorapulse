import { useState } from 'react'
import toast from 'react-hot-toast'
import clsx from 'clsx'
import { Minus, Plus } from 'lucide-react'

import Modal from '../ui/Modal'
import { useAppStore } from '../../store/useAppStore'

// The Work page's two choices: how long this session lasts (quick picks or
// any length) and the daily focus goal (changed right here, not only in
// Settings).

const QUICK = [15, 25, 45, 60] as const
export const SESSION_MIN = 5
export const SESSION_MAX = 180

const fmt = (m: number) => (m < 60 ? `${m} min` : m % 60 === 0 ? `${m / 60} h` : `${Math.floor(m / 60)} h ${m % 60} min`)

function Stepper({ value, onChange, min, max, step, label }: {
  value: number; onChange: (v: number) => void; min: number; max: number; step: number; label: string
}) {
  return (
    <div className="flex items-center justify-between rounded-2xl bg-ui-raised p-2">
      <button type="button" onClick={() => onChange(Math.max(min, value - step))} disabled={value <= min} aria-label={`Less ${label}`}
        className="w-10 h-10 rounded-xl bg-ui-card text-ui-ink flex items-center justify-center disabled:opacity-30">
        <Minus size={16} />
      </button>
      <label className="flex items-baseline gap-1.5">
        <input type="number" inputMode="numeric" min={min} max={max} value={value} aria-label={label}
          onChange={(e) => { const v = Math.round(Number(e.target.value)); if (Number.isFinite(v)) onChange(Math.min(max, Math.max(min, v))) }}
          className="w-16 bg-transparent text-center text-[24px] font-black text-ui-ink tabular-nums outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none" />
        <span className="text-[13px] font-semibold text-ui-muted">min</span>
      </label>
      <button type="button" onClick={() => onChange(Math.min(max, value + step))} disabled={value >= max} aria-label={`More ${label}`}
        className="w-10 h-10 rounded-xl bg-ui-card text-ui-ink flex items-center justify-center disabled:opacity-30">
        <Plus size={16} />
      </button>
    </div>
  )
}

/** Session length: 15 / 25 / 45 / 60 minutes, or Custom (5 minutes to 3 hours) */
export function DurationPicker({ value, onChange }: { value: number; onChange: (m: number) => void }) {
  const [custom, setCustom] = useState(!QUICK.includes(value as (typeof QUICK)[number]))
  const chip = (active: boolean) => clsx('py-2 rounded-xl text-xs font-bold transition-all duration-150',
    active
      ? 'bg-[#6366F1] text-white shadow-sm'
      : 'bg-black/[0.04] dark:bg-white/[0.05] text-black/55 dark:text-white/50 hover:bg-black/[0.08] dark:hover:bg-white/[0.09]')
  return (
    <div>
      <div className="grid grid-cols-5 gap-2">
        {QUICK.map((m) => (
          <button key={m} type="button" onClick={() => { setCustom(false); onChange(m) }} className={chip(!custom && value === m)}>{m}m</button>
        ))}
        <button type="button" onClick={() => setCustom(true)} className={chip(custom)} aria-expanded={custom}>Custom</button>
      </div>
      {custom && (
        <div className="mt-3">
          <Stepper value={value} onChange={onChange} min={SESSION_MIN} max={SESSION_MAX} step={5} label="session length" />
          <p className="mt-1.5 text-[12px] text-ui-muted">Any length from 5 minutes to 3 hours.</p>
        </div>
      )}
    </div>
  )
}

/** "Change goal": the daily focus target, saved to the person's goals */
export function FocusGoalSheet({ open, onClose, current }: { open: boolean; onClose: () => void; current: number }) {
  return (
    <Modal open={open} onClose={onClose} title="Daily focus goal">
      {open && <GoalForm current={current} onClose={onClose} />}
    </Modal>
  )
}

function GoalForm({ current, onClose }: { current: number; onClose: () => void }) {
  const setGoals = useAppStore((s) => s.setGoals)
  const [goal, setGoal] = useState(current)
  const [busy, setBusy] = useState(false)
  const picks = [30, 60, 120, 180, 240]

  const save = async () => {
    setBusy(true)
    try {
      await setGoals({ goalFocusMinutes: goal })
      // Show it straight away; the server's version (which can grow with a streak) follows
      useAppStore.setState((s) => (s.dashboard.goals ? { dashboard: { ...s.dashboard, goals: { ...s.dashboard.goals, goalFocusMinutes: goal } } } : {}))
      toast.success(`Daily focus goal: ${fmt(goal)}`)
      onClose()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't save your goal")
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="-mt-1">
      <p className="text-[13.5px] text-ui-muted">How much focused work or study you want each day. It counts toward your score.</p>
      <div className="mt-4 grid grid-cols-5 gap-1.5">
        {picks.map((m) => (
          <button key={m} type="button" onClick={() => setGoal(m)}
            className={clsx('h-9 rounded-xl text-[12.5px] font-bold transition-colors',
              goal === m ? 'bg-[#6366F1] text-white' : 'bg-ui-raised text-ui-ink')}>
            {m < 60 ? `${m}m` : `${m / 60}h`}
          </button>
        ))}
      </div>
      <div className="mt-3">
        <Stepper value={goal} onChange={setGoal} min={15} max={300} step={15} label="daily focus goal" />
      </div>
      <button type="button" onClick={save} disabled={busy || goal === current}
        className="mt-5 w-full h-11 rounded-2xl text-sm font-bold bg-lp-btn text-lp-btn-ink disabled:opacity-40">
        {busy ? 'Saving…' : `Save ${fmt(goal)} a day`}
      </button>
    </div>
  )
}
