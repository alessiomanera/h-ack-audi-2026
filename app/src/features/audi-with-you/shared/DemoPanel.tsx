// Demo panel, visible only with ?demo=1: switch persona, simulate Audi events, reset the demo.
// After an event a dialog tells the moment: the courtesy car while yours is in the workshop (service),
// the carry over of level and history (trade in) and what a new level unlocks ("Hai sbloccato").
// "Prenota" on an unlocked reward swaps the same dialog to the booking flow, without closing it.
// Dialogs stay chalk on graphite: the screen's single lava element is the LevelCard progress fill.
import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router'
import { toast } from 'sonner'
import { ArrowLeftRight, ChevronDown, KeyRound, LoaderCircle, RotateCcw, Sparkles, Wrench } from 'lucide-react'
import type { ActionRequest, ActionResult, LevelId, MeResponse, PersonaId, ProgramReward } from '@/shared/types'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import { cn, formatPoints } from '@/lib/utils'
import { useSession } from '@/state/session'
import { getAction, getLevel, program } from '../program'
import { bookingCopy } from './booking.copy.it'
import { BOOKING_DIALOG_CLASS, BookingBody, RewardClaimAction, type BookingTarget } from './BookingDialog'
import { sharedCopy } from './copy.it'
import { CourtesyCarCard } from './CourtesyCarCard'
import { errorMessage, firstName, useCountUp } from './hooks'

const copy = sharedCopy.demo

const PERSONA_IDS: PersonaId[] = ['paolo', 'luca', 'giulia']

interface DemoAction {
  id: string
  label: string
  req: ActionRequest
}

const ACTIONS: DemoAction[] = [
  { id: 'tagliando', label: copy.actions.tagliando, req: { type: 'service', meta: { serviceKind: 'tagliando' } } },
  { id: 'gomme', label: copy.actions.gomme, req: { type: 'service', meta: { serviceKind: 'gomme' } } },
  {
    id: 'check',
    label: copy.actions.checkInvernale,
    req: { type: 'service', meta: { serviceKind: 'check_invernale' } },
  },
  { id: 'accessory', label: copy.actions.accessory, req: { type: 'accessory', meta: { itemName: copy.accessoryItem } } },
  { id: 'merch', label: copy.actions.merch, req: { type: 'merch', meta: { itemName: copy.merchItem } } },
  { id: 'trade-in', label: copy.actions.tradeIn, req: { type: 'trade_in' } },
  { id: 'dealer', label: copy.actions.dealer, req: { type: 'session', meta: { sessionKind: 'dealer' } } },
  {
    id: 'driving',
    label: copy.actions.driving,
    req: { type: 'session', meta: { sessionKind: 'driving_experience' } },
  },
  { id: 'event', label: copy.actions.event, req: { type: 'event', meta: { eventName: copy.eventName } } },
  { id: 'charging', label: copy.actions.charging, req: { type: 'charging' } },
  { id: 'invite', label: copy.actions.invite, req: { type: 'invite', meta: { inviteeName: copy.inviteeName } } },
]

/** An invited secondary driver becomes key user of their first Audi: points to them and to the inviter. */
const FIRST_AUDI: DemoAction = { id: 'first-audi', label: copy.actions.firstAudi, req: { type: 'first_audi' } }

function initiallyOpen(): boolean {
  // Expanded on desktop, collapsed bottom sheet on phones so it does not cover the view.
  if (typeof window.matchMedia !== 'function') return true
  return window.matchMedia('(min-width: 768px)').matches
}

/** The simulated event and what the server answered. */
interface ActionMoment {
  action: DemoAction
  result: ActionResult
}

/** True when the result deserves a dialog: courtesy car, new level, trade in or first Audi carry over. */
function hasMoment(result: ActionResult): boolean {
  const action = result.entry?.action
  return result.courtesyCar !== null || result.levelUp !== null || action === 'trade_in' || action === 'first_audi'
}

/** First name of the key user who invited me (the household where I am a secondary driver). */
function inviterName(me: MeResponse): string | null {
  const household = me.households.find((h) => h.myRole === 'secondary')
  const key = household?.members.find((m) => m.role === 'key' && !m.isMe)
  return key ? firstName(key.name) : null
}

