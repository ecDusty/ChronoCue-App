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

import type { AgendaItem, TimerMode } from './types'

interface SegmentClickState {
  focus: 'h' | 'm' | 's'
}

export function App() {
  const { remaining, totalSeconds, status, start, pause, reset, setTime, addTime, overtimeSeconds } = useTimer()
  const { settings, updateSetting, setBgImage, setCustomGong } = useSettings()

  const [mode, setMode] = useState<TimerMode>('simple')
  const [showSettings, setShowSettings] = useState(false)
  const [showAgendaEditor, setShowAgendaEditor] = useState(false)
  const [agendaItems, setAgendaItems] = useState<AgendaItem[]>([])
  const [agendaIndex, setAgendaIndex] = useState(0)
  const [timeEditorState, setTimeEditorState] = useState<SegmentClickState | null>(null)

  const audioUnlocked = useRef(false)
  const endHandled = useRef(false)

  const ensureAudioUnlocked = useCallback(() => {
    if (!audioUnlocked.current) {
      unlockAudio()
      audioUnlocked.current = true
    }
  }, [])

  // Handle end-of-timer: play gong + advance agenda
  useEffect(() => {
    if (status !== 'ended' || endHandled.current) return
    endHandled.current = true

    if (settings.playGong) {
      if (settings.gongSource === 'custom' && settings.customGongDataUrl) {
        playCustomSound(settings.customGongDataUrl)
      } else {
        playDefaultGong()
      }
    }

    if (mode === 'agenda' && agendaIndex < agendaItems.length - 1) {
      const t = setTimeout(() => {
        const nextIndex = agendaIndex + 1
        setAgendaIndex(nextIndex)
        setTime(agendaItems[nextIndex].durationSeconds)
        endHandled.current = false
        setTimeout(() => start(), 100)
      }, 2000)
      return () => clearTimeout(t)
    }
  }, [status, settings, mode, agendaIndex, agendaItems, setTime, start])

  // Clear end-handled flag when timer starts running again
  useEffect(() => {
    if (status === 'running') endHandled.current = false
  }, [status])

  const startAgenda = useCallback(() => {
    if (agendaItems.length === 0) return
    setAgendaIndex(0)
    setTime(agendaItems[0].durationSeconds)
    endHandled.current = false
    setTimeout(() => start(), 50)
  }, [agendaItems, setTime, start])

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
            onClick={() => setMode('simple')}
            data-testid="button-mode-simple"
          >
            <Timer size={11} />
            Simple
          </button>
          <button
            className={`flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium transition-colors ${
              mode === 'agenda' ? 'bg-teal-600/30 text-teal-300' : 'text-teal-400/40 hover:text-teal-300/70'
            }`}
            onClick={() => setMode('agenda')}
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
    </div>
  )
}
