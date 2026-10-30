import { useEffect, useState } from 'react'
import { AlertTriangle, CheckCircle2, Clock, HelpCircle, Inbox, Loader2, Sparkles, X, XCircle } from 'lucide-react'
import { countdown, statusStyle, urgencyLevel } from '../lib/utils'
import { useApp } from '../context/AppContext'

export const Spinner = ({ className = '' }) => <Loader2 className={`h-4 w-4 animate-spin ${className}`} aria-label="Loading" />

export function Button({ loading, children, className = 'btn-primary', ...p }) {
  return (
    <button {...p} disabled={p.disabled || loading} className={`${className} ${p.extra || ''}`}>
      {loading ? <Spinner className="h-4 w-4 text-current" /> : null}
      {children}
    </button>
  )
}

export function UrgencyBadge({ score, showScore = true }) {
  const u = urgencyLevel(score)
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${u.cls}`}
      title={`Urgency Score: ${Number(score).toFixed(2)} (Factored from expiry timeline, batch weight, and recipient hunger urgency)`}
    >
      <span className={`h-2 w-2 rounded-full ${u.dot} animate-pulse`} />
      <span>{u.label}</span>
      {showScore && <span className="opacity-80 font-mono text-[11px]">({Number(score).toFixed(2)})</span>}
    </span>
  )
}

export function CountdownChip({ expiry, prefix = 'Expires in' }) {
  const { nowMs } = useApp()
  const c = countdown(expiry, nowMs)
  const cls = {
    urgent: 'bg-rose-50 text-rose-700 border-rose-200/80',
    soon: 'bg-amber-50 text-amber-700 border-amber-200/80',
    safe: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
  }[c.level]

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${cls}`}>
      <Clock className="h-3 w-3 shrink-0" />
      <span>{c.ms <= 0 ? 'Expired' : `${prefix} ${c.text}`}</span>
    </span>
  )
}

export const StatusPill = ({ status }) => {
  const label = String(status).replace('_', ' ')
  return (
    <span className={`badge uppercase tracking-wider text-[11px] font-bold ${statusStyle[status] || 'bg-slate-100 text-slate-700 border border-slate-200'}`}>
      {label}
    </span>
  )
}

export function StatCard({ icon: Icon, label, value, hint, tone = 'leaf', extra }) {
  const tones = {
    leaf: 'bg-emerald-50 text-emerald-700 border border-emerald-200/60',
    red: 'bg-rose-50 text-rose-700 border border-rose-200/60',
    amber: 'bg-amber-50 text-amber-700 border border-amber-200/60',
    blue: 'bg-blue-50 text-blue-700 border border-blue-200/60',
  }

  return (
    <div className="card group p-5 transition-all duration-200 hover:border-slate-300 hover:shadow-card-hover">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="text-xs font-semibold uppercase tracking-wider text-ink-mute">{label}</div>
          <div className="mt-1.5 font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">{value}</div>
          {hint && <div className="mt-1 flex items-center gap-1 text-xs text-ink-soft">{hint}</div>}
        </div>
        <div className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${tones[tone]}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
      {extra && <div className="mt-3 pt-3 border-t border-slate-100">{extra}</div>}
    </div>
  )
}

