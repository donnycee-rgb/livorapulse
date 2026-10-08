import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import type { LucideIcon } from 'lucide-react'
import {
  ArrowRight, Activity, MonitorSmartphone, Timer, Heart, Leaf, UtensilsCrossed,
  Footprints, Search, Plus, Check, TrendingUp, Flame, Droplets, Sparkles,
  Target, Bot, Globe2, BookOpen, Menu, X, Lock, Sun, Moon,
} from 'lucide-react'

import { useAppStore } from '../store/useAppStore'
import { useAuthStore } from '../store/useAuthStore'

// ─── palette ─────────────────────────────────────────────────────────────────
const C = {
  cream: 'var(--lp-bg)',
  paper: 'var(--lp-paper)',
  ink: 'var(--lp-ink)',
  muted: 'var(--lp-muted)',
  faint: 'var(--lp-faint)',
  line: 'var(--lp-line)',
  btn: 'var(--lp-btn)',
  btnText: 'var(--lp-btn-text)',
  sage: 'var(--lp-accent)',
  green: 'var(--lp-accent)',
  mint: 'var(--lp-tint)',
  mint2: 'var(--lp-tint-2)',
  block: 'var(--lp-block)',
  blockAccent: 'var(--lp-block-accent)',
  glow: 'var(--lp-glow)',
  nav: 'var(--lp-nav)',
  chip: 'var(--lp-chip)',
}

// Primary button colours (green, themed)
const btn = { background: C.btn, color: C.btnText }

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-60px' },
  transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
} as const

// Serif heading with one italic, sage-coloured word — e.g. <Headline>Wellness that fits your <em>life</em></Headline>
function Accent({ children }: { children: ReactNode }) {
  return <em className="font-serif italic font-normal" style={{ color: C.sage }}>{children}</em>
}

// ─── navbar ──────────────────────────────────────────────────────────────────
const navLinks = [
  { label: 'Features', href: '#features' },
  { label: 'How it works', href: '#how-it-works' },
  { label: 'Built for Africa', href: '#built-for-africa' },
  { label: 'LifePulse Score', href: '#score' },
]

function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2 flex-shrink-0" aria-label="LivoraPulse home">
      <span className="w-8 h-8 rounded-xl flex items-center justify-center" style={btn}>
        <svg width="15" height="15" viewBox="0 0 36 36" fill="none" aria-hidden="true">
          <polyline points="3,18 8,18 11,11 14,25 17,8 20,22 23,15 27,18 33,18"
            stroke="white" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
      <span className="font-semibold text-[15px] tracking-tight whitespace-nowrap" style={{ color: C.ink }}>LivoraPulse</span>
    </Link>
  )
}

// Uses the app's own theme setting, so the landing page and the app always match.
// Signed-out visitors only change it locally; signed-in users also save it to their profile.
function ThemeToggle() {
  const theme = useAppStore((s) => s.preferences.theme)
  const toggleTheme = useAppStore((s) => s.toggleTheme)
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const dark = theme === 'dark'

  const onToggle = () => {
    if (isAuthenticated) return toggleTheme()
    useAppStore.setState((s) => ({ preferences: { ...s.preferences, theme: dark ? 'light' : 'dark' } }))
  }

  return (
    <button type="button" onClick={onToggle} aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
      className="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-colors"
      style={{ color: C.ink, border: `1px solid ${C.line}` }}>
      <AnimatePresence mode="wait" initial={false}>
        <motion.span key={dark ? 'sun' : 'moon'} className="flex"
          initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }}
          transition={{ duration: 0.18 }}>
          {dark ? <Sun size={16} /> : <Moon size={16} />}
        </motion.span>
      </AnimatePresence>
    </button>
  )
}

function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    // globals.css makes <body> the scroll container, so read every possible source
    // and listen in the capture phase (element scroll events don't bubble)
    const fn = () => setScrolled(Math.max(window.scrollY, document.documentElement.scrollTop, document.body.scrollTop) > 20)
    fn()
    document.addEventListener('scroll', fn, { passive: true, capture: true })
    return () => document.removeEventListener('scroll', fn, { capture: true })
  }, [])

  return (
    <nav className="fixed top-0 inset-x-0 z-50 transition-all duration-300"
      style={{
        background: scrolled || open ? C.nav : 'transparent',
        backdropFilter: scrolled || open ? 'blur(16px)' : 'none',
        borderBottom: `1px solid ${scrolled ? C.line : 'transparent'}`,
      }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-8 h-16 flex items-center justify-between">
        <Logo />

        <div className="hidden lg:flex items-center gap-8">
          {navLinks.map(l => (
            <a key={l.href} href={l.href} className="text-sm transition-colors hover:opacity-100"
              style={{ color: C.muted }}>{l.label}</a>
          ))}
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2">
          <ThemeToggle />
          <Link to="/login" className="hidden sm:inline-flex px-4 py-2 text-sm font-medium" style={{ color: C.ink }}>
            Log in
          </Link>
          <Link to="/login"
            className="inline-flex items-center gap-2 whitespace-nowrap px-4 sm:pr-1.5 py-2 sm:py-1.5 rounded-full text-sm font-medium transition-transform hover:scale-[1.02]"
            style={btn}>
            Get started
            <span className="hidden sm:flex w-7 h-7 rounded-full items-center justify-center" style={{ background: 'rgba(255,255,255,0.14)' }}>
              <ArrowRight size={13} />
            </span>
          </Link>
          <button type="button" onClick={() => setOpen(o => !o)} aria-label={open ? 'Close menu' : 'Open menu'} aria-expanded={open}
            className="lg:hidden w-9 h-9 rounded-full flex items-center justify-center" style={{ color: C.ink }}>
            {open ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            className="lg:hidden overflow-hidden" style={{ borderTop: `1px solid ${C.line}` }}>
            <div className="px-4 py-3 flex flex-col">
              {navLinks.map(l => (
                <a key={l.href} href={l.href} onClick={() => setOpen(false)} className="py-3 text-[15px]" style={{ color: C.ink }}>
                  {l.label}
                </a>
              ))}
              <Link to="/login" onClick={() => setOpen(false)} className="py-3 text-[15px] font-medium" style={{ color: C.green }}>
                Log in
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  )
}

// ─── phone frame + app screens (demo data) ───────────────────────────────────
function Phone({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`relative rounded-[2.2rem] p-[7px] select-none pointer-events-none ${className}`}
      style={{ background: '#111815', boxShadow: '0 30px 60px rgba(21,33,27,0.28), 0 0 0 1px rgba(255,255,255,0.06) inset' }}
      aria-hidden="true">
      <div className="relative rounded-[1.8rem] overflow-hidden flex flex-col" style={{ background: C.cream, aspectRatio: '9 / 19' }}>
        <div className="flex items-center justify-between px-5 pt-2.5 pb-1 text-[9px] font-semibold" style={{ color: C.ink }}>
          <span>9:41</span>
          <span className="absolute left-1/2 -translate-x-1/2 top-1.5 w-16 h-4 rounded-full bg-[#111815]" />
          <span className="flex gap-0.5">
            <span className="w-3 h-1.5 rounded-[2px] bg-current opacity-70" />
            <span className="w-2 h-1.5 rounded-[2px] bg-current opacity-40" />
          </span>
        </div>
        <div className="flex-1 min-h-0 overflow-hidden">{children}</div>
        <div className="flex justify-center pb-2 pt-1">
          <span className="w-16 h-1 rounded-full" style={{ background: C.faint }} />
        </div>
      </div>
    </div>
  )
}

