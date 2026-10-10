import { fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { describe, expect, it, vi } from 'vitest'
import type { ActionResult, CreateInviteResponse, MeResponse } from '@/shared/types'
import { SessionTestProvider, type SessionStatus, type SessionValue } from '@/state/session'
import { bonusReward, getAction, program } from '../program'
import { tabCopy } from './copy.it'
import { lucaMe, lucaTopMe, paoloMe, paoloTradeInMe, withVehicleAge } from './fixtures'
import { fullVersionSearch, nextReward, otherActions, servicePoints } from './model'
import { TabView } from './TabView'

const serviceTitle = getAction(program, 'service').title
const serviceButton = () => screen.getByRole('button', { name: (name) => name.includes(serviceTitle) })

// Shared components belong to another stream: replace them with light doubles so this test
// checks only the TabView layout and wiring.
vi.mock('../shared/AuthPanel', async () => {
  const { createElement } = await import('react')
  return {
    AuthPanel: ({ variant }: { variant?: string }) =>
      createElement('div', { 'data-testid': 'auth-panel', 'data-variant': variant }),
  }
})
vi.mock('../shared/LevelCard', async () => {
  const { createElement } = await import('react')
  return {
    LevelCard: ({ me, variant }: { me: MeResponse; variant?: string }) =>
      createElement('div', { 'data-testid': 'level-card', 'data-variant': variant }, me.level.points),
  }
})
vi.mock('../shared/InviteButton', async () => {
  const { createElement } = await import('react')
  return {
    InviteButton: ({ label, className }: { label?: string; className?: string }) =>
      createElement('button', { type: 'button', className, 'data-testid': 'invite-button' }, label),
  }
})
vi.mock('../shared/BonusRewardCard', async () => {
  const { createElement } = await import('react')
  return {
    BonusRewardCard: ({ reward, levelName, variant }: { reward: { title: string }; levelName: string; variant?: string }) =>
      createElement('article', { 'aria-label': reward.title, 'data-variant': variant }, levelName),
  }
})
vi.mock('../shared/CourtesyCarCard', async () => {
  const { createElement } = await import('react')
  return {
    CourtesyCarCard: ({ offer }: { offer: { offeredModel: string } }) =>
      createElement('div', { 'data-testid': 'courtesy-car' }, offer.offeredModel),
  }
})

function makeSession(status: SessionStatus, me: MeResponse | null): SessionValue {
  const noop = vi.fn(async () => {})
  return {
    status,
    me,
    refresh: noop,
    login: noop,
    signup: noop,
    loginAs: noop,
    logout: vi.fn(async () => {}),
    runAction: vi.fn(async (): Promise<ActionResult> => {
      throw new Error('not used')
    }),
    createInvite: vi.fn(async (): Promise<CreateInviteResponse> => {
      throw new Error('not used')
    }),
    acceptInvite: noop,
    resetDemo: noop,
  }
}

function renderTab(session: SessionValue, framed: boolean, entry = '/?vista=tab&demo=1') {
  return render(
    <SessionTestProvider value={session}>
      <MemoryRouter initialEntries={[entry]}>
        <TabView framed={framed} />
      </MemoryRouter>
    </SessionTestProvider>,
  )
}

function expectFullVersionHref(link: HTMLElement) {
  const href = link.getAttribute('href') ?? ''
  expect(href).toContain('vista=completa')
  expect(href).toContain('demo=1')
  expect(href).not.toContain('vista=tab')
}

describe('TabView model', () => {
  it('builds the full version search keeping other params', () => {
    expect(fullVersionSearch(new URLSearchParams('vista=tab&demo=1'))).toBe('?vista=completa&demo=1')
    expect(fullVersionSearch(new URLSearchParams(''))).toBe('?vista=completa')
  })

  it('doubles service points only for vehicles older than 2 years', () => {
    expect(servicePoints(lucaMe)).toMatchObject({ points: 400, multiplied: true })
    expect(servicePoints(withVehicleAge(lucaMe, 1))).toMatchObject({ points: 200, multiplied: false })
  })

  it('previews the next level with its welcome kit and never the bonus', () => {
    const luca = nextReward(lucaMe)
    expect(luca).toMatchObject({ levelName: 'S line Club', pointsToNext: 750 })
    expect(luca?.rewards.map((r) => r.kind)).toContain('welcome_kit')
    expect(nextReward(paoloTradeInMe)?.rewards.some((r) => r.bonus)).toBe(false)
    expect(nextReward(lucaTopMe)).toBeNull()
  })

  it('lists the actions without a tile, new ones included', () => {
    const types = otherActions(program).map((a) => a.type)
    expect(types).toEqual(expect.arrayContaining(['accessory', 'merch', 'trade_in', 'session', 'event', 'charging']))
    expect(types).not.toContain('join')
    expect(types).not.toContain('invite')
    expect(types).not.toContain('service')
  })
})

describe.each([false, true])('TabView (framed=%s)', (framed) => {
  it('shows the intro and the compact auth panel when anonymous', () => {
    renderTab(makeSession('anonymous', null), framed)
    expect(screen.getByRole('heading', { level: 1, name: 'La tua Audi evolve con te' })).toBeInTheDocument()
    expect(screen.getByTestId('auth-panel')).toHaveAttribute('data-variant', 'compact')
    expectFullVersionHref(screen.getByRole('link', { name: tabCopy.anonymous.discover }))
    expect(screen.queryByRole('link', { name: tabCopy.cta.button })).not.toBeInTheDocument()
  })

  it('shows a quiet skeleton while loading', () => {
    const { container } = renderTab(makeSession('loading', null), framed)
    expect(container.querySelector('[aria-busy="true"]')).not.toBeNull()
    expect(screen.getByRole('status')).toHaveTextContent(tabCopy.loading)
  })

  it('shows Luca, his level, next reward, tiles, recent points and the full version link', () => {
    renderTab(makeSession('authenticated', lucaMe), framed)

    expect(screen.getByRole('heading', { level: 1, name: 'Audi with you' })).toBeInTheDocument()
    expect(screen.getByText('Ciao Luca')).toBeInTheDocument()
    expect(screen.getByText('A3 del 2021, utente secondario')).toBeInTheDocument()
    expect(screen.getByTestId('level-card')).toHaveAttribute('data-variant', 'compact')

    const next = within(screen.getByRole('region', { name: tabCopy.next.title }))
    expect(next.getByText('S line Club')).toBeInTheDocument()
    expect(next.getByText('ancora 750 punti')).toBeInTheDocument()
    for (const reward of nextReward(lucaMe)?.rewards ?? []) {
      expect(next.getByText(reward.title)).toBeInTheDocument()
    }
    expect(next.getByText(/Kit di benvenuto/)).toBeInTheDocument()

    const service = serviceButton()
    expect(within(service).getByText('+400 punti')).toBeInTheDocument()
    expect(within(service).getByText('Punti doppi')).toBeInTheDocument()
    expect(screen.getByText('Sei nella famiglia di Paolo')).toBeInTheDocument()
    expect(screen.queryByTestId('invite-button')).not.toBeInTheDocument()

    expect(screen.getByText('Sessione "Conosci la tua Audi"')).toBeInTheDocument()
    expect(screen.getByText('Invito di famiglia accettato')).toBeInTheDocument()
    expect(screen.queryByText('Benvenuto in Audi with you')).not.toBeInTheDocument()

    expectFullVersionHref(screen.getByRole('link', { name: tabCopy.cta.button }))
    expect(screen.getByText(tabCopy.cta.hint)).toBeInTheDocument()
    expect(screen.getByText(tabCopy.footer)).toBeInTheDocument()
  })

  it('opens the workshop dialog with the courtesy car at the current level', () => {
    renderTab(makeSession('authenticated', lucaMe), framed)
    fireEvent.click(serviceButton())
    const dialog = screen.getByRole('dialog')
    expect(within(dialog).getByText(tabCopy.actions.service.courtesyTitle)).toBeInTheDocument()
    expect(within(dialog).getByTestId('courtesy-car')).toHaveTextContent('A5')
    expect(within(dialog).getByText('Tagliando')).toBeInTheDocument()
  })

  it('shows the invite button to the key user and base points for a young vehicle', () => {
    renderTab(makeSession('authenticated', withVehicleAge(paoloMe, 1)), framed)
    expect(screen.getByText('A3 del 2025, titolare')).toBeInTheDocument()
    expect(screen.getByTestId('invite-button')).toHaveTextContent(tabCopy.actions.family.button)
    const service = serviceButton()
    expect(within(service).getByText('+200 punti')).toBeInTheDocument()
    expect(within(service).queryByText('Punti doppi')).not.toBeInTheDocument()
  })

  it('shows the top level state at RS Vanguard', () => {
    renderTab(makeSession('authenticated', lucaTopMe), framed)
    expect(screen.getByRole('region', { name: tabCopy.next.topLabel })).toBeInTheDocument()
    expect(screen.getByText(tabCopy.next.topTitle)).toBeInTheDocument()
    expect(screen.queryByText(/ancora .* punti/)).not.toBeInTheDocument()
  })

  it('shows the bonus reward teaser', () => {
    renderTab(makeSession('authenticated', lucaMe), framed)
    const bonus = bonusReward(program)
    expect(bonus?.reward.title).toBe('Wrap personalizzato')
    const teaser = screen.getByRole('article', { name: 'Wrap personalizzato' })
    expect(teaser).toHaveAttribute('data-variant', 'teaser')
    expect(teaser).toHaveTextContent('RS Vanguard')
  })

  it('lists the other actions with flat points and caps', () => {
    renderTab(makeSession('authenticated', lucaMe), framed)
    const list = within(screen.getByRole('list', { name: tabCopy.actions.more.title }))
    const row = (type: 'accessory' | 'merch' | 'trade_in') => {
      const action = getAction(program, type)
      const item = list.getByText(action.title).closest('li')
      expect(item).not.toBeNull()
      return within(item as HTMLElement)
    }
    expect(row('accessory').getByText('+100 punti')).toBeInTheDocument()
    expect(row('merch').getByText('Max 4 al mese')).toBeInTheDocument()
    expect(row('trade_in').getByText('Una volta per ogni Audi')).toBeInTheDocument()
    expect(list.queryByText(getAction(program, 'join').title)).not.toBeInTheDocument()
  })

  it('logs out from the header', () => {
    const session = makeSession('authenticated', lucaMe)
    renderTab(session, framed)
    fireEvent.click(screen.getByRole('button', { name: tabCopy.header.logout }))
    expect(session.logout).toHaveBeenCalledOnce()
  })
})

describe('TabView frame', () => {
  it('shows the caption and a link to the full version only when framed', () => {
    renderTab(makeSession('authenticated', lucaMe), true)
    expect(screen.getByText(tabCopy.frame.caption)).toBeInTheDocument()
    expectFullVersionHref(screen.getByRole('link', { name: tabCopy.frame.link }))
  })

  it('has no frame caption on a real phone', () => {
    renderTab(makeSession('authenticated', lucaMe), false)
    expect(screen.queryByText(tabCopy.frame.caption)).not.toBeInTheDocument()
  })
})
