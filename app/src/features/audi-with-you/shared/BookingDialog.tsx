// Booking flow for a reward of a reached level: choices in order, tickets, summary, confirm, then the
// QR code (events and services) or the shipping confirmation (welcome kits), plus the concierge.
// Booking never spends points, and the confirmation says so. Neutral chalk on graphite: the screen's
// single lava element stays the LevelCard progress fill.
import { useState } from 'react'
import { CalendarCheck, Check, LoaderCircle, Lock, MessageCircle, Package } from 'lucide-react'
import type { LevelId, MeResponse, ProgramReward, RewardBooking, RewardClaimConfig } from '@/shared/types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import { cn, formatPoints } from '@/lib/utils'
import { ApiRequestError } from '@/state/api'
import { useSession } from '@/state/session'
import { bookingQrPayload } from '../engine'
import { getLevel, isLevelReached, levelsInOrder, program } from '../program'
import { bookingCopy } from './booking.copy.it'
import { sharedCopy } from './copy.it'
import { useRewardAvailability } from './hooks'
import { QrCode } from './QrCode'

const copy = bookingCopy.dialog

/** A bookable reward and the level that unlocks it. */
export interface BookingTarget {
  reward: ProgramReward
  levelId: LevelId
}

/** Shared by every dialog that hosts a booking, so the DemoPanel can swap its body in place. */
export const BOOKING_DIALOG_CLASS =
  'max-h-[90dvh] w-[calc(100%-2rem)] max-w-md gap-0 overflow-y-auto rounded-lg bg-card p-0'

/** The user's booking of a reward, if any. Tolerates a server that does not send bookings yet. */
export function findBooking(me: MeResponse, rewardId: string): RewardBooking | null {
  return (me.bookings ?? []).find((b) => b.rewardId === rewardId) ?? null
}

/** People on the user's account (primary household: key user plus invited drivers), at least 1. */
export function maxTicketsFor(me: MeResponse | null): number {
  return Math.max(1, me?.households[0]?.members.length ?? 1)
}

/** A reward of program.it.json by id, with its level. */
export function findProgramReward(rewardId: string): BookingTarget | null {
  for (const level of levelsInOrder(program)) {
    const reward = level.rewards.find((r) => r.id === rewardId)
    if (reward) return { reward, levelId: level.id }
  }
  return null
}

/** Chosen values in the order of the reward's options (raw order when the reward is unknown). */
export function orderedChoices(
  claim: RewardClaimConfig | undefined,
  choices: Record<string, string>,
): { label: string; value: string }[] {
  if (!claim) return Object.entries(choices).map(([label, value]) => ({ label, value }))
  return claim.options.flatMap((o) => {
    const value = choices[o.id]
    return value ? [{ label: o.label, value }] : []
  })
}

function bookingError(err: unknown): string {
  if (err instanceof ApiRequestError) {
    if (err.message) return err.message
    if (err.status === 403) return copy.errors.forbidden
    if (err.status === 409) return copy.errors.conflict
    if (err.status === 400) return copy.errors.badChoice
  }
  return sharedCopy.genericError
}

function ChoiceSummary({
  claim,
  choices,
  tickets,
}: {
  claim: RewardClaimConfig | undefined
  choices: Record<string, string>
  tickets?: number
}) {
  const rows = orderedChoices(claim, choices)
  if (claim?.tickets && tickets) rows.push({ label: copy.ticketsLabel, value: copy.ticketsRow(tickets) })
  if (rows.length === 0) return null
  return (
    <dl className="grid gap-2 rounded-md border border-border p-3 text-sm">
      {rows.map((row) => (
        <div key={row.label} className="flex flex-wrap items-baseline justify-between gap-x-3">
          <dt className="text-muted-foreground">{row.label}</dt>
          <dd className="font-bold">{row.value}</dd>
        </div>
      ))}
    </dl>
  )
}

