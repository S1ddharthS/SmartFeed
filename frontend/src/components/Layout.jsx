import { useState } from 'react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  CheckCircle2,
  Database,
  GitCompare,
  HeartHandshake,
  HelpCircle,
  LayoutDashboard,
  LogOut,
  Menu,
  Route as RouteIcon,
  Settings2,
  Soup,
  Sparkles,
  Truck,
  User,
  X,
  Zap,
} from 'lucide-react'
import { useApp } from '../context/AppContext'
import { homeFor } from '../lib/utils'
import { Modal, Toaster } from './ui'

const LINKS = {
  donor: [
    { to: '/donor', label: 'My Surplus', icon: Soup, hint: 'Active donations' },
  ],
  receiver: [
    { to: '/receiver', label: 'My Requests', icon: HeartHandshake, hint: 'Incoming meals' },
  ],
  admin: [
    { to: '/admin', label: 'Control Center', icon: LayoutDashboard },
    { to: '/admin/routes', label: 'Routes & Timelines', icon: RouteIcon },
    { to: '/admin/analytics', label: 'Impact Analytics', icon: BarChart3 },
    { to: '/admin/compare', label: 'SmartFeed vs Baseline', icon: GitCompare },
    { to: '/admin/setup', label: 'Depots & Fleet', icon: Settings2 },
  ],
}

export function Brand({ light = false }) {
  return (
    <Link to="/" className="flex items-center gap-2.5 transition opacity-90 hover:opacity-100">
      <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-leaf-600 to-leaf-800 text-xl text-white shadow-sm ring-1 ring-white/20">
        🍲
      </div>
      <div>
        <div className={`font-display text-xl font-bold leading-tight ${light ? 'text-white' : 'text-slate-900'}`}>
          SmartFeed
        </div>
        <div className="text-[10px] font-semibold tracking-wider uppercase text-leaf-700">
          Urgency-First Food Rescue
        </div>
      </div>
    </Link>
  )
}

