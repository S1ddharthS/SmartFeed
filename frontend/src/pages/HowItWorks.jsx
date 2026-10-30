import { ArrowRight, Boxes, Building2, CheckCircle2, Clock, Hourglass, Layers, Scale, ShieldCheck, Sparkles, Split, Zap } from 'lucide-react'
import { PageHeader } from '../components/ui'

const Formula = ({ title, desc, rows }) => (
  <div className="card p-5 border-line shadow-card flex flex-col justify-between">
    <div>
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-brand-600" />
        <h3 className="text-sm sm:text-base font-semibold text-ink">{title}</h3>
      </div>
      <p className="mt-1 text-xs text-ink-soft leading-relaxed">{desc}</p>

      <ul className="mt-3.5 space-y-2 text-xs">
        {rows.map(([w, t, d]) => (
          <li key={t} className="flex items-start gap-2.5 rounded-lg border border-line bg-slate-50/70 p-2.5">
            <span className="w-10 shrink-0 rounded bg-brand-50 border border-brand-100 py-0.5 text-center font-mono font-bold text-brand-700 text-xs">
              {w}
            </span>
            <div className="flex-1">
              <span className="font-semibold text-ink block">{t}</span>
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
    [Building2, 'Multi-Depot Fleet', 'Vehicles depart and return to their designated hub across Bangalore, avoiding wasted empty kilometers.'],
    [Boxes, 'Strict Payload Bounds', 'Vehicle capacity limits are strictly enforced at every pickup stop along the route.'],
    [Split, 'Split Lot Deliveries', 'One large banquet surplus batch can supply multiple shelters, eliminating all-or-nothing bottlenecks.'],
    [Clock, 'Operating Windows', 'Deliveries only arrive during staffed volunteer hours. Early arrivals wait safely outside.'],
    [Hourglass, 'Zero-Waste Expiry Check', 'Any route plan that risks arriving past food safety shelf-life is rejected outright.'],
    [ShieldCheck, 'Sub-Second Optimization', 'Heuristic insertion + 2-opt local search optimization solves full fleet routes in under 1 second.'],
  ]

  return (
    <div className="space-y-8 max-w-5xl mx-auto animate-fade-in">
      <PageHeader
        title="System Architecture & Optimization"
        subtitle="How SmartFeed routes food from surplus to plate through urgency scoring, split matching, and constraint-based fleet logistics."
        badge={
          <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 border border-brand-100 px-2.5 py-0.5 text-xs font-semibold text-brand-700">
            <Zap className="h-3 w-3 text-brand-500" /> Platform Architecture
          </span>
        }
      />

      {/* 4-Step Pipeline */}
      <div>
        <div className="text-xs font-semibold uppercase tracking-wider text-ink-soft mb-2.5">
          The 4-Step Autonomous Pipeline
        </div>
        <ol className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
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
              className="card p-4 hover:border-slate-300 hover:shadow-card-hover transition-all"
            >
              <div className="flex items-center gap-2.5 mb-2">
                <span className="grid h-6 w-6 place-items-center rounded-lg bg-brand-500 text-xs font-bold text-white shadow-sm">
                  {st.n}
                </span>
                <span className="text-sm font-semibold text-ink">{st.t}</span>
              </div>
              <p className="text-xs text-ink-soft leading-relaxed">{st.d}</p>
            </li>
          ))}
        </ol>
      </div>

      {/* Scoring Formulas */}
      <div>
        <div className="text-xs font-semibold uppercase tracking-wider text-ink-soft mb-2.5">
          Mathematical Weighting Formulae
        </div>
        <div className="grid gap-4 md:grid-cols-2">
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
      <div className="card p-5 space-y-3">
        <div className="flex items-center gap-2">
          <Scale className="h-4 w-4 text-brand-600" />
          <h3 className="text-sm font-semibold text-ink">Urgency Classification & Status Badges</h3>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-lg border border-urgent-border bg-urgent-soft/40 p-3">
            <span className="inline-block rounded-full bg-urgent px-2 py-0.5 text-[10px] font-semibold text-white mb-1.5">
              Score ≥ 0.60
            </span>
            <div className="font-semibold text-urgent text-xs">High Urgency</div>
            <p className="text-[11px] text-ink-soft mt-1 leading-snug">
              Cooked meals with &lt; 3 hours before expiry, or Level 5 crisis shelter. Dispatched immediately.
            </p>
          </div>

          <div className="rounded-lg border border-warning-border bg-warning-soft/40 p-3">
            <span className="inline-block rounded-full bg-warning px-2 py-0.5 text-[10px] font-semibold text-white mb-1.5">
              Score 0.40 – 0.59
            </span>
            <div className="font-semibold text-warning text-xs">Moderate Urgency</div>
            <p className="text-[11px] text-ink-soft mt-1 leading-snug">
              Surplus with moderate shelf-life (3–6 hours). Scheduled on upcoming vehicle wave.
            </p>
          </div>

          <div className="rounded-lg border border-brand-100 bg-brand-50/40 p-3">
            <span className="inline-block rounded-full bg-brand-500 px-2 py-0.5 text-[10px] font-semibold text-white mb-1.5">
              Score &lt; 0.40
            </span>
            <div className="font-semibold text-brand-700 text-xs">Stable / Flexible</div>
            <p className="text-[11px] text-ink-soft mt-1 leading-snug">
              Dry rations or raw produce with 12h+ shelf-life. Slotted flexibly into vehicle capacity.
            </p>
          </div>
        </div>
      </div>

      {/* Constraints */}
      <div>
        <div className="text-xs font-semibold uppercase tracking-wider text-ink-soft mb-2.5">
          Real-World Logistics Constraints
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {rules.map(([Icon, t, d]) => (
            <div key={t} className="card p-4 hover:border-slate-300 transition-all">
              <div className="grid h-8 w-8 place-items-center rounded-lg bg-slate-50 border border-line text-brand-600 mb-2.5">
                <Icon className="h-4 w-4" />
              </div>
              <span className="text-sm font-semibold text-ink block">{t}</span>
              <p className="mt-1 text-xs text-ink-soft leading-relaxed">{d}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