/** One dialog for the moment and, after "Prenota", the booking: the body swaps in place. */
function MomentDialog({
  moment,
  booking,
  onBook,
  onClose,
}: {
  moment: ActionMoment | null
  booking: BookingTarget | null
  onBook: (target: BookingTarget) => void
  onClose: () => void
}) {
  const contentRef = useRef<HTMLDivElement>(null)
  const open = moment !== null || booking !== null

  // The booking replaces the moment: start from the top and keep focus inside the dialog.
  useEffect(() => {
    const el = contentRef.current
    if (!booking || !el) return
    el.scrollTop = 0
    el.focus()
  }, [booking])

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      {open && (
        <DialogContent ref={contentRef} className={BOOKING_DIALOG_CLASS}>
          {booking ? (
            <BookingBody key={booking.reward.id} reward={booking.reward} levelId={booking.levelId} />
          ) : (
            moment && <MomentDialogBody moment={moment} onBook={onBook} />
          )}
        </DialogContent>
      )}
    </Dialog>
  )
}

function Marker({ children }: { children: string }) {
  return (
    <span className="inline-flex shrink-0 items-center rounded-sm border border-border px-1.5 py-0.5 text-[10px] uppercase tracking-widest text-muted-foreground">
      {children}
    </span>
  )
}

/** "Hai sbloccato": every reward of the new level, welcome kit included, bonus marked, with its claim button. */
function UnlockedRewards({
  rewards,
  levelId,
  levelName,
  me,
  onBook,
}: {
  rewards: ProgramReward[]
  levelId: LevelId
  levelName: string
  me: MeResponse
  onBook: (target: BookingTarget) => void
}) {
  const c = copy.moment
  return (
    <section aria-label={c.unlocked} className="grid gap-3 p-6">
      <div>
        <h3 className="flex items-center gap-2 font-display text-lg font-bold leading-snug">
          <Sparkles className="size-4" aria-hidden />
          {c.unlocked}
        </h3>
        <p className="mt-1 text-pretty text-sm text-muted-foreground">{c.unlockedIntro(levelName)}</p>
      </div>
      <ul className="grid gap-2">
        {rewards.map((r) => (
          <li
            key={r.id}
            data-bonus={r.bonus === true}
            className={cn(
              'flex flex-wrap items-center justify-between gap-x-3 gap-y-1 rounded-sm border px-3 py-2',
              r.bonus ? 'border-foreground/60' : 'border-border',
            )}
          >
            <span className="min-w-0 text-pretty text-sm font-bold">{r.title}</span>
            <span className="flex flex-wrap items-center gap-1">
              {r.bonus && <Marker>{sharedCopy.bonus.eyebrow}</Marker>}
              {r.kind === 'welcome_kit' && <Marker>{c.welcomeKit}</Marker>}
              {r.limited && !r.bonus && <Marker>{c.limited}</Marker>}
              <RewardClaimAction reward={r} levelId={levelId} me={me} onBook={onBook} className="ml-1" />
            </span>
          </li>
        ))}
      </ul>
    </section>
  )
}

