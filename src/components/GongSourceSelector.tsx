import { useRef } from 'react'
import type { GongSource } from '../types'

interface Props {
  gongSource: GongSource
  customGongFileName: string | null
  onSourceChange: (source: GongSource) => void
  onFileUpload: (file: File | null) => void
}

export function GongSourceSelector({ gongSource, customGongFileName, onSourceChange, onFileUpload }: Props) {
  const fileRef = useRef<HTMLInputElement>(null)

  return (
    <div className="pl-2 space-y-3">
      <label className="flex items-center gap-3 cursor-pointer" data-testid="radio-gong-default">
        <input
          type="radio"
          name="gong-source"
          checked={gongSource === 'default'}
          onChange={() => onSourceChange('default')}
          className="w-4 h-4 accent-teal-500"
        />
        <span className="text-white/80 text-sm">Default Gong Sound</span>
      </label>

      <label className="flex items-center gap-3 cursor-pointer" data-testid="radio-gong-custom">
        <input
          type="radio"
          name="gong-source"
          checked={gongSource === 'custom'}
          onChange={() => onSourceChange('custom')}
          className="w-4 h-4 accent-teal-500"
        />
        <span className="text-white/80 text-sm">Upload File</span>
      </label>

      {gongSource === 'custom' && (
        <div className="pl-7 space-y-2">
          {customGongFileName ? (
            <div className="flex items-center gap-2">
              <span className="text-white/60 text-xs truncate max-w-[180px]">{customGongFileName}</span>
              <button
                className="text-white/40 hover:text-white text-xs underline"
                onClick={() => {
                  onFileUpload(null)
                  if (fileRef.current) fileRef.current.value = ''
                }}
                data-testid="btn-remove-custom-gong"
              >
                Remove
              </button>
            </div>
          ) : (
            <p className="text-white/40 text-xs">No file selected</p>
          )}
          <button
            className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-white/70 text-xs transition-colors"
            onClick={() => fileRef.current?.click()}
            data-testid="btn-upload-custom-gong"
          >
            {customGongFileName ? 'Change File' : 'Choose Audio File'}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="audio/*"
            className="hidden"
            onChange={e => {
              const file = e.target.files?.[0] ?? null
              if (file) onFileUpload(file)
            }}
            data-testid="input-custom-gong"
          />
        </div>
      )}
    </div>
  )
}
