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
  { v: 1, t: 'Low', d: 'Can wait 24h+', color: 'border-emerald-300 bg-emerald-50 text-emerald-800' },
  { v: 2, t: 'Mild', d: 'Few hours slack', color: 'border-emerald-300 bg-emerald-50 text-emerald-800' },
  { v: 3, t: 'Medium', d: 'Needed today', color: 'border-amber-300 bg-amber-50 text-amber-800' },
  { v: 4, t: 'High', d: 'Impending gap', color: 'border-rose-300 bg-rose-50 text-rose-800' },
  { v: 5, t: 'Critical', d: 'Going hungry now', color: 'border-rose-400 bg-rose-100 text-rose-900 ring-2 ring-rose-400' },
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
      toast('Surplus food registered! It will be scored for priority immediately.')
      nav('/donor')
    } catch (x) {
      toast(x.message, 'error')
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit} className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        title="Register Food Surplus"
        subtitle="Help food reach someone hungry before it spoils. Batches expiring sooner are dispatched first."
        badge={
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800 border border-emerald-200">
            <Package className="h-3.5 w-3.5 text-emerald-700" /> New Surplus Intake
          </span>
        }
        actions={
          <Link to="/donor" className="btn-ghost">
            Cancel
          </Link>
        }
      />

      {/* SECTION 1: Donor & Food Type */}
      <div className="card p-6 space-y-5">
        <div className="border-b border-slate-100 pb-3">
          <h2 className="font-display text-base font-bold text-ink">1. Organization & Food Category</h2>
          <p className="text-xs text-ink-soft">Identify the food surplus to assign accurate shelf-life defaults.</p>
        </div>

        <Field label="Donor Organization or Venue" error={err.donor_name} required>
          <input
            className="input"
            placeholder="e.g. Green Leaf Restaurant or Grand Ballroom Catering"
            value={f.donor_name}
            onChange={(e) => set('donor_name', e.target.value)}
          />
        </Field>

        <div>
          <span className="label">Food Category</span>
          <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
            {FOOD_TYPES.map((o) => {
              const active = f.food_type === o.t
              return (
                <button
                  type="button"
                  key={o.t}
                  onClick={() => pickType(o)}
                  aria-pressed={active}
                  className={`rounded-xl border p-3 text-left transition ${
                    active
                      ? 'border-leaf-600 bg-leaf-50/80 shadow-sm ring-1 ring-leaf-500'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{o.emoji}</span>
                    <b className="text-xs font-bold text-ink">{o.t}</b>
                  </div>
                  <p className="mt-1 text-[11px] text-ink-soft line-clamp-2">{o.desc}</p>
                  <div className="mt-2 text-[10px] font-bold uppercase tracking-wider text-leaf-800">
                    Typical shelf: ~{o.hours}h
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        <Field
          label="Total Quantity (kg)"
          error={err.quantity_kg}
          hint={f.quantity_kg ? `≈ ${Math.round(f.quantity_kg * 2.5)} meals enabled` : 'Roughly 2.5 meals per kilogram'}
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

      {/* SECTION 2: Timing & Deadlines */}
      <div className="card p-6 space-y-5">
        <div className="border-b border-slate-100 pb-3">
          <h2 className="font-display text-base font-bold text-ink">2. Critical Timing & Pickup Window</h2>
          <p className="text-xs text-ink-soft">Food safety requires pickup and delivery before the expiry cutoff.</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Food Ready From">
            <input
              className="input"
              type="datetime-local"
              value={f.ready_time}
              onChange={(e) => set('ready_time', e.target.value)}
            />
          </Field>
          <Field label="Strict Expiry Cutoff (Safe Until)" error={err.expiry_time} required>
            <input
              className="input"
              type="datetime-local"
              value={f.expiry_time}
              onChange={(e) => set('expiry_time', e.target.value)}
            />
          </Field>
          <Field label="Staff on-site for Handover From">
            <input
              className="input"
              type="time"
              value={f.pw_start}
              onChange={(e) => set('pw_start', e.target.value)}
            />
          </Field>
          <Field label="…Until Staff Leaves" error={err.pw_end} required>
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
      <div className="card p-6 space-y-4">
        <div className="border-b border-slate-100 pb-3">
          <h2 className="font-display text-base font-bold text-ink">3. Pickup Location</h2>
          <p className="text-xs text-ink-soft">Drop a pin or choose a landmark for driver navigation.</p>
        </div>

        <LocationPicker value={f.location} onChange={(p) => set('location', p)} />
        {err.location && <p className="text-xs font-semibold text-urgent">{err.location}</p>}
      </div>

      {/* Submission CTA */}
      <Button type="submit" loading={busy} className="btn-primary w-full !py-3.5 text-base shadow-md hover:shadow-lg">
        Submit Food Surplus for Urgent Rescue
      </Button>
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
      toast('Request submitted! High-urgency shelters are prioritized first.')
      nav('/receiver')
    } catch (x) {
      toast(x.message, 'error')
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit} className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        title="Request Food Rations"
        subtitle="Let food rescue coordinators know your hunger severity, batch requirements, and operating hours."
        badge={
          <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-800 border border-blue-200">
            <HeartHandshake className="h-3.5 w-3.5 text-blue-700" /> Beneficiary Request Intake
          </span>
        }
        actions={
          <Link to="/receiver" className="btn-ghost">
            Cancel
          </Link>
        }
      />

      {/* SECTION 1: Organization & Hunger Severity */}
      <div className="card p-6 space-y-5">
        <div className="border-b border-slate-100 pb-3">
          <h2 className="font-display text-base font-bold text-ink">1. Recipient Organization & Hunger Priority</h2>
          <p className="text-xs text-ink-soft">SmartFeed matches higher need levels ahead of flexible requests.</p>
        </div>

        <Field label="Shelter / Kitchen / Beneficiary Name" error={err.receiver_name} required>
          <input
            className="input"
            placeholder="e.g. Hope Night Shelter or Seva Community Kitchen"
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
            placeholder="e.g. 60"
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
                  className={`cursor-pointer rounded-xl border-2 p-2.5 text-center transition ${
                    active
                      ? `${n.color} shadow-sm font-bold`
                      : 'border-slate-200 bg-white hover:bg-slate-50 text-ink'
                  }`}
                >
                  <input
                    type="radio"
                    name="need"
                    className="sr-only"
                    checked={active}
                    onChange={() => set('need_level', n.v)}
                  />
                  <span className="block font-display text-xl font-bold">{n.v}</span>
                  <span className="block text-xs font-bold leading-tight">{n.t}</span>
                  <span className="hidden text-[10px] text-ink-soft sm:block mt-0.5">{n.d}</span>
                </label>
              )
            })}
          </div>
        </div>
      </div>

      {/* SECTION 2: Receiving Hours */}
      <div className="card p-6 space-y-4">
        <div className="border-b border-slate-100 pb-3">
          <h2 className="font-display text-base font-bold text-ink">2. Receiving Time Window</h2>
          <p className="text-xs text-ink-soft">When will volunteers or staff be ready to unload the vehicle?</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Volunteers Ready From">
            <input
              className="input"
              type="time"
              value={f.dw_start}
              onChange={(e) => set('dw_start', e.target.value)}
            />
          </Field>
          <Field label="…Until (Receiving Closes)" error={err.dw_end} required>
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
      <div className="card p-6 space-y-4">
        <div className="border-b border-slate-100 pb-3">
          <h2 className="font-display text-base font-bold text-ink">3. Drop-off Location</h2>
          <p className="text-xs text-ink-soft">Place the pin directly on the delivery gate or entrance.</p>
        </div>

        <LocationPicker value={f.location} onChange={(p) => set('location', p)} />
        {err.location && <p className="text-xs font-semibold text-urgent">{err.location}</p>}
      </div>

      <Button type="submit" loading={busy} className="btn-primary w-full !py-3.5 text-base shadow-md hover:shadow-lg">
        Submit Food Request
      </Button>
    </form>
  )
}
