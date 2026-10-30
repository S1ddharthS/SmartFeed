// In-browser stand-in for the FastAPI backend. Mirrors docs/api-contract.md
// (scoring: PROJECT_PLAN 5.2, greedy split matching: 5.3, multi-depot insertion routing: 6.3).
import { clamp, toMin, fromMin } from '../lib/utils'

export const DEMO_DAY = '2026-11-05'
export const DEMO_DAY_MS = new Date(`${DEMO_DAY}T00:00:00`).getTime()
const iso = (hhmm) => `${DEMO_DAY}T${hhmm}:00`
const W = { dExp: 0.6, dQty: 0.3, dWin: 0.1, rNeed: 0.5, rWin: 0.3, rWait: 0.2, shelf: 24, refKg: 100, maxWait: 12 }

function d(id, donor_name, food_type, kg, lat, lng, ready, expiry, ps, pe, owner) {
  return { id, donor_name, food_type, quantity_kg: kg, remaining_kg: kg, location: { lat, lng }, ready_time: iso(ready), expiry_time: iso(expiry), pickup_window: { start: ps, end: pe }, status: 'open', owner }
}
function r(id, receiver_name, kg, lat, lng, ds, de, need, waiting_h, owner) {
  return { id, receiver_name, quantity_kg: kg, remaining_kg: kg, location: { lat, lng }, delivery_window: { start: ds, end: de }, need_level: need, status: 'open', waiting_h, owner }
}
const seed = () => ({
  users: [
    { id: 1, username: 'admin', email: 'admin@foodroute.org', password: 'admin123', role: 'admin' },
    { id: 2, username: 'greenleaf', email: 'donations@greenleaf.com', password: 'donor123', role: 'donor' },
    { id: 3, username: 'hopeshelter', email: 'help@hopeshelter.org', password: 'receiver123', role: 'receiver' },
  ],
  depots: [
    { id: 1, name: 'North Hub (Hebbal)', location: { lat: 13.0358, lng: 77.597 } },
    { id: 2, name: 'Central Hub (MG Road)', location: { lat: 12.9756, lng: 77.6066 } },
    { id: 3, name: 'South Hub (Koramangala)', location: { lat: 12.9352, lng: 77.6245 } },
  ],
  vehicles: [
    { id: 1, depot_id: 1, capacity_kg: 120, available_from: '09:00', available_to: '21:00', is_active: true },
    { id: 2, depot_id: 1, capacity_kg: 80, available_from: '10:00', available_to: '20:00', is_active: true },
    { id: 3, depot_id: 2, capacity_kg: 150, available_from: '09:00', available_to: '22:00', is_active: true },
    { id: 4, depot_id: 2, capacity_kg: 100, available_from: '09:30', available_to: '21:30', is_active: true },
    { id: 5, depot_id: 3, capacity_kg: 100, available_from: '09:00', available_to: '21:00', is_active: true },
  ],
  donations: [
    d(1, 'Green Leaf Restaurant', 'Cooked meals', 40, 12.9716, 77.5946, '12:00', '15:30', '12:00', '14:30', 'greenleaf'),
    d(2, 'Royal Palace Banquet', 'Buffet surplus', 85, 13.0112, 77.5852, '14:30', '19:30', '14:30', '16:45'),
    d(3, 'City Bakers & Cafe', 'Bread and pastries', 30, 12.9345, 77.6101, '11:00', '22:00', '11:00', '15:00'),
    d(4, 'Spice Route Kitchen', 'Rice & curry packs', 60, 12.9812, 77.641, '13:30', '18:30', '13:30', '16:00'),
    d(5, 'Fresh Harvest Supermarket', 'Fresh produce & fruits', 110, 13.0421, 77.5912, '10:00', '23:30', '10:00', '17:00'),
    d(6, 'Saffron Dine Catering', 'South Indian thali', 45, 12.9116, 77.6012, '12:00', '15:00', '13:00', '14:30'),
    d(7, 'Campus Cafeteria – IISc', 'Cooked meals', 55, 13.0219, 77.5671, '13:00', '19:00', '13:00', '17:00'),
    d(8, 'Sweet Tooth Mithai', 'Sweets & snacks', 25, 12.9591, 77.6974, '12:00', '21:00', '12:00', '18:00'),
    d(9, 'Hotel Orchid Banquet', 'Wedding buffet', 95, 12.9279, 77.6271, '15:00', '20:30', '15:00', '18:00'),
    d(10, 'BigBasket Fulfilment Hub', 'Packed vegetables', 130, 12.8996, 77.6101, '09:00', '23:00', '09:00', '19:00'),
  ],
  requests: [
    r(1, 'Hope Night Shelter', 60, 12.9344, 77.6101, '14:00', '17:00', 5, 6, 'hopeshelter'),
    r(2, 'Sunrise Orphanage', 50, 13.0067, 77.5539, '15:00', '19:00', 5, 3),
    r(3, 'Golden Years Elder Care', 35, 12.9507, 77.5848, '13:00', '16:00', 4, 4),
    r(4, 'Seva Community Kitchen', 120, 12.9784, 77.6408, '16:00', '21:00', 3, 2),
    r(5, 'Asha Street Children Centre', 45, 12.9988, 77.6619, '14:00', '18:00', 4, 8),
    r(6, 'Karuna Migrant Camp', 90, 13.0452, 77.6204, '15:30', '20:00', 5, 1),
    r(7, 'Sai Anna Daan Trust', 70, 12.9252, 77.5938, '15:00', '21:00', 3, 5),
    r(8, 'Mercy Home for Women', 40, 12.9165, 77.6234, '14:30', '19:30', 4, 2),
    r(9, 'St. Joseph Hostel', 55, 13.0285, 77.5408, '16:00', '20:30', 2, 3),
    r(10, 'Light of Hope Slum Clinic', 65, 12.9689, 77.7499, '15:00', '20:00', 4, 7),
  ],
  matches: [],
  batch: null,
  unmatched: [],
  routing: null,
})

