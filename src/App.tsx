import { useCallback, useEffect, useRef, useState } from 'react'
import { Play, Pause, RotateCcw, Settings, List, Timer, SkipForward, SkipBack } from 'lucide-react'

import { useTimer } from './hooks/useTimer'
import { useSettings, useSoundLibrary, DEFAULT_GONG_ID } from './hooks/useSettings'
import { unlockAudio, playDefaultGong, playCustomSound, stopCurrentSound } from './utils/audio'
import { TimerDisplay } from './components/TimerDisplay'
import { TimeInput } from './components/TimeInput'
import { TimeAdjust } from './components/TimeAdjust'
import { TimeEditorModal } from './components/TimeEditorModal'
import { AgendaProgress } from './components/AgendaProgress'
import { AgendaEditor } from './components/AgendaEditor'
import { SettingsPanel } from './components/SettingsPanel'
import { ModeSwitchModal } from './components/ModeSwitchModal'
import { LanguageSelector } from './components/LanguageSelector'
import { RestoreSessionModal } from './components/RestoreSessionModal'
import { useT } from './i18n/I18nProvider'
import { loadSession, saveSession, clearSession, SESSION_VERSION } from './utils/storage'
import { idbGet, idbSet, idbClear } from './utils/idb'

import type { AgendaItem, TimerMode, SessionState, TimerSnapshot, SoundClip } from './types'

/** A saved session is worth prompting about only if a timer is set/active or an agenda exists. */
function hasMeaningfulSession(s: SessionState | null | undefined): boolean {
  if (!s) return false
  const active = (t: TimerSnapshot) => t.status !== 'idle' || t.remainingMs > 0 || t.targetTs > 0
  return active(s.simpleTimer) || active(s.agendaTimer) || s.agendaItems.length > 0
}

/** True if a hydrated snapshot is (or becomes, having run out while away) ended. */
function isHydratedEnded(t: TimerSnapshot | undefined): boolean {
  if (!t) return false
  return t.status === 'ended' || (t.status === 'running' && t.targetTs <= Date.now())
}

interface SegmentClickState {
  focus: 'h' | 'm' | 's'
}

