import { useEffect } from 'react'
import { AlertTriangle, CheckCircle2, Clock, HelpCircle, Inbox, Loader2, Sparkles, X, XCircle } from 'lucide-react'
import { countdown, statusStyle, urgencyLevel } from '../lib/utils'
import { useApp } from '../context/AppContext'

export const Spinner = ({ className = '' }) => (
  <Loader2 className={`h-4 w-4 animate-spin text-current ${className}`} aria-label="Loading" />
)

export function Button({ loading, children, className = 'btn-primary', ...p }) {
  return (
    <button {...p} disabled={p.disabled || loading} className={`${className} ${p.extra || ''}`}>
      {loading ? <Spinner className="h-4 w-4" /> : null}
      {children}
    </button>
  )
}

export function UrgencyBadge({ score, showScore = true }) {
  const u = urgencyLevel(score)
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${u.cls}`}
      title={`Urgency Score: ${Number(score).toFixed(2)}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${u.dot}`} />
      <span>{u.label}</span>
      {showScore && <span className="font-mono text-[11px] opacity-80">({Number(score).toFixed(2)})</span>}
    </span>
  )
}

export function CountdownChip({ expiry, prefix = 'Expires in' }) {
  const { nowMs } = useApp()
  const c = countdown(expiry, nowMs)
  const cls = {
    urgent: 'bg-urgent-soft text-urgent border-urgent-border',
    soon: 'bg-warning-soft text-warning border-warning-border',
    safe: 'bg-brand-50 text-brand-600 border-brand-100',
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
    <span className={`badge uppercase tracking-wider text-[11px] font-semibold ${statusStyle[status] || 'bg-slate-100 text-ink-soft border border-line'}`}>
      {label}
    </span>
  )
}

export function StatCard({ icon: Icon, label, value, hint, tone = 'leaf', extra }) {
  const tones = {
    leaf: 'bg-brand-50 text-brand-600 border border-brand-100',
    red: 'bg-urgent-soft text-urgent border border-urgent-border',
    amber: 'bg-warning-soft text-warning border border-warning-border',
    blue: 'bg-info-soft text-info border border-info-border',
  }

  return (
    <div className="card p-5 hover:border-slate-300 hover:shadow-card-hover transition-all">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="text-xs font-medium uppercase tracking-wider text-ink-soft">{label}</div>
          <div className="mt-1 text-2xl font-bold tracking-tight text-ink sm:text-3xl">{value}</div>
          {hint && <div className="mt-1 text-xs text-ink-mute truncate">{hint}</div>}
        </div>
        <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-lg ${tones[tone]}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
      {extra && <div className="mt-3.5 border-t border-line pt-3">{extra}</div>}
    </div>
  )
}

export function EmptyState({ title, text, action, icon: Icon = Inbox }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-line bg-white/50 px-6 py-12 text-center">
      <div className="grid h-11 w-11 place-items-center rounded-xl bg-slate-50 border border-line text-ink-soft">
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="mt-3 text-base font-semibold text-ink">{title}</h3>
      {text && <p className="mt-1 max-w-sm text-xs sm:text-sm text-ink-soft leading-relaxed">{text}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

export function ErrorState({ message, onRetry }) {
  return (
    <div role="alert" className="flex items-start gap-3 rounded-xl border border-urgent-border bg-urgent-soft p-4 text-xs sm:text-sm text-urgent">
      <XCircle className="mt-0.5 h-4 w-4 shrink-0" />
      <div className="flex-1">
        <p className="font-semibold">Unable to complete request</p>
        <p className="mt-0.5 opacity-90">{message}</p>
      </div>
      {onRetry && (
        <button className="btn-secondary !py-1 !px-2.5 text-xs" onClick={onRetry}>
          Try again
        </button>
      )}
    </div>
  )
}

export const PageLoader = ({ label = 'Loading…' }) => (
  <div className="flex flex-col items-center justify-center gap-3 py-20 text-ink-soft">
    <div className="grid h-10 w-10 place-items-center rounded-lg bg-brand-50 border border-brand-100 text-brand-600">
      <Spinner className="h-5 w-5" />
    </div>
    <span className="text-xs sm:text-sm font-medium">{label}</span>
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
    <div
      className="fixed inset-0 z-[2000] grid place-items-center bg-slate-900/25 backdrop-blur-[2px] p-4 animate-in fade-in duration-150"
      onMouseDown={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div className="card w-full max-w-lg p-6 shadow-modal border-line" onMouseDown={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between border-b border-line pb-3">
          <h3 className="text-lg font-bold text-ink">{title}</h3>
          <button className="btn-ghost !p-1 text-ink-mute hover:text-ink -mr-1" onClick={onClose} aria-label="Close">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="text-sm text-ink-soft">{children}</div>
        {footer && <div className="mt-6 flex justify-end gap-2 border-t border-line pt-4">{footer}</div>}
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
          <Button className="btn-danger" loading={loading} onClick={onConfirm}>{confirmLabel}</Button>
        </>
      }
    >
      <div className="flex gap-3">
        <AlertTriangle className="h-5 w-5 shrink-0 text-warning mt-0.5" />
        <p className="leading-relaxed text-ink-soft">{message}</p>
      </div>
    </Modal>
  )
}

export function Toaster() {
  const { toasts, setToasts } = useApp()
  return (
    <div className="no-print fixed bottom-4 right-4 z-[3000] flex w-[min(92vw,22rem)] flex-col gap-2" aria-live="polite">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`card flex items-start gap-2.5 p-3.5 text-xs sm:text-sm shadow-elevated border ${
            t.kind === 'error'
              ? 'border-urgent-border bg-urgent-soft text-urgent'
              : 'border-brand-100 bg-white text-ink'
          }`}
        >
          {t.kind === 'error' ? (
            <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-urgent" />
          ) : (
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-brand-500" />
          )}
          <span className="flex-1 font-medium leading-snug">{t.message}</span>
          <button
            onClick={() => setToasts((x) => x.filter((y) => y.id !== t.id))}
            aria-label="Dismiss"
            className="text-ink-mute hover:text-ink -mr-1 -mt-0.5 p-0.5"
          >
            <X className="h-3.5 w-3.5" />
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
      {error && <span className="mt-1 block text-xs font-medium text-urgent">{error}</span>}
    </label>
  )
}

export const PageHeader = ({ title, subtitle, actions, badge }) => (
  <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-line pb-4">
    <div>
      {badge && <div className="mb-1.5">{badge}</div>}
      <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-ink">{title}</h1>
      {subtitle && <p className="mt-0.5 text-xs sm:text-sm text-ink-soft leading-relaxed max-w-2xl">{subtitle}</p>}
    </div>
    {actions && <div className="no-print flex flex-wrap items-center gap-2">{actions}</div>}
  </div>
)

export function WorkflowSteps({ currentStep = 1, onStepClick, steps = [] }) {
  return (
    <nav aria-label="Workflow progress" className="card mb-6 p-1.5">
      <ol className="grid grid-cols-3 gap-1.5 text-center text-xs font-semibold">
        {steps.map((st, i) => {
          const stepNum = i + 1
          const isDone = stepNum < currentStep
          const isCurrent = stepNum === currentStep
          return (
            <li key={st.label}>
              <button
                type="button"
                onClick={() => onStepClick?.(stepNum)}
                className={`flex w-full items-center justify-center gap-2 rounded-lg py-2 px-2 transition ${
                  isCurrent
                    ? 'bg-brand-500 text-white shadow-sm'
                    : isDone
                    ? 'bg-brand-50 text-brand-700 hover:bg-brand-100'
                    : 'text-ink-mute hover:bg-slate-50'
                }`}
              >
                <span
                  className={`grid h-4 w-4 place-items-center rounded-full text-[10px] font-bold ${
                    isCurrent
                      ? 'bg-white text-brand-700'
                      : isDone
                      ? 'bg-brand-500 text-white'
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
    leaf: 'bg-brand-50/70 border-brand-100 text-brand-800',
    amber: 'bg-warning-soft/70 border-warning-border text-warning',
    blue: 'bg-info-soft/70 border-info-border text-info',
  }
  return (
    <div className={`rounded-lg border p-3 text-xs sm:text-sm flex items-start gap-2.5 ${tones[tone]}`}>
      <Icon className="h-4 w-4 shrink-0 mt-0.5" />
      <div className="flex-1">
        {title && <div className="font-semibold mb-0.5">{title}</div>}
        <div className="opacity-90 leading-relaxed">{children}</div>
      </div>
    </div>
  )
}
