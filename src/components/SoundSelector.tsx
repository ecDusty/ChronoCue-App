import { useRef } from 'react'
import { X } from 'lucide-react'
import type { SoundClip } from '../types'
import { DEFAULT_GONG_ID } from '../hooks/useSettings'

interface Props {
  sounds: SoundClip[]
  selectedId: string
  onSelect: (id: string) => void
  onUpload: (file: File) => void
  onRemove?: (id: string) => void
}

export function SoundSelector({ sounds, selectedId, onSelect, onUpload, onRemove }: Props) {
  const fileRef = useRef<HTMLInputElement>(null)
  const canRemove = !!onRemove && selectedId !== DEFAULT_GONG_ID && sounds.some(s => s.id === selectedId)

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <select
          value={selectedId}
          onChange={e => onSelect(e.target.value)}
          className="flex-1 min-w-0 px-3 py-2.5 rounded-lg bg-white/10 text-white text-sm outline-none focus:ring-2 focus:ring-white/20 appearance-none cursor-pointer"
          data-testid="select-gong-sound"
        >
          <option value={DEFAULT_GONG_ID} style={{ backgroundColor: '#1a1a1a', color: '#fff' }}>
            Default Gong
          </option>
          {sounds.map(s => (
            <option key={s.id} value={s.id} style={{ backgroundColor: '#1a1a1a', color: '#fff' }}>
              {s.name}
            </option>
          ))}
        </select>
        {canRemove && (
          <button
            className="touch-button p-2 rounded-lg hover:bg-red-500/20 text-white/40 hover:text-red-400 transition-colors shrink-0"
            onClick={() => onRemove?.(selectedId)}
            title="Remove this sound from the library"
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
        Upload sound
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