function ScreenHeader({ title, sub }: { title: string; sub: string }) {
  return (
    <div className="px-4 pt-2 pb-3">
      <div className="text-[9px] font-medium" style={{ color: C.faint }}>{sub}</div>
      <div className="text-[13px] font-bold" style={{ color: C.ink }}>{title}</div>
    </div>
  )
}

function Bar({ pct, color }: { pct: number; color: string }) {
  return (
    <div className="h-1.5 rounded-full" style={{ background: C.line }}>
      <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
    </div>
  )
}

function DashboardScreen() {
  const dims = [
    { label: 'Physical', pct: 78, color: '#3F9A55' },
    { label: 'Nutrition', pct: 65, color: '#E46F5C' },
    { label: 'Digital', pct: 82, color: '#2BA3B8' },
    { label: 'Productivity', pct: 70, color: '#6C6FD8' },
    { label: 'Eco', pct: 88, color: '#86B04B' },
    { label: 'Mood', pct: 74, color: '#E3A33B' },
  ]
  const R = 30
  const circ = 2 * Math.PI * R
  return (
    <div className="pb-2">
      <ScreenHeader sub="Good morning, Amina" title="Today's LifePulse" />
      <div className="mx-3 rounded-2xl p-3 flex items-center gap-3" style={{ background: C.paper }}>
        <div className="relative w-[76px] h-[76px] flex-shrink-0">
          <svg viewBox="0 0 76 76" className="w-full h-full -rotate-90">
            <circle cx="38" cy="38" r={R} fill="none" stroke="var(--lp-line)" strokeWidth="7" />
            <circle cx="38" cy="38" r={R} fill="none" stroke={C.green} strokeWidth="7" strokeLinecap="round"
              strokeDasharray={circ} strokeDashoffset={circ * 0.16} />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-lg font-bold leading-none" style={{ color: C.ink }}>84</span>
            <span className="text-[8px]" style={{ color: C.faint }}>/ 100</span>
          </div>
        </div>
        <div className="space-y-1">
          <span className="inline-flex items-center gap-1 whitespace-nowrap text-[9px] font-semibold px-2 py-0.5 rounded-full"
            style={{ background: C.mint, color: C.green }}><TrendingUp size={9} /> +4 pts</span>
          <div className="flex items-center gap-1 whitespace-nowrap text-[9px]" style={{ color: C.muted }}>
            <Flame size={10} className="text-amber-500" /> 14-day streak · 1.2×
          </div>
        </div>
      </div>
      <div className="mx-3 mt-2 rounded-2xl p-3 space-y-2" style={{ background: C.paper }}>
        {dims.map(d => (
          <div key={d.label}>
            <div className="flex justify-between text-[9px] mb-0.5">
              <span style={{ color: C.muted }}>{d.label}</span>
              <span className="font-semibold" style={{ color: C.ink }}>{d.pct}</span>
            </div>
            <Bar pct={d.pct} color={d.color} />
          </div>
        ))}
      </div>
      <div className="mx-3 mt-2 rounded-2xl px-3 py-2 flex items-center gap-2" style={{ background: C.paper }}>
        <Droplets size={12} className="text-sky-500" />
        <span className="text-[9px] flex-1" style={{ color: C.muted }}>Water</span>
        <span className="text-[9px] font-semibold" style={{ color: C.ink }}>1.9 / 2.5 L</span>
      </div>
    </div>
  )
}

// Values per 100 g, from the app's Kenyan food database
const FOODS = [
  { name: 'Ugali', kcal: 122, p: 2.7, c: 27, f: 0.4 },
  { name: 'Sukuma Wiki', kcal: 38, p: 2.5, c: 5.5, f: 1.5 },
  { name: 'Chapati', kcal: 236, p: 6.3, c: 38, f: 7 },
]

