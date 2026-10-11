import type { ReactNode } from 'react'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import type { MeResponse } from '@/shared/types'
import { formatPoints } from '@/lib/utils'
import { api, ApiRequestError } from '@/state/api'
import { SessionTestProvider, type SessionValue } from '@/state/session'
import { BookingDialog, RewardClaimAction } from './BookingDialog'
import {
  dolomitiBooking,
  dolomitiBookingResponse,
  dolomitiReward,
  fasttrackBooking,
  giuliaMe,
  giuliaSlineMe,
  makeSession,
  paoloMe,
  quattroKitReward,
} from './fixtures'
import { MyBookings, MyBookingsList } from './MyBookings'

function renderWith(ui: ReactNode, session: SessionValue) {
  return render(
    <MemoryRouter>
      <SessionTestProvider value={session}>{ui}</SessionTestProvider>
    </MemoryRouter>,
  )
}

function mockSeats(seatsLeft: Record<string, number> | null) {
  return vi.spyOn(api, 'getAvailability').mockResolvedValue({ rewardId: 'sline-dolomiti', seatsLeft, booked: false })
}

const dolomiti = { reward: dolomitiReward, levelId: 's-line-club' }

afterEach(() => {
  vi.restoreAllMocks()
})

describe('BookingDialog', () => {
  it('asks the options in order, shows the seats, then books with every choice', async () => {
    const seats = mockSeats({ "Cortina d'Ampezzo": 20, 'Alta Badia': 3, 'Madonna di Campiglio': 0 })
    const bookReward = vi.fn(async () => dolomitiBookingResponse)
    renderWith(<BookingDialog target={dolomiti} onClose={() => {}} />, makeSession({ me: giuliaSlineMe, bookReward }))

    const dialog = within(screen.getByRole('dialog'))
    expect(seats).toHaveBeenCalledWith('sline-dolomiti')
    expect(dialog.getByRole('heading', { name: 'Una giornata Audi sulle Dolomiti' })).toBeInTheDocument()
    expect(dialog.getByText("Scegli l'hub")).toBeInTheDocument()
    // The second option appears only after the first choice.
    expect(dialog.queryByText('Scegli la data')).not.toBeInTheDocument()
    expect(await dialog.findByText('Restano 20 posti')).toBeInTheDocument()
    expect(dialog.getByText('Restano 3 posti')).toBeInTheDocument()
    expect(dialog.getByRole('button', { name: /Madonna di Campiglio/ })).toBeDisabled()
    const confirm = dialog.getByRole('button', { name: 'Prenota' })
    expect(confirm).toBeDisabled()

    fireEvent.click(dialog.getByRole('button', { name: /Cortina d'Ampezzo/ }))
    expect(dialog.getByRole('button', { name: /Cortina d'Ampezzo/ })).toHaveAttribute('aria-pressed', 'true')
    expect(dialog.getByText('Scegli la data')).toBeInTheDocument()
    fireEvent.click(dialog.getByRole('button', { name: 'Sabato 30 gennaio 2027' }))

    // Summary, then confirm.
    expect(dialog.getByText('La tua scelta')).toBeInTheDocument()
    expect(dialog.getByText('Prenotare non consuma punti.')).toBeInTheDocument()
    fireEvent.click(dialog.getByRole('button', { name: 'Prenota' }))
    await waitFor(() =>
      expect(bookReward).toHaveBeenCalledWith({
        rewardId: 'sline-dolomiti',
        choices: { hub: "Cortina d'Ampezzo", data: 'Sabato 30 gennaio 2027' },
      }),
    )

    // Confirmation: code in large figures, choices, and no points spent.
    expect(await dialog.findByText('Prenotazione confermata')).toBeInTheDocument()
    expect(dialog.getByTestId('booking-code')).toHaveTextContent('AWY-7K2Q')
    expect(dialog.getByTestId('booking-code')).toHaveClass('tabular-nums')
    expect(dialog.getByText("Cortina d'Ampezzo")).toBeInTheDocument()
    expect(dialog.getByText('Sabato 30 gennaio 2027')).toBeInTheDocument()
    expect(dialog.getByText('Ci vediamo in montagna.')).toBeInTheDocument()
    expect(dialog.getByText(`Nessun punto speso: i tuoi ${formatPoints(2550)} punti restano tuoi.`)).toBeInTheDocument()
    expect(dialog.getByRole('button', { name: 'Chiudi' })).toBeInTheDocument()
  })

  it('shows the server message inline when the seats are gone', async () => {
    mockSeats({ "Cortina d'Ampezzo": 1, 'Alta Badia': 20, 'Madonna di Campiglio': 20 })
    const bookReward = vi.fn(async () => {
      throw new ApiRequestError(409, { error: 'sold_out', message: 'Posti finiti per questa scelta.' })
    })
    renderWith(<BookingDialog target={dolomiti} onClose={() => {}} />, makeSession({ me: giuliaSlineMe, bookReward }))
    const dialog = within(screen.getByRole('dialog'))
    fireEvent.click(await dialog.findByRole('button', { name: /Cortina d'Ampezzo.*Resta 1 posto/ }))
    fireEvent.click(dialog.getByRole('button', { name: 'Sabato 16 gennaio 2027' }))
    fireEvent.click(dialog.getByRole('button', { name: 'Prenota' }))
    expect(await dialog.findByRole('alert')).toHaveTextContent('Posti finiti per questa scelta.')
    expect(dialog.queryByTestId('booking-code')).not.toBeInTheDocument()
  })

  it('opens on the existing booking when the reward is already booked', () => {
    const seats = mockSeats(null)
    const me: MeResponse = { ...giuliaSlineMe, bookings: [dolomitiBooking] }
    renderWith(<BookingDialog target={dolomiti} onClose={() => {}} />, makeSession({ me }))
    const dialog = within(screen.getByRole('dialog'))
    expect(dialog.getByText('Hai già prenotato')).toBeInTheDocument()
    expect(dialog.getByTestId('booking-code')).toHaveTextContent('AWY-7K2Q')
    expect(seats).not.toHaveBeenCalled()
  })

  it('books an unlimited reward without asking for seats', async () => {
    const seats = mockSeats(null)
    const bookReward = vi.fn(async () => ({ ...dolomitiBookingResponse, seatsLeft: null }))
    renderWith(
      <BookingDialog target={{ reward: quattroKitReward, levelId: 'quattro-circle' }} onClose={() => {}} />,
      makeSession({ me: giuliaMe, bookReward }),
    )
    const dialog = within(screen.getByRole('dialog'))
    expect(dialog.queryByText(/posti/)).not.toBeInTheDocument()
    fireEvent.click(dialog.getByRole('button', { name: 'Padova' }))
    fireEvent.click(dialog.getByRole('button', { name: 'Ritira in concessionaria' }))
    await waitFor(() => expect(bookReward).toHaveBeenCalledWith({ rewardId: 'quattro-kit', choices: { concessionaria: 'Padova' } }))
    expect(seats).not.toHaveBeenCalled()
  })

  it('stays neutral: no signal color', () => {
    mockSeats(null)
    renderWith(<BookingDialog target={dolomiti} onClose={() => {}} />, makeSession({ me: giuliaSlineMe }))
    expect(screen.getByRole('dialog').querySelector('[class*="signal"]')).toBeNull()
  })
})

describe('RewardClaimAction', () => {
  it('shows the cta when the level is reached and opens the booking', () => {
    mockSeats(null)
    renderWith(<RewardClaimAction {...dolomiti} me={giuliaSlineMe} />, makeSession({ me: giuliaSlineMe }))
    fireEvent.click(screen.getByRole('button', { name: 'Prenota' }))
    expect(within(screen.getByRole('dialog')).getByRole('heading', { name: dolomitiReward.title })).toBeInTheDocument()
  })

  it('has no button while the level is locked', () => {
    renderWith(<RewardClaimAction {...dolomiti} me={giuliaMe} />, makeSession({ me: giuliaMe }))
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
    expect(screen.getByText('Si sblocca a S line Club')).toBeInTheDocument()
  })

  it('shows "Prenotato" and the code once booked', () => {
    const me: MeResponse = { ...giuliaSlineMe, bookings: [dolomitiBooking] }
    renderWith(<RewardClaimAction {...dolomiti} me={me} />, makeSession({ me }))
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
    expect(screen.getByText('Prenotato')).toBeInTheDocument()
    expect(screen.getByText('AWY-7K2Q')).toBeInTheDocument()
  })

  it('renders nothing for a reward without a claim or when anonymous', () => {
    const { container } = renderWith(
      <>
        <RewardClaimAction reward={{ ...dolomitiReward, claim: undefined }} levelId="s-line-club" me={giuliaSlineMe} />
        <RewardClaimAction {...dolomiti} me={null} />
      </>,
      makeSession({ me: giuliaSlineMe }),
    )
    expect(container).toBeEmptyDOMElement()
  })
})

describe('MyBookings', () => {
  it('explains the empty state', () => {
    render(<MyBookings bookings={[]} />)
    expect(screen.getByRole('heading', { name: 'I tuoi premi' })).toBeInTheDocument()
    expect(
      screen.getByText('Quando raggiungi un livello, qui trovi i premi che prenoti. Prenotare non consuma punti.'),
    ).toBeInTheDocument()
  })

  it('lists title, choices in order, code and date', () => {
    render(<MyBookingsList bookings={paoloMe.bookings} />)
    const item = within(screen.getByRole('listitem'))
    expect(item.getByText(fasttrackBooking.rewardTitle)).toBeInTheDocument()
    expect(item.getByText('Martedì 13 ottobre, 8:30, Treviso')).toBeInTheDocument()
    expect(item.getByText('AWY-3F9D')).toBeInTheDocument()
    expect(item.getByText(/^Prenotato il 9 ott 2026$/)).toBeInTheDocument()
  })
})

describe('T007: tickets, QR, shipping and concierge', () => {
  const ticketed = { reward: { ...dolomitiReward, claim: { ...dolomitiReward.claim!, tickets: true } }, levelId: 's-line-club' }
  const withMarco: MeResponse = {
    ...giuliaSlineMe,
    households: giuliaSlineMe.households.map((h, i) =>
      i === 0
        ? {
            ...h,
            members: [
              ...h.members,
              { userId: 'u-marco', name: 'Marco Ferri', role: 'secondary', points: 0, level: 'icon-circle', isMe: false },
            ],
          }
        : h,
    ),
  }

  it('offers one ticket per person on the account and books them', async () => {
    mockSeats({ "Cortina d'Ampezzo": 20, 'Alta Badia': 20, 'Madonna di Campiglio': 20 })
    const bookReward = vi.fn(async () => ({ ...dolomitiBookingResponse, booking: { ...dolomitiBooking, tickets: 2 } }))
    renderWith(<BookingDialog target={ticketed} onClose={() => {}} />, makeSession({ me: withMarco, bookReward }))
    const dialog = within(screen.getByRole('dialog'))
    fireEvent.click(await dialog.findByRole('button', { name: /Alta Badia/ }))
    fireEvent.click(dialog.getByRole('button', { name: 'Sabato 16 gennaio 2027' }))
    expect(dialog.getByText('Uno per ogni persona sul tuo account')).toBeInTheDocument()
    expect(dialog.queryByRole('button', { name: '3 persone' })).not.toBeInTheDocument()
    fireEvent.click(dialog.getByRole('button', { name: '2 persone' }))
    fireEvent.click(dialog.getByRole('button', { name: 'Prenota' }))
    await waitFor(() =>
      expect(bookReward).toHaveBeenCalledWith({
        rewardId: 'sline-dolomiti',
        choices: { hub: 'Alta Badia', data: 'Sabato 16 gennaio 2027' },
        tickets: 2,
      }),
    )
    expect(await dialog.findByTestId('booking-qr')).toBeInTheDocument()
    expect(dialog.getByText(/Nessun punto speso/)).toBeInTheDocument()
  })

  it('confirms a welcome kit with home shipping, no QR', () => {
    const kit = { ...fasttrackBooking, id: 'b-kit', rewardId: 'quattro-kit', rewardTitle: 'Kit', delivery: 'shipping' as const }
    renderWith(
      <BookingDialog target={{ reward: quattroKitReward, levelId: 'quattro-circle' }} onClose={() => {}} />,
      makeSession({ me: { ...giuliaMe, bookings: [kit] } }),
    )
    const dialog = within(screen.getByRole('dialog'))
    expect(dialog.getByTestId('booking-shipping')).toHaveTextContent('Spedizione confermata')
    expect(dialog.queryByTestId('booking-qr')).not.toBeInTheDocument()
  })

  it('opens the concierge placeholder after booking and in "I tuoi premi"', () => {
    renderWith(<MyBookingsList bookings={[dolomitiBooking]} />, makeSession({ me: giuliaSlineMe }))
    fireEvent.click(screen.getByRole('button', { name: 'Mostra il QR' }))
    expect(screen.getByTestId('booking-qr').querySelector('svg')).not.toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Contatta il concierge' }))
    expect(screen.getByRole('note')).toHaveTextContent('Prototipo')
  })
})
