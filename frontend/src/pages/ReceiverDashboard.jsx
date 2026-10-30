import { useState } from 'react'
import { Link } from 'react-router-dom'
import { CheckCircle2, Clock, HeartHandshake, MapPin, Plus, Scale, Sparkles, Trash2, Truck } from 'lucide-react'
import { api } from '../api/client'
import { isMine, useApp } from '../context/AppContext'
import { useAsync } from '../lib/useAsync'
import { fmtKg } from '../lib/utils'
import {
  Button,
  ConfirmDialog,
  EmptyState,
  ErrorState,
  PageHeader,
  PageLoader,
  StatCard,
  StatusPill,
  UrgencyBadge,
} from '../components/ui'

export default function ReceiverDashboard() {
  const { user, toast, demoMin } = useApp()
  const [del, setDel] = useState(null)
  const [busy, setBusy] = useState(false)

  const { data, loading, error, reload } = useAsync(async () => {
    const [requests, scores, results, routes] = await Promise.all([
      api.listRequests(),
      api.scores().catch(() => null),
      api.matchResults().catch(() => null),
      api.routes().catch(() => []),
    ])
    return {
      requests: requests.filter((r) => isMine(r, user, 'requests')),
      scores: Object.fromEntries((scores?.requests || []).map((s) => [s.id, s.urgency_score])),
      matches: results?.matches || [],
      etas: (routes || []).flatMap((rt) =>
        rt.stops
          .filter((s) => s.type === 'delivery')
          .map((s) => ({ ...s, vehicle: rt.vehicle_id }))
      ),
    }
  }, [user?.username, demoMin])

  if (loading) return <PageLoader label="Loading shelter requests…" />
  if (error) return <ErrorState message={error} onRetry={reload} />

  const { requests, scores, matches, etas } = data
  const need = requests.reduce((s, r) => s + r.quantity_kg, 0)
  const covered = requests.reduce((s, r) => s + (r.quantity_kg - r.remaining_kg), 0)

  const remove = async () => {
    setBusy(true)
    try {
      await api.deleteRequest(del.id)
      toast('Food request removed')
      setDel(null)
      reload()
    } catch (e) {
      toast(e.message, 'error')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Shelter Portal"
        subtitle={`Monitor incoming food deliveries, vehicle ETAs, and request meal rations for ${user.username}.`}
        badge={
          <span className="inline-flex items-center gap-1.5 rounded-full bg-info-soft border border-info-border px-2.5 py-0.5 text-xs font-semibold text-info">
            <Sparkles className="h-3 w-3 text-info" /> Beneficiary Workspace
          </span>
        }
        actions={
          <Link to="/receiver/request" className="btn-primary !px-4 !py-2 text-xs sm:text-sm">
            <Plus className="h-4 w-4" />
            <span>Request Food</span>
          </Link>
        }
      />

      {/* Overview Stats */}
      <div className="grid gap-3 sm:gap-4 sm:grid-cols-3">
        <StatCard
          icon={Scale}
          label="Total Food Needed"
          value={fmtKg(need)}
          hint="Aggregate requested volume"
          tone="leaf"
        />
        <StatCard
          icon={HeartHandshake}
          label="Already Covered"
          value={fmtKg(covered)}
          hint={need > 0 ? `${Math.round((covered / need) * 100)}% fulfilled` : 'No pending requests'}
          tone="blue"
        />
        <StatCard
          icon={Truck}
          label="Deliveries Dispatched"
          value={etas.filter((e) => requests.some((r) => r.id === e.request_id)).length}
          hint="Vehicles currently en route"
          tone="amber"
        />
      </div>

      {/* Requests List */}
      {!requests.length ? (
        <EmptyState
          title="No food requests submitted"
          text="Submit a meal request with required volume, hunger urgency level, and delivery time window."
          icon={HeartHandshake}
          action={
            <Link to="/receiver/request" className="btn-primary">
              <Plus className="h-4 w-4" />
              <span>Request Food</span>
            </Link>
          }
        />
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs font-medium text-ink-soft">
            <span>Active Requests ({requests.length})</span>
            <span>Real-time arrival status</span>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {requests.map((r) => {
              const inc = matches.filter((m) => m.request_id === r.id)
              const eta = etas.filter((e) => e.request_id === r.id)
              const score = scores[r.id]
              const percentCovered = Math.round(((r.quantity_kg - r.remaining_kg) / r.quantity_kg) * 100)

              return (
                <article
                  key={r.id}
                  className="card p-5 hover:border-slate-300 hover:shadow-card-hover transition-all flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2 border-b border-line pb-3">
                      <div>
                        <h2 className="text-base font-semibold text-ink leading-snug">{r.receiver_name}</h2>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="rounded bg-urgent-soft px-1.5 py-0.5 text-[11px] font-semibold text-urgent border border-urgent-border">
                            Need Level {r.need_level}/5
                          </span>
                        </div>
                      </div>
                      <StatusPill status={r.status} />
                    </div>

                    {/* Progress Bar & Fulfillment Status */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-ink">
                          {fmtKg(r.quantity_kg - r.remaining_kg)} / {fmtKg(r.quantity_kg)} fulfilled
                        </span>
                        <span className="font-semibold text-brand-600">{percentCovered}%</span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-brand-500 transition-all duration-500"
                          style={{ width: `${percentCovered}%` }}
                        />
                      </div>
                    </div>

                    {/* Score and Receiving Window */}
                    <div className="flex flex-wrap items-center gap-1.5">
                      {score != null && <UrgencyBadge score={score} />}
                      <span className="rounded bg-slate-50 border border-line px-2 py-0.5 text-xs text-ink-soft flex items-center gap-1">
                        <Clock className="h-3 w-3 text-ink-mute" />
                        <span>Delivery: <b>{r.delivery_window.start} – {r.delivery_window.end}</b></span>
                      </span>
                    </div>

                    {/* Live ETA Box if scheduled */}
                    {eta.length > 0 && (
                      <div className="rounded-lg border border-info-border bg-info-soft/60 p-2.5 text-xs">
                        <div className="font-semibold text-info mb-0.5 flex items-center gap-1.5">
                          <Truck className="h-3.5 w-3.5 text-info" />
                          <span>Dispatch Active:</span>
                        </div>
                        {eta.map((e, idx) => (
                          <div key={idx} className="text-ink text-xs font-medium">
                            Vehicle {e.vehicle} scheduled arrival: <b>{e.arrive}</b> ({e.kg} kg)
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Matched Batches */}
                    {inc.length > 0 && (
                      <div className="rounded-lg border border-line bg-slate-50/70 p-2.5 text-xs">
                        <div className="font-semibold text-ink mb-1">Supplied By:</div>
                        <ul className="space-y-1 text-ink-soft">
                          {inc.map((m) => (
                            <li key={m.match_id} className="flex items-center justify-between">
                              <span>{m.donor_name} ({m.food_type})</span>
                              <span className="font-semibold text-ink">{fmtKg(m.allocated_kg)}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  {/* Footer actions */}
                  <div className="mt-4 pt-3 border-t border-line flex items-center justify-between text-xs">
                    <span className="text-ink-mute text-[11px]">Request #{r.id}</span>
                    <button
                      className="btn-danger !py-1 !px-2.5 text-xs"
                      onClick={() => setDel(r)}
                      title="Remove this request"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span>Delete</span>
                    </button>
                  </div>
                </article>
              )
            })}
          </div>
        </div>
      )}

      {/* Confirm Deletion Modal */}
      <ConfirmDialog
        open={!!del}
        title="Delete Food Request?"
        message={`The food request from ${del?.receiver_name} (${del?.quantity_kg} kg) will be removed from incoming dispatch.`}
        confirmLabel="Delete Request"
        onConfirm={remove}
        onCancel={() => setDel(null)}
        loading={busy}
      />
    </div>
  )
}
