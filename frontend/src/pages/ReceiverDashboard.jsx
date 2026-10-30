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

  if (loading) return <PageLoader label="Loading your food requests…" />
  if (error) return <ErrorState message={error} onRetry={reload} />

  const { requests, scores, matches, etas } = data
  const need = requests.reduce((s, r) => s + r.quantity_kg, 0)
  const covered = requests.reduce((s, r) => s + (r.quantity_kg - r.remaining_kg), 0)

  const remove = async () => {
    setBusy(true)
    try {
      await api.deleteRequest(del.id)
      toast('Food request removed successfully')
      setDel(null)
      reload()
    } catch (e) {
      toast(e.message, 'error')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Food Requests"
        subtitle={`Welcome, ${user.username}. Monitor incoming deliveries, track vehicle ETAs, and request meal rations.`}
        badge={
          <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-800 border border-blue-200">
            <Sparkles className="h-3.5 w-3.5 text-blue-700" /> Food Recipient Portal
          </span>
        }
        actions={
          <Link to="/receiver/request" className="btn-primary !px-4 !py-2.5 shadow-sm hover:shadow">
            <Plus className="h-4 w-4" />
            <span>Request Food Rations</span>
          </Link>
        }
      />

      {/* Recipient Overview KPIs */}
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
          hint={need > 0 ? `${Math.round((covered / need) * 100)}% fulfilled` : 'No open requests'}
          tone="blue"
        />
        <StatCard
          icon={Truck}
          label="Deliveries Dispatched"
          value={etas.filter((e) => requests.some((r) => r.id === e.request_id)).length}
          hint="Vehicles currently scheduled"
          tone="amber"
        />
      </div>

      {/* Requests List */}
      {!requests.length ? (
        <EmptyState
          title="No food requests submitted yet"
          text="Tell us how many kilograms your shelter or kitchen needs and your preferred delivery window."
          icon={HeartHandshake}
          action={
            <Link to="/receiver/request" className="btn-primary">
              <Plus className="h-4 w-4" />
              <span>Submit Request</span>
            </Link>
          }
        />
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs font-bold text-ink-mute uppercase tracking-wider">
            <span>Your Active Requests ({requests.length})</span>
            <span>Real-time arrival status</span>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            {requests.map((r) => {
              const inc = matches.filter((m) => m.request_id === r.id)
              const eta = etas.filter((e) => e.request_id === r.id)
              const score = scores[r.id]
              const percentCovered = Math.round(((r.quantity_kg - r.remaining_kg) / r.quantity_kg) * 100)

              return (
                <article
                  key={r.id}
                  className="card p-5 border-slate-200/90 shadow-sm transition hover:shadow-card-hover flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    {/* Header */}
                    <div className="flex flex-wrap items-start justify-between gap-2 border-b border-slate-100 pb-3">
                      <div>
                        <h2 className="font-display text-lg font-bold text-ink">{r.receiver_name}</h2>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="rounded-md bg-rose-50 px-2 py-0.5 text-xs font-bold text-rose-700 border border-rose-200">
                            Hunger Priority: Level {r.need_level}/5
                          </span>
                        </div>
                      </div>
                      <StatusPill status={r.status} />
                    </div>

                    {/* Progress Bar & Fulfillment Status */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-ink">
                          {fmtKg(r.quantity_kg - r.remaining_kg)} / {fmtKg(r.quantity_kg)} fulfilled
                        </span>
                        <span className="font-semibold text-leaf-800">{percentCovered}%</span>
                      </div>
                      <div className="h-2.5 w-full rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-leaf-600 transition-all duration-500"
                          style={{ width: `${percentCovered}%` }}
                        />
                      </div>
                    </div>

                    {/* Score and Receiving Window */}
                    <div className="flex flex-wrap items-center gap-2">
                      {score != null && <UrgencyBadge score={score} />}
                      <span className="rounded-lg bg-slate-50 border border-slate-200/80 px-2.5 py-1 text-xs text-ink-soft flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5 text-ink-mute" />
                        <span>Receiving Window: <b>{r.delivery_window.start} – {r.delivery_window.end}</b></span>
                      </span>
                    </div>

                    {/* Live ETA Box if scheduled */}
                    {eta.length > 0 && (
                      <div className="rounded-xl border border-blue-200 bg-blue-50/60 p-3 text-xs">
                        <div className="font-bold text-blue-950 mb-1 flex items-center gap-1.5">
                          <Truck className="h-4 w-4 text-blue-600" />
                          <span>Vehicle On The Road:</span>
                        </div>
                        {eta.map((e, idx) => (
                          <div key={idx} className="text-blue-900 font-medium">
                            Vehicle {e.vehicle} arriving at approximately <b>{e.arrive}</b> with <b>{e.kg} kg</b>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Incoming Matched Batches */}
                    {inc.length > 0 && (
                      <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs">
                        <div className="font-bold text-ink mb-1">Supplied By:</div>
                        <ul className="space-y-1 text-ink-soft">
                          {inc.map((m) => (
                            <li key={m.match_id} className="flex items-center justify-between">
                              <span>{m.donor_name} ({m.food_type})</span>
                              <b className="text-ink font-semibold">{fmtKg(m.allocated_kg)}</b>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  {/* Footer actions */}
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-ink-mute">Request #{r.id}</span>
                    <button
                      className="btn-danger !py-1 !px-2.5 text-xs"
                      onClick={() => setDel(r)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span>Remove</span>
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
        title="Delete this food request?"
        message={`The food request from ${del?.receiver_name} (${del?.quantity_kg} kg) will be removed from incoming dispatch.`}
        onConfirm={remove}
        onCancel={() => setDel(null)}
        loading={busy}
      />
    </div>
  )
}