function FoodScreen() {
  return (
    <div className="pb-2">
      <ScreenHeader sub="Nutrition" title="Log a meal" />
      <div className="mx-3 flex items-center gap-2 rounded-xl px-3 py-2 text-[10px]"
        style={{ background: C.paper, border: `1px solid ${C.green}` }}>
        <Search size={11} style={{ color: C.green }} />
        <span style={{ color: C.ink }}>ugali</span>
        <span className="w-px h-3 animate-pulse" style={{ background: C.green }} />
      </div>
      <div className="mx-3 mt-2 space-y-1.5">
        {FOODS.map((r, i) => (
          <div key={r.name} className="flex items-center gap-2 rounded-xl px-2.5 py-2"
            style={{ background: i === 0 ? C.mint : C.paper }}>
            <span className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: i === 0 ? C.paper : C.cream, color: C.green }}>
              <UtensilsCrossed size={10} />
            </span>
            <div className="flex-1">
              <div className="text-[10px] font-semibold" style={{ color: C.ink }}>{r.name}</div>
              <div className="text-[8px]" style={{ color: C.faint }}>{r.kcal} kcal / 100 g</div>
            </div>
            <span className="text-[8px] px-1.5 py-0.5 rounded-md" style={{ background: C.line, color: C.muted }}>P {r.p}</span>
          </div>
        ))}
      </div>
      <div className="mx-3 mt-2 rounded-2xl p-3" style={{ background: C.paper }}>
        <div className="flex justify-between text-[9px] mb-1.5" style={{ color: C.muted }}>
          <span>Today</span><span className="font-semibold" style={{ color: C.ink }}>1,240 / 2,100 kcal</span>
        </div>
        <Bar pct={59} color="#E46F5C" />
      </div>
      <div className="mx-3 mt-2 rounded-xl py-2 flex items-center justify-center gap-1 text-[10px] font-semibold"
        style={btn}>
        <Plus size={11} /> Add Ugali to lunch
      </div>
    </div>
  )
}

