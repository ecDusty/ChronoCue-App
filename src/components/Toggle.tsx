interface Props {
  enabled: boolean
  onToggle: () => void
  testId?: string
}

export function Toggle({ enabled, onToggle, testId }: Props) {
  return (
    <button
      className={`w-[52px] h-[28px] rounded-full transition-colors flex-shrink-0 flex items-center px-[3px] ${enabled ? 'bg-teal-500' : 'bg-white/15'}`}
      onClick={onToggle}
      data-testid={testId}
    >
      <span
        className={`w-[22px] h-[22px] rounded-full bg-white transition-transform ${enabled ? 'translate-x-[24px]' : 'translate-x-0'}`}
      />
    </button>
  )
}
