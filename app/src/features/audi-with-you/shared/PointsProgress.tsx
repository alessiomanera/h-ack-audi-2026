// Slim progress bar towards the next level. tone="signal" carries the screen's single lava element:
// this is the only file allowed to use the signal color (checked by compliance.test.ts).
import { useEffect, useState } from 'react'
import type { LevelProgress } from '@/shared/types'
import { cn, formatPoints } from '@/lib/utils'
import { getLevel, program } from '../program'
import { sharedCopy } from './copy.it'

const copy = sharedCopy.level

export function PointsProgress({ level, tone = 'neutral' }: { level: LevelProgress; tone?: 'signal' | 'neutral' }) {
  const pct = Math.round(Math.min(1, Math.max(0, level.progress)) * 100)
  // Start from 0 on mount so the fill slides in, then follow every change with a CSS transition.
  const [shown, setShown] = useState(0)
  useEffect(() => {
    if (typeof window.requestAnimationFrame !== 'function') {
      setShown(pct)
      return
    }
    const id = window.requestAnimationFrame(() => setShown(pct))
    return () => window.cancelAnimationFrame(id)
  }, [pct])

  const points = formatPoints(level.points)
  const valueText =
    level.next && level.pointsToNext !== null
      ? copy.progressText(points, formatPoints(level.pointsToNext), getLevel(program, level.next).name)
      : copy.progressTop(points)

  return (
    <div
      role="progressbar"
      aria-label={copy.progressLabel}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={pct}
      aria-valuetext={valueText}
      className="h-2 w-full overflow-hidden rounded-sm border border-border bg-background"
    >
      <div
        data-tone={tone}
        className={cn(
          'h-full rounded-sm transition-[width] duration-700 ease-out',
          tone === 'signal' ? 'bg-signal' : 'bg-foreground',
        )}
        style={{ width: `${shown}%` }}
      />
    </div>
  )
}
