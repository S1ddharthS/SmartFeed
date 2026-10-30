import { useEffect, useState } from 'react'
import { CheckCircle2, ChevronRight, Gauge, MapPin, Printer, Route as RouteIcon, Truck } from 'lucide-react'
import { api } from '../api/client'
import { useApp } from '../context/AppContext'
import { useAsync } from '../lib/useAsync'
import { colorForVehicle, fmtKg } from '../lib/utils'
import { Button, EmptyState, ErrorState, PageHeader, PageLoader, StatCard } from '../components/ui'
import MapView from '../components/MapView'
import RouteTimeline from '../components/RouteTimeline'

export default function RouteDetails() {
  const { toast, demoMin } = useApp()
  const [busy, setBusy] = useState(false)
  const [sel, setSel] = useState('all')

  const { data, loading, error, reload } = useAsync(async () => {
    const [routes, summary, depots] = await Promise.all([
      api.routes().catch(() => []),
      api.summary().catch(() => null),
      api.listDepots(),
    ])
    return { routes: routes || [], summary, depots }
  }, [demoMin])

  useEffect(() => {
    setSel('all')
  }, [data?.routes?.length])

  const plan = async () => {
    setBusy(true)
    try {
      const r = await api.matchResults().catch(() => null)
      if (!r?.matches_count) await api.runMatching()
      await api.planRoutes()
      toast('Fleet routes generated successfully')
      reload()
    } catch (e) {
      toast(e.message, 'error')
    } finally {
      setBusy(false)
    }
  }

  if (loading) return <PageLoader label="Loading driver timelines…" />
  if (error) return <ErrorState message={error} onRetry={reload} />

  const { routes, summary, depots } = data

  if (!routes.length) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Vehicle Routes & Timelines"
          subtitle="Turn-by-turn dispatch itinerary for every driver and vehicle in the rescue network."
        />
        <EmptyState
          title="No active routes planned yet"
          text="Run matching and plan multi-depot routes from the Control Center to generate turn-by-turn driver timelines."
          icon={RouteIcon}
          action={
            <Button className="btn-primary" loading={busy} onClick={plan}>
              Match & Plan Routes Now
            </Button>
          }
        />
      </div>
    )
  }

  const shown = sel === 'all' ? routes : routes.filter((r) => String(r.vehicle_id) === sel)
  const unserved = summary?.unserved_tasks || []
  const m = summary?.metrics

  return (
    <div className="space-y-6">
      <PageHeader
        title="Vehicle Dispatch & Driver Timelines"
        subtitle={`${routes.length} active vehicles on the road · Delivering ${fmtKg(
          m?.food_delivered_kg
        )} with zero expiry violations.`}
        badge={
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-700" /> Dispatch Finalized
          </span>
        }
        actions={
          <div className="flex items-center gap-2">
            <Button className="btn-secondary" loading={busy} onClick={plan}>
              Re-optimize
            </Button>
            <button
              className="btn-primary"
              onClick={() => window.print()}
              title="Print route manifest or export to PDF"
            >
              <Printer className="h-4 w-4" />
              <span>Print / Download PDF</span>
            </button>
          </div>
        }
      />

      {/* Route Fleet Summary KPIs */}
      {m && (
        <div className="no-print grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          <StatCard
            icon={Truck}
            label="Active Fleet"
            value={`${routes.length} Vehicles`}
            hint={`From ${depots.length} hubs across Bangalore`}
            tone="leaf"
          />
          <StatCard
            icon={CheckCircle2}
            label="Food Delivered"
            value={fmtKg(m.food_delivered_kg)}
            hint={`${m.delivery_rate_percent}% delivery fulfillment rate`}
            tone="blue"
          />
          <StatCard
            icon={RouteIcon}
            label="Total Distance"
            value={`${m.total_distance_km} km`}
            hint={`Approx ${Math.round(m.total_time_min)} min total transit`}
            tone="amber"
          />
          <StatCard
            icon={Gauge}
            label="Average Fleet Load"
            value={`${m.avg_vehicle_utilization_percent}%`}
            hint={`${m.split_delivery_count} multi-stop split deliveries`}
            tone="leaf"
          />
        </div>
      )}

      {/* Vehicle Filter Selector Tabs */}
      <div className="no-print flex items-center justify-between gap-4 flex-wrap border-b border-slate-200/80 pb-3">
        <div className="flex flex-wrap items-center gap-2" role="tablist" aria-label="Vehicle selection">
          <button
            role="tab"
            aria-selected={sel === 'all'}
            onClick={() => setSel('all')}
            className={`rounded-xl px-4 py-2 text-xs sm:text-sm font-semibold transition ${
              sel === 'all'
                ? 'bg-slate-900 text-white shadow-sm font-bold'
                : 'border border-slate-200 bg-white text-ink hover:bg-slate-50'
            }`}
          >
            All Vehicles ({routes.length})
          </button>

          {routes.map((r) => {
            const isSelected = sel === String(r.vehicle_id)
            const vColor = colorForVehicle(r.vehicle_id)
            return (
              <button
                key={r.vehicle_id}
                role="tab"
                aria-selected={isSelected}
                onClick={() => setSel(String(r.vehicle_id))}
                className="rounded-xl px-3.5 py-2 text-xs sm:text-sm font-semibold transition border flex items-center gap-2"
                style={
                  isSelected
                    ? { background: vColor, color: '#fff', borderColor: vColor }
                    : { background: '#fff', color: '#0f172a', borderColor: '#e2e8f0' }
                }
              >
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ background: isSelected ? '#fff' : vColor }}
                />
                <span>Vehicle {r.vehicle_id}</span>
                <span className={`text-[11px] ${isSelected ? 'opacity-80' : 'text-ink-mute'}`}>
                  ({r.stops.length} stops)
                </span>
              </button>
            )
          })}
        </div>

        <span className="text-xs text-ink-mute">Click a vehicle tab to focus its route</span>
      </div>

      {/* Interactive Map preview */}
      <div className="no-print card p-1 bg-white shadow-sm overflow-hidden">
        <MapView depots={depots} routes={shown} height={380} />
      </div>

      {/* Itinerary Timelines Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {shown.map((r) => (
          <RouteTimeline key={r.vehicle_id} route={r} />
        ))}
      </div>

      {/* Honest Unserved Deliveries Notification (if any) */}
      {unserved.length > 0 && (
        <div className="card border-amber-200 bg-amber-50/50 p-5 text-sm">
          <div className="flex items-center gap-2 font-bold text-amber-900">
            <RouteIcon className="h-5 w-5 text-amber-700" />
            <span>Could not be routed in this cycle ({unserved.length} tasks)</span>
          </div>
          <p className="mt-1 text-xs text-ink-soft">
            These tasks were matched by priority, but no active vehicle could reach both pickup and delivery without exceeding vehicle capacity or missing the expiry cutoff.
          </p>
          <ul className="mt-3 space-y-2">
            {unserved.map((u, i) => (
              <li key={i} className="rounded-xl border border-amber-200 bg-white p-3 text-xs flex items-center justify-between">
                <div>
                  <b className="text-ink">{u.donor_name} → {u.receiver_name}</b>
                  <span className="text-ink-soft block mt-0.5">{fmtKg(u.quantity_kg)} food load</span>
                </div>
                <span className="font-semibold text-amber-800 bg-amber-100 px-2.5 py-1 rounded-lg">
                  {u.reason}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
