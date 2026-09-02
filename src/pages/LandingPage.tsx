import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion'
import type { LucideIcon } from 'lucide-react'
import {
  ArrowRight, Activity, MonitorSmartphone, Timer,
  Heart, Leaf, UtensilsCrossed, Footprints, MapPin, Flame,
  Droplets, Search, Database, Scale, Check, TrendingUp, Zap, Play, Plus,
  Globe, Mountain, Wheat, FlaskConical, Sun, Moon, Menu, X,
} from 'lucide-react'

// ─── theme ───────────────────────────────────────────────────────────────────
function useDark() {
  const [dark, setDark] = useState(() =>
    typeof window !== 'undefined'
      ? window.matchMedia('(prefers-color-scheme: dark)').matches
      : true
  )
  return { dark, toggle: () => setDark(d => !d) }
}

const ACCENT = '#22C55E'

const scrollTop = () => window.scrollTo({ top: 0, behavior: 'smooth' })

// ─── navbar ──────────────────────────────────────────────────────────────────
function Navbar({ dark, onToggle }: { dark: boolean; onToggle: () => void }) {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  const [hovered, setHovered] = useState<string | null>(null)

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 30)
    window.addEventListener('scroll', fn)
    return () => window.removeEventListener('scroll', fn)
  }, [])

  const navLinks = ['Features', 'How it works', 'Dimensions']

  return (
    <motion.nav
      initial={{ y: -32, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      className="fixed top-0 inset-x-0 z-50"
    >
      <div className="absolute top-0 inset-x-0 h-px"
        style={{ background: 'linear-gradient(90deg, transparent 0%, #22C55E 40%, #22C55E 60%, transparent 100%)', opacity: scrolled ? 0.6 : 0, transition: 'opacity 0.4s' }} />

      <div
        className="transition-all duration-300"
        style={{
          background: dark
            ? scrolled ? 'rgba(11,15,23,0.95)' : 'rgba(11,15,23,0.72)'
            : scrolled ? 'rgba(244,246,249,0.97)' : 'rgba(244,246,249,0.8)',
          backdropFilter: 'blur(20px) saturate(160%)',
          borderBottom: dark
            ? '1px solid rgba(34,197,94,0.08)'
            : '1px solid rgba(34,197,94,0.12)',
          boxShadow: scrolled
            ? dark ? '0 4px 32px rgba(0,0,0,0.5)' : '0 4px 24px rgba(0,0,0,0.08)'
            : 'none',
        }}
      >
        <div className="max-w-7xl mx-auto px-5 sm:px-8 h-14 flex items-center justify-between">

          <Link to="/" className="flex items-center gap-2.5 flex-shrink-0 group">
            <div className="relative">
              <div className="absolute inset-0 rounded-xl blur-sm opacity-60 group-hover:opacity-90 transition-opacity"
                style={{ background: 'linear-gradient(135deg, #22C55E, #4ADE80)' }} />
              <div className="relative w-8 h-8 rounded-xl flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #16A34A 0%, #22C55E 50%, #4ADE80 100%)', boxShadow: '0 2px 12px rgba(34,197,94,0.4), inset 0 1px 0 rgba(255,255,255,0.25)' }}>
                <svg width="15" height="15" viewBox="0 0 36 36" fill="none">
                  <polyline points="3,18 8,18 11,11 14,25 17,8 20,22 23,15 27,18 33,18"
                    stroke="white" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </div>
            <div className="flex flex-col leading-none">
              <span className="font-black text-[15px] tracking-tight" style={{ color: dark ? '#fff' : '#0B0F17' }}>
                Livora<span style={{ color: ACCENT }}>Pulse</span>
              </span>
              <span className="text-[9px] font-semibold uppercase tracking-[0.12em]"
                style={{ color: dark ? 'rgba(34,197,94,0.6)' : 'rgba(22,163,74,0.7)' }}>
                Wellness OS
              </span>
            </div>
          </Link>

          <div className="hidden md:flex items-center p-1 rounded-2xl gap-0.5"
            style={{
              background: dark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)',
              border: dark ? '1px solid rgba(255,255,255,0.07)' : '1px solid rgba(0,0,0,0.07)',
            }}>
            {navLinks.map(l => (
              <a
                key={l}
                href={`#${l.toLowerCase().replace(/ /g, '-')}`}
                onMouseEnter={() => setHovered(l)}
                onMouseLeave={() => setHovered(null)}
                className="relative px-4 py-1.5 rounded-xl text-sm font-medium transition-all duration-200"
                style={{ color: hovered === l ? (dark ? '#fff' : '#0B0F17') : dark ? 'rgba(255,255,255,0.55)' : 'rgba(0,0,0,0.5)' }}
              >
                {hovered === l && (
                  <motion.span
                    layoutId="nav-pill"
                    className="absolute inset-0 rounded-xl"
                    style={{ background: dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)' }}
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
                <span className="relative z-10">{l}</span>
              </a>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button type="button" onClick={onToggle}
              className="relative w-8 h-8 rounded-xl flex items-center justify-center overflow-hidden transition-all duration-200"
              style={{
                background: dark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)',
                border: dark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.08)',
                color: dark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.55)',
              }}>
              <AnimatePresence mode="wait" initial={false}>
                <motion.span key={dark ? 'sun' : 'moon'}
                  initial={{ rotate: -90, opacity: 0, scale: 0.5 }}
                  animate={{ rotate: 0, opacity: 1, scale: 1 }}
                  exit={{ rotate: 90, opacity: 0, scale: 0.5 }}
                  transition={{ duration: 0.2 }}
                  className="absolute flex items-center justify-center">
                  {dark ? <Sun size={13} /> : <Moon size={13} />}
                </motion.span>
              </AnimatePresence>
            </button>

            <Link to="/login"
              className="hidden md:flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-sm font-semibold transition-all duration-200"
              style={{
                color: dark ? 'rgba(255,255,255,0.65)' : 'rgba(0,0,0,0.6)',
              }}
              onMouseEnter={e => (e.currentTarget.style.color = dark ? '#fff' : '#000')}
              onMouseLeave={e => (e.currentTarget.style.color = dark ? 'rgba(255,255,255,0.65)' : 'rgba(0,0,0,0.6)')}>
              Sign in
            </Link>

            <Link to="/login"
              className="hidden md:flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-sm font-bold text-white transition-all duration-200 hover:scale-[1.03] active:scale-[0.97]"
              style={{
                background: 'linear-gradient(135deg, #22C55E 0%, #16A34A 100%)',
                boxShadow: '0 2px 12px rgba(34,197,94,0.35), inset 0 1px 0 rgba(255,255,255,0.15)',
              }}>
              Get started
              <ArrowRight size={12} />
            </Link>

            <button type="button" onClick={() => setOpen(o => !o)}
              className="md:hidden w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: dark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)', color: dark ? '#fff' : '#000' }}>
              {open ? <X size={14} /> : <Menu size={14} />}
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="md:hidden mx-3 mt-1 rounded-2xl overflow-hidden"
            style={{
              background: dark ? 'rgba(11,15,23,0.97)' : 'rgba(255,255,255,0.98)',
              backdropFilter: 'blur(24px)',
              border: dark ? '1px solid rgba(34,197,94,0.12)' : '1px solid rgba(34,197,94,0.14)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
            }}>
            <div className="h-0.5 w-full" style={{ background: 'linear-gradient(90deg, #22C55E, #4ADE80)' }} />
            <div className="p-3 space-y-1">
              {navLinks.map(l => (
                <a key={l} href={`#${l.toLowerCase().replace(/ /g, '-')}`} onClick={() => setOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all"
                  style={{ color: dark ? 'rgba(255,255,255,0.75)' : 'rgba(0,0,0,0.7)' }}>
                  <span className="w-1.5 h-1.5 rounded-full opacity-60" style={{ background: ACCENT }} />
                  {l}
                </a>
              ))}
              <div className="pt-1 border-t" style={{ borderColor: dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }}>
                <Link to="/login" onClick={() => setOpen(false)}
                  className="flex items-center justify-center gap-2 mt-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white"
                  style={{ background: 'linear-gradient(135deg, #22C55E 0%, #16A34A 100%)', boxShadow: '0 2px 12px rgba(34,197,94,0.3)' }}>
                  Get started free <ArrowRight size={12} />
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  )
}

// ─── dashboard mockup ────────────────────────────────────────────────────────
const WIDGET = '#0A1019'
const BARS = [35, 58, 44, 72, 56, 88, 64]

function DashboardMockup() {
  return (
    <div className="relative select-none">
      {/* ambient glow */}
      <div className="absolute -inset-12 pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(34,197,94,0.16) 0%, transparent 68%)', filter: 'blur(48px)' }} />

      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="relative rounded-3xl overflow-hidden"
        style={{
          background: 'linear-gradient(180deg, #101827 0%, #0B0F17 100%)',
          border: '1px solid rgba(255,255,255,0.08)',
          boxShadow: '0 40px 90px rgba(0,0,0,0.55), 0 0 0 1px rgba(34,197,94,0.06)',
        }}>
        {/* window header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4">
          <div className="flex gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full" style={{ background: '#FF5F57' }} />
            <span className="w-2.5 h-2.5 rounded-full" style={{ background: '#FEBC2E' }} />
            <span className="w-2.5 h-2.5 rounded-full" style={{ background: '#28C840' }} />
          </div>
          <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/40">LivoraPulse</span>
          <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black"
            style={{ background: 'linear-gradient(135deg,#16A34A,#22C55E)' }}>L</div>
        </div>

        <div className="px-5 pb-6 space-y-4">
          {/* LifePulse score */}
          <div className="flex items-center justify-between rounded-2xl px-4 py-3.5"
            style={{ background: WIDGET, border: '1px solid rgba(255,255,255,0.05)' }}>
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-widest text-white/40 mb-1">LifePulse Score</div>
              <div className="text-3xl font-black leading-none text-white">
                84 <span className="text-sm font-semibold text-white/35">/ 100</span>
              </div>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[11px] font-bold"
              style={{ background: 'rgba(34,197,94,0.12)', color: ACCENT }}>
              <TrendingUp size={12} /> +4 this week
            </div>
          </div>

          {/* Activity bars */}
          <div className="rounded-2xl p-4" style={{ background: WIDGET, border: '1px solid rgba(255,255,255,0.05)' }}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-semibold text-white/80">Activity</span>
              <span className="text-[10px] text-white/35">This week</span>
            </div>
            <div className="flex items-end gap-2 h-24">
              {BARS.map((h, i) => (
                <motion.div
                  key={i}
                  initial={{ scaleY: 0 }}
                  animate={{ scaleY: 1 }}
                  transition={{ duration: 0.7, delay: 0.5 + i * 0.07 }}
                  className="flex-1 rounded-md origin-bottom"
                  style={{
                    height: `${h}%`,
                    background: i === 5
                      ? 'linear-gradient(180deg,#4ADE80,#16A34A)'
                      : 'linear-gradient(180deg, rgba(34,197,94,0.55), rgba(34,197,94,0.18))',
                    opacity: i === 5 ? 1 : 0.55,
                    boxShadow: i === 5 ? '0 0 18px rgba(34,197,94,0.5)' : 'none',
                  }}
                />
              ))}
            </div>
          </div>

          {/* macros + sleep */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl p-3.5" style={{ background: WIDGET, border: '1px solid rgba(255,255,255,0.05)' }}>
              <span className="text-[11px] font-semibold text-white/80">Macros</span>
              <div className="space-y-2.5 mt-3">
                {[
                  { label: 'Protein', val: '42g', pct: 62, c: '#22C55E' },
                  { label: 'Carbs', val: '68g', pct: 74, c: '#60A5FA' },
                  { label: 'Fat', val: '12g', pct: 38, c: '#F59E0B' },
                ].map(r => (
                  <div key={r.label}>
                    <div className="flex justify-between text-[10px] mb-1">
                      <span className="text-white/45">{r.label}</span>
                      <span className="font-bold text-white/80">{r.val}</span>
                    </div>
                    <div className="h-1 rounded-full bg-white/[0.06]">
                      <div className="h-full rounded-full" style={{ width: `${r.pct}%`, background: r.c }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl p-3.5" style={{ background: WIDGET, border: '1px solid rgba(255,255,255,0.05)' }}>
              <span className="text-[11px] font-semibold text-white/80">Sleep</span>
              <div className="mt-2 flex items-baseline gap-1.5">
                <span className="text-xl font-black text-white">7h 40m</span>
                <span className="text-[10px] text-white/35">last night</span>
              </div>
              <svg viewBox="0 0 130 46" className="w-full mt-1" style={{ overflow: 'visible' }}>
                <defs>
                  <linearGradient id="sleepFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#22D3EE" stopOpacity="0.35" />
                    <stop offset="100%" stopColor="#22D3EE" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <polygon points="0,38 13,32 26,35 39,22 52,27 65,16 78,22 91,9 104,18 117,5 130,13 130,46 0,46"
                  fill="url(#sleepFill)" />
                <polyline points="0,38 13,32 26,35 39,22 52,27 65,16 78,22 91,9 104,18 117,5 130,13"
                  fill="none" stroke="#22D3EE" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
                <circle cx="130" cy="13" r="3" fill="#22D3EE" />
              </svg>
            </div>
          </div>

          {/* water row */}
          <div className="flex items-center gap-3 rounded-2xl px-4 py-3"
            style={{ background: WIDGET, border: '1px solid rgba(255,255,255,0.05)' }}>
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'rgba(56,189,248,0.12)', color: '#38BDF8' }}>
              <Droplets size={13} />
            </div>
            <div className="flex-1">
              <div className="flex justify-between text-[10px] mb-1">
                <span className="text-white/45">Water intake</span>
                <span className="font-bold text-white/80">1.9 L / 2.5 L</span>
              </div>
              <div className="h-1 rounded-full bg-white/[0.06]">
                <div className="h-full rounded-full" style={{ width: '76%', background: '#38BDF8' }} />
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* floating badges */}
      <motion.div
        animate={{ y: [0, -6, 0] }} transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute top-14 -left-6 lg:-left-10 flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl shadow-2xl"
        style={{ background: 'rgba(13,18,28,0.94)', border: '1px solid rgba(34,197,94,0.3)', backdropFilter: 'blur(12px)' }}>
        <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'rgba(34,197,94,0.15)', color: ACCENT }}>
          <TrendingUp size={14} />
        </div>
        <div>
          <div className="text-[9px] font-semibold text-white/45">LifePulse Score</div>
          <div className="text-base font-black leading-none" style={{ color: ACCENT }}>
            84 <span className="text-xs font-normal text-white/40">/ 100</span>
          </div>
        </div>
      </motion.div>

      <motion.div
        animate={{ y: [0, 6, 0] }} transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
        className="absolute -bottom-5 -right-3 lg:-right-8 flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl shadow-2xl"
        style={{ background: 'rgba(13,18,28,0.94)', border: '1px solid rgba(251,191,36,0.3)', backdropFilter: 'blur(12px)' }}>
        <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'rgba(251,191,36,0.15)', color: '#FBBF24' }}>
          <Zap size={14} />
        </div>
        <div>
          <div className="text-[9px] font-semibold text-white/45">Day streak</div>
          <div className="text-base font-black leading-none" style={{ color: '#FBBF24' }}>
            14 <span className="text-xs font-normal text-white/40">days</span>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

// ─── integrations ────────────────────────────────────────────────────────────
const integrations: { name: string; Icon: LucideIcon }[] = [
  { name: 'Google Fit', Icon: Activity },
  { name: 'Apple Health', Icon: Heart },
  { name: 'KEMRI', Icon: FlaskConical },
  { name: 'FAO', Icon: Wheat },
  { name: 'WHO', Icon: Globe },
  { name: 'Strava', Icon: Mountain },
]

function Integrations({ muted }: { muted: string }) {
  return (
    <section className="relative z-10 py-14">
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        <div className="grid lg:grid-cols-[1fr_1.6fr] gap-8 items-center">
          <div>
            <h3 className="text-2xl sm:text-3xl font-black leading-tight mb-2">Plays nice with your health stack.</h3>
            <p className="text-sm leading-relaxed" style={{ color: muted }}>
              Sync Google Fit, Apple Health and national health institutions automatically — no manual entry.
            </p>
          </div>
          <div className="flex flex-wrap gap-2.5">
            {integrations.map(({ name, Icon }) => (
              <div key={name}
                className="inline-flex items-center gap-2.5 px-3.5 py-2 rounded-xl"
                style={{ border: '1px solid rgba(128,138,152,0.16)', background: 'rgba(128,138,152,0.05)' }}>
                <Icon size={16} className="opacity-45" />
                <span className="text-xs font-semibold uppercase tracking-wide opacity-50">{name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

// ─── widget shell + dimension widgets ────────────────────────────────────────
function WidgetShell({ title, Icon, children, color }: { title: string; Icon: LucideIcon; children: ReactNode; color: string }) {
  return (
    <div className="rounded-2xl p-4 pointer-events-none select-none"
      style={{ background: WIDGET, border: '1px solid rgba(255,255,255,0.05)' }}>
      <div className="flex items-center justify-between mb-3">
        <span className="flex items-center gap-1.5 text-[11px] font-semibold text-white/80">
          <Icon size={12} style={{ color }} /> {title}
        </span>
        <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: ACCENT, boxShadow: '0 0 8px rgba(34,197,94,0.8)' }} />
      </div>
      {children}
    </div>
  )
}

function PhysicalWidget() {
  return (
    <WidgetShell title="Workout · Route replay" Icon={MapPin} color="#22C55E">
      <svg viewBox="0 0 200 96" className="w-full" style={{ overflow: 'visible' }}>
        {[20, 46, 72].map(y => (
          <line key={`h${y}`} x1="0" y1={y} x2="200" y2={y} stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
        ))}
        {[34, 66, 98, 130, 162].map(x => (
          <line key={`v${x}`} x1={x} y1="0" x2={x} y2="96" stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
        ))}
        <circle cx="10" cy="74" r="3.5" fill="#22C55E" />
        <circle cx="10" cy="74" r="7" fill="rgba(34,197,94,0.25)" />
        <path d="M10,74 C34,64 54,70 76,52 C96,35 118,50 138,34 C158,19 172,28 192,18"
          fill="none" stroke="#22C55E" strokeWidth="2.5" strokeLinecap="round" strokeDasharray="1 0" />
        <circle cx="192" cy="18" r="3.5" fill="#4ADE80" />
        <circle cx="192" cy="18" r="7" fill="rgba(74,222,128,0.25)" />
      </svg>
      <div className="flex items-center gap-2 mt-3 text-[10px] text-white/45">
        <Footprints size={12} /> 8,240 steps
        <span className="text-white/20">·</span> 32 min
        <span className="text-white/20">·</span> 412 kcal
      </div>
    </WidgetShell>
  )
}

function NutritionWidget() {
  const macros = [
    { label: 'Protein', val: '42g', pct: 62, c: '#22C55E' },
    { label: 'Carbs', val: '68g', pct: 74, c: '#60A5FA' },
    { label: 'Fat', val: '12g', pct: 38, c: '#F59E0B' },
  ]
  return (
    <WidgetShell title="Meal log" Icon={UtensilsCrossed} color="#F87171">
      <div className="flex items-center gap-2 rounded-lg px-2.5 py-2 bg-white/[0.04] text-[11px] text-white/35 mb-3">
        <Search size={11} /> Search dishes in Vietnamese…
      </div>
      <div className="flex items-center justify-between rounded-lg px-2.5 py-2 mb-3"
        style={{ background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)' }}>
        <span className="text-[11px] font-bold text-white/85">Phở Bò</span>
        <span className="text-[11px] font-black" style={{ color: '#F87171' }}>540 kcal</span>
      </div>
      <div className="space-y-2">
        {macros.map(r => (
          <div key={r.label}>
            <div className="flex justify-between text-[10px] mb-1">
              <span className="text-white/45">{r.label}</span>
              <span className="font-bold text-white/75">{r.val}</span>
            </div>
            <div className="h-1 rounded-full bg-white/[0.06]">
              <div className="h-full rounded-full" style={{ width: `${r.pct}%`, background: r.c }} />
            </div>
          </div>
        ))}
      </div>
    </WidgetShell>
  )
}

function DigitalWidget() {
  const C = 2 * Math.PI * 24
  const focus = 0.62
  return (
    <WidgetShell title="Focus timer" Icon={MonitorSmartphone} color="#22D3EE">
      <div className="flex items-center gap-4">
        <div className="relative w-20 h-20">
          <svg viewBox="0 0 64 64" className="w-full h-full -rotate-90">
            <circle cx="32" cy="32" r="24" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="5" />
            <circle cx="32" cy="32" r="24" fill="none" stroke="#22D3EE" strokeWidth="5" strokeLinecap="round"
              strokeDasharray={C} strokeDashoffset={C * (1 - focus)} />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-sm font-black text-white">25:00</span>
            <span className="text-[9px] text-white/40">focus</span>
          </div>
        </div>
        <div className="flex-1 space-y-2.5">
          <div>
            <div className="flex justify-between text-[10px] mb-1">
              <span className="text-white/45">Screen time</span>
              <span className="font-bold text-white/75">3h 12m</span>
            </div>
            <div className="h-1 rounded-full bg-white/[0.06]">
              <div className="h-full rounded-full bg-white/30" style={{ width: '54%' }} />
            </div>
          </div>
          <div>
            <div className="flex justify-between text-[10px] mb-1">
              <span className="text-white/45">Screens saved</span>
              <span className="font-bold" style={{ color: '#22D3EE' }}>+26m</span>
            </div>
            <div className="h-1 rounded-full bg-white/[0.06]">
              <div className="h-full rounded-full" style={{ width: '38%', background: '#22D3EE' }} />
            </div>
          </div>
        </div>
      </div>
    </WidgetShell>
  )
}

function ProductivityWidget() {
  const sessions = [
    { name: 'Deep work', time: '45m', pct: 100 },
    { name: 'Reading', time: '25m', pct: 70 },
    { name: 'Plan tomorrow', time: '15m', pct: 40 },
  ]
  return (
    <WidgetShell title="Focus sessions" Icon={Timer} color="#818CF8">
      <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-full mb-3 w-max"
        style={{ background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.2)' }}>
        <Flame size={12} style={{ color: '#FBBF24' }} />
        <span className="text-[11px] font-bold text-[#FBBF24]">12-day streak</span>
      </div>
      <div className="space-y-2.5">
        {sessions.map((s, i) => (
          <div key={s.name}>
            <div className="flex items-center justify-between text-[10px] mb-1">
              <span className="flex items-center gap-1.5 text-white/70">
                <span className="w-3 h-3 rounded-[4px] flex items-center justify-center"
                  style={{ background: i === 0 ? 'rgba(129,140,248,0.2)' : 'rgba(255,255,255,0.06)', color: i === 0 ? '#818CF8' : 'rgba(255,255,255,0.25)' }}>
                  <Check size={9} strokeWidth={3} />
                </span>
                {s.name}
              </span>
              <span className="font-bold text-white/75">{s.time}</span>
            </div>
            <div className="h-1 rounded-full bg-white/[0.06]">
              <div className="h-full rounded-full" style={{ width: `${s.pct}%`, background: i === 0 ? '#818CF8' : 'rgba(129,140,248,0.45)' }} />
            </div>
          </div>
        ))}
      </div>
    </WidgetShell>
  )
}

function EcoWidget() {
  return (
    <WidgetShell title="Carbon footprint" Icon={Leaf} color="#A3E635">
      <div className="flex items-end justify-between mb-3">
        <div>
          <div className="text-2xl font-black text-white leading-none">2.4 <span className="text-xs text-white/40">kg</span></div>
          <div className="text-[10px] text-white/40 mt-1">CO₂ today</div>
        </div>
        <span className="text-[10px] font-bold rounded-full px-2 py-1"
          style={{ background: 'rgba(163,230,53,0.12)', color: '#A3E635' }}>−8% vs avg</span>
      </div>
      <div className="flex gap-1.5 mb-3">
        {[0, 1, 2, 3, 4].map(i => (
          <div key={i} className="h-1.5 flex-1 rounded-full" style={{
            background: i < 3 ? 'linear-gradient(90deg,#22C55E,#A3E635)' : 'rgba(255,255,255,0.08)',
          }} />
        ))}
      </div>
      <div className="text-[10px] text-white/45">Commute by foot — 3.1 km car-free</div>
    </WidgetShell>
  )
}

function MoodWidget() {
  return (
    <WidgetShell title="Mood trend" Icon={Heart} color="#F59E0B">
      <div className="flex items-baseline gap-1.5 mb-2">
        <span className="text-xl font-black text-white">78</span>
        <span className="text-[10px] font-bold rounded-full px-2 py-0.5"
          style={{ background: 'rgba(245,158,11,0.12)', color: '#F59E0B' }}>Calm</span>
      </div>
      <svg viewBox="0 0 130 44" className="w-full" style={{ overflow: 'visible' }}>
        <polyline points="0,34 16,28 32,31 48,20 64,25 80,14 96,17 112,6 130,10"
          fill="none" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="130" cy="10" r="3" fill="#F59E0B" />
      </svg>
      <div className="flex items-center gap-2 mt-2 text-[10px] text-white/45">
        Sleep 7h 40m <span className="text-white/20">·</span> Cycle day 12
      </div>
    </WidgetShell>
  )
}

// ─── dimensions section ──────────────────────────────────────────────────────
interface Dimension {
  icon: LucideIcon
  label: string
  tag: string
  desc: string
  color: string
  widget: ReactNode
  image?: string
}

const dimensions: Dimension[] = [
  { icon: Activity, label: 'Physical', tag: '4.2 km today', desc: 'Steps, walks and GPS route replay — workouts visualised, not just counted.', color: '#22C55E', image: '/images/physical.jpg', widget: <PhysicalWidget /> },
  { icon: UtensilsCrossed, label: 'Nutrition', tag: 'Macros synced', desc: 'Log local meals with portion-accurate macros from national food data.', color: '#F87171', image: '/images/Nutrition.jpg', widget: <NutritionWidget /> },
  { icon: MonitorSmartphone, label: 'Digital', tag: 'Focus 25:00', desc: 'Screen-time guardrails and focus timers that turn attention into routine.', color: '#22D3EE', widget: <DigitalWidget /> },
  { icon: Timer, label: 'Productivity', tag: '12-day streak', desc: 'Focus sessions that stack — streaks gradually raise your targets.', color: '#818CF8', widget: <ProductivityWidget /> },
  { icon: Leaf, label: 'Eco', tag: '2.4 kg CO₂', desc: 'Daily carbon footprint nudges — small swaps that compound.', color: '#A3E635', widget: <EcoWidget /> },
  { icon: Heart, label: 'Mood', tag: 'Calm · 78', desc: 'Stress logs, cycle insights and mood trends in context with the rest of your day.', color: '#F59E0B', image: '/images/Mood.jpg', widget: <MoodWidget /> },
]

// ─── food search mock ────────────────────────────────────────────────────────
const FOOD_RESULTS = [
  { name: 'Phở Bò', kcal: '155', sub: 'kcal / 100g', macros: ['P 12', 'C 24', 'F 5'] },
  { name: 'Phở Gà', kcal: '141', sub: 'kcal / 100g', macros: ['P 13', 'C 22', 'F 4'] },
  { name: 'Bún Thịt Nướng', kcal: '420', sub: 'kcal / bowl', macros: ['P 18', 'C 52', 'F 16'] },
]

function FoodSearchMock() {
  return (
    <div className="relative w-[280px] sm:w-[300px] select-none">
      <div className="absolute -inset-10 pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(34,197,94,0.15) 0%, transparent 68%)', filter: 'blur(46px)' }} />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7 }}
        className="relative rounded-[2.4rem] p-2"
        style={{
          background: 'linear-gradient(180deg, #1A2332 0%, #0B0F17 100%)',
          border: '1px solid rgba(255,255,255,0.08)',
          boxShadow: '0 40px 80px rgba(0,0,0,0.5)',
        }}>
        <div className="rounded-[1.9rem] overflow-hidden"
          style={{ background: '#0A1019', border: '1px solid rgba(255,255,255,0.05)' }}>

          {/* status bar */}
          <div className="flex items-center justify-between px-5 pt-3.5 pb-1">
            <span className="text-[9px] font-bold text-white/45">9:41</span>
            <div className="flex items-center gap-1">
              <span className="w-3 h-1.5 rounded-[2px] bg-white/25" />
              <span className="w-3 h-1.5 rounded-[2px] bg-white/25" />
              <span className="w-3 h-1.5 rounded-[2px] bg-white/25" />
            </div>
          </div>

          {/* app header */}
          <div className="px-4 pt-3 pb-3">
            <div className="text-[12px] font-bold text-white/90">Search food</div>
            <div className="text-[9px] text-white/40">National food composition database</div>
          </div>

          {/* active search bar */}
          <div className="px-4">
            <div className="flex items-center gap-2 rounded-xl px-3 py-2.5"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(34,197,94,0.4)' }}>
              <Search size={13} style={{ color: ACCENT }} />
              <span className="text-xs font-medium text-white/90">Phở Bò</span>
              <span className="w-[2px] h-3.5 rounded-full animate-pulse" style={{ background: ACCENT }} />
              <span className="ml-auto text-[10px] text-white/30">Clear</span>
            </div>
          </div>

          {/* real-time autocomplete */}
          <div className="px-4 pt-2 pb-1 space-y-1">
            {FOOD_RESULTS.map((r, i) => (
              <div key={r.name}
                className="flex items-center gap-2.5 px-2.5 py-2 rounded-xl"
                style={{ background: i === 0 ? 'rgba(34,197,94,0.09)' : 'transparent', border: i === 0 ? '1px solid rgba(34,197,94,0.25)' : '1px solid transparent' }}>
                <span className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0"
                  style={{ background: i === 0 ? 'rgba(34,197,94,0.15)' : 'rgba(255,255,255,0.06)', color: i === 0 ? ACCENT : 'rgba(255,255,255,0.4)' }}>
                  <UtensilsCrossed size={11} />
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-[11px] font-bold text-white/90 truncate">{r.name}</div>
                  <div className="text-[9px] text-white/40">{r.kcal} {r.sub}</div>
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  {r.macros.map(m => (
                    <span key={m} className="text-[8px] font-bold px-1.5 py-0.5 rounded-md bg-white/[0.06] text-white/45">{m}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* selected dish */}
          <div className="px-4 pt-2 pb-3">
            <div className="relative rounded-2xl overflow-hidden h-32">
              <img src="/images/A%20bowl%20of%20pho.jpg" alt="Phở Bò" className="w-full h-full object-cover" />
              <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(11,15,23,0.85), rgba(11,15,23,0.1) 55%)' }} />
              <div className="absolute bottom-0 inset-x-0 p-3 flex items-end justify-between gap-2">
                <div>
                  <div className="text-sm font-black text-white leading-tight">Phở Bò</div>
                  <div className="text-[10px] text-white/60">155 kcal / 100g</div>
                </div>
                <div className="flex gap-1">
                  {['P12', 'C24', 'F5'].map(m => (
                    <span key={m} className="text-[8px] font-bold px-1.5 py-1 rounded-md"
                      style={{ background: 'rgba(11,15,23,0.6)', border: '1px solid rgba(255,255,255,0.14)', color: '#E8FFF1' }}>{m}</span>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex items-center justify-center gap-1.5 mt-2.5 rounded-xl py-2.5 text-[11px] font-bold text-white"
              style={{ background: 'linear-gradient(135deg,#22C55E,#16A34A)', boxShadow: '0 1px 2px rgba(0,0,0,0.4)' }}>
              <Plus size={12} /> Add to today's log
            </div>
          </div>

          {/* home indicator */}
          <div className="flex justify-center pb-3 pt-0.5">
            <span className="w-20 h-1 rounded-full bg-white/15" />
          </div>
        </div>
      </motion.div>
    </div>
  )
}

// ─── onboarding preview ──────────────────────────────────────────────────────
function OnboardingPreview() {
  const options = ['Mostly seated', 'On my feet', 'Active daily', 'Very active']
  const [active, setActive] = useState(2)
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.7 }}
      className="relative rounded-3xl p-6 select-none"
      style={{
        background: 'linear-gradient(180deg, #101827 0%, #0B0F17 100%)',
        border: '1px solid rgba(255,255,255,0.08)',
        boxShadow: '0 40px 90px rgba(0,0,0,0.5)',
      }}>
      <div className="absolute -top-px inset-x-10 h-px"
        style={{ background: 'linear-gradient(90deg, transparent, rgba(34,197,94,0.6), transparent)' }} />

      {/* header */}
      <div className="flex items-center justify-between mb-6">
        <span className="text-[10px] font-bold uppercase tracking-widest text-white/45">Setup</span>
        <span className="text-[10px] font-bold" style={{ color: ACCENT }}>Question 4 / 10</span>
      </div>

      {/* progress */}
      <div className="h-1 rounded-full bg-white/[0.06] mb-6">
        <div className="h-full rounded-full" style={{ width: '40%', background: 'linear-gradient(90deg,#16A34A,#22C55E)' }} />
      </div>

      <div className="text-sm font-semibold text-white/85 mb-4">How active are you most days?</div>

      <div className="space-y-2 mb-6">
        {options.map((o, i) => (
          <button
            key={o}
            type="button"
            onClick={() => setActive(i)}
            className="w-full text-left flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all"
            style={{
              background: active === i ? 'rgba(34,197,94,0.1)' : 'rgba(255,255,255,0.04)',
              border: active === i ? '1px solid rgba(34,197,94,0.4)' : '1px solid rgba(255,255,255,0.06)',
              color: active === i ? '#fff' : 'rgba(255,255,255,0.6)',
            }}>
            {o}
            {active === i && <Check size={14} style={{ color: ACCENT }} />}
          </button>
        ))}
      </div>

      {/* computed target */}
      <div className="rounded-2xl p-4" style={{ background: WIDGET, border: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="flex justify-between text-[11px] mb-4">
          <span className="text-white/45">Daily step target</span>
          <span className="font-black text-white">7,400 <span className="text-white/40 font-normal">steps</span></span>
        </div>
        <div className="relative h-1.5 rounded-full mb-1.5 bg-white/[0.06]">
          <div className="absolute inset-y-0 left-0 rounded-full" style={{ width: '62%', background: 'linear-gradient(90deg,#16A34A,#22C55E)' }} />
          <div className="absolute -top-[3px] w-3 h-3 rounded-full" style={{ left: '62%', background: ACCENT, boxShadow: '0 0 12px rgba(34,197,94,0.9)' }} />
        </div>
        <div className="text-[10px] text-white/35">Calculated from your age, activity and streak multiplier</div>
      </div>
    </motion.div>
  )
}

// ─── main ────────────────────────────────────────────────────────────────────
export default function LandingPage() {
  const { dark, toggle } = useDark()
  const heroRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] })
  const heroY = useTransform(scrollYProgress, [0, 1], ['0%', '18%'])

  const bg     = dark ? '#0B0F17' : '#F4F6F9'
  const text   = dark ? '#F2F5F9' : '#0B0F17'
  const muted  = dark ? 'rgba(226,232,240,0.55)' : 'rgba(11,15,23,0.55)'
  const faint  = dark ? 'rgba(226,232,240,0.38)' : 'rgba(11,15,23,0.45)'
  const cardBg = dark ? '#0E1521' : '#FFFFFF'
  const cardBorder = dark ? 'rgba(255,255,255,0.06)' : 'rgba(11,15,23,0.07)'

  const foodBullets = [
    { Icon: Search, text: 'Search in Vietnamese — phở, bún chả, cơm tấm, hủ tiếu' },
    { Icon: Scale, text: 'Track exact portions, not Western approximations' },
    { Icon: Database, text: 'Calories from national food composition tables' },
  ]

  const steps = [
    { n: '01', title: 'Tell us about yourself', desc: 'A 10-question onboarding covering age, goals, activity, disability, sleep and more.' },
    { n: '02', title: 'Dynamic targets', desc: 'Goals calculated from your inputs — never generic numbers for everyone.' },
    { n: '03', title: 'Unified dashboard', desc: 'One score across physical, nutrition, digital, mood, eco and water.' },
    { n: '04', title: 'Streak multiplier', desc: 'Longer streaks raise your targets gradually — you grow with the app.' },
  ]

  return (
    <div style={{ background: bg, color: text }} className="relative overflow-x-hidden font-sans">
      <Navbar dark={dark} onToggle={toggle} />

      {/* ══════════════════════════════════════════════════════════ HERO */}
      <section
        ref={heroRef}
        className="relative flex items-center overflow-hidden"
        style={{ height: '100vh', maxHeight: '860px', minHeight: '600px', paddingTop: 56 }}
      >
        <div className="absolute inset-0">
          <img src="/images/wellness%20tracking.jpg" alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0" style={{ background: 'rgba(11,15,23,0.78)' }} />
          <div className="absolute inset-0" style={{ background: dark ? 'rgba(11,15,23,0.2)' : 'rgba(11,15,23,0.35)' }} />
        </div>
        <motion.div style={{ y: heroY }} className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-24 -right-24 w-[560px] h-[560px] rounded-full"
            style={{ background: 'radial-gradient(circle, rgba(34,197,94,0.14) 0%, transparent 70%)', filter: 'blur(60px)' }} />
          <div className="absolute bottom-0 -left-32 w-[420px] h-[420px] rounded-full"
            style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.1) 0%, transparent 70%)', filter: 'blur(80px)' }} />
        </motion.div>

        <div className="relative z-10 max-w-7xl mx-auto px-5 sm:px-8 w-full">
          <div className="grid lg:grid-cols-[1.02fr_0.98fr] gap-10 lg:gap-8 items-center">

            {/* Left */}
            <div>
              <motion.h1
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
                className="font-black leading-[1.08] tracking-tight mb-5 text-white"
                style={{ fontSize: 'clamp(1.9rem, 4.1vw, 3.25rem)' }}>
                Log local meals, track daily activity, and{' '}
                <span className="relative inline-block">
                  <span className="relative z-10" style={{ color: ACCENT }}>score your overall health</span>
                  <span className="absolute bottom-0.5 left-0 right-0 h-2 rounded-full origin-left"
                    style={{ background: 'rgba(34,197,94,0.25)', zIndex: 0 }} />
                </span>{' '}
                in one place.
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.12 }}
                className="text-sm sm:text-[15px] mb-6 max-w-md leading-relaxed" style={{ color: 'rgba(255,255,255,0.75)' }}>
                Personalised targets, local food data, and a daily score that builds long-term consistency.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }}
                className="flex flex-wrap gap-3 mb-6">
                <Link to="/login"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-sm text-white transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                  style={{ background: 'linear-gradient(135deg,#22C55E,#16A34A)', boxShadow: '0 10px 30px rgba(34,197,94,0.35), inset 0 1px 0 rgba(255,255,255,0.15)' }}>
                  Start free today
                  <ArrowRight size={14} />
                </Link>
                <a href="#how-it-works"
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl font-semibold text-sm transition-all"
                  style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.16)', color: 'rgba(255,255,255,0.85)' }}>
                  <Play size={12} className="fill-current" />
                  See how it works
                </a>
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 }}
                className="flex items-center gap-2.5">
                <span className="relative flex w-2 h-2">
                  <span className="absolute inline-flex h-full w-full rounded-full opacity-60 animate-ping" style={{ background: ACCENT }} />
                  <span className="relative inline-flex rounded-full w-2 h-2" style={{ background: ACCENT }} />
                </span>
                <span className="text-xs" style={{ color: 'rgba(255,255,255,0.6)' }}>
                  Over <span className="font-bold text-white">12,000+</span> meals logged this week
                </span>
              </motion.div>
            </div>

            {/* Right — product dashboard */}
            <div className="relative">
              <DashboardMockup />
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════ DIMENSIONS (features) */}
      <div id="dimensions" className="scroll-mt-20" />
      <section id="features" className="relative z-10 py-20 scroll-mt-20">
        <div className="max-w-7xl mx-auto px-5 sm:px-8">
          <div className="grid lg:grid-cols-2 gap-8 items-end mb-12">
            <div>
              <h2 className="text-4xl sm:text-5xl font-black leading-tight">
                Six core dimensions.<br />
                <span style={{ color: ACCENT }}>One intuitive score.</span>
              </h2>
            </div>
            <p className="text-base leading-relaxed lg:text-right" style={{ color: muted }}>
              Your daily score combines physical, nutritional, digital, productivity, eco, and mood inputs into personalized targets.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {dimensions.map((f, i) => (
              <motion.div
                key={f.label}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: (i % 3) * 0.08 }}
                whileHover={{ y: -2 }}
                className="group relative rounded-3xl p-5 flex flex-col cursor-default overflow-hidden"
                style={{
                  background: cardBg,
                  border: `1px solid ${cardBorder}`,
                  boxShadow: dark ? 'none' : '0 2px 20px rgba(0,0,0,0.05)',
                  transition: 'border-color 0.25s ease, box-shadow 0.25s ease',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = 'rgba(34,197,94,0.3)'
                  e.currentTarget.style.boxShadow = dark
                    ? '0 0 20px rgba(34,197,94,0.08)'
                    : '0 4px 24px rgba(0,0,0,0.07)'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = cardBorder
                  e.currentTarget.style.boxShadow = dark
                    ? 'none'
                    : '0 2px 20px rgba(0,0,0,0.05)'
                }}>
                {f.image && (
                  <div className="absolute inset-0">
                    <img src={f.image} alt={f.label} className="w-full h-full object-cover" />
                    <div className="absolute inset-0" style={{ background: 'rgba(11,15,23,0.85)' }} />
                  </div>
                )}
                <div className="relative flex items-center gap-2.5 mb-4">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                    style={{ background: `${f.color}1A`, color: f.color }}>
                    <f.icon size={15} />
                  </div>
                  <span className="font-bold text-sm" style={{ color: f.image ? '#fff' : undefined }}>{f.label}</span>
                  <span className="ml-auto text-[11px] font-bold px-2.5 py-1 rounded-full"
                    style={{ background: `${f.color}14`, color: f.color }}>
                    {f.tag}
                  </span>
                </div>
                <div className="relative flex-1">{f.widget}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════ INTEGRATIONS */}
      <Integrations muted={muted} />

      {/* ═══════════════════════════════════ FOOD DATA */}
      <section className="relative z-10 py-20 overflow-hidden"
        style={{ borderTop: `1px solid rgba(34,197,94,0.12)`, borderBottom: `1px solid rgba(34,197,94,0.12)` }}>
        <div className="absolute inset-0">
          <img src="/images/Asian%20street%20Market.jpg" alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0" style={{ background: 'rgba(11,15,23,0.85)' }} />
          <div className="absolute inset-0" style={{ background: dark ? 'rgba(11,15,23,0.55)' : 'rgba(11,15,23,0.6)' }} />
        </div>
        <div className="absolute inset-x-0 top-0 h-full pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(34,197,94,0.12) 0%, transparent 60%)' }} />
        <div className="relative z-10 max-w-7xl mx-auto px-5 sm:px-8">
          <div className="grid lg:grid-cols-2 gap-14 items-center">

            {/* Visual side — in-app food search */}
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
              className="flex items-center justify-center"
            >
              <FoodSearchMock />
            </motion.div>

            {/* Copy side */}
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
            >
              <h2 className="text-4xl sm:text-5xl font-black leading-tight mb-4 text-white">
                Your food. Your language.<br />
                <span style={{ color: ACCENT }}>Your data.</span>
              </h2>
              <p className="text-base leading-relaxed mb-7 max-w-lg" style={{ color: 'rgba(255,255,255,0.72)' }}>
                Search local dishes instantly and get accurate nutritional data powered by national food composition databases.
              </p>

              <div className="space-y-4 mb-8">
                {foodBullets.map((b, i) => (
                  <motion.div key={i}
                    initial={{ opacity: 0, x: 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.08 }}
                    className="flex items-start gap-3 text-sm">
                    <b.Icon size={16} strokeWidth={1.75} className="flex-shrink-0 mt-0.5" style={{ color: ACCENT }} />
                    <span style={{ color: 'rgba(255,255,255,0.82)' }}>{b.text}</span>
                  </motion.div>
                ))}
              </div>

              <Link to="/login"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-sm text-white transition-all duration-200 shadow-[0_1px_2px_rgba(11,15,23,0.35)] hover:shadow-[0_4px_14px_rgba(34,197,94,0.25)] hover:brightness-[1.04] active:shadow-[0_1px_3px_rgba(11,15,23,0.3)] active:scale-[0.98]"
                style={{ background: 'linear-gradient(135deg,#22C55E,#16A34A)' }}>
                Start tracking your food
                <ArrowRight size={14} />
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════ HOW IT WORKS */}
      <section id="how-it-works" className="relative z-10 py-20 scroll-mt-20 overflow-hidden">
        <div className="absolute inset-0">
          <img src="/images/wellness%20tracking.jpg" alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0" style={{ background: 'rgba(11,15,23,0.82)' }} />
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-5 sm:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="mb-12 max-w-2xl">
            <h2 className="text-4xl sm:text-5xl font-black leading-tight mb-3 text-white">
              Personalised from your<br /><span style={{ color: ACCENT }}>very first screen.</span>
            </h2>
            <p className="text-base max-w-xl" style={{ color: 'rgba(255,255,255,0.72)' }}>
              10 questions. Completely personalised goals. No generic targets.
            </p>
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-10 items-center">
            <div className="space-y-3">
              {steps.map((s, i) => (
                <motion.div key={s.n}
                  initial={{ opacity: 0, x: -24 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="group flex gap-4 p-4 rounded-2xl transition-colors duration-300"
                  style={{
                    background: 'rgba(11,15,23,0.6)',
                    border: i === 0 ? `1px solid rgba(34,197,94,0.35)` : `1px solid rgba(255,255,255,0.08)`,
                  }}>
                  <div className="text-3xl font-black flex-shrink-0 leading-none pt-0.5"
                    style={{ color: i === 0 ? ACCENT : 'rgba(255,255,255,0.25)' }}>
                    {s.n}
                  </div>
                  <div>
                    <div className="font-bold mb-1 text-sm text-white">{s.title}</div>
                    <div className="text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.72)' }}>{s.desc}</div>
                  </div>
                </motion.div>
              ))}
            </div>

            <OnboardingPreview />
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════ FINAL CTA */}
      <section className="relative z-10 py-24"
        style={{ background: '#111827', borderTop: '1px solid rgba(34,197,94,0.2)' }}>
        <div className="absolute inset-x-0 top-0 h-40 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(34,197,94,0.18) 0%, transparent 70%)' }} />
        <div className="max-w-4xl mx-auto px-5 sm:px-8 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.7 }}>
            <h2 className="text-5xl sm:text-6xl font-black mb-4 leading-tight text-white">
              Ready to take control of<br />
              <span style={{ color: ACCENT }}>your wellness?</span>
            </h2>
            <p className="text-lg mb-8 max-w-lg mx-auto" style={{ color: 'rgba(226,232,240,0.6)' }}>
              Set up your personalised dashboard in under two minutes.
            </p>
            <Link to="/login" onClick={scrollTop}
              className="inline-flex items-center gap-3 px-10 py-4 text-white font-black rounded-2xl text-base transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
              style={{
                background: 'linear-gradient(135deg,#22C55E,#16A34A)',
                boxShadow: '0 20px 60px rgba(34,197,94,0.4), 0 0 0 1px rgba(34,197,94,0.4)',
              }}>
              Get started — it's free
              <ArrowRight size={17} />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════ FOOTER */}
      <footer className="relative z-10 overflow-hidden" style={{ background: dark ? '#060A12' : '#EDF0F4' }}>
        <div className="absolute top-0 inset-x-0 h-px"
          style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(34,197,94,0.5) 30%, #22C55E 50%, rgba(34,197,94,0.5) 70%, transparent 100%)', opacity: 0.5 }} />

        <div className="max-w-7xl mx-auto px-5 sm:px-8 pt-14 pb-8">
          {/* Brand row */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-6 mb-10">
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="relative">
                <div className="absolute inset-0 rounded-xl blur-sm opacity-50 transition-opacity group-hover:opacity-80"
                  style={{ background: 'linear-gradient(135deg,#22C55E,#4ADE80)' }} />
                <div className="relative w-8 h-8 rounded-xl flex items-center justify-center"
                  style={{ background: 'linear-gradient(135deg,#16A34A 0%,#22C55E 50%,#4ADE80 100%)' }}>
                  <svg width="14" height="14" viewBox="0 0 36 36" fill="none">
                    <polyline points="3,18 8,18 11,11 14,25 17,8 20,22 23,15 27,18 33,18"
                      stroke="white" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              </div>
              <span className="font-black text-sm" style={{ color: text }}>
                Livora<span style={{ color: ACCENT }}>Pulse</span>
              </span>
            </Link>
            <p className="text-xs leading-relaxed max-w-sm text-center sm:text-right" style={{ color: faint }}>
              Tracking every dimension of your wellness — built for Asia, ready for the world.
            </p>
          </div>

          {/* 4-column nav */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-10">
            {[
              { title: 'Product', links: ['Features', 'How it works', 'Dimensions', 'LifePulse Score', 'Food database'] },
              { title: 'Company', links: ['About', 'Blog', 'Careers', 'Press', 'Contact'] },
              { title: 'Legal', links: ['Privacy policy', 'Terms of service', 'Cookie policy', 'Data & Asia'] },
            ].map(col => (
              <div key={col.title}>
                <div className="text-xs font-black uppercase tracking-widest mb-4" style={{ color: ACCENT }}>{col.title}</div>
                <ul className="space-y-2.5">
                  {col.links.map(l => (
                    <li key={l}>
                      <a href="#" className="text-xs transition-all"
                        style={{ color: faint }}
                        onClick={e => e.preventDefault()}
                        onMouseEnter={e => (e.currentTarget.style.color = ACCENT)}
                        onMouseLeave={e => (e.currentTarget.style.color = faint)}>
                        {l}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}

            {/* Socials */}
            <div>
              <div className="text-xs font-black uppercase tracking-widest mb-4" style={{ color: ACCENT }}>Socials</div>
              <div className="flex items-center gap-2">
                {[
                  { label: 'X', path: 'M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z' },
                  { label: 'IG', path: 'M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z M17.5 6.5h.01 M7.5 2h9A5.5 5.5 0 0 1 22 7.5v9a5.5 5.5 0 0 1-5.5 5.5h-9A5.5 5.5 0 0 1 2 16.5v-9A5.5 5.5 0 0 1 7.5 2z' },
                  { label: 'LI', path: 'M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z M2 9h4v12H2z M4 6a2 2 0 1 0 0-4 2 2 0 0 0 0 4z' },
                ].map(s => (
                  <button key={s.label} type="button"
                    className="w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:scale-110"
                    style={{ background: cardBg, border: `1px solid ${cardBorder}`, color: faint }}
                    onMouseEnter={e => (e.currentTarget.style.color = ACCENT)}
                    onMouseLeave={e => (e.currentTarget.style.color = faint)}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d={s.path} />
                    </svg>
                  </button>
                ))}
              </div>
              <ul className="space-y-2.5 mt-4">
                {['X (Twitter)', 'Instagram', 'LinkedIn'].map(l => (
                  <li key={l}>
                    <a href="#" onClick={e => e.preventDefault()} className="text-xs" style={{ color: faint }}
                      onMouseEnter={e => (e.currentTarget.style.color = ACCENT)}
                      onMouseLeave={e => (e.currentTarget.style.color = faint)}>
                      {l}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3"
            style={{ borderTop: `1px solid rgba(128,138,152,0.14)` }}>
            <span className="text-xs" style={{ color: faint }}>
              © {new Date().getFullYear()} LivoraPulse. All rights reserved.
            </span>
            <span className="text-xs" style={{ color: faint }}>
              Built for Asia 🌏
            </span>
          </div>
        </div>
      </footer>
    </div>
  )
}

