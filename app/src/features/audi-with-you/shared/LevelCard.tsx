// STUB (stream D replaces it). Holds the screen's single lava element (the progress fill).
import type { MeResponse } from '@/shared/types'

export function LevelCard({ me, variant = 'full' }: { me: MeResponse; variant?: 'compact' | 'full' }) {
  return <div data-variant={variant}>{me.user.name}: {me.level.points}</div>
}
