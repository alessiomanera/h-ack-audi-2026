// Public program sections of the full version: shown to everyone, personalised when a level is known.
import { ArrowDown, ArrowRight, Car, Check, Gift, Hourglass, Lock, MapPin, Sparkles } from 'lucide-react'
import type { LevelId, MeResponse } from '@/shared/types'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { cn, formatPoints } from '@/lib/utils'
import { bonusReward, getLevel, isLevelReached, levelIndex, levelsInOrder, program } from '../program'
import { bookingCopy } from '../shared/booking.copy.it'
import { RewardClaimAction, findProgramReward } from '../shared/BookingDialog'
import { BonusRewardCard } from '../shared/BonusRewardCard'
import { portalCopy } from './copy.it'
import { actionNotes, kindPoints, maxPoints, needsWelcomeKitLabel } from './metrics'
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

/** Every enabled action of program.it.json, each with flat points per action. */
export function EarnPointsSection() {
  const copy = portalCopy.earn
  const actions = program.actions.filter((action) => action.enabled)
  return (
    <Section id="punti" title={copy.title} intro={copy.intro}>
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {actions.map((action) => {
          const notes = actionNotes(action)
          const kinds = kindPoints(action)
          return (
            <li key={action.type}>
              <Card className="flex h-full flex-col gap-3 p-6" data-action={action.type}>
                <div className="flex items-start justify-between gap-4">
                  <h3 className="text-base font-bold text-balance">{action.title}</h3>
                  <p className="shrink-0 font-display text-lg font-bold whitespace-nowrap tabular-nums">
                    {kinds.length > 1
                      ? bookingCopy.service.upTo(formatPoints(maxPoints(action)))
                      : copy.points(formatPoints(maxPoints(action)))}
                  </p>
                </div>
                {kinds.length > 1 && (
                  <ul className="space-y-1 text-sm tabular-nums">
                    {kinds.map((k) => (
                      <li key={k.kind}>{bookingCopy.earn.kindPoints(k.label, formatPoints(k.points))}</li>
                    ))}
                  </ul>
                )}
                {notes.length > 0 && (
                  <div className="mt-auto flex flex-wrap gap-2 pt-2">
                    {notes.map((note) => (
                      <Badge key={note} variant="outline" className="rounded-sm font-medium">
                        {note}
                      </Badge>
                    ))}
                  </div>
                )}
              </Card>
            </li>
          )
        })}
      </ul>
    </Section>
  )
}

/**
 * Levels in threshold order: one column on phones, two on tablets, side by side on wide screens
 * (subgrid keeps the courtesy-car row aligned). The bonus reward gets its own chalk card below the columns.
 */
export function LevelsSection({ currentLevel, me = null }: { currentLevel: LevelId | null; me?: MeResponse | null }) {
  const copy = portalCopy.levels
  const bonus = bonusReward(program)
  return (
    <Section id="livelli" title={copy.title} intro={copy.intro}>
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4 xl:gap-y-0">
        {levelsInOrder(program).map((level) => {
          const isCurrent = level.id === currentLevel
          const isReached = !isCurrent && currentLevel !== null && isLevelReached(program, currentLevel, level.id)
          const hasBonus = bonus?.level.id === level.id
          return (
            <article
              key={level.id}
              aria-labelledby={`livello-${level.id}`}
              data-current={isCurrent || undefined}
              className={cn(
                'flex flex-col rounded-lg border bg-card xl:row-span-3 xl:grid xl:grid-rows-subgrid xl:gap-0',
                isCurrent && 'border-foreground',
              )}
            >
              <header className="space-y-1 p-6 pb-4">
                {isCurrent && <Badge className="mb-2 rounded-sm font-medium">{copy.current}</Badge>}
                {isReached && (
                  <Badge variant="outline" className="mb-2 rounded-sm font-medium">
                    {copy.reached}
                  </Badge>
                )}
                <h3 id={`livello-${level.id}`} className="text-2xl font-bold text-balance">
                  {level.name}
                </h3>
                <p className="text-sm text-muted-foreground tabular-nums">
                  {copy.threshold(formatPoints(level.threshold))}
                </p>
                {level.requires && (
                  <p className="text-xs text-pretty text-muted-foreground">
                    {bookingCopy.level.requires(level.requires.label)}
                  </p>
                )}
                <p className="pt-2 text-pretty">{level.tagline}</p>
              </header>
              <div className="px-6">
                <div className="rounded-md bg-foreground p-4 text-background">
                  <p className="flex items-center gap-2 text-xs font-medium tracking-wide uppercase">
                    <Car className="size-4" aria-hidden />
                    {copy.courtesyCar}
                  </p>
                  <p className="mt-2 font-bold">{level.courtesyCar.label}</p>
                </div>
              </div>
              <ul className="space-y-3 p-6">
                {level.rewards
                  .filter((reward) => !reward.bonus)
                  .map((reward) => (
                    <li
                      key={reward.id}
                      data-reward-kind={reward.kind}
                      className={cn(reward.highlight && 'rounded-md border border-foreground p-3')}
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        {reward.kind === 'welcome_kit' && <Gift className="size-4 shrink-0" aria-hidden />}
                        <p className="font-medium">{reward.title}</p>
                        {needsWelcomeKitLabel(reward) && (
                          <Badge variant="outline" className="rounded-sm font-medium">
                            {copy.welcomeKit}
                          </Badge>
                        )}
                      </div>
                      {reward.limited && (
                        <p className="mt-2 flex items-center gap-1.5 text-xs text-foreground">
                          <Hourglass className="size-3.5 shrink-0" aria-hidden />
                          {copy.limited}
                        </p>
                      )}
                      <RewardClaimAction reward={reward} levelId={level.id} me={me} className="mt-3" />
                    </li>
                  ))}
                {hasBonus && (
                  <li className="flex items-center gap-2 border-t pt-4 text-sm">
                    <Sparkles className="size-4 shrink-0" aria-hidden />
                    {copy.bonusPointer}
                  </li>
                )}
              </ul>
            </article>
          )
        })}
      </div>
      {bonus && (
        <div className="mt-6 xl:mt-8">
          <BonusRewardCard
            reward={bonus.reward}
            levelName={bonus.level.name}
            variant="card"
            action={me && <RewardClaimAction reward={bonus.reward} levelId={bonus.level.id} me={me} />}
          />
        </div>
      )}
    </Section>
  )
}

export function ExperiencesSection({ userLevel, me = null }: { userLevel: LevelId | null; me?: MeResponse | null }) {
  const copy = portalCopy.experiences
  return (
    <Section id="esperienze" title={copy.title} intro={program.experiences.intro}>
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {program.experiences.items.map((item) => {
          const fromLabel =
            levelIndex(program, item.minLevel) === 0 ? copy.forEveryone : copy.fromLevel(levelName(item.minLevel))
          const unlocked = userLevel ? isLevelReached(program, userLevel, item.minLevel) : null
          const bookable = item.rewardId ? findProgramReward(item.rewardId) : null
          return (
            <li key={item.id} data-experience={item.id}>
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
                  {bookable ? (
                    <RewardClaimAction reward={bookable.reward} levelId={bookable.levelId} me={me} className="pt-1" />
                  ) : (
                    <p className="pt-1 text-xs text-muted-foreground">{copy.comingSoon}</p>
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
            <p className="font-medium">{item.title}</p>
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
