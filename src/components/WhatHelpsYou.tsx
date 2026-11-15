import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, Heart, Sparkles, TrendingDown, TrendingUp } from 'lucide-react'
import clsx from 'clsx'
import { fetchMoodModel, type MoodModel } from '../api/ml'
import { describeEffect } from '../ml/moodWording'

/** Fetch the mood model's results once; null while loading or if it fails. */
export function useMoodModel() {
  const [model, setModel] = useState<MoodModel | null>(null)
  useEffect(() => {
    let alive = true
    fetchMoodModel().then((m) => { if (alive) setModel(m) }).catch(() => null)
    return () => { alive = false }
  }, [])
  return model
}

/**
 * "What helps you": habits that go with a better (or lower) mood for this
 * person, learned nightly by the mood model. Until there's enough data,
 * explains how to get there.
 */
export default function WhatHelpsYou({ model }: { model: MoodModel | null }) {
  const navigate = useNavigate()
  if (!model) return null

  const items = model.effects.map((e) => ({ e, s: describeEffect(e) })).filter((x) => x.s).slice(0, 4)

  if (items.length === 0) {
    return (
      <section className="lp-card rounded-3xl p-6 max-sm:p-5 flex items-start gap-4 max-sm:flex-col">
        <span className="w-10 h-10 rounded-full bg-[#E8F5E9] dark:bg-[#3D9A41]/15 text-[#3D9A41] flex items-center justify-center flex-shrink-0">
          <Sparkles size={18} />
        </span>
        <div className="flex-1">
          <h2 className="font-serif text-xl text-black/85 dark:text-white/90">What helps you</h2>
          <p className="text-sm text-black/55 dark:text-white/55 mt-1 leading-relaxed max-w-xl">
            Log your mood on at least {model.minMoodDays} days, along with your sleep, steps or screen time, and
            LivoraPulse will start learning which habits go with your better days.
          </p>
        </div>
        <button type="button" onClick={() => navigate('/mood')}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold text-white bg-[#2E7D32] hover:bg-[#276b2b] transition-colors flex-shrink-0">
          <Heart size={14} /> Log your mood
        </button>
      </section>
    )
  }

  return (
    <section className="lp-card rounded-3xl p-6 max-sm:p-5">
      <div className="flex items-baseline justify-between gap-3 mb-4 max-sm:flex-col max-sm:gap-0.5">
        <h2 className="font-serif text-xl text-black/85 dark:text-white/90">What helps you</h2>
        <span className="text-xs text-black/40 dark:text-white/40">From your last {model.moodDays} mood days</span>
      </div>
      <ul className="grid md:grid-cols-2 gap-3">
        {items.map(({ e, s }) => (
          <li key={e.feature} className="rounded-2xl border border-black/[0.06] dark:border-white/[0.07] p-4">
            <div className="flex items-start gap-3">
              <span className={clsx('w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0',
                s!.helps ? 'bg-[#E8F5E9] text-[#3D9A41] dark:bg-[#3D9A41]/15' : 'bg-amber-50 text-amber-600 dark:bg-amber-500/15')}>
                {s!.helps ? <TrendingUp size={15} /> : <TrendingDown size={15} />}
              </span>
              <div className="min-w-0">
                <p className="text-sm font-medium text-black/80 dark:text-white/85 leading-snug">{s!.headline}</p>
                {s!.detail && <p className="text-xs text-black/45 dark:text-white/45 mt-1">{s!.detail}</p>}
                <button type="button" onClick={() => navigate(s!.to)}
                  className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-[#2E7D32] dark:text-[#6FCF73] hover:underline text-left">
                  {s!.tip} <ArrowRight size={12} className="flex-shrink-0" />
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>
      <p className="text-[11px] text-black/40 dark:text-white/35 mt-4 leading-relaxed">
        Learned from your own logs and updated every night. “For you” means your own days show it clearly; “for most
        people” means your data isn’t enough yet, so it’s what’s typical. Patterns, not proven causes.
      </p>
    </section>
  )
}