export function EmptyState({ title, text, action, icon: Icon = Inbox }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200/90 bg-slate-50/50 px-6 py-12 text-center">
      <div className="grid h-12 w-12 place-items-center rounded-2xl bg-white shadow-sm border border-slate-200/60">
        <Icon className="h-6 w-6 text-leaf-700" />
      </div>
      <h3 className="mt-4 font-display text-lg font-bold text-ink">{title}</h3>
      {text && <p className="mt-1.5 max-w-sm text-sm text-ink-soft leading-relaxed">{text}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}

export function ErrorState({ message, onRetry }) {
  return (
    <div role="alert" className="flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50/80 p-4 text-sm text-rose-800 shadow-sm">
      <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-rose-600" />
      <div className="flex-1">
        <p className="font-semibold text-rose-900">Something went wrong</p>
        <p className="mt-0.5 text-rose-700">{message}</p>
      </div>
      {onRetry && (
        <button className="btn-secondary !py-1.5 !px-3 text-xs" onClick={onRetry}>
          Try again
        </button>
      )}
    </div>
  )
}

export const PageLoader = ({ label = 'Loading…' }) => (
  <div className="flex flex-col items-center justify-center gap-3 py-24 text-ink-soft">
    <div className="grid h-12 w-12 place-items-center rounded-2xl bg-leaf-50 border border-leaf-200/60 shadow-sm">
      <Spinner className="h-6 w-6 text-leaf-700" />
    </div>
    <span className="text-sm font-medium">{label}</span>
  </div>
)

export function Modal({ open, onClose, title, children, footer }) {
  useEffect(() => {
    if (!open) return
    const h = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [open, onClose])

  if (!open) return null
  return (
    <div className="fixed inset-0 z-[2000] grid place-items-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-150" onMouseDown={onClose} role="dialog" aria-modal="true" aria-label={title}>
      <div className="card w-full max-w-lg p-6 shadow-elevated" onMouseDown={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-start justify-between gap-4 border-b border-slate-100 pb-3">
          <h3 className="text-xl font-bold text-ink font-display">{title}</h3>
          <button className="btn-ghost !p-1.5 text-ink-mute hover:text-ink" onClick={onClose} aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="text-sm text-ink-soft">{children}</div>
        {footer && <div className="mt-6 flex justify-end gap-2.5 border-t border-slate-100 pt-4">{footer}</div>}
      </div>
    </div>
  )
}

export function ConfirmDialog({ open, title, message, confirmLabel = 'Delete', onConfirm, onCancel, loading }) {
  return (
    <Modal
      open={open}
      onClose={onCancel}
      title={title}
      footer={
        <>
          <button className="btn-secondary" onClick={onCancel}>Cancel</button>
          <Button className="btn-accent" loading={loading} onClick={onConfirm}>{confirmLabel}</Button>
        </>
      }
    >
      <div className="flex gap-3">
        <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600 mt-0.5" />
        <p className="leading-relaxed">{message}</p>
      </div>
    </Modal>
  )
}

export function Toaster() {
  const { toasts, setToasts } = useApp()
  return (
    <div className="no-print fixed bottom-5 right-5 z-[3000] flex w-[min(92vw,24rem)] flex-col gap-2.5" aria-live="polite">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`card flex items-start gap-3 p-4 text-sm shadow-elevated border ${
            t.kind === 'error' ? 'border-rose-300 bg-rose-50/95 text-rose-900' : 'border-emerald-300 bg-white/95 text-ink'
          }`}
        >
          {t.kind === 'error' ? (
            <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-rose-600" />
          ) : (
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
          )}
          <span className="flex-1 font-medium leading-snug">{t.message}</span>
          <button
            onClick={() => setToasts((x) => x.filter((y) => y.id !== t.id))}
            aria-label="Dismiss"
            className="text-ink-mute hover:text-ink -mr-1 -mt-1 p-1"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  )
}

export function Field({ label, hint, children, error, required }) {
  return (
    <label className="block">
      <div className="flex items-center justify-between mb-1.5">
        <span className="label !mb-0">
          {label} {required && <span className="text-urgent">*</span>}
        </span>
        {hint && !error && <span className="text-xs text-ink-mute font-normal">{hint}</span>}
      </div>
      {children}
      {error && <span className="mt-1.5 block text-xs font-semibold text-urgent">{error}</span>}
    </label>
  )
}

export const PageHeader = ({ title, subtitle, actions, badge }) => (
  <div className="mb-7 flex flex-wrap items-end justify-between gap-4 border-b border-slate-200/60 pb-5">
    <div>
      {badge && <div className="mb-2">{badge}</div>}
      <h1 className="text-2xl font-bold tracking-tight text-ink md:text-3xl font-display">{title}</h1>
      {subtitle && <p className="mt-1 text-sm text-ink-soft leading-relaxed max-w-2xl">{subtitle}</p>}
    </div>
    {actions && <div className="no-print flex flex-wrap items-center gap-2.5">{actions}</div>}
  </div>
)

export function WorkflowSteps({ currentStep = 1, onStepClick, steps = [] }) {
  return (
    <nav aria-label="Workflow progress" className="card mb-6 p-2 sm:p-3">
      <ol className="grid grid-cols-3 gap-2 text-center text-xs sm:text-sm font-semibold">
        {steps.map((st, i) => {
          const stepNum = i + 1
          const isDone = stepNum < currentStep
          const isCurrent = stepNum === currentStep
          return (
            <li key={st.label}>
              <button
                type="button"
                onClick={() => onStepClick?.(stepNum)}
                className={`flex w-full items-center justify-center gap-2 rounded-xl py-2 px-2 transition ${
                  isCurrent
                    ? 'bg-leaf-700 text-white shadow-sm'
                    : isDone
                    ? 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                    : 'text-ink-mute hover:bg-slate-100'
                }`}
              >
                <span
                  className={`grid h-5 w-5 place-items-center rounded-full text-[11px] font-bold ${
                    isCurrent
                      ? 'bg-white text-leaf-900'
                      : isDone
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-200 text-ink-soft'
                  }`}
                >
                  {isDone ? '✓' : stepNum}
                </span>
                <span className="truncate">{st.label}</span>
              </button>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}

export function InfoCallout({ title, children, tone = 'leaf', icon: Icon = Sparkles }) {
  const tones = {
    leaf: 'bg-leaf-50/70 border-leaf-200 text-leaf-900',
    amber: 'bg-amber-50/70 border-amber-200 text-amber-900',
    blue: 'bg-blue-50/70 border-blue-200 text-blue-900',
  }
  return (
    <div className={`rounded-xl border p-3.5 text-xs sm:text-sm flex items-start gap-3 ${tones[tone]}`}>
      <Icon className="h-4 w-4 shrink-0 mt-0.5" />
      <div className="flex-1">
        {title && <div className="font-semibold mb-0.5">{title}</div>}
        <div className="opacity-90 leading-relaxed">{children}</div>
      </div>
    </div>
  )
}

export function SkeletonCard() {
  return (
    <div className="card p-5 space-y-3">
      <div className="flex items-center justify-between">
        <div className="h-4 w-28 rounded shimmer" />
        <div className="h-8 w-8 rounded-xl shimmer" />
      </div>
      <div className="h-7 w-20 rounded shimmer" />
      <div className="h-3 w-40 rounded shimmer" />
    </div>
  )
}

export function SkeletonRow() {
  return (
    <div className="flex items-center justify-between py-3 border-b border-slate-100 gap-4">
      <div className="h-4 w-1/3 rounded shimmer" />
      <div className="h-4 w-1/4 rounded shimmer" />
      <div className="h-6 w-16 rounded-full shimmer" />
    </div>
  )
}

export function UrgencySandbox() {
  const [hoursLeft, setHoursLeft] = useState(2.5)
  const [foodType, setFoodType] = useState('cooked')
  const [needSeverity, setNeedSeverity] = useState(4)

  // Calculate dynamic urgency score (0 to 1)
  const decayFactor = Math.max(0.05, Math.min(1, Math.exp(-hoursLeft / 5)))
  const perishMultiplier = { cooked: 1.0, bakery: 0.85, produce: 0.7, dry: 0.4 }[foodType]
  const hungerWeight = needSeverity / 5
  const rawScore = decayFactor * 0.55 * perishMultiplier + hungerWeight * 0.45
  const score = Math.max(0.1, Math.min(0.99, Number(rawScore.toFixed(2))))

  const u = urgencyLevel(score)

  return (
    <div className="card overflow-hidden border-leaf-200 bg-gradient-to-br from-white via-emerald-50/30 to-leaf-50/50 p-6 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/60 pb-4 mb-5">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-leaf-700" />
            <h3 className="font-display text-base sm:text-lg font-bold text-ink">
              Interactive Urgency Engine Preview
            </h3>
          </div>
          <p className="text-xs text-ink-soft mt-0.5">
            Test how SmartFeed mathematically scores every food donation in real time.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <UrgencyBadge score={score} showScore={true} />
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-xs font-semibold text-ink mb-1">
              <span>Hours Until Spoilage</span>
              <span className="font-bold text-leaf-800">{hoursLeft} hrs</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="24"
              step="0.5"
              value={hoursLeft}
              onChange={(e) => setHoursLeft(Number(e.target.value))}
              className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-slate-200 accent-leaf-600 focus:outline-none"
            />
            <div className="flex justify-between text-[10px] text-ink-mute mt-1">
              <span>30 mins (Critical)</span>
              <span>12 hrs</span>
              <span>24 hrs (Stable)</span>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-ink mb-1.5 block">Surplus Food Type</label>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {[
                { id: 'cooked', label: '🍛 Cooked Meals', sub: 'Perishable (4h)' },
                { id: 'bakery', label: '🥐 Bakery / Breads', sub: 'Semi-fresh (12h)' },
                { id: 'produce', label: '🍎 Fresh Produce', sub: 'Raw goods (36h)' },
                { id: 'dry', label: '📦 Packaged / Dry', sub: 'Long shelf-life (72h)' },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setFoodType(item.id)}
                  className={`rounded-xl border p-2 text-left transition ${
                    foodType === item.id
                      ? 'border-leaf-600 bg-leaf-50 text-leaf-950 font-semibold ring-1 ring-leaf-600'
                      : 'border-slate-200 bg-white text-ink-soft hover:bg-slate-50'
                  }`}
                >
                  <div>{item.label}</div>
                  <div className="text-[10px] text-ink-mute">{item.sub}</div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="flex justify-between text-xs font-semibold text-ink mb-1">
              <span>Shelter Hunger Emergency Level</span>
              <span className="font-bold text-rose-700">{needSeverity} / 5</span>
            </div>
            <div className="grid grid-cols-5 gap-1.5 text-center text-xs">
              {[1, 2, 3, 4, 5].map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => setNeedSeverity(lvl)}
                  className={`rounded-lg py-1.5 font-bold transition ${
                    needSeverity === lvl
                      ? 'bg-rose-600 text-white shadow-sm'
                      : 'bg-slate-100 text-ink-soft hover:bg-slate-200'
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-ink-mute">Real-Time Dispatch Verdict</span>
            <div className="mt-2 flex items-baseline gap-3">
              <span className="font-display text-4xl font-extrabold text-ink font-mono">
                {score.toFixed(2)}
              </span>
              <div className="text-xs">
                <span className={`inline-block font-bold ${score >= 0.7 ? 'text-rose-600' : score >= 0.4 ? 'text-amber-600' : 'text-emerald-600'}`}>
                  {score >= 0.7 ? 'CRITICAL DISPATCH PRIORITY' : score >= 0.4 ? 'MODERATE PRIORITY' : 'ROUTINE DISPATCH'}
                </span>
                <p className="text-[11px] text-ink-soft">Calculated priority in live matching queue</p>
              </div>
            </div>

            <div className="mt-4 space-y-2 text-xs">
              <div className="flex items-center justify-between rounded-lg bg-slate-50 p-2 text-ink-soft">
                <span>Perishability Penalty:</span>
                <span className="font-semibold text-ink">{(decayFactor * perishMultiplier).toFixed(2)}x weight</span>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-slate-50 p-2 text-ink-soft">
                <span>Recipient Need Weight:</span>
                <span className="font-semibold text-ink">{(hungerWeight * 100).toFixed(0)}% severity</span>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-slate-50 p-2 text-ink-soft">
                <span>Algorithm Decision:</span>
                <span className="font-semibold text-leaf-800">
                  {score >= 0.7
                    ? 'Dispatched to Nearest Multi-Depot EV'
                    : score >= 0.4
                    ? 'Batched with Mid-Day Urban Route'
                    : 'Queued with Standard Evening Collection'}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4 rounded-xl border border-leaf-200 bg-leaf-50/70 p-3 text-[11px] text-leaf-900 leading-snug">
            💡 <b>Why this matters:</b> Unlike traditional apps that blindly serve whoever posted first, SmartFeed ensures hot cooked food nearing its 4h window is automatically routed ahead of dry non-perishables.
          </div>
        </div>
      </div>
    </div>
  )
}
