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
      <div className="space-y-6 animate-fade-in">
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
              Plan Routes
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
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Vehicle Dispatch & Driver Timelines"
        subtitle={`${routes.length} active vehicles on the road · Delivering ${fmtKg(
          m?.food_delivered_kg
        )} with zero expiry violations.`}
        badge={
          <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 border border-brand-100 px-2.5 py-0.5 text-xs font-semibold text-brand-700">
            <CheckCircle2 className="h-3 w-3 text-brand-500" /> Dispatch Finalized
          </span>
        }
        actions={
          <div className="flex items-center gap-2">
            <Button className="btn-secondary text-xs sm:text-sm !py-1.5 !px-3" loading={busy} onClick={plan}>
              Update Routes
            </Button>
            <button
              className="btn-primary text-xs sm:text-sm !py-1.5 !px-3.5"
              onClick={() => window.print()}
              title="Print route manifest"
            >
              <Printer className="h-4 w-4" />
              <span>Print Manifest</span>
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
            hint={`${m.split_delivery_count} split deliveries executed`}
            tone="leaf"
          />
        </div>
      )}

      {/* Vehicle Filter Selector Tabs */}
      <div className="no-print flex items-center justify-between gap-3 flex-wrap border-b border-line pb-3">
        <div className="flex flex-wrap items-center gap-1.5" role="tablist" aria-label="Vehicle selection">
          <button
            role="tab"
            aria-selected={sel === 'all'}
            onClick={() => setSel('all')}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              sel === 'all'
                ? 'bg-brand-500 text-white shadow-sm'
                : 'border border-line bg-white text-ink hover:bg-slate-50'
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
                className="rounded-lg px-2.5 py-1.5 text-xs font-semibold transition border flex items-center gap-1.5"
                style={
                  isSelected
                    ? { background: vColor, color: '#fff', borderColor: vColor }
                    : { background: '#fff', color: '#172033', borderColor: '#E8EDF2' }
                }
              >
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ background: isSelected ? '#fff' : vColor }}
                />
                <span>Vehicle {r.vehicle_id}</span>
                <span className={`text-[10px] ${isSelected ? 'opacity-80' : 'text-ink-mute'}`}>
                  ({r.stops.length} stops)
                </span>
              </button>
            )
          })}
        </div>

        <span className="text-xs text-ink-mute">Select vehicle to inspect manifest</span>
      </div>

      {/* Map preview */}
      <div className="no-print card p-1 bg-white shadow-sm overflow-hidden">
        <MapView depots={depots} routes={shown} height={360} />
      </div>

      {/* Driver Timelines Grid */}
      <div className="grid gap-5 lg:grid-cols-2">
        {shown.map((r) => (
          <RouteTimeline key={r.vehicle_id} route={r} />
        ))}
      </div>

      {/* Unserved Tasks if any */}
      {unserved.length > 0 && (
        <div className="card border-warning-border bg-warning-soft/30 p-4 text-xs sm:text-sm">
          <div className="flex items-center gap-2 font-semibold text-warning">
            <RouteIcon className="h-4 w-4" />
            <span>Unrouted in this cycle ({unserved.length} tasks)</span>
          </div>
          <p className="mt-1 text-xs text-ink-soft">
            These tasks were matched by priority, but vehicle capacity limits or tight expiry time windows prevented scheduling on current shifts.
          </p>
          <ul className="mt-2.5 space-y-1.5">
            {unserved.map((u, i) => (
              <li key={i} className="rounded-lg border border-line bg-white p-2.5 text-xs flex items-center justify-between">
                <div>
                  <span className="font-semibold text-ink">{u.donor_name} → {u.receiver_name}</span>
                  <span className="text-ink-mute block text-[11px] mt-0.5">{fmtKg(u.quantity_kg)} load</span>
                </div>
                <span className="font-medium text-warning bg-warning-soft px-2 py-0.5 rounded border border-warning-border text-[11px]">
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
