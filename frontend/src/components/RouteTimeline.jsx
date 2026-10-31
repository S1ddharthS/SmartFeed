import { AlertTriangle, Building2, CheckCircle2, Clock, MapPin, PackageCheck, PackageOpen, Split, Truck } from 'lucide-react'
import { colorForVehicle, fmtKg, toMin } from '../lib/utils'

/** minutes between a delivery arrival (HH:MM) and the food's expiry timestamp */
const minutesToExpiry = (stop) => {
  if (!stop.expiry_time || !stop.arrive) return null
  const e = new Date(stop.expiry_time)
  return e.getHours() * 60 + e.getMinutes() - toMin(stop.arrive)
}

export default function RouteTimeline({ route, compact = false }) {
  const steps = route.detailed_timeline?.length ? route.detailed_timeline : route.stops
  const color = colorForVehicle(route.vehicle_id)

  return (
    <div className="card p-5 border-line shadow-card hover:border-slate-300 transition-all">
      {/* Vehicle Summary Header */}
      <div className="mb-4 pb-3.5 border-b border-line flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div
            className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-xs font-bold text-white shadow-sm"
            style={{ background: color }}
          >
            V{route.vehicle_id}
          </div>
          <div>
            <div className="text-sm font-semibold text-ink leading-tight">
              Vehicle {route.vehicle_id} · <span className="text-xs text-ink-soft font-normal">{route.depot_name}</span>
            </div>
            <div className="text-[11px] text-ink-mute mt-0.5">
              Max Payload: {route.capacity_kg} kg · Shift Active
            </div>
          </div>
        </div>

        {/* Quick Vehicle KPIs */}
        <div className="flex items-center gap-2 text-xs">
          <div className="rounded border border-line bg-slate-50 px-2 py-1 text-center">
            <span className="text-ink-mute block text-[9px] uppercase font-medium">Distance</span>
            <span className="font-semibold text-ink text-xs">{route.total_distance_km} km</span>
          </div>
          <div className="rounded border border-line bg-slate-50 px-2 py-1 text-center">
            <span className="text-ink-mute block text-[9px] uppercase font-medium">Duration</span>
            <span className="font-semibold text-ink text-xs">{Math.round(route.total_time_min)}m</span>
          </div>
          <div className="rounded border border-line bg-slate-50 px-2 py-1 text-center">
            <span className="text-ink-mute block text-[9px] uppercase font-medium">Load</span>
            <span className="font-semibold text-brand-600 text-xs">{route.capacity_utilization_percent}%</span>
          </div>
        </div>
      </div>

      {/* Capacity Utilization Progress Bar */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-xs mb-1">
          <span className="text-ink-mute text-[11px]">Payload Load</span>
          <span className="font-medium text-ink text-xs">{route.max_load_kg || 0} / {route.capacity_kg} kg</span>
        </div>
        <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${Math.min(100, route.capacity_utilization_percent)}%`,
              backgroundColor: color,
            }}
          />
        </div>
      </div>

      {/* Vertical Stop-by-Stop Itinerary */}
      <ol className="relative ml-3.5 border-l-2 pl-5 space-y-3.5" style={{ borderColor: `${color}30` }}>
        {steps.map((s, i) => {
          const isDepot = s.type.startsWith('depot')
          const isPickup = s.type === 'pickup'
          const isDelivery = s.type === 'delivery'
          const mins = isDelivery ? minutesToExpiry(s) : null
          const warn = mins != null && mins < 60

          const Icon = isDepot ? Building2 : isPickup ? PackageOpen : PackageCheck
          const title = isDepot
            ? s.type === 'depot_start'
              ? `Depart from ${s.name}`
              : `Return to ${s.name}`
            : isPickup
              ? `Pick up from ${s.donor_name}`
              : `Deliver to ${s.receiver_name}`

          return (
            <li key={i} className="relative group">
              {/* Node Icon on Timeline */}
              <span
                className="absolute -left-[1.85rem] grid h-6 w-6 place-items-center rounded-full border bg-white shadow-sm transition group-hover:scale-110"
                style={{ borderColor: color }}
              >
                <Icon className="h-3 w-3" style={{ color }} />
              </span>

              {/* Stop Card */}
              <div
                className={`rounded-lg border p-2.5 text-xs transition-all ${
                  isDepot
                    ? 'border-line bg-slate-50/60'
                    : isPickup
                    ? 'border-brand-100 bg-brand-50/20'
                    : 'border-info-border bg-info-soft/20'
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-1">
                  <span className="font-semibold text-ink text-xs">{title}</span>
                  <span className="text-[11px] text-ink-soft bg-white px-1.5 py-0.5 rounded border border-line">
                    {s.arrive ? `Arrive ${s.arrive}` : ''}
                    {s.arrive && s.depart ? ' · ' : ''}
                    {s.depart ? `Depart ${s.depart}` : ''}
                  </span>
                </div>

                {!isDepot && (
                  <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[11px]">
                    <span
                      className={`font-semibold px-1.5 py-0.5 rounded ${
                        isPickup ? 'bg-brand-50 text-brand-700 border border-brand-100' : 'bg-info-soft text-info border border-info-border'
                      }`}
                    >
                      {isPickup ? `+${s.kg} kg` : `-${s.kg} kg`}
                    </span>
                    <span className="text-ink-mute">On-board: {s.cum_load_kg} kg</span>

                    {String(s.task_id || '').includes('_') && (
                      <span className="inline-flex items-center gap-1 rounded bg-warning-soft px-1.5 py-0.5 font-medium text-warning text-[10px] border border-warning-border">
                        <Split className="h-2.5 w-2.5" /> Split Lot
                      </span>
                    )}

                    {isDelivery && mins != null && !warn && (
                      <span className="inline-flex items-center gap-1 text-[10px] text-brand-600 font-medium ml-auto">
                        <CheckCircle2 className="h-3 w-3" /> {mins}m safe margin
                      </span>
                    )}
                  </div>
                )}

                {warn && !compact && (
                  <div className="mt-1.5 inline-flex items-center gap-1.5 rounded bg-urgent-soft px-2 py-0.5 text-[11px] font-medium text-urgent border border-urgent-border">
                    <AlertTriangle className="h-3 w-3 shrink-0" />
                    <span>
                      {mins <= 0 ? 'Arrives after expiry' : `Tight window: ${mins}m left before expiry`}
                    </span>
                  </div>
                )}
              </div>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
