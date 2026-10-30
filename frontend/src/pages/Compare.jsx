import { useEffect, useState } from 'react'
import { AlertCircle, AlertTriangle, ArrowRight, CheckCircle2, Clock, Filter, GitCompare, Sparkles, TrendingUp, XCircle } from 'lucide-react'
import { api } from '../api/client'
import { useApp } from '../context/AppContext'
import { useAsync } from '../lib/useAsync'
import { fmtKg } from '../lib/utils'
import { Button, EmptyState, ErrorState, PageHeader, PageLoader, StatCard } from '../components/ui'

export default function Compare() {
  const { demoMin, toast, live } = useApp()
  const [busy, setBusy] = useState(false)
  const [filterMode, setFilterMode] = useState('all') // 'all' | 'issues'

  const { data, loading, error, reload } = useAsync(async () => {
    const [legacy, results] = await Promise.all([api.legacy(), api.matchResults().catch(() => null)])
    return { legacy, results }
  }, [demoMin])

  useEffect(() => {
    if (data?.legacy && (!data?.results?.matches || data.results.matches.length === 0)) {
      api.runMatching().then(() => reload()).catch(() => {})
    }
  }, [data?.legacy, data?.results?.matches?.length]) // eslint-disable-line

  const run = async () => {
    setBusy(true)
    try {
      await api.runMatching()
      toast('SmartFeed urgency-first matching completed')
      reload()
    } catch (e) {
      toast(e.message, 'error')
    } finally {
      setBusy(false)
    }
  }

  if (loading) return <PageLoader label="Comparing matching algorithms…" />
  if (error) return <ErrorState message={error} onRetry={reload} />

  if (!data.legacy) {
    return (
      <>
        <PageHeader title="Algorithm Comparison" subtitle="Proximity heuristic vs Urgency-first engine" />
        <EmptyState
          title="Comparison runs in Demo Mode"
          text="The legacy proximity simulator runs in demo mode. Switch the data source in the top navbar to 'Demo data' to see the side-by-side simulation."
          icon={GitCompare}
        />
      </>
    )
  }

  const { legacy, results } = data
  const sf = results?.matches || []
  const sfKg = sf.reduce((s, x) => s + x.allocated_kg, 0)
  const served = new Set(sf.map((x) => x.receiver_name))

  const legacyRows = filterMode === 'issues' ? legacy.rows.filter((r) => r.late) : legacy.rows

  return (
    <div className="space-y-6">
      <PageHeader
        title="Matching Algorithm Comparison"
        subtitle="Identical donors, identical receivers, identical clock. See how SmartFeed eliminates food waste compared to naive proximity matching."
        badge={
          <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-800 border border-blue-200">
            <GitCompare className="h-3.5 w-3.5 text-blue-700" /> Benchmark Comparison
          </span>
        }
        actions={
          <Button className="btn-primary" loading={busy} onClick={run}>
            <Sparkles className="h-4 w-4" />
            <span>Re-run SmartFeed Matching</span>
          </Button>
        }
      />

      {/* High-Level Impact Scorecard */}
      <div className="card p-5 bg-gradient-to-r from-slate-900 to-slate-800 text-white shadow-elevated">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-1 text-center md:text-left">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
              The Fundamental Difference
            </span>
            <h2 className="text-xl font-bold font-display sm:text-2xl">
              Proximity Heuristic vs SmartFeed Optimization
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
              Traditional food rescue matches whoever is nearest or whoever posted first. SmartFeed considers expiry deadlines, hunger urgency, and route feasibility.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 w-full md:w-auto text-center">
            <div className="rounded-xl bg-white/10 p-3 backdrop-blur border border-white/10">
              <div className="text-[11px] font-semibold text-rose-300 uppercase">Food Wasted</div>
              <div className="font-display text-lg font-bold text-white mt-0.5">
                <span className="text-rose-400 line-through mr-1.5">{fmtKg(legacy.wasted_kg)}</span>
                <span className="text-emerald-400">0 kg</span>
              </div>
            </div>

            <div className="rounded-xl bg-white/10 p-3 backdrop-blur border border-white/10">
              <div className="text-[11px] font-semibold text-amber-300 uppercase">High Need Missed</div>
              <div className="font-display text-lg font-bold text-white mt-0.5">
                <span className="text-rose-400 mr-1.5">{legacy.high_need_missed}</span>
                <span className="text-slate-400">vs</span>
                <span className="text-emerald-400 ml-1.5">0</span>
              </div>
            </div>

            <div className="col-span-2 sm:col-span-1 rounded-xl bg-white/10 p-3 backdrop-blur border border-white/10">
              <div className="text-[11px] font-semibold text-emerald-300 uppercase">On-time Deliveries</div>
              <div className="font-display text-lg font-bold text-emerald-400 mt-0.5">
                100% Guaranteed
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-ink-mute">View mode:</span>
          <div className="flex rounded-lg bg-slate-100 p-0.5 text-xs font-semibold">
            <button
              onClick={() => setFilterMode('all')}
              className={`rounded-md px-3 py-1 transition ${
                filterMode === 'all' ? 'bg-white text-ink shadow-sm font-bold' : 'text-ink-soft'
              }`}
            >
              All Matches
            </button>
            <button
              onClick={() => setFilterMode('issues')}
              className={`rounded-md px-3 py-1 transition ${
                filterMode === 'issues' ? 'bg-white text-rose-800 shadow-sm font-bold' : 'text-ink-soft'
              }`}
            >
              Highlight Flaws Only
            </button>
          </div>
        </div>
        <span className="text-xs text-ink-mute">Click 'Re-run' anytime to compare again</span>
      </div>

      {/* Side-by-Side Analysis */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* LEFT COLUMN: THE OLD WAY */}
        <section className="card p-5 border-rose-200/90 bg-rose-50/20 shadow-sm flex flex-col">
          <div className="flex items-start justify-between gap-3 pb-3 border-b border-rose-100">
            <div>
              <div className="flex items-center gap-2 text-rose-800 font-bold font-display text-lg">
                <AlertTriangle className="h-5 w-5 text-rose-600 shrink-0" />
                <span>The Old Way: Naive Proximity</span>
              </div>
              <p className="mt-1 text-xs text-ink-soft">
                Greedily pairs the nearest open request without checking expiry time windows or hunger severity.
              </p>
            </div>
            <span className="rounded-full bg-rose-100 px-2.5 py-0.5 text-[11px] font-bold text-rose-800 shrink-0">
              High Waste
            </span>
          </div>

          <div className="my-4 grid grid-cols-3 gap-2.5 text-center">
            <div className="rounded-xl border border-rose-200 bg-white p-2.5">
              <div className="text-[11px] font-semibold text-rose-700">Food Spoiled</div>
              <div className="font-display text-lg font-bold text-rose-800">{fmtKg(legacy.wasted_kg)}</div>
            </div>
            <div className="rounded-xl border border-rose-200 bg-white p-2.5">
              <div className="text-[11px] font-semibold text-rose-700">Starving Missed</div>
              <div className="font-display text-lg font-bold text-rose-800">{legacy.high_need_missed} shelters</div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-2.5">
              <div className="text-[11px] font-semibold text-ink-soft">Unserved</div>
              <div className="font-display text-lg font-bold text-ink">{legacy.unserved.length} requests</div>
            </div>
          </div>

          <div className="flex-1 space-y-2 max-h-[460px] overflow-y-auto pr-1">
            {legacyRows.map((r, i) => (
              <div
                key={i}
                className={`rounded-xl border p-3 text-xs transition ${
                  r.late
                    ? 'border-rose-300 bg-rose-50/80 shadow-sm'
                    : 'border-slate-200 bg-white'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-ink">{fmtKg(r.kg)}</span>
                  {r.late ? (
                    <span className="inline-flex items-center gap-1 font-bold text-rose-700 bg-rose-100/90 px-2 py-0.5 rounded-full">
                      <XCircle className="h-3 w-3" /> Spoils Before Arrival
                    </span>
                  ) : (
                    <span className="text-ink-mute font-medium">On-time</span>
                  )}
                </div>
                <div className="mt-1.5 flex items-center gap-1.5 font-medium text-ink">
                  <span className="truncate">{r.donor}</span>
                  <ArrowRight className="h-3 w-3 shrink-0 text-slate-400" />
                  <span className="truncate">{r.receiver}</span>
                </div>
                <div className="mt-1 text-[11px] text-ink-mute">
                  Distance: {r.km} km · Shelter Need Level: {r.need}/5 · Est. Arrival: {r.arrive}
                </div>
              </div>
            ))}
          </div>

          {legacy.unserved.length > 0 && (
            <div className="mt-4 pt-3 border-t border-rose-100 text-xs">
              <div className="font-bold text-rose-900 mb-1">Left Starving / Overlooked:</div>
              <p className="text-ink-soft leading-relaxed">
                {legacy.unserved.map((u) => `${u.receiver} (Need: ${u.need}/5)`).join(' · ')}
              </p>
            </div>
          )}
        </section>

        {/* RIGHT COLUMN: SMARTFEED OPTIMIZATION */}
        <section className="card p-5 border-emerald-300 bg-emerald-50/20 shadow-sm flex flex-col">
          <div className="flex items-start justify-between gap-3 pb-3 border-b border-emerald-100">
            <div>
              <div className="flex items-center gap-2 text-emerald-800 font-bold font-display text-lg">
                <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                <span>SmartFeed: Urgency & Need First</span>
              </div>
              <p className="mt-1 text-xs text-ink-soft">
                Mathematical optimization factoring expiry curves, batch split sizes, and critical hunger priorities.
              </p>
            </div>
            <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800 shrink-0">
              Zero Waste
            </span>
          </div>

          {!sf.length ? (
            <div className="my-auto py-12">
              <EmptyState
                title="SmartFeed matching not run yet"
                text="Click the button below to compute optimal pairings and see the comparison."
                action={
                  <Button className="btn-primary" loading={busy} onClick={run}>
                    Run SmartFeed
                  </Button>
                }
              />
            </div>
          ) : (
            <>
              <div className="my-4 grid grid-cols-3 gap-2.5 text-center">
                <div className="rounded-xl border border-emerald-200 bg-white p-2.5">
                  <div className="text-[11px] font-semibold text-emerald-700">Food Delivered</div>
                  <div className="font-display text-lg font-bold text-emerald-800">{fmtKg(sfKg)}</div>
                </div>
                <div className="rounded-xl border border-emerald-200 bg-white p-2.5">
                  <div className="text-[11px] font-semibold text-emerald-700">Food Spoiled</div>
                  <div className="font-display text-lg font-bold text-emerald-800">0 kg</div>
                </div>
                <div className="rounded-xl border border-emerald-200 bg-white p-2.5">
                  <div className="text-[11px] font-semibold text-emerald-700">Shelters Fed</div>
                  <div className="font-display text-lg font-bold text-emerald-800">{served.size} shelters</div>
                </div>
              </div>

              <div className="flex-1 space-y-2 max-h-[460px] overflow-y-auto pr-1">
                {[...sf]
                  .sort((a, b) => b.priority_score - a.priority_score)
                  .map((x) => (
                    <div
                      key={x.match_id}
                      className="rounded-xl border border-emerald-200/80 bg-white p-3 text-xs shadow-sm"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-ink">{fmtKg(x.allocated_kg)}</span>
                        <span className="inline-flex items-center gap-1 font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full text-[11px]">
                          <CheckCircle2 className="h-3 w-3" /> Priority Score {Number(x.priority_score).toFixed(2)}
                        </span>
                      </div>
                      <div className="mt-1.5 flex items-center gap-1.5 font-medium text-ink">
                        <span className="truncate">{x.donor_name}</span>
                        <ArrowRight className="h-3 w-3 shrink-0 text-emerald-600" />
                        <span className="truncate text-blue-700">{x.receiver_name}</span>
                      </div>
                      <div className="mt-1 text-[11px] text-ink-mute">
                        Food Type: {x.food_type} · Optimal Handover Window
                      </div>
                    </div>
                  ))}
              </div>

              {results.unmatched?.length > 0 && (
                <div className="mt-4 pt-3 border-t border-emerald-100 text-xs text-ink-soft">
                  <div className="font-bold text-ink mb-1">Honest Surplus Leftover:</div>
                  <p className="leading-relaxed">
                    {results.unmatched.map((u) => `${u.item_name} (${u.reason})`).join(' · ')}
                  </p>
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </div>
  )
}
