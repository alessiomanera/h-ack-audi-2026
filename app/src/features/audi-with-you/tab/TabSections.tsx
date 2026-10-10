// Sections of the authenticated TabView: header, next milestone, bonus teaser, action tiles, recent points.
// Neutral surfaces only: the screen's single lava element lives in LevelCard.
import { useId } from 'react'
import { ChevronRight, Flag, Gift, LogOut, UserPlus, Users, Wrench } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { formatDate, formatPoints } from '@/lib/utils'
import type { MeResponse } from '@/shared/types'
import { useSession } from '@/state/session'
import { actionNotes } from '../portal/metrics'
import { bonusReward, getAction, getLevel, program } from '../program'
import { BonusRewardCard } from '../shared/BonusRewardCard'
import { CourtesyCarCard } from '../shared/CourtesyCarCard'
import { InviteButton } from '../shared/InviteButton'
import { tabCopy } from './copy.it'
import { firstName, keyUserName, nextReward, otherActions, primaryHousehold, servicePoints } from './model'

const sectionLabel = 'text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground'
const tile = 'flex min-h-40 flex-col items-start gap-2 rounded-lg border border-border bg-card p-4 text-left'

export function TabHeader({ me }: { me: MeResponse }) {
  const { logout } = useSession()
  const household = primaryHousehold(me)
  const role = household ? tabCopy.header.roles[household.myRole] : null

  const onLogout = () => {
    logout().catch(() => toast.error(tabCopy.header.logoutError))
  }

  return (
    <header className="flex items-start justify-between gap-3">
      <div className="min-w-0 space-y-1">
        <h1 className="text-xl font-bold leading-tight">{program.name}</h1>
        <p className="text-sm text-foreground">{tabCopy.header.greeting(firstName(me.user.name))}</p>
        {household && role && (
          <p className="text-sm text-muted-foreground">
            {tabCopy.header.vehicle(household.vehicle.model, household.vehicle.year, role)}
          </p>
        )}
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="size-11 shrink-0 text-muted-foreground"
        aria-label={tabCopy.header.logout}
        title={tabCopy.header.logout}
        onClick={onLogout}
      >
        <LogOut aria-hidden />
      </Button>
    </header>
  )
}

export function NextRewardSection({ me }: { me: MeResponse }) {
  const titleId = useId()
  const next = nextReward(me)
  const current = getLevel(program, me.level.current)

  return (
    <section aria-labelledby={titleId} className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-md border border-border">
          <Flag className="size-5" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <h2 id={titleId} className={sectionLabel}>
            {next ? tabCopy.next.title : tabCopy.next.topLabel}
          </h2>
          {next ? (
            <p className="mt-1 flex flex-wrap items-baseline justify-between gap-x-3 text-sm">
              <span className="font-bold">{next.levelName}</span>
              <span className="tabular-nums text-muted-foreground">
                {tabCopy.next.remaining(formatPoints(next.pointsToNext))}
              </span>
            </p>
          ) : (
            <p className="mt-1 text-sm font-bold">{tabCopy.next.topTitle}</p>
          )}
        </div>
      </div>
      {next ? (
        <ul className="mt-3 space-y-2">
          {next.rewards.map((reward) => {
            const Icon = reward.kind === 'welcome_kit' ? Gift : ChevronRight
            return (
              <li key={reward.id} data-reward-kind={reward.kind} className="flex items-start gap-2 text-sm">
                <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
                <span>{reward.title}</span>
              </li>
            )
          })}
        </ul>
      ) : (
        <p className="mt-3 text-sm text-muted-foreground">
          {current.tagline} {tabCopy.next.topBody}
        </p>
      )}
    </section>
  )
}

function ServiceTile({ me }: { me: MeResponse }) {
  const action = getAction(program, 'service')
  const service = servicePoints(me)
  const points = formatPoints(service.points)

  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          type="button"
          className={`${tile} transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring`}
        >
          <Wrench className="size-5" aria-hidden />
          <span className="text-sm font-bold leading-snug">{action.title}</span>
          <span className="mt-auto flex flex-wrap items-center gap-1.5">
            <span className="text-sm tabular-nums">{tabCopy.actions.points(points)}</span>
            {service.multiplied && (
              <Badge variant="outline" className="rounded-sm px-1.5 font-normal">
                {tabCopy.actions.service.doubled}
              </Badge>
            )}
          </span>
        </button>
      </DialogTrigger>
      <DialogContent className="max-h-[85dvh] w-[calc(100%-2rem)] max-w-md overflow-y-auto rounded-lg">
        <DialogHeader className="text-left">
          <DialogTitle className="pr-8">{action.title}</DialogTitle>
          <DialogDescription>{action.description}</DialogDescription>
        </DialogHeader>

        {action.examples && (
          <ul className="flex flex-wrap gap-2">
            {action.examples.map((example) => (
              <li key={example}>
                <Badge variant="outline" className="rounded-sm font-normal">
                  {example}
                </Badge>
              </li>
            ))}
          </ul>
        )}

        <div className="rounded-md border border-border p-3 text-sm">
          <p className="font-bold tabular-nums">{tabCopy.actions.service.perVisit(points)}</p>
          {service.multiplied && service.multiplierLabel && (
            <p className="mt-1 text-muted-foreground">{service.multiplierLabel}</p>
          )}
        </div>

        <div className="space-y-2">
          <h3 className="text-sm font-bold">{tabCopy.actions.service.courtesyTitle}</h3>
          {me.courtesyCar ? (
            <CourtesyCarCard offer={me.courtesyCar} />
          ) : (
            <p className="text-sm text-muted-foreground">{tabCopy.actions.service.courtesyMissing}</p>
          )}
        </div>

        <p className="text-xs text-muted-foreground">{tabCopy.actions.service.how}</p>

        <DialogClose asChild>
          <Button className="h-11 w-full">{tabCopy.actions.service.close}</Button>
        </DialogClose>
      </DialogContent>
    </Dialog>
  )
}