export default function Layout() {
  const { user, signIn, signOut, live, mode, switchMode, toast } = useApp()
  const nav = useNavigate()
  const [open, setOpen] = useState(false)
  const [guideOpen, setGuideOpen] = useState(false)

  const links = [
    ...(user ? LINKS[user.role] || [] : []),
    { to: '/how-it-works', label: 'How It Works', icon: BookOpen },
  ]

  const switchDemoPersona = async (roleName) => {
    const creds = {
      admin: { u: 'admin', p: 'admin123' },
      donor: { u: 'greenleaf', p: 'donor123' },
      receiver: { u: 'hopeshelter', p: 'receiver123' },
    }[roleName]
    if (creds) {
      try {
        const u = await signIn(creds.u, creds.p)
        toast(`Switched persona to ${u.username} (${u.role})`)
        nav(homeFor(u.role))
      } catch (e) {
        toast(e.message, 'error')
      }
    }
  }

  const navCls = ({ isActive }) =>
    `flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-semibold transition-all ${
      isActive
        ? 'bg-leaf-100 text-leaf-900 shadow-sm border border-leaf-200/80 font-bold'
        : 'text-ink-soft hover:bg-slate-100 hover:text-ink'
    }`

  return (
    <div className="min-h-screen flex flex-col bg-cream-50 text-ink">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-50 focus:rounded-xl focus:bg-white focus:p-3 focus:shadow-lg focus:outline-none"
      >
        Skip to main content
      </a>

      {/* Main Top Navigation */}
      <header className="no-print sticky top-0 z-[1500] border-b border-slate-200/80 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <Brand />

          {/* Desktop Navigation Links */}
          <nav className="ml-6 hidden flex-1 items-center gap-1.5 lg:flex" aria-label="Main Navigation">
            {links.map((l) => (
              <NavLink key={l.to} to={l.to} end={l.to === '/admin'} className={navCls}>
                <l.icon className="h-4 w-4" />
                <span>{l.label}</span>
              </NavLink>
            ))}
          </nav>

          {/* Right Action Area */}
          <div className="ml-auto flex items-center gap-2.5">
            {/* Quick Demo Tour Help Pill */}
            <button
              type="button"
              onClick={() => setGuideOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-300/80 bg-emerald-50/80 px-2.5 py-1.5 text-xs font-bold text-emerald-800 hover:bg-emerald-100 transition shadow-sm"
              title="Open quick 60-second evaluation guide"
            >
              <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
              <span className="hidden md:inline">Quick Tour</span>
            </button>

            {/* Quick Demo Persona Switcher */}
            <div className="hidden xl:flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-50/80 p-1 text-[11px] font-semibold">
              <span className="text-ink-mute px-1.5 flex items-center gap-1">
                <span>Demo Role:</span>
              </span>
              <button
                type="button"
                onClick={() => switchDemoPersona('admin')}
                className={`rounded-lg px-2 py-0.5 transition ${
                  user?.role === 'admin' ? 'bg-white text-leaf-900 shadow-sm font-bold' : 'text-ink-soft hover:text-ink'
                }`}
                title="Switch to Food Bank Admin"
              >
                Admin
              </button>
              <button
                type="button"
                onClick={() => switchDemoPersona('donor')}
                className={`rounded-lg px-2 py-0.5 transition ${
                  user?.role === 'donor' ? 'bg-white text-leaf-900 shadow-sm font-bold' : 'text-ink-soft hover:text-ink'
                }`}
                title="Switch to Restaurant Donor"
              >
                Donor
              </button>
              <button
                type="button"
                onClick={() => switchDemoPersona('receiver')}
                className={`rounded-lg px-2 py-0.5 transition ${
                  user?.role === 'receiver' ? 'bg-white text-leaf-900 shadow-sm font-bold' : 'text-ink-soft hover:text-ink'
                }`}
                title="Switch to Shelter Beneficiary"
              >
                Shelter
              </button>
            </div>

            {/* Environment Indicator & Switcher */}
            <div className="hidden sm:flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50/80 px-2.5 py-1 text-xs">
              <span className="flex items-center gap-1.5 font-medium text-ink-soft">
                <span className={`h-2 w-2 rounded-full ${live ? 'bg-safe ring-2 ring-safe/20' : 'bg-soon ring-2 ring-soon/20'}`} />
                <Database className="h-3.5 w-3.5 text-ink-mute" />
              </span>
              <select
                aria-label="Data source mode"
                className="bg-transparent font-semibold text-ink focus:outline-none cursor-pointer text-xs"
                value={mode}
                onChange={async (e) => {
                  await switchMode(e.target.value)
                }}
              >
                <option value="auto">Auto ({live ? 'Live API' : 'Demo data'})</option>
                <option value="mock">Demo data</option>
                <option value="live">Live API</option>
              </select>
            </div>

            {/* User Profile or Login CTA */}
            {user ? (
              <div className="flex items-center gap-3 pl-1 sm:pl-2">
                <div className="hidden text-right leading-tight sm:block">
                  <span className="block text-sm font-bold text-ink">{user.username}</span>
                  <span className="inline-block rounded-md bg-leaf-50 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-leaf-800">
                    {user.role}
                  </span>
                </div>
                <button
                  className="btn-secondary !py-2 !px-3 text-xs"
                  onClick={() => {
                    signOut()
                    nav('/')
                  }}
                  title="Sign out of account"
                  aria-label="Log out"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="hidden sm:inline">Log out</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login" className="btn-ghost !px-3.5 !py-2">
                  Log in
                </Link>
                <Link to="/register" className="btn-primary !px-4 !py-2 shadow-sm">
                  Join Free
                </Link>
              </div>
            )}

            {/* Mobile Hamburger Button */}
            <button
              className="btn-ghost !p-2 lg:hidden text-ink"
              onClick={() => setOpen(!open)}
              aria-label="Toggle Navigation Menu"
            >
              {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Dropdown */}
        {open && (
          <div className="border-t border-slate-200 bg-white p-4 shadow-lg lg:hidden animate-in slide-in-from-top-2">
            <div className="mb-3 flex items-center justify-between pb-3 border-b border-slate-100 text-xs">
              <span className="font-semibold text-ink-soft">Data Source:</span>
              <select
                aria-label="Mobile data source mode"
                className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-semibold"
                value={mode}
                onChange={async (e) => {
                  await switchMode(e.target.value)
                }}
              >
                <option value="auto">Auto ({live ? 'Live API' : 'Demo data'})</option>
                <option value="mock">Demo data</option>
                <option value="live">Live API</option>
              </select>
            </div>

            {/* Mobile Demo Persona Switcher */}
            <div className="mb-3 flex items-center justify-between rounded-xl bg-slate-50 p-2 text-xs">
              <span className="font-bold text-ink-soft">Switch Demo Role:</span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false)
                    switchDemoPersona('admin')
                  }}
                  className={`rounded-lg px-2.5 py-1 text-xs font-semibold ${
                    user?.role === 'admin' ? 'bg-leaf-700 text-white' : 'bg-white border text-ink'
                  }`}
                >
                  Admin
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false)
                    switchDemoPersona('donor')
                  }}
                  className={`rounded-lg px-2.5 py-1 text-xs font-semibold ${
                    user?.role === 'donor' ? 'bg-leaf-700 text-white' : 'bg-white border text-ink'
                  }`}
                >
                  Donor
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false)
                    switchDemoPersona('receiver')
                  }}
                  className={`rounded-lg px-2.5 py-1 text-xs font-semibold ${
                    user?.role === 'receiver' ? 'bg-leaf-700 text-white' : 'bg-white border text-ink'
                  }`}
                >
                  Shelter
                </button>
              </div>
            </div>

            <nav className="grid gap-1.5" aria-label="Mobile Navigation">
              {links.map((l) => (
                <NavLink
                  key={l.to}
                  to={l.to}
                  end={l.to === '/admin'}
                  className={navCls}
                  onClick={() => setOpen(false)}
                >
                  <l.icon className="h-4 w-4" />
                  <span>{l.label}</span>
                </NavLink>
              ))}
            </nav>
            {user && (
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <div>
                  <div className="font-bold text-ink">{user.username}</div>
                  <div className="capitalize text-ink-soft">{user.role}</div>
                </div>
                <button
                  className="btn-danger !py-1.5 !px-3 text-xs"
                  onClick={() => {
                    setOpen(false)
                    signOut()
                    nav('/')
                  }}
                >
                  Log out
                </button>
              </div>
            )}
          </div>
        )}
      </header>

      {/* Main Page Canvas */}
      <main id="main" className="flex-1 mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:py-10">
        <Outlet />
      </main>

      {/* Evaluator Quick Tour Modal */}
      <Modal
        open={guideOpen}
        onClose={() => setGuideOpen(false)}
        title="Quick Evaluator Tour (60 Seconds)"
        footer={
          <button
            className="btn-primary w-full"
            onClick={() => {
              setGuideOpen(false)
              switchDemoPersona('admin')
            }}
          >
            Launch Admin Operations Center
          </button>
        }
      >
        <div className="space-y-4 text-xs sm:text-sm">
          <p className="text-ink-soft leading-relaxed">
            Welcome to SmartFeed! Follow this 3-step walkthrough to test the urgency scoring, split lot matching, and multi-depot vehicle routing in real time:
          </p>

          <div className="space-y-3">
            <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50/60 p-3">
              <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-emerald-600 font-bold text-white text-xs">1</span>
              <div>
                <b className="text-emerald-950 block">Operations Center</b>
                <span className="text-emerald-900 leading-snug">
                  Click <b>"1-Click Auto-Dispatch"</b>. Watch the platform match 10 donors to 10 shelters and route vehicles across Bangalore multi-depots in &lt;1s.
                </span>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-xl border border-blue-200 bg-blue-50/60 p-3">
              <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-blue-600 font-bold text-white text-xs">2</span>
              <div>
                <b className="text-blue-950 block">SmartFeed vs Baseline Comparison</b>
                <span className="text-blue-900 leading-snug">
                  Go to <b>Compare</b> to inspect side-by-side results. Notice how the naive proximity system had <b>140+ kg food wasted & late arrivals</b>, while SmartFeed achieved <b>0 kg wasted</b>.
                </span>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50/60 p-3">
              <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-amber-600 font-bold text-white text-xs">3</span>
              <div>
                <b className="text-amber-950 block">Routes & Timelines</b>
                <span className="text-amber-900 leading-snug">
                  View turn-by-turn driver manifests, vehicle cargo loads, and click <b>Print / Download PDF</b> for driver delivery sheets.
                </span>
              </div>
            </div>
          </div>
        </div>
      </Modal>

      {/* Modern, Clean Footer */}
      <footer className="no-print mt-auto border-t border-slate-200 bg-white py-8 text-center text-xs text-ink-soft">
        <div className="mx-auto max-w-7xl px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-ink">SmartFeed</span>
            <span className="text-slate-300">·</span>
            <span>Intelligent food rescue logistics for Bangalore</span>
          </div>
          <div className="flex items-center gap-5 text-ink-soft">
            <Link to="/how-it-works" className="hover:text-leaf-800 transition">How it works</Link>
            <Link to="/admin/compare" className="hover:text-leaf-800 transition">Old vs New Way</Link>
            <span className="text-leaf-700 font-semibold">Every kilogram to a plate, not a landfill.</span>
          </div>
        </div>
      </footer>

      <Toaster />
    </div>
  )
}