const KEY = 'smartfeed_mock_v2'
let db
try { db = JSON.parse(localStorage.getItem(KEY)) } catch { db = null }
if (!db) db = seed()
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(db)) } catch { /* ignore */ } }
const delay = (v) => new Promise((res) => setTimeout(() => res(structuredClone(v)), 220))
const nextId = (arr) => arr.reduce((m, x) => Math.max(m, x.id), 0) + 1
let clockMin = 13 * 60
export const setMockClock = (min) => { clockMin = min }

// ---------- geometry ----------
export const haversine = (a, b) => {
  const R = 6371, rad = (x) => (x * Math.PI) / 180
  const dLat = rad(b.lat - a.lat), dLng = rad(b.lng - a.lng)
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(h)) * 1.25 // 1.25 road-detour factor
}
const SPEED = 30, SERVICE = 15
const travel = (a, b) => (haversine(a, b) / SPEED) * 60
const isoMin = (s) => (new Date(s).getTime() - DEMO_DAY_MS) / 6e4

// ---------- scoring ----------
export function scoreDonation(x, nowMin) {
  const left = (isoMin(x.expiry_time) - nowMin) / 60
  const win = (toMin(x.pickup_window.end) - toMin(x.pickup_window.start)) / 60
  const expiry_pressure = clamp(1 - left / W.shelf)
  const quantity_weight = clamp(x.quantity_kg / W.refKg)
  const pickup_window_tightness = clamp(1 - win / 24)
  const urgency_score = W.dExp * expiry_pressure + W.dQty * quantity_weight + W.dWin * pickup_window_tightness
  return { id: x.id, donor_name: x.donor_name, food_type: x.food_type, quantity_kg: x.quantity_kg, time_left_hours: +left.toFixed(2), expiry_pressure: +expiry_pressure.toFixed(4), quantity_weight: +quantity_weight.toFixed(4), pickup_window_tightness: +pickup_window_tightness.toFixed(4), urgency_score: +urgency_score.toFixed(4) }
}
export function scoreRequest(x) {
  const win = (toMin(x.delivery_window.end) - toMin(x.delivery_window.start)) / 60
  const need_level_norm = x.need_level / 5
  const window_tightness = clamp(1 - win / 24)
  const waiting_time_norm = clamp((x.waiting_h || 0) / W.maxWait)
  const urgency_score = W.rNeed * need_level_norm + W.rWin * window_tightness + W.rWait * waiting_time_norm
  return { id: x.id, receiver_name: x.receiver_name, quantity_kg: x.quantity_kg, need_level: x.need_level, need_level_norm: +need_level_norm.toFixed(4), window_tightness: +window_tightness.toFixed(4), waiting_time_norm: +waiting_time_norm.toFixed(4), urgency_score: +urgency_score.toFixed(4) }
}
const openD = () => db.donations.filter((x) => ['open', 'partially_matched'].includes(x.status) && x.remaining_kg > 0)
const openR = () => db.requests.filter((x) => ['open', 'partially_matched'].includes(x.status) && x.remaining_kg > 0)