function MomentDialogBody({ moment, onBook }: { moment: ActionMoment; onBook: (target: BookingTarget) => void }) {
  const c = copy.service
  const m = copy.moment
  const { result, action } = moment
  const offer = result.courtesyCar
  const me = result.me
  const level = getLevel(program, me.level.current)
  const next = me.level.next ? getLevel(program, me.level.next) : null
  const newLevel = result.levelUp ? getLevel(program, result.levelUp) : null
  const total = useCountUp(me.level.points, { initial: Math.max(0, me.level.points - result.awarded), duration: 1200 })

  const serviceKind = action.req.type === 'service' ? action.req.meta?.serviceKind : undefined
  const tradeIn = result.entry?.action === 'trade_in'
  const firstAudi = result.entry?.action === 'first_audi'
  const inviter = firstAudi ? inviterName(me) : null
  const inviterPoints = firstAudi ? getAction(program, 'first_audi').inviterPoints : undefined
  const service = getAction(program, 'service')
  const serviceBase = serviceKind ? (service.pointsByKind?.[serviceKind] ?? service.points) : service.points
  const doubled =
    serviceKind !== undefined &&
    service.multiplier !== undefined &&
    (result.entry?.meta.multiplied === true || result.awarded >= serviceBase * service.multiplier.factor)
  const points = formatPoints(result.awarded)

  let eyebrow: string = m.eyebrow
  let title: string = result.awarded > 0 ? m.headline(action.label, points) : action.label
  if (serviceKind) {
    eyebrow = c.eyebrow
    title = result.awarded > 0 ? c.headline(c[serviceKind], points) : c.headlineNoPoints(c[serviceKind])
  } else if (tradeIn) {
    eyebrow = m.tradeInEyebrow
    title = m.tradeInHeadline(points)
  } else if (firstAudi) {
    eyebrow = m.firstAudiEyebrow
    title = m.firstAudiHeadline(points)
  }
  const EyebrowIcon = serviceKind ? Wrench : tradeIn ? ArrowLeftRight : firstAudi ? KeyRound : Sparkles
  const nextBetter = next && offer && next.courtesyCar.label !== offer.rule.label ? next : null

  return (
    <>
      <div className="p-6 pb-5">
        <p className="flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground">
          <EyebrowIcon className="size-4" aria-hidden />
          {eyebrow}
        </p>
        <DialogTitle className="mt-3 text-balance pr-6 font-display text-2xl font-bold leading-tight">{title}</DialogTitle>
        <DialogDescription className="mt-2 text-pretty">
          {doubled && service.multiplier ? `${service.multiplier.label}. ` : ''}
          <span className="tabular-nums">{c.total(formatPoints(total), level.name)}</span>
        </DialogDescription>
        {newLevel && (
          <span className="mt-3 inline-flex items-center rounded-sm bg-foreground px-2 py-0.5 text-xs font-bold text-background">
            {c.levelUpBadge(newLevel.name)}
          </span>
        )}
        {tradeIn && <p className="mt-4 text-pretty font-display text-lg font-bold leading-snug">{m.tradeInCarryOver}</p>}
        {firstAudi && (
          <>
            <p className="mt-4 text-pretty font-display text-lg font-bold leading-snug">{m.firstAudiCarryOver}</p>
            {inviter && inviterPoints !== undefined && (
              <p className="mt-2 text-pretty text-sm text-muted-foreground">
                {m.firstAudiInviter(inviter, formatPoints(inviterPoints))}
              </p>
            )}
          </>
        )}
      </div>

      {offer && (
        <>
          <Separator />
          <div className="grid gap-4 p-6">
            <p className="text-balance font-display text-lg font-bold leading-snug">
              {offer.offeredModel !== offer.ownModel
                ? c.whileInService(offer.ownModel, offer.offeredModel)
                : c.sameModel(offer.ownModel)}
            </p>
            <CourtesyCarCard offer={offer} />
            {nextBetter && (
              <p className="text-pretty text-sm text-muted-foreground">
                {c.nextLevel(nextBetter.name, nextBetter.courtesyCar.label)}
              </p>
            )}
          </div>
        </>
      )}

      {newLevel && newLevel.rewards.length > 0 && (
        <>
          <Separator />
          <UnlockedRewards
            rewards={newLevel.rewards}
            levelId={newLevel.id}
            levelName={newLevel.name}
            me={me}
            onBook={onBook}
          />
        </>
      )}

      <div className="p-6 pt-0">
        <DialogClose asChild>
          <Button type="button" className="w-full">
            {c.close}
          </Button>
        </DialogClose>
      </div>
    </>
  )
}