/** What the user shows or receives: the QR code with the booking code, or the shipping confirmation. */
export function BookingProof({ booking, compact = false }: { booking: RewardBooking; compact?: boolean }) {
  if (booking.delivery === 'shipping') {
    return (
      <div data-testid="booking-shipping" className="flex items-start gap-3 rounded-md border border-border p-3">
        <Package className="mt-0.5 size-5 shrink-0" aria-hidden />
        <div className="min-w-0 text-sm">
          <p className="font-bold">{copy.shippingTitle}</p>
          <p className="text-pretty text-muted-foreground">{copy.shippingTo}</p>
          <p className="text-pretty text-muted-foreground">{copy.shippingEta}</p>
          <p className="mt-2 text-xs text-muted-foreground">
            {copy.codeLabel}: <span className="font-bold tabular-nums text-foreground">{booking.code}</span>
          </p>
        </div>
      </div>
    )
  }
  return (
    <div className="flex flex-col items-center gap-2 text-center">
      <div data-testid="booking-qr" className="rounded-md bg-white p-2">
        <QrCode value={bookingQrPayload(booking)} size={compact ? 160 : 200} label={copy.qrLabel(booking.code)} />
      </div>
      <p data-testid="booking-code" className="font-display text-3xl font-bold tracking-wider tabular-nums">
        {booking.code}
      </p>
      <p className="text-xs text-muted-foreground">{compact ? copy.qrHint : `${copy.qrHint}. ${copy.codeHint}`}</p>
    </div>
  )
}

/** Concierge placeholder: in the real service a person at the user's dealer answers. */
export function Concierge() {
  const [open, setOpen] = useState(false)
  return (
    <div className="grid gap-2">
      <Button type="button" variant="outline" className="h-11 w-full" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
        <MessageCircle aria-hidden />
        {bookingCopy.concierge.cta}
      </Button>
      {open && (
        <div role="note" className="rounded-md border border-border p-3 text-pretty text-sm">
          <p>{bookingCopy.concierge.body}</p>
          <p className="mt-1 text-xs text-muted-foreground">{bookingCopy.concierge.prototype}</p>
        </div>
      )}
    </div>
  )
}

function Confirmation({
  booking,
  reward,
  points,
  fresh,
}: {
  booking: RewardBooking
  reward: ProgramReward
  points: number
  fresh: boolean
}) {
  return (
    <>
      <div className="p-6 pb-5">
        <p className="flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground">
          <CalendarCheck className="size-4" aria-hidden />
          {fresh ? copy.doneEyebrow : copy.alreadyEyebrow}
        </p>
        <DialogTitle className="mt-3 text-balance pr-6 font-display text-2xl font-bold leading-tight">
          {booking.rewardTitle || reward.title}
        </DialogTitle>
        <DialogDescription className="mt-2 text-pretty">{reward.claim?.confirmation ?? reward.description}</DialogDescription>
      </div>
      <Separator />
      <div className="grid gap-4 p-6">
        <BookingProof booking={booking} />
        <ChoiceSummary claim={reward.claim} choices={booking.choices} tickets={booking.tickets} />
        <p className="text-pretty text-sm font-bold">{copy.noPointsSpent(formatPoints(points))}</p>
        <Concierge />
      </div>
      <div className="p-6 pt-0">
        <DialogClose asChild>
          <Button type="button" className="h-11 w-full">
            {copy.close}
          </Button>
        </DialogClose>
      </div>
    </>
  )
}

/**
 * The inside of a booking dialog (title, options, summary, confirm, confirmation).
 * Render it inside a DialogContent with BOOKING_DIALOG_CLASS.
 */