// ---------- matching ----------
function feasibility(don, req, nowMin) {
  const km = haversine(don.location, req.location)
  const pickup = Math.max(nowMin, isoMin(don.ready_time), toMin(don.pickup_window.start))
  if (pickup > toMin(don.pickup_window.end)) return { f: 0, why: 'Pickup window already closed' }
  const arrive = Math.max(pickup + travel(don.location, req.location), toMin(req.delivery_window.start))
  if (arrive > isoMin(don.expiry_time)) return { f: 0, why: 'Food expires before it can be delivered' }
  if (arrive > toMin(req.delivery_window.end)) return { f: 0, why: 'Cannot reach receiver inside their delivery window' }
  return { f: Math.max(0.05, 1 - 0.005 * km), why: '' }
}
function runMatching(nowMin) {
  const t0 = performance.now()
  const D = openD().map((x) => ({ ...x, rem: x.remaining_kg, u: scoreDonation(x, nowMin).urgency_score }))
  const R = openR().map((x) => ({ ...x, rem: x.remaining_kg, u: scoreRequest(x).urgency_score }))
  const pairs = []
  for (const a of D) for (const b of R) {
    const { f } = feasibility(a, b, nowMin)
    if (f > 0) pairs.push({ a, b, p: a.u * b.u * f })
  }
  pairs.sort((x, y) => y.p - x.p)
  const matches = []
  for (const { a, b, p } of pairs) {
    const kg = Math.min(a.rem, b.rem)
    if (kg < 0.5) continue
    a.rem -= kg; b.rem -= kg
    matches.push({
      match_id: matches.length + 1, donation_id: a.id, request_id: b.id, donor_name: a.donor_name, receiver_name: b.receiver_name,
      food_type: a.food_type, allocated_kg: +kg.toFixed(1), priority_score: +p.toFixed(3),
      donation_location: a.location, request_location: b.location, ready_time: a.ready_time, expiry_time: a.expiry_time,
      pickup_window: a.pickup_window, delivery_window: b.delivery_window,
    })
  }
  const unmatched = []
  for (const a of D) if (a.rem > 0.5) {
    const reasons = R.map((b) => feasibility(a, b, nowMin))
    unmatched.push({ item_type: 'donation', item_id: a.id, item_name: a.donor_name, unallocated_kg: +a.rem.toFixed(1),
      reason: R.length === 0 ? 'No open requests' : reasons.every((q) => q.f === 0) ? reasons[0].why : 'No remaining demand for surplus quantity' })
  }
  for (const b of R) if (b.rem > 0.5) {
    const reasons = D.map((a) => feasibility(a, b, nowMin))
    unmatched.push({ item_type: 'request', item_id: b.id, item_name: b.receiver_name, unallocated_kg: +b.rem.toFixed(1),
      reason: D.length === 0 ? 'No open donations' : reasons.every((q) => q.f === 0) ? reasons[0].why : 'No remaining surplus that can arrive in time' })
  }
  for (const a of D) { const o = db.donations.find((x) => x.id === a.id); o.remaining_kg = +a.rem.toFixed(1); o.status = a.rem < 0.5 ? 'matched' : a.rem < a.quantity_kg ? 'partially_matched' : 'open' }
  for (const b of R) { const o = db.requests.find((x) => x.id === b.id); o.remaining_kg = +b.rem.toFixed(1); o.status = b.rem < 0.5 ? 'matched' : b.rem < b.quantity_kg ? 'partially_matched' : 'open' }
  const total = matches.reduce((s, m) => s + m.allocated_kg, 0)
  db.matches = matches; db.unmatched = unmatched
  db.batch = { batch_id: Math.random().toString(16).slice(2, 10), executed_at: new Date().toISOString(), execution_time_ms: +(performance.now() - t0).toFixed(1),
    total_donations_evaluated: D.length, total_requests_evaluated: R.length, total_allocated_kg: +total.toFixed(1), matches_count: matches.length, unmatched_count: unmatched.length }
  db.routing = null
  save()
  return { ...db.batch, matches, unmatched }
}

