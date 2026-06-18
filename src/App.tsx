import { useCallback, useEffect, useRef, useState } from 'react'
import { Play, Pause, RotateCcw, Settings, List, Timer } from 'lucide-react'

import { useTimer } from './hooks/useTimer'
import { useSettings } from './hooks/useSettings'
import { unlockAudio, playDefaultGong, playCustomSound } from './utils/audio'
import { TimerDisplay } from './components/TimerDisplay'
import { TimeInput } from './components/TimeInput'
import { TimeAdjust } from './components/TimeAdjust'
import { TimeEditorModal } from './components/TimeEditorModal'
import { AgendaProgress } from './components/AgendaProgress'
import { AgendaEditor } from './components/AgendaEditor'
import { SettingsPanel } from './components/SettingsPanel'
import { ModeSwitchModal } from './components/ModeSwitchModal'

import type { AgendaItem, TimerMode } from './types'

interface SegmentClickState {
  focus: 'h' | 'm' | 's'
}

export function App() {
  const simpleTimer = useTimer()
  const agendaTimer = useTimer()
  const { settings, updateSetting, setBgImage, setCustomGong } = useSettings()

  const [mode, setMode] = useState<TimerMode>('simple')
  const [showSettings, setShowSettings] = useState(false)
  const [showAgendaEditor, setShowAgendaEditor] = useState(false)
  const [agendaItems, setAgendaItems] = useState<AgendaItem[]>([])
  const [agendaIndex, setAgendaIndex] = useState(0)
  const [timeEditorState, setTimeEditorState] = useState<SegmentClickState | null>(null)
  const [pendingMode, setPendingMode] = useState<TimerMode | null>(null)
  const [suppressSwitchWarning, setSuppressSwitchWarning] = useState(false)

  // Active timer routed to the UI; the other keeps its own independent state.
  const timer = mode === 'simple' ? simpleTimer : agendaTimer
  const { remaining, totalSeconds, status, start, pause, reset, setTime, addTime, overtimeSeconds } = timer

  const audioUnlocked = useRef(false)
  const simpleEndHandled = useRef(false)
  const agendaEndHandled = useRef(false)
  // Timers paused because their mode was switched away from should resume on return.
  const autoResume = useRef<Record<TimerMode, boolean>>({ simple: false, agenda: false })
  // Mirror of `mode` for use inside delayed callbacks without stale closures.
  const modeRef = useRef(mode)
  modeRef.current = mode

  const ensureAudioUnlocked = useCallback(() => {
    if (!audioUnlocked.current) {
      unlockAudio()
      audioUnlocked.current = true
    }
  }, [])

  const playEndGong = useCallback(() => {
    if (!settings.playGong) return
    if (settings.gongSource === 'custom' && settings.customGongDataUrl) {
      playCustomSound(settings.customGongDataUrl)
    } else {
      playDefaultGong()
    }
  }, [settings.playGong, settings.gongSource, settings.customGongDataUrl])

  // Simple timer end: play gong. (No agenda advancement.)
  useEffect(() => {
    if (simpleTimer.status === 'running') simpleEndHandled.current = false
    if (simpleTimer.status === 'ended' && !simpleEndHandled.current) {
      simpleEndHandled.current = true
      playEndGong()
    }
  }, [simpleTimer.status, playEndGong])

  // Agenda timer end: play gong + advance to the next item after a short gap.
  useEffect(() => {
    if (agendaTimer.status === 'running') agendaEndHandled.current = false
    if (agendaTimer.status !== 'ended' || agendaEndHandled.current) return
    agendaEndHandled.current = true
    playEndGong()

    if (agendaIndex < agendaItems.length - 1) {
      const t = setTimeout(() => {
        const nextIndex = agendaIndex + 1
        setAgendaIndex(nextIndex)
        agendaTimer.setTime(agendaItems[nextIndex].durationSeconds)
        agendaEndHandled.current = false
        // If the user switched away during the gap, leave the next item paused
        // and let it resume when they return to agenda mode.
        if (modeRef.current === 'agenda') {
          setTimeout(() => agendaTimer.start(), 100)
        } else {
          autoResume.current.agenda = true
        }
      }, 2000)
      return () => clearTimeout(t)
    }
  }, [agendaTimer.status, agendaIndex, agendaItems, playEndGong, agendaTimer.setTime, agendaTimer.start])

  const startAgenda = useCallback(() => {
    if (agendaItems.length === 0) return
    setAgendaIndex(0)
    agendaTimer.setTime(agendaItems[0].durationSeconds)
    agendaEndHandled.current = false
    setTimeout(() => agendaTimer.start(), 50)
  }, [agendaItems, agendaTimer.setTime, agendaTimer.start])

  const performSwitch = useCallback((target: TimerMode) => {
    const leaving = mode === 'simple' ? simpleTimer : agendaTimer
    const entering = target === 'simple' ? simpleTimer : agendaTimer
    if (leaving.status === 'running') {
      autoResume.current[mode] = true
      leaving.pause()
    }
    if (autoResume.current[target] && entering.status === 'paused') {
      autoResume.current[target] = false
      entering.start()
    }
    setMode(target)
    setPendingMode(null)
  }, [mode, simpleTimer, agendaTimer])

  const requestModeSwitch = useCallback((target: TimerMode) => {
    if (target === mode) return
    const leaving = mode === 'simple' ? simpleTimer : agendaTimer
    if (leaving.status === 'running' && !suppressSwitchWarning) {
      setPendingMode(target)
    } else {
      performSwitch(target)
    }
  }, [mode, simpleTimer, agendaTimer, suppressSwitchWarning, performSwitch])

  const handleSegmentClick = useCallback((label: string) => {
    if (status === 'running') pause()
    setTimeEditorState({ focus: label as 'h' | 'm' | 's' })
  }, [status, pause])

  // Click anywhere on the page toggles play/pause (unless clicking interactive elements)
  const handlePageClick = useCallback((e: React.MouseEvent) => {
    ensureAudioUnlocked()
    const target = e.target as Element
    const interactive = [
      'button', 'input', 'select',
      '[data-testid="timer-segment-h"]',
      '[data-testid="timer-segment-m"]',
      '[data-testid="timer-segment-s"]',
      '[data-testid="settings-panel"]',
      '[data-testid="agenda-editor"]',
      '[data-testid="set-timer-overlay"]',
      '[data-testid="time-picker"]',
      '[data-testid="mode-switch-modal"]',
    ]
    if (interactive.some(sel => target.closest(sel))) return

    if (status === 'running') {
      pause()
    } else if (status === 'paused' || (status === 'idle' && remaining > 0)) {
      start()
    }
  }, [status, remaining, pause, start, ensureAudioUnlocked])

  const hasTime = totalSeconds > 0 || status !== 'idle'
  const showInlineTimePicker = mode === 'simple' && !hasTime

  const bgStyle: React.CSSProperties = {
    backgroundColor: settings.bgColor,
    ...(settings.bgImage
      ? { backgroundImage: `url(${settings.bgImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }
      : {}),
  }

  return (
    <div
      className="fixed inset-0 flex flex-col timer-bg-transition"
      style={bgStyle}
      onClick={handlePageClick}
      data-testid="timer-page"
    >
      {settings.bgImage && <div className="absolute inset-0 bg-black/40" />}

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-0.5 bg-white/5 rounded-lg p-0.5">
          <button
            className={`flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium transition-colors ${
              mode === 'simple' ? 'bg-teal-600/30 text-teal-300' : 'text-teal-400/40 hover:text-teal-300/70'
            }`}
            onClick={() => requestModeSwitch('simple')}
            data-testid="button-mode-simple"
          >
            <Timer size={11} />
            Simple
          </button>
          <button
            className={`flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium transition-colors ${
              mode === 'agenda' ? 'bg-teal-600/30 text-teal-300' : 'text-teal-400/40 hover:text-teal-300/70'
            }`}
            onClick={() => requestModeSwitch('agenda')}
            data-testid="button-mode-agenda"
          >
            <List size={11} />
            Agenda
          </button>
        </div>

        <div className="flex items-center gap-2">
          {mode === 'agenda' && (
            <button
              className="flex items-center justify-center w-7 h-7 rounded-lg bg-white/5 hover:bg-white/15 text-white/40 transition-colors"
              onClick={() => setShowAgendaEditor(true)}
              data-testid="button-edit-agenda"
            >
              <List size={13} />
            </button>
          )}
          <button
            className="flex items-center justify-center w-14 h-14 rounded-xl bg-white/5 hover:bg-white/15 text-teal-400/40 hover:text-teal-300/70 transition-colors"
            onClick={() => setShowSettings(true)}
            data-testid="button-settings"
          >
            <Settings size={26} />
          </button>
        </div>
      </header>

      {/* Main content */}
      <main className="relative z-10 flex-1 flex flex-col items-center px-4">
        {mode === 'agenda' && agendaItems.length > 0 && (
          <AgendaProgress items={agendaItems} currentIndex={agendaIndex} currentRemaining={remaining} />
        )}

        {showInlineTimePicker ? (
          <div className="flex-1 flex items-center justify-center w-full">
            <TimeInput onSet={setTime} initialFocus="m" />
          </div>
        ) : mode === 'agenda' && agendaItems.length === 0 ? (
          <div className="flex-1 flex items-center justify-center w-full">
            <div className="flex flex-col items-center gap-4">
              <p className="text-white/50 text-lg">No agenda items yet</p>
              <button
                className="touch-button px-6 py-3 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-medium text-base transition-colors"
                onClick={() => setShowAgendaEditor(true)}
                data-testid="button-create-agenda"
              >
                Create Agenda
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex-1 flex items-center justify-center w-full cursor-pointer">
              <TimerDisplay
                seconds={remaining}
                fontColor={settings.fontColor}
                status={status}
                fadeEffect={settings.fadeEffect}
                timerSize={settings.timerSize}
                fontFamily={settings.fontFamily}
                overtimeSeconds={overtimeSeconds}
                showOvertime={settings.showOvertime}
                onSegmentClick={handleSegmentClick}
              />
            </div>

            <div className="flex flex-col items-center gap-3 pb-[6vh] shrink-0">
              {(status === 'idle' || status === 'running' || status === 'paused') && (
                <TimeAdjust remaining={remaining} onAdd={addTime} status={status} />
              )}

              <div className="flex items-center gap-2">
                {status === 'idle' && remaining > 0 && (
                  <button
                    className="touch-button flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 active:bg-teal-400 text-white font-semibold text-sm transition-colors"
                    onClick={start}
                    data-testid="button-start"
                  >
                    <Play size={14} />
                    Start
                  </button>
                )}
                {status === 'running' && (
                  <button
                    className="touch-button flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 active:bg-amber-400 text-white font-semibold text-sm transition-colors"
                    onClick={pause}
                    data-testid="button-pause"
                  >
                    <Pause size={14} />
                    Pause
                  </button>
                )}
                {status === 'paused' && (
                  <button
                    className="touch-button flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-semibold text-sm transition-colors"
                    onClick={start}
                    data-testid="button-resume"
                  >
                    <Play size={14} />
                    Resume
                  </button>
                )}
                {(status === 'paused' || status === 'ended') && (
                  <button
                    className="touch-button flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium text-sm transition-colors"
                    onClick={() => (mode === 'agenda' ? startAgenda() : reset())}
                    data-testid="button-reset"
                  >
                    <RotateCcw size={13} />
                    Reset
                  </button>
                )}
                {status === 'idle' && remaining > 0 && mode === 'simple' && (
                  <button
                    className="touch-button flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white/70 font-medium text-xs transition-colors"
                    onClick={() => setTime(0)}
                    data-testid="button-clear"
                  >
                    Clear
                  </button>
                )}
              </div>

              {mode === 'agenda' && status === 'idle' && agendaItems.length > 0 && remaining === 0 && (
                <button
                  className="touch-button flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-semibold text-sm transition-colors"
                  onClick={startAgenda}
                  data-testid="button-start-agenda"
                >
                  <Play size={14} />
                  Start Agenda
                </button>
              )}
            </div>
          </>
        )}
      </main>

      {/* Overlays */}
      {showSettings && (
        <SettingsPanel
          settings={settings}
          updateSetting={updateSetting}
          setBgImage={setBgImage}
          setCustomGong={setCustomGong}
          onClose={() => setShowSettings(false)}
        />
      )}

      {showAgendaEditor && (
        <AgendaEditor
          items={agendaItems}
          onUpdate={items => { setAgendaItems(items); setAgendaIndex(0) }}
          onClose={() => setShowAgendaEditor(false)}
        />
      )}

      {timeEditorState && (
        <TimeEditorModal
          onSet={setTime}
          onClose={() => setTimeEditorState(null)}
          initialSeconds={remaining}
          initialFocus={timeEditorState.focus}
        />
      )}

      {pendingMode && (
        <ModeSwitchModal
          onCancel={() => setPendingMode(null)}
          onContinue={dontShowAgain => {
            if (dontShowAgain) setSuppressSwitchWarning(true)
            performSwitch(pendingMode)
          }}
        />
      )}
    </div>
  )
}
