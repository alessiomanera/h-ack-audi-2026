import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { SessionTestProvider } from '@/state/session'
import { CourtesyCarCard } from './CourtesyCarCard'
import { LevelCard } from './LevelCard'
import { PointsProgress } from './PointsProgress'
import { lucaMe, makeSession, plusOffer } from './fixtures'

function renderCard(variant: 'compact' | 'full' = 'full') {
  return render(
    <MemoryRouter>
      <SessionTestProvider value={makeSession()}>
        <LevelCard me={lucaMe} variant={variant} />
      </SessionTestProvider>
    </MemoryRouter>,
  )
}

describe('LevelCard', () => {
  it('shows level, first name, points and what is missing for the next level', () => {
    renderCard()
    expect(screen.getByRole('heading', { name: 'Start' })).toBeInTheDocument()
    expect(screen.getByText('Luca')).toBeInTheDocument()
    expect(screen.getByTestId('level-points')).toHaveTextContent('320')
    expect(screen.getByText('Ancora 180 punti per Plus')).toBeInTheDocument()
  })

  it('carries the single signal progress bar with aria values', () => {
    renderCard()
    const bar = screen.getByRole('progressbar')
    expect(bar).toHaveAttribute('aria-valuenow', '64')
    expect(bar).toHaveAttribute('aria-valuemin', '0')
    expect(bar).toHaveAttribute('aria-valuemax', '100')
    expect(bar.firstElementChild).toHaveClass('bg-signal')
  })

  it('full variant adds the tagline and the vehicle line', () => {
    renderCard('full')
    expect(screen.getByText('Sei dentro: la tua Audi ti riconosce.')).toBeInTheDocument()
    expect(screen.getByText('Audi A3 del 2021, utente secondario')).toBeInTheDocument()
  })

  it('compact variant stays short', () => {
    renderCard('compact')
    expect(screen.queryByText('Audi A3 del 2021, utente secondario')).not.toBeInTheDocument()
  })

  it('says when the top level is reached', () => {
    const top = { ...lucaMe, level: { current: 'vorsprung' as const, next: null, points: 1800, pointsToNext: null, progress: 1 } }
    render(<LevelCard me={top} variant="compact" />)
    expect(screen.getByText('Hai raggiunto il livello più alto')).toBeInTheDocument()
  })
})

describe('PointsProgress', () => {
  it('neutral tone never uses the signal color', () => {
    render(<PointsProgress level={lucaMe.level} />)
    expect(screen.getByRole('progressbar').firstElementChild).not.toHaveClass('bg-signal')
  })
})

describe('CourtesyCarCard', () => {
  it('shows the offered model and the car it replaces', () => {
    render(<CourtesyCarCard offer={plusOffer} />)
    expect(screen.getByText('La tua auto di cortesia')).toBeInTheDocument()
    expect(screen.getByText('Audi A5')).toBeInTheDocument()
    expect(screen.getByText('al posto della tua A3')).toBeInTheDocument()
    expect(screen.getByText('Un segmento in più')).toBeInTheDocument()
  })
})