export function App() {
  // Read the persisted session once, synchronously, to hydrate everything below.
  const sessionRef = useRef<SessionState | null | undefined>(undefined)
  if (sessionRef.current === undefined) sessionRef.current = loadSession()
  const session = sessionRef.current

  const simpleTimer = useTimer(session?.simpleTimer)
  const agendaTimer = useTimer(session?.agendaTimer)
  // Simple and Agenda keep fully independent global settings; the sound library is shared.
  const simpleSettings = useSettings(session?.simpleSettings)
  const agendaSettings = useSettings(session?.agendaSettings)
  const soundLib = useSoundLibrary() // hydrated asynchronously from IndexedDB below

  const [mode, setMode] = useState<TimerMode>(session?.mode ?? 'simple')
  const [showSettings, setShowSettings] = useState(false)
  const [showAgendaEditor, setShowAgendaEditor] = useState(false)
  const [agendaItems, setAgendaItems] = useState<AgendaItem[]>(session?.agendaItems ?? [])
  const [agendaIndex, setAgendaIndex] = useState(session?.agendaIndex ?? 0)
  const [agendaStarted, setAgendaStarted] = useState(session?.agendaStarted ?? false)
  const [timeEditorState, setTimeEditorState] = useState<SegmentClickState | null>(null)
  const [pendingMode, setPendingMode] = useState<TimerMode | null>(null)
  const [suppressSwitchWarning, setSuppressSwitchWarning] = useState(session?.suppressSwitchWarning ?? false)
  const [showRestore, setShowRestore] = useState(() => hasMeaningfulSession(session))
  const [mediaLoaded, setMediaLoaded] = useState(false)

  // Active timer + settings routed to the UI; the other mode keeps its own state.
  const timer = mode === 'simple' ? simpleTimer : agendaTimer
  const { remaining, totalSeconds, status, start, pause, reset, setTime, addTime, overtimeSeconds } = timer
  const activeSettings = mode === 'simple' ? simpleSettings : agendaSettings
  const { settings, updateSetting, setBgImage } = activeSettings
  const t = useT()

  // Per-item remaining time (seconds), keyed by item id, so navigating away from
  // an item and back restores its paused progress. `agendaLiveRemaining` mirrors
  // the agenda timer's current remaining for capture at navigation time.
  const agendaRemaining = useRef<Record<string, number>>(session?.agendaRemaining ?? {})
  const agendaLiveRemaining = useRef(0)
  agendaLiveRemaining.current = agendaTimer.remaining

  const audioUnlocked = useRef(false)
  // Don't replay the gong on load for a timer that was already ended / ran out while away.
  const simpleEndHandled = useRef(isHydratedEnded(session?.simpleTimer))
  const agendaEndHandled = useRef(isHydratedEnded(session?.agendaTimer))

  const ensureAudioUnlocked = useCallback(() => {
    if (!audioUnlocked.current) {
      unlockAudio()
      audioUnlocked.current = true
    }
  }, [])

  // --- Persistence ---------------------------------------------------------
  // IndexedDB is only ever touched when media (uploaded sounds / background
  // images) exists. A media-free session never opens or writes IndexedDB.
  const hasMedia = soundLib.sounds.length > 0 || !!simpleSettings.settings.bgImage || !!agendaSettings.settings.bgImage
  const mediaTouched = useRef(!!session?.hasMedia)

  // On mount, load media from IndexedDB — but only if the saved session had any.
  useEffect(() => {
    if (!session?.hasMedia) { setMediaLoaded(true); return }
    let cancelled = false
    Promise.all([
      idbGet<SoundClip[]>('sounds'),
      idbGet<string | null>('bg:simple'),
      idbGet<string | null>('bg:agenda'),
    ]).then(([sounds, bgSimple, bgAgenda]) => {
      if (cancelled) return
      if (sounds && sounds.length) soundLib.replaceSounds(sounds)
      if (bgSimple) simpleSettings.setBgImageUrl(bgSimple)
      if (bgAgenda) agendaSettings.setBgImageUrl(bgAgenda)
      setMediaLoaded(true)
    })
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Persist lightweight session to localStorage (bgImage stripped — it lives in IDB).
  const sessionSnapshot: SessionState = {
    version: SESSION_VERSION,
    hasMedia,
    mode,
    suppressSwitchWarning,
    agendaItems,
    agendaIndex,
    agendaStarted,
    agendaRemaining: agendaRemaining.current,
    simpleSettings: { ...simpleSettings.settings, bgImage: null },
    agendaSettings: { ...agendaSettings.settings, bgImage: null },
    simpleTimer: simpleTimer.snapshot,
    agendaTimer: agendaTimer.snapshot,
  }
  const sessionJson = JSON.stringify(sessionSnapshot)
  useEffect(() => {
    saveSession(JSON.parse(sessionJson) as SessionState)
  }, [sessionJson])

  // Persist media to IndexedDB only once media has actually existed — and only
  // after the initial load, so the empty initial state never overwrites it.
  useEffect(() => {
    if (!mediaLoaded) return
    if (!hasMedia && !mediaTouched.current) return // nothing stored, nothing ever uploaded → don't touch IDB
    mediaTouched.current = true
    idbSet('sounds', soundLib.sounds)
    idbSet('bg:simple', simpleSettings.settings.bgImage)
    idbSet('bg:agenda', agendaSettings.settings.bgImage)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mediaLoaded, hasMedia, soundLib.sounds, simpleSettings.settings.bgImage, agendaSettings.settings.bgImage])

  const startFresh = useCallback(async () => {
    clearSession()
    await idbClear()
    window.location.reload()
  }, [])
  // -------------------------------------------------------------------------

  // Effective settings for the visible timer: the active agenda item's overrides
  // (if any) merged over the globals. Simple mode always uses the globals.
  const activeItem = mode === 'agenda' ? agendaItems[agendaIndex] : undefined
  const ov = activeItem?.overrides
  const effShowOvertime = ov?.showOvertime ?? settings.showOvertime
  const effFadeEffect = ov?.fadeEffect ?? settings.fadeEffect

  const playGongSound = useCallback((playGong: boolean, gongSoundId: string) => {
    if (!playGong) return
    if (gongSoundId === DEFAULT_GONG_ID) {
      playDefaultGong()
      return
    }
    const clip = soundLib.sounds.find(s => s.id === gongSoundId)
    if (clip) playCustomSound(clip.dataUrl)
    else playDefaultGong()
  }, [soundLib.sounds])

  // Simple timer end: play the Simple-mode global gong.
  useEffect(() => {
    if (simpleTimer.status === 'running') simpleEndHandled.current = false
    if (simpleTimer.status === 'ended' && !simpleEndHandled.current) {
      simpleEndHandled.current = true
      playGongSound(simpleSettings.settings.playGong, simpleSettings.settings.gongSoundId)
    }
  }, [simpleTimer.status, playGongSound, simpleSettings.settings.playGong, simpleSettings.settings.gongSoundId])

  // Agenda timer end: play the ended item's effective gong (item overrides over
  // the Agenda globals). Items do NOT auto-advance — the user clicks "Next".
  useEffect(() => {
    if (agendaTimer.status === 'running') agendaEndHandled.current = false
    if (agendaTimer.status !== 'ended' || agendaEndHandled.current) return
    agendaEndHandled.current = true
    const endedOv = agendaItems[agendaIndex]?.overrides
    const g = agendaSettings.settings
    playGongSound(endedOv?.playGong ?? g.playGong, endedOv?.gongSoundId ?? g.gongSoundId)
  }, [agendaTimer.status, agendaIndex, agendaItems, playGongSound, agendaSettings.settings.playGong, agendaSettings.settings.gongSoundId])

  const startAgenda = useCallback(() => {
    if (agendaItems.length === 0) return
    stopCurrentSound()
    agendaRemaining.current = {} // fresh run — clear any saved per-item progress
    setAgendaStarted(true)
    setAgendaIndex(0)
    agendaEndHandled.current = false
    agendaTimer.setTimeAndStart(agendaItems[0].durationSeconds)
  }, [agendaItems, agendaTimer.setTimeAndStart])

  // Navigate to another agenda item: save the current item's remaining (pausing
  // its progress) and load the target's saved remaining — or its full duration if
  // untouched — WITHOUT starting it. The user presses Start when ready.
  const goToAgendaItem = useCallback((index: number) => {
    if (index < 0 || index >= agendaItems.length) return
    stopCurrentSound()
    const currentItem = agendaItems[agendaIndex]
    if (currentItem) agendaRemaining.current[currentItem.id] = agendaLiveRemaining.current
    const target = agendaItems[index]
    const saved = agendaRemaining.current[target.id]
    setAgendaIndex(index)
    agendaEndHandled.current = false
    agendaTimer.setTime(saved ?? target.durationSeconds)
  }, [agendaItems, agendaIndex, agendaTimer.setTime])

  const advanceAgenda = useCallback(() => goToAgendaItem(agendaIndex + 1), [goToAgendaItem, agendaIndex])
  const previousAgenda = useCallback(() => goToAgendaItem(agendaIndex - 1), [goToAgendaItem, agendaIndex])

  const handleReset = useCallback(() => {
    stopCurrentSound()
    if (mode === 'agenda') {
      // Reset the current section to its original full duration and discard its
      // saved progress (stays on this item).
      const item = agendaItems[agendaIndex]
      if (item) delete agendaRemaining.current[item.id]
      agendaTimer.setTime(item?.durationSeconds ?? 0)
      agendaEndHandled.current = false
    } else {
      reset()
    }
  }, [mode, agendaItems, agendaIndex, agendaTimer.setTime, reset])

  // Only the active mode's timer may run. Whenever the mode changes, pause the
  // now-inactive timer if it is still counting; it stays paused until the user
  // returns and resumes it manually (no auto-resume).
  useEffect(() => {
    const inactive = mode === 'simple' ? agendaTimer : simpleTimer
    if (inactive.status === 'running') inactive.pause()
  }, [mode, simpleTimer.status, agendaTimer.status, simpleTimer.pause, agendaTimer.pause])

  const performSwitch = useCallback((target: TimerMode) => {
    setMode(target)
    setPendingMode(null)
  }, [])

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
      '[data-testid="language-selector"]',
      '[data-testid="restore-session-modal"]',
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
  // Agenda Prev/Next navigation is available once a run has started (i.e. not the
  // initial pre-start state where only "Start Agenda" shows).
  const agendaNavVisible = mode === 'agenda' && agendaItems.length > 0 && agendaStarted

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

      {/* Header (z-30 so the language dropdown sits above the z-10 main content) */}
      <header className="relative z-30 flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-0.5 bg-white/5 rounded-lg p-0.5">
          <button
            className={`flex items-center gap-1 px-2 py-1 rounded-md text-[15px] font-medium transition-colors ${
              mode === 'simple' ? 'bg-teal-600/30 text-teal-300' : 'text-teal-400/40 hover:text-teal-300/70'
            }`}
            onClick={() => requestModeSwitch('simple')}
            data-testid="button-mode-simple"
          >
            <Timer size={15} />
            {t('mode.simple')}
          </button>
          <button
            className={`flex items-center gap-1 px-2 py-1 rounded-md text-[15px] font-medium transition-colors ${
              mode === 'agenda' ? 'bg-teal-600/30 text-teal-300' : 'text-teal-400/40 hover:text-teal-300/70'
            }`}
            onClick={() => requestModeSwitch('agenda')}
            data-testid="button-mode-agenda"
          >
            <List size={15} />
            {t('mode.agenda')}
          </button>
        </div>

        <div className="flex items-center gap-2">
          {mode === 'agenda' && (
            <button
              className="flex items-center justify-center w-8 h-8 rounded-lg bg-white/5 hover:bg-white/15 text-white/40 transition-colors"
              onClick={() => setShowAgendaEditor(true)}
              data-testid="button-edit-agenda"
            >
              <List size={20} />
            </button>
          )}
          <div className="mr-8">
            <LanguageSelector />
          </div>
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
              <p className="text-white/50 text-lg">{t('controls.noAgendaItems')}</p>
              <button
                className="touch-button px-6 py-3 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-medium text-base transition-colors"
                onClick={() => setShowAgendaEditor(true)}
                data-testid="button-create-agenda"
              >
                {t('controls.createAgenda')}
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
                fadeEffect={effFadeEffect}
                timerSize={settings.timerSize}
                fontFamily={settings.fontFamily}
                overtimeSeconds={overtimeSeconds}
                showOvertime={effShowOvertime}
                onSegmentClick={handleSegmentClick}
              />
            </div>

            <div className="flex flex-col items-center gap-3 pb-[6vh] shrink-0">
              {(status === 'idle' || status === 'running' || status === 'paused') && (
                <TimeAdjust remaining={remaining} onAdd={addTime} status={status} />
              )}

              <div className="flex items-center gap-2">
                {agendaNavVisible && agendaIndex > 0 && (
                  <button
                    className="touch-button flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium text-sm transition-colors"
                    onClick={previousAgenda}
                    data-testid="button-prev-item"
                  >
                    <SkipBack size={14} />
                    {t('controls.prev')}
                  </button>
                )}
                {status === 'idle' && remaining > 0 && (
                  <button
                    className="touch-button flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 active:bg-teal-400 text-white font-semibold text-sm transition-colors"
                    onClick={start}
                    data-testid="button-start"
                  >
                    <Play size={14} />
                    {t('controls.start')}
                  </button>
                )}
                {status === 'running' && (
                  <button
                    className="touch-button flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 active:bg-amber-400 text-white font-semibold text-sm transition-colors"
                    onClick={pause}
                    data-testid="button-pause"
                  >
                    <Pause size={14} />
                    {t('controls.pause')}
                  </button>
                )}
                {status === 'paused' && (
                  <button
                    className="touch-button flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-semibold text-sm transition-colors"
                    onClick={start}
                    data-testid="button-resume"
                  >
                    <Play size={14} />
                    {t('controls.resume')}
                  </button>
                )}
                {((mode === 'simple' && (status === 'paused' || status === 'ended')) || agendaNavVisible) && (
                  <button
                    className="touch-button flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium text-sm transition-colors"
                    onClick={handleReset}
                    data-testid="button-reset"
                  >
                    <RotateCcw size={13} />
                    {t('controls.reset')}
                  </button>
                )}
                {agendaNavVisible && agendaIndex < agendaItems.length - 1 && (
                  <button
                    className="touch-button flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 active:bg-teal-400 text-white font-semibold text-sm transition-colors"
                    onClick={advanceAgenda}
                    data-testid="button-next-item"
                  >
                    <SkipForward size={14} />
                    {t('controls.next')}
                  </button>
                )}
                {status === 'idle' && remaining > 0 && mode === 'simple' && (
                  <button
                    className="touch-button flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white/70 font-medium text-xs transition-colors"
                    onClick={() => setTime(0)}
                    data-testid="button-clear"
                  >
                    {t('controls.clear')}
                  </button>
                )}
              </div>

              {mode === 'agenda' && !agendaStarted && agendaItems.length > 0 && (
                <button
                  className="touch-button flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-semibold text-sm transition-colors"
                  onClick={startAgenda}
                  data-testid="button-start-agenda"
                >
                  <Play size={14} />
                  {t('controls.startAgenda')}
                </button>
              )}
            </div>
          </>
        )}
      </main>

      {/* Overlays. AgendaEditor renders before SettingsPanel so the settings
          panel (opened from inside the editor) stacks on top. */}
      {showAgendaEditor && (
        <AgendaEditor
          items={agendaItems}
          settings={agendaSettings.settings}
          sounds={soundLib.sounds}
          addSound={soundLib.addSound}
          onOpenSettings={() => setShowSettings(true)}
          onUpdate={items => {
            setAgendaItems(items)
            setAgendaIndex(0)
            setAgendaStarted(false)
            agendaRemaining.current = {}
          }}
          onClose={() => setShowAgendaEditor(false)}
        />
      )}

      {showSettings && (
        <SettingsPanel
          title={mode === 'agenda' ? t('settings.titleAgenda') : t('settings.titleSimple')}
          settings={settings}
          updateSetting={updateSetting}
          setBgImage={setBgImage}
          sounds={soundLib.sounds}
          addSound={soundLib.addSound}
          removeSound={soundLib.removeSound}
          onClose={() => setShowSettings(false)}
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

      {showRestore && (
        <RestoreSessionModal
          onContinue={() => setShowRestore(false)}
          onStartFresh={startFresh}
        />
      )}
    </div>
  )
}
