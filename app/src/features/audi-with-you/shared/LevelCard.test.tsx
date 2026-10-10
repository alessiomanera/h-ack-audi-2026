import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import type { MeResponse } from '@/shared/types'
import { SessionTestProvider } from '@/state/session'
import { getLevel, LEVEL_ORDER, program } from '../program'
import { CourtesyCarCard } from './CourtesyCarCard'
import { LevelCard } from './LevelCard'
import { PointsProgress } from './PointsProgress'
import { giuliaMe, lucaMe, makeSession, quattroOffer } from './fixtures'

function renderCard(variant: 'compact' | 'full' = 'full', me: MeResponse = lucaMe) {
  return render(
    <MemoryRouter>
      <SessionTestProvider value={makeSession({ me })}>
        <LevelCard me={me} variant={variant} />
      </SessionTestProvider>
    </MemoryRouter>,
  )
}

const topMe: MeResponse = {
  ...lucaMe,
  level: { current: 'rs-vanguard', next: null, points: 3200, pointsToNext: null, progress: 1 },
}

describe('LevelCard', () => {
  it('shows level, first name, points and what is missing for the next level', () => {
    renderCard()
    expect(screen.getByRole('heading', { name: 'Icon Circle' })).toBeInTheDocument()
    expect(screen.getByText('Luca')).toBeInTheDocument()
    expect(screen.getByTestId('level-points')).toHaveTextContent('320')
    expect(screen.getByText('Ancora 180 punti per quattro Circle')).toBeInTheDocument()
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
    expect(screen.getByText(getLevel(program, 'icon-circle').tagline)).toBeInTheDocument()
    expect(screen.getByText('Audi A3 del 2021, utente secondario')).toBeInTheDocument()
  })

  it('compact variant stays short', () => {
    renderCard('compact')
    expect(screen.queryByText('Audi A3 del 2021, utente secondario')).not.toBeInTheDocument()
  })

  it('says when the top level is reached', () => {
    render(<LevelCard me={topMe} variant="compact" />)
    expect(screen.getByText('Hai raggiunto il livello più alto')).toBeInTheDocument()
  })
})

describe('LevelCard level rings', () => {
  function rings() {
    return screen.getAllByTestId('level-ring')
  }
  function filled() {
    return rings().filter((r) => r.getAttribute('data-filled') === 'true')
  }

  it('draws one separate hairline circle per level, four in all', () => {
    renderCard()
    expect(LEVEL_ORDER).toHaveLength(4)
    expect(rings()).toHaveLength(LEVEL_ORDER.length)
    for (const ring of rings()) {
      expect(ring).toHaveClass('rounded-full', 'border')
      // Chalk or outline only: the lava stays on the progress fill.
      expect(ring.className).not.toMatch(/signal/)
    }
  })

  it('fills only the entry ring at Icon Circle', () => {
    renderCard()
    expect(filled()).toHaveLength(1)
    expect(rings()[0]).toHaveAttribute('data-filled', 'true')
    expect(screen.getByRole('img', { name: 'Livello 1 di 4: Icon Circle' })).toBeInTheDocument()
  })

  it('fills two rings at quattro Circle, outline above', () => {
    renderCard('compact', giuliaMe)
    expect(filled()).toHaveLength(2)
    expect(rings()[2]).toHaveAttribute('data-filled', 'false')
    expect(rings()[2]).toHaveClass('bg-transparent')
    expect(screen.getByRole('img', { name: 'Livello 2 di 4: quattro Circle' })).toBeInTheDocument()
  })

  it('fills every ring at the top level', () => {
    render(<LevelCard me={topMe} variant="full" />)
    expect(filled()).toHaveLength(4)
    expect(screen.getByRole('img', { name: 'Livello 4 di 4: RS Vanguard' })).toBeInTheDocument()
  })

  it('keeps the progress fill as the only signal element of the card', () => {
    const { container } = renderCard('full')
    const signal = container.querySelectorAll('[class*="signal"]')
    expect(signal).toHaveLength(1)
    expect(signal[0]).toHaveAttribute('data-tone', 'signal')
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
    render(<CourtesyCarCard offer={quattroOffer} />)
    expect(screen.getByText('La tua auto di cortesia')).toBeInTheDocument()
    expect(screen.getByText('Audi A5')).toBeInTheDocument()
    expect(screen.getByText('al posto della tua A3')).toBeInTheDocument()
    expect(screen.getByText('Un segmento in più')).toBeInTheDocument()
  })
})
