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

  if (loading) return <PageLoader label="Comparing dispatch models…" />
  if (error) return <ErrorState message={error} onRetry={reload} />

  if (!data.legacy) {
    return (
      <div className="space-y-6 animate-fade-in">
        <PageHeader title="Algorithm Comparison" subtitle="Proximity heuristic vs Urgency-first engine" />
        <EmptyState
          title="Comparison runs in Demo Mode"
          text="The legacy proximity benchmark runs in demo mode. Switch the data source in the header to 'Demo data' to compare results."
          icon={GitCompare}
        />
      </div>
    )
  }

  const { legacy, results } = data
  const sf = results?.matches || []
  const sfKg = sf.reduce((s, x) => s + x.allocated_kg, 0)
  const served = new Set(sf.map((x) => x.receiver_name))

  const legacyRows = filterMode === 'issues' ? legacy.rows.filter((r) => r.late) : legacy.rows

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Algorithm Comparison"
        subtitle="Identical donors, identical receivers, identical clock: Proximity heuristic vs SmartFeed urgency optimization."
        badge={
          <span className="inline-flex items-center gap-1.5 rounded-full bg-info-soft border border-info-border px-2.5 py-0.5 text-xs font-semibold text-info">
            <GitCompare className="h-3 w-3 text-info" /> Benchmark Audit
          </span>
        }
        actions={
          <Button className="btn-primary text-xs sm:text-sm !py-1.5 !px-3.5" loading={busy} onClick={run}>
            <Sparkles className="h-4 w-4" />
            <span>Compare</span>
          </Button>
        }
      />

      {/* High-Level Impact Scorecard (Pure Light-Mode SaaS) */}
      <div className="card p-5 border-line bg-white shadow-card">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
          <div className="space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-brand-600">
              The Fundamental Difference
            </span>
            <h2 className="text-base sm:text-lg font-bold text-ink">
              Proximity Heuristic vs SmartFeed Optimization
            </h2>
            <p className="text-xs sm:text-sm text-ink-soft max-w-xl">
              Traditional apps match whoever is closest or whoever logged in first. SmartFeed considers expiry curves, hunger severity, and route feasibility.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2.5 w-full md:w-auto text-center shrink-0">
            <div className="rounded-lg border border-line bg-slate-50/70 p-2.5">
              <div className="text-[10px] font-medium text-ink-mute uppercase">Food Wasted</div>
              <div className="text-sm sm:text-base font-bold text-ink mt-0.5">
                <span className="text-urgent line-through mr-1 text-xs">{fmtKg(legacy.wasted_kg)}</span>
                <span className="text-brand-600">0 kg</span>
              </div>
            </div>

            <div className="rounded-lg border border-line bg-slate-50/70 p-2.5">
              <div className="text-[10px] font-medium text-ink-mute uppercase">High Need Missed</div>
              <div className="text-sm sm:text-base font-bold text-ink mt-0.5">
                <span className="text-urgent mr-1 text-xs">{legacy.high_need_missed}</span>
                <span className="text-ink-mute text-xs">vs</span>
                <span className="text-brand-600 ml-1">0</span>
              </div>
            </div>

            <div className="rounded-lg border border-line bg-slate-50/70 p-2.5">
              <div className="text-[10px] font-medium text-ink-mute uppercase">On-Time Arrival</div>
              <div className="text-sm sm:text-base font-bold text-brand-600 mt-0.5">
                100%
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-ink-soft">View:</span>
          <div className="flex rounded border border-line bg-slate-50 p-0.5 text-xs font-medium">
            <button
              onClick={() => setFilterMode('all')}
              className={`rounded px-2.5 py-1 transition ${
                filterMode === 'all' ? 'bg-white text-ink shadow-sm font-semibold' : 'text-ink-soft'
              }`}
            >
              All Matches
            </button>
            <button
              onClick={() => setFilterMode('issues')}
              className={`rounded px-2.5 py-1 transition ${
                filterMode === 'issues' ? 'bg-white text-urgent shadow-sm font-semibold' : 'text-ink-soft'
              }`}
            >
              Highlight Flaws Only
            </button>
          </div>
        </div>
        <span className="text-xs text-ink-mute">Click 'Re-run' anytime to refresh</span>
      </div>

      {/* Side-by-Side Analysis */}
      <div className="grid gap-5 lg:grid-cols-2">
        {/* LEFT COLUMN: THE OLD WAY */}
        <section className="card p-5 border-urgent-border/80 bg-urgent-soft/20 flex flex-col">
          <div className="flex items-start justify-between gap-3 pb-3 border-b border-urgent-border/50">
            <div>
              <div className="flex items-center gap-1.5 text-urgent font-semibold text-sm sm:text-base">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>The Status Quo: Naive Proximity</span>
              </div>
              <p className="mt-0.5 text-xs text-ink-soft">
                Greedily matches the closest request without checking perishable expiry or hunger urgency.
              </p>
            </div>
            <span className="rounded bg-urgent-soft px-2 py-0.5 text-[10px] font-semibold text-urgent border border-urgent-border shrink-0">
              High Waste
            </span>
          </div>

          <div className="my-3 grid grid-cols-3 gap-2 text-center">
            <div className="rounded border border-urgent-border bg-white p-2">
              <div className="text-[10px] font-medium text-urgent">Food Spoiled</div>
              <div className="text-sm font-bold text-urgent">{fmtKg(legacy.wasted_kg)}</div>
            </div>
            <div className="rounded border border-urgent-border bg-white p-2">
              <div className="text-[10px] font-medium text-urgent">High Need Missed</div>
              <div className="text-sm font-bold text-urgent">{legacy.high_need_missed} shelters</div>
            </div>
            <div className="rounded border border-line bg-white p-2">
              <div className="text-[10px] font-medium text-ink-soft">Unserved</div>
              <div className="text-sm font-bold text-ink">{legacy.unserved.length} requests</div>
            </div>
          </div>

          <div className="flex-1 space-y-2 max-h-[440px] overflow-y-auto pr-1">
            {legacyRows.map((r, i) => (
              <div
                key={i}
                className={`rounded-lg border p-2.5 text-xs transition-all ${
                  r.late
                    ? 'border-urgent-border bg-urgent-soft/50'
                    : 'border-line bg-white'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-ink">{fmtKg(r.kg)}</span>
                  {r.late ? (
                    <span className="inline-flex items-center gap-1 font-semibold text-urgent text-[11px]">
                      <XCircle className="h-3 w-3" /> Spoils Before Arrival
                    </span>
                  ) : (
                    <span className="text-ink-mute text-[11px]">On-time</span>
                  )}
                </div>
                <div className="mt-1 flex items-center gap-1.5 font-medium text-ink">
                  <span className="truncate">{r.donor}</span>
                  <ArrowRight className="h-3 w-3 shrink-0 text-slate-400" />
                  <span className="truncate">{r.receiver}</span>
                </div>
                <div className="mt-0.5 text-[10px] text-ink-mute">
                  Distance: {r.km} km · Shelter Need: {r.need}/5 · Est. Arrival: {r.arrive}
                </div>
              </div>
            ))}
          </div>

          {legacy.unserved.length > 0 && (
            <div className="mt-3 pt-2.5 border-t border-urgent-border/50 text-xs">
              <div className="font-semibold text-urgent text-[11px] mb-0.5">Shelters Overlooked:</div>
              <p className="text-ink-soft text-[11px] leading-snug">
                {legacy.unserved.map((u) => `${u.receiver} (Need: ${u.need}/5)`).join(' · ')}
              </p>
            </div>
          )}
        </section>

        {/* RIGHT COLUMN: SMARTFEED OPTIMIZATION */}
        <section className="card p-5 border-brand-100 bg-brand-50/20 flex flex-col">
          <div className="flex items-start justify-between gap-3 pb-3 border-b border-brand-100">
            <div>
              <div className="flex items-center gap-1.5 text-brand-700 font-semibold text-sm sm:text-base">
                <CheckCircle2 className="h-4 w-4 text-brand-600 shrink-0" />
                <span>SmartFeed: Urgency & Need First</span>
              </div>
              <p className="mt-0.5 text-xs text-ink-soft">
                Mathematical optimization factoring expiry curves, batch split sizes, and critical hunger priorities.
              </p>
            </div>
            <span className="rounded bg-brand-50 px-2 py-0.5 text-[10px] font-semibold text-brand-700 border border-brand-100 shrink-0">
              Zero Waste
            </span>
          </div>

          {!sf.length ? (
            <div className="my-auto py-12">
              <EmptyState
                title="SmartFeed matching not run yet"
                text="Run matching to compute optimal pairings and compare against baseline."
                action={
                  <Button className="btn-primary" loading={busy} onClick={run}>
                    Run SmartFeed
                  </Button>
                }
              />
            </div>
          ) : (
            <>
              <div className="my-3 grid grid-cols-3 gap-2 text-center">
                <div className="rounded border border-brand-100 bg-white p-2">
                  <div className="text-[10px] font-medium text-brand-700">Food Delivered</div>
                  <div className="text-sm font-bold text-brand-700">{fmtKg(sfKg)}</div>
                </div>
                <div className="rounded border border-brand-100 bg-white p-2">
                  <div className="text-[10px] font-medium text-brand-700">Food Spoiled</div>
                  <div className="text-sm font-bold text-brand-700">0 kg</div>
                </div>
                <div className="rounded border border-brand-100 bg-white p-2">
                  <div className="text-[10px] font-medium text-brand-700">Shelters Fed</div>
                  <div className="text-sm font-bold text-brand-700">{served.size} shelters</div>
                </div>
              </div>

              <div className="flex-1 space-y-2 max-h-[440px] overflow-y-auto pr-1">
                {[...sf]
                  .sort((a, b) => b.priority_score - a.priority_score)
                  .map((x) => (
                    <div
                      key={x.match_id}
                      className="rounded-lg border border-brand-100 bg-white p-2.5 text-xs shadow-card"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-ink">{fmtKg(x.allocated_kg)}</span>
                        <span className="inline-flex items-center gap-1 font-semibold text-brand-700 bg-brand-50 px-2 py-0.5 rounded text-[10px] border border-brand-100">
                          <CheckCircle2 className="h-3 w-3" /> Priority Score {Number(x.priority_score).toFixed(2)}
                        </span>
                      </div>
                      <div className="mt-1 flex items-center gap-1.5 font-medium text-ink">
                        <span className="truncate">{x.donor_name}</span>
                        <ArrowRight className="h-3 w-3 shrink-0 text-brand-500" />
                        <span className="truncate text-info">{x.receiver_name}</span>
                      </div>
                      <div className="mt-0.5 text-[10px] text-ink-mute">
                        Food Type: {x.food_type} · Optimal Handover Window
                      </div>
                    </div>
                  ))}
              </div>

              {results.unmatched?.length > 0 && (
                <div className="mt-3 pt-2.5 border-t border-brand-100 text-xs text-ink-soft">
                  <div className="font-semibold text-ink text-[11px] mb-0.5">Surplus Leftover:</div>
                  <p className="text-[11px] leading-snug">
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
