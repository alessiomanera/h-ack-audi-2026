// "I tuoi premi": the rewards the user booked, newest first, with choices, code and date.
// Booking never spends points. Neutral surfaces only.
import { useId } from 'react'
import type { RewardBooking } from '@/shared/types'
import { formatDate } from '@/lib/utils'
import { bookingCopy } from './booking.copy.it'
import { findProgramReward, orderedChoices } from './BookingDialog'

const copy = bookingCopy.myBookings

/** The list alone (the portal wraps it in its own section). */
export function MyBookingsList({ bookings }: { bookings: RewardBooking[] }) {
  if (bookings.length === 0) {
    return <p className="rounded-lg border border-border bg-card p-4 text-pretty text-sm text-muted-foreground">{copy.empty}</p>
  }
  return (
    <ul className="divide-y divide-border rounded-lg border border-border bg-card">
      {bookings.map((booking) => {
        const claim = findProgramReward(booking.rewardId)?.reward.claim
        const values = orderedChoices(claim, booking.choices).map((row) => row.value)
        return (
          <li
            key={booking.id}
            data-reward={booking.rewardId}
            className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2 px-4 py-3"
          >
            <div className="min-w-0">
              <p className="text-pretty text-sm font-bold">{booking.rewardTitle}</p>
              {values.length > 0 && <p className="text-pretty text-xs text-muted-foreground">{values.join(', ')}</p>}
              <p className="text-xs text-subtle">{copy.bookedOn(formatDate(booking.createdAt))}</p>
            </div>
            <div className="shrink-0 text-right">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{copy.codeLabel}</p>
              <p className="font-display text-base font-bold tabular-nums">{booking.code}</p>
            </div>
          </li>
        )
      })}
    </ul>
  )
}

/** Compact section for the mobile tab, with its own heading. */
export function MyBookings({ bookings }: { bookings: RewardBooking[] }) {
  const titleId = useId()
  return (
    <section aria-labelledby={titleId} className="space-y-3">
      <h2 id={titleId} className="text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">
        {copy.title}
      </h2>
      <MyBookingsList bookings={bookings} />
    </section>
  )
}
