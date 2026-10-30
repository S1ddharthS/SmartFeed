import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { api, detectBackend, getMode, setMode, setToken } from '../api/client'
import { DEMO_DAY_MS, setMockClock } from '../api/mock'

const Ctx = createContext(null)
export const useApp = () => useContext(Ctx)

export function AppProvider({ children }) {
  const [user, setUser] = useState(() => { try { return JSON.parse(localStorage.getItem('smartfeed_user')) } catch { return null } })
  const [ready, setReady] = useState(false)
  const [live, setLive] = useState(false)
  const [demoMin, setDemoMin] = useState(13 * 60) // preview clock, demo mode only
  const [realNow, setRealNow] = useState(Date.now())
  const [toasts, setToasts] = useState([])
  const tid = useRef(0)

  useEffect(() => { detectBackend().then((l) => { setLive(l); setReady(true) }) }, [])
  useEffect(() => { const i = setInterval(() => setRealNow(Date.now()), 30000); return () => clearInterval(i) }, [])
  useEffect(() => { setMockClock(demoMin) }, [demoMin])

  const toast = useCallback((message, kind = 'success') => {
    const id = ++tid.current
    setToasts((t) => [...t, { id, message, kind }])
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4200)
  }, [])

  const signIn = useCallback(async (username, password) => {
    const res = await api.login(username, password)
    setToken(res.access_token)
    const u = { username: res.username, role: res.role }
    localStorage.setItem('smartfeed_user', JSON.stringify(u)); setUser(u)
    return u
  }, [])
  const signOut = useCallback(() => { setToken(''); localStorage.removeItem('smartfeed_user'); setUser(null) }, [])

  const switchMode = useCallback(async (next) => {
    setMode(next); const l = await detectBackend(); setLive(l)
    if (next === 'live' && !l) toast('Backend not reachable yet', 'error')
    return l
  }, [toast])

  // "now" used for countdowns and urgency chips
  const nowMs = live ? realNow : DEMO_DAY_MS + demoMin * 60000

  const value = useMemo(() => ({ user, signIn, signOut, ready, live, mode: getMode().pref, switchMode, demoMin, setDemoMin, nowMs, toast, toasts, setToasts }),
    [user, signIn, signOut, ready, live, switchMode, demoMin, nowMs, toast, toasts])
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

/** Items that belong to the signed-in user (admins see everything). */
export function isMine(item, user, kind) {
  if (!user) return false
  if (user.role === 'admin') return true
  if (item.owner) return item.owner === user.username
  // seeded demo accounts on the real backend (rows carry no owner field)
  if (user.username === 'greenleaf' && /green leaf/i.test(item.donor_name || '')) return true
  if (user.username === 'hopeshelter' && /hope/i.test(item.receiver_name || '')) return true
  const mine = JSON.parse(localStorage.getItem(`smartfeed_mine_${kind}_${user.username}`) || '[]')
  return mine.includes(item.id)
}
export function rememberMine(kind, user, id) {
  const k = `smartfeed_mine_${kind}_${user.username}`
  const cur = JSON.parse(localStorage.getItem(k) || '[]')
  localStorage.setItem(k, JSON.stringify([...cur, id]))
}
