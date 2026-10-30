import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  AlertTriangle,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Clock,
  ExternalLink,
  Filter,
  Gauge,
  HelpCircle,
  Info,
  Layers,
  MapPin,
  Package,
  PlayCircle,
  RefreshCw,
  RotateCcw,
  Route as RouteIcon,
  Search,
  Sparkles,
  Split,
  Truck,
  Zap,
} from 'lucide-react'
import { api } from '../api/client'
import { useApp } from '../context/AppContext'
import { colorForVehicle, fmtKg, fromMin, toLocalInput } from '../lib/utils'
import {
  Button,
  CountdownChip,
  EmptyState,
  ErrorState,
  Modal,
  PageHeader,
  PageLoader,
  StatCard,
  UrgencyBadge,
  WorkflowSteps,
} from '../components/ui'
import MapView from '../components/MapView'

export default function AdminControl() {
  const { toast, live, demoMin, setDemoMin, nowMs } = useApp()
  const [d, setD] = useState(null)
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState('')

  // View state: main workspace tab
  // 'intake' (donations & requests), 'matches' (pairing results), 'fleet' (vehicles & routes)
  const [activeTab, setActiveTab] = useState('intake')
  const [intakeFilter, setIntakeFilter] = useState('donations') // 'donations' | 'requests'
  const [searchQuery, setSearchQuery] = useState('')

  // Simulation clock drawer
  const [showClockSlider, setShowClockSlider] = useState(false)

  // Selection & focus
  const [sel, setSel] = useState(null)
  const [focus, setFocus] = useState(null)
  const [replanOpen, setReplanOpen] = useState(false)
  const [offline, setOffline] = useState([])
  const [urgentDrop, setUrgentDrop] = useState(false)
  const [plan, setPlan] = useState(null)

  const load = useCallback(async () => {
    try {
      const [donations, requests, depots, vehicles, scores, results, routes, summary] = await Promise.all([
        api.listDonations(),
        api.listRequests(),
        api.listDepots(),
        api.listVehicles(),
        api.scores(),
        api.matchResults().catch(() => null),
        api.routes().catch(() => []),
        api.summary().catch(() => null),
      ])
      setD({ donations, requests, depots, vehicles, scores, results })
      setPlan((p) =>
        summary && routes?.length
          ? {
              routes,
              metrics: summary.metrics,
              unserved_tasks: summary.unserved_tasks,
              baseline_comparison: summary.baseline_comparison,
            }
          : p
      )
      setErr('')
    } catch (e) {
      setErr(e.message)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load, demoMin])

  const act = async (key, fn, okMsg) => {
    setBusy(key)
    try {
      const r = await fn()
      if (okMsg) toast(okMsg(r))
      await load()
      return r
    } catch (e) {
      toast(e.message, 'error')
    } finally {
      setBusy('')
    }
  }

  const runMatching = () =>
    act(
      'match',
      async () => {
        setPlan(null)
        return api.runMatching()
      },
      (r) =>
        `Matched ${r.matches_count} allocations (${fmtKg(r.total_allocated_kg)}) prioritizing urgency in ${
          r.execution_time_ms
        } ms`
    )

  const planRoutes = async () => {
    const r = await act(
      'plan',
      () => api.planRoutes(),
      (x) => `Successfully planned ${x.routes.length} vehicle routes for ${fmtKg(x.metrics.food_delivered_kg)}`
    )
    if (r) {
      setPlan(r)
      setActiveTab('fleet')
    }
  }

  const replan = async () => {
    setReplanOpen(false)
    const now = new Date(nowMs)
    const nd = urgentDrop
      ? {
          donor_name: 'Emergency Drop – Central Kitchen',
          food_type: 'Cooked meals',
          quantity_kg: 60,
          location: { lat: 12.9716, lng: 77.6101 },
          ready_time: `${toLocalInput(now)}:00`,
          expiry_time: `${toLocalInput(new Date(nowMs + 2.5 * 3.6e6))}:00`,
          pickup_window: { start: fromMin(now.getHours() * 60 + now.getMinutes()), end: '23:00' },
        }
      : undefined
    const r = await act(
      'plan',
      () => api.replan({ disabled_vehicle_ids: offline, new_donation: nd }),
      (x) => `Dynamic re-planning complete with ${x.replanned_event?.active_fleet_size ?? '?'} active vehicles`
    )
    if (r) {
      setPlan(r)
      setActiveTab('fleet')
    }
  }

  const reset = () =>
    act(
      'reset',
      async () => {
        setPlan(null)
        setOffline([])
        return api.seed()
      },
      () => 'Demo dataset successfully reset to initial state'
    )

  const scoreMap = useMemo(
    () =>
      d && {
        donations: Object.fromEntries(d.scores.donations.map((s) => [s.id, s.urgency_score])),
        requests: Object.fromEntries(d.scores.requests.map((s) => [s.id, s.urgency_score])),
      },
    [d]
  )

  const onSelect = useCallback((s) => setSel(s), [])

  if (!d && !err) return <PageLoader label="Initializing SmartFeed Control Center…" />
  if (err && !d) return <ErrorState message={err} onRetry={load} />

  const matched = (d.results?.matches_count || 0) > 0
  const m = plan?.metrics
  const routes = plan?.routes || []
  const byId = (arr, id) => arr.find((x) => x.id === id)

  // Current workflow stage: 1 = intake, 2 = matching done, 3 = routing done
  const currentStage = routes.length > 0 ? 3 : matched ? 2 : 1

  // Filtered intake list
  const rawList = intakeFilter === 'donations' ? d.scores.donations : d.scores.requests
  const rankedIntake = [...rawList]
    .sort((a, b) => b.urgency_score - a.urgency_score)
    .filter((s) => {
      if (!searchQuery.trim()) return true
      const q = searchQuery.toLowerCase()
      const name = s.donor_name || s.receiver_name || ''
      const type = s.food_type || ''
      return name.toLowerCase().includes(q) || type.toLowerCase().includes(q)
    })

  const urgentCount = [...d.scores.donations, ...d.scores.requests].filter((s) => s.urgency_score >= 0.6).length

  return (
    <div className="space-y-6">
      {/* Page Header with Action Bar */}
      <PageHeader
        title="Rescue Operations Center"
        subtitle="Live automated dispatch: Real-time urgency scoring, intelligent split matching, and multi-depot fleet routing."
        badge={
          <span className="inline-flex items-center gap-1.5 rounded-full bg-leaf-100 px-3 py-1 text-xs font-bold text-leaf-800 border border-leaf-200">
            <Sparkles className="h-3.5 w-3.5 text-leaf-700" /> Automated Optimization Engine
          </span>
        }
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setShowClockSlider(!showClockSlider)}
              className={`btn border text-xs sm:text-sm ${
                showClockSlider ? 'bg-amber-50 border-amber-300 text-amber-900' : 'border-slate-200 bg-white text-ink-soft hover:bg-slate-50'
              }`}
              title="Toggle preview clock simulation"
            >
              <Clock className="h-4 w-4 text-amber-600" />
              <span>Clock: {live ? 'Real Clock' : fromMin(demoMin)}</span>
              {showClockSlider ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            </button>

            <Button
              className="btn-secondary text-xs sm:text-sm"
              disabled={!routes.length}
              onClick={() => setReplanOpen(true)}
              title="Simulate vehicle breakdown or unexpected surplus"
            >
              <RefreshCw className="h-4 w-4 text-ink-soft" />
              <span>Simulate Disruption</span>
            </Button>

            <Button
              className="btn-ghost text-xs text-ink-mute hover:text-ink !px-2.5"
              loading={busy === 'reset'}
              onClick={reset}
              title="Reset all demo data to seed status"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Reset</span>
            </Button>
          </div>
        }
      />

      {/* Clock Simulation Drawer (collapsible to avoid clutter) */}
      {showClockSlider && (
        <div className="card p-5 border-amber-200/80 bg-gradient-to-r from-amber-50/70 via-white to-amber-50/40 shadow-sm animate-in slide-in-from-top-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 font-display font-bold text-base text-amber-950">
                <Clock className="h-5 w-5 text-amber-600" />
                <span>Simulated Time of Day</span>
                <span className="rounded-lg bg-amber-200/70 px-2.5 py-0.5 font-mono text-sm font-bold text-amber-900">
                  {live ? new Date(nowMs).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : fromMin(demoMin)}
                </span>
              </div>
              <p className="mt-1 text-xs text-ink-soft max-w-xl">
                As the afternoon clock advances, cooked meals and banquet trays near their expiry deadline, causing their urgency score to rise and prioritizing them for immediate vehicle collection.
              </p>
            </div>

            {/* Quick Presets */}
            {!live && (
              <div className="flex items-center gap-2 text-xs">
                <span className="text-ink-mute font-medium">Quick jump:</span>
                <button
                  type="button"
                  className="rounded-lg border border-slate-200 bg-white px-2 py-1 font-semibold hover:border-amber-300 hover:bg-amber-50 text-ink"
                  onClick={() => setDemoMin(10 * 60)}
                >
                  10:00 AM (Morning)
                </button>
                <button
                  type="button"
                  className="rounded-lg border border-slate-200 bg-white px-2 py-1 font-semibold hover:border-amber-300 hover:bg-amber-50 text-ink"
                  onClick={() => setDemoMin(13 * 60 + 30)}
                >
                  1:30 PM (Lunch Surplus)
                </button>
                <button
                  type="button"
                  className="rounded-lg border border-slate-200 bg-white px-2 py-1 font-semibold hover:border-amber-300 hover:bg-amber-50 text-ink"
                  onClick={() => setDemoMin(18 * 60)}
                >
                  6:00 PM (Dinner Rush)
                </button>
              </div>
            )}
          </div>

          <div className="mt-4 flex items-center gap-4">
            <span className="text-xs font-bold text-ink-mute">08:00</span>
            <input
              type="range"
              min={8 * 60}
              max={22 * 60}
              step={15}
              value={demoMin}
              disabled={live}
              onChange={(e) => setDemoMin(Number(e.target.value))}
              className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-amber-200 accent-amber-600 focus:outline-none"
              aria-label="Preview time slider"
            />
            <span className="text-xs font-bold text-ink-mute">22:00</span>
          </div>
        </div>
      )}

      {/* Guided 3-Step Action Hero */}
      <div className="card overflow-hidden border-leaf-200/90 bg-gradient-to-br from-emerald-50/60 via-white to-leaf-50/30 p-5 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <span className="rounded-md bg-leaf-700 text-white font-mono text-xs px-2 py-0.5 font-bold">
                STAGE {currentStage} OF 3
              </span>
              <h2 className="font-display text-lg font-bold text-ink">
                {currentStage === 1 && 'Step 1: Raw Food Surplus & Hunger Needs Intake'}
                {currentStage === 2 && 'Step 2: Optimal Pairing Calculated (Ready to Route)'}
                {currentStage === 3 && 'Step 3: Fleet Routes Dispatched & Optimized'}
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-ink-soft leading-relaxed max-w-3xl">
              {currentStage === 1 &&
                'Every batch of surplus food and hunger request is continuously evaluated on expiry time, quantity, and hunger severity. Click below to compute optimal non-wasteful pairings.'}
              {currentStage === 2 &&
                `Matching complete! Found ${d.results?.matches_count} optimal pairings (${fmtKg(
                  d.results?.total_allocated_kg
                )}). Next, dispatch vehicles across multi-depots to generate real turn-by-turn timelines.`}
              {currentStage === 3 &&
                `Active fleet running: ${routes.length} vehicles delivering ${fmtKg(
                  m?.food_delivered_kg
                )} across Bangalore hubs with 100% expiry compliance.`}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            {currentStage === 1 && (
              <Button
                className="btn-primary !px-5 !py-3 shadow-md hover:shadow-lg text-sm"
                loading={busy === 'match'}
                onClick={runMatching}
              >
                <PlayCircle className="h-5 w-5" />
                <span>Run Urgency Matching</span>
              </Button>
            )}

            {currentStage === 2 && (
              <>
                <Button
                  className="btn-primary !px-5 !py-3 shadow-md hover:shadow-lg text-sm bg-blue-600 hover:bg-blue-700"
                  loading={busy === 'plan'}
                  onClick={planRoutes}
                >
                  <RouteIcon className="h-5 w-5" />
                  <span>Plan Fleet Routes & Timelines</span>
                </Button>
                <Button
                  className="btn-secondary text-xs"
                  loading={busy === 'match'}
                  onClick={runMatching}
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span>Re-run Matches</span>
                </Button>
              </>
            )}

            {currentStage === 3 && (
              <div className="flex items-center gap-2">
                <Link to="/admin/routes" className="btn-primary !px-4 !py-2.5 text-xs sm:text-sm">
                  <Truck className="h-4 w-4" />
                  <span>View Driver Timelines</span>
                </Link>
                <Button
                  className="btn-secondary text-xs"
                  loading={busy === 'match'}
                  onClick={runMatching}
                  title="Recalculate matches from scratch"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span>Re-match</span>
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Primary KPI Metric Cards */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard
          icon={Package}
          label="Open Donations"
          value={d.scores.donations.length}
          hint={`${fmtKg(d.donations.reduce((s, x) => s + x.remaining_kg, 0))} food surplus`}
          tone="leaf"
        />
        <StatCard
          icon={AlertTriangle}
          label="High Urgency"
          value={urgentCount}
          hint="Score ≥ 0.60 (prioritized first)"
          tone="red"
        />
        <StatCard
          icon={Zap}
          label="Active Matches"
          value={d.results?.matches_count || 0}
          hint={d.results?.matches_count ? `${fmtKg(d.results.total_allocated_kg)} paired` : 'Awaiting match run'}
          tone="blue"
        />
        <StatCard
          icon={Truck}
          label="Active Routes"
          value={routes.length}
          hint={m ? `${fmtKg(m.food_delivered_kg)} scheduled` : 'Not planned yet'}
          tone="amber"
        />
      </div>

      {/* Main Workspace: 2-Column Uncluttered Layout */}
      <div className="grid gap-6 lg:grid-cols-12 items-start">
        {/* Left Column: Interactive Tabbed Panel (Donations / Matches / Fleet) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Main Workspace Navigation Pills */}
          <div className="card p-1.5 flex gap-1 bg-slate-100/80 border-slate-200">
            <button
              onClick={() => setActiveTab('intake')}
              className={`flex-1 py-2 px-3 rounded-xl text-xs sm:text-sm font-semibold transition flex items-center justify-center gap-1.5 ${
                activeTab === 'intake'
                  ? 'bg-white text-ink shadow-sm font-bold'
                  : 'text-ink-soft hover:text-ink hover:bg-white/50'
              }`}
            >
              <Package className="h-4 w-4 text-leaf-700" />
              <span>Surplus & Needs</span>
            </button>
            <button
              onClick={() => setActiveTab('matches')}
              className={`flex-1 py-2 px-3 rounded-xl text-xs sm:text-sm font-semibold transition flex items-center justify-center gap-1.5 ${
                activeTab === 'matches'
                  ? 'bg-white text-ink shadow-sm font-bold'
                  : 'text-ink-soft hover:text-ink hover:bg-white/50'
              }`}
            >
              <Zap className="h-4 w-4 text-blue-600" />
              <span>Matches ({d.results?.matches_count || 0})</span>
            </button>
            <button
              onClick={() => setActiveTab('fleet')}
              className={`flex-1 py-2 px-3 rounded-xl text-xs sm:text-sm font-semibold transition flex items-center justify-center gap-1.5 ${
                activeTab === 'fleet'
                  ? 'bg-white text-ink shadow-sm font-bold'
                  : 'text-ink-soft hover:text-ink hover:bg-white/50'
              }`}
            >
              <Truck className="h-4 w-4 text-amber-600" />
              <span>Fleet ({routes.length})</span>
            </button>
          </div>

          {/* TAB 1: Intake (Donations & Requests) */}
          {activeTab === 'intake' && (
            <div className="card p-4 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex rounded-lg bg-slate-100 p-0.5 text-xs font-semibold">
                  <button
                    onClick={() => setIntakeFilter('donations')}
                    className={`rounded-md px-3 py-1.5 transition ${
                      intakeFilter === 'donations' ? 'bg-white text-leaf-900 shadow-sm font-bold' : 'text-ink-soft'
                    }`}
                  >
                    Donors ({d.scores.donations.length})
                  </button>
                  <button
                    onClick={() => setIntakeFilter('requests')}
                    className={`rounded-md px-3 py-1.5 transition ${
                      intakeFilter === 'requests' ? 'bg-white text-leaf-900 shadow-sm font-bold' : 'text-ink-soft'
                    }`}
                  >
                    Receivers ({d.scores.requests.length})
                  </button>
                </div>
                <span className="text-[11px] text-ink-mute">Sorted by highest urgency</span>
              </div>

              {/* Search filter */}
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-ink-mute" />
                <input
                  type="text"
                  placeholder={`Search ${intakeFilter}...`}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="input !pl-9 !py-2 text-xs"
                />
              </div>

              {/* Scrollable Ranked Items */}
              <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                {rankedIntake.length === 0 ? (
                  <EmptyState
                    title="No items found"
                    text="No entries match the current filter or all items have been fulfilled."
                  />
                ) : (
                  rankedIntake.map((s, idx) => {
                    const src = intakeFilter === 'donations' ? byId(d.donations, s.id) : byId(d.requests, s.id)
                    const isSelected = sel?.item?.id === s.id && sel?.kind === (intakeFilter === 'donations' ? 'donation' : 'request')

                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() =>
                          setSel({
                            kind: intakeFilter === 'donations' ? 'donation' : 'request',
                            item: src,
                          })
                        }
                        className={`w-full rounded-xl border p-3.5 text-left transition-all ${
                          isSelected
                            ? 'border-leaf-600 bg-leaf-50/60 ring-2 ring-leaf-200'
                            : 'border-slate-200 bg-white hover:border-leaf-300 hover:shadow-sm'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="grid h-5 w-5 place-items-center rounded-full bg-slate-100 text-[11px] font-bold text-ink-mute">
                              {idx + 1}
                            </span>
                            <span className="font-bold text-ink text-sm leading-tight">
                              {s.donor_name || s.receiver_name}
                            </span>
                          </div>
                          <UrgencyBadge score={s.urgency_score} />
                        </div>

                        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-ink-soft">
                          <span className="font-semibold text-ink bg-slate-100 px-2 py-0.5 rounded-md">
                            {fmtKg(s.quantity_kg)}
                          </span>
                          {intakeFilter === 'donations' ? (
                            <>
                              <span className="text-ink-mute">·</span>
                              <span>{src?.food_type}</span>
                              {src && <CountdownChip expiry={src.expiry_time} />}
                            </>
                          ) : (
                            <>
                              <span className="text-ink-mute">·</span>
                              <span className="rounded-md bg-blue-50 px-2 py-0.5 font-semibold text-blue-700">
                                Need level {s.need_level}/5
                              </span>
                            </>
                          )}
                        </div>
                      </button>
                    )
                  })
                )}
              </div>
            </div>
          )}

          {/* TAB 2: Matches (Pairings) */}
          {activeTab === 'matches' && (
            <div className="card p-4 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="text-xs font-bold text-ink uppercase tracking-wide">
                  Intelligent Allocations ({d.results?.matches_count || 0})
                </div>
                {matched && (
                  <span className="text-xs font-semibold text-leaf-700 bg-leaf-50 px-2 py-0.5 rounded-full border border-leaf-200">
                    Total: {fmtKg(d.results?.total_allocated_kg)}
                  </span>
                )}
              </div>

              {!matched ? (
                <EmptyState
                  title="No matches generated yet"
                  text="Click 'Run Urgency Matching' above to pair open surplus with recipient shelters in priority order."
                  icon={Zap}
                  action={
                    <Button className="btn-primary text-xs" loading={busy === 'match'} onClick={runMatching}>
                      Run Matching Now
                    </Button>
                  }
                />
              ) : (
                <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
                  {d.results.matches.map((x) => (
                    <div
                      key={x.match_id}
                      className="rounded-xl border border-slate-200 bg-white p-3.5 text-sm hover:border-slate-300 transition shadow-sm"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="rounded-md bg-leaf-100 px-2 py-0.5 text-xs font-bold text-leaf-800">
                            {fmtKg(x.allocated_kg)}
                          </span>
                          <span className="text-xs text-ink-soft">{x.food_type}</span>
                        </div>
                        <span className="text-[11px] font-mono text-ink-mute font-semibold">
                          Priority {Number(x.priority_score).toFixed(2)}
                        </span>
                      </div>
                      <div className="mt-2.5 flex items-center gap-2 text-xs text-ink">
                        <span className="truncate font-semibold">{x.donor_name}</span>
                        <ArrowRight className="h-3.5 w-3.5 shrink-0 text-leaf-600" />
                        <span className="truncate font-semibold text-blue-700">{x.receiver_name}</span>
                      </div>
                    </div>
                  ))}

                  {/* Honest Unmatched List if any */}
                  {d.results?.unmatched?.length > 0 && (
                    <div className="mt-4 pt-3 border-t border-slate-100">
                      <div className="text-xs font-bold text-amber-800 mb-2 flex items-center gap-1.5">
                        <Split className="h-3.5 w-3.5" />
                        <span>Honest Surplus Leftover ({d.results.unmatched.length})</span>
                      </div>
                      <div className="space-y-2">
                        {d.results.unmatched.map((u, i) => (
                          <div key={i} className="rounded-xl border border-amber-200 bg-amber-50/50 p-2.5 text-xs">
                            <div className="font-bold text-ink">{u.item_name}</div>
                            <div className="text-ink-soft">
                              {u.item_type} · {fmtKg(u.unallocated_kg)}
                            </div>
                            <div className="mt-1 text-amber-700 font-medium">{u.reason}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: Fleet (Routes & Vehicles) */}
          {activeTab === 'fleet' && (
            <div className="card p-4 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="text-xs font-bold text-ink uppercase tracking-wide">
                  Dispatched Routes ({routes.length})
                </div>
                {routes.length > 0 && (
                  <Link
                    to="/admin/routes"
                    className="text-xs font-bold text-leaf-700 hover:text-leaf-800 flex items-center gap-1"
                  >
                    <span>Full Driver Itineraries</span>
                    <ExternalLink className="h-3 w-3" />
                  </Link>
                )}
              </div>

              {!routes.length ? (
                <EmptyState
                  title="No vehicle routes planned"
                  text={
                    matched
                      ? "Matches are ready! Click 'Plan Fleet Routes' above to dispatch the multi-depot fleet."
                      : 'Run matching first before planning vehicle routes.'
                  }
                  icon={Truck}
                  action={
                    matched && (
                      <Button className="btn-primary text-xs" loading={busy === 'plan'} onClick={planRoutes}>
                        Plan Fleet Routes
                      </Button>
                    )
                  }
                />
              ) : (
                <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
                  {m && (
                    <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                      <div className="rounded-xl bg-slate-50 border border-slate-200/80 p-2.5">
                        <div className="text-ink-mute">Total Distance</div>
                        <div className="font-display text-base font-bold text-ink">{m.total_distance_km} km</div>
                      </div>
                      <div className="rounded-xl bg-slate-50 border border-slate-200/80 p-2.5">
                        <div className="text-ink-mute">Food Delivered</div>
                        <div className="font-display text-base font-bold text-leaf-800">
                          {m.delivery_rate_percent}% ({fmtKg(m.food_delivered_kg)})
                        </div>
                      </div>
                    </div>
                  )}

                  {routes.map((r) => (
                    <button
                      key={r.vehicle_id}
                      type="button"
                      onMouseEnter={() => setFocus(r.vehicle_id)}
                      onMouseLeave={() => setFocus(null)}
                      onClick={() => setFocus(focus === r.vehicle_id ? null : r.vehicle_id)}
                      className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-all ${
                        focus === r.vehicle_id
                          ? 'border-leaf-600 bg-leaf-50/70 shadow-sm'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <span
                        className="grid h-9 w-9 place-items-center rounded-xl text-xs font-bold text-white shadow-sm"
                        style={{ background: colorForVehicle(r.vehicle_id) }}
                      >
                        V{r.vehicle_id}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-ink text-sm flex items-center justify-between">
                          <span>{r.depot_name}</span>
                          <span className="text-xs text-ink-mute font-normal">{r.capacity_utilization_percent}% peak</span>
                        </div>
                        <div className="mt-0.5 text-xs text-ink-soft">
                          {r.stops.length} stops · {r.total_distance_km} km · Cap {r.capacity_kg} kg
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Column: Generous Map View Stage & Inspection Drawer */}
        <div className="lg:col-span-7 space-y-3">
          <div className="card overflow-hidden shadow-card p-1 bg-white">
            <div className="flex items-center justify-between px-3 py-2 border-b border-slate-100 text-xs">
              <span className="font-bold text-ink flex items-center gap-1.5">
                <MapPin className="h-4 w-4 text-leaf-700" />
                <span>Geographic Overview (Bangalore Operations)</span>
              </span>
              <span className="text-ink-mute">Click any pin or vehicle line to inspect</span>
            </div>

            <MapView
              depots={d.depots}
              donations={d.donations.filter((x) => x.remaining_kg > 0 || !matched)}
              requests={d.requests.filter((x) => x.remaining_kg > 0 || !matched)}
              routes={routes}
              scores={scoreMap}
              focusVehicle={focus}
              height={560}
              onSelect={onSelect}
            />
          </div>

          {/* Interactive Inspection Drawer when pin is clicked */}
          {sel ? (
            <div className="card p-4 border-leaf-300 bg-leaf-50/50 shadow-sm animate-in fade-in duration-150">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-leaf-800 bg-leaf-200/80 px-2 py-0.5 rounded-md">
                      {sel.kind}
                    </span>
                    <h3 className="font-display text-base font-bold text-ink">
                      {sel.item.donor_name || sel.item.receiver_name || sel.item.name}
                    </h3>
                  </div>

                  <p className="mt-1 text-xs sm:text-sm text-ink-soft leading-relaxed">
                    {sel.kind === 'donation' &&
                      `${sel.item.food_type} · ${fmtKg(sel.item.remaining_kg)} remaining · Handover window: ${
                        sel.item.pickup_window.start
                      }–${sel.item.pickup_window.end}`}
                    {sel.kind === 'request' &&
                      `Needs ${fmtKg(sel.item.remaining_kg)} · Hunger Level ${sel.item.need_level}/5 · Receiving window: ${
                        sel.item.delivery_window.start
                      }–${sel.item.delivery_window.end}`}
                    {sel.kind === 'depot' && `Distribution Hub · Coordinates: ${sel.item.location.lat}, ${sel.item.location.lng}`}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {sel.kind === 'donation' && <CountdownChip expiry={sel.item.expiry_time} />}
                  <button
                    className="btn-ghost !p-1 text-ink-mute hover:text-ink text-xs"
                    onClick={() => setSel(null)}
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between px-3 text-xs text-ink-mute">
              <span>💡 Tip: Click any marker on the map to view batch specifications and time windows.</span>
              <Link to="/how-it-works" className="hover:text-leaf-800 font-semibold underline">
                Urgency Formula
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Disruption Simulation Modal */}
      <Modal
        open={replanOpen}
        onClose={() => setReplanOpen(false)}
        title="Simulate Real-World Disruption"
        footer={
          <>
            <button className="btn-secondary" onClick={() => setReplanOpen(false)}>
              Cancel
            </button>
            <Button className="btn-primary" onClick={replan}>
              Re-optimize Fleet
            </Button>
          </>
        }
      >
        <p className="mb-4 text-ink-soft leading-relaxed">
          Test SmartFeed's resilience by temporarily taking delivery vehicles offline or injecting unexpected urgent surplus donations. The optimizer will instantly re-route remaining active fleet.
        </p>

        <fieldset className="mb-4">
          <legend className="label mb-2">Simulate Vehicle Breakdown</legend>
          <div className="grid grid-cols-2 gap-2">
            {d.vehicles.map((v) => {
              const isOffline = offline.includes(v.id)
              return (
                <label
                  key={v.id}
                  className={`cursor-pointer rounded-xl border p-2.5 text-xs font-semibold transition ${
                    isOffline
                      ? 'border-rose-400 bg-rose-50 text-rose-800 ring-1 ring-rose-300'
                      : 'border-slate-200 bg-white hover:bg-slate-50 text-ink'
                  }`}
                >
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={isOffline}
                    onChange={() =>
                      setOffline((o) => (o.includes(v.id) ? o.filter((x) => x !== v.id) : [...o, v.id]))
                    }
                  />
                  <div className="flex items-center justify-between">
                    <span>Vehicle {v.id}</span>
                    <span className="text-[11px] font-normal text-ink-soft">{v.capacity_kg} kg</span>
                  </div>
                  <div className="text-[10px] text-ink-mute mt-0.5">
                    {isOffline ? '⚠️ Disabled (in breakdown)' : 'Active'}
                  </div>
                </label>
              )
            })}
          </div>
        </fieldset>

        <label className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs font-medium text-ink cursor-pointer">
          <input
            type="checkbox"
            checked={urgentDrop}
            onChange={(e) => setUrgentDrop(e.target.checked)}
            className="mt-0.5 rounded accent-leaf-700"
          />
          <div>
            <span className="font-bold block">Inject Urgent 60 kg Cooked Meal Surplus</span>
            <span className="text-ink-mute text-[11px]">
              Simulates a banquet hall calling with hot food expiring in 2.5 hours.
            </span>
          </div>
        </label>
      </Modal>
    </div>
  )
}