function FamilyTile({ me }: { me: MeResponse }) {
  const household = primaryHousehold(me)
  if (!household) return null
  const copy = tabCopy.actions.family

  if (household.myRole === 'key') {
    const invite = getAction(program, 'invite')
    const { used, max } = household.secondarySlots
    return (
      <div className={tile}>
        <UserPlus className="size-5" aria-hidden />
        <span className="text-sm font-bold leading-snug">{copy.keyTitle}</span>
        <span className="text-xs text-muted-foreground">{copy.keyBody(formatPoints(invite.points))}</span>
        <span className="text-xs text-subtle tabular-nums">{copy.slots(used, max)}</span>
        {used < max ? (
          <InviteButton className="mt-auto min-h-11 w-full" label={copy.button} />
        ) : (
          <span className="mt-auto text-xs text-muted-foreground">{copy.full}</span>
        )}
      </div>
    )
  }

  const keyName = keyUserName(household)
  return (
    <div className={tile}>
      <Users className="size-5" aria-hidden />
      <span className="text-sm font-bold leading-snug">{copy.memberTitle}</span>
      <span className="text-sm">{keyName ? copy.memberOf(keyName) : copy.memberFallback}</span>
      <span className="mt-auto text-xs text-muted-foreground">{copy.memberBody}</span>
    </div>
  )
}

/** The program's bonus reward (the custom wrap) as a compact chalk teaser. */
export function BonusTeaser() {
  const bonus = bonusReward(program)
  if (!bonus) return null
  return <BonusRewardCard reward={bonus.reward} levelName={bonus.level.name} variant="teaser" />
}

/** Enabled actions without a tile: flat points per action, caps from program.it.json. */
function MoreActions() {
  const titleId = useId()
  const actions = otherActions(program)
  if (actions.length === 0) return null
  return (
    <div className="rounded-lg border border-border bg-card">
      <div className="px-4 pb-1 pt-3">
        <h3 id={titleId} className="text-sm font-bold">
          {tabCopy.actions.more.title}
        </h3>
        <p className="text-xs text-muted-foreground">{tabCopy.actions.more.hint}</p>
      </div>
      <ul aria-labelledby={titleId} className="divide-y divide-border">
        {actions.map((action) => {
          const notes = actionNotes(action)
          return (
            <li
              key={action.type}
              data-action={action.type}
              className="flex min-h-14 items-center justify-between gap-3 px-4 py-3"
            >
              <div className="min-w-0">
                <p className="text-sm">{action.title}</p>
                {notes.length > 0 && <p className="text-xs text-muted-foreground">{notes.join(', ')}</p>}
              </div>
              <span className="shrink-0 text-sm font-bold tabular-nums">
                {tabCopy.actions.points(formatPoints(action.points))}
              </span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

export function ActionTiles({ me }: { me: MeResponse }) {
  const titleId = useId()
  return (
    <section aria-labelledby={titleId} className="space-y-3">
      <h2 id={titleId} className={sectionLabel}>
        {tabCopy.actions.title}
      </h2>
      <div className="grid grid-cols-2 gap-3">
        <ServiceTile me={me} />
        <FamilyTile me={me} />
      </div>
      <MoreActions />
    </section>
  )
}

export function RecentPoints({ me }: { me: MeResponse }) {
  const titleId = useId()
  const entries = me.ledger.slice(0, 3)

  return (
    <section aria-labelledby={titleId} className="space-y-3">
      <h2 id={titleId} className={sectionLabel}>
        {tabCopy.ledger.title}
      </h2>
      {entries.length === 0 ? (
        <p className="rounded-lg border border-border bg-card p-4 text-sm text-muted-foreground">
          {tabCopy.ledger.empty}
        </p>
      ) : (
        <ul className="divide-y divide-border rounded-lg border border-border bg-card">
          {entries.map((entry) => (
            <li key={entry.id} className="flex min-h-14 items-center justify-between gap-3 px-4 py-3">
              <div className="min-w-0">
                <p className="text-sm">{entry.label}</p>
                <p className="text-xs text-muted-foreground">{formatDate(entry.createdAt)}</p>
              </div>
              <span className="shrink-0 text-sm font-bold tabular-nums">
                {tabCopy.ledger.points(formatPoints(entry.points))}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
