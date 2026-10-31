import { useState } from 'react'
import { Building2, Clock, MapPin, Plus, Shield, Trash2, Truck } from 'lucide-react'
import { api } from '../api/client'
import { useApp } from '../context/AppContext'
import { useAsync } from '../lib/useAsync'
import { Button, ConfirmDialog, EmptyState, ErrorState, Field, PageHeader, PageLoader } from '../components/ui'
import LocationPicker from '../components/LocationPicker'
import MapView from '../components/MapView'
import { colorForVehicle, fmtKg } from '../lib/utils'

export default function Setup() {
  const { toast } = useApp()
  const { data, loading, error, reload } = useAsync(async () => {
    const [depots, vehicles] = await Promise.all([api.listDepots(), api.listVehicles()])
    return { depots, vehicles }
  }, [])

  const [activeTab, setActiveTab] = useState('depots') // 'depots' | 'fleet'
  const [dep, setDep] = useState({ name: '', location: null })
  const [veh, setVeh] = useState({ depot_id: '', capacity_kg: '', available_from: '09:00', available_to: '21:00' })
  const [del, setDel] = useState(null)
  const [busy, setBusy] = useState('')
  const [err, setErr] = useState({})

  if (loading) return <PageLoader label="Loading depots and fleet assets…" />
  if (error) return <ErrorState message={error} onRetry={reload} />

  const { depots, vehicles } = data

  const addDepot = async (e) => {
    e.preventDefault()
    if (!dep.name.trim() || !dep.location)
      return setErr({ depot: 'Please specify the depot name and select coordinates on the map' })
    setErr({})
    setBusy('depot')
    try {
      await api.createDepot({ name: dep.name.trim(), location: dep.location })
      toast('Distribution depot added successfully')
      setDep({ name: '', location: null })
      reload()
    } catch (x) {
      toast(x.message, 'error')
    } finally {
      setBusy('')
    }
  }

  const addVehicle = async (e) => {
    e.preventDefault()
    if (!veh.depot_id || !(Number(veh.capacity_kg) > 0))
      return setErr({ veh: 'Please select a home depot and enter a valid payload capacity' })
    if (veh.available_to <= veh.available_from)
      return setErr({ veh: 'Shift end time must be later than shift start time' })
    setErr({})
    setBusy('veh')
    try {
      await api.createVehicle({
        ...veh,
        depot_id: Number(veh.depot_id),
        capacity_kg: Number(veh.capacity_kg),
      })
      toast('Vehicle registered to fleet')
      setVeh({ ...veh, capacity_kg: '' })
      reload()
    } catch (x) {
      toast(x.message, 'error')
    } finally {
      setBusy('')
    }
  }

  const remove = async () => {
    setBusy('del')
    try {
      del.kind === 'depot' ? await api.deleteDepot(del.id) : await api.deleteVehicle(del.id)
      toast('Asset successfully removed')
      setDel(null)
      reload()
    } catch (x) {
      toast(x.message, 'error')
    } finally {
      setBusy('')
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Depots & Fleet Infrastructure"
        subtitle="Manage distribution hubs and vehicles. Multi-depot routing ensures vehicles begin and end shifts at their assigned depot."
        badge={
          <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-ink-soft border border-line">
            <Building2 className="h-3 w-3 text-ink-mute" /> Logistics Assets
          </span>
        }
      />

      {/* Map Overview of Hubs */}
      <div className="card p-1 bg-white shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-3 py-2 border-b border-line text-xs font-medium text-ink-soft">
          <span>Active Hub Network ({depots.length} distribution locations)</span>
          <span className="text-ink-mute text-[11px]">Click pin to inspect</span>
        </div>
        <MapView depots={depots} height={300} />
      </div>

      {/* Tabs */}
      <div className="flex rounded border border-line bg-slate-50 p-0.5 text-xs font-medium max-w-xs">
        <button
          onClick={() => setActiveTab('depots')}
          className={`flex-1 py-1.5 px-3 rounded transition flex items-center justify-center gap-1.5 ${
            activeTab === 'depots' ? 'bg-white text-ink shadow-sm font-semibold' : 'text-ink-soft hover:text-ink'
          }`}
        >
          <Building2 className="h-3.5 w-3.5 text-brand-600" />
          <span>Depot Hubs ({depots.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('fleet')}
          className={`flex-1 py-1.5 px-3 rounded transition flex items-center justify-center gap-1.5 ${
            activeTab === 'fleet' ? 'bg-white text-ink shadow-sm font-semibold' : 'text-ink-soft hover:text-ink'
          }`}
        >
          <Truck className="h-3.5 w-3.5 text-info" />
          <span>Fleet Vehicles ({vehicles.length})</span>
        </button>
      </div>

      {/* DEPOTS TAB */}
      {activeTab === 'depots' && (
        <div className="grid gap-6 lg:grid-cols-12 items-start">
          <div className="lg:col-span-6 space-y-2.5">
            <div className="text-xs font-semibold text-ink uppercase tracking-wider">Registered Hubs</div>
            {!depots.length ? (
              <EmptyState title="No depots created" text="Add your first distribution hub to dispatch vehicles." />
            ) : (
              <ul className="space-y-2">
                {depots.map((d) => {
                  const assignedVehicles = vehicles.filter((v) => v.depot_id === d.id)
                  return (
                    <li
                      key={d.id}
                      className="card p-3.5 border-line flex items-center justify-between hover:border-slate-300 transition-all"
                    >
                      <div>
                        <div className="font-semibold text-ink text-sm">{d.name}</div>
                        <div className="text-[11px] text-ink-mute mt-0.5">
                          Coordinates: {d.location.lat}, {d.location.lng}
                        </div>
                        <div className="mt-1.5 inline-flex items-center gap-1 rounded bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-ink-soft">
                          <Truck className="h-3 w-3" />
                          <span>{assignedVehicles.length} vehicles stationed</span>
                        </div>
                      </div>
                      <button
                        className="btn-danger !p-1.5 text-xs"
                        aria-label={`Delete ${d.name}`}
                        onClick={() => setDel({ kind: 'depot', id: d.id, name: d.name })}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>

          <div className="lg:col-span-6">
            <form onSubmit={addDepot} className="card p-5 space-y-4 border-line shadow-card">
              <div>
                <h3 className="text-sm font-semibold text-ink">Add Distribution Hub</h3>
                <p className="text-xs text-ink-soft mt-0.5">Station where vehicles start and finish delivery routes.</p>
              </div>

              <Field label="Depot Name" required>
                <input
                  className="input"
                  placeholder="e.g. South Hub (Koramangala)"
                  value={dep.name}
                  onChange={(e) => setDep({ ...dep, name: e.target.value })}
                />
              </Field>

              <div>
                <span className="label">Hub Location Coordinates</span>
                <LocationPicker value={dep.location} onChange={(p) => setDep((d0) => ({ ...d0, location: p }))} />
                {err.depot && <p className="mt-1 text-xs font-medium text-urgent">{err.depot}</p>}
              </div>

              <Button type="submit" loading={busy === 'depot'} className="btn-primary w-full !py-2 text-xs sm:text-sm">
                <Plus className="h-4 w-4" />
                <span>Save New Depot</span>
              </Button>
            </form>
          </div>
        </div>
      )}

      {/* FLEET TAB */}
      {activeTab === 'fleet' && (
        <div className="grid gap-6 lg:grid-cols-12 items-start">
          <div className="lg:col-span-6 space-y-2.5">
            <div className="text-xs font-semibold text-ink uppercase tracking-wider">Fleet Manifest</div>
            {!vehicles.length ? (
              <EmptyState title="No vehicles in fleet" text="Station your first vehicle at a hub." />
            ) : (
              <ul className="space-y-2">
                {vehicles.map((v) => {
                  const depot = depots.find((d) => d.id === v.depot_id)
                  const vColor = colorForVehicle(v.id)
                  return (
                    <li
                      key={v.id}
                      className="card p-3 border-line flex items-center gap-3 hover:border-slate-300 transition-all"
                    >
                      <span
                        className="grid h-8 w-8 shrink-0 place-items-center rounded text-xs font-bold text-white shadow-sm"
                        style={{ background: vColor }}
                      >
                        V{v.id}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-ink text-xs sm:text-sm flex items-center justify-between">
                          <span>Payload Capacity: {v.capacity_kg} kg</span>
                          <span className="text-xs text-ink-mute">
                            {depot?.name || `Depot #${v.depot_id}`}
                          </span>
                        </div>
                        <div className="mt-0.5 flex items-center gap-2 text-xs text-ink-soft">
                          <Clock className="h-3 w-3 text-ink-mute" />
                          <span>Shift: {v.available_from} – {v.available_to}</span>
                          {v.is_active === false && (
                            <span className="rounded bg-urgent-soft text-urgent text-[10px] font-semibold px-1 py-0.2">
                              Out of Service
                            </span>
                          )}
                        </div>
                      </div>
                      <button
                        className="btn-danger !p-1.5 text-xs"
                        aria-label={`Delete vehicle ${v.id}`}
                        onClick={() => setDel({ kind: 'vehicle', id: v.id, name: `Vehicle ${v.id}` })}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>

          <div className="lg:col-span-6">
            <form onSubmit={addVehicle} className="card p-5 space-y-3.5 border-line shadow-card">
              <div>
                <h3 className="text-sm font-semibold text-ink">Register Vehicle</h3>
                <p className="text-xs text-ink-soft mt-0.5">Assign a delivery vehicle with payload constraints and operational shifts.</p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Stationed Depot" required>
                  <select
                    className="input"
                    value={veh.depot_id}
                    onChange={(e) => setVeh({ ...veh, depot_id: e.target.value })}
                  >
                    <option value="">Select Depot…</option>
                    {depots.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="Payload Capacity (kg)" required>
                  <input
                    className="input"
                    type="number"
                    min="1"
                    placeholder="e.g. 120"
                    value={veh.capacity_kg}
                    onChange={(e) => setVeh({ ...veh, capacity_kg: e.target.value })}
                  />
                </Field>

                <Field label="Shift Start Time">
                  <input
                    className="input"
                    type="time"
                    value={veh.available_from}
                    onChange={(e) => setVeh({ ...veh, available_from: e.target.value })}
                  />
                </Field>

                <Field label="Shift End Time" required>
                  <input
                    className="input"
                    type="time"
                    value={veh.available_to}
                    onChange={(e) => setVeh({ ...veh, available_to: e.target.value })}
                  />
                </Field>
              </div>

              {err.veh && <p className="text-xs font-medium text-urgent">{err.veh}</p>}

              <Button type="submit" loading={busy === 'veh'} className="btn-primary w-full !py-2 text-xs sm:text-sm">
                <Plus className="h-4 w-4" />
                <span>Add Vehicle to Fleet</span>
              </Button>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Dialog */}
      <ConfirmDialog
        open={!!del}
        title={`Delete ${del?.name}?`}
        message="Active plans utilizing this asset will need to be recomputed."
        confirmLabel="Confirm Delete"
        onConfirm={remove}
        onCancel={() => setDel(null)}
        loading={busy === 'del'}
      />
    </div>
  )
}
