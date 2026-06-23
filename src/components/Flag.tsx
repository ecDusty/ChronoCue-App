interface Props {
  /** Flag file basename in public/flags/ (e.g. 'gb' -> /flags/gb.svg). */
  code: string
  className?: string
}

// Flags are static SVG files, not bundled JS. The browser fetches each one only
// when its <img> is actually rendered, so the dropdown's flags don't load until
// the menu opens.
export function Flag({ code, className }: Props) {
  return (
    <img
      src={`/flags/${code}.svg`}
      alt=""
      aria-hidden
      loading="lazy"
      className={className}
    />
  )
}
