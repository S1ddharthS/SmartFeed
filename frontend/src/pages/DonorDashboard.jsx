import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, CheckCircle2, Clock, MapPin, Package, Plus, Scale, Soup, Sparkles, Trash2, Utensils } from 'lucide-react'
import { api } from '../api/client'
import { isMine, useApp } from '../context/AppContext'
import { useAsync } from '../lib/useAsync'
import { fmtKg, mealsFromKg } from '../lib/utils'
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

export default function DonorDashboard() {
  const { user, toast, demoMin } = useApp()
  const [del, setDel] = useState(null)
  const [busy, setBusy] = useState(false)

  const { data, loading, error, reload } = useAsync(async () => {
    const [donations, scores, results] = await Promise.all([
      api.listDonations(),
      api.scores().catch(() => null),
      api.matchResults().catch(() => null),
    ])
    return {
      donations: donations.filter((d) => isMine(d, user, 'donations')),
      scores: Object.fromEntries((scores?.donations || []).map((s) => [s.id, s.urgency_score])),
      matches: results?.matches || [],
    }
  }, [user?.username, demoMin])

  if (loading) return <PageLoader label="Loading your food donations…" />
  if (error) return <ErrorState message={error} onRetry={reload} />

  const { donations, scores, matches } = data
  const total = donations.reduce((s, d) => s + d.quantity_kg, 0)
  const placed = donations.reduce((s, d) => s + (d.quantity_kg - d.remaining_kg), 0)

  const remove = async () => {
    setBusy(true)
    try {
      await api.deleteDonation(del.id)
      toast('Donation listing removed successfully')
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
        title="My Food Donations"
        subtitle={`Welcome, ${user.username}. Track surplus pickups and see which shelters received your food.`}
        badge={
          <span className="inline-flex items-center gap-1.5 rounded-full bg-leaf-100 px-3 py-1 text-xs font-bold text-leaf-800 border border-leaf-200">
            <Sparkles className="h-3.5 w-3.5 text-leaf-700" /> Food Donor Portal
          </span>
        }
        actions={
          <Link to="/donor/donate" className="btn-primary !px-4 !py-2.5 shadow-sm hover:shadow">
            <Plus className="h-4 w-4" />
            <span>Donate Surplus Food</span>
          </Link>
        }
      />

      {/* Donor Impact Stats */}
      <div className="grid gap-3 sm:gap-4 sm:grid-cols-3">
        <StatCard
          icon={Scale}
          label="Total Surplus Offered"
          value={fmtKg(total)}
          hint="Total volume registered"
          tone="leaf"
        />
        <StatCard
          icon={Soup}
          label="Matched to Shelters"
          value={fmtKg(placed)}
          hint={total > 0 ? `${Math.round((placed / total) * 100)}% allocation rate` : 'Awaiting surplus'}
          tone="blue"
        />
        <StatCard
          icon={Utensils}
          label="Meals Made Possible"
          value={mealsFromKg(placed).toLocaleString()}
          hint="Calculated at ~400g per meal"
          tone="amber"
        />
      </div>

      {/* Donation Cards */}
      {!donations.length ? (
        <EmptyState
          title="No active food donations yet"
          text="Post your first batch of surplus meals, bakery items, or produce. Registration takes under 60 seconds."
          icon={Package}
          action={
            <Link to="/donor/donate" className="btn-primary">
              <Plus className="h-4 w-4" />
              <span>Post Surplus Batch</span>
            </Link>
          }
        />
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs font-bold text-ink-mute uppercase tracking-wider">
            <span>Your Listed Batches ({donations.length})</span>
            <span>Real-time dispatch status</span>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            {donations.map((d) => {
              const my = matches.filter((m) => m.donation_id === d.id)
              const score = scores[d.id]

              return (
                <article
                  key={d.id}
                  className="card p-5 border-slate-200/90 shadow-sm transition hover:shadow-card-hover flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    {/* Header: Food Type & Status */}
                    <div className="flex flex-wrap items-start justify-between gap-2 border-b border-slate-100 pb-3">
                      <div>
                        <h2 className="font-display text-lg font-bold text-ink">{d.food_type}</h2>
                        <span className="text-xs text-ink-soft">{d.donor_name}</span>
                      </div>
                      <StatusPill status={d.status} />
                    </div>

                    {/* Quantity & Expiry Badges */}
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-bold text-ink">
                        {fmtKg(d.quantity_kg)} total
                      </span>
                      {d.remaining_kg < d.quantity_kg && (
                        <span className="rounded-lg bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-xs font-semibold text-emerald-800">
                          {fmtKg(d.quantity_kg - d.remaining_kg)} matched
                        </span>
                      )}
                      <CountdownChip expiry={d.expiry_time} />
                      {score != null && <UrgencyBadge score={score} />}
                    </div>

                    {/* Timing details */}
                    <div className="rounded-xl bg-slate-50 border border-slate-200/60 p-3 text-xs space-y-1">
                      <div className="flex items-center justify-between text-ink-soft">
                        <span className="flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5 text-ink-mute" />
                          <span>Pickup Window:</span>
                        </span>
                        <b className="text-ink">
                          {d.pickup_window.start} – {d.pickup_window.end}
                        </b>
                      </div>
                    </div>

                    {/* Matched Recipients (Shelters) */}
                    {my.length > 0 && (
                      <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-3.5 text-xs">
                        <div className="font-bold text-emerald-950 mb-1.5 flex items-center gap-1.5">
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                          <span>Recipient Allocations:</span>
                        </div>
                        <ul className="space-y-1">
                          {my.map((m) => (
                            <li key={m.match_id} className="flex items-center justify-between font-medium text-ink">
                              <span>{m.receiver_name}</span>
                              <b className="text-emerald-800">{fmtKg(m.allocated_kg)}</b>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  {/* Actions footer */}
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-ink-mute">Batch #{d.id}</span>
                    <button
                      className="btn-danger !py-1 !px-2.5 text-xs"
                      onClick={() => setDel(d)}
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

      {/* Confirmation Dialog */}
      <ConfirmDialog
        open={!!del}
        title="Remove this donation listing?"
        message={`“${del?.food_type}” (${del?.quantity_kg} kg) from ${del?.donor_name} will be removed from the active rescue queue.`}
        onConfirm={remove}
        onCancel={() => setDel(null)}
        loading={busy}
      />
    </div>
  )
}
