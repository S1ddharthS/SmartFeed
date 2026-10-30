import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AlertCircle, Clock, HeartHandshake, MapPin, Package, Sparkles, Utensils } from 'lucide-react'
import { api } from '../api/client'
import { rememberMine, useApp } from '../context/AppContext'
import { Button, Field, PageHeader } from '../components/ui'
import LocationPicker from '../components/LocationPicker'
import { fmtKg, fromMin, toLocalInput, toMin } from '../lib/utils'

const FOOD_TYPES = [
  { t: 'Cooked meals', hours: 4, emoji: '🍛', desc: 'Prepared hot food (curries, rice, rotis)' },
  { t: 'Buffet / banquet surplus', hours: 4, emoji: '🍽️', desc: 'Hotel or wedding banquet spreads' },
  { t: 'Bread & pastries', hours: 12, emoji: '🥐', desc: 'Bakery batches, sandwiches, loafs' },
  { t: 'Fresh produce & fruits', hours: 36, emoji: '🍎', desc: 'Raw vegetables, greens, seasonal fruits' },
  { t: 'Packed / dry food', hours: 72, emoji: '📦', desc: 'Sealed provisions, dry grains, canned rations' },
]

const NEED = [
  { v: 1, t: 'Low', d: 'Flexible 24h+', color: 'border-brand-200 bg-brand-50 text-brand-700' },
  { v: 2, t: 'Mild', d: 'Few hours slack', color: 'border-brand-200 bg-brand-50 text-brand-700' },
  { v: 3, t: 'Medium', d: 'Needed today', color: 'border-warning-border bg-warning-soft text-warning' },
  { v: 4, t: 'High', d: 'Impending gap', color: 'border-urgent-border bg-urgent-soft text-urgent' },
  { v: 5, t: 'Critical', d: 'Immediate hunger', color: 'border-urgent bg-urgent-soft text-urgent ring-1 ring-urgent' },
]

const round15 = (ms) => new Date(Math.ceil(ms / 9e5) * 9e5)