/** The "old way": first-come donor, nearest receiver, no expiry or window check. */
export function legacyMatching(nowMin) {
  const D = db.donations.map((x) => ({ ...x, rem: x.quantity_kg })).sort((a, b) => a.id - b.id)
  const R = db.requests.map((x) => ({ ...x, rem: x.quantity_kg }))
  const rows = []
  for (const a of D) while (a.rem > 0.5) {
    const cand = R.filter((b) => b.rem > 0.5).sort((x, y) => haversine(a.location, x.location) - haversine(a.location, y.location))[0]
    if (!cand) break
    const kg = Math.min(a.rem, cand.rem); a.rem -= kg; cand.rem -= kg
    const arrive = Math.max(nowMin, toMin(a.pickup_window.start)) + travel(a.location, cand.location)
    const late = arrive > isoMin(a.expiry_time) || arrive > toMin(cand.delivery_window.end)
    rows.push({ donor: a.donor_name, receiver: cand.receiver_name, need: cand.need_level, kg: +kg.toFixed(1), km: +haversine(a.location, cand.location).toFixed(1), arrive: fromMin(arrive), late })
  }
  const unserved = R.filter((b) => b.rem > 0.5).map((b) => ({ receiver: b.receiver_name, need: b.need_level, kg: +b.rem.toFixed(1) }))
  const wasted = rows.filter((x) => x.late).reduce((s, x) => s + x.kg, 0)
  const total = rows.reduce((s, x) => s + x.kg, 0)
  return { rows, unserved, wasted_kg: +wasted.toFixed(1), usable_kg: +(total - wasted).toFixed(1),
    high_need_missed: unserved.filter((x) => x.need >= 4).length + rows.filter((x) => x.late && x.need >= 4).length }
}

