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

  return (
    <div className="space-y-12 animate-fade-in">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-2xl border border-line bg-white p-6 sm:p-10 md:p-12 shadow-card">
        {/* Subtle background glow */}
        <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-brand-50/80 blur-3xl" />
        <div className="pointer-events-none absolute -left-20 -bottom-20 h-72 w-72 rounded-full bg-slate-50 blur-2xl" />

        <div className="relative max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-brand-100 bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">
            <Sparkles className="h-3.5 w-3.5 text-brand-500" />
            <span>Smart Food Redistribution</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-ink leading-[1.15]">
            Food should reach a hungry plate{' '}
            <span className="text-brand-500">before</span> it reaches a bin.
          </h1>

          <p className="text-sm sm:text-base text-ink-soft leading-relaxed max-w-2xl">
            SmartFeed matches surplus food from donors with nearby shelters and plans optimal vehicle delivery routes before food spoils.
          </p>

          <div className="flex flex-wrap items-center gap-2.5 pt-2">
            {user ? (
              <Link
                to={homeFor(user.role)}
                className="btn-primary !px-5 !py-2.5 text-sm"
              >
                <span>Dashboard</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => launchDemo('admin')}
                  className="btn-primary !px-5 !py-2.5 text-sm"
                >
                  <span>Try Demo</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => launchDemo('donor')}
                  className="btn-secondary !px-4 !py-2.5 text-sm"
                >
                  <Soup className="h-4 w-4 text-brand-600" />
                  <span>Donate Food</span>
                </button>
                <button
                  type="button"
                  onClick={() => launchDemo('receiver')}
                  className="btn-secondary !px-4 !py-2.5 text-sm"
                >
                  <HeartHandshake className="h-4 w-4 text-info" />
                  <span>Request Food</span>
                </button>
              </>
            )}
            <Link
              to="/how-it-works"
              className="btn-ghost !px-4 !py-2.5 text-sm"
            >
              How It Works
            </Link>
          </div>
        </div>

        {/* 4 Simple Key Metrics */}
        <div className="relative mt-8 pt-6 border-t border-line grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <div className="text-xs font-medium text-ink-mute uppercase tracking-wider">Food Wasted</div>
            <div className="text-xl sm:text-2xl font-bold text-brand-600 mt-0.5">0 kg</div>
            <div className="text-[11px] text-ink-soft">100% on-time delivery</div>
          </div>
          <div>
            <div className="text-xs font-medium text-ink-mute uppercase tracking-wider">On-Time Arrival</div>
            <div className="text-xl sm:text-2xl font-bold text-brand-600 mt-0.5">100%</div>
            <div className="text-[11px] text-ink-soft">Zero deadline delays</div>
          </div>
          <div>
            <div className="text-xs font-medium text-ink-mute uppercase tracking-wider">High Need Served</div>
            <div className="text-xl sm:text-2xl font-bold text-ink mt-0.5">10/10</div>
            <div className="text-[11px] text-ink-soft">No shelters skipped</div>
          </div>
          <div>
            <div className="text-xs font-medium text-ink-mute uppercase tracking-wider">Calculation Time</div>
            <div className="text-xl sm:text-2xl font-bold text-ink mt-0.5">&lt; 1s</div>
            <div className="text-[11px] text-ink-soft">Real-time route solver</div>
          </div>
        </div>
      </section>

      {/* 3-Step How It Works */}
      <section className="space-y-4">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-brand-600">Simple Process</div>
          <h2 className="text-lg sm:text-xl font-bold text-ink mt-0.5">
            How SmartFeed Works
          </h2>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          {[
            {
              step: '1',
              title: 'Donate Food',
              desc: 'Donors register surplus meals with quantity, food type, and expiry window in under 60 seconds.',
              icon: Soup,
            },
            {
              step: '2',
              title: 'Urgency Matching',
              desc: 'The algorithm evaluates perishability and shelter hunger urgency to create optimal split pairings.',
              icon: Zap,
            },
            {
              step: '3',
              title: 'Fleet Delivery',
              desc: 'Multi-depot vehicles follow efficient turn-by-turn routes to ensure food arrives hot, fresh, and safe.',
              icon: Truck,
            },
          ].map((item) => (
            <div
              key={item.step}
              className="card p-5 hover:border-slate-300 hover:shadow-card-hover transition-all"
            >
              <div className="flex items-center gap-2.5 mb-3">
                <span className="grid h-7 w-7 place-items-center rounded-lg bg-brand-500 text-xs font-bold text-white shadow-xs">
                  {item.step}
                </span>
                <span className="text-base font-semibold text-ink">{item.title}</span>
              </div>
              <p className="text-xs sm:text-sm text-ink-soft leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Role Portals */}
      <section className="space-y-4">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-ink-soft">Participants</div>
          <h2 className="text-lg sm:text-xl font-bold text-ink mt-0.5">
            Built for Every Stakeholder
          </h2>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {[
            {
              role: 'Food Donors',
              sub: 'Restaurants, caterers, banquet halls, groceries',
              desc: 'List surplus food quickly. Specify pickup windows and track vehicle arrival in real time.',
              btn: 'Donate Food',
              key: 'donor',
              to: '/donor',
              icon: Soup,
            },
            {
              role: 'Food Receivers',
              sub: 'Night shelters, orphanages, care homes',
              desc: 'Request food rations, indicate hunger urgency, and receive verified arrival ETAs.',
              btn: 'Request Food',
              key: 'receiver',
              to: '/receiver',
              icon: HeartHandshake,
            },
            {
              role: 'Logistics Operations',
              sub: 'Food bank managers & dispatch coordinators',
              desc: 'One-click automated matching, live route tracking, and multi-depot fleet management.',
              btn: 'Dashboard',
              key: 'admin',
              to: '/admin',
              icon: Truck,
            },
          ].map((c) => (
            <div
              key={c.role}
              className="card p-6 flex flex-col justify-between hover:border-slate-300 hover:shadow-card-hover transition-all"
            >
              <div>
                <div className="grid h-10 w-10 place-items-center rounded-lg bg-slate-50 border border-line text-brand-600 mb-3.5">
                  <c.icon className="h-5 w-5" />
                </div>
                <h3 className="text-base font-semibold text-ink">{c.role}</h3>
                <div className="text-xs text-brand-600 font-medium mt-0.5">{c.sub}</div>
                <p className="mt-2 text-xs sm:text-sm text-ink-soft leading-relaxed">{c.desc}</p>
              </div>

              <div className="mt-5 pt-3 border-t border-line">
                <button
                  type="button"
                  onClick={() => (user ? nav(c.to) : launchDemo(c.key))}
                  className="btn-primary w-full !py-2 text-xs font-semibold justify-center"
                >
                  <span>{c.btn}</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Fast-Track Callout */}
      <section className="card p-6 border-line bg-slate-50/70">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h3 className="text-base font-bold text-ink">Ready to try the dispatch engine?</h3>
            <p className="text-xs sm:text-sm text-ink-soft max-w-xl">
              Experience the urgency-first algorithm with 10 simulated donors, 10 recipient shelters, and 3 distribution hubs across Bangalore.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => launchDemo('admin')}
              className="btn-primary !px-5 !py-2.5 text-xs sm:text-sm"
            >
              <Zap className="h-4 w-4" />
              <span>Try Demo</span>
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}
