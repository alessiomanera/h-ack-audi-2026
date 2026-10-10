// The member card: level, name, animated points and progress. Holds the screen's single lava element
// (the PointsProgress fill), so no other element on a screen with a LevelCard may use the signal color.
import type { MeResponse } from '@/shared/types'
import { Card } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { cn, formatPoints } from '@/lib/utils'
import { getLevel, program } from '../program'
import { sharedCopy } from './copy.it'
import { firstName, useCountUp } from './hooks'
import { PointsProgress } from './PointsProgress'

const copy = sharedCopy.level

export function LevelCard({ me, variant = 'full' }: { me: MeResponse; variant?: 'compact' | 'full' }) {
  const level = getLevel(program, me.level.current)
  const next = me.level.next ? getLevel(program, me.level.next) : null
  const points = useCountUp(me.level.points)
  const household = me.households[0]
  const full = variant === 'full'

  return (
    <Card data-variant={variant} className={cn('shadow-none', full ? 'p-6' : 'p-5')}>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">{copy.eyebrow}</p>
          <h2 className={cn('mt-2 font-display font-bold leading-none', full ? 'text-4xl md:text-5xl' : 'text-3xl')}>
            {level.name}
          </h2>
        </div>
        <p className="shrink-0 pt-0.5 text-sm text-foreground">{firstName(me.user.name)}</p>
      </div>

      {full && <p className="mt-3 text-sm text-muted-foreground">{level.tagline}</p>}

      <div className={cn('flex items-baseline gap-2', full ? 'mt-8' : 'mt-5')}>
        <span
          data-testid="level-points"
          className={cn('font-display font-bold tabular-nums leading-none', full ? 'text-3xl' : 'text-2xl')}
        >
          {formatPoints(points)}
        </span>
        <span className="text-sm text-muted-foreground">{sharedCopy.points}</span>
      </div>

      <div className="mt-3">
        <PointsProgress level={me.level} tone="signal" />
      </div>

      <div className="mt-2 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <span>
          {next && me.level.pointsToNext !== null
            ? copy.toNext(formatPoints(me.level.pointsToNext), next.name)
            : copy.top}
        </span>
        {next && <span className="tabular-nums">{copy.nextAt(next.name, formatPoints(next.threshold))}</span>}
      </div>

      {full && household && (
        <>
          <Separator className="my-5" />
          <p className="text-sm text-muted-foreground">
            {copy.vehicle(household.vehicle.model, household.vehicle.year, sharedCopy.roles[household.myRole])}
          </p>
        </>
      )}
    </Card>
  )
}
