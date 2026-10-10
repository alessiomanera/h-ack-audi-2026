import { render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { describe, expect, it } from 'vitest'
import { formatPoints } from '@/lib/utils'
import type { MeResponse } from '@/shared/types'
import { SessionTestProvider, type SessionStatus } from '@/state/session'
import { portalCopy } from './copy.it'
import { lucaMe, makeSession, paoloMe } from './fixtures'
import { FullPortal } from './FullPortal'
import { HistorySection } from './HistorySection'
import { computeMetrics, isUnlocked, monthlyPoints, nextReward } from './metrics'

function renderPortal(status: SessionStatus, me: MeResponse | null = null, url = '/?vista=completa&demo=1') {
  return render(
    <MemoryRouter initialEntries={[url]}>
      <SessionTestProvider value={makeSession(status, me)}>
        <FullPortal />
      </SessionTestProvider>
    </MemoryRouter>,
  )
}

const heading = (name: string) => screen.getByRole('heading', { level: 2, name })

describe('FullPortal', () => {
  it('shows a quiet skeleton while loading', () => {
    renderPortal('loading')
    expect(screen.getByRole('status')).toHaveTextContent(portalCopy.loading)
    expect(screen.queryByRole('heading', { level: 2 })).not.toBeInTheDocument()
  })

  it('shows the hero and the public program sections when anonymous', () => {
    renderPortal('anonymous')
    expect(screen.getByRole('heading', { level: 1, name: 'La tua Audi evolve con te' })).toBeInTheDocument()
    for (const title of ['Come funziona', 'Guadagna punti', 'Livelli e premi', 'Esperienze', 'Il passaggio', 'Regolamento breve']) {
      expect(heading(title)).toBeInTheDocument()
    }
    expect(screen.queryByRole('heading', { level: 2, name: 'La tua famiglia' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: portalCopy.topBar.logout })).not.toBeInTheDocument()
    expect(screen.getByText(portalCopy.footer)).toBeInTheDocument()
  })

  it('shows every section in order with metrics for Luca', () => {
    const { container } = renderPortal('authenticated', lucaMe)
    const titles = Array.from(container.querySelectorAll('h2[id$="-titolo"]')).map((h) => h.textContent)
    expect(titles).toEqual([
      'Il tuo livello',
      'Come funziona',
      'Guadagna punti',
      'Livelli e premi',
      'Esperienze',
      'La tua famiglia',
      'Storico punti',
      'Il passaggio',
      'Regolamento breve',
    ])

    // Metrics row: total, family sum, service and experience counts.
    const metrics = within(screen.getByRole('group', { name: portalCopy.level.metricsLabel }))
    const metric = (label: string) => metrics.getByText(label).nextElementSibling
    expect(metric(portalCopy.level.metrics.totalPoints)).toHaveTextContent('850')
    expect(metric(portalCopy.level.metrics.familyPoints)).toHaveTextContent(formatPoints(2050))
    expect(metric(portalCopy.level.metrics.pointsToNext)).toHaveTextContent('650')
    expect(metric(portalCopy.level.metrics.services)).toHaveTextContent('1')
    expect(metric(portalCopy.level.metrics.experiences)).toHaveTextContent('2')

    // Family: Luca is a secondary user on Paolo's A3, so no invite button.
    const family = within(screen.getByRole('region', { name: 'La tua famiglia' }))
    expect(family.getByText(portalCopy.family.secondary('Paolo'))).toBeInTheDocument()
    expect(family.getByText('Audi A3 del 2021')).toBeInTheDocument()
    expect(family.getByText(portalCopy.family.slots(1, 5))).toBeInTheDocument()

    // Passage starts from the family car.
    expect(within(screen.getByRole('region', { name: 'Il passaggio' })).getByText('A3 di famiglia')).toBeInTheDocument()

    // Top bar: name, logout, and a mobile link that keeps the other params.
    expect(screen.getByRole('button', { name: portalCopy.topBar.logout })).toBeInTheDocument()
    const mobile = screen.getByRole('link', { name: portalCopy.topBar.mobileView })
    const search = new URLSearchParams(mobile.getAttribute('href')?.split('?')[1])
    expect(search.get('vista')).toBe('tab')
    expect(search.get('demo')).toBe('1')
  })

  it('marks the current level and locks experiences above it', () => {
    renderPortal('authenticated', lucaMe)
    const levels = screen.getByRole('region', { name: 'Livelli e premi' })
    const plus = within(levels).getByRole('article', { name: 'Plus' })
    expect(within(plus).getByText(portalCopy.levels.current)).toBeInTheDocument()
    const experiences = screen.getByRole('region', { name: 'Esperienze' })
    expect(within(experiences).getAllByText('Da Vorsprung').length).toBeGreaterThan(0)
    expect(within(experiences).getAllByText(portalCopy.experiences.unlocked).length).toBeGreaterThan(0)
  })

  it('lets a key user invite and see pending invites', () => {
    renderPortal('authenticated', paoloMe)
    const family = within(screen.getByRole('region', { name: 'La tua famiglia' }))
    expect(family.getByText('sara@example.com')).toBeInTheDocument()
    expect(family.queryByText(portalCopy.family.secondary('Paolo'))).not.toBeInTheDocument()
    expect(within(screen.getByRole('region', { name: 'Il passaggio' })).getByText('La tua A3')).toBeInTheDocument()
  })
})

describe('HistorySection', () => {
  it('lists the ledger', () => {
    render(<HistorySection ledger={lucaMe.ledger} now={new Date(2026, 9, 10)} />)
    expect(screen.getByText('Tagliando in officina Audi (punti doppi)')).toBeInTheDocument()
    expect(screen.getByText('+400')).toBeInTheDocument()
  })
})

describe('portal metrics', () => {
  it('computes the metrics row', () => {
    expect(computeMetrics(lucaMe)).toEqual({
      totalPoints: 850,
      levelName: 'Plus',
      pointsToNext: 650,
      familyPoints: 2050,
      serviceCount: 1,
      experienceCount: 2,
    })
  })

  it('buckets points by month for the last 6 months', () => {
    const buckets = monthlyPoints(lucaMe.ledger, new Date(2026, 9, 10))
    expect(buckets.map((b) => b.key)).toEqual(['2026-05', '2026-06', '2026-07', '2026-08', '2026-09', '2026-10'])
    expect(buckets.map((b) => b.points)).toEqual([200, 0, 400, 150, 100, 0])
  })

  it('finds the next reward and unlocks by level', () => {
    expect(nextReward(lucaMe)?.levelName).toBe('Vorsprung')
    expect(nextReward({ ...lucaMe, level: { ...lucaMe.level, current: 'vorsprung', next: null } })).toBeNull()
    expect(isUnlocked('plus', 'start')).toBe(true)
    expect(isUnlocked('plus', 'vorsprung')).toBe(false)
  })
})