export function DonateForm() {
  const { user, nowMs, toast } = useApp()
  const nav = useNavigate()
  const start = useMemo(() => round15(nowMs), []) // eslint-disable-line

  const [f, setF] = useState({
    donor_name: '',
    food_type: FOOD_TYPES[0].t,
    quantity_kg: '',
    location: null,
    ready_time: toLocalInput(start),
    expiry_time: toLocalInput(new Date(start.getTime() + 4 * 3.6e6)),
    pw_start: fromMin(start.getHours() * 60 + start.getMinutes()),
    pw_end: fromMin(Math.min(1439, start.getHours() * 60 + start.getMinutes() + 150)),
  })

  const [err, setErr] = useState({})
  const [busy, setBusy] = useState(false)

  const set = (k, v) => setF((s) => ({ ...s, [k]: v }))

  const pickType = (o) =>
    setF((s) => ({
      ...s,
      food_type: o.t,
      expiry_time: toLocalInput(new Date(new Date(s.ready_time).getTime() + o.hours * 3.6e6)),
    }))

  const validate = () => {
    const e = {}
    if (!f.donor_name.trim()) e.donor_name = 'Please provide the donor or venue name'
    if (!(Number(f.quantity_kg) > 0)) e.quantity_kg = 'Enter a valid quantity in kg'
    if (!f.location) e.location = 'Please select a pickup location on the map'
    if (new Date(f.expiry_time) <= new Date(f.ready_time))
      e.expiry_time = 'Expiry timestamp must be later than the ready time'
    if (toMin(f.pw_end) <= toMin(f.pw_start)) e.pw_end = 'Pickup window end time must be after the start time'
    setErr(e)
    return !Object.keys(e).length
  }

  const submit = async (ev) => {
    ev.preventDefault()
    if (!validate()) return
    setBusy(true)
    try {
      const row = await api.createDonation({
        donor_name: f.donor_name.trim(),
        food_type: f.food_type,
        quantity_kg: Number(f.quantity_kg),
        location: f.location,
        ready_time: `${f.ready_time}:00`,
        expiry_time: `${f.expiry_time}:00`,
        pickup_window: { start: f.pw_start, end: f.pw_end },
        ...(user ? { owner: user.username } : {}),
      })
      rememberMine('donations', user, row.id)
      toast('Food donation registered! Scored for priority immediately.')
      nav('/donor')
    } catch (x) {
      toast(x.message, 'error')
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit} className="mx-auto max-w-2xl space-y-5 animate-fade-in">
      <PageHeader
        title="Donate Food Surplus"
        subtitle="List available meals for dispatch. Items expiring sooner are prioritized by the routing engine."
        badge={
          <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 border border-brand-100 px-2.5 py-0.5 text-xs font-semibold text-brand-700">
            <Package className="h-3 w-3 text-brand-500" /> Donation Intake
          </span>
        }
        actions={
          <Link to="/donor" className="btn-secondary !py-1.5 !px-3 text-xs">
            Cancel
          </Link>
        }
      />

      {/* SECTION 1: Organization & Category */}
      <div className="card p-5 sm:p-6 space-y-4">
        <div className="border-b border-line pb-3">
          <h2 className="text-sm font-semibold text-ink">1. Organization & Food Category</h2>
          <p className="text-xs text-ink-soft">Categorize surplus to apply safe perishability timelines.</p>
        </div>

        <Field label="Donor Organization or Venue" error={err.donor_name} required>
          <input
            className="input"
            placeholder="e.g. Green Leaf Cafe or Grand Banquet Hall"
            value={f.donor_name}
            onChange={(e) => set('donor_name', e.target.value)}
          />
        </Field>

        <div>
          <span className="label">Food Category</span>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {FOOD_TYPES.map((o) => {
              const active = f.food_type === o.t
              return (
                <button
                  type="button"
                  key={o.t}
                  onClick={() => pickType(o)}
                  aria-pressed={active}
                  className={`rounded-lg border p-3 text-left transition-all ${
                    active
                      ? 'border-brand-500 bg-brand-50/50 shadow-sm'
                      : 'border-line bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{o.emoji}</span>
                    <span className="text-xs font-semibold text-ink">{o.t}</span>
                  </div>
                  <p className="mt-1 text-[11px] text-ink-soft leading-snug">{o.desc}</p>
                  <div className="mt-2 text-[10px] font-medium uppercase tracking-wider text-brand-700">
                    Shelf life: ~{o.hours}h
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        <Field
          label="Total Quantity (kg)"
          error={err.quantity_kg}
          hint={f.quantity_kg ? `≈ ${Math.round(f.quantity_kg * 2.5)} meals` : 'Estimated at ~2.5 meals per kg'}
          required
        >
          <input
            className="input"
            type="number"
            min="1"
            step="0.5"
            placeholder="e.g. 45"
            inputMode="decimal"
            value={f.quantity_kg}
            onChange={(e) => set('quantity_kg', e.target.value)}
          />
        </Field>
      </div>

      {/* SECTION 2: Expiry & Windows */}
      <div className="card p-5 sm:p-6 space-y-4">
        <div className="border-b border-line pb-3">
          <h2 className="text-sm font-semibold text-ink">2. Food Safety & Pickup Window</h2>
          <p className="text-xs text-ink-soft">The routing engine ensures pickup and arrival occur before safe expiration.</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Food Ready At" required>
            <input
              className="input"
              type="datetime-local"
              value={f.ready_time}
              onChange={(e) => set('ready_time', e.target.value)}
            />
          </Field>
          <Field label="Safe Until (Expiry)" error={err.expiry_time} required>
            <input
              className="input"
              type="datetime-local"
              value={f.expiry_time}
              onChange={(e) => set('expiry_time', e.target.value)}
            />
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Pickup Window Start">
            <input
              className="input"
              type="time"
              value={f.pw_start}
              onChange={(e) => set('pw_start', e.target.value)}
            />
          </Field>
          <Field label="Pickup Window End" error={err.pw_end} required>
            <input
              className="input"
              type="time"
              value={f.pw_end}
              onChange={(e) => set('pw_end', e.target.value)}
            />
          </Field>
        </div>
      </div>

      {/* SECTION 3: Location */}
      <div className="card p-5 sm:p-6 space-y-3">
        <div className="border-b border-line pb-2.5">
          <h2 className="text-sm font-semibold text-ink">3. Pickup Location</h2>
          <p className="text-xs text-ink-soft">Place a pin on the map or select a Bangalore landmark.</p>
        </div>

        <LocationPicker value={f.location} onChange={(p) => set('location', p)} />
        {err.location && <p className="text-xs font-medium text-urgent">{err.location}</p>}
      </div>

      <div className="flex items-center justify-end gap-3 pt-2">
        <Link to="/donor" className="btn-secondary !py-2.5 !px-4">
          Cancel
        </Link>
        <Button type="submit" loading={busy} className="btn-primary !py-2.5 !px-5 text-sm">
          Donate Food
        </Button>
      </div>
    </form>
  )
}

export function RequestForm() {
  const { user, nowMs, toast } = useApp()
  const nav = useNavigate()
  const start = useMemo(() => round15(nowMs), []) // eslint-disable-line
  const sm = start.getHours() * 60 + start.getMinutes()

  const [f, setF] = useState({
    receiver_name: '',
    quantity_kg: '',
    location: null,
    dw_start: fromMin(sm),
    dw_end: fromMin(Math.min(1439, sm + 240)),
    need_level: 3,
  })

  const [err, setErr] = useState({})
  const [busy, setBusy] = useState(false)

  const set = (k, v) => setF((s) => ({ ...s, [k]: v }))

  const validate = () => {
    const e = {}
    if (!f.receiver_name.trim()) e.receiver_name = 'Please specify the shelter or beneficiary name'
    if (!(Number(f.quantity_kg) > 0)) e.quantity_kg = 'Enter how many kg you need'
    if (!f.location) e.location = 'Please set your delivery address on the map'
    if (toMin(f.dw_end) <= toMin(f.dw_start)) e.dw_end = 'Receiving window end must be after start'
    setErr(e)
    return !Object.keys(e).length
  }

  const submit = async (ev) => {
    ev.preventDefault()
    if (!validate()) return
    setBusy(true)
    try {
      const row = await api.createRequest({
        receiver_name: f.receiver_name.trim(),
        quantity_kg: Number(f.quantity_kg),
        location: f.location,
        delivery_window: { start: f.dw_start, end: f.dw_end },
        need_level: f.need_level,
        ...(user ? { owner: user.username } : {}),
      })
      rememberMine('requests', user, row.id)
      toast('Request submitted! Ranked by urgency in the dispatch pool.')
      nav('/receiver')
    } catch (x) {
      toast(x.message, 'error')
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit} className="mx-auto max-w-2xl space-y-5 animate-fade-in">
      <PageHeader
        title="Request Food Rations"
        subtitle="Indicate your shelter requirements, hunger urgency level, and staff availability."
        badge={
          <span className="inline-flex items-center gap-1.5 rounded-full bg-info-soft border border-info-border px-2.5 py-0.5 text-xs font-semibold text-info">
            <HeartHandshake className="h-3 w-3 text-info" /> Beneficiary Intake
          </span>
        }
        actions={
          <Link to="/receiver" className="btn-secondary !py-1.5 !px-3 text-xs">
            Cancel
          </Link>
        }
      />

      {/* SECTION 1: Organization & Urgency */}
      <div className="card p-5 sm:p-6 space-y-4">
        <div className="border-b border-line pb-3">
          <h2 className="text-sm font-semibold text-ink">1. Recipient Details & Hunger Severity</h2>
          <p className="text-xs text-ink-soft">SmartFeed prioritizes higher urgency scores before flexible requests.</p>
        </div>

        <Field label="Shelter / Kitchen / Beneficiary Name" error={err.receiver_name} required>
          <input
            className="input"
            placeholder="e.g. Hope Night Shelter or Community Food Bank"
            value={f.receiver_name}
            onChange={(e) => set('receiver_name', e.target.value)}
          />
        </Field>

        <Field label="Required Food Volume (kg)" error={err.quantity_kg} required>
          <input
            className="input"
            type="number"
            min="1"
            step="0.5"
            placeholder="e.g. 50"
            inputMode="decimal"
            value={f.quantity_kg}
            onChange={(e) => set('quantity_kg', e.target.value)}
          />
        </Field>

        <div>
          <span className="label">Hunger Urgency Level</span>
          <div className="grid grid-cols-5 gap-2">
            {NEED.map((n) => {
              const active = f.need_level === n.v
              return (
                <label
                  key={n.v}
                  className={`cursor-pointer rounded-lg border p-2 text-center transition-all ${
                    active
                      ? `${n.color} shadow-sm font-semibold`
                      : 'border-line bg-white hover:bg-slate-50 text-ink'
                  }`}
                >
                  <input
                    type="radio"
                    name="need"
                    className="sr-only"
                    checked={active}
                    onChange={() => set('need_level', n.v)}
                  />
                  <span className="block text-base font-bold">{n.v}</span>
                  <span className="block text-[11px] font-semibold leading-tight">{n.t}</span>
                  <span className="hidden text-[10px] text-ink-mute sm:block mt-0.5">{n.d}</span>
                </label>
              )
            })}
          </div>
        </div>
      </div>

      {/* SECTION 2: Receiving Hours */}
      <div className="card p-5 sm:p-6 space-y-4">
        <div className="border-b border-line pb-3">
          <h2 className="text-sm font-semibold text-ink">2. Delivery Time Window</h2>
          <p className="text-xs text-ink-soft">Specify hours when staff or volunteers are available to receive food.</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Ready For Delivery From">
            <input
              className="input"
              type="time"
              value={f.dw_start}
              onChange={(e) => set('dw_start', e.target.value)}
            />
          </Field>
          <Field label="Delivery Window Closes" error={err.dw_end} required>
            <input
              className="input"
              type="time"
              value={f.dw_end}
              onChange={(e) => set('dw_end', e.target.value)}
            />
          </Field>
        </div>
      </div>

      {/* SECTION 3: Address */}
      <div className="card p-5 sm:p-6 space-y-3">
        <div className="border-b border-line pb-2.5">
          <h2 className="text-sm font-semibold text-ink">3. Drop-off Location</h2>
          <p className="text-xs text-ink-soft">Select exact entrance or receiving gate coordinates.</p>
        </div>

        <LocationPicker value={f.location} onChange={(p) => set('location', p)} />
        {err.location && <p className="text-xs font-medium text-urgent">{err.location}</p>}
      </div>

      <div className="flex items-center justify-end gap-3 pt-2">
        <Link to="/receiver" className="btn-secondary !py-2.5 !px-4">
          Cancel
        </Link>
        <Button type="submit" loading={busy} className="btn-primary !py-2.5 !px-5 text-sm">
          Submit Food Request
        </Button>
      </div>
    </form>
  )
}
