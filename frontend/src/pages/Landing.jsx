import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, CheckCircle2, Clock, HeartHandshake, MapPinned, Play, ShieldCheck, Soup, Sparkles, Split, Timer, Truck, Users, Zap } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { homeFor } from '../lib/utils'

export default function Landing() {
  const { user, signIn, toast } = useApp()
  const nav = useNavigate()

  const launchDemo = async (roleName) => {
    const creds = {
      admin: { u: 'admin', p: 'admin123' },
      donor: { u: 'greenleaf', p: 'donor123' },
      receiver: { u: 'hopeshelter', p: 'receiver123' },
    }[roleName]
    if (creds) {
      try {
        const u = await signIn(creds.u, creds.p)
        toast(`Launched live simulation as ${u.username} (${u.role})`)
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
      desc: 'By the time a manual phone call or spreadsheet match happens, perishable cooked food has already passed its safe window.',
    },
    {
      icon: MapPinned,
      title: 'Proximity over Need',
      desc: 'Conventional apps send food to whoever is closest or whoever logged in first, ignoring critical hunger emergencies elsewhere.',
    },
    {
      icon: Clock,
      title: 'Expiry Deadlines Ignored',
      desc: 'No traditional platform scores and dynamically ranks donations against tight expiration curves in real time.',
    },
    {
      icon: HeartHandshake,
      title: 'High-Need Shelters Missed',
      desc: 'Remote or overburdened night shelters and orphanages are consistently skipped by single-depot delivery trucks.',
    },
  ]

  const solutions = [
    {
      icon: Zap,
      title: 'Dynamic Urgency Scoring',
      desc: 'Every donation and request is continuously evaluated with a 0–1 score factoring shelf life, batch weight, and hunger severity.',
    },
    {
      icon: Split,
      title: 'Intelligent Split Matching',
      desc: 'Large surplus batches can feed multiple smaller shelters simultaneously. No donation is forced into an all-or-nothing bottleneck.',
    },
    {
      icon: Truck,
      title: 'Multi-Depot Routing',
      desc: 'Fleet optimization coordinates vehicles across multiple urban hubs, enforcing load limits and guaranteeing on-time arrival.',
    },
    {
      icon: ShieldCheck,
      title: 'Zero Food Safety Compromise',
      desc: 'Deliveries that risk arriving even 1 minute past shelf life are flagged and prevented, ensuring only fresh food is served.',
    },
  ]

  return (
    <div className="space-y-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-leaf-950 to-slate-900 px-6 py-16 text-white md:px-14 md:py-24 shadow-elevated">
        <div className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-emerald-500/20 blur-3xl" />
        <div className="pointer-events-none absolute -left-20 -bottom-20 h-80 w-80 rounded-full bg-leaf-600/20 blur-3xl" />

        <div className="relative max-w-3xl space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-emerald-300 ring-1 ring-white/20 backdrop-blur-sm">
            <Sparkles className="h-3.5 w-3.5" /> Urgency-First Food Rescue Logistics
          </div>

          <h1 className="font-display text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl md:text-6xl">
            Food should reach a hungry plate{' '}
            <span className="text-emerald-400 underline decoration-emerald-500/50 decoration-wavy">before</span> it reaches a bin.
          </h1>

          <p className="text-base sm:text-lg text-slate-300 leading-relaxed max-w-2xl">
            SmartFeed replaces chaotic phone trees and first-come-first-serve heuristics with automated urgency scoring, split lot matching, and multi-depot fleet routing.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-3">
            {user ? (
              <Link
                to={homeFor(user.role)}
                className="btn bg-white text-slate-900 font-bold hover:bg-slate-100 shadow-lg !py-3 !px-6"
              >
                <span>Go to My Dashboard ({user.role})</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => launchDemo('admin')}
                  className="btn bg-emerald-500 text-slate-950 font-bold hover:bg-emerald-400 shadow-lg !py-3 !px-6 flex items-center gap-2"
                >
                  <ShieldCheck className="h-4 w-4" />
                  <span>Launch Admin Control Center</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => launchDemo('donor')}
                  className="btn border border-white/30 bg-white/10 text-white font-semibold hover:bg-white/20 !py-3 !px-5 backdrop-blur-sm flex items-center gap-2"
                >
                  <Soup className="h-4 w-4 text-emerald-300" />
                  <span>Donor Demo</span>
                </button>
                <button
                  type="button"
                  onClick={() => launchDemo('receiver')}
                  className="btn border border-white/30 bg-white/10 text-white font-semibold hover:bg-white/20 !py-3 !px-5 backdrop-blur-sm flex items-center gap-2"
                >
                  <HeartHandshake className="h-4 w-4 text-blue-300" />
                  <span>Shelter Demo</span>
                </button>
              </>
            )}
            <Link
              to="/how-it-works"
              className="btn text-slate-300 hover:text-white hover:bg-white/10 !py-3 !px-4"
            >
              How It Works
            </Link>
          </div>
        </div>
      </section>

      {/* The Flaws of the Current System */}
      <section className="space-y-6">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-rose-600">The Status Quo</span>
          <h2 className="text-2xl font-bold font-display sm:text-3xl text-ink mt-0.5">
            Why Traditional Food Rescue Fails
          </h2>
          <p className="text-sm text-ink-soft mt-1 max-w-2xl">
            Most food banks still rely on phone trees or basic proximity matching that ignore perishable expiry curves.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {problems.map((p) => (
            <div
              key={p.title}
              className="card p-5 border-rose-200/80 bg-rose-50/20 shadow-sm transition hover:shadow-card-hover"
            >
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-rose-100 text-rose-700 mb-3">
                <p.icon className="h-5 w-5" />
              </div>
              <h3 className="font-display text-base font-bold text-ink">{p.title}</h3>
              <p className="mt-1.5 text-xs text-ink-soft leading-relaxed">{p.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* What SmartFeed Does Differently */}
      <section className="space-y-6">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">The Solution</span>
          <h2 className="text-2xl font-bold font-display sm:text-3xl text-ink mt-0.5">
            How SmartFeed Fixes It
          </h2>
          <p className="text-sm text-ink-soft mt-1 max-w-2xl">
            Mathematical modeling, split matching, and constraint-aware routing turn surplus into reliable sustenance.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {solutions.map((s) => (
            <div
              key={s.title}
              className="card p-5 border-emerald-200 bg-emerald-50/20 shadow-sm transition hover:shadow-card-hover"
            >
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-100 text-emerald-800 mb-3">
                <s.icon className="h-5 w-5" />
              </div>
              <h3 className="font-display text-base font-bold text-ink">{s.title}</h3>
              <p className="mt-1.5 text-xs text-ink-soft leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Role Navigation Cards */}
      <section className="space-y-6">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-ink-mute">Explore by Role</span>
          <h2 className="text-2xl font-bold font-display sm:text-3xl text-ink mt-0.5">
            Designed for Every Stakeholder
          </h2>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          {[
            {
              role: 'Food Donors',
              sub: 'Restaurants, caterers, banquet halls, groceries',
              desc: 'List surplus in 60 seconds. Get clear pickup notifications and track the exact shelter receiving your meals.',
              cta: 'Launch Donor Portal',
              key: 'donor',
              to: '/donor',
              icon: Soup,
            },
            {
              role: 'Beneficiaries & Shelters',
              sub: 'Night shelters, care homes, orphanages, soup kitchens',
              desc: 'Specify food quantities and hunger urgency. Get verified vehicle arrival ETAs so volunteers are ready at the door.',
              cta: 'Launch Shelter Portal',
              key: 'receiver',
              to: '/receiver',
              icon: HeartHandshake,
            },
            {
              role: 'Rescue Network Admins',
              sub: 'Food bank operations coordinators & logistics staff',
              desc: 'One-click matching and routing, live map telemetry, driver manifests, and instant re-planning when disruptions occur.',
              cta: 'Launch Operations Center',
              key: 'admin',
              to: '/admin',
              icon: Truck,
            },
          ].map((c) => (
            <button
              key={c.role}
              type="button"
              onClick={() => (user ? nav(c.to) : launchDemo(c.key))}
              className="card p-6 border-slate-200 shadow-sm transition-all hover:border-leaf-300 hover:shadow-card-hover hover:-translate-y-0.5 flex flex-col justify-between group text-left"
            >
              <div>
                <div className="grid h-11 w-11 place-items-center rounded-2xl bg-slate-100 text-leaf-800 mb-4 group-hover:bg-leaf-100 transition">
                  <c.icon className="h-6 w-6" />
                </div>
                <h3 className="font-display text-xl font-bold text-ink">{c.role}</h3>
                <div className="text-xs text-leaf-700 font-semibold mt-0.5">{c.sub}</div>
                <p className="mt-2.5 text-xs sm:text-sm text-ink-soft leading-relaxed">{c.desc}</p>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-leaf-700">
                <span>{c.cta}</span>
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </div>
            </button>
          ))}
        </div>
      </section>
    </div>
  )
}
