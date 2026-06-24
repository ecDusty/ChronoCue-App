import { useCallback, useEffect, useRef, useState } from 'react'
import type { TimerStatus, TimerSnapshot } from '../types'

export interface UseTimerReturn {
  remaining: number
  totalSeconds: number
  status: TimerStatus
  start: () => void
  pause: () => void
  reset: () => void
  setTime: (seconds: number) => void
  /** Set the duration and begin counting in one atomic call (no stale state). */
  setTimeAndStart: (seconds: number) => void
  addTime: (seconds: number) => void
  overtimeSeconds: number
  /** Serializable, tick-stable snapshot for persistence. */
  snapshot: TimerSnapshot
}

interface Hydrated {
  status: TimerStatus
  remainingMs: number
  overtimeSeconds: number
  targetTs: number
  overtimeStartTs: number
}

/** Resolve persisted state into live state at load (running keeps counting). */
function hydrate(init?: TimerSnapshot): Hydrated {
  if (!init) return { status: 'idle', remainingMs: 0, overtimeSeconds: 0, targetTs: 0, overtimeStartTs: 0 }
  const now = Date.now()
  if (init.status === 'running') {
    const remMs = init.targetTs - now
    if (remMs > 0) return { status: 'running', remainingMs: remMs, overtimeSeconds: 0, targetTs: init.targetTs, overtimeStartTs: 0 }
    // It would have hit zero while the page was closed → come back in overtime.
    return { status: 'ended', remainingMs: 0, overtimeSeconds: Math.max(0, Math.floor((now - init.targetTs) / 1000)), targetTs: init.targetTs, overtimeStartTs: init.targetTs }
  }
  if (init.status === 'ended') {
    const ost = init.overtimeStartTs || 0
    return { status: 'ended', remainingMs: 0, overtimeSeconds: ost ? Math.max(0, Math.floor((now - ost) / 1000)) : 0, targetTs: 0, overtimeStartTs: ost }
  }
  return { status: init.status, remainingMs: Math.max(0, init.remainingMs), overtimeSeconds: 0, targetTs: 0, overtimeStartTs: 0 }
}

export function useTimer(init?: TimerSnapshot): UseTimerReturn {
  const hydratedRef = useRef<Hydrated | null>(null)
  if (hydratedRef.current === null) hydratedRef.current = hydrate(init)
  const h = hydratedRef.current

  const [totalSeconds, setTotalSeconds] = useState(init?.totalSeconds ?? 0)
  const [remainingMs, setRemainingMs] = useState(h.remainingMs)
  const [status, setStatus] = useState<TimerStatus>(h.status)
  const [overtimeSeconds, setOvertimeSeconds] = useState(h.overtimeSeconds)

  const mainInterval = useRef<ReturnType<typeof window.setInterval> | null>(null)
  const overtimeInterval = useRef<ReturnType<typeof window.setInterval> | null>(null)
  const targetTs = useRef(h.targetTs)
  const overtimeStartTs = useRef(h.overtimeStartTs)
  const initialSecondsRef = useRef(init?.initialSeconds ?? 0)

  const remaining = Math.ceil(remainingMs / 1000)

  const clearMain = useCallback(() => {
    if (mainInterval.current !== null) {
      clearInterval(mainInterval.current)
      mainInterval.current = null
    }
  }, [])

  const clearOvertime = useCallback(() => {
    if (overtimeInterval.current !== null) {
      clearInterval(overtimeInterval.current)
      overtimeInterval.current = null
    }
  }, [])

  const startOvertimeInterval = useCallback(() => {
    clearOvertime()
    overtimeInterval.current = window.setInterval(() => {
      if (overtimeStartTs.current > 0) {
        setOvertimeSeconds(Math.floor((Date.now() - overtimeStartTs.current) / 1000))
      }
    }, 200)
  }, [clearOvertime])

  const tick = useCallback(() => {
    const ms = Math.max(0, targetTs.current - Date.now())
    setRemainingMs(ms)
    if (ms <= 0) {
      clearMain()
      overtimeStartTs.current = targetTs.current
      setStatus('ended')
      startOvertimeInterval()
    }
  }, [clearMain, startOvertimeInterval])

  const start = useCallback(() => {
    if (remainingMs <= 0) return
    clearMain()
    targetTs.current = Date.now() + remainingMs
    setStatus('running')
    tick()
    mainInterval.current = window.setInterval(tick, 200)
  }, [remainingMs, clearMain, tick])

  const pause = useCallback(() => {
    clearMain()
    setRemainingMs(Math.max(0, targetTs.current - Date.now()))
    setStatus('paused')
  }, [clearMain])

  const reset = useCallback(() => {
    clearMain()
    clearOvertime()
    overtimeStartTs.current = 0
    setOvertimeSeconds(0)
    const secs = initialSecondsRef.current
    setTotalSeconds(secs)
    setRemainingMs(secs * 1000)
    setStatus('idle')
  }, [clearMain, clearOvertime])

  const setTime = useCallback((seconds: number) => {
    clearMain()
    clearOvertime()
    overtimeStartTs.current = 0
    setOvertimeSeconds(0)
    const secs = Math.max(0, seconds)
    initialSecondsRef.current = secs
    setTotalSeconds(secs)
    setRemainingMs(secs * 1000)
    setStatus('idle')
  }, [clearMain, clearOvertime])

  const setTimeAndStart = useCallback((seconds: number) => {
    clearMain()
    clearOvertime()
    overtimeStartTs.current = 0
    setOvertimeSeconds(0)
    const secs = Math.max(0, seconds)
    initialSecondsRef.current = secs
    setTotalSeconds(secs)
    const ms = secs * 1000
    setRemainingMs(ms)
    if (ms <= 0) {
      setStatus('idle')
      return
    }
    targetTs.current = Date.now() + ms
    setStatus('running')
    mainInterval.current = window.setInterval(tick, 200)
  }, [clearMain, clearOvertime, tick])

  const addTime = useCallback((seconds: number) => {
    const deltaMs = seconds * 1000
    setRemainingMs(prev => {
      const next = Math.max(0, prev + deltaMs)
      if (status === 'running') targetTs.current += deltaMs
      return next
    })
    setTotalSeconds(prev => Math.max(0, prev + seconds))
  }, [status])

  // On mount, resume intervals for a hydrated running/ended timer.
  useEffect(() => {
    if (h.status === 'running') {
      mainInterval.current = window.setInterval(tick, 200)
      tick()
    } else if (h.status === 'ended') {
      startOvertimeInterval()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => () => { clearMain(); clearOvertime() }, [clearMain, clearOvertime])

  const snapshot: TimerSnapshot = {
    status,
    totalSeconds,
    initialSeconds: initialSecondsRef.current,
    remainingMs: status === 'running' || status === 'ended' ? 0 : remainingMs,
    targetTs: status === 'running' ? targetTs.current : 0,
    overtimeStartTs: status === 'ended' ? overtimeStartTs.current : 0,
  }

  return { remaining, totalSeconds, status, start, pause, reset, setTime, setTimeAndStart, addTime, overtimeSeconds, snapshot }
}