// ---------- routing ----------
function evaluate(stops, depot, veh) {
  let t = toMin(veh.available_from), load = 0, dist = 0, pos = depot, maxLoad = 0
  const out = []
  for (const s of stops) {
    const km = haversine(pos, s.location); dist += km
    let arr = t + (km / SPEED) * 60
    const win = s.type === 'pickup' ? s.pickup_window : s.delivery_window
    if (arr < toMin(win.start)) arr = toMin(win.start)
    if (arr > toMin(win.end)) return null
    if (s.type === 'delivery' && s.expiry_time && arr > isoMin(s.expiry_time)) return null
    load += s.type === 'pickup' ? s.kg : -s.kg
    if (load > veh.capacity_kg + 1e-6 || load < -1e-6) return null
    maxLoad = Math.max(maxLoad, load)
    t = arr + SERVICE; pos = s.location
    out.push({ ...s, arrive: fromMin(arr), depart: fromMin(t), cum_load_kg: +load.toFixed(1) })
  }
  const back = haversine(pos, depot); dist += back
  const ret = t + (back / SPEED) * 60
  if (ret > toMin(veh.available_to)) return null
  return { stops: out, dist, dur: ret - toMin(veh.available_from), ret, maxLoad }
}
function insertTask(routes, task) {
  let best = null
  for (const rt of routes) {
    const base = rt.stops.map(({ arrive, depart, cum_load_kg, ...s }) => s)
    for (let i = 0; i <= base.length; i++) for (let j = i; j <= base.length; j++) {
      const cand = [...base]; cand.splice(i, 0, task.pickup); cand.splice(j + 1, 0, task.delivery)
      const ev = evaluate(cand, rt.depot.location, rt.veh)
      if (!ev) continue
      const cost = ev.dist - rt.dist
      if (!best || cost < best.cost) best = { rt, ev, cost }
    }
  }
  if (!best) return false
  Object.assign(best.rt, { stops: best.ev.stops, dist: best.ev.dist, dur: best.ev.dur, maxLoad: best.ev.maxLoad, ret: best.ev.ret })
  return true
}
function mkTask({ m, kg, tid }) {
  return {
    pickup: { type: 'pickup', kg: +kg.toFixed(1), location: m.donation_location, donation_id: m.donation_id, donor_name: m.donor_name, pickup_window: m.pickup_window, task_id: tid, match_id: m.match_id },
    delivery: { type: 'delivery', kg: +kg.toFixed(1), location: m.request_location, request_id: m.request_id, receiver_name: m.receiver_name, delivery_window: m.delivery_window, expiry_time: m.expiry_time, task_id: tid, match_id: m.match_id },
  }
}
function unservedRow(t, hasFleet) {
  return { task_id: t.tid, match_id: t.m.match_id, donation_id: t.m.donation_id, request_id: t.m.request_id, donor_name: t.m.donor_name, receiver_name: t.m.receiver_name, quantity_kg: +t.kg.toFixed(1),
    reason: hasFleet ? 'No vehicle can fit this load inside the pickup, delivery and expiry windows' : 'No active vehicles available in fleet' }
}
function solve(matches, { vehicles, depots, splits = true, singleDepot = false }) {
  const t0 = performance.now()
  let fleet = vehicles.filter((v) => v.is_active !== false)
  let deps = depots
  if (singleDepot) { const hub = depots.find((x) => x.id === 2) || depots[0]; deps = [hub]; fleet = fleet.map((v) => ({ ...v, depot_id: hub.id })) }
  const routes = fleet.map((v) => ({ veh: v, depot: deps.find((x) => x.id === v.depot_id), stops: [], dist: 0, dur: 0, maxLoad: 0, ret: 0 })).filter((x) => x.depot)
  const maxCap = Math.max(0, ...fleet.map((v) => v.capacity_kg))
  const tasks = []
  for (const m of [...matches].sort((a, b) => b.priority_score - a.priority_score)) {
    const chunks = splits && maxCap > 0 && m.allocated_kg > maxCap ? Math.ceil(m.allocated_kg / maxCap) : 1
    for (let c = 0; c < chunks; c++) tasks.push({ m, kg: m.allocated_kg / chunks, split: chunks > 1, tid: `m${m.match_id}${chunks > 1 ? `_s${c + 1}` : ''}` })
  }
  const unserved = []
  let splitCount = tasks.filter((t) => t.split).length
  for (const t of tasks) {
    if (insertTask(routes, mkTask(t))) continue
    if (splits && t.kg > 10) {
      const a = { ...t, kg: t.kg / 2, tid: `${t.tid}_a` }, b = { ...t, kg: t.kg / 2, tid: `${t.tid}_b` }
      const okA = insertTask(routes, mkTask(a)), okB = insertTask(routes, mkTask(b))
      if (okA || okB) splitCount += okA && okB ? 2 : 1
      if (!okA) unserved.push(unservedRow(a, routes.length > 0))
      if (!okB) unserved.push(unservedRow(b, routes.length > 0))
      continue
    }
    unserved.push(unservedRow(t, routes.length > 0))
  }
  const used = routes.filter((x) => x.stops.length)
  const outRoutes = used.map((x) => ({
    vehicle_id: x.veh.id, depot_id: x.depot.id, depot_name: x.depot.name, depot_location: x.depot.location, capacity_kg: x.veh.capacity_kg,
    stops: x.stops, total_distance_km: +x.dist.toFixed(2), total_time_min: +x.dur.toFixed(1), max_load_kg: +x.maxLoad.toFixed(1),
    capacity_utilization_percent: +((x.maxLoad / x.veh.capacity_kg) * 100).toFixed(1),
    detailed_timeline: [
      { type: 'depot_start', name: x.depot.name, depot_id: x.depot.id, location: x.depot.location, depart: x.veh.available_from, cum_load_kg: 0 },
      ...x.stops,
      { type: 'depot_end', name: x.depot.name, depot_id: x.depot.id, location: x.depot.location, arrive: fromMin(x.ret), cum_load_kg: 0 },
    ],
  }))
  const requested = matches.reduce((s, m) => s + m.allocated_kg, 0)
  const unservedKg = unserved.reduce((s, u) => s + u.quantity_kg, 0)
  const delivered = Math.max(0, requested - unservedKg)
  const util = outRoutes.map((x) => x.capacity_utilization_percent)
  return {
    routes: outRoutes, unserved_tasks: unserved,
    metrics: {
      total_distance_km: +outRoutes.reduce((s, x) => s + x.total_distance_km, 0).toFixed(2),
      total_time_min: +outRoutes.reduce((s, x) => s + x.total_time_min, 0).toFixed(1),
      food_delivered_kg: +delivered.toFixed(2), food_requested_kg: +requested.toFixed(2),
      delivery_rate_percent: requested ? +((delivered / requested) * 100).toFixed(1) : 100,
      expiry_compliance_percent: 100,
      avg_vehicle_utilization_percent: util.length ? +(util.reduce((a, b) => a + b, 0) / util.length).toFixed(1) : 0,
      active_vehicles_used: outRoutes.length, split_delivery_count: splitCount, unserved_count: unserved.length,
      computation_time_seconds: +((performance.now() - t0) / 1000).toFixed(4),
    },
  }
}
function plan({ splits = true, vehicles = db.vehicles } = {}) {
  if (!db.matches.length) runMatching(clockMin)
  const sol = solve(db.matches, { vehicles, depots: db.depots, splits })
  const base = solve(db.matches, { vehicles, depots: db.depots, splits: false, singleDepot: true })
  const sM = sol.metrics, bM = base.metrics
  const distDelta = bM.total_distance_km - sM.total_distance_km
  const extra = Math.max(0, sM.food_delivered_kg - bM.food_delivered_kg)
  const out = {
    status: 'success', ...sol,
    baseline_comparison: {
      baseline_distance_km: bM.total_distance_km, baseline_food_delivered_kg: bM.food_delivered_kg,
      distance_reduction_km: +Math.max(0, distDelta).toFixed(2),
      distance_reduction_percent: bM.total_distance_km ? +((Math.max(0, distDelta) / bM.total_distance_km) * 100).toFixed(1) : 0,
      additional_food_delivered_kg: +extra.toFixed(2),
      food_delivery_gain_percent: bM.food_delivered_kg ? +((extra / bM.food_delivered_kg) * 100).toFixed(1) : 0,
      multi_depot_advantage_notes: `Multi-depot routing with splits delivered ${extra.toFixed(1)} kg more surplus food than the single-depot, no-split baseline.`,
      baseline_metrics: bM,
    },
  }
  db.routing = out; save()
  return out
}

