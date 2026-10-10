// Public program sections of the full version: shown to everyone, personalised when a level is known.
import { ArrowDown, ArrowRight, Car, Check, Hourglass, Lock, MapPin } from 'lucide-react'
import type { LevelId, MeResponse } from '@/shared/types'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { cn, formatPoints } from '@/lib/utils'
import { getLevel, program } from '../program'
import { portalCopy } from './copy.it'
import { isUnlocked } from './metrics'
import { Section } from './Section'

const levelName = (id: LevelId) => getLevel(program, id).name

export function HowItWorksSection() {
  const copy = portalCopy.howItWorks
  return (
    <Section id="come-funziona" title={copy.title} intro={copy.intro}>
      <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {program.steps.map((step, index) => (
          <li key={step.id}>
            <Card className="h-full p-6">
              <p className="font-display text-3xl font-bold text-subtle tabular-nums" aria-hidden>
                {String(index + 1).padStart(2, '0')}
              </p>
              <h3 className="mt-4 text-lg font-bold">{step.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{step.body}</p>
            </Card>
          </li>
        ))}
      </ol>
    </Section>
  )
}

export function EarnPointsSection() {
  const copy = portalCopy.earn
  const actions = program.actions.filter((action) => action.enabled)
  return (
    <Section id="punti" title={copy.title} intro={copy.intro}>
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {actions.map((action) => (
          <li key={action.type}>
            <Card className="flex h-full flex-col gap-3 p-6">
              <div className="flex items-start justify-between gap-4">
                <h3 className="text-base font-bold">{action.title}</h3>
                <p className="shrink-0 font-display text-lg font-bold whitespace-nowrap tabular-nums">
                  {copy.points(formatPoints(action.points))}
                </p>
              </div>
              <p className="text-sm text-muted-foreground">{action.description}</p>
              {action.examples && action.examples.length > 0 && (
                <p className="text-xs text-subtle">{action.examples.join(', ')}</p>
              )}
              {(action.once || action.multiplier || action.monthlyCap) && (
                <div className="mt-auto flex flex-wrap gap-2 pt-2">
                  {action.once && (
                    <Badge variant="outline" className="rounded-sm font-medium">
                      {copy.once}
                    </Badge>
                  )}
                  {action.multiplier && (
                    <Badge variant="outline" className="rounded-sm font-medium">
                      {action.multiplier.label}
                    </Badge>
                  )}
                  {action.monthlyCap && (
                    <Badge variant="outline" className="rounded-sm font-medium">
                      {copy.monthlyCap(action.monthlyCap)}
                    </Badge>
                  )}
                </div>
              )}
            </Card>
          </li>
        ))}
      </ul>
    </Section>
  )
}

/** Levels compared side by side on desktop (subgrid keeps the courtesy-car row aligned), stacked on mobile. */
export function LevelsSection({ currentLevel }: { currentLevel: LevelId | null }) {
  const copy = portalCopy.levels
  return (
    <Section id="livelli" title={copy.title} intro={copy.intro}>
      <div className="grid gap-6 lg:grid-cols-3 lg:gap-y-0">
        {program.levels.map((level) => {
          const isCurrent = level.id === currentLevel
          return (
            <article
              key={level.id}
              aria-labelledby={`livello-${level.id}`}
              data-current={isCurrent || undefined}
              className={cn(
                'flex flex-col rounded-lg border bg-card lg:row-span-3 lg:grid lg:grid-rows-subgrid lg:gap-0',
                isCurrent && 'border-foreground',
              )}
            >
              <header className="space-y-1 p-6 pb-4">
                {isCurrent && (
                  <Badge className="mb-2 rounded-sm font-medium">{copy.current}</Badge>
                )}
                <h3 id={`livello-${level.id}`} className="text-2xl font-bold">
                  {level.name}
                </h3>
                <p className="text-sm text-muted-foreground tabular-nums">
                  {copy.threshold(formatPoints(level.threshold))}
                </p>
                <p className="pt-2">{level.tagline}</p>
              </header>
              <div className="px-6">
                <div className="rounded-md bg-foreground p-4 text-background">
                  <p className="flex items-center gap-2 text-xs font-medium tracking-wide uppercase">
                    <Car className="size-4" aria-hidden />
                    {copy.courtesyCar}
                  </p>
                  <p className="mt-2 font-bold">{level.courtesyCar.label}</p>
                  <p className="mt-1 text-sm">{level.courtesyCar.description}</p>
                </div>
              </div>
              <ul className="space-y-4 p-6">
                {level.rewards.map((reward) => (
                  <li
                    key={reward.id}
                    className={cn(reward.highlight && 'rounded-md border border-foreground p-3')}
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium">{reward.title}</p>
                      {reward.note && (
                        <Badge variant="outline" className="rounded-sm font-medium">
                          {reward.note}
                        </Badge>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{reward.description}</p>
                    {reward.limited && (
                      <p className="mt-2 flex items-center gap-1.5 text-xs text-foreground">
                        <Hourglass className="size-3.5 shrink-0" aria-hidden />
                        {copy.limited}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            </article>
          )
        })}
      </div>
    </Section>
  )
}

export function ExperiencesSection({ userLevel }: { userLevel: LevelId | null }) {
  const copy = portalCopy.experiences
  return (
    <Section id="esperienze" title={copy.title} intro={program.experiences.intro}>
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {program.experiences.items.map((item) => {
          const fromLabel = item.minLevel === 'start' ? copy.forEveryone : copy.fromLevel(levelName(item.minLevel))
          const unlocked = userLevel ? isUnlocked(userLevel, item.minLevel) : null
          return (
            <li key={item.id}>
              <Card className="flex h-full flex-col gap-3 p-5" data-locked={unlocked === false || undefined}>
                <div className="flex flex-wrap gap-2">
                  {unlocked === null && (
                    <Badge variant="outline" className="rounded-sm font-medium">
                      {fromLabel}
                    </Badge>
                  )}
                  {unlocked === true && (
                    <Badge className="gap-1 rounded-sm font-medium">
                      <Check className="size-3" aria-hidden />
                      {copy.unlocked}
                    </Badge>
                  )}
                  {unlocked === false && (
                    <Badge variant="outline" className="gap-1 rounded-sm font-medium">
                      <Lock className="size-3" aria-hidden />
                      {copy.fromLevel(levelName(item.minLevel))}
                    </Badge>
                  )}
                </div>
                <h3 className={cn('text-base font-bold', unlocked === false && 'text-muted-foreground')}>
                  {item.title}
                </h3>
                <p className="text-sm text-muted-foreground">{item.description}</p>
                <div className="mt-auto space-y-1.5 pt-2">
                  {item.place && (
                    <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <MapPin className="size-3.5 shrink-0" aria-hidden />
                      {item.place}
                    </p>
                  )}
                  {item.limited && (
                    <p className="flex items-center gap-1.5 text-xs text-foreground">
                      <Hourglass className="size-3.5 shrink-0" aria-hidden />
                      {copy.limited}
                    </p>
                  )}
                </div>
              </Card>
            </li>
          )
        })}
      </ul>
    </Section>
  )
}

export function PassageSection({ me }: { me: MeResponse | null }) {
  const copy = portalCopy.passage
  const household = me?.households[0]
  const today = !household
    ? copy.todayGeneric
    : household.myRole === 'secondary'
      ? copy.todayFamily(household.vehicle.model)
      : copy.todayOwn(household.vehicle.model)
  const levelLine = me ? portalCopy.common.levelLine(levelName(me.level.current)) : null

  return (
    <Section id="passaggio" title={copy.title} intro={copy.intro}>
      <div className="grid items-center gap-4 sm:grid-cols-[1fr_auto_1fr]">
        <Card className="p-6">
          <p className="text-xs tracking-wide text-muted-foreground uppercase">{copy.today}</p>
          <p className="mt-2 font-display text-xl font-bold">{today}</p>
          {levelLine && <p className="mt-1 text-sm text-muted-foreground">{levelLine}</p>}
        </Card>
        <div className="flex justify-center text-muted-foreground" aria-hidden>
          <ArrowDown className="size-6 sm:hidden" />
          <ArrowRight className="hidden size-6 sm:block" />
        </div>
        <Card className="border-foreground p-6">
          <p className="text-xs tracking-wide text-muted-foreground uppercase">{copy.tomorrow}</p>
          <p className="mt-2 font-display text-xl font-bold">{copy.tomorrowValue}</p>
          {levelLine && <p className="mt-1 text-sm text-muted-foreground">{levelLine}</p>}
        </Card>
      </div>
      <h3 className="mt-10 text-lg font-bold">{copy.withYouTitle}</h3>
      <ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {copy.withYou.map((item) => (
          <li key={item.title} className="flex gap-3 rounded-lg border p-4">
            <Check className="mt-0.5 size-4 shrink-0" aria-hidden />
            <div>
              <p className="font-medium">{item.title}</p>
              <p className="mt-1 text-sm text-muted-foreground">{item.body}</p>
            </div>
          </li>
        ))}
      </ul>
    </Section>
  )
}

export function RulesSection() {
  const copy = portalCopy.rules
  return (
    <Section id="regolamento" title={copy.title}>
      <ol className="max-w-3xl divide-y rounded-lg border">
        {program.rules.map((rule, index) => (
          <li key={rule} className="flex gap-4 p-4">
            <span className="w-6 shrink-0 font-display font-bold text-subtle tabular-nums" aria-hidden>
              {index + 1}
            </span>
            <p className="text-sm">{rule}</p>
          </li>
        ))}
      </ol>
      <p className="mt-4 text-xs text-subtle">{copy.version(program.version)}</p>
    </Section>
  )
}
