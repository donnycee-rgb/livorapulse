import { useSyncExternalStore } from 'react'
import toast from 'react-hot-toast'
import { Download, EllipsisVertical, ExternalLink, Share, SquarePlus, X } from 'lucide-react'
import Modal from './ui/Modal'
import { hideNudge, installWay, promptInstall, useInstall } from '../lib/install'

// One "Install app" action for every button: the browser's own install
// dialog when it offers one, otherwise a short sheet with the steps for this
// phone. Mount <InstallSheetHost /> once (AppHeader does).

let sheetOpen = false
const subs = new Set<() => void>()
const setSheet = (v: boolean) => { sheetOpen = v; subs.forEach((s) => s()) }

export async function startInstall(): Promise<void> {
  if (installWay() === 'prompt') {
    try {
      if (await promptInstall()) {
        hideNudge()
        toast.success('Installing LivoraPulse. Find it with your other apps.')
      }
    } catch {
      setSheet(true)
    }
    return
  }
  setSheet(true)
}

function Step({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <li className="flex gap-3 items-start">
      <span className="w-6 h-6 rounded-full bg-lp-primary/15 text-lp-primary text-[12px] font-bold flex items-center justify-center flex-shrink-0">{n}</span>
      <span className="text-[14px] text-ui-ink leading-relaxed pt-0.5">{children}</span>
    </li>
  )
}

const Key = ({ children }: { children: React.ReactNode }) => (
  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-ui-raised text-[13px] font-semibold align-middle">{children}</span>
)

export function InstallSheetHost() {
  const open = useSyncExternalStore((l) => { subs.add(l); return () => { subs.delete(l) } }, () => sheetOpen, () => false)
  const { way } = useInstall()
  const site = typeof location === 'undefined' ? 'livorapulse.pages.dev' : location.host

  return (
    <Modal open={open} onClose={() => setSheet(false)} title="Install LivoraPulse">
      <p className="text-[13.5px] text-ui-muted -mt-2">
        It opens like any other app, full screen, and works without a connection.
      </p>

      {way === 'in-app' && (
        <ol className="mt-4 space-y-3">
          <Step n={1}>This page is open inside another app, which can't install apps.</Step>
          <Step n={2}>Tap <Key><EllipsisVertical size={13} /></Key> or <Key><ExternalLink size={13} /></Key> at the top and choose <b>Open in Chrome</b> (or <b>Open in browser</b>).</Step>
          <Step n={3}>There, tap <b>Install app</b> from the profile menu again.</Step>
        </ol>
      )}

      {way === 'ios' && (
        <ol className="mt-4 space-y-3">
          <Step n={1}>Open <b>{site}</b> in <b>Safari</b>.</Step>
          <Step n={2}>Tap <Key><Share size={13} /> Share</Key> at the bottom of the screen.</Step>
          <Step n={3}>Scroll down and tap <Key><SquarePlus size={13} /> Add to Home Screen</Key>, then <b>Add</b>.</Step>
        </ol>
      )}

      {(way === 'menu' || way === 'prompt') && (
        <>
          <ol className="mt-4 space-y-3">
            <Step n={1}>Open <b>{site}</b> in <b>Chrome</b> (not from inside WhatsApp, TikTok or Instagram).</Step>
            <Step n={2}>Tap <Key><EllipsisVertical size={13} /></Key> at the top right.</Step>
            <Step n={3}>Tap <Key><Download size={13} /> Install app</Key>. If you only see <b>Add to Home screen</b>, tap it and choose <b>Install</b>, not "Create shortcut".</Step>
          </ol>
          <p className="mt-4 text-[12.5px] text-ui-muted leading-relaxed">
            Only offered a shortcut? Some phones without Google Play (many Huawei and Honor models) can't install web apps.
            A shortcut still works: it opens LivoraPulse in the browser.
          </p>
        </>
      )}

      <button type="button" onClick={() => setSheet(false)}
        className="mt-5 w-full h-11 rounded-2xl text-sm font-semibold bg-ui-raised text-ui-ink">
        Got it
      </button>
    </Modal>
  )
}

/** A one-line reminder for Home. The caller decides when it shows. */
export function InstallNudge({ onClose }: { onClose: () => void }) {
  return (
    <div className="lp-card rounded-2xl pl-4 pr-2 py-2.5 flex items-center gap-3">
      <span className="w-8 h-8 rounded-xl bg-lp-primary/15 text-lp-primary flex items-center justify-center flex-shrink-0">
        <Download size={16} />
      </span>
      <button type="button" onClick={() => void startInstall()} className="flex-1 min-w-0 text-left">
        <span className="block text-[13.5px] font-semibold text-ui-ink">Install the app</span>
        <span className="block text-[12px] text-ui-muted truncate">Faster, and works offline</span>
      </button>
      <button type="button" onClick={() => void startInstall()}
        className="px-3 h-8 rounded-xl text-[12.5px] font-bold bg-lp-btn text-lp-btn-ink flex-shrink-0">Install</button>
      <button type="button" onClick={onClose} aria-label="Don't show again"
        className="w-8 h-8 rounded-xl flex items-center justify-center text-ui-muted hover:text-ui-ink flex-shrink-0">
        <X size={16} />
      </button>
    </div>
  )
}
