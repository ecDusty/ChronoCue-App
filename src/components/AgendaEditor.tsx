import { useRef, useState } from 'react'
import { X, ChevronUp, ChevronDown, Trash2, SlidersHorizontal, Settings, FileUp } from 'lucide-react'
import type { AgendaItem, AgendaItemOverrides, AppSettings, SoundClip } from '../types'
import { parseSeconds } from '../utils/time'
import { parseAgendaFile } from '../utils/agendaImport'
import { Toggle } from './Toggle'
import { SoundSelector } from './SoundSelector'

interface Props {
  items: AgendaItem[]
  settings: AppSettings
  sounds: SoundClip[]
  addSound: (file: File, onAdded?: (id: string) => void) => void
  onOpenSettings: () => void
  onUpdate: (items: AgendaItem[]) => void
  onClose: () => void
}

function secondsToInputs(total: number) {
  const { hours, minutes, secs } = parseSeconds(total)
  return { h: hours > 0 ? String(hours) : '', m: String(minutes), s: String(secs) }
}

function inputsToSeconds(h: string, m: string, s: string): number {
  return (parseInt(h) || 0) * 3600 + (parseInt(m) || 0) * 60 + (parseInt(s) || 0)
}

/** One overridable boolean setting: checkbox opts in, Toggle sets the value, otherwise inherits global. */
function OverrideBoolRow({ label, globalValue, value, onChange }: {
  label: string
  globalValue: boolean
  value: boolean | undefined
  onChange: (v: boolean | undefined) => void
}) {
  const overriding = value !== undefined
  return (
    <div className="flex items-center justify-between gap-3">
      <label className="flex items-center gap-2 cursor-pointer select-none">
        <input
          type="checkbox"
          checked={overriding}
          onChange={e => onChange(e.target.checked ? globalValue : undefined)}
          className="w-4 h-4 accent-teal-500"
        />
        <span className="text-white/70 text-sm">{label}</span>
      </label>
      {overriding ? (
        <Toggle enabled={value} onToggle={() => onChange(!value)} />
      ) : (
        <span className="text-white/30 text-xs">Using global ({globalValue ? 'On' : 'Off'})</span>
      )}
    </div>
  )
}

