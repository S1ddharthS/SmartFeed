import { useState } from 'react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { BarChart3, BookOpen, Database, GitCompare, HeartHandshake, LayoutDashboard, LogOut, Menu, Route as RouteIcon, Settings2, Soup, User, X } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { Toaster } from './ui'

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
  const { user, signOut, live, mode, switchMode } = useApp()
  const nav = useNavigate()
  const [open, setOpen] = useState(false)
  const links = [
    ...(user ? LINKS[user.role] || [] : []),
    { to: '/how-it-works', label: 'How It Works', icon: BookOpen },
  ]

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
          <div className="ml-auto flex items-center gap-3">
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

      {/* Modern, Clean Footer */}
      <footer className="no-print mt-auto border-t border-slate-200 bg-white py-8 text-center text-xs text-ink-soft">
        <div className="mx-auto max-w-7xl px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-ink">SmartFeed</span>
            <span className="text-slate-300">·</span>
            <span>Intelligent food rescue logistics</span>
          </div>
          <div className="flex items-center gap-5 text-ink-soft">
            <Link to="/how-it-works" className="hover:text-leaf-800 transition">How it works</Link>
            <Link to="/admin/compare" className="hover:text-leaf-800 transition">Old vs New Way</Link>
            <span className="text-leaf-700 font-medium">Every kilogram to a plate, not a landfill.</span>
          </div>
        </div>
      </footer>

      <Toaster />
    </div>
  )
}