export function BookingBody({ reward, levelId }: BookingTarget) {
  const { me, bookReward } = useSession()
  const claim = reward.claim
  const existing = me ? findBooking(me, reward.id) : null
  const [choices, setChoices] = useState<Record<string, string>>(() =>
    Object.fromEntries((claim?.options ?? []).filter((o) => o.choices.length === 1).map((o) => [o.id, o.choices[0]])),
  )
  const [tickets, setTickets] = useState(1)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState<RewardBooking | null>(null)
  const limited = claim?.seatsPerChoice !== undefined
  const { availability, reload } = useRewardAvailability(limited && !existing && !done ? reward.id : null)

  const booking = done ?? existing
  if (booking) {
    return <Confirmation booking={booking} reward={reward} points={me?.level.points ?? 0} fresh={done !== null} />
  }

  const level = getLevel(program, levelId)
  const options = claim?.options ?? []
  const firstOpen = options.findIndex((o) => !choices[o.id])
  const complete = claim !== undefined && firstOpen === -1
  const visible = firstOpen === -1 ? options : options.slice(0, firstOpen + 1)

  const seatsFor = (choice: string): number | null => {
    const n = availability?.seatsLeft?.[choice]
    return typeof n === 'number' ? n : null
  }
  const maxTickets = claim?.tickets ? maxTicketsFor(me) : 1
  const firstChoice = options[0] ? choices[options[0].id] : undefined
  const seatsForFirst = firstChoice ? seatsFor(firstChoice) : null
  const ticketChoices = Array.from({ length: maxTickets }, (_, i) => i + 1)
  // A first choice with fewer seats left than the tickets picked earlier caps the request.
  const ticketsToBook = seatsForFirst !== null && seatsForFirst > 0 ? Math.min(tickets, seatsForFirst) : tickets

  const select = (optionId: string, value: string) => {
    setError(null)
    setChoices((prev) => ({ ...prev, [optionId]: value }))
  }

  const confirm = async () => {
    if (!claim || !complete) return
    setBusy(true)
    setError(null)
    try {
      const picked = Object.fromEntries(claim.options.map((o) => [o.id, choices[o.id] ?? '']))
      const res = await bookReward({ rewardId: reward.id, choices: picked, ...(claim.tickets ? { tickets: ticketsToBook } : {}) })
      setDone(res.booking)
    } catch (err) {
      setError(bookingError(err))
      if (err instanceof ApiRequestError && err.status === 409) reload()
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <div className="p-6 pb-5">
        <p className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground">
          {copy.eyebrow}
          <span className="rounded-sm border border-border px-1.5 py-0.5 normal-case tracking-normal">{level.name}</span>
        </p>
        <DialogTitle className="mt-3 text-balance pr-6 font-display text-2xl font-bold leading-tight">{reward.title}</DialogTitle>
        <DialogDescription className="mt-2 text-pretty">{reward.description}</DialogDescription>
        {reward.note && <p className="mt-2 text-pretty text-xs text-muted-foreground">{reward.note}</p>}
      </div>

      {visible.length > 0 && (
        <>
          <Separator />
          <div className="grid gap-5 p-6">
            {visible.map((option, index) => (
              <fieldset key={option.id} className="grid gap-2" data-option={option.id}>
                <legend className="mb-2 text-xs uppercase tracking-widest text-muted-foreground">{option.label}</legend>
                {option.choices.map((choice) => {
                  const seats = index === 0 && limited ? seatsFor(choice) : null
                  const soldOut = seats === 0
                  const selected = choices[option.id] === choice
                  return (
                    <button
                      key={choice}
                      type="button"
                      aria-pressed={selected}
                      disabled={soldOut || busy}
                      onClick={() => select(option.id, choice)}
                      className={cn(
                        'flex min-h-11 items-center justify-between gap-3 rounded-md border px-3 py-2 text-left text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50',
                        selected ? 'border-foreground bg-foreground text-background' : 'border-border hover:bg-accent',
                      )}
                    >
                      <span className="font-medium">{choice}</span>
                      {seats !== null ? (
                        <span
                          className={cn('shrink-0 text-xs tabular-nums', selected ? 'text-background' : 'text-muted-foreground')}
                        >
                          {soldOut ? copy.soldOut : copy.seatsLeft(seats)}
                        </span>
                      ) : (
                        selected && <Check className="size-4 shrink-0" aria-hidden />
                      )}
                    </button>
                  )
                })}
              </fieldset>
            ))}
            {complete && claim?.tickets && (
              <fieldset className="grid gap-2" data-option="tickets">
                <legend className="mb-1 text-xs uppercase tracking-widest text-muted-foreground">{copy.ticketsLabel}</legend>
                <p className="-mt-1 mb-1 text-xs text-muted-foreground">{copy.ticketsHint}</p>
                <div className="flex flex-wrap gap-2">
                  {ticketChoices.map((n) => {
                    const selected = ticketsToBook === n
                    return (
                      <button
                        key={n}
                        type="button"
                        aria-pressed={selected}
                        aria-label={copy.ticketsRow(n)}
                        disabled={busy || (seatsForFirst !== null && n > seatsForFirst)}
                        onClick={() => {
                          setError(null)
                          setTickets(n)
                        }}
                        className={cn(
                          'flex size-11 items-center justify-center rounded-md border text-sm font-bold tabular-nums transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50',
                          selected ? 'border-foreground bg-foreground text-background' : 'border-border hover:bg-accent',
                        )}
                      >
                        {n}
                      </button>
                    )
                  })}
                </div>
              </fieldset>
            )}
          </div>
        </>
      )}

      {complete && (
        <>
          <Separator />
          <div className="grid gap-3 p-6">
            <h3 className="font-sans text-xs uppercase tracking-widest text-muted-foreground">{copy.summary}</h3>
            <ChoiceSummary claim={claim} choices={choices} tickets={ticketsToBook} />
          </div>
        </>
      )}

      {claim && (
        <div className="grid gap-2 p-6 pt-0">
          {error && (
            <p role="alert" className="rounded-md border border-foreground/60 p-3 text-pretty text-sm">
              {error}
            </p>
          )}
          <Button type="button" className="h-11 w-full" disabled={!complete || busy} onClick={() => void confirm()}>
            {busy && <LoaderCircle className="animate-spin" aria-hidden />}
            {busy ? copy.confirming : claim.cta}
          </Button>
          <p className="text-center text-xs text-muted-foreground">{copy.free}</p>
        </div>
      )}
    </>
  )
}

/** A standalone booking dialog, open while `target` is set. */
export function BookingDialog({ target, onClose }: { target: BookingTarget | null; onClose: () => void }) {
  return (
    <Dialog open={target !== null} onOpenChange={(open) => !open && onClose()}>
      {target && (
        <DialogContent className={BOOKING_DIALOG_CLASS}>
          <BookingBody key={target.reward.id} reward={target.reward} levelId={target.levelId} />
        </DialogContent>
      )}
    </Dialog>
  )
}

/**
 * What a reward offers next to its title: the claim button when its level is reached, "Prenotato" and the
 * code once booked, "Si sblocca a ..." while locked. Nothing for rewards without a claim or when anonymous.
 * With `onBook` the caller opens the booking itself (the DemoPanel swaps its dialog body).
 */
export function RewardClaimAction({
  reward,
  levelId,
  me,
  onBook,
  className,
}: BookingTarget & {
  me: MeResponse | null
  onBook?: (target: BookingTarget) => void
  className?: string
}) {
  const [open, setOpen] = useState(false)
  if (!reward.claim || !me) return null

  const booking = findBooking(me, reward.id)
  const reached = isLevelReached(program, me.level.current, levelId)
  let inline
  if (booking) {
    inline = (
      <span data-booked="true" className="flex flex-wrap items-center gap-2 text-xs">
        <Badge variant="outline" className="gap-1 rounded-sm font-medium">
          <Check className="size-3" aria-hidden />
          {bookingCopy.reward.booked}
        </Badge>
        <span className="font-bold tabular-nums">
          <span className="sr-only">{bookingCopy.reward.codeLabel} </span>
          {booking.code}
        </span>
      </span>
    )
  } else if (!reached) {
    inline = (
      <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Lock className="size-3.5 shrink-0" aria-hidden />
        {bookingCopy.reward.locked(getLevel(program, levelId).name)}
      </span>
    )
  } else {
    inline = (
      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={() => (onBook ? onBook({ reward, levelId }) : setOpen(true))}
      >
        {reward.claim.cta}
      </Button>
    )
  }

  return (
    <div className={cn('flex items-center', className)}>
      {inline}
      {!onBook && <BookingDialog target={open ? { reward, levelId } : null} onClose={() => setOpen(false)} />}
    </div>
  )
}