function FocusScreen() {
  const R = 40
  const circ = 2 * Math.PI * R
  return (
    <div className="pb-2">
      <ScreenHeader sub="Productivity" title="Focus session" />
      <div className="mx-3 rounded-2xl p-4 flex flex-col items-center" style={{ background: C.paper }}>
        <div className="relative w-[104px] h-[104px]">
          <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
            <circle cx="50" cy="50" r={R} fill="none" stroke="var(--lp-line)" strokeWidth="8" />
            <circle cx="50" cy="50" r={R} fill="none" stroke="#6C6FD8" strokeWidth="8" strokeLinecap="round"
              strokeDasharray={circ} strokeDashoffset={circ * 0.38} />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-xl font-bold leading-none" style={{ color: C.ink }}>15:30</span>
            <span className="text-[8px] mt-0.5" style={{ color: C.faint }}>of 25:00</span>
          </div>
        </div>
        <span className="mt-2 inline-flex items-center gap-1 text-[9px] font-semibold px-2 py-0.5 rounded-full text-amber-500" style={{ background: 'rgba(245,158,11,0.12)' }}>
          <Flame size={9} /> 12-day streak
        </span>
      </div>
      <div className="mx-3 mt-2 rounded-2xl p-3 space-y-2" style={{ background: C.paper }}>
        {[
          { n: 'Revision — Biology', t: '45m', done: true },
          { n: 'Reading', t: '25m', done: true },
          { n: 'Plan tomorrow', t: '15m', done: false },
        ].map(s => (
          <div key={s.n} className="flex items-center gap-2 text-[9px]">
            <span className="w-3.5 h-3.5 rounded flex items-center justify-center"
              style={{ background: s.done ? '#6C6FD8' : C.line, color: '#fff' }}>
              {s.done && <Check size={8} strokeWidth={3} />}
            </span>
            <span className="flex-1" style={{ color: C.ink }}>{s.n}</span>
            <span style={{ color: C.faint }}>{s.t}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function MoodScreen() {
  const faces = ['😣', '😕', '😐', '🙂', '😄']
  return (
    <div className="pb-2">
      <ScreenHeader sub="Mood & mindset" title="How are you feeling?" />
      <div className="mx-3 rounded-2xl p-3" style={{ background: C.paper }}>
        <div className="flex justify-between">
          {faces.map((f, i) => (
            <span key={f} className="w-8 h-8 rounded-full flex items-center justify-center text-base"
              style={{ background: i === 3 ? C.mint : 'transparent', outline: i === 3 ? `1.5px solid ${C.green}` : 'none' }}>{f}</span>
          ))}
        </div>
      </div>
      <div className="mx-3 mt-2 rounded-2xl p-3" style={{ background: C.paper }}>
        <div className="flex items-baseline justify-between mb-1">
          <span className="text-[9px]" style={{ color: C.muted }}>This week</span>
          <span className="text-[9px] font-semibold text-amber-600">Calm · 78</span>
        </div>
        <svg viewBox="0 0 160 56" className="w-full" aria-hidden="true">
          <polyline points="0,44 26,38 52,41 78,28 104,32 130,18 160,12" fill="none" stroke="#E3A33B"
            strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="160" cy="12" r="3.5" fill="#E3A33B" />
        </svg>
        <div className="flex justify-between text-[8px] mt-1" style={{ color: C.faint }}>
          {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => <span key={i}>{d}</span>)}
        </div>
      </div>
      <div className="mx-3 mt-2 rounded-2xl p-3" style={{ background: C.paper }}>
        <div className="flex justify-between text-[9px] mb-1.5" style={{ color: C.muted }}>
          <span>Stress level</span><span className="font-semibold" style={{ color: C.ink }}>Low</span>
        </div>
        <Bar pct={28} color="#E3A33B" />
      </div>
    </div>
  )
}

function OnboardingScreen() {
  const options = ['Mostly seated', 'On my feet', 'Active daily', 'Very active']
  return (
    <div className="pb-2">
      <div className="px-4 pt-2">
        <div className="flex justify-between text-[9px] mb-1.5" style={{ color: C.faint }}>
          <span>Setup</span><span style={{ color: C.green }}>Question 6 of 10</span>
        </div>
        <Bar pct={60} color={C.green} />
      </div>
      <div className="px-4 pt-4 pb-3 text-[13px] font-bold" style={{ color: C.ink }}>How active are you?</div>
      <div className="mx-3 space-y-1.5">
        {options.map((o, i) => (
          <div key={o} className="flex items-center justify-between rounded-xl px-3 py-2.5 text-[10px]"
            style={{
              background: i === 2 ? C.mint : C.paper,
              border: `1px solid ${i === 2 ? C.green : 'transparent'}`,
              color: C.ink,
            }}>
            {o}
            {i === 2 && <Check size={11} style={{ color: C.green }} />}
          </div>
        ))}
      </div>
      <div className="mx-3 mt-3 rounded-2xl p-3" style={{ background: C.paper }}>
        <div className="flex justify-between text-[9px] mb-1.5">
          <span style={{ color: C.muted }}>Your daily step target</span>
          <span className="font-bold" style={{ color: C.ink }}>7,400</span>
        </div>
        <Bar pct={62} color={C.green} />
      </div>
      <div className="mx-3 mt-2 rounded-xl py-2 text-center text-[10px] font-semibold" style={btn}>
        Continue
      </div>
    </div>
  )
}

// ─── hero carousel ───────────────────────────────────────────────────────────
type Slide = {
  eyebrow: string
  before: string
  accent: string
  after?: string
  sub: string
  image: string
  imageAlt: string
  screen: ReactNode
  chip: { Icon: LucideIcon; label: string; value: string }
}

const SLIDES: Slide[] = [
  {
    eyebrow: 'Built for Kenya · Free to start',
    before: 'Wellness that fits your ',
    accent: 'life',
    sub: 'Track activity, food, screen time, focus, mood and eco habits — and see it all come together in one daily LifePulse Score.',
    image: '/images/wellness%20tracking.jpg',
    imageAlt: 'A woman out for a morning run, checking her fitness stats',
    screen: <DashboardScreen />,
    chip: { Icon: TrendingUp, label: 'LifePulse Score', value: '84 / 100' },
  },
  {
    eyebrow: '54 Kenyan dishes and counting',
    before: 'Eat Kenyan. Track ',
    accent: 'smarter',
    after: '.',
    sub: 'Search ugali, sukuma wiki, githeri or pilau and get real calories and macros — no more guessing with foreign food apps.',
    image: '/images/Nutrition.jpg',
    imageAlt: 'A colourful, healthy bowl of vegetables, grains and chicken',
    screen: <FoodScreen />,
    chip: { Icon: UtensilsCrossed, label: 'Ugali, 100 g', value: '122 kcal' },
  },
  {
    eyebrow: 'Focus & digital balance',
    before: 'Less scrolling. More ',
    accent: 'doing',
    after: '.',
    sub: 'Focus sessions, screen-time goals and streaks that reward consistency — so your best habits keep growing.',
    image: '/images/Productivity.jpg',
    imageAlt: 'A tidy desk with a computer, notebook and coffee, set up for focused work',
    screen: <FocusScreen />,
    chip: { Icon: Flame, label: 'Focus streak', value: '12 days' },
  },
  {
    eyebrow: 'Mood, stress & cycle insights',
    before: 'Feel better, ',
    accent: 'week by week',
    after: '.',
    sub: 'Log how you feel in seconds and see how sleep, movement and screen time shape your mood over time.',
    image: '/images/Mood.jpg',
    imageAlt: 'An illustration of a person meditating peacefully',
    screen: <MoodScreen />,
    chip: { Icon: Heart, label: 'Mood this week', value: 'Calm' },
  },
]

const SLIDE_MS = 6000
const SLIDE_TRANSITION = 'transform 900ms cubic-bezier(0.65, 0, 0.35, 1)'

// Auto-advancing index that always slides left. The track renders a copy of
// the first slide at the end; when we land on it we jump back to 0 without animating.
function useAutoSlide(count: number) {
  const [index, setIndex] = useState(0)
  const [animate, setAnimate] = useState(true)

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduce) setAnimate(false)
    const id = window.setInterval(() => {
      if (document.hidden) return
      setAnimate(!reduce)
      setIndex(i => (i >= count ? 1 : i + 1))
    }, SLIDE_MS)
    return () => window.clearInterval(id)
  }, [count])

  const onTransitionEnd = () => {
    if (index === count) {
      setAnimate(false)
      setIndex(0)
    }
  }

  // Without animation there is no transitionend, so wrap immediately
  useEffect(() => {
    if (!animate && index === count) setIndex(0)
  }, [animate, index, count])

  return { index, animate, onTransitionEnd, active: index % count }
}

function SlideTrack({ index, animate, onTransitionEnd, children }: {
  index: number; animate: boolean; onTransitionEnd?: () => void; children: ReactNode
}) {
  return (
    <div className="overflow-hidden">
      <div className="flex" onTransitionEnd={onTransitionEnd}
        style={{ transform: `translateX(-${index * 100}%)`, transition: animate ? SLIDE_TRANSITION : 'none' }}>
        {children}
      </div>
    </div>
  )
}

function Hero() {
  const { index, animate, onTransitionEnd, active } = useAutoSlide(SLIDES.length)
  const slides = [...SLIDES, SLIDES[0]]

  return (
    <section className="relative pt-24 sm:pt-28 pb-12 sm:pb-16 overflow-hidden" aria-roledescription="carousel" aria-label="LivoraPulse highlights">
      <div className="absolute -top-40 -right-40 w-[560px] h-[560px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, var(--lp-glow) 0%, transparent 70%)' }} />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-8 grid lg:grid-cols-[1fr_1.05fr] gap-10 lg:gap-12 items-center">
        {/* Text track */}
        <div className="min-w-0">
          <SlideTrack index={index} animate={animate} onTransitionEnd={onTransitionEnd}>
            {slides.map((s, i) => {
              const Heading = i === 0 ? 'h1' : 'p'
              return (
                <div key={i} className="w-full flex-shrink-0 pr-2" aria-hidden={i !== index}>
                  <span className="inline-flex items-center gap-2 text-xs px-3 py-1.5 rounded-full mb-6"
                    style={{ background: C.paper, color: C.muted, border: `1px solid ${C.line}` }}>
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: C.green }} />
                    {s.eyebrow}
                  </span>
                  <Heading className="font-serif font-normal leading-[1.05] tracking-tight mb-5"
                    style={{ color: C.ink, fontSize: 'clamp(2.5rem, 5.6vw, 4.6rem)' }}>
                    {s.before}<Accent>{s.accent}</Accent>{s.after}
                  </Heading>
                  <p className="text-base sm:text-lg leading-relaxed max-w-md" style={{ color: C.muted }}>{s.sub}</p>
                </div>
              )
            })}
          </SlideTrack>

          <div className="flex flex-wrap items-center gap-3 mt-8">
            <Link to="/login"
              className="inline-flex items-center gap-2 pl-5 pr-2 py-2 rounded-full text-sm font-medium transition-transform hover:scale-[1.02]"
              style={btn}>
              Start free today
              <span className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.14)' }}>
                <ArrowRight size={14} />
              </span>
            </Link>
            <a href="#how-it-works" className="inline-flex items-center gap-2 px-4 py-3 text-sm font-medium" style={{ color: C.ink }}>
              See how it works
            </a>
          </div>

          {/* Passive progress indicator — not interactive */}
          <div className="flex gap-1.5 mt-8" aria-hidden="true">
            {SLIDES.map((_, i) => (
              <span key={i} className="h-1 rounded-full overflow-hidden" style={{ width: i === active ? 40 : 16, background: C.line, transition: 'width 400ms' }}>
                {i === active && (
                  <motion.span key={`${active}-${index}`} className="block h-full rounded-full" style={{ background: C.btn }}
                    initial={{ width: '0%' }} animate={{ width: '100%' }} transition={{ duration: SLIDE_MS / 1000, ease: 'linear' }} />
                )}
              </span>
            ))}
          </div>
        </div>

        {/* Visual track — photo with the matching app screen on a phone */}
        <div className="min-w-0">
          <SlideTrack index={index} animate={animate}>
            {slides.map((s, i) => (
              <div key={i} className="w-full flex-shrink-0 px-1" aria-hidden={i !== index}>
                <div className="relative h-[450px] sm:h-[520px]">
                  <div className="absolute inset-y-0 right-0 left-[18%] sm:left-[22%] rounded-[2rem] overflow-hidden" style={{ background: C.mint }}>
                    <img src={s.image} alt={s.imageAlt} className="w-full h-full object-cover"
                      {...(i === 0 ? { fetchPriority: 'high' as const } : { loading: 'lazy' as const })} decoding="async" />
                    <div className="absolute inset-0" style={{ background: 'linear-gradient(90deg, rgba(21,33,27,0.18), transparent 45%)' }} />
                  </div>
                  <Phone className="absolute left-0 top-1/2 -translate-y-1/2 w-[200px] sm:w-[232px]">{s.screen}</Phone>
                  <div className="absolute right-3 sm:right-5 bottom-4 sm:bottom-6 flex items-center gap-2.5 pl-2 pr-4 py-2 rounded-2xl"
                    style={{ background: C.chip, boxShadow: '0 10px 30px rgba(21,33,27,0.15)' }} aria-hidden="true">
                    <span className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: C.mint, color: C.green }}>
                      <s.chip.Icon size={14} />
                    </span>
                    <span>
                      <span className="block text-[10px]" style={{ color: C.faint }}>{s.chip.label}</span>
                      <span className="block text-sm font-semibold" style={{ color: C.ink }}>{s.chip.value}</span>
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </SlideTrack>
        </div>
      </div>
    </section>
  )
}

