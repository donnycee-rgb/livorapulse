import { Plus } from 'lucide-react'
import { useMemo, useState } from 'react'
import toast from 'react-hot-toast'

import Card from '../components/Card'
import ChartCard from '../components/charts/ChartCard'
import CarbonLineChart from '../components/charts/CarbonLineChart'
import RecyclePlasticBarChart from '../components/charts/RecyclePlasticBarChart'
import TransportModeChart from '../components/charts/TransportModeChart'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Modal from '../components/ui/Modal'

import type { TransportMode } from '../data/types'
import { useAppStore } from '../store/useAppStore'

export default function Environment() {
  const env = useAppStore((s) => s.environment)
  const addEcoAction = useAppStore((s) => s.addEcoAction)
  const setTransportMode = useAppStore((s) => s.setTransportMode)

  const [open, setOpen] = useState(false)
  const [type, setType] = useState('Recycled plastic')
  const [impact, setImpact] = useState('0.4')

  const recent = useMemo(() => env.ecoActions.slice(0, 8), [env.ecoActions])

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-lg font-bold text-lp-secondary dark:text-white">Environment</div>
          <div className="text-sm text-black/60 dark:text-white/60">Eco actions, transport, and carbon impact.</div>
        </div>

        <Button variant="secondary" onClick={() => setOpen(true)}>
          <Plus size={18} />
          Add eco action
        </Button>
      </div>

      <Card className="p-4 md:p-6 space-y-5">
        <div>
          <div className="text-sm font-semibold text-black/80 dark:text-white/85">Transport mode</div>
          <div className="text-xs text-black/55 dark:text-white/55 mt-0.5">Select today’s primary mode</div>

          <div className="mt-3 flex flex-wrap gap-2">
            {(['Walking', 'Cycling', 'Driving'] as TransportMode[]).map((m) => (
              <Button
                key={m}
                variant={env.transportMode === m ? 'secondary' : 'ghost'}
                onClick={() => {
                  setTransportMode(m)
                  toast.success(`Transport set to ${m}`)
                }}
              >
                {m}
              </Button>
            ))}
          </div>
        </div>

        <div>
          <div className="text-sm font-semibold text-black/80 dark:text-white/85">Eco actions log</div>
          <div className="text-xs text-black/55 dark:text-white/55 mt-0.5">Recent sustainable actions</div>

          <div className="mt-2 grid md:grid-cols-2 gap-2">
            {recent.map((a) => (
              <div key={a.id} className="rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-slate-900 p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-black/85 dark:text-white/90">{a.type}</div>
                    <div className="text-xs text-black/55 dark:text-white/55 mt-0.5">
                      {new Date(a.timestamp).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                    </div>
                  </div>
                  <div className="text-xs font-bold text-lp-primary">
                    -{a.impactKgCO2.toFixed(1)} kg CO₂
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>

      <div className="grid md:grid-cols-2 gap-4">
        <ChartCard title="Recycling vs Plastic" subtitle="Items per day">
          <RecyclePlasticBarChart recycled={env.recycledItemsByDay} plastic={env.plasticUsageByDay} />
        </ChartCard>

        <ChartCard title="Transport split" subtitle="Trips by mode">
          <TransportModeChart data={env.transportModeSplit} />
        </ChartCard>

        <div className="md:col-span-2">
          <ChartCard title="Carbon impact" subtitle="kg CO₂ per day">
            <CarbonLineChart data={env.carbonKgByDay} />
          </ChartCard>
        </div>
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Add eco action">
        <div className="grid md:grid-cols-2 gap-3">
          <Input label="Action" value={type} onChange={(e) => setType(e.target.value)} />
          <Input
            label="Estimated impact (kg CO₂ reduced)"
            value={impact}
            onChange={(e) => setImpact(e.target.value)}
            inputMode="decimal"
          />
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              const imp = Math.max(0, Number(impact) || 0)
              addEcoAction({ type: type.trim() || 'Eco action', impactKgCO2: imp })
              setOpen(false)
              toast.success('Eco action added')
            }}
          >
            Save
          </Button>
        </div>
      </Modal>
    </div>
  )
}
