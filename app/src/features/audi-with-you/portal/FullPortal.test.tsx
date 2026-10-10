import { render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { describe, expect, it } from 'vitest'
import { formatPoints } from '@/lib/utils'
import type { MeResponse } from '@/shared/types'
import { SessionTestProvider, type SessionStatus } from '@/state/session'
import { getAction, getLevel, isLevelReached, levelsInOrder, program } from '../program'
import { bookingCopy } from '../shared/booking.copy.it'
import { sharedCopy } from '../shared/copy.it'
import { portalCopy } from './copy.it'
import { lucaMe, makeSession, paoloMe, paoloTradeInMe, topLevelMe } from './fixtures'
import { FullPortal } from './FullPortal'
import { HistorySection } from './HistorySection'
import { actionNotes, computeMetrics, monthlyPoints, needsWelcomeKitLabel, nextReward, previewRewards } from './metrics'

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
const region = (name: string) => within(screen.getByRole('region', { name }))

const LEVEL_NAMES = ['Icon Circle', 'quattro Circle', 'S line Club', 'RS Vanguard']
const WRAP = 'Wrap personalizzato'

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
    expect(screen.getByTestId('prototype-note')).toHaveTextContent(portalCopy.prototypeNote)
    // Anonymous: the levels table shows no booking buttons.
    expect(region('Livelli e premi').queryByRole('button', { name: 'Prenota' })).not.toBeInTheDocument()
  })

  it('shows every section in order with metrics for Luca', () => {
    const { container } = renderPortal('authenticated', lucaMe)
    const titles = Array.from(container.querySelectorAll('h2[id$="-titolo"]')).map((h) => h.textContent)
    expect(titles).toEqual([
      'Il tuo livello',
      'I tuoi premi',
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
    expect(metric(portalCopy.level.metrics.totalPoints)).toHaveTextContent(formatPoints(1250))
    expect(metric(portalCopy.level.metrics.familyPoints)).toHaveTextContent(formatPoints(2950))
    expect(metric(portalCopy.level.metrics.pointsToNext)).toHaveTextContent(formatPoints(1250))
    expect(metric(portalCopy.level.metrics.services)).toHaveTextContent('1')
    expect(metric(portalCopy.level.metrics.experiences)).toHaveTextContent('2')

    // Family: Luca is a secondary user on Paolo's A3, so no invite button.
    const family = region('La tua famiglia')
    expect(family.getByText(portalCopy.family.secondary('Paolo'))).toBeInTheDocument()
    expect(family.getByText('Audi A3 del 2021')).toBeInTheDocument()
    expect(family.getByText(portalCopy.family.slots(1, 5))).toBeInTheDocument()

    // Passage starts from the family car.
    expect(region('Il passaggio').getByText('A3 di famiglia')).toBeInTheDocument()

    // Top bar: name, logout, and a mobile link that keeps the other params.
    expect(screen.getByRole('button', { name: portalCopy.topBar.logout })).toBeInTheDocument()
    const mobile = screen.getByRole('link', { name: portalCopy.topBar.mobileView })
    const search = new URLSearchParams(mobile.getAttribute('href')?.split('?')[1])
    expect(search.get('vista')).toBe('tab')
    expect(search.get('demo')).toBe('1')
  })

  it('lists the four levels in threshold order, each with courtesy car and welcome kit, plus the bonus card', () => {
    renderPortal('anonymous')
    const levels = region('Livelli e premi')
    const articles = levels.getAllByRole('article').filter((a) => a.hasAttribute('aria-labelledby'))
    expect(articles.map((a) => within(a).getByRole('heading', { level: 3 }).textContent)).toEqual(LEVEL_NAMES)
    expect(levelsInOrder(program).map((l) => l.name)).toEqual(LEVEL_NAMES)

    for (const level of levelsInOrder(program)) {
      const column = within(levels.getByRole('article', { name: level.name }))
      expect(column.getByText(portalCopy.levels.threshold(formatPoints(level.threshold)))).toBeInTheDocument()
      expect(column.getByText(level.courtesyCar.label)).toBeInTheDocument()
      expect(column.getAllByText(/Kit di benvenuto/).length).toBeGreaterThan(0)
      // The bonus reward is never listed as a plain reward inside a column.
      expect(column.queryByText(WRAP)).not.toBeInTheDocument()
    }
    expect(within(levels.getByRole('article', { name: 'RS Vanguard' })).getByText(portalCopy.levels.bonusPointer)).toBeInTheDocument()

    const bonus = within(levels.getByRole('article', { name: WRAP }))
    expect(bonus.getByText(sharedCopy.bonus.eyebrow)).toBeInTheDocument()
    expect(bonus.getByText(sharedCopy.bonus.unlocksAt('RS Vanguard'))).toBeInTheDocument()
    expect(bonus.getByText(sharedCopy.bonus.limited)).toBeInTheDocument()
  })

  it('shows every enabled action with flat points and its caps', () => {
    renderPortal('anonymous')
    const earn = region('Guadagna punti')
    for (const action of program.actions.filter((a) => a.enabled)) {
      expect(earn.getByRole('heading', { level: 3, name: action.title })).toBeInTheDocument()
    }
    for (const type of ['accessory', 'merch', 'trade_in'] as const) {
      expect(earn.getByRole('heading', { level: 3, name: getAction(program, type).title })).toBeInTheDocument()
    }
    expect(earn.getByText('Max 4 al mese')).toBeInTheDocument()
    expect(earn.getByText('Una volta per ogni Audi')).toBeInTheDocument()
    expect(earn.getByText('x2 se la tua Audi ha più di 2 anni')).toBeInTheDocument()
    expect(earn.getAllByText(portalCopy.earn.points(formatPoints(1000))).length).toBeGreaterThan(0)
    // Points per kind for the service and the sessions, never per euro.
    expect(earn.getByText('Tagliando: +300')).toBeInTheDocument()
    expect(earn.getByText('Audi driving experience: +250')).toBeInTheDocument()
    // Flat points per action: never points per euro spent (a negation such as "mai in base agli euro" is fine).
    expect(screen.getByRole('region', { name: 'Guadagna punti' })).not.toHaveTextContent(/€|per ogni euro|punti per euro/i)
  })

  it('marks the current level and the reached ones, and locks experiences above it', () => {
    renderPortal('authenticated', lucaMe)
    const levels = region('Livelli e premi')
    const current = within(levels.getByRole('article', { name: 'quattro Circle' }))
    expect(current.getByText(portalCopy.levels.current)).toBeInTheDocument()
    expect(within(levels.getByRole('article', { name: 'Icon Circle' })).getByText(portalCopy.levels.reached)).toBeInTheDocument()
    expect(within(levels.getByRole('article', { name: 'S line Club' })).queryByText(portalCopy.levels.reached)).not.toBeInTheDocument()

    const experiences = region('Esperienze')
    const locked = program.experiences.items.find((i) => !isLevelReached(program, lucaMe.level.current, i.minLevel))
    expect(locked).toBeDefined()
    if (locked) {
      const label = portalCopy.experiences.fromLevel(getLevel(program, locked.minLevel).name)
      expect(experiences.getAllByText(label).length).toBeGreaterThan(0)
    }
    expect(experiences.getAllByText(portalCopy.experiences.unlocked).length).toBeGreaterThan(0)
  })

  it('shows the next milestone without the bonus card when the bonus is further away', () => {
    renderPortal('authenticated', lucaMe)
    const level = region('Il tuo livello')
    expect(level.getByRole('heading', { level: 3, name: 'Prossimo traguardo: S line Club' })).toBeInTheDocument()
    expect(level.getByText(portalCopy.level.nextReward.missing(formatPoints(1250)))).toBeInTheDocument()
    expect(level.queryByRole('article', { name: WRAP })).not.toBeInTheDocument()
  })

  it('shows RS Vanguard and the wrap card as next milestone after the trade in (F3, 2700 points)', () => {
    renderPortal('authenticated', paoloTradeInMe)
    const level = region('Il tuo livello')
    expect(level.getByRole('heading', { level: 3, name: 'Prossimo traguardo: RS Vanguard' })).toBeInTheDocument()
    expect(level.getByText(portalCopy.level.nextReward.missing(formatPoints(2300)))).toBeInTheDocument()
    const wrap = within(level.getByRole('article', { name: WRAP }))
    expect(wrap.getByText(sharedCopy.bonus.unlocksAt('RS Vanguard'))).toBeInTheDocument()
    expect(level.getByText(/Kit di benvenuto: profumatore/)).toBeInTheDocument()

    const levels = region('Livelli e premi')
    expect(within(levels.getByRole('article', { name: 'S line Club' })).getByText(portalCopy.levels.current)).toBeInTheDocument()
  })

  it('shows the top level state without a next milestone', () => {
    renderPortal('authenticated', topLevelMe)
    const level = region('Il tuo livello')
    expect(level.getByRole('heading', { level: 3, name: portalCopy.level.nextReward.topTitle })).toBeInTheDocument()
    expect(level.queryByText(/Prossimo traguardo/)).not.toBeInTheDocument()
  })

  it('offers the booking of reached rewards, shows booked ones with the code, locks the others', () => {
    renderPortal('authenticated', paoloMe)
    const levels = region('Livelli e premi')
    const quattro = within(levels.getByRole('article', { name: 'quattro Circle' }))
    const fasttrack = quattro.getByText('Fast track in officina').closest('li')
    expect(fasttrack).not.toBeNull()
    if (fasttrack) {
      expect(within(fasttrack).getByText(bookingCopy.reward.booked)).toBeInTheDocument()
      expect(within(fasttrack).getByText('AWY-3F9D')).toBeInTheDocument()
    }
    expect(quattro.getByRole('button', { name: 'Ritira in concessionaria' })).toBeInTheDocument()
    expect(within(levels.getByRole('article', { name: 'Icon Circle' })).getByRole('button', { name: 'Ritira in concessionaria' })).toBeInTheDocument()

    const sline = within(levels.getByRole('article', { name: 'S line Club' }))
    expect(sline.queryByRole('button')).not.toBeInTheDocument()
    expect(sline.getAllByText(bookingCopy.reward.locked('S line Club')).length).toBeGreaterThan(0)
    const rs = within(levels.getByRole('article', { name: 'RS Vanguard' }))
    expect(rs.getByText(bookingCopy.level.requires(getLevel(program, 'rs-vanguard').requires?.label ?? ''))).toBeInTheDocument()

    // "I tuoi premi" lists the booking with its code.
    const mine = region(bookingCopy.myBookings.title)
    expect(mine.getByText('AWY-3F9D')).toBeInTheDocument()
    expect(mine.getByText('Martedì 13 ottobre, 8:30, Treviso')).toBeInTheDocument()

    // The level card: window points and the points leaving the count.
    expect(region('Il tuo livello').getByText('150 punti escono dal conteggio entro 90 giorni')).toBeInTheDocument()
    expect(region('Storico punti').getByText(bookingCopy.history.lifetime(formatPoints(1850)))).toBeInTheDocument()
  })

  it('shows the empty "I tuoi premi" before any booking', () => {
    renderPortal('authenticated', lucaMe)
    expect(region(bookingCopy.myBookings.title).getByText(bookingCopy.myBookings.empty)).toBeInTheDocument()
  })

  it('lets a key user invite and see pending invites', () => {
    renderPortal('authenticated', paoloMe)
    const family = region('La tua famiglia')
    expect(family.getByText('sara@example.com')).toBeInTheDocument()
    expect(family.queryByText(portalCopy.family.secondary('Paolo'))).not.toBeInTheDocument()
    expect(region('Il passaggio').getByText('La tua A3')).toBeInTheDocument()
  })
})

