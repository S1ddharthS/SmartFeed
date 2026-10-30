import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { BLR, colorForVehicle, urgencyLevel } from '../lib/utils'

const pin = (bg, glyph, size = 28) =>
  L.divIcon({
    className: '',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    html: `<div class="fr-pin shadow-sm" style="width:${size}px;height:${size}px;background:${bg}">${glyph}</div>`,
  })

export const routePath = (r) => {
  const t = r.detailed_timeline
  if (t?.length) return t.filter((s) => s.location).map((s) => [s.location.lat, s.location.lng])
  const pts = (r.stops || []).filter((s) => s.location).map((s) => [s.location.lat, s.location.lng])
  const dl = r.depot_location ? [[r.depot_location.lat, r.depot_location.lng]] : []
  return [...dl, ...pts, ...dl]
}

/** Map of depots, donors, receivers and vehicle routes. Marker colour follows urgency when scores are supplied. */
export default function MapView({
  depots = [],
  donations = [],
  requests = [],
  routes = [],
  scores = {},
  focusVehicle = null,
  height = 460,
  onSelect,
}) {
  const el = useRef(null)
  const map = useRef(null)
  const layer = useRef(null)
  const fitted = useRef(false)

  useEffect(() => {
    map.current = L.map(el.current, { zoomControl: true, scrollWheelZoom: false }).setView(
      [BLR.lat, BLR.lng],
      11
    )
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map.current)
    layer.current = L.layerGroup().addTo(map.current)
    return () => {
      map.current?.remove()
      map.current = null
      fitted.current = false
    }
  }, [])

  useEffect(() => {
    if (!map.current) return
    layer.current.clearLayers()
    const pts = []
    const add = (m, lat, lng) => {
      m.addTo(layer.current)
      pts.push([lat, lng])
    }

    routes.forEach((r) => {
      const dim = focusVehicle && focusVehicle !== r.vehicle_id
      const path = routePath(r)
      if (path.length > 1) {
        L.polyline(path, {
          color: colorForVehicle(r.vehicle_id),
          weight: dim ? 2 : 4,
          opacity: dim ? 0.3 : 0.9,
          dashArray: dim ? '4 6' : null,
        })
          .bindTooltip(`Vehicle ${r.vehicle_id} · ${r.total_distance_km} km`, { sticky: true })
          .addTo(layer.current)
      }
    })

    depots.forEach((d) =>
      add(
        L.marker([d.location.lat, d.location.lng], { icon: pin('#1E293B', '🏭', 30) })
          .bindTooltip(`<b>${d.name}</b><br/>Depot Hub`)
          .on('click', () => onSelect?.({ kind: 'depot', item: d })),
        d.location.lat,
        d.location.lng
      )
    )

    donations.forEach((d) => {
      const s = scores.donations?.[d.id]
      add(
        L.marker([d.location.lat, d.location.lng], {
          icon: pin(s != null ? urgencyLevel(s).hex : '#16A36A', '🍲', 28),
        })
          .bindTooltip(
            `<b>${d.donor_name}</b><br/>${d.food_type} · ${d.remaining_kg ?? d.quantity_kg} kg<br/>Pickup ${d.pickup_window.start}–${d.pickup_window.end}`
          )
          .on('click', () => onSelect?.({ kind: 'donation', item: d })),
        d.location.lat,
        d.location.lng
      )
    })

    requests.forEach((q) => {
      const s = scores.requests?.[q.id]
      add(
        L.marker([q.location.lat, q.location.lng], {
          icon: pin(s != null ? urgencyLevel(s).hex : '#3984D6', '🏠', 28),
        })
          .bindTooltip(
            `<b>${q.receiver_name}</b><br/>Needs ${q.remaining_kg ?? q.quantity_kg} kg · Level ${q.need_level}/5<br/>Delivery ${q.delivery_window.start}–${q.delivery_window.end}`
          )
          .on('click', () => onSelect?.({ kind: 'request', item: q })),
        q.location.lat,
        q.location.lng
      )
    })

    if (pts.length && !fitted.current) {
      map.current.fitBounds(pts, { padding: [36, 36] })
      fitted.current = true
    }
  }, [depots, donations, requests, routes, scores, focusVehicle, onSelect])

  return (
    <div className="relative">
      <div
        ref={el}
        style={{ height }}
        className="w-full overflow-hidden rounded-xl border border-line shadow-card"
        role="application"
        aria-label="Map of depots, donors, receivers and routes"
      />
      <div className="pointer-events-none absolute bottom-3 left-3 z-[500] flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg border border-line bg-white/95 px-3 py-1.5 text-xs text-ink-soft shadow-card backdrop-blur-sm">
        <span className="font-semibold text-ink">Map Key:</span>
        <span className="flex items-center gap-1">🏭 Depot</span>
        <span className="flex items-center gap-1">🍲 Donor</span>
        <span className="flex items-center gap-1">🏠 Shelter</span>
        <span className="h-3 w-px bg-line mx-1" />
        <span className="flex items-center gap-1 text-urgent font-medium">● High Urgency</span>
        <span className="flex items-center gap-1 text-warning font-medium">● Moderate</span>
        <span className="flex items-center gap-1 text-brand-600 font-medium">● Stable</span>
      </div>
    </div>
  )
}
