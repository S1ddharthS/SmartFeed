// One interface, two backends: the real FastAPI server (live) or the in-browser engine (mock).
import { mock } from './mock'

const BASE = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/$/, '')
const MODE_KEY = 'smartfeed_api_mode'
let mode = localStorage.getItem(MODE_KEY) || import.meta.env.VITE_API_MODE || 'auto' // auto | mock | live
let live = mode === 'live'
let token = localStorage.getItem('smartfeed_token') || ''

export const getMode = () => ({ pref: mode, live })
export const setToken = (t) => { token = t || ''; t ? localStorage.setItem('smartfeed_token', t) : localStorage.removeItem('smartfeed_token') }
export function setMode(next) {
  mode = next; localStorage.setItem(MODE_KEY, next)
  live = next === 'live'
}
export async function detectBackend() {
  if (mode === 'mock') { live = false; return false }
  if (mode === 'live') { live = true; return true }
  try {
    const ctrl = new AbortController(); const t = setTimeout(() => ctrl.abort(), 1500)
    const res = await fetch(`${BASE}/health`, { signal: ctrl.signal }); clearTimeout(t)
    live = res.ok
  } catch { live = false }
  return live
}

async function http(path, { method = 'GET', body } = {}) {
  let res
  try {
    res = await fetch(`${BASE}${path}`, {
      method,
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: body ? JSON.stringify(body) : undefined,
    })
  } catch {
    const e = new Error('Cannot reach the server. Check that the backend is running or switch to Demo data.'); e.status = 0; throw e
  }
  if (res.status === 204) return null
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const d = data.detail
    const e = new Error(typeof d === 'string' ? d : Array.isArray(d) ? d.map((x) => x.msg).join(', ') : `Request failed (${res.status})`); e.status = res.status; throw e
  }
  return data
}

const L = {
  login: (u, p) => http('/auth/login', { method: 'POST', body: { username: u, password: p } }),
  register: (b) => http('/auth/register', { method: 'POST', body: b }),
  list: (kind) => http(`/${kind}`),
  create: (kind, b) => http(`/${kind}`, { method: 'POST', body: b }),
  update: (kind, id, b) => http(`/${kind}/${id}`, { method: 'PUT', body: b }),
  remove: (kind, id) => http(`/${kind}/${id}`, { method: 'DELETE' }),
  scores: () => http('/scores'),
  runMatching: () => http('/matching/run', { method: 'POST' }),
  matchResults: () => http('/matching/results'),
  async plan(opts = {}) {
    // Module 2 plans from whatever we give it, so hand it the live database + the latest matches.
    const [donations, requests, depots, vehicles, res] = await Promise.all([
      http('/donations'), http('/requests'), http('/depots'), http('/vehicles'), http('/matching/results'),
    ])
    return http('/routing/plan', { method: 'POST', body: { donations, requests, depots, vehicles, matches: res.matches, enable_splits: opts.splits !== false, compare_baseline: true } })
  },
  routes: () => http('/routing/routes'),
  summary: () => http('/routing/summary'),
  async replan({ disabled_vehicle_ids = [], new_donation } = {}) {
    if (new_donation) {
      await http('/donations', { method: 'POST', body: new_donation })
      await http('/matching/run', { method: 'POST' })
    }
    if (!disabled_vehicle_ids.length) return L.plan()
    await L.plan() // make sure the backend holds the current data, then re-plan without the broken vehicles
    return http('/routing/replan', { method: 'POST', body: { disabled_vehicle_ids } })
  },
  legacy: async () => null,
  seed: () => http('/seed?reset=true', { method: 'POST' }),
}

const pick = () => (live ? L : mock)
const call = (name) => (...a) => pick()[name](...a)

export const api = {
  login: call('login'), register: call('register'),
  listDonations: () => pick().list('donations'), createDonation: (b) => pick().create('donations', b), updateDonation: (id, b) => pick().update('donations', id, b), deleteDonation: (id) => pick().remove('donations', id),
  listRequests: () => pick().list('requests'), createRequest: (b) => pick().create('requests', b), updateRequest: (id, b) => pick().update('requests', id, b), deleteRequest: (id) => pick().remove('requests', id),
  listDepots: () => pick().list('depots'), createDepot: (b) => pick().create('depots', b), deleteDepot: (id) => pick().remove('depots', id),
  listVehicles: () => pick().list('vehicles'), createVehicle: (b) => pick().create('vehicles', b), deleteVehicle: (id) => pick().remove('vehicles', id),
  scores: call('scores'), runMatching: call('runMatching'), matchResults: call('matchResults'),
  planRoutes: call('plan'), routes: call('routes'), summary: call('summary'), replan: call('replan'),
  legacy: () => (live ? Promise.resolve(null) : mock.legacy()),
  seed: call('seed'),
}