// ─── highlights strip ────────────────────────────────────────────────────────
const highlights = [
  { Icon: UtensilsCrossed, title: 'Kenyan food database', desc: '54 local dishes with real calories and macros.' },
  { Icon: Target, title: 'Personal targets', desc: 'Goals set from your own 10-question profile.' },
  { Icon: Bot, title: 'AI wellness coach', desc: 'Ask questions and get answers based on your data.' },
  { Icon: Lock, title: 'Your data, your account', desc: 'Sign up free with email or Google.' },
]

function Highlights() {
  return (
    <section className="px-4 sm:px-8">
      <motion.div {...fadeUp} className="max-w-7xl mx-auto rounded-[1.75rem] grid sm:grid-cols-2 lg:grid-cols-4"
        style={{ background: C.paper, border: `1px solid ${C.line}` }}>
        {highlights.map(({ Icon, title, desc }, i) => (
          <div key={title} className="p-6 sm:p-7"
            style={{ borderTop: i > 0 ? `1px solid ${C.line}` : 'none' }}>
            <span className="w-10 h-10 rounded-full flex items-center justify-center mb-4" style={{ border: `1px solid ${C.line}`, color: C.ink }}>
              <Icon size={17} />
            </span>
            <h3 className="text-[15px] font-semibold mb-1" style={{ color: C.ink }}>{title}</h3>
            <p className="text-sm leading-relaxed" style={{ color: C.muted }}>{desc}</p>
          </div>
        ))}
      </motion.div>
    </section>
  )
}

