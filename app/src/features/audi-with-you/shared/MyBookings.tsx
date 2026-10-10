// "I tuoi premi": the rewards the user booked, newest first, with choices, code and date, the QR code
// on demand (events and services) or the shipping status (kits), and the concierge.
// Booking never spends points. Neutral surfaces only.
import { useId, useState } from 'react'
import { QrCode as QrIcon } from 'lucide-react'
import type { RewardBooking } from '@/shared/types'
import { Button } from '@/components/ui/button'
import { formatDate } from '@/lib/utils'
import { bookingCopy } from './booking.copy.it'
import { BookingProof, Concierge, findProgramReward, orderedChoices } from './BookingDialog'

const copy = bookingCopy.myBookings

function BookingItem({ booking }: { booking: RewardBooking }) {
  const [showQr, setShowQr] = useState(false)
  const claim = findProgramReward(booking.rewardId)?.reward.claim
  const values = orderedChoices(claim, booking.choices).map((row) => row.value)
  if (claim?.tickets) values.push(bookingCopy.dialog.ticketsRow(booking.tickets))
  return (
    <li data-reward={booking.rewardId} className="grid gap-3 px-4 py-3">
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
        <div className="min-w-0">
          <p className="text-pretty text-sm font-bold">{booking.rewardTitle}</p>
          {values.length > 0 && <p className="text-pretty text-xs text-muted-foreground">{values.join(', ')}</p>}
          {booking.delivery === 'shipping' && <p className="text-pretty text-xs text-muted-foreground">{copy.shipped}</p>}
          <p className="text-xs text-subtle">{copy.bookedOn(formatDate(booking.createdAt))}</p>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{copy.codeLabel}</p>
          <p className="font-display text-base font-bold tabular-nums">{booking.code}</p>
        </div>
      </div>
      {booking.delivery === 'qr' && (
        <>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="justify-self-start"
            aria-expanded={showQr}
            onClick={() => setShowQr((v) => !v)}
          >
            <QrIcon aria-hidden />
            {showQr ? copy.hideQr : copy.showQr}
          </Button>
          {showQr && <BookingProof booking={booking} compact />}
        </>
      )}
    </li>
  )
}

/** The list alone (the portal wraps it in its own section). */
export function MyBookingsList({ bookings }: { bookings: RewardBooking[] }) {
  if (bookings.length === 0) {
    return <p className="rounded-lg border border-border bg-card p-4 text-pretty text-sm text-muted-foreground">{copy.empty}</p>
  }
  return (
    <div className="grid gap-3">
      <ul className="divide-y divide-border rounded-lg border border-border bg-card">
        {bookings.map((booking) => (
          <BookingItem key={booking.id} booking={booking} />
        ))}
      </ul>
      <Concierge />
    </div>
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
