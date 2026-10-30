import { useState } from 'react'
import { Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Award, CheckCircle2, ChevronRight, Leaf, Route as RouteIcon, ShieldCheck, Soup, Sparkles, TrendingUp, Truck, Utensils, Zap } from 'lucide-react'
import { Link } from 'react-router-dom'
import { api } from '../api/client'
import { useApp } from '../context/AppContext'
import { useAsync } from '../lib/useAsync'
import { colorForVehicle, fmtKg, mealsFromKg } from '../lib/utils'
import { Button, EmptyState, ErrorState, PageHeader, PageLoader, StatCard } from '../components/ui'

const ChartCard = ({ title, children, sub }) => (
  <div className="card p-5 border-slate-200/90 shadow-sm transition hover:shadow-card-hover flex flex-col">
    <div className="mb-4">
      <h3 className="font-display text-base font-bold text-ink">{title}</h3>
      {sub && <p className="text-xs text-ink-soft mt-0.5">{sub}</p>}
    </div>
    <div className="h-64 w-full mt-auto">{children}</div>
  </div>
)

export default function Analytics() {
  const { demoMin, toast } = useApp()
  const [busy, setBusy] = useState(false)
  const { data, loading, error, reload } = useAsync(async () => {
    const [summary, routes, scores] = await Promise.all([
      api.summary().catch(() => null),
      api.routes().catch(() => []),
      api.scores().catch(() => null),
    ])
    return { summary, routes: routes || [], scores }
  }, [demoMin])

  const runPipelineNow = async () => {
    setBusy(true)
    try {
      await api.runMatching()
      await api.planRoutes()
      toast('Fleet optimization executed! Loading analytics…')
      reload()
    } catch (e) {
      toast(e.message, 'error')
    } finally {
      setBusy(false)
    }
  }

  if (loading) return <PageLoader label="Aggregating network analytics…" />
  if (error) return <ErrorState message={error} onRetry={reload} />

  const { summary, routes, scores } = data
  if (!summary?.metrics || !routes.length) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Impact & Efficiency Analytics"
          subtitle="Real-time telemetry on meals rescued, carbon offset, and vehicle logistics."
        />
        <EmptyState
          title="No operational data to analyze yet"
          text="Run matching and plan routes in the Control Center to generate optimization telemetry."
          icon={Leaf}
          action={
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Button className="btn-primary" loading={busy} onClick={runPipelineNow}>
                <Zap className="h-4 w-4 text-amber-300" />
                <span>Auto-Generate Analytics (Run Simulation)</span>
              </Button>
              <Link to="/admin" className="btn-secondary">
                Go to Control Center
              </Link>
            </div>
          }
        />
      </div>
    )
  }

  const m = summary.metrics
  const b = summary.baseline_comparison
  const bm = b?.baseline_metrics

  const cmp = b
    ? [
        { name: 'Food (kg)', Baseline: bm.food_delivered_kg, SmartFeed: m.food_delivered_kg },
        { name: 'Distance (km)', Baseline: bm.total_distance_km, SmartFeed: m.total_distance_km },
        { name: 'Avg Load (%)', Baseline: bm.avg_vehicle_utilization_percent, SmartFeed: m.avg_vehicle_utilization_percent },
      ]
    : []

  const pie = [
    { name: 'Delivered', v: m.food_delivered_kg, c: '#16a34a' },
    { name: 'Unrouted / Leftover', v: Math.max(0, m.food_requested_kg - m.food_delivered_kg), c: '#f59e0b' },
  ].filter((x) => x.v > 0)

  const util = routes.map((r) => ({
    name: `V${r.vehicle_id}`,
    util: r.capacity_utilization_percent,
    id: r.vehicle_id,
  }))

  const dist = routes.map((r) => ({
    name: `V${r.vehicle_id}`,
    km: r.total_distance_km,
    id: r.vehicle_id,
  }))

  const bands = { Urgent: 0, Soon: 0, Safe: 0 }
  ;[...(scores?.donations || []), ...(scores?.requests || [])].forEach((s) => {
    bands[s.urgency_score >= 0.6 ? 'Urgent' : s.urgency_score >= 0.4 ? 'Soon' : 'Safe']++
  })

  const band = Object.entries(bands).map(([name, v]) => ({
    name,
    v,
    c: { Urgent: '#e11d48', Soon: '#d97706', Safe: '#16a34a' }[name],
  }))

  return (
    <div className="space-y-6">
      <PageHeader
        title="Impact & Network Analytics"
        subtitle="Transparent evaluation of food rescued, carbon emission cuts, and multi-depot fleet performance."
        badge={
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800 border border-emerald-200">
            <TrendingUp className="h-3.5 w-3.5 text-emerald-700" /> Real-time Performance Telemetry
          </span>
        }
      />

      {/* Primary KPI Ribbon */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard
          icon={Soup}
          label="Meals Provided"
          value={mealsFromKg(m.food_delivered_kg).toLocaleString()}
          hint={`From ${fmtKg(m.food_delivered_kg)} rescued`}
          tone="leaf"
        />
        <StatCard
          icon={CheckCircle2}
          label="Expiry Compliance"
          value={`${m.expiry_compliance_percent}%`}
          hint="Every delivery strictly before expiry"
          tone="leaf"
        />
        <StatCard
          icon={RouteIcon}
          label="Total Fleet Distance"
          value={`${m.total_distance_km} km`}
          hint={`Across ${m.active_vehicles_used} active vehicles`}
          tone="amber"
        />
        <StatCard
          icon={Truck}
          label="Split Deliveries"
          value={m.split_delivery_count}
          hint="Multi-recipient load distribution"
          tone="blue"
        />
      </div>

      {/* Advantage Banner vs Single-Depot Baseline */}
      {b && (
        <div className="card p-5 border-emerald-300 bg-gradient-to-r from-emerald-50/90 via-white to-emerald-50/50 shadow-sm">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="rounded-md bg-leaf-700 text-white font-mono text-[11px] px-2 py-0.5 font-bold uppercase">
                  Multi-Depot Advantage
                </span>
                <h3 className="font-display text-base font-bold text-ink">
                  Outperforming Single-Depot Baseline
                </h3>
              </div>
              <p className="text-xs sm:text-sm text-ink-soft leading-relaxed max-w-2xl">
                SmartFeed delivered <b className="text-emerald-800 font-bold">{b.additional_food_delivered_kg} kg more food</b> (+{b.food_delivery_gain_percent}%) with {b.distance_reduction_km > 0 ? `${b.distance_reduction_km} km less driving` : 'balanced travel'}.
                <span className="block text-ink-mute mt-0.5">{b.multi_depot_advantage_notes}</span>
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <div className="rounded-xl border border-emerald-200 bg-white p-3 text-center shadow-sm">
                <div className="text-[10px] font-bold text-ink-mute uppercase">Food Saved Gain</div>
                <div className="font-display text-lg font-bold text-leaf-800">+{b.food_delivery_gain_percent}%</div>
              </div>
              {b.distance_reduction_percent > 0 && (
                <div className="rounded-xl border border-emerald-200 bg-white p-3 text-center shadow-sm">
                  <div className="text-[10px] font-bold text-ink-mute uppercase">Km Saved</div>
                  <div className="font-display text-lg font-bold text-leaf-800">-{b.distance_reduction_percent}%</div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Charts Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Chart 1: Baseline Comparison */}
        {b && (
          <ChartCard title="SmartFeed vs Baseline Architecture" sub="Comparing food delivered, distance, and fleet load">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={cmp} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
                <Bar dataKey="Baseline" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                <Bar dataKey="SmartFeed" fill="#16a34a" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        )}

        {/* Chart 2: Delivery Allocation Split */}
        <ChartCard title="Food Allocation Breakdown" sub="Proportion of requested surplus successfully routed">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={pie} dataKey="v" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={4}>
                {pie.map((p) => (
                  <Cell key={p.name} fill={p.c} />
                ))}
              </Pie>
              <Tooltip formatter={(v) => `${v} kg`} />
              <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Chart 3: Vehicle Utilization */}
        <ChartCard title="Peak Capacity Utilization by Vehicle" sub="Percentage of vehicle cargo space utilized">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={util} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} />
              <YAxis domain={[0, 100]} unit="%" tick={{ fontSize: 11, fill: '#64748b' }} />
              <Tooltip formatter={(v) => `${v}%`} />
              <Bar dataKey="util" name="Peak Load %" radius={[4, 4, 0, 0]}>
                {util.map((u) => (
                  <Cell key={u.id} fill={colorForVehicle(u.id)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Chart 4: Urgency Distribution */}
        <ChartCard title="Item Urgency Classification" sub="Items scored high are prioritized for earlier collection">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={band} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#64748b' }} />
              <Tooltip />
              <Bar dataKey="v" name="Active Batches" radius={[4, 4, 0, 0]}>
                {band.map((x) => (
                  <Cell key={x.name} fill={x.c} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Plan Quality Assurance Checklist */}
      <div className="card p-6 border-slate-200/90 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <ShieldCheck className="h-5 w-5 text-emerald-600" />
          <h3 className="font-display text-lg font-bold text-ink">
            Mathematical Feasibility & Food Safety Audit
          </h3>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              label: 'Capacity Limits',
              desc: 'No vehicle ever exceeds payload limit',
              ok: routes.every((r) => r.max_load_kg <= r.capacity_kg + 0.01),
            },
            {
              label: 'Expiry Deadlines',
              desc: '100% of deliveries completed before expiry',
              ok: m.expiry_compliance_percent === 100,
            },
            {
              label: 'Full Allocation',
              desc: 'All matched high-priority tasks routed',
              ok: m.unserved_count === 0,
            },
            {
              label: 'Solving Speed',
              desc: `Computed in ${m.computation_time_seconds}s (target < 5s)`,
              ok: m.computation_time_seconds < 5,
            },
          ].map((item) => (
            <div
              key={item.label}
              className={`rounded-xl border p-4 transition ${
                item.ok ? 'border-emerald-200 bg-emerald-50/30' : 'border-amber-200 bg-amber-50/30'
              }`}
            >
              <div className="flex items-center gap-2">
                <span
                  className={`grid h-5 w-5 place-items-center rounded-full text-xs font-bold ${
                    item.ok ? 'bg-emerald-600 text-white' : 'bg-amber-600 text-white'
                  }`}
                >
                  {item.ok ? '✓' : '!'}
                </span>
                <span className="font-bold text-sm text-ink">{item.label}</span>
              </div>
              <p className="mt-1 text-xs text-ink-soft leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