// ─── dimensions ──────────────────────────────────────────────────────────────
function MiniBars({ values, color }: { values: number[]; color: string }) {
  return (
    <div className="flex items-end gap-1.5 h-16" aria-hidden="true">
      {values.map((v, i) => (
        <span key={i} className="flex-1 rounded-md" style={{ height: `${v}%`, background: color, opacity: i === values.length - 2 ? 1 : 0.35 }} />
      ))}
    </div>
  )
}

function MiniLine({ points, color }: { points: string; color: string }) {
  return (
    <svg viewBox="0 0 160 64" className="w-full h-16" aria-hidden="true">
      <polyline points={points} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

const dimensions: { Icon: LucideIcon; title: string; desc: string; stat: string; color: string; preview: ReactNode }[] = [
  {
    Icon: Activity, title: 'Physical', desc: 'Steps, sleep and GPS walks you can replay on a map.', stat: '8,240 steps', color: '#3F9A55',
    preview: (
      <svg viewBox="0 0 160 64" className="w-full h-16" aria-hidden="true">
        <path d="M8,52 C30,44 44,50 64,36 C82,23 100,34 118,24 C134,15 144,20 152,12" fill="none" stroke="#3F9A55" strokeWidth="2.5" strokeLinecap="round" strokeDasharray="5 5" />
        <circle cx="8" cy="52" r="4" fill="#3F9A55" /><circle cx="152" cy="12" r="4" fill="#15211B" />
      </svg>
    ),
  },
  { Icon: UtensilsCrossed, title: 'Nutrition', desc: 'Kenyan meals, water and macros against your own targets.', stat: '1,240 kcal', color: '#E46F5C', preview: <MiniBars values={[55, 70, 40, 85, 60, 78, 50]} color="#E46F5C" /> },
  { Icon: MonitorSmartphone, title: 'Digital', desc: 'Screen-time goals that reward time spent off your phone.', stat: '3h 12m', color: '#2BA3B8', preview: <MiniLine points="0,20 26,26 52,22 78,34 104,30 130,42 160,46" color="#2BA3B8" /> },
  { Icon: Timer, title: 'Productivity', desc: 'Focus and study sessions that build streaks.', stat: '12-day streak', color: '#6C6FD8', preview: <MiniBars values={[40, 55, 65, 50, 80, 90, 70]} color="#6C6FD8" /> },
  { Icon: Leaf, title: 'Eco', desc: 'Transport choices, recycling and your daily carbon impact.', stat: '2.4 kg CO₂', color: '#86B04B', preview: <MiniLine points="0,18 26,22 52,30 78,28 104,38 130,40 160,48" color="#86B04B" /> },
  { Icon: Heart, title: 'Mood', desc: 'Mood, stress and cycle insights in one calm view.', stat: 'Calm · 78', color: '#E3A33B', preview: <MiniLine points="0,48 26,40 52,44 78,30 104,34 130,20 160,14" color="#E3A33B" /> },
]

function Dimensions() {
  return (
    <section id="features" className="px-4 sm:px-8 pt-16 sm:pt-24 scroll-mt-20">
      <div className="max-w-7xl mx-auto rounded-[2rem] p-6 sm:p-10 lg:p-12 grid lg:grid-cols-[0.8fr_1.2fr] gap-10"
        style={{ background: C.mint }}>
        <motion.div {...fadeUp} className="lg:pt-4">
          <span className="text-[11px] font-semibold uppercase tracking-[0.14em]" style={{ color: C.sage }}>Six dimensions</span>
          <h2 className="font-serif font-normal leading-[1.08] mt-3 mb-5" style={{ color: C.ink, fontSize: 'clamp(2rem, 4vw, 3.2rem)' }}>
            Care for every <Accent>part</Accent> of your day
          </h2>
          <p className="text-base leading-relaxed mb-8 max-w-sm" style={{ color: C.muted }}>
            Each dimension has its own targets. Together they make up your LifePulse Score — so you can see what's working and what needs a little attention.
          </p>
          <Link to="/login" className="inline-flex items-center gap-2 pl-5 pr-2 py-2 rounded-full text-sm font-medium" style={btn}>
            Start tracking
            <span className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.14)' }}><ArrowRight size={14} /></span>
          </Link>
        </motion.div>

        <div id="dimensions" className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4 scroll-mt-24">
          {dimensions.map(({ Icon, title, desc, stat, color, preview }, i) => (
            <motion.div key={title} {...fadeUp} transition={{ ...fadeUp.transition, delay: (i % 3) * 0.06 }}
              className="rounded-3xl p-5 flex flex-col" style={{ background: C.paper }}>
              <div className="rounded-2xl p-3 mb-4" style={{ background: C.cream }}>
                <div className="flex items-center justify-between mb-2">
                  <span className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: `${color}1F`, color }}>
                    <Icon size={14} />
                  </span>
                  <span className="text-[11px] font-semibold" style={{ color: C.ink }}>{stat}</span>
                </div>
                {preview}
              </div>
              <h3 className="font-semibold text-[15px] mb-1" style={{ color: C.ink }}>{title}</h3>
              <p className="text-sm leading-relaxed" style={{ color: C.muted }}>{desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── how it works ────────────────────────────────────────────────────────────
const steps = [
  { title: 'Tell us about yourself', desc: 'Answer 10 quick questions about your body, goals, sleep, activity and mood.' },
  { title: 'Get your own targets', desc: 'Your step, calorie, screen-time and focus goals are calculated for you.' },
  { title: 'Track and grow', desc: 'Log your day, watch your score and let your streak raise the bar.' },
]

function HowItWorks() {
  return (
    <section id="how-it-works" className="px-4 sm:px-8 pt-16 sm:pt-24 scroll-mt-20">
      <div className="max-w-7xl mx-auto grid lg:grid-cols-[1.25fr_0.75fr] gap-12 items-center">
        <motion.div {...fadeUp}>
          <span className="text-[11px] font-semibold uppercase tracking-[0.14em]" style={{ color: C.sage }}>How it works</span>
          <h2 className="font-serif font-normal leading-[1.08] mt-3 mb-12" style={{ color: C.ink, fontSize: 'clamp(2rem, 4vw, 3.2rem)' }}>
            Better habits in three <Accent>simple</Accent> steps
          </h2>
          <ol className="grid sm:grid-cols-3 gap-8 sm:gap-6 relative">
            <span className="hidden sm:block absolute top-5 left-5 right-[16%] h-px" style={{ background: C.line }} aria-hidden="true" />
            {steps.map((s, i) => (
              <li key={s.title} className="relative">
                <span className="relative w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold mb-5"
                  style={{ background: i === 0 ? C.btn : C.paper, color: i === 0 ? C.btnText : C.ink, border: `1px solid ${i === 0 ? C.btn : C.line}` }}>
                  {i + 1}
                </span>
                <h3 className="font-semibold text-[15px] mb-1.5" style={{ color: C.ink }}>{s.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: C.muted }}>{s.desc}</p>
              </li>
            ))}
          </ol>
        </motion.div>

        <motion.div {...fadeUp} className="flex justify-center lg:justify-end">
          <div className="relative">
            <div className="absolute -inset-8 rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, var(--lp-glow), transparent 70%)' }} />
            <Phone className="relative w-[240px] sm:w-[260px]"><OnboardingScreen /></Phone>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

// ─── built for africa ────────────────────────────────────────────────────────
const africaTiles = [
  { Icon: BookOpen, title: '54 local dishes', desc: 'From ugali and githeri to pilau and mishkaki.' },
  { Icon: Globe2, title: 'Local names work', desc: 'Search the way you speak — wali, maharagwe, mchicha.' },
  { Icon: Search, title: 'Global fallback', desc: 'Anything else is looked up in Open Food Facts.' },
  { Icon: Sparkles, title: 'A coach that gets it', desc: 'Your AI coach knows Kenyan food, not just salads.' },
]

const FOOD_TABLE = [
  { name: 'Ugali', serving: '1 medium piece', kcal: 183 },
  { name: 'Sukuma Wiki', serving: '1 cup cooked', kcal: 49 },
  { name: 'Githeri', serving: '1 cup', kcal: 341 },
  { name: 'Chapati', serving: '1 chapati', kcal: 142 },
  { name: 'Nyama Choma', serving: '1 serving', kcal: 323 },
  { name: 'Pilau', serving: '1 cup cooked', kcal: 350 },
]

function BuiltForAfrica() {
  return (
    <section id="built-for-africa" className="px-4 sm:px-8 pt-16 sm:pt-24 scroll-mt-20">
      <div className="max-w-7xl mx-auto rounded-[2rem] overflow-hidden grid lg:grid-cols-2" style={{ background: C.block }}>
        <motion.div {...fadeUp} className="p-6 sm:p-10 lg:p-12 flex items-center">
          <div className="w-full rounded-3xl p-5 sm:p-6" style={{ background: C.cream }}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-[11px]" style={{ color: C.faint }}>From the LivoraPulse food database</div>
                <div className="font-semibold" style={{ color: C.ink }}>Popular Kenyan meals</div>
              </div>
              <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full" style={{ background: C.mint, color: C.green }}>per serving</span>
            </div>
            <ul className="divide-y" style={{ borderColor: C.line }}>
              {FOOD_TABLE.map(f => (
                <li key={f.name} className="flex items-center gap-3 py-3" style={{ borderColor: C.line }}>
                  <span className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: C.paper, color: C.green }}>
                    <UtensilsCrossed size={14} />
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="block text-sm font-medium" style={{ color: C.ink }}>{f.name}</span>
                    <span className="block text-xs" style={{ color: C.faint }}>{f.serving}</span>
                  </span>
                  <span className="text-sm font-semibold tabular-nums" style={{ color: C.ink }}>{f.kcal} kcal</span>
                </li>
              ))}
            </ul>
          </div>
        </motion.div>

        <motion.div {...fadeUp} className="p-6 sm:p-10 lg:p-12 lg:pl-4 flex flex-col justify-center">
          <span className="text-[11px] font-semibold uppercase tracking-[0.14em]" style={{ color: 'rgba(255,255,255,0.55)' }}>Built for Africa</span>
          <h2 className="font-serif font-normal leading-[1.08] mt-3 mb-5 text-white" style={{ fontSize: 'clamp(2rem, 4vw, 3.2rem)' }}>
            More than a calorie counter. <em className="font-serif italic" style={{ color: C.blockAccent }}>Made for Kenya.</em>
          </h2>
          <p className="text-base leading-relaxed mb-8 max-w-md" style={{ color: 'rgba(255,255,255,0.68)' }}>
            Most wellness apps don't know what ugali is. LivoraPulse was built around the food, routines and realities of life in Kenya and East Africa.
          </p>
          <div className="grid grid-cols-2 gap-3">
            {africaTiles.map(({ Icon, title, desc }) => (
              <div key={title} className="rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <Icon size={18} className="mb-3" style={{ color: C.blockAccent }} />
                <h3 className="text-sm font-semibold text-white mb-1">{title}</h3>
                <p className="text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.55)' }}>{desc}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  )
}

// ─── lifepulse score ─────────────────────────────────────────────────────────
const streakTiers = [
  { days: '7 days', mult: '1.1×' },
  { days: '14 days', mult: '1.2×' },
  { days: '30 days', mult: '1.35×' },
  { days: '60 days', mult: '1.5×' },
]

function Score() {
  return (
    <section id="score" className="px-4 sm:px-8 pt-16 sm:pt-24 scroll-mt-20">
      <div className="max-w-7xl mx-auto grid lg:grid-cols-[0.8fr_1.2fr] gap-12 items-center">
        <motion.div {...fadeUp} className="flex justify-center order-2 lg:order-1">
          <div className="relative">
            <div className="absolute -inset-8 rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, var(--lp-glow), transparent 70%)' }} />
            <Phone className="relative w-[240px] sm:w-[260px]"><DashboardScreen /></Phone>
          </div>
        </motion.div>

        <motion.div {...fadeUp} className="order-1 lg:order-2">
          <span className="text-[11px] font-semibold uppercase tracking-[0.14em]" style={{ color: C.sage }}>Your LifePulse Score</span>
          <h2 className="font-serif font-normal leading-[1.08] mt-3 mb-5" style={{ color: C.ink, fontSize: 'clamp(2rem, 4vw, 3.2rem)' }}>
            One score that <Accent>grows with you</Accent>
          </h2>
          <p className="text-base leading-relaxed mb-8 max-w-lg" style={{ color: C.muted }}>
            Every day your six dimensions roll up into one score out of 100. Keep a streak going and your targets rise gradually — so you're always moving forward, never starting over.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-xl">
            {streakTiers.map((t, i) => (
              <div key={t.days} className="rounded-2xl p-4" style={{ background: i === 1 ? C.block : C.paper, border: `1px solid ${i === 1 ? C.block : C.line}` }}>
                <div className="text-xs mb-1" style={{ color: i === 1 ? 'rgba(255,255,255,0.65)' : C.faint }}>{t.days} streak</div>
                <div className="font-serif text-2xl" style={{ color: i === 1 ? '#fff' : C.ink }}>{t.mult}</div>
              </div>
            ))}
          </div>
          <p className="text-xs mt-3" style={{ color: C.faint }}>Streak multiplier applied to your daily targets.</p>
        </motion.div>
      </div>
    </section>
  )
}

// ─── closing call to action ──────────────────────────────────────────────────
function ClosingCta() {
  return (
    <section className="px-4 sm:px-8 pt-16 sm:pt-24">
      <motion.div {...fadeUp} className="relative max-w-7xl mx-auto rounded-[2rem] overflow-hidden px-6 sm:px-12 py-14 sm:py-16"
        style={{ background: `linear-gradient(120deg, ${C.mint} 0%, ${C.mint2} 100%)` }}>
        <Leaf className="absolute -right-6 -bottom-8 w-56 h-56 opacity-[0.1]" style={{ color: C.btn }} aria-hidden="true" />
        <div className="relative flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-[0.14em]" style={{ color: C.sage }}>Your health, your way</span>
            <h2 className="font-serif font-normal leading-[1.08] mt-3" style={{ color: C.ink, fontSize: 'clamp(2rem, 4.4vw, 3.6rem)' }}>
              Start feeling better <Accent>today</Accent>
            </h2>
          </div>
          <div className="flex flex-col items-start md:items-end gap-2">
            <Link to="/login" className="inline-flex items-center gap-2 pl-5 pr-2 py-2 rounded-full text-sm font-medium transition-transform hover:scale-[1.02]"
              style={btn}>
              Get started free
              <span className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.14)' }}><ArrowRight size={14} /></span>
            </Link>
            <span className="text-xs" style={{ color: C.muted }}>Free to use · Sign up with email or Google</span>
          </div>
        </div>
      </motion.div>
    </section>
  )
}

// ─── footer ──────────────────────────────────────────────────────────────────
function Footer() {
  return (
    <footer className="px-4 sm:px-8 pt-16 pb-8">
      <div className="max-w-7xl mx-auto">
        <div className="grid sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr] gap-10 pb-10" style={{ borderBottom: `1px solid ${C.line}` }}>
          <div>
            <Logo />
            <p className="text-sm leading-relaxed mt-4 max-w-xs" style={{ color: C.muted }}>
              Tracking every dimension of your wellness — built for Kenya and East Africa.
            </p>
          </div>
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-[0.12em] mb-4" style={{ color: C.ink }}>Product</h3>
            <ul className="space-y-2.5 text-sm">
              {navLinks.map(l => (
                <li key={l.href}><a href={l.href} className="hover:underline" style={{ color: C.muted }}>{l.label}</a></li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-[0.12em] mb-4" style={{ color: C.ink }}>Account</h3>
            <ul className="space-y-2.5 text-sm">
              <li><Link to="/login" className="hover:underline" style={{ color: C.muted }}>Log in</Link></li>
              <li><Link to="/login" className="hover:underline" style={{ color: C.muted }}>Create a free account</Link></li>
            </ul>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row justify-between gap-2 pt-6 text-xs" style={{ color: C.faint }}>
          <span>© {new Date().getFullYear()} LivoraPulse. All rights reserved.</span>
          <span className="inline-flex items-center gap-1.5"><Footprints size={12} /> Made in Kenya</span>
        </div>
      </div>
    </footer>
  )
}

// ─── page ────────────────────────────────────────────────────────────────────
export default function LandingPage() {
  return (
    <div className="landing min-h-screen font-sans overflow-x-hidden transition-colors duration-300" style={{ background: C.cream, color: C.ink }}>
      <Navbar />
      <main>
        <Hero />
        <Highlights />
        <Dimensions />
        <HowItWorks />
        <BuiltForAfrica />
        <Score />
        <ClosingCta />
      </main>
      <Footer />
    </div>
  )
}

