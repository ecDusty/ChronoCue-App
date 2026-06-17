import { useCallback, useEffect, useRef, useState } from 'react'
import type { TimerStatus } from '../types'

export interface UseTimerReturn {
  remaining: number
  totalSeconds: number
  status: TimerStatus
  start: () => void
  pause: () => void
  reset: () => void
  setTime: (seconds: number) => void
  addTime: (seconds: number) => void
  overtimeSeconds: number
}

export function useTimer(): UseTimerReturn {
  const [totalSeconds, setTotalSeconds] = useState(0)
  const [remainingMs, setRemainingMs] = useState(0)
  const [status, setStatus] = useState<TimerStatus>('idle')
  const [overtimeSeconds, setOvertimeSeconds] = useState(0)

  const mainInterval = useRef<ReturnType<typeof window.setInterval> | null>(null)
  const overtimeInterval = useRef<ReturnType<typeof window.setInterval> | null>(null)
  const targetTs = useRef(0)
  const overtimeStartTs = useRef(0)
  const initialSecondsRef = useRef(0)

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

  const addTime = useCallback((seconds: number) => {
    const deltaMs = seconds * 1000
    setRemainingMs(prev => {
      const next = Math.max(0, prev + deltaMs)
      if (status === 'running') targetTs.current += deltaMs
      return next
    })
    setTotalSeconds(prev => Math.max(0, prev + seconds))
  }, [status])

  useEffect(() => () => { clearMain(); clearOvertime() }, [clearMain, clearOvertime])

  return { remaining, totalSeconds, status, start, pause, reset, setTime, addTime, overtimeSeconds }
}
