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
    <div className="card p-5 border-slate-200/90 shadow-sm transition hover:shadow-card-hover">
      {/* Vehicle Summary Header */}
      <div className="mb-5 pb-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className="grid h-10 w-10 shrink-0 place-items-center rounded-xl text-sm font-bold text-white shadow-sm ring-2 ring-white"
            style={{ background: color }}
          >
            V{route.vehicle_id}
          </div>
          <div>
            <div className="font-display text-base font-bold text-ink">
              Vehicle {route.vehicle_id} · <span className="font-normal text-ink-soft">{route.depot_name}</span>
            </div>
            <div className="text-xs text-ink-mute">
              Max Payload: <b className="text-ink-soft">{route.capacity_kg} kg</b> · Shift Active
            </div>
          </div>
        </div>

        {/* Quick Vehicle KPIs */}
        <div className="flex items-center gap-2 sm:gap-4 text-xs">
          <div className="rounded-lg bg-slate-50 px-2.5 py-1 text-center border border-slate-200/60">
            <span className="text-ink-mute block text-[10px] uppercase font-semibold">Distance</span>
            <span className="font-bold text-ink">{route.total_distance_km} km</span>
          </div>
          <div className="rounded-lg bg-slate-50 px-2.5 py-1 text-center border border-slate-200/60">
            <span className="text-ink-mute block text-[10px] uppercase font-semibold">Duration</span>
            <span className="font-bold text-ink">{Math.round(route.total_time_min)} min</span>
          </div>
          <div className="rounded-lg bg-slate-50 px-2.5 py-1 text-center border border-slate-200/60">
            <span className="text-ink-mute block text-[10px] uppercase font-semibold">Peak Load</span>
            <span className="font-bold text-leaf-800">{route.capacity_utilization_percent}%</span>
          </div>
        </div>
      </div>

      {/* Capacity Utilization Progress Bar */}
      <div className="mb-5">
        <div className="flex items-center justify-between text-xs mb-1">
          <span className="text-ink-mute font-medium">Capacity Utilization</span>
          <span className="font-bold text-ink">{route.max_load_kg || 0} / {route.capacity_kg} kg</span>
        </div>
        <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
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
      <ol className="relative ml-4 border-l-2 pl-6 space-y-4" style={{ borderColor: `${color}40` }}>
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
              : `Return & Park at ${s.name}`
            : isPickup
              ? `Pick up surplus from ${s.donor_name}`
              : `Deliver food to ${s.receiver_name}`

          return (
            <li key={i} className="relative group">
              {/* Node Icon on Timeline */}
              <span
                className="absolute -left-[2.15rem] grid h-7 w-7 place-items-center rounded-full border-2 bg-white shadow-sm transition group-hover:scale-110"
                style={{ borderColor: color }}
              >
                <Icon className="h-3.5 w-3.5" style={{ color }} />
              </span>

              {/* Stop Card */}
              <div
                className={`rounded-xl border p-3 text-xs sm:text-sm transition ${isDepot
                    ? 'border-slate-200 bg-slate-50/60'
                    : isPickup
                      ? 'border-emerald-200 bg-emerald-50/30'
                      : 'border-blue-200 bg-blue-50/30'
                  }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-1">
                  <span className="font-bold text-ink">{title}</span>
                  <span className="text-xs font-semibold text-ink-soft bg-white/80 px-2 py-0.5 rounded-md border border-slate-200/50">
                    {s.arrive ? `Arrive ${s.arrive}` : ''}
                    {s.arrive && s.depart ? ' · ' : ''}
                    {s.depart ? `Depart ${s.depart}` : ''}
                  </span>
                </div>

                {!isDepot && (
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                    <span
                      className={`font-bold px-2 py-0.5 rounded-md ${isPickup ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                        }`}
                    >
                      {isPickup ? `+${s.kg} kg collected` : `-${s.kg} kg dropped`}
                    </span>
                    <span className="text-ink-soft">On-board: {s.cum_load_kg} kg</span>

                    {String(s.task_id || '').includes('_') && (
                      <span className="inline-flex items-center gap-1 rounded-md bg-amber-100 px-1.5 py-0.5 font-bold text-amber-800 text-[11px]">
                        <Split className="h-3 w-3" /> Split Lot
                      </span>
                    )}

                    {isDelivery && mins != null && !warn && (
                      <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 font-semibold ml-auto">
                        <CheckCircle2 className="h-3 w-3" /> Delivered {mins}m before expiry
                      </span>
                    )}
                  </div>
                )}

                {warn && !compact && (
                  <div className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-rose-100/80 px-2.5 py-1 text-xs font-bold text-rose-800">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    <span>
                      {mins <= 0 ? '⚠️ Arrives after expiration time' : `⚠️ Tight window: Only ${mins} min until food expires`}
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
