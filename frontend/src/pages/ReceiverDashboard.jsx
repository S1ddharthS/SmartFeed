import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  HeartHandshake,
  MapPin,
  Package,
  Plus,
  Scale,
  Soup,
  Sparkles,
  Trash2,
  Truck,
} from 'lucide-react'
import { api } from '../api/client'
import { isMine, useApp } from '../context/AppContext'
import { useAsync } from '../lib/useAsync'
import { fmtKg } from '../lib/utils'
import {
  Button,
  ConfirmDialog,
  CountdownChip,
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
  const nav = useNavigate()
  const [activeTab, setActiveTab] = useState('available') // 'available' | 'requests'
  const [del, setDel] = useState(null)
  const [busy, setBusy] = useState(false)

  const { data, loading, error, reload } = useAsync(async () => {
    const [requests, donations, scores, results, routes] = await Promise.all([
      api.listRequests(),
      api.listDonations(),
      api.scores().catch(() => null),
      api.matchResults().catch(() => null),
      api.routes().catch(() => []),
    ])
    return {
      requests: requests.filter((r) => isMine(r, user, 'requests')),
      availableDonations: donations.filter((d) => (d.remaining_kg ?? d.quantity_kg) > 0),
      donationScores: Object.fromEntries(
        (scores?.donations || []).map((s) => [s.id, s.urgency_score])
      ),
      requestScores: Object.fromEntries(
        (scores?.requests || []).map((s) => [s.id, s.urgency_score])
      ),
      matches: results?.matches || [],
      etas: (routes || []).flatMap((rt) =>
        rt.stops
          .filter((s) => s.type === 'delivery')
          .map((s) => ({ ...s, vehicle: rt.vehicle_id }))
      ),
    }
  }, [user?.username, demoMin])

  if (loading) return <PageLoader label="Loading shelter data…" />
  if (error) return <ErrorState message={error} onRetry={reload} />

  const { requests, availableDonations, donationScores, requestScores, matches, etas } = data
  const needKg = requests.reduce((s, r) => s + r.quantity_kg, 0)
  const coveredKg = requests.reduce((s, r) => s + (r.quantity_kg - r.remaining_kg), 0)
  const totalAvailableKg = availableDonations.reduce(
    (s, d) => s + (d.remaining_kg ?? d.quantity_kg),
    0
  )

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
        title="Shelter Dashboard"
        subtitle={`Discover available food surplus and manage delivery requests for ${user.username}.`}
        badge={
          <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 border border-brand-100 px-2.5 py-0.5 text-xs font-semibold text-brand-700">
            <Sparkles className="h-3 w-3 text-brand-500" /> Beneficiary Portal
          </span>
        }
        actions={
          <Link to="/receiver/request" className="btn-primary !px-4 !py-2 text-xs sm:text-sm">
            <Plus className="h-4 w-4" />
            <span>Request Food</span>
          </Link>
        }
      />

      {/* Overview Statistics (3 Simple Cards) */}
      <div className="grid gap-3 sm:gap-4 sm:grid-cols-3">
        <StatCard
          icon={Soup}
          label="Available Food"
          value={fmtKg(totalAvailableKg)}
          hint={`${availableDonations.length} surplus batches available now`}
          tone="leaf"
        />
        <StatCard
          icon={HeartHandshake}
          label="Food Received"
          value={fmtKg(coveredKg)}
          hint={needKg > 0 ? `${Math.round((coveredKg / needKg) * 100)}% of requested need met` : 'No active requests'}
          tone="blue"
        />
        <StatCard
          icon={Truck}
          label="Active Deliveries"
          value={etas.filter((e) => requests.some((r) => r.id === e.request_id)).length}
          hint="Vehicles scheduled or en route"
          tone="amber"
        />
      </div>

      {/* Tab Switcher: Available Food vs My Requests */}
      <div className="flex rounded-lg border border-line bg-slate-50 p-1 text-xs font-semibold max-w-sm">
        <button
          type="button"
          onClick={() => setActiveTab('available')}
          className={`flex-1 py-1.5 px-3 rounded transition flex items-center justify-center gap-1.5 ${
            activeTab === 'available'
              ? 'bg-white text-brand-700 shadow-sm font-semibold'
              : 'text-ink-soft hover:text-ink'
          }`}
        >
          <Soup className="h-3.5 w-3.5" />
          <span>Available Food ({availableDonations.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('requests')}
          className={`flex-1 py-1.5 px-3 rounded transition flex items-center justify-center gap-1.5 ${
            activeTab === 'requests'
              ? 'bg-white text-brand-700 shadow-sm font-semibold'
              : 'text-ink-soft hover:text-ink'
          }`}
        >
          <HeartHandshake className="h-3.5 w-3.5" />
          <span>My Requests ({requests.length})</span>
        </button>
      </div>

      {/* SECTION 1: Available Food Feed */}
      {activeTab === 'available' && (
        <div className="space-y-4">
          {!availableDonations.length ? (
            <EmptyState
              title="No food available right now"
              text="Check back soon or create a request so donors can match with your shelter."
              icon={Soup}
              action={
                <Link to="/receiver/request" className="btn-primary">
                  <Plus className="h-4 w-4" />
                  <span>Request Food</span>
                </Link>
              }
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {availableDonations.map((d) => {
                const score = donationScores[d.id]
                const qty = d.remaining_kg ?? d.quantity_kg

                return (
                  <article
                    key={d.id}
                    className="card p-5 hover:border-slate-300 hover:shadow-card-hover transition-all flex flex-col justify-between"
                  >
                    <div className="space-y-3">
                      {/* Top Header */}
                      <div className="flex items-start justify-between gap-2 border-b border-line pb-3">
                        <div>
                          <h2 className="text-base font-semibold text-ink leading-snug">{d.food_type}</h2>
                          <span className="text-xs text-ink-soft flex items-center gap-1 mt-0.5">
                            <MapPin className="h-3 w-3 text-ink-mute" />
                            {d.donor_name}
                          </span>
                        </div>
                        <StatusPill status={d.status || 'available'} />
                      </div>

                      {/* Quantity & Expiry */}
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="rounded bg-brand-50 border border-brand-100 px-2 py-0.5 text-xs font-semibold text-brand-700">
                          {fmtKg(qty)} available
                        </span>
                        <CountdownChip expiry={d.expiry_time} />
                        {score != null && <UrgencyBadge score={score} />}
                      </div>

                      {/* Pickup Window */}
                      <div className="rounded-lg bg-slate-50 border border-line p-2 text-xs text-ink-soft flex items-center justify-between">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3 text-ink-mute" />
                          <span>Pickup Window:</span>
                        </span>
                        <span className="font-semibold text-ink">
                          {d.pickup_window.start} – {d.pickup_window.end}
                        </span>
                      </div>
                    </div>

                    {/* Action */}
                    <div className="mt-4 pt-3 border-t border-line flex items-center justify-between">
                      <span className="text-[11px] text-ink-mute">Safe food rescue</span>
                      <Link
                        to="/receiver/request"
                        className="btn-primary !py-1.5 !px-3 text-xs"
                      >
                        <span>Request Food</span>
                      </Link>
                    </div>
                  </article>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* SECTION 2: Active Shelter Requests */}
      {activeTab === 'requests' && (
        <div className="space-y-4">
          {!requests.length ? (
            <EmptyState
              title="No requests yet"
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
            <div className="grid gap-4 md:grid-cols-2">
              {requests.map((r) => {
                const inc = matches.filter((m) => m.request_id === r.id)
                const eta = etas.filter((e) => e.request_id === r.id)
                const score = requestScores[r.id]
                const percentCovered = Math.round(
                  ((r.quantity_kg - r.remaining_kg) / r.quantity_kg) * 100
                )

                return (
                  <article
                    key={r.id}
                    className="card p-5 hover:border-slate-300 hover:shadow-card-hover transition-all flex flex-col justify-between"
                  >
                    <div className="space-y-3">
                      {/* Header */}
                      <div className="flex items-start justify-between gap-2 border-b border-line pb-3">
                        <div>
                          <h2 className="text-base font-semibold text-ink leading-snug">
                            {r.receiver_name}
                          </h2>
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
                          <span>
                            Delivery: <b>{r.delivery_window.start} – {r.delivery_window.end}</b>
                          </span>
                        </span>
                      </div>

                      {/* Live ETA Box if scheduled */}
                      {eta.length > 0 && (
                        <div className="rounded-lg border border-brand-100 bg-brand-50/50 p-2.5 text-xs">
                          <div className="flex items-center justify-between text-brand-800 font-semibold mb-1">
                            <span className="flex items-center gap-1">
                              <Truck className="h-3.5 w-3.5 text-brand-600" />
                              <span>Dispatched Vehicle</span>
                            </span>
                            <span className="text-[11px] font-mono">
                              ETA {eta[0].estimated_arrival}
                            </span>
                          </div>
                          <div className="text-[11px] text-ink-soft">
                            Vehicle #{eta[0].vehicle} assigned to your shelter.
                          </div>
                        </div>
                      )}

                      {/* Matched Donors */}
                      {inc.length > 0 && (
                        <div className="rounded-lg border border-line bg-slate-50/80 p-2.5 text-xs space-y-1">
                          <span className="font-semibold text-ink block">Matched Donations:</span>
                          {inc.map((m) => (
                            <div
                              key={m.match_id}
                              className="flex items-center justify-between text-ink-soft"
                            >
                              <span>{m.food_type} ({m.donor_name})</span>
                              <span className="font-semibold text-ink">{fmtKg(m.allocated_kg)}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="mt-4 pt-3 border-t border-line flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => setDel(r)}
                        className="btn-danger !py-1 !px-2.5 text-xs"
                      >
                        <Trash2 className="h-3 w-3" />
                        <span>Delete</span>
                      </button>
                      <Link to="/receiver/request" className="btn-secondary !py-1 !px-2.5 text-xs">
                        New Request
                      </Link>
                    </div>
                  </article>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmDialog
        open={Boolean(del)}
        title="Delete Food Request"
        message={`Are you sure you want to delete the food request for ${del?.quantity_kg} kg? This action cannot be undone.`}
        confirmLabel="Delete"
        loading={busy}
        onConfirm={remove}
        onCancel={() => setDel(null)}
      />
    </div>
  )
}