describe('HistorySection', () => {
  it('lists the ledger', () => {
    render(<HistorySection ledger={lucaMe.ledger} now={new Date(2026, 9, 10)} />)
    expect(screen.getByText('Tagliando in officina Audi (punti doppi)')).toBeInTheDocument()
    expect(screen.getByText('+600')).toBeInTheDocument()
    expect(screen.queryByTestId('history-lifetime')).not.toBeInTheDocument()
  })
})

describe('portal metrics', () => {
  it('computes the metrics row', () => {
    expect(computeMetrics(lucaMe)).toEqual({
      totalPoints: 1250,
      lifetimePoints: 1250,
      levelName: 'quattro Circle',
      pointsToNext: 1250,
      familyPoints: 2950,
      serviceCount: 1,
      experienceCount: 2,
    })
  })

  it('buckets points by month for the last 6 months', () => {
    const buckets = monthlyPoints(lucaMe.ledger, new Date(2026, 9, 10))
    expect(buckets.map((b) => b.key)).toEqual(['2026-05', '2026-06', '2026-07', '2026-08', '2026-09', '2026-10'])
    expect(buckets.map((b) => b.points)).toEqual([200, 100, 600, 250, 100, 0])
  })

  it('finds the next milestone and its bonus reward', () => {
    const luca = nextReward(lucaMe)
    expect(luca?.levelName).toBe('S line Club')
    expect(luca?.bonus).toBeNull()
    expect(luca?.rewards.some((r) => r.kind === 'welcome_kit')).toBe(true)

    const paolo = nextReward(paoloTradeInMe)
    expect(paolo?.levelId).toBe('rs-vanguard')
    expect(paolo?.bonus?.id).toBe('rs-wrap')
    expect(paolo?.rewards.some((r) => r.bonus)).toBe(false)

    expect(nextReward(topLevelMe)).toBeNull()
  })

  it('previews a level with its welcome kit last and never the bonus', () => {
    const rs = previewRewards(getLevel(program, 'rs-vanguard'), 3)
    expect(rs).toHaveLength(3)
    expect(rs[2]?.kind).toBe('welcome_kit')
    expect(rs.some((r) => r.bonus)).toBe(false)
    expect(previewRewards(getLevel(program, 'icon-circle'), 1).map((r) => r.kind)).toEqual(['welcome_kit'])
  })

  it('labels the action rules', () => {
    expect(actionNotes(getAction(program, 'merch'))).toContain('Max 4 al mese')
    expect(actionNotes(getAction(program, 'trade_in'))).toEqual(['Una volta per ogni Audi'])
    expect(actionNotes(getAction(program, 'service'))).toEqual(['x2 se la tua Audi ha più di 2 anni'])
    expect(actionNotes(getAction(program, 'invite'))).toEqual([portalCopy.earn.bothSides])
    expect(actionNotes(getAction(program, 'join'))).toEqual([portalCopy.earn.once])
    expect(actionNotes(getAction(program, 'event'))).toContain('Max 6 all’anno')
    expect(actionNotes(getAction(program, 'first_audi'))).toContain('+500 a chi ti ha invitato')
  })

  it('adds the welcome kit label only when the title lacks it', () => {
    const kit = { id: 'k', title: 'Portachiavi Audi', description: '', kind: 'welcome_kit' as const }
    expect(needsWelcomeKitLabel(kit)).toBe(true)
    expect(needsWelcomeKitLabel({ ...kit, title: 'Kit di benvenuto: portachiavi Audi' })).toBe(false)
    expect(needsWelcomeKitLabel({ ...kit, kind: 'service' })).toBe(false)
  })
})
