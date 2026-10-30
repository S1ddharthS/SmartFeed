import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, HeartHandshake, ShieldCheck, Soup, Sparkles, User } from 'lucide-react'
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
    desc: 'Operations center: algorithmic urgency matching, multi-depot vehicle routing, disruption re-planning.',
    icon: ShieldCheck,
    tag: 'Recommended for evaluation',
  },
  {
    label: 'Restaurant Surplus Donor',
    u: 'greenleaf',
    p: 'donor123',
    role: 'donor',
    desc: 'Register surplus food batches, set pickup windows, and track which shelter receives the meals.',
    icon: Soup,
    tag: 'Donor Persona',
  },
  {
    label: 'Night Shelter Beneficiary',
    u: 'hopeshelter',
    p: 'receiver123',
    role: 'receiver',
    desc: 'Request meals, indicate hunger urgency levels, and view verified vehicle arrival ETAs.',
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
      toast(`Signed in as ${u.username} (${u.role})`)
      nav(homeFor(u.role))
    } catch (x) {
      setErr(x.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 animate-fade-in">
      <div className="text-center space-y-1">
        <h1 className="text-2xl font-bold text-ink">Sign In to SmartFeed</h1>
        <p className="text-xs sm:text-sm text-ink-soft">
          Log in with your credentials or select an evaluation persona below.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-12 items-start">
        {/* Manual Login Card */}
        <form onSubmit={submit} className="card p-6 md:col-span-5 space-y-4">
          <h2 className="text-base font-bold text-ink">Account Login</h2>

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
            <div role="alert" className="rounded-lg border border-urgent-border bg-urgent-soft p-3 text-xs font-medium text-urgent">
              {err}
            </div>
          )}

          <Button className="btn-primary w-full !py-2.5 text-sm" loading={busy} type="submit">
            Sign In
          </Button>

          <p className="text-center text-xs text-ink-soft pt-1">
            Don't have an account?{' '}
            <Link to="/register" className="font-semibold text-brand-600 hover:text-brand-700 underline">
              Create an account
            </Link>
          </p>
        </form>

        {/* 1-Tap Demo Switcher (Light-Mode SaaS card) */}
        <div className="card p-6 md:col-span-7 space-y-4 bg-slate-50/70 border-line">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 border border-brand-100 px-2.5 py-0.5 text-[11px] font-semibold text-brand-700">
              <Sparkles className="h-3 w-3 text-brand-500" /> Instant Persona Access
            </div>
            <h2 className="text-base font-bold text-ink mt-1.5">Evaluation Personas</h2>
            <p className="text-xs text-ink-soft mt-0.5">
              Click any profile to log in immediately with realistic seed data ({live ? 'live API' : 'demo data'}).
            </p>
          </div>

          <div className="space-y-2.5">
            {DEMOS.map((d) => (
              <button
                key={d.u}
                type="button"
                onClick={() => submit(null, { username: d.u, password: d.p })}
                className="w-full rounded-xl border border-line bg-white p-3.5 text-left transition-all hover:border-brand-200 hover:shadow-card group"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-slate-50 border border-line text-brand-600 group-hover:bg-brand-50 transition-colors">
                      <d.icon className="h-4 w-4" />
                    </div>
                    <div>
                      <span className="font-semibold text-ink text-xs sm:text-sm block group-hover:text-brand-600 transition-colors">
                        {d.label}
                      </span>
                      <span className="text-[11px] font-mono text-ink-mute">
                        {d.u} / {d.p}
                      </span>
                    </div>
                  </div>
                  <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-ink-soft">
                    {d.role}
                  </span>
                </div>
                <p className="mt-1.5 text-xs text-ink-soft leading-relaxed">{d.desc}</p>
                <div className="mt-2 flex items-center justify-between text-[11px] text-brand-600 font-medium">
                  <span>{d.tag}</span>
                  <span className="inline-flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                    Dashboard <ArrowRight className="h-3 w-3" />
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
      toast(`Account created! Welcome, ${u.username}`)
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
      t: 'Food Donor',
      d: 'Restaurant, caterer, bakery, or grocery',
      icon: Soup,
    },
    {
      v: 'receiver',
      t: 'Food Beneficiary',
      d: 'Shelter, orphanage, care home, or kitchen',
      icon: HeartHandshake,
    },
  ]

  return (
    <form onSubmit={submit} className="card mx-auto max-w-lg space-y-4 p-6 sm:p-8 animate-fade-in">
      <div>
        <h1 className="text-xl font-bold text-ink">Create an Account</h1>
        <p className="text-xs sm:text-sm text-ink-soft mt-0.5">
          Join the SmartFeed rescue logistics network.
        </p>
      </div>

      <fieldset>
        <legend className="label">I am joining as a…</legend>
        <div className="grid gap-2.5 sm:grid-cols-2">
          {roles.map((r) => (
            <label
              key={r.v}
              className={`cursor-pointer rounded-xl border p-3.5 transition-all ${
                f.role === r.v
                  ? 'border-brand-500 bg-brand-50/50 shadow-sm'
                  : 'border-line bg-white hover:border-slate-300'
              }`}
            >
              <input
                type="radio"
                name="role"
                className="sr-only"
                checked={f.role === r.v}
                onChange={() => setF({ ...f, role: r.v })}
              />
              <div className="flex items-center gap-2">
                <r.icon className={`h-4 w-4 ${f.role === r.v ? 'text-brand-600' : 'text-ink-soft'}`} />
                <span className="font-semibold text-xs sm:text-sm text-ink">{r.t}</span>
              </div>
              <span className="mt-1 block text-xs text-ink-soft">{r.d}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <Field label="Username" required>
        <input
          className="input"
          placeholder="e.g. greenleaf_cafe"
          required
          value={f.username}
          onChange={(e) => setF({ ...f, username: e.target.value })}
        />
      </Field>

      <Field label="Email Address" required>
        <input
          className="input"
          type="email"
          placeholder="operations@example.com"
          required
          value={f.email}
          onChange={(e) => setF({ ...f, email: e.target.value })}
        />
      </Field>

      <Field label="Password" hint="At least 6 characters" required>
        <input
          className="input"
          type="password"
          placeholder="••••••••"
          required
          value={f.password}
          onChange={(e) => setF({ ...f, password: e.target.value })}
        />
      </Field>

      {err && (
        <div role="alert" className="rounded-lg border border-urgent-border bg-urgent-soft p-3 text-xs font-medium text-urgent">
          {err}
        </div>
      )}

      <Button className="btn-primary w-full !py-2.5 text-sm" loading={busy} type="submit">
        Sign Up
      </Button>

      <p className="text-center text-xs text-ink-soft pt-1">
        Already registered?{' '}
        <Link to="/login" className="font-semibold text-brand-600 hover:text-brand-700 underline">
          Sign In
        </Link>
      </p>
    </form>
  )
}
