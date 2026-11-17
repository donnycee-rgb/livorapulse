import { useState, useSyncExternalStore } from 'react'
import toast from 'react-hot-toast'
import clsx from 'clsx'
import { BellRing, MoonStar, Sunrise } from 'lucide-react'

import Modal from '../ui/Modal'
import { startInstall } from '../InstallApp'
import { markRemindersAsked, pushSupport, saveReminderSettings, turnOnPush } from '../../lib/push'

// "Want sleep reminders?": asked once, at a moment that makes sense (after
// the first sleep is saved, or from the Sleep card). Only "Turn on" makes the
// phone show its own Allow / Block question. Mount <RemindersPromptHost />
// once (Layout does).

let isOpen = false
const subs = new Set<() => void>()
const setOpen = (v: boolean) => { isOpen = v; subs.forEach((f) => f()) }
export const openRemindersPrompt = () => setOpen(true)

export function RemindersPromptHost() {
  const open = useSyncExternalStore((l) => { subs.add(l); return () => { subs.delete(l) } }, () => isOpen, () => false)
  const close = () => { markRemindersAsked(); setOpen(false) }
  return (
    <Modal open={open} onClose={close} title="Want sleep reminders?">
      {open && <PromptBody onClose={close} />}
    </Modal>
  )
}

function Row({ icon: Icon, title, text, children }: { icon: typeof BellRing; title: string; text: string; children?: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 rounded-2xl bg-ui-raised p-3">
      <span className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 bg-indigo-500/15 text-indigo-500 dark:text-indigo-300">
        <Icon size={17} />
      </span>
      <div className="flex-1 min-w-0">
        <div className="text-[14px] font-semibold text-ui-ink">{title}</div>
        <div className="text-[12.5px] text-ui-muted leading-snug">{text}</div>
      </div>
      {children}
    </div>
  )
}

function PromptBody({ onClose }: { onClose: () => void }) {
  const support = pushSupport()
  const [bedtime, setBedtime] = useState('22:30')
  const [morning, setMorning] = useState(true)
  const [busy, setBusy] = useState(false)
  const [blocked, setBlocked] = useState(false)

  if (support === 'install-first') {
    return (
      <div className="-mt-1">
        <p className="text-[13.5px] text-ui-muted">
          On iPhone, reminders work once LivoraPulse is on your home screen. Install it, open it from the icon, then turn reminders on in Settings.
        </p>
        <button type="button" onClick={() => { onClose(); void startInstall() }}
          className="mt-5 w-full h-11 rounded-2xl text-sm font-bold bg-lp-btn text-lp-btn-ink">Show me how</button>
        <button type="button" onClick={onClose} className="mt-2 w-full h-10 rounded-2xl text-[13px] font-semibold text-ui-muted">Not now</button>
      </div>
    )
  }

  if (blocked) {
    return (
      <div className="-mt-1">
        <p className="text-[13.5px] text-ui-ink">Notifications are blocked for LivoraPulse on this phone.</p>
        <ol className="mt-3 space-y-1.5 text-[13.5px] text-ui-muted list-decimal pl-5">
          <li>Tap the lock or ⓘ icon next to the address, or open your phone&apos;s Settings → Apps → LivoraPulse.</li>
          <li>Set <b className="text-ui-ink">Notifications</b> to Allow.</li>
          <li>Come back and turn reminders on in Settings.</li>
        </ol>
        <button type="button" onClick={onClose} className="mt-5 w-full h-11 rounded-2xl text-sm font-semibold bg-ui-raised text-ui-ink">Got it</button>
      </div>
    )
  }

  const turnOn = async () => {
    setBusy(true)
    try {
      const result = await turnOnPush()
      if (result === 'blocked') { setBlocked(true); markRemindersAsked(); return }
      if (result === 'dismissed') { onClose(); return }
      if (result === 'unavailable') { toast.error("Reminders aren't available on this browser yet."); onClose(); return }
      await saveReminderSettings({ bedtime, wakeReminder: morning })
      toast.success(`Reminders on. Bedtime reminder at ${bedtime}.`)
      onClose()
    } catch {
      toast.error("Couldn't turn reminders on. Check your connection and try again in Settings.")
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="-mt-1">
      <p className="text-[13.5px] text-ui-muted">Two quiet notifications on your phone, nothing else. Change or stop them any time in Settings.</p>
      <div className="mt-4 space-y-2">
        <Row icon={MoonStar} title="At bedtime" text="A nudge to wind down and tap “Going to sleep”.">
          <input type="time" value={bedtime} onChange={(e) => e.target.value && setBedtime(e.target.value)} aria-label="Bedtime reminder time"
            className="w-[122px] h-9 rounded-xl bg-ui-card px-2 text-[14px] font-bold text-ui-ink tabular-nums outline-none focus:ring-2 focus:ring-lp-primary/40" />
        </Row>
        <Row icon={Sunrise} title="In the morning" text="If you're still marked asleep, a reminder to log when you woke up.">
          <button type="button" role="switch" aria-checked={morning} aria-label="Morning reminder" onClick={() => setMorning((v) => !v)}
            className={clsx('relative w-11 h-6 rounded-full transition-colors flex-shrink-0 mt-1.5', morning ? 'bg-lp-primary' : 'bg-ui-line/25')}>
            <span className={clsx('absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-all', morning ? 'left-[22px]' : 'left-0.5')} />
          </button>
        </Row>
      </div>
      <p className="mt-3 text-[12px] text-ui-muted">Your phone will ask to allow notifications. Tap Allow.</p>
      <button type="button" onClick={turnOn} disabled={busy}
        className="mt-4 w-full h-11 rounded-2xl text-sm font-bold bg-lp-btn text-lp-btn-ink disabled:opacity-50 inline-flex items-center justify-center gap-2">
        <BellRing size={16} /> {busy ? 'Turning on…' : 'Turn on reminders'}
      </button>
      <button type="button" onClick={onClose} className="mt-2 w-full h-10 rounded-2xl text-[13px] font-semibold text-ui-muted hover:text-ui-ink">Not now</button>
    </div>
  )
}
