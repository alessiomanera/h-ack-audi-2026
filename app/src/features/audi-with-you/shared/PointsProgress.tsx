// STUB (stream D replaces it).
import type { LevelProgress } from '@/shared/types'

export function PointsProgress({ level, tone = 'neutral' }: { level: LevelProgress; tone?: 'signal' | 'neutral' }) {
  return <div data-tone={tone}>{Math.round(level.progress * 100)}%</div>
}
