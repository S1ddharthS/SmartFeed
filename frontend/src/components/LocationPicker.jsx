import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { CheckCircle2, LocateFixed, MapPin } from 'lucide-react'
import { BLR } from '../lib/utils'

const PRESETS = [
  { name: 'Central (MG Road)', lat: 12.9756, lng: 77.6066 },
  { name: 'Koramangala', lat: 12.9352, lng: 77.6245 },
  { name: 'Indiranagar', lat: 12.9784, lng: 77.6408 },
  { name: 'Hebbal (North)', lat: 13.0358, lng: 77.597 },
  { name: 'Whitefield (East)', lat: 12.9698, lng: 77.75 },
]

export default function LocationPicker({ value, onChange }) {
  const el = useRef(null)
  const map = useRef(null)
  const marker = useRef(null)

  const place = (lat, lng, pan = false) => {
    if (!marker.current) {
      marker.current = L.marker([lat, lng], { draggable: true }).addTo(map.current)
      marker.current.on('dragend', () => {
        const p = marker.current.getLatLng()
        onChange({ lat: +p.lat.toFixed(5), lng: +p.lng.toFixed(5) })
      })
    } else {
      marker.current.setLatLng([lat, lng])
    }
    if (pan) map.current.setView([lat, lng], 14)
  }

  useEffect(() => {
    const start = value || BLR
    map.current = L.map(el.current, { scrollWheelZoom: false }).setView(
      [start.lat, start.lng],
      value ? 14 : 11
    )
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
    }).addTo(map.current)

    L.Icon.Default.prototype.options.imagePath = 'https://unpkg.com/leaflet@1.9.4/dist/images/'
    L.Icon.Default.mergeOptions({
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    })

    if (value) place(value.lat, value.lng)

    map.current.on('click', (e) => {
      const p = { lat: +e.latlng.lat.toFixed(5), lng: +e.latlng.lng.toFixed(5) }
      place(p.lat, p.lng)
      onChange(p)
    })

    return () => {
      map.current?.remove()
      marker.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (value && map.current) place(value.lat, value.lng)
  }, [value]) // eslint-disable-line

  const locate = () =>
    navigator.geolocation?.getCurrentPosition((pos) => {
      const p = { lat: +pos.coords.latitude.toFixed(5), lng: +pos.coords.longitude.toFixed(5) }
      place(p.lat, p.lng, true)
      onChange(p)
    })

  return (
    <div className="space-y-2.5">
      {/* Quick Bangalore Landmark Presets */}
      <div className="flex flex-wrap items-center gap-1.5 text-xs">
        <span className="text-ink-soft font-medium flex items-center gap-1 mr-1">
          <MapPin className="h-3 w-3 text-brand-600" /> Quick preset:
        </span>
        {PRESETS.map((pr) => {
          const isSelected =
            value &&
            Math.abs(value.lat - pr.lat) < 0.001 &&
            Math.abs(value.lng - pr.lng) < 0.001
          return (
            <button
              key={pr.name}
              type="button"
              className={`rounded-lg border px-2.5 py-1 text-xs font-medium transition-all ${
                isSelected
                  ? 'border-brand-500 bg-brand-50 text-brand-700 font-semibold shadow-xs'
                  : 'border-line bg-surface text-ink hover:border-slate-300 hover:bg-slate-50'
              }`}
              onClick={() => {
                place(pr.lat, pr.lng, true)
                onChange({ lat: pr.lat, lng: pr.lng })
              }}
            >
              {pr.name}
            </button>
          )
        })}
      </div>

      {/* Map Container */}
      <div
        ref={el}
        className="h-60 w-full overflow-hidden rounded-xl border border-line shadow-card"
        role="application"
        aria-label="Click the map to set the pickup or delivery coordinates"
      />

      {/* Footer bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-ink-soft">
        <span className="font-medium flex items-center gap-1.5">
          {value ? (
            <span className="text-brand-700 font-medium inline-flex items-center gap-1">
              <CheckCircle2 className="h-3.5 w-3.5 text-brand-600" />
              Pin placed at {value.lat}, {value.lng} (drag to adjust)
            </span>
          ) : (
            'Click on the map or drag the pin to set GPS coordinates'
          )}
        </span>
        <button
          type="button"
          className="btn-secondary !px-2.5 !py-1 text-xs"
          onClick={locate}
        >
          <LocateFixed className="h-3.5 w-3.5 text-ink-soft" />
          <span>My Location</span>
        </button>
      </div>
    </div>
  )
}