// ---------- public mock API ----------
const guard = (cond, msg) => { if (!cond) { const e = new Error(msg); e.status = 400; throw e } }
export const mock = {
  async login(username, password) {
    const u = db.users.find((x) => x.username === username && x.password === password)
    guard(u, 'Incorrect username or password')
    return delay({ access_token: `mock.${u.id}`, token_type: 'bearer', role: u.role, username: u.username })
  },
  async register(p) {
    guard(!db.users.some((x) => x.username === p.username), 'Username already taken')
    const u = { id: nextId(db.users), ...p }; db.users.push(u); save()
    return delay({ id: u.id, username: u.username, email: u.email, role: u.role, created_at: new Date().toISOString() })
  },
  async list(kind) { return delay(db[kind]) },
  async create(kind, p) {
    const base = kind === 'donations' ? { remaining_kg: p.quantity_kg, status: 'open' } : kind === 'requests' ? { remaining_kg: p.quantity_kg, status: 'open', waiting_h: 0 } : kind === 'vehicles' ? { is_active: true } : {}
    const row = { id: nextId(db[kind]), ...p, ...base }; db[kind].push(row); db.matches = []; save()
    return delay(row)
  },
  async update(kind, id, p) { const row = db[kind].find((x) => x.id === id); guard(row, 'Not found'); Object.assign(row, p); save(); return delay(row) },
  async remove(kind, id) { db[kind] = db[kind].filter((x) => x.id !== id); save(); return delay({ ok: true }) },
  async scores() { return delay({ timestamp: new Date().toISOString(), donations: openD().map((x) => scoreDonation(x, clockMin)), requests: openR().map(scoreRequest) }) },
  async runMatching() { return delay(runMatching(clockMin)) },
  async matchResults() { return delay({ batch_id: db.batch?.batch_id ?? null, matches_count: db.matches.length, unmatched_count: db.unmatched.length, matches: db.matches, unmatched: db.unmatched }) },
  async plan(opts = {}) { return delay(plan(opts)) },
  async routes() { return delay(db.routing?.routes ?? []) },
  async summary() { return delay(db.routing ? { metrics: db.routing.metrics, unserved_count: db.routing.unserved_tasks.length, unserved_tasks: db.routing.unserved_tasks, baseline_comparison: db.routing.baseline_comparison } : null) },
  async replan({ disabled_vehicle_ids = [], new_donation } = {}) {
    if (new_donation) { db.donations.push({ id: nextId(db.donations), ...new_donation, remaining_kg: new_donation.quantity_kg, status: 'open' }); runMatching(clockMin) }
    const vehicles = db.vehicles.map((v) => (disabled_vehicle_ids.includes(v.id) ? { ...v, is_active: false } : v))
    const out = plan({ vehicles })
    out.replanned_event = { disabled_vehicles: disabled_vehicle_ids, new_donations_count: new_donation ? 1 : 0, active_fleet_size: vehicles.filter((v) => v.is_active).length }
    return delay(out)
  },
  async legacy() { return delay(legacyMatching(clockMin)) },
  async seed() { db = seed(); save(); return delay({ message: 'Database seeded successfully' }) },
}
