import { useRef, useState } from 'react'
import { X, ChevronDown, ChevronUp } from 'lucide-react'
import type { SoundClip } from '../types'
import { DEFAULT_GONG_ID } from '../hooks/useSettings'
import { useT } from '../i18n/I18nProvider'

interface Props {
  sounds: SoundClip[]
  selectedId: string
  onSelect: (id: string) => void
  onUpload: (file: File) => void
  onRemove?: (id: string) => void
}

export function SoundSelector({ sounds, selectedId, onSelect, onUpload, onRemove }: Props) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [open, setOpen] = useState(false)
  const t = useT()
  // Coerce a dangling reference (clip removed from the library) back to the default.
  const value = selectedId === DEFAULT_GONG_ID || sounds.some(s => s.id === selectedId)
    ? selectedId
    : DEFAULT_GONG_ID
  const canRemove = !!onRemove && value !== DEFAULT_GONG_ID

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <div className="relative flex-1 min-w-0">
          <select
            value={value}
            onChange={e => { onSelect(e.target.value); setOpen(false) }}
            onFocus={() => setOpen(true)}
            onBlur={() => setOpen(false)}
            className="w-full pl-3 pr-9 py-2.5 rounded-lg bg-white/10 text-white text-sm outline-none focus:ring-2 focus:ring-white/20 appearance-none cursor-pointer"
            data-testid="select-gong-sound"
          >
            <option value={DEFAULT_GONG_ID} style={{ backgroundColor: '#1a1a1a', color: '#fff' }}>
              {t('sound.defaultGong')}
            </option>
            {sounds.map(s => (
              <option key={s.id} value={s.id} style={{ backgroundColor: '#1a1a1a', color: '#fff' }}>
                {s.name}
              </option>
            ))}
          </select>
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-white/50">
            {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </span>
        </div>
        {canRemove && (
          <button
            className="touch-button p-2 rounded-lg hover:bg-red-500/20 text-white/40 hover:text-red-400 transition-colors shrink-0"
            onClick={() => onRemove?.(value)}
            title={t('sound.removeTitle')}
            data-testid="button-remove-sound"
          >
            <X size={16} />
          </button>
        )}
      </div>

      <button
        className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-white/70 text-xs transition-colors"
        onClick={() => fileRef.current?.click()}
        data-testid="button-upload-sound"
      >
        {t('sound.upload')}
      </button>
      <input
        ref={fileRef}
        type="file"
        accept="audio/*"
        className="hidden"
        onChange={e => {
          const file = e.target.files?.[0]
          if (file) onUpload(file)
          if (fileRef.current) fileRef.current.value = ''
        }}
        data-testid="input-upload-sound"
      />
    </div>
  )
}