function DemoPanelBody() {
  const { status, me, loginAs, runAction, resetDemo } = useSession()
  const [open, setOpen] = useState(initiallyOpen)
  const [busy, setBusy] = useState<string | null>(null)
  const [moment, setMoment] = useState<ActionMoment | null>(null)
  const [booking, setBooking] = useState<BookingTarget | null>(null)
  const loggedIn = status === 'authenticated' && me !== null
  const currentName = me ? firstName(me.user.name) : null

  async function run(id: string, task: () => Promise<void>) {
    setBusy(id)
    try {
      await task()
    } catch (err) {
      toast.error(errorMessage(err, sharedCopy.genericError))
    } finally {
      setBusy(null)
    }
  }

  const switchPersona = (id: PersonaId) =>
    run(`persona-${id}`, async () => {
      await loginAs(id)
      toast(copy.nowYouAre(copy.personaNames[id]))
    })

  const simulate = (action: DemoAction) =>
    run(action.id, async () => {
      const result = await runAction(action.req)
      const description = [result.entry?.label, result.notice].filter(Boolean).join('. ') || undefined
      if (result.awarded > 0) toast(copy.awarded(formatPoints(result.awarded)), { description })
      else toast(result.notice ?? copy.nothingAwarded)
      if (result.levelUp) {
        const level = getLevel(program, result.levelUp)
        toast(copy.levelUp(level.name), { description: level.tagline })
      }
      if (hasMoment(result)) {
        setBooking(null)
        setMoment({ action, result })
      }
    })

  const openBooking = (target: BookingTarget) => {
    setMoment(null)
    setBooking(target)
  }

  const closeDialog = () => {
    setMoment(null)
    setBooking(null)
  }

  const reset = () =>
    run('reset', async () => {
      await resetDemo()
      toast(copy.resetDone)
    })

  return (
    <>
      {/* In-flow spacer: on phones the fixed bottom sheet must not cover the end of the page. */}
      <div aria-hidden className="h-14 md:hidden" />
      <aside
        aria-label={copy.title}
        className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card md:inset-x-auto md:bottom-4 md:right-4 md:w-80 md:rounded-lg md:border"
      >
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-label={open ? copy.collapse : copy.expand}
          className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
        >
          <span className="flex items-center gap-2">
            <span className="rounded-sm border border-border px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              {copy.badge}
            </span>
            <span className="text-sm font-bold">{copy.title}</span>
          </span>
          <ChevronDown className={cn('size-4 transition-transform', open ? '' : 'rotate-180')} aria-hidden />
        </button>

        {open && (
          <div className="grid max-h-[60dvh] gap-4 overflow-y-auto border-t border-border p-4">
            <section className="grid gap-2">
              <h3 className="font-sans text-xs uppercase tracking-widest text-muted-foreground">{copy.personas}</h3>
              <div className="grid grid-cols-3 gap-2">
                {PERSONA_IDS.map((id) => {
                  const name = copy.personaNames[id]
                  const active = currentName === name
                  return (
                    <Button
                      key={id}
                      type="button"
                      size="sm"
                      variant={active ? 'default' : 'outline'}
                      aria-pressed={active}
                      disabled={busy !== null}
                      onClick={() => void switchPersona(id)}
                    >
                      {busy === `persona-${id}` && <LoaderCircle className="animate-spin" aria-hidden />}
                      {name}
                    </Button>
                  )
                })}
              </div>
            </section>

            <section className="grid gap-2">
              <h3 className="font-sans text-xs uppercase tracking-widest text-muted-foreground">{copy.events}</h3>
              {!loggedIn && <p className="text-xs text-muted-foreground">{copy.loginFirst}</p>}
              <div className="grid grid-cols-2 gap-2">
                {ACTIONS.map((action) => (
                  <Button
                    key={action.id}
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={!loggedIn || busy !== null}
                    onClick={() => void simulate(action)}
                    className="h-auto min-h-9 whitespace-normal py-2 leading-tight"
                  >
                    {busy === action.id && <LoaderCircle className="animate-spin" aria-hidden />}
                    {action.label}
                  </Button>
                ))}
              </div>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={!loggedIn || busy !== null}
                  onClick={() => void simulate(FIRST_AUDI)}
                  aria-describedby="demo-first-audi-hint"
                >
                  {busy === FIRST_AUDI.id && <LoaderCircle className="animate-spin" aria-hidden />}
                  {FIRST_AUDI.label}
                </Button>
                <span id="demo-first-audi-hint" className="text-xs text-muted-foreground">
                  {bookingCopy.demo.firstAudiHint}
                </span>
              </div>
            </section>

            <Button
              type="button"
              size="sm"
              variant="ghost"
              disabled={busy !== null}
              onClick={() => void reset()}
              className="justify-self-start text-muted-foreground"
            >
              {busy === 'reset' ? <LoaderCircle className="animate-spin" aria-hidden /> : <RotateCcw aria-hidden />}
              {copy.reset}
            </Button>
          </div>
        )}
      </aside>
      <MomentDialog moment={moment} booking={booking} onBook={openBooking} onClose={closeDialog} />
    </>
  )
}

export function DemoPanel() {
  const [params] = useSearchParams()
  if (params.get('demo') !== '1') return null
  return <DemoPanelBody />
}
