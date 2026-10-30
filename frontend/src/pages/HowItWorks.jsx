import { ArrowRight, Boxes, Building2, CheckCircle2, Clock, Hourglass, Layers, Scale, ShieldCheck, Sparkles, Split, Zap } from 'lucide-react'
import { PageHeader } from '../components/ui'

const Formula = ({ title, desc, rows }) => (
  <div className="card p-6 border-slate-200/90 shadow-sm flex flex-col justify-between">
    <div>
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-leaf-700" />
        <h3 className="font-display text-base font-bold text-ink">{title}</h3>
      </div>
      <p className="mt-1 text-xs text-ink-soft leading-relaxed">{desc}</p>

      <ul className="mt-4 space-y-2.5 text-xs">
        {rows.map(([w, t, d]) => (
          <li key={t} className="flex items-start gap-3 rounded-xl border border-slate-100 bg-slate-50/70 p-3">
            <span className="w-12 shrink-0 rounded-lg bg-emerald-100 py-1 text-center font-mono font-bold text-emerald-900 text-xs">
              {w}
            </span>
            <div className="flex-1">
              <b className="font-bold text-ink block">{t}</b>
              <span className="text-ink-soft leading-snug">{d}</span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  </div>
)

export default function HowItWorks() {
  const rules = [
    [Building2, 'Multi-Depot Fleet', 'Vehicles depart and return to their designated hub across Bangalore, avoiding wasted deadhead kilometers.'],
    [Boxes, 'Strict Payload Bounds', 'Vehicle capacity limits are strictly enforced at every pickup stop along the route.'],
    [Split, 'Split Lot Deliveries', 'One large banquet donation can supply multiple shelters, and vice-versa, avoiding all-or-nothing bottlenecks.'],
    [Clock, 'Operating Windows', 'Deliveries only arrive during staffed operating hours. Early arrivals wait safely.'],
    [Hourglass, 'Zero-Waste Expiry Check', 'Any route plan that delivers food even 1 minute past its shelf-life is rejected outright.'],
    [ShieldCheck, 'Sub-Second Optimization', 'Greedy insertion + 2-opt local search optimization finishes routing in under 1 second.'],
  ]

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <PageHeader
        title="How SmartFeed Logistics Works"
        subtitle="Moving food from surplus to plate through urgency scoring, split matching, and constraint-based vehicle routing."
        badge={
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800 border border-emerald-200">
            <Zap className="h-3.5 w-3.5 text-emerald-700" /> System Architecture
          </span>
        }
      />

      {/* 4-Step Pipeline */}
      <div>
        <div className="text-xs font-bold uppercase tracking-wider text-ink-mute mb-3">
          The 4-Step Autonomous Pipeline
        </div>
        <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              n: '1',
              t: 'Urgency Scoring',
              d: 'Expiry curve, batch weight, and recipient hunger urgency are synthesized into a real-time 0–1 score.',
            },
            {
              n: '2',
              t: 'Priority Split Match',
              d: 'Priority = Donor Urgency × Recipient Urgency × Feasibility. Splits ensure high volume is never wasted.',
            },
            {
              n: '3',
              t: 'Multi-Depot Routing',
              d: 'Solves the Vehicle Routing Problem with Time Windows (VRPTW), respecting shift hours and perishability.',
            },
            {
              n: '4',
              t: 'Live Dispatch Manifest',
              d: 'Driver timelines, real-time arrival ETAs, and verified food safety compliance for all stakeholders.',
            },
          ].map((st) => (
            <li
              key={st.n}
              className="card relative p-5 border-slate-200 shadow-sm transition hover:shadow-card-hover"
            >
              <div className="flex items-center gap-3 mb-2">
                <span className="grid h-8 w-8 place-items-center rounded-xl bg-leaf-700 font-display text-sm font-bold text-white shadow-sm">
                  {st.n}
                </span>
                <b className="font-display text-base font-bold text-ink">{st.t}</b>
              </div>
              <p className="text-xs text-ink-soft leading-relaxed">{st.d}</p>
            </li>
          ))}
        </ol>
      </div>

      {/* Scoring Formulas */}
      <div>
        <div className="text-xs font-bold uppercase tracking-wider text-ink-mute mb-3">
          Mathematical Weighting Formulae
        </div>
        <div className="grid gap-5 md:grid-cols-2">
          <Formula
            title="Donation Urgency Score (0 to 1)"
            desc="Synthesizes how quickly food will spoil and how easily it can be collected."
            rows={[
              ['60%', 'Expiry Pressure', '1 − (hours remaining ÷ 24h baseline shelf life)'],
              ['30%', 'Batch Volume Weight', 'Batch kg ÷ 100 kg reference payload'],
              ['10%', 'Pickup Window Tightness', '1 − (window duration ÷ 24h)'],
            ]}
          />
          <Formula
            title="Request Urgency Score (0 to 1)"
            desc="Prioritizes children centers, night shelters, and vulnerable populations."
            rows={[
              ['50%', 'Hunger Severity Level', 'Recipient severity level (1–5) ÷ 5'],
              ['30%', 'Delivery Window Tightness', '1 − (receiving duration ÷ 24h)'],
              ['20%', 'Unserved Waiting Time', 'Hours waiting in queue ÷ 12h reference'],
            ]}
          />
        </div>
      </div>

      {/* Color Language Reference */}
      <div className="card p-5 border-slate-200 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <Scale className="h-4 w-4 text-leaf-700" />
          <h3 className="font-display text-base font-bold text-ink">Urgency Classification & Color Codes</h3>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-rose-200 bg-rose-50/70 p-3.5">
            <span className="inline-block rounded-full bg-rose-600 px-2.5 py-0.5 text-[11px] font-bold text-white mb-1.5">
              Urgency ≥ 0.60
            </span>
            <div className="font-bold text-rose-950 text-xs">High Urgency</div>
            <p className="text-[11px] text-rose-800 mt-1">
              Cooked meals with &lt; 3 hours before expiry, or Level 5 crisis shelter. Dispatched immediately.
            </p>
          </div>

          <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-3.5">
            <span className="inline-block rounded-full bg-amber-600 px-2.5 py-0.5 text-[11px] font-bold text-white mb-1.5">
              Urgency 0.40 – 0.59
            </span>
            <div className="font-bold text-amber-950 text-xs">Medium Urgency</div>
            <p className="text-[11px] text-amber-800 mt-1">
              Surplus with moderate shelf-life (3–6 hours). Scheduled on upcoming vehicle wave.
            </p>
          </div>

          <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-3.5">
            <span className="inline-block rounded-full bg-emerald-600 px-2.5 py-0.5 text-[11px] font-bold text-white mb-1.5">
              Urgency &lt; 0.40
            </span>
            <div className="font-bold text-emerald-950 text-xs">Stable / Flexible</div>
            <p className="text-[11px] text-emerald-800 mt-1">
              Dry food or raw produce with 12h+ shelf-life. Slotted flexibly into vehicle capacity.
            </p>
          </div>
        </div>
      </div>

      {/* Constraints that make it realistic */}
      <div>
        <div className="text-xs font-bold uppercase tracking-wider text-ink-mute mb-3">
          Real-World Logistics Constraints
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rules.map(([Icon, t, d]) => (
            <div key={t} className="card p-5 border-slate-200 shadow-sm transition hover:shadow-card-hover">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-slate-100 text-leaf-800 mb-3">
                <Icon className="h-5 w-5" />
              </div>
              <b className="font-display text-base font-bold text-ink block">{t}</b>
              <p className="mt-1 text-xs text-ink-soft leading-relaxed">{d}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