export function AgendaEditor({ items, settings, sounds, addSound, onOpenSettings, onUpdate, onClose }: Props) {
  const [draft, setDraft] = useState<AgendaItem[]>(items)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [importing, setImporting] = useState(false)
  const [importError, setImportError] = useState<string | null>(null)
  const importRef = useRef<HTMLInputElement>(null)

  const handleImport = async (file: File | null) => {
    if (importRef.current) importRef.current.value = ''
    if (!file) return
    setImporting(true)
    setImportError(null)
    try {
      const imported = await parseAgendaFile(file)
      if (imported.length === 0) {
        setImportError('No valid rows found — use column A = name, column B = duration.')
      } else {
        setDraft(imported) // replace current items
        setExpandedId(null)
      }
    } catch {
      setImportError('Could not read that file. Supported types: .xlsx, .xls, .csv')
    } finally {
      setImporting(false)
    }
  }

  const addItem = () => {
    setDraft(prev => [...prev, { id: crypto.randomUUID(), name: '', durationSeconds: 300 }])
  }

  const removeItem = (id: string) => {
    setDraft(prev => prev.filter(item => item.id !== id))
  }

  const updateItem = (id: string, field: keyof AgendaItem, value: string | number) => {
    setDraft(prev => prev.map(item => item.id === id ? { ...item, [field]: value } : item))
  }

  const setOverride = <K extends keyof AgendaItemOverrides>(id: string, key: K, value: AgendaItemOverrides[K] | undefined) => {
    setDraft(prev => prev.map(item => {
      if (item.id !== id) return item
      const overrides: AgendaItemOverrides = { ...item.overrides }
      if (value === undefined) delete overrides[key]
      else overrides[key] = value
      return { ...item, overrides: Object.keys(overrides).length > 0 ? overrides : undefined }
    }))
  }

  const toggleGongOverride = (id: string, on: boolean) => {
    if (on) {
      setOverride(id, 'playGong', settings.playGong)
      setOverride(id, 'gongSoundId', settings.gongSoundId)
    } else {
      setOverride(id, 'playGong', undefined)
      setOverride(id, 'gongSoundId', undefined)
    }
  }

  const moveItem = (index: number, dir: -1 | 1) => {
    const target = index + dir
    if (target < 0 || target >= draft.length) return
    const next = [...draft]
    ;[next[index], next[target]] = [next[target], next[index]]
    setDraft(next)
  }

  const save = () => {
    onUpdate(draft.filter(item => item.name.trim().length > 0 && item.durationSeconds > 0))
    onClose()
  }

  const totalSeconds = draft.reduce((sum, item) => sum + item.durationSeconds, 0)
  const totalMinutes = Math.ceil(totalSeconds / 60)

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
      data-testid="agenda-editor"
    >
      <div className="w-full max-w-lg bg-[#1a1a1a] rounded-t-2xl sm:rounded-2xl p-6 max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-white text-lg font-semibold">Edit Agenda</h2>
          <button
            className="touch-button p-2 rounded-lg hover:bg-white/10 text-white/60 transition-colors"
            onClick={onClose}
            data-testid="button-close-agenda"
          >
            <X size={20} />
          </button>
        </div>
        <button
          className="touch-button flex items-center gap-1.5 mb-4 px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-teal-300/80 hover:text-teal-200 text-xs font-medium transition-colors self-start"
          onClick={onOpenSettings}
          data-testid="button-agenda-global-settings"
        >
          <Settings size={14} />
          Agenda Settings
        </button>

        <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 mb-4">
          {draft.map((item, i) => {
            const { h, m, s } = secondsToInputs(item.durationSeconds)
            const ov = item.overrides
            const expanded = expandedId === item.id
            const hasOverrides = !!ov && Object.keys(ov).length > 0
            return (
              <div key={item.id} className="bg-white/5 rounded-xl p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <div className="flex flex-col gap-1">
                    <button
                      className="p-1 hover:bg-white/10 rounded transition-colors text-white/40 disabled:opacity-20"
                      onClick={() => moveItem(i, -1)}
                      disabled={i === 0}
                    >
                      <ChevronUp size={14} />
                    </button>
                    <button
                      className="p-1 hover:bg-white/10 rounded transition-colors text-white/40 disabled:opacity-20"
                      onClick={() => moveItem(i, 1)}
                      disabled={i === draft.length - 1}
                    >
                      <ChevronDown size={14} />
                    </button>
                  </div>

                  <div className="flex-1 min-w-0 space-y-2">
                    <input
                      type="text"
                      placeholder="Item name"
                      value={item.name}
                      onChange={e => updateItem(item.id, 'name', e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg bg-white/10 border border-white/15 text-white text-sm placeholder:text-white/30 outline-none focus:ring-1 focus:ring-teal-500/50"
                    />
                    <div className="flex items-center gap-1.5">
                      {[
                        { val: h, ph: 'Hr',  max: 99,  key: 'h' },
                        { val: m, ph: 'Min', max: 59,  key: 'm' },
                        { val: s, ph: 'Sec', max: 59,  key: 's' },
                      ].map(({ val, ph, max, key }, idx) => (
                        <span key={key} className="flex items-center gap-1">
                          {idx > 0 && <span className="text-white/30 text-xs">:</span>}
                          <input
                            type="number"
                            placeholder={ph}
                            min={0}
                            max={max}
                            value={val}
                            onChange={e => {
                              const vals = { h, m, s, [key]: e.target.value }
                              updateItem(item.id, 'durationSeconds', inputsToSeconds(vals.h, vals.m, vals.s))
                            }}
                            className="w-14 px-2 py-1.5 rounded-lg bg-white/10 border border-white/15 text-white text-xs text-center placeholder:text-white/30 outline-none focus:ring-1 focus:ring-teal-500/50"
                          />
                        </span>
                      ))}
                    </div>
                  </div>

                  <button
                    className={`p-2 rounded-lg hover:bg-white/10 transition-colors shrink-0 ${hasOverrides ? 'text-teal-400' : 'text-white/30 hover:text-white/60'}`}
                    onClick={() => setExpandedId(expanded ? null : item.id)}
                    title="Per-item settings"
                    data-testid={`button-item-settings-${item.id}`}
                  >
                    <SlidersHorizontal size={15} />
                  </button>
                  <button
                    className="p-2 rounded-lg hover:bg-red-500/20 text-white/30 hover:text-red-400 transition-colors shrink-0"
                    onClick={() => removeItem(item.id)}
                    data-testid={`button-remove-item-${item.id}`}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>

                {expanded && (
                  <div className="border-t border-white/10 pt-3 space-y-3" data-testid={`item-settings-${item.id}`}>
                    <OverrideBoolRow
                      label="Show overtime"
                      globalValue={settings.showOvertime}
                      value={ov?.showOvertime}
                      onChange={v => setOverride(item.id, 'showOvertime', v)}
                    />
                    <OverrideBoolRow
                      label="Fade / blink"
                      globalValue={settings.fadeEffect}
                      value={ov?.fadeEffect}
                      onChange={v => setOverride(item.id, 'fadeEffect', v)}
                    />

                    {/* Gong override */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-3">
                        <label className="flex items-center gap-2 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={ov?.playGong !== undefined}
                            onChange={e => toggleGongOverride(item.id, e.target.checked)}
                            className="w-4 h-4 accent-teal-500"
                          />
                          <span className="text-white/70 text-sm">Gong</span>
                        </label>
                        {ov?.playGong !== undefined ? (
                          <Toggle enabled={ov.playGong} onToggle={() => setOverride(item.id, 'playGong', !ov.playGong)} />
                        ) : (
                          <span className="text-white/30 text-xs">Using global ({settings.playGong ? 'On' : 'Off'})</span>
                        )}
                      </div>
                      {ov?.playGong && (
                        <SoundSelector
                          sounds={sounds}
                          selectedId={ov.gongSoundId ?? settings.gongSoundId}
                          onSelect={id => setOverride(item.id, 'gongSoundId', id)}
                          onUpload={file => addSound(file, id => setOverride(item.id, 'gongSoundId', id))}
                        />
                      )}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {importError && (
          <p className="text-red-400/90 text-xs mb-2" data-testid="import-error">{importError}</p>
        )}

        <div className="flex items-center justify-between gap-3 pt-2 border-t border-white/10">
          <div className="flex items-center gap-2 min-w-0">
            <button
              className="touch-button flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-sm font-medium transition-colors shrink-0"
              onClick={addItem}
              data-testid="button-add-agenda-item"
            >
              + Add Item
            </button>
            <button
              className="touch-button flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white/80 text-sm font-medium transition-colors disabled:opacity-50 shrink-0"
              onClick={() => importRef.current?.click()}
              disabled={importing}
              title="Import items from a spreadsheet (column A = name, B = duration). Replaces the current list."
              data-testid="button-import-agenda"
            >
              <FileUp size={14} />
              {importing ? 'Importing…' : 'Import'}
            </button>
            <input
              ref={importRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={e => handleImport(e.target.files?.[0] ?? null)}
              data-testid="input-import-agenda"
            />
            {draft.length > 0 && (
              <span className="text-white/30 text-xs truncate">{totalMinutes} min total</span>
            )}
          </div>
          <button
            className="touch-button px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-semibold text-sm transition-colors shrink-0"
            onClick={save}
            data-testid="button-save-agenda"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  )
}
