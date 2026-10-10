import type { MeResponse } from '@/shared/types'
import { Card } from '@/components/ui/card'
import { formatPoints } from '@/lib/utils'
import { CourtesyCarCard } from '../shared/CourtesyCarCard'
import { LevelCard } from '../shared/LevelCard'
import { portalCopy } from './copy.it'
import { computeMetrics, nextReward } from './metrics'
import { Section } from './Section'

const copy = portalCopy.level

/** Section 1: the level card plus the metrics row, the next reward and the courtesy car (desktop extras). */
export function LevelSection({ me }: { me: MeResponse }) {
  const metrics = computeMetrics(me)
  const next = nextReward(me)
  const firstName = me.user.name.split(' ')[0] ?? me.user.name

  const tiles: { label: string; value: string; hint?: string }[] = [
    { label: copy.metrics.totalPoints, value: formatPoints(metrics.totalPoints) },
    { label: copy.metrics.currentLevel, value: metrics.levelName },
    {
      label: copy.metrics.pointsToNext,
      value: metrics.pointsToNext === null ? copy.metrics.topLevel : formatPoints(metrics.pointsToNext),
    },
    { label: copy.metrics.familyPoints, value: formatPoints(metrics.familyPoints), hint: copy.metrics.familyHint },
    { label: copy.metrics.services, value: formatPoints(metrics.serviceCount) },
    { label: copy.metrics.experiences, value: formatPoints(metrics.experienceCount) },
  ]

  return (
    <Section id="livello" title={copy.title} intro={copy.greeting(firstName)} className="border-t-0">
      <div className="grid gap-6 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <LevelCard me={me} variant="full" />
        </div>
        <div className="flex flex-col gap-6 lg:col-span-5">
          <Card className="p-6">
            <p className="text-xs tracking-wide text-muted-foreground uppercase">{copy.nextReward.title}</p>
            {next ? (
              <>
                <h3 className="mt-2 text-lg font-bold">{copy.nextReward.atLevel(next.levelName)}</h3>
                <ul className="mt-4 space-y-3">
                  {next.rewards.map((reward) => (
                    <li key={reward.id}>
                      <p className="font-medium">{reward.title}</p>
                      <p className="text-sm text-muted-foreground">{reward.description}</p>
                    </li>
                  ))}
                </ul>
                {me.level.pointsToNext !== null && (
                  <p className="mt-4 border-t pt-4 text-sm">
                    {copy.nextReward.missing(formatPoints(me.level.pointsToNext))}
                  </p>
                )}
              </>
            ) : (
              <p className="mt-2">{copy.nextReward.top}</p>
            )}
          </Card>
          {me.courtesyCar && (
            <div className="space-y-2">
              <p className="text-xs tracking-wide text-muted-foreground uppercase">{copy.courtesyCar}</p>
              <CourtesyCarCard offer={me.courtesyCar} />
            </div>
          )}
        </div>
      </div>

      <dl
        role="group"
        aria-label={copy.metricsLabel}
        className="mt-6 grid grid-cols-2 gap-px overflow-hidden rounded-lg border bg-border sm:grid-cols-3 lg:grid-cols-6"
      >
        {tiles.map((tile) => (
          <div key={tile.label} className="bg-card p-4">
            <dt className="text-xs text-muted-foreground">{tile.label}</dt>
            <dd className="mt-2 font-display text-2xl font-bold tabular-nums">{tile.value}</dd>
            {tile.hint && <dd className="mt-1 text-xs text-subtle">{tile.hint}</dd>}
          </div>
        ))}
      </dl>
    </Section>
  )
}
