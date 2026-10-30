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

  if (loading) return <PageLoader label="Loading donation records…" />
  if (error) return <ErrorState message={error} onRetry={reload} />

  const { donations, scores, matches } = data
  const total = donations.reduce((s, d) => s + d.quantity_kg, 0)
  const placed = donations.reduce((s, d) => s + (d.quantity_kg - d.remaining_kg), 0)

  const remove = async () => {
    setBusy(true)
    try {
      await api.deleteDonation(del.id)
      toast('Donation listing removed')
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
        title="Food Donor Portal"
        subtitle={`Track surplus batches, pickup schedules, and matched shelters for ${user.username}.`}
        badge={
          <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 border border-brand-100 px-2.5 py-0.5 text-xs font-semibold text-brand-700">
            <Sparkles className="h-3 w-3 text-brand-500" /> Donor Workspace
          </span>
        }
        actions={
          <Link to="/donor/donate" className="btn-primary !px-4 !py-2 text-xs sm:text-sm">
            <Plus className="h-4 w-4" />
            <span>Donate Food</span>
          </Link>
        }
      />

      {/* Donor Overview Metrics */}
      <div className="grid gap-3 sm:gap-4 sm:grid-cols-3">
        <StatCard
          icon={Scale}
          label="Total Surplus Offered"
          value={fmtKg(total)}
          hint="Aggregate volume registered"
          tone="leaf"
        />
        <StatCard
          icon={Soup}
          label="Matched to Shelters"
          value={fmtKg(placed)}
          hint={total > 0 ? `${Math.round((placed / total) * 100)}% allocation rate` : 'Awaiting surplus batch'}
          tone="blue"
        />
        <StatCard
          icon={Utensils}
          label="Meals Made Possible"
          value={mealsFromKg(placed).toLocaleString()}
          hint="Estimated at ~400g per meal"
          tone="amber"
        />
      </div>

      {/* Active Donation Batches */}
      {!donations.length ? (
        <EmptyState
          title="No food donations posted yet"
          text="List your surplus cooked meals, bakery products, or fresh produce to match with local shelters."
          icon={Package}
          action={
            <Link to="/donor/donate" className="btn-primary">
              <Plus className="h-4 w-4" />
              <span>Donate Food</span>
            </Link>
          }
        />
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs font-medium text-ink-soft">
            <span>Active Listings ({donations.length})</span>
            <span>Live status</span>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {donations.map((d) => {
              const my = matches.filter((m) => m.donation_id === d.id)
              const score = scores[d.id]

              return (
                <article
                  key={d.id}
                  className="card p-5 hover:border-slate-300 hover:shadow-card-hover transition-all flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2 border-b border-line pb-3">
                      <div>
                        <h2 className="text-base font-semibold text-ink leading-snug">{d.food_type}</h2>
                        <span className="text-xs text-ink-soft">{d.donor_name}</span>
                      </div>
                      <StatusPill status={d.status} />
                    </div>

                    {/* Volume & Badges */}
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-semibold text-ink">
                        {fmtKg(d.quantity_kg)}
                      </span>
                      {d.remaining_kg < d.quantity_kg && (
                        <span className="rounded bg-brand-50 border border-brand-100 px-2 py-0.5 text-xs font-medium text-brand-700">
                          {fmtKg(d.quantity_kg - d.remaining_kg)} matched
                        </span>
                      )}
                      <CountdownChip expiry={d.expiry_time} />
                      {score != null && <UrgencyBadge score={score} />}
                    </div>

                    {/* Timing details */}
                    <div className="rounded-lg bg-slate-50 border border-line p-2.5 text-xs">
                      <div className="flex items-center justify-between text-ink-soft">
                        <span className="flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5 text-ink-mute" />
                          <span>Pickup Window:</span>
                        </span>
                        <span className="font-semibold text-ink">
                          {d.pickup_window.start} – {d.pickup_window.end}
                        </span>
                      </div>
                    </div>

                    {/* Matched Recipients */}
                    {my.length > 0 && (
                      <div className="rounded-lg border border-brand-100 bg-brand-50/50 p-3 text-xs">
                        <div className="font-semibold text-brand-800 mb-1 flex items-center gap-1.5">
                          <CheckCircle2 className="h-3.5 w-3.5 text-brand-600" />
                          <span>Assigned Shelters:</span>
                        </div>
                        <ul className="space-y-1">
                          {my.map((m) => (
                            <li key={m.match_id} className="flex items-center justify-between text-ink">
                              <span>{m.receiver_name}</span>
                              <span className="font-semibold text-brand-700">{fmtKg(m.allocated_kg)}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  {/* Actions footer */}
                  <div className="mt-4 pt-3 border-t border-line flex items-center justify-between text-xs">
                    <span className="text-ink-mute text-[11px]">ID #{d.id}</span>
                    <button
                      className="btn-danger !py-1 !px-2.5 text-xs"
                      onClick={() => setDel(d)}
                      title="Remove this listing"
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

      {/* Confirmation Dialog */}
      <ConfirmDialog
        open={!!del}
        title="Remove Donation Listing?"
        message={`“${del?.food_type}” (${del?.quantity_kg} kg) will be removed from the active rescue queue.`}
        confirmLabel="Remove Listing"
        onConfirm={remove}
        onCancel={() => setDel(null)}
        loading={busy}
      />
    </div>
  )
}
