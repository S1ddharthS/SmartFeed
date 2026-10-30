import { useState } from 'react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import {
  BarChart3,
  BookOpen,
  Database,
  GitCompare,
  HeartHandshake,
  LayoutDashboard,
  LogOut,
  Menu,
  Route as RouteIcon,
  Settings2,
  Soup,
  Sparkles,
  X,
} from 'lucide-react'
import { useApp } from '../context/AppContext'
import { homeFor } from '../lib/utils'
import { Toaster } from './ui'

const LINKS = {
  donor: [
    { to: '/donor', label: 'Donations', icon: Soup },
  ],
  receiver: [
    { to: '/receiver', label: 'Requests', icon: HeartHandshake },
  ],
  admin: [
    { to: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/admin/routes', label: 'Routes', icon: RouteIcon },
    { to: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
    { to: '/admin/compare', label: 'Comparison', icon: GitCompare },
    { to: '/admin/setup', label: 'Fleet Setup', icon: Settings2 },
  ],
}

export function Brand() {
  return (
    <Link to="/" className="flex items-center gap-2.5 transition-opacity hover:opacity-95">
      <div className="grid h-9 w-9 place-items-center rounded-lg bg-brand-500 text-white shadow-sm">
        <span className="text-base font-bold leading-none">🍲</span>
      </div>
      <div>
        <div className="text-base font-bold tracking-tight text-ink leading-none">
          SmartFeed
        </div>
        <div className="text-[10px] font-medium tracking-wider uppercase text-brand-600 mt-0.5">
          Food Logistics
        </div>
      </div>
    </Link>
  )
}

export default function Layout() {
  const { user, signIn, signOut, live, mode, switchMode, toast } = useApp()
  const nav = useNavigate()
  const [open, setOpen] = useState(false)
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
    `flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs sm:text-sm font-medium transition-all ${
      isActive
        ? 'bg-brand-50 text-brand-700 font-semibold border border-brand-100'
        : 'text-ink-soft hover:bg-slate-100/80 hover:text-ink'
    }`

  return (
    <div className="min-h-screen flex flex-col bg-app text-ink">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-50 focus:rounded-lg focus:bg-white focus:p-3 focus:shadow-lg focus:outline-none"
      >
        Skip to main content
      </a>

      {/* Main Top Navigation Bar */}
      <header className="no-print sticky top-0 z-[1500] border-b border-line bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-2.5 sm:px-6">
          <Brand />

          {/* Desktop Navigation Links */}
          <nav className="ml-6 hidden flex-1 items-center gap-1 lg:flex" aria-label="Main Navigation">
            {links.map((l) => (
              <NavLink key={l.to} to={l.to} end={l.to === '/admin'} className={navCls}>
                <l.icon className="h-4 w-4" />
                <span>{l.label}</span>
              </NavLink>
            ))}
          </nav>

          {/* Right Action Area */}
          <div className="ml-auto flex items-center gap-2">
            {/* Quick Demo Persona Switcher */}
            <div className="hidden xl:flex items-center gap-1 rounded-lg border border-line bg-slate-50/70 p-0.5 text-xs">
              <span className="text-ink-mute px-1.5 text-[11px] font-medium flex items-center gap-1">
                <span>Demo:</span>
              </span>
              <button
                type="button"
                onClick={() => switchDemoPersona('admin')}
                className={`rounded px-2 py-1 text-xs transition ${
                  user?.role === 'admin'
                    ? 'bg-white text-brand-700 font-semibold shadow-sm'
                    : 'text-ink-soft hover:text-ink'
                }`}
                title="Switch to Admin"
              >
                Admin
              </button>
              <button
                type="button"
                onClick={() => switchDemoPersona('donor')}
                className={`rounded px-2 py-1 text-xs transition ${
                  user?.role === 'donor'
                    ? 'bg-white text-brand-700 font-semibold shadow-sm'
                    : 'text-ink-soft hover:text-ink'
                }`}
                title="Switch to Donor"
              >
                Donor
              </button>
              <button
                type="button"
                onClick={() => switchDemoPersona('receiver')}
                className={`rounded px-2 py-1 text-xs transition ${
                  user?.role === 'receiver'
                    ? 'bg-white text-brand-700 font-semibold shadow-sm'
                    : 'text-ink-soft hover:text-ink'
                }`}
                title="Switch to Shelter"
              >
                Shelter
              </button>
            </div>

            {/* Data Source Indicator */}
            <div className="hidden sm:flex items-center gap-1.5 rounded-lg border border-line bg-slate-50/70 px-2 py-1 text-xs">
              <span className={`h-1.5 w-1.5 rounded-full ${live ? 'bg-brand-500' : 'bg-warning'}`} />
              <select
                aria-label="Data source mode"
                className="bg-transparent text-xs font-medium text-ink-soft focus:outline-none cursor-pointer"
                value={mode}
                onChange={async (e) => {
                  await switchMode(e.target.value)
                }}
              >
                <option value="auto">Auto ({live ? 'Live' : 'Demo'})</option>
                <option value="mock">Demo data</option>
                <option value="live">Live API</option>
              </select>
            </div>

            {/* User Profile or Actions */}
            {user ? (
              <div className="flex items-center gap-2 pl-1 sm:pl-2">
                <div className="hidden text-right sm:block">
                  <span className="block text-xs font-semibold text-ink leading-tight">{user.username}</span>
                  <span className="text-[10px] uppercase tracking-wider text-ink-mute font-medium">
                    {user.role}
                  </span>
                </div>
                <button
                  className="btn-secondary !py-1.5 !px-2.5 text-xs"
                  onClick={() => {
                    signOut()
                    nav('/')
                  }}
                  title="Sign out of account"
                  aria-label="Sign Out"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Sign Out</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                <Link to="/login" className="btn-ghost !px-3 !py-1.5 text-xs">
                  Log In
                </Link>
                <Link to="/register" className="btn-primary !px-3 !py-1.5 text-xs">
                  Sign Up
                </Link>
              </div>
            )}

            {/* Mobile Navigation Toggle */}
            <button
              className="btn-ghost !p-1.5 lg:hidden text-ink"
              onClick={() => setOpen(!open)}
              aria-label="Toggle Navigation Menu"
            >
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {open && (
          <div className="border-t border-line bg-white p-3 shadow-md lg:hidden">
            <div className="mb-2.5 flex items-center justify-between pb-2 border-b border-line text-xs">
              <span className="font-medium text-ink-soft">Data Source:</span>
              <select
                aria-label="Mobile data source mode"
                className="rounded border border-line bg-slate-50 px-2 py-0.5 text-xs"
                value={mode}
                onChange={async (e) => {
                  await switchMode(e.target.value)
                }}
              >
                <option value="auto">Auto ({live ? 'Live' : 'Demo'})</option>
                <option value="mock">Demo data</option>
                <option value="live">Live API</option>
              </select>
            </div>
            <nav className="grid gap-1" aria-label="Mobile Navigation">
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
              <div className="mt-3 pt-2.5 border-t border-line flex items-center justify-between text-xs">
                <div>
                  <div className="font-semibold text-ink">{user.username}</div>
                  <div className="capitalize text-ink-mute text-[11px]">{user.role}</div>
                </div>
                <button
                  className="btn-danger !py-1 !px-2.5 text-xs"
                  onClick={() => {
                    setOpen(false)
                    signOut()
                    nav('/')
                  }}
                >
                  Sign Out
                </button>
              </div>
            )}
          </div>
        )}
      </header>

      {/* Main Page Content */}
      <main id="main" className="flex-1 mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:py-8">
        <Outlet />
      </main>

      {/* Refined SaaS Footer */}
      <footer className="no-print mt-auto border-t border-line bg-white py-6 text-xs text-ink-soft">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-ink">SmartFeed</span>
            <span className="text-slate-300">·</span>
            <span>Food Surplus Matching & Routing</span>
          </div>
          <div className="flex items-center gap-4 text-xs text-ink-soft">
            <Link to="/how-it-works" className="hover:text-ink transition-colors">How It Works</Link>
            <Link to="/admin/compare" className="hover:text-ink transition-colors">Comparison</Link>
            <span className="inline-flex items-center gap-1.5 text-brand-600 font-medium">
              <span className="h-1.5 w-1.5 rounded-full bg-brand-500" />
              Operational
            </span>
          </div>
        </div>
      </footer>

      <Toaster />
    </div>
  )
}
