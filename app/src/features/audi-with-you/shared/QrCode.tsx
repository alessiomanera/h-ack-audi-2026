import { useMemo } from 'react'
import { encodeQr } from './qr'

const QUIET_ZONE = 4
/** Literal ink and paper colors, not theme tokens: the code must scan on any theme. */
const INK = '#0B0B0C'
const PAPER = '#FFFFFF'

export interface QrCodeProps {
  value: string
  /** Rendered width and height in CSS pixels. */
  size?: number
  /** Accessible name of the image. */
  label: string
}

/** One SVG path of unit squares, one subpath per dark module, in module coordinates. */
function modulesPath(modules: readonly boolean[][]): string {
  const parts: string[] = []
  modules.forEach((row, y) => {
    row.forEach((dark, x) => {
      if (dark) parts.push(`M${x + QUIET_ZONE} ${y + QUIET_ZONE}h1v1h-1z`)
    })
  })
  return parts.join('')
}

export function QrCode({ value, size = 192, label }: QrCodeProps) {
  const { d, extent } = useMemo(() => {
    const qr = encodeQr(value)
    return { d: modulesPath(qr.modules), extent: qr.size + QUIET_ZONE * 2 }
  }, [value])

  return (
    <svg
      role="img"
      aria-label={label}
      width={size}
      height={size}
      viewBox={`0 0 ${extent} ${extent}`}
      shapeRendering="crispEdges"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width={extent} height={extent} fill={PAPER} />
      <path d={d} fill={INK} />
    </svg>
  )
}
