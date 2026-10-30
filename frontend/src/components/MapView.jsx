import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { BLR, colorForVehicle, urgencyLevel } from '../lib/utils'

const pin = (bg, glyph, size = 28) => L.divIcon({
  className: '', iconSize: [size, size], iconAnchor: [size / 2, size / 2],
  html: `<div class="fr-pin" style="width:${size}px;height:${size}px;background:${bg}">${glyph}</div>`,
})

export const routePath = (r) => {
  const t = r.detailed_timeline
  if (t?.length) return t.filter((s) => s.location).map((s) => [s.location.lat, s.location.lng])
  const pts = (r.stops || []).filter((s) => s.location).map((s) => [s.location.lat, s.location.lng])
  const dl = r.depot_location ? [[r.depot_location.lat, r.depot_location.lng]] : []
  return [...dl, ...pts, ...dl]
}

/** Map of depots, donors, receivers and vehicle routes. Marker colour follows urgency when scores are supplied. */
export default function MapView({ depots = [], donations = [], requests = [], routes = [], scores = {}, focusVehicle = null, height = 460, onSelect }) {
  const el = useRef(null), map = useRef(null), layer = useRef(null), fitted = useRef(false)

  useEffect(() => {
    map.current = L.map(el.current, { zoomControl: true, scrollWheelZoom: false }).setView([BLR.lat, BLR.lng], 11)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '© OpenStreetMap contributors', maxZoom: 19 }).addTo(map.current)
    layer.current = L.layerGroup().addTo(map.current)
    return () => { map.current.remove(); map.current = null; fitted.current = false }
  }, [])

  useEffect(() => {
    if (!map.current) return
    layer.current.clearLayers()
    const pts = []
    const add = (m, lat, lng) => { m.addTo(layer.current); pts.push([lat, lng]) }

    routes.forEach((r) => {
      const dim = focusVehicle && focusVehicle !== r.vehicle_id
      const path = routePath(r)
      if (path.length > 1) L.polyline(path, { color: colorForVehicle(r.vehicle_id), weight: dim ? 2 : 5, opacity: dim ? 0.25 : 0.85, dashArray: dim ? '4 6' : null })
        .bindTooltip(`Vehicle ${r.vehicle_id} · ${r.total_distance_km} km`, { sticky: true }).addTo(layer.current)
    })
    depots.forEach((d) => add(L.marker([d.location.lat, d.location.lng], { icon: pin('#1d2a22', '🏭', 32) }).bindTooltip(`<b>${d.name}</b><br/>Depot`).on('click', () => onSelect?.({ kind: 'depot', item: d })), d.location.lat, d.location.lng))
    donations.forEach((d) => {
      const s = scores.donations?.[d.id]
      add(L.marker([d.location.lat, d.location.lng], { icon: pin(s != null ? urgencyLevel(s).hex : '#3a9156', '🍲') })
        .bindTooltip(`<b>${d.donor_name}</b><br/>${d.food_type} · ${d.remaining_kg ?? d.quantity_kg} kg<br/>Pickup ${d.pickup_window.start}–${d.pickup_window.end}`)
        .on('click', () => onSelect?.({ kind: 'donation', item: d })), d.location.lat, d.location.lng)
    })
    requests.forEach((q) => {
      const s = scores.requests?.[q.id]
      add(L.marker([q.location.lat, q.location.lng], { icon: pin(s != null ? urgencyLevel(s).hex : '#2563eb', '🏠') })
        .bindTooltip(`<b>${q.receiver_name}</b><br/>Needs ${q.remaining_kg ?? q.quantity_kg} kg · level ${q.need_level}/5<br/>Delivery ${q.delivery_window.start}–${q.delivery_window.end}`)
        .on('click', () => onSelect?.({ kind: 'request', item: q })), q.location.lat, q.location.lng)
    })
    if (pts.length && !fitted.current) { map.current.fitBounds(pts, { padding: [30, 30] }); fitted.current = true }
  }, [depots, donations, requests, routes, scores, focusVehicle, onSelect])

  return (
    <div className="relative">
      <div ref={el} style={{ height }} className="w-full overflow-hidden rounded-2xl border border-black/10" role="application" aria-label="Map of depots, donors, receivers and routes" />
      <div className="pointer-events-none absolute bottom-3 left-3 z-[500] flex flex-wrap gap-x-3 gap-y-1 rounded-xl bg-white/90 px-3 py-2 text-xs shadow">
        <span>🏭 Depot</span><span>🍲 Donor</span><span>🏠 Receiver</span>
        <span className="text-urgent">● urgent</span><span className="text-soon">● soon</span><span className="text-safe">● safe</span>
      </div>
    </div>
  )
}
