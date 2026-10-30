import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, HeartHandshake, ShieldCheck, Soup, Sparkles, Truck, User } from 'lucide-react'
import { api } from '../api/client'
import { useApp } from '../context/AppContext'
import { Button, Field } from '../components/ui'
import { homeFor } from '../lib/utils'

const DEMOS = [
  {
    label: 'Food Bank Operations Admin',
    u: 'admin',
    p: 'admin123',
    role: 'admin',
    desc: 'Control center, run urgency matching, multi-depot routing, disruption simulations.',
    icon: ShieldCheck,
    tag: 'Recommended for evaluating the project',
  },
  {
    label: 'Restaurant Surplus Donor',
    u: 'greenleaf',
    p: 'donor123',
    role: 'donor',
    desc: 'Register surplus food, set pickup windows, track which shelter received the meals.',
    icon: Soup,
    tag: 'Donor Persona',
  },
  {
    label: 'Night Shelter Beneficiary',
    u: 'hopeshelter',
    p: 'receiver123',
    role: 'receiver',
    desc: 'Request meals, indicate hunger urgency, view scheduled vehicle arrival ETAs.',
    icon: HeartHandshake,
    tag: 'Receiver Persona',
  },
]

export function Login() {
  const { signIn, toast, live } = useApp()
  const nav = useNavigate()
  const [f, setF] = useState({ username: '', password: '' })
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  const submit = async (e, creds = f) => {
    e?.preventDefault()
    setErr('')
    setBusy(true)
    try {
      const u = await signIn(creds.username, creds.password)
      toast(`Signed in successfully as ${u.username} (${u.role})`)
      nav(homeFor(u.role))
    } catch (x) {
      setErr(x.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="text-center space-y-1">
        <h1 className="font-display text-3xl font-bold text-ink">Sign In to SmartFeed</h1>
        <p className="text-sm text-ink-soft">
          Log in with your credentials or select a pre-configured role below to test the platform.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-12 items-start">
        {/* Manual Login Card */}
        <form onSubmit={submit} className="card p-6 md:col-span-5 space-y-4 border-slate-200 shadow-sm">
          <h2 className="font-display text-lg font-bold text-ink">Account Login</h2>

          <Field label="Username" required>
            <input
              className="input"
              autoComplete="username"
              placeholder="Enter username"
              required
              value={f.username}
              onChange={(e) => setF({ ...f, username: e.target.value })}
            />
          </Field>

          <Field label="Password" required>
            <input
              className="input"
              type="password"
              placeholder="••••••••"
              autoComplete="current-password"
              required
              value={f.password}
              onChange={(e) => setF({ ...f, password: e.target.value })}
            />
          </Field>

          {err && (
            <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-700">
              {err}
            </div>
          )}

          <Button className="btn-primary w-full !py-3 font-bold" loading={busy} type="submit">
            Log In
          </Button>

          <p className="text-center text-xs text-ink-soft pt-1">
            Don't have an account yet?{' '}
            <Link to="/register" className="font-bold text-leaf-700 underline">
              Create an account
            </Link>
          </p>
        </form>

        {/* 1-Tap Demo Switcher */}
        <div className="card p-6 md:col-span-7 border-leaf-800/50 shadow-sm bg-leaf-900 text-white space-y-4">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-[11px] font-bold text-emerald-300 ring-1 ring-emerald-500/30">
              <Sparkles className="h-3 w-3" /> 1-Tap Instant Persona Access
            </div>
            <h2 className="font-display text-xl font-bold mt-2">Test Drive Any Role</h2>
            <p className="text-xs text-slate-300 mt-1">
              Click any demo profile to log in immediately with realistic seed records ({live ? 'live API' : 'demo data'}).
            </p>
          </div>

          <div className="space-y-3">
            {DEMOS.map((d) => (
              <button
                key={d.u}
                type="button"
                onClick={() => submit(null, { username: d.u, password: d.p })}
                className="w-full rounded-2xl border border-white/10 bg-white/5 p-4 text-left transition hover:bg-white/10 hover:border-emerald-400/50 group"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white/10 text-emerald-400 group-hover:bg-emerald-500 group-hover:text-slate-950 transition">
                      <d.icon className="h-5 w-5" />
                    </div>
                    <div>
                      <b className="font-bold text-white text-sm block group-hover:text-emerald-300 transition">
                        {d.label}
                      </b>
                      <span className="text-[11px] font-mono text-slate-400">
                        {d.u} / {d.p}
                      </span>
                    </div>
                  </div>
                  <span className="rounded-md bg-white/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-300">
                    {d.role}
                  </span>
                </div>
                <p className="mt-2 text-xs text-slate-300 leading-relaxed">{d.desc}</p>
                <div className="mt-2.5 flex items-center justify-between text-[11px] text-emerald-400 font-semibold">
                  <span>{d.tag}</span>
                  <span className="inline-flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                    Enter Dashboard <ArrowRight className="h-3 w-3" />
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export function Register() {
  const { toast, signIn } = useApp()
  const nav = useNavigate()
  const [f, setF] = useState({ username: '', email: '', password: '', role: 'donor' })
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  const submit = async (e) => {
    e.preventDefault()
    setErr('')
    if (f.password.length < 6) return setErr('Password must be at least 6 characters')
    setBusy(true)
    try {
      await api.register(f)
      const u = await signIn(f.username, f.password)
      toast('Account registered! Welcome to SmartFeed.')
      nav(homeFor(u.role))
    } catch (x) {
      setErr(x.message)
    } finally {
      setBusy(false)
    }
  }

  const roles = [
    {
      v: 'donor',
      t: 'I Have Surplus Food',
      d: 'Restaurant, hotel, banquet hall, caterer, grocery store',
      icon: Soup,
    },
    {
      v: 'receiver',
      t: 'I Need Food Supplies',
      d: 'Shelter, orphanage, community kitchen, elder care',
      icon: HeartHandshake,
    },
  ]

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div className="text-center space-y-1">
        <h1 className="font-display text-3xl font-bold text-ink">Create an Account</h1>
        <p className="text-sm text-ink-soft">Join the urgency-first food rescue network in Bangalore.</p>
      </div>

      <form onSubmit={submit} className="card p-6 space-y-5 border-slate-200 shadow-sm">
        <div>
          <span className="label">I am joining as a…</span>
          <div className="grid gap-3 sm:grid-cols-2">
            {roles.map((r) => {
              const active = f.role === r.v
              return (
                <label
                  key={r.v}
                  className={`cursor-pointer rounded-2xl border-2 p-3.5 transition ${
                    active
                      ? 'border-leaf-600 bg-leaf-50/80 shadow-sm ring-1 ring-leaf-500'
                      : 'border-slate-200 bg-white hover:bg-slate-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="role"
                    className="sr-only"
                    checked={active}
                    onChange={() => setF({ ...f, role: r.v })}
                  />
                  <r.icon className="h-5 w-5 text-leaf-700 mb-1.5" />
                  <b className="block text-sm font-bold text-ink">{r.t}</b>
                  <span className="text-[11px] text-ink-soft leading-tight block mt-1">{r.d}</span>
                </label>
              )
            })}
          </div>
        </div>

        <Field label="Username" required>
          <input
            className="input"
            required
            placeholder="Choose username"
            value={f.username}
            onChange={(e) => setF({ ...f, username: e.target.value })}
          />
        </Field>

        <Field label="Email Address" required>
          <input
            className="input"
            type="email"
            required
            placeholder="contact@organization.org"
            value={f.email}
            onChange={(e) => setF({ ...f, email: e.target.value })}
          />
        </Field>

        <Field label="Password" hint="At least 6 characters" required>
          <input
            className="input"
            type="password"
            required
            placeholder="••••••••"
            value={f.password}
            onChange={(e) => setF({ ...f, password: e.target.value })}
          />
        </Field>

        {err && (
          <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-700">
            {err}
          </div>
        )}

        <Button className="btn-primary w-full !py-3 font-bold" loading={busy} type="submit">
          Complete Registration
        </Button>

        <p className="text-center text-xs text-ink-soft pt-1">
          Already registered?{' '}
          <Link to="/login" className="font-bold text-leaf-700 underline">
            Log in here
          </Link>
        </p>
      </form>
    </div>
  )
}
