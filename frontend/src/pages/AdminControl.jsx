import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  AlertTriangle,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Clock,
  ExternalLink,
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
        `Matched ${r.matches_count} pairings (${fmtKg(r.total_allocated_kg)}) in ${r.execution_time_ms
        } ms`
    )

  const planRoutes = async () => {
    const r = await act(
      'plan',
      () => api.planRoutes(),
      (x) => `Generated ${x.routes.length} vehicle routes for ${fmtKg(x.metrics.food_delivered_kg)}`
    )
    if (r) {
      setPlan(r)
      setActiveTab('fleet')
    }
  }

  const runFullPipeline = async () => {
    setBusy('full')
    try {
      const matchRes = await api.runMatching()
      const planRes = await api.planRoutes()
      setPlan(planRes)
      setActiveTab('fleet')
      toast(`Dispatched: ${matchRes.matches_count} matches and ${planRes.routes.length} vehicle routes.`)
      await load()
    } catch (e) {
      toast(e.message, 'error')
    } finally {
      setBusy('')
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
      (x) => `Dynamic re-planning complete (${x.replanned_event?.active_fleet_size ?? '?'} active vehicles)`
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
      () => 'Demo dataset reset to initial state'
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

  if (!d && !err) return <PageLoader label="Initializing Control Center…" />
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
    <div className="space-y-6 animate-fade-in">
      {/* Page Header with Action Bar */}
      <PageHeader
        title="Operations Control Center"
        subtitle="Manage live intake, algorithmic urgency matching, and multi-depot fleet dispatch."
        badge={
          <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 border border-brand-100 px-2.5 py-0.5 text-xs font-semibold text-brand-700">
            <Sparkles className="h-3 w-3 text-brand-500" /> Dispatch Engine
          </span>
        }
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setShowClockSlider(!showClockSlider)}
              className={`btn-secondary text-xs sm:text-sm !py-1.5 !px-3 ${showClockSlider ? 'bg-warning-soft border-warning-border text-warning' : ''
                }`}
              title="Toggle time of day simulation"
            >
              <Clock className="h-3.5 w-3.5 text-warning" />
              <span>Clock: {live ? 'Live' : fromMin(demoMin)}</span>
              {showClockSlider ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </button>

            <Button
              className="btn-secondary text-xs sm:text-sm !py-1.5 !px-3"
              disabled={!routes.length}
              onClick={() => setReplanOpen(true)}
              title="Simulate vehicle breakdown or emergency drop"
            >
              <RefreshCw className="h-3.5 w-3.5 text-ink-soft" />
              <span>Simulate Issue</span>
            </Button>

            <Button
              className="btn-ghost text-xs text-ink-mute hover:text-ink !px-2.5 !py-1.5"
              loading={busy === 'reset'}
              onClick={reset}
              title="Reset data to default state"
            >
              <RotateCcw className="h-3 w-3" />
              <span>Reset</span>
            </Button>
          </div>
        }
      />

      {/* Clock Simulation Drawer */}
      {showClockSlider && (
        <div className="card p-4 sm:p-5 border-warning-border/80 bg-warning-soft/30 animate-in slide-in-from-top-1">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 font-semibold text-xs sm:text-sm text-ink">
                <Clock className="h-4 w-4 text-warning" />
                <span>Simulated Time of Day:</span>
                <span className="rounded bg-white px-2 py-0.5 font-mono text-xs font-bold text-ink border border-line">
                  {live ? new Date(nowMs).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : fromMin(demoMin)}
                </span>
              </div>
              <p className="mt-1 text-xs text-ink-soft max-w-xl">
                As the clock advances toward afternoon and evening, shelf-life deadlines shorten and urgency scores automatically rise.
              </p>
            </div>

            {/* Quick Presets */}
            {!live && (
              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-ink-mute text-[11px]">Preset:</span>
                <button
                  type="button"
                  className="rounded border border-line bg-white px-2 py-1 text-xs font-medium hover:bg-slate-50 text-ink"
                  onClick={() => setDemoMin(10 * 60)}
                >
                  10:00 AM
                </button>
                <button
                  type="button"
                  className="rounded border border-line bg-white px-2 py-1 text-xs font-medium hover:bg-slate-50 text-ink"
                  onClick={() => setDemoMin(13 * 60 + 30)}
                >
                  1:30 PM
                </button>
                <button
                  type="button"
                  className="rounded border border-line bg-white px-2 py-1 text-xs font-medium hover:bg-slate-50 text-ink"
                  onClick={() => setDemoMin(18 * 60)}
                >
                  6:00 PM
                </button>
              </div>
            )}
          </div>

          <div className="mt-3 flex items-center gap-3">
            <span className="text-[11px] font-medium text-ink-mute">08:00</span>
            <input
              type="range"
              min={8 * 60}
              max={22 * 60}
              step={15}
              value={demoMin}
              disabled={live}
              onChange={(e) => setDemoMin(Number(e.target.value))}
              className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-slate-200 accent-warning focus:outline-none"
              aria-label="Preview time slider"
            />
            <span className="text-[11px] font-medium text-ink-mute">22:00</span>
          </div>
        </div>
      )}

      {/* Guided 3-Step Action Workflow */}
      <div className="card p-4 sm:p-5 border-line bg-white">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex-1 space-y-1">
            <div className="flex items-center gap-2">
              <span className="rounded bg-brand-50 border border-brand-100 text-brand-700 font-mono text-[11px] px-2 py-0.5 font-bold uppercase">
                Stage {currentStage} / 3
              </span>
              <h2 className="text-sm sm:text-base font-semibold text-ink">
                {currentStage === 1 && 'Intake & Urgency Scoring'}
                {currentStage === 2 && 'Matching Complete — Ready to Dispatch'}
                {currentStage === 3 && 'Multi-Depot Fleet Optimized & En Route'}
              </h2>
            </div>
            <p className="text-xs text-ink-soft leading-relaxed max-w-2xl">
              {currentStage === 1 &&
                'All surplus donations and shelter requests are scored in real time. Click 1-Click Auto-Dispatch to run matching and fleet routing together.'}
              {currentStage === 2 &&
                `Generated ${d.results?.matches_count} optimal pairings (${fmtKg(
                  d.results?.total_allocated_kg
                )}). Dispatch vehicle fleet across Bangalore hubs to generate route timelines.`}
              {currentStage === 3 &&
                `Active fleet running: ${routes.length} vehicles delivering ${fmtKg(
                  m?.food_delivered_kg
                )} across urban hubs with 100% expiry compliance.`}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {currentStage === 1 && (
              <>
                <Button
                  className="btn-primary !px-4 !py-2 text-xs sm:text-sm"
                  loading={busy === 'full'}
                  onClick={runFullPipeline}
                  title="Run matching and plan multi-depot routes in one step"
                >
                  <Zap className="h-4 w-4" />
                  <span>Dispatch Fleet</span>
                </Button>
                <Button
                  className="btn-secondary !px-3 !py-2 text-xs"
                  loading={busy === 'match'}
                  onClick={runMatching}
                >
                  <PlayCircle className="h-3.5 w-3.5" />
                  <span>Match</span>
                </Button>
              </>
            )}

            {currentStage === 2 && (
              <>
                <Button
                  className="btn-primary !px-4 !py-2 text-xs sm:text-sm"
                  loading={busy === 'plan'}
                  onClick={planRoutes}
                >
                  <RouteIcon className="h-4 w-4" />
                  <span>Plan Routes</span>
                </Button>
                <Button
                  className="btn-secondary !px-3 !py-2 text-xs"
                  loading={busy === 'match'}
                  onClick={runMatching}
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span>Match Again</span>
                </Button>
              </>
            )}

            {currentStage === 3 && (
              <div className="flex items-center gap-2">
                <Link to="/admin/routes" className="btn-primary !px-3.5 !py-2 text-xs sm:text-sm">
                  <Truck className="h-4 w-4" />
                  <span>View Routes</span>
                </Link>
                <Button
                  className="btn-secondary !px-3 !py-2 text-xs"
                  loading={busy === 'match'}
                  onClick={runMatching}
                  title="Recalculate matches from scratch"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span>Match Again</span>
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
          hint={`${fmtKg(d.donations.reduce((s, x) => s + x.remaining_kg, 0))} total surplus`}
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
          label="Dispatched Routes"
          value={routes.length}
          hint={m ? `${fmtKg(m.food_delivered_kg)} scheduled` : 'Not planned yet'}
          tone="amber"
        />
      </div>

      {/* Main Workspace Layout */}
      <div className="grid gap-6 lg:grid-cols-12 items-start">
        {/* Left Column: Intake / Matches / Fleet Tabs */}
        <div className="lg:col-span-5 space-y-3">
          {/* Workspace Tabs */}
          <div className="card p-1 flex gap-1 bg-slate-50 border-line">
            <button
              onClick={() => setActiveTab('intake')}
              className={`flex-1 py-1.5 px-2.5 rounded text-xs font-semibold transition flex items-center justify-center gap-1.5 ${activeTab === 'intake'
                  ? 'bg-white text-ink shadow-sm'
                  : 'text-ink-soft hover:text-ink'
                }`}
            >
              <Package className="h-3.5 w-3.5 text-brand-600" />
              <span>Surplus & Needs</span>
            </button>
            <button
              onClick={() => setActiveTab('matches')}
              className={`flex-1 py-1.5 px-2.5 rounded text-xs font-semibold transition flex items-center justify-center gap-1.5 ${activeTab === 'matches'
                  ? 'bg-white text-ink shadow-sm'
                  : 'text-ink-soft hover:text-ink'
                }`}
            >
              <Zap className="h-3.5 w-3.5 text-info" />
              <span>Matches ({d.results?.matches_count || 0})</span>
            </button>
            <button
              onClick={() => setActiveTab('fleet')}
              className={`flex-1 py-1.5 px-2.5 rounded text-xs font-semibold transition flex items-center justify-center gap-1.5 ${activeTab === 'fleet'
                  ? 'bg-white text-ink shadow-sm'
                  : 'text-ink-soft hover:text-ink'
                }`}
            >
              <Truck className="h-3.5 w-3.5 text-warning" />
              <span>Fleet ({routes.length})</span>
            </button>
          </div>

          {/* TAB 1: Intake */}
          {activeTab === 'intake' && (
            <div className="card p-3.5 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex rounded border border-line bg-slate-50 p-0.5 text-xs font-medium">
                  <button
                    onClick={() => setIntakeFilter('donations')}
                    className={`rounded px-2.5 py-1 transition ${intakeFilter === 'donations' ? 'bg-white text-ink shadow-sm font-semibold' : 'text-ink-soft'
                      }`}
                  >
                    Donors ({d.scores.donations.length})
                  </button>
                  <button
                    onClick={() => setIntakeFilter('requests')}
                    className={`rounded px-2.5 py-1 transition ${intakeFilter === 'requests' ? 'bg-white text-ink shadow-sm font-semibold' : 'text-ink-soft'
                      }`}
                  >
                    Shelters ({d.scores.requests.length})
                  </button>
                </div>
                <span className="text-[11px] text-ink-mute">Highest urgency first</span>
              </div>

              {/* Search filter */}
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-ink-mute" />
                <input
                  type="text"
                  placeholder={`Filter ${intakeFilter}…`}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="input !pl-8 !py-1.5 text-xs"
                />
              </div>

              {/* Items List */}
              <div className="space-y-2 max-h-[460px] overflow-y-auto pr-1">
                {rankedIntake.length === 0 ? (
                  <EmptyState
                    title="No entries found"
                    text="No items match your search filter."
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
                        className={`w-full rounded-lg border p-3 text-left transition-all ${isSelected
                            ? 'border-brand-500 bg-brand-50/40 shadow-sm'
                            : 'border-line bg-white hover:border-slate-300'
                          }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[11px] font-mono text-ink-mute">#{idx + 1}</span>
                            <span className="font-semibold text-ink text-xs sm:text-sm truncate max-w-[180px]">
                              {s.donor_name || s.receiver_name}
                            </span>
                          </div>
                          <UrgencyBadge score={s.urgency_score} />
                        </div>

                        <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-xs text-ink-soft">
                          <span className="font-semibold text-ink bg-slate-50 px-1.5 py-0.5 rounded border border-line text-[11px]">
                            {fmtKg(s.quantity_kg)}
                          </span>
                          {intakeFilter === 'donations' ? (
                            <>
                              <span className="text-ink-mute text-[10px]">·</span>
                              <span className="text-xs">{src?.food_type}</span>
                              {src && <CountdownChip expiry={src.expiry_time} />}
                            </>
                          ) : (
                            <>
                              <span className="text-ink-mute text-[10px]">·</span>
                              <span className="rounded bg-urgent-soft px-1.5 py-0.5 text-[10px] font-semibold text-urgent border border-urgent-border">
                                Need {s.need_level}/5
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

          {/* TAB 2: Matches */}
          {activeTab === 'matches' && (
            <div className="card p-3.5 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-line">
                <div className="text-xs font-semibold text-ink uppercase tracking-wide">
                  Pairings ({d.results?.matches_count || 0})
                </div>
                {matched && (
                  <span className="text-xs font-semibold text-brand-700 bg-brand-50 px-2 py-0.5 rounded border border-brand-100">
                    Total: {fmtKg(d.results?.total_allocated_kg)}
                  </span>
                )}
              </div>

              {!matched ? (
                <EmptyState
                  title="No matches generated"
                  text="Run matching to compute urgency-first pairings."
                  icon={Zap}
                  action={
                    <Button className="btn-primary text-xs !py-1.5 !px-3" loading={busy === 'match'} onClick={runMatching}>
                      Run Matching
                    </Button>
                  }
                />
              ) : (
                <div className="space-y-2 max-h-[460px] overflow-y-auto pr-1">
                  {d.results.matches.map((x) => (
                    <div
                      key={x.match_id}
                      className="rounded-lg border border-line bg-white p-3 text-xs hover:border-slate-300 transition-all"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span className="rounded bg-brand-50 border border-brand-100 px-1.5 py-0.5 text-[11px] font-semibold text-brand-700">
                            {fmtKg(x.allocated_kg)}
                          </span>
                          <span className="text-ink-soft">{x.food_type}</span>
                        </div>
                        <span className="text-[11px] font-mono text-ink-mute">
                          Priority {Number(x.priority_score).toFixed(2)}
                        </span>
                      </div>
                      <div className="mt-2 flex items-center gap-1.5 text-ink font-medium">
                        <span className="truncate">{x.donor_name}</span>
                        <ArrowRight className="h-3 w-3 shrink-0 text-brand-500" />
                        <span className="truncate text-info font-semibold">{x.receiver_name}</span>
                      </div>
                    </div>
                  ))}

                  {/* Unmatched surplus if any */}
                  {d.results?.unmatched?.length > 0 && (
                    <div className="mt-3 pt-2.5 border-t border-line">
                      <div className="text-xs font-semibold text-warning mb-1.5 flex items-center gap-1">
                        <Split className="h-3 w-3" />
                        <span>Unmatched Leftover ({d.results.unmatched.length})</span>
                      </div>
                      <div className="space-y-1.5">
                        {d.results.unmatched.map((u, i) => (
                          <div key={i} className="rounded border border-warning-border bg-warning-soft/40 p-2 text-xs">
                            <div className="font-semibold text-ink">{u.item_name}</div>
                            <div className="text-ink-soft text-[11px]">
                              {u.item_type} · {fmtKg(u.unallocated_kg)} ({u.reason})
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: Fleet */}
          {activeTab === 'fleet' && (
            <div className="card p-3.5 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-line">
                <div className="text-xs font-semibold text-ink uppercase tracking-wide">
                  Vehicles ({routes.length})
                </div>
                {routes.length > 0 && (
                  <Link
                    to="/admin/routes"
                    className="text-xs font-medium text-brand-600 hover:text-brand-700 flex items-center gap-1"
                  >
                    <span>Driver Timelines</span>
                    <ExternalLink className="h-3 w-3" />
                  </Link>
                )}
              </div>

              {!routes.length ? (
                <EmptyState
                  title="No fleet routes planned"
                  text={matched ? 'Matches ready! Plan routes to dispatch multi-depot fleet.' : 'Run matching first.'}
                  icon={Truck}
                  action={
                    matched && (
                      <Button className="btn-primary text-xs !py-1.5 !px-3" loading={busy === 'plan'} onClick={planRoutes}>
                        Plan Fleet Routes
                      </Button>
                    )
                  }
                />
              ) : (
                <div className="space-y-2 max-h-[460px] overflow-y-auto pr-1">
                  {m && (
                    <div className="grid grid-cols-2 gap-2 text-xs mb-2">
                      <div className="rounded border border-line bg-slate-50 p-2">
                        <div className="text-ink-mute text-[10px] uppercase font-medium">Distance</div>
                        <div className="text-sm font-bold text-ink">{m.total_distance_km} km</div>
                      </div>
                      <div className="rounded border border-line bg-slate-50 p-2">
                        <div className="text-ink-mute text-[10px] uppercase font-medium">Delivered</div>
                        <div className="text-sm font-bold text-brand-600">
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
                      className={`flex w-full items-center gap-2.5 rounded-lg border p-2.5 text-left transition-all ${focus === r.vehicle_id
                          ? 'border-brand-500 bg-brand-50/50 shadow-sm'
                          : 'border-line bg-white hover:border-slate-300'
                        }`}
                    >
                      <span
                        className="grid h-7 w-7 place-items-center rounded text-xs font-bold text-white shadow-sm"
                        style={{ background: colorForVehicle(r.vehicle_id) }}
                      >
                        V{r.vehicle_id}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-ink text-xs flex items-center justify-between">
                          <span>{r.depot_name}</span>
                          <span className="text-[11px] text-ink-mute font-normal">{r.capacity_utilization_percent}% load</span>
                        </div>
                        <div className="mt-0.5 text-[11px] text-ink-soft">
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

        {/* Right Column: Geographic Map View */}
        <div className="lg:col-span-7 space-y-2.5">
          <div className="card overflow-hidden shadow-card p-1 bg-white">
            <div className="flex items-center justify-between px-3 py-2 border-b border-line text-xs">
              <span className="font-semibold text-ink flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-brand-600" />
                <span>Geographic Overview (Bangalore Operations)</span>
              </span>
              <span className="text-ink-mute text-[11px]">Click marker to inspect</span>
            </div>

            <MapView
              depots={d.depots}
              donations={d.donations.filter((x) => x.remaining_kg > 0 || !matched)}
              requests={d.requests.filter((x) => x.remaining_kg > 0 || !matched)}
              routes={routes}
              scores={scoreMap}
              focusVehicle={focus}
              height={520}
              onSelect={onSelect}
            />
          </div>

          {/* Interactive Inspection Drawer when marker is clicked */}
          {sel ? (
            <div className="card p-3.5 border-brand-200 bg-brand-50/40 shadow-sm animate-in fade-in duration-150">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-brand-800 bg-brand-100 px-1.5 py-0.5 rounded">
                      {sel.kind}
                    </span>
                    <h3 className="text-xs sm:text-sm font-bold text-ink">
                      {sel.item.donor_name || sel.item.receiver_name || sel.item.name}
                    </h3>
                  </div>

                  <p className="mt-1 text-xs text-ink-soft leading-relaxed">
                    {sel.kind === 'donation' &&
                      `${sel.item.food_type} · ${fmtKg(sel.item.remaining_kg)} remaining · Pickup: ${sel.item.pickup_window.start
                      }–${sel.item.pickup_window.end}`}
                    {sel.kind === 'request' &&
                      `Needs ${fmtKg(sel.item.remaining_kg)} · Level ${sel.item.need_level}/5 · Window: ${sel.item.delivery_window.start
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
                    Close
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between px-2 text-xs text-ink-mute">
              <span>Click any marker to inspect batch specifications and time windows.</span>
              <Link to="/how-it-works" className="hover:text-brand-600 font-medium">
                Algorithm Details
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Disruption Simulation Modal */}
      <Modal
        open={replanOpen}
        onClose={() => setReplanOpen(false)}
        title="Simulate Fleet Disruption"
        footer={
          <>
            <button className="btn-secondary !py-1.5 !px-3 text-xs" onClick={() => setReplanOpen(false)}>
              Cancel
            </button>
            <Button className="btn-primary !py-1.5 !px-3.5 text-xs" onClick={replan}>
              Update Routes
            </Button>
          </>
        }
      >
        <p className="mb-3 text-xs sm:text-sm text-ink-soft leading-relaxed">
          Test resilience by simulating a vehicle breakdown or injecting an emergency surplus batch. The engine will dynamically re-route active vehicles.
        </p>

        <fieldset className="mb-3">
          <legend className="label mb-1.5">Simulate Breakdown</legend>
          <div className="grid grid-cols-2 gap-2">
            {d.vehicles.map((v) => {
              const isOffline = offline.includes(v.id)
              return (
                <label
                  key={v.id}
                  className={`cursor-pointer rounded-lg border p-2 text-xs transition-all ${isOffline
                      ? 'border-urgent-border bg-urgent-soft text-urgent font-medium'
                      : 'border-line bg-white hover:bg-slate-50 text-ink'
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
                    <span className="font-semibold">Vehicle {v.id}</span>
                    <span className="text-[11px] text-ink-mute">{v.capacity_kg} kg</span>
                  </div>
                  <div className="text-[10px] mt-0.5">
                    {isOffline ? 'Disabled (breakdown)' : 'Active'}
                  </div>
                </label>
              )
            })}
          </div>
        </fieldset>

        <label className="flex items-start gap-2.5 rounded-lg border border-line bg-slate-50 p-2.5 text-xs text-ink cursor-pointer">
          <input
            type="checkbox"
            checked={urgentDrop}
            onChange={(e) => setUrgentDrop(e.target.checked)}
            className="mt-0.5 rounded accent-brand-500"
          />
          <div>
            <span className="font-semibold block">Inject Emergency 60 kg Cooked Meal Surplus</span>
            <span className="text-ink-mute text-[11px]">
              Simulates hot banquet food expiring in 2.5 hours needing priority pickup.
            </span>
          </div>
        </label>
      </Modal>
    </div>
  )
}
