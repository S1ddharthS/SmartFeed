import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  HeartHandshake,
  MapPinned,
  ShieldCheck,
  Soup,
  Sparkles,
  Split,
  Timer,
  Truck,
  Zap,
} from 'lucide-react'
import { useApp } from '../context/AppContext'
import { homeFor } from '../lib/utils'

export default function Landing() {
  const { user, signIn, toast } = useApp()
  const nav = useNavigate()
  const [activeTab, setActiveTab] = useState('solution') // 'solution' | 'flaws'

  const launchDemo = async (roleName) => {
    const creds = {
      admin: { u: 'admin', p: 'admin123' },
      donor: { u: 'greenleaf', p: 'donor123' },
      receiver: { u: 'hopeshelter', p: 'receiver123' },
    }[roleName]
    if (creds) {
      try {
        const u = await signIn(creds.u, creds.p)
        toast(`Signed in as ${u.username} (${u.role})`)
        nav(homeFor(u.role))
      } catch (e) {
        toast(e.message, 'error')
      }
    }
  }

  const problems = [
    {
      icon: Timer,
      title: 'Matched Too Late',
      desc: 'Manual phone calls and spreadsheets cause cooked surplus to expire before vehicles are dispatched.',
    },
    {
      icon: MapPinned,
      title: 'Proximity over Need',
      desc: 'Standard tools assign surplus to whoever is closest, bypassing shelters facing severe hunger crises.',
    },
    {
      icon: Clock,
      title: 'Expiry Curves Ignored',
      desc: 'Cooked hot meals with 2-hour shelf lives are scheduled with the same urgency as dry packaged rations.',
    },
    {
      icon: HeartHandshake,
      title: 'Peripheral Shelters Missed',
      desc: 'Single-depot routing systematically leaves out orphanages and shelters in distant neighborhoods.',
    },
  ]

  const solutions = [
    {
      icon: Zap,
      title: 'Dynamic Urgency Scoring',
      desc: 'Continuously ranks every surplus batch and shelter request by expiry curve, hunger severity, and time slack.',
    },
    {
      icon: Split,
      title: 'Intelligent Split Matching',
      desc: 'Divides large surplus lots across multiple small shelters to eliminate all-or-nothing bottlenecks.',
    },
    {
      icon: Truck,
      title: 'Multi-Depot Routing',
      desc: 'Coordinates multi-hub vehicle fleets across Bangalore with strict capacity and delivery time windows.',
    },
    {
      icon: ShieldCheck,
      title: 'Guaranteed Food Safety',
      desc: 'Rejects any route arrival that risks food safety, ensuring every meal reaches a plate fresh.',
    },
  ]

  return (
    <div className="space-y-12 animate-fade-in">
      {/* Light-Mode SaaS Hero Section */}
      <section className="relative overflow-hidden rounded-2xl border border-line bg-white p-6 sm:p-10 md:p-12 shadow-card">
        {/* Subtle background glow */}
        <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-brand-50/80 blur-3xl" />
        <div className="pointer-events-none absolute -left-20 -bottom-20 h-72 w-72 rounded-full bg-slate-50 blur-2xl" />

        <div className="relative max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-brand-100 bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">
            <Sparkles className="h-3.5 w-3.5 text-brand-500" />
            <span>Urgency-First Food Rescue Logistics</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-ink leading-[1.15]">
            Food should reach a hungry plate{' '}
            <span className="text-brand-500">before</span> it reaches a bin.
          </h1>

          <p className="text-sm sm:text-base text-ink-soft leading-relaxed max-w-2xl">
            SmartFeed automates food rescue operations with mathematical urgency scoring, split-lot matching, and multi-depot fleet routing to deliver surplus meals on time.
          </p>

          <div className="flex flex-wrap items-center gap-2.5 pt-2">
            {user ? (
              <Link
                to={homeFor(user.role)}
                className="btn-primary !px-4 !py-2.5 text-sm"
              >
                <span>Open Dashboard ({user.role})</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => launchDemo('admin')}
                  className="btn-primary !px-4 !py-2.5 text-sm"
                >
                  <ShieldCheck className="h-4 w-4" />
                  <span>Launch Operations Center</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => launchDemo('donor')}
                  className="btn-secondary !px-3.5 !py-2.5 text-sm"
                >
                  <Soup className="h-4 w-4 text-brand-600" />
                  <span>Donor Demo</span>
                </button>
                <button
                  type="button"
                  onClick={() => launchDemo('receiver')}
                  className="btn-secondary !px-3.5 !py-2.5 text-sm"
                >
                  <HeartHandshake className="h-4 w-4 text-info" />
                  <span>Shelter Demo</span>
                </button>
              </>
            )}
            <Link
              to="/how-it-works"
              className="btn-ghost !px-3.5 !py-2.5 text-sm"
            >
              How It Works
            </Link>
          </div>
        </div>

        {/* Operational Performance Strip */}
        <div className="relative mt-8 pt-6 border-t border-line grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <div className="text-xs font-medium text-ink-mute uppercase tracking-wider">Food Wasted</div>
            <div className="text-xl sm:text-2xl font-bold text-brand-600 mt-0.5">0 kg</div>
            <div className="text-[11px] text-ink-soft">100% safe window delivery</div>
          </div>
          <div>
            <div className="text-xs font-medium text-ink-mute uppercase tracking-wider">On-Time Arrival</div>
            <div className="text-xl sm:text-2xl font-bold text-brand-600 mt-0.5">100%</div>
            <div className="text-[11px] text-ink-soft">Zero deadline violations</div>
          </div>
          <div>
            <div className="text-xs font-medium text-ink-mute uppercase tracking-wider">High Need Served</div>
            <div className="text-xl sm:text-2xl font-bold text-ink mt-0.5">10/10</div>
            <div className="text-[11px] text-ink-soft">No shelters skipped</div>
          </div>
          <div>
            <div className="text-xs font-medium text-ink-mute uppercase tracking-wider">Optimization Time</div>
            <div className="text-xl sm:text-2xl font-bold text-ink mt-0.5">&lt; 1s</div>
            <div className="text-[11px] text-ink-soft">Real-time route solver</div>
          </div>
        </div>
      </section>

      {/* Unified Tabbed Comparison: Status Quo vs SmartFeed */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-brand-600">The Problem & Solution</div>
            <h2 className="text-lg sm:text-xl font-bold text-ink mt-0.5">
              Why SmartFeed is Fundamentally Different
            </h2>
          </div>

          <div className="flex items-center rounded-lg border border-line bg-slate-50 p-1 text-xs font-semibold self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setActiveTab('solution')}
              className={`rounded px-3 py-1.5 transition ${
                activeTab === 'solution'
                  ? 'bg-white text-brand-700 shadow-sm font-semibold'
                  : 'text-ink-soft hover:text-ink'
              }`}
            >
              SmartFeed Optimization
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('flaws')}
              className={`rounded px-3 py-1.5 transition ${
                activeTab === 'flaws'
                  ? 'bg-white text-urgent shadow-sm font-semibold'
                  : 'text-ink-soft hover:text-ink'
              }`}
            >
              Traditional Food Banks (Flaws)
            </button>
          </div>
        </div>

        {activeTab === 'solution' ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 animate-fade-in">
            {solutions.map((s) => (
              <div
                key={s.title}
                className="card p-5 hover:border-slate-300 hover:shadow-card-hover transition-all"
              >
                <div className="grid h-9 w-9 place-items-center rounded-lg bg-brand-50 text-brand-600 mb-3 border border-brand-100">
                  <s.icon className="h-4 w-4" />
                </div>
                <h3 className="text-sm font-semibold text-ink">{s.title}</h3>
                <p className="mt-1 text-xs text-ink-soft leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 animate-fade-in">
            {problems.map((p) => (
              <div
                key={p.title}
                className="card p-5 border-urgent-border/80 bg-urgent-soft/30 hover:border-urgent-border transition-all"
              >
                <div className="grid h-9 w-9 place-items-center rounded-lg bg-urgent-soft text-urgent mb-3 border border-urgent-border">
                  <p.icon className="h-4 w-4" />
                </div>
                <h3 className="text-sm font-semibold text-ink">{p.title}</h3>
                <p className="mt-1 text-xs text-ink-soft leading-relaxed">{p.desc}</p>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Role Portals */}
      <section className="space-y-4">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-ink-soft">Stakeholders</div>
          <h2 className="text-lg sm:text-xl font-bold text-ink mt-0.5">
            Portals Tailored for Every Participant
          </h2>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {[
            {
              role: 'Food Donors',
              sub: 'Restaurants, caterers, banquet halls, groceries',
              desc: 'Register surplus food in under 60 seconds. Specify pickup windows and track vehicle arrival in real time.',
              cta: 'Open Donor Portal',
              key: 'donor',
              to: '/donor',
              icon: Soup,
            },
            {
              role: 'Beneficiaries & Shelters',
              sub: 'Night shelters, orphanages, care homes',
              desc: 'Request food rations, indicate hunger urgency levels, and receive verified arrival ETAs for volunteer readiness.',
              cta: 'Open Shelter Portal',
              key: 'receiver',
              to: '/receiver',
              icon: HeartHandshake,
            },
            {
              role: 'Logistics Coordinators',
              sub: 'Food bank operations & dispatch fleet staff',
              desc: 'One-click automated matching, live telemetry map, multi-depot vehicle manifests, and instant route re-planning.',
              cta: 'Open Operations Center',
              key: 'admin',
              to: '/admin',
              icon: Truck,
            },
          ].map((c) => (
            <button
              key={c.role}
              type="button"
              onClick={() => (user ? nav(c.to) : launchDemo(c.key))}
              className="card p-6 text-left hover:border-slate-300 hover:shadow-card-hover transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="grid h-10 w-10 place-items-center rounded-lg bg-slate-50 border border-line text-brand-600 mb-3.5 group-hover:bg-brand-50 transition-colors">
                  <c.icon className="h-5 w-5" />
                </div>
                <h3 className="text-base font-semibold text-ink">{c.role}</h3>
                <div className="text-xs text-brand-600 font-medium mt-0.5">{c.sub}</div>
                <p className="mt-2 text-xs sm:text-sm text-ink-soft leading-relaxed">{c.desc}</p>
              </div>

              <div className="mt-5 pt-3 border-t border-line flex items-center justify-between text-xs font-semibold text-brand-600">
                <span>{c.cta}</span>
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* Fast-Track Evaluator Callout */}
      <section className="card p-6 border-line bg-slate-50/70">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h3 className="text-base font-bold text-ink">Ready to evaluate the dispatch engine?</h3>
            <p className="text-xs sm:text-sm text-ink-soft max-w-xl">
              Experience the urgency-first algorithm with 10 simulated donors, 10 recipient shelters, and 3 distribution hubs across Bangalore.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => launchDemo('admin')}
              className="btn-primary !px-4 !py-2.5 text-xs sm:text-sm"
            >
              <Zap className="h-4 w-4" />
              <span>Launch & Auto-Dispatch Now</span>
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}
