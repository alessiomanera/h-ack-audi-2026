import type { ReactNode } from 'react'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { SessionTestProvider, type SessionValue } from '@/state/session'
import { formatPoints } from '@/lib/utils'
import { getLevel, program } from '../program'
import { DemoPanel } from './DemoPanel'
import { InviteAcceptBanner } from './InviteAcceptBanner'
import { InviteButton } from './InviteButton'
import {
  accessoryResult,
  eventLevelUpResult,
  giuliaMe,
  lucaMe,
  makeSession,
  paoloMe,
  serviceResult,
  tradeInResult,
} from './fixtures'

// Toasts are rendered by the app shell's Toaster, absent here: capture the calls instead.
const toastMock = vi.hoisted(() => Object.assign(vi.fn(), { error: vi.fn(), success: vi.fn() }))
vi.mock('sonner', () => ({ toast: toastMock }))

beforeEach(() => {
  toastMock.mockClear()
  toastMock.error.mockClear()
})

function renderAt(url: string, ui: ReactNode, session: SessionValue = makeSession()) {
  return render(
    <MemoryRouter initialEntries={[url]}>
      <SessionTestProvider value={session}>{ui}</SessionTestProvider>
    </MemoryRouter>,
  )
}

function toastTitles(): unknown[] {
  return toastMock.mock.calls.map((call: unknown[]) => call[0])
}

describe('DemoPanel', () => {
  it('is hidden without ?demo=1', () => {
    renderAt('/', <DemoPanel />)
    expect(screen.queryByRole('complementary')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Tagliando' })).not.toBeInTheDocument()
  })

  it('is visible with ?demo=1', () => {
    renderAt('/?demo=1', <DemoPanel />)
    expect(screen.getByRole('complementary', { name: 'Simula eventi Audi' })).toBeInTheDocument()
    for (const name of [
      'Paolo',
      'Luca',
      'Giulia',
      'Tagliando',
      'Accessorio',
      'Audi Collection',
      'Permuta',
      'Evento',
      'Ricarica',
      'Invita un familiare',
      'Reset demo',
    ]) {
      expect(screen.getByRole('button', { name })).toBeInTheDocument()
    }
    expect(screen.getByRole('button', { name: 'Luca' })).toHaveAttribute('aria-pressed', 'true')
  })

  it('disables events until a persona is chosen', () => {
    renderAt('/?demo=1', <DemoPanel />, makeSession({ status: 'anonymous', me: null }))
    for (const name of ['Tagliando', 'Accessorio', 'Audi Collection', 'Permuta']) {
      expect(screen.getByRole('button', { name })).toBeDisabled()
    }
    expect(screen.getByText('Scegli una persona per simulare gli eventi.')).toBeInTheDocument()
  })

  it('sends the new Audi events with their item names', async () => {
    const runAction = vi.fn(async () => accessoryResult)
    renderAt('/?demo=1', <DemoPanel />, makeSession({ me: giuliaMe, runAction }))
    fireEvent.click(screen.getByRole('button', { name: 'Accessorio' }))
    await waitFor(() => expect(runAction).toHaveBeenCalledWith({ type: 'accessory', meta: { itemName: 'Barre portatutto' } }))
    await waitFor(() => expect(screen.getByRole('button', { name: 'Audi Collection' })).toBeEnabled())
    fireEvent.click(screen.getByRole('button', { name: 'Audi Collection' }))
    await waitFor(() => expect(runAction).toHaveBeenCalledWith({ type: 'merch', meta: { itemName: 'Zaino Audi Collection' } }))
    await waitFor(() => expect(screen.getByRole('button', { name: 'Permuta' })).toBeEnabled())
    fireEvent.click(screen.getByRole('button', { name: 'Permuta' }))
    await waitFor(() => expect(runAction).toHaveBeenCalledWith({ type: 'trade_in' }))
  })

  it('an accessory without a level change shows the points and opens no dialog', async () => {
    const runAction = vi.fn(async () => ({ ...accessoryResult, notice: 'Punti accreditati dal tuo ordine.' }))
    renderAt('/?demo=1', <DemoPanel />, makeSession({ me: giuliaMe, runAction }))
    fireEvent.click(screen.getByRole('button', { name: 'Accessorio' }))
    await waitFor(() =>
      expect(toastMock).toHaveBeenCalledWith('+100 punti', {
        description: 'Accessorio originale: Barre portatutto. Punti accreditati dal tuo ordine.',
      }),
    )
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('shows the notice when nothing is awarded', async () => {
    const notice = 'Hai già raggiunto il limite di questo mese.'
    const runAction = vi.fn(async () => ({ ...accessoryResult, entry: null, awarded: 0, notice }))
    renderAt('/?demo=1', <DemoPanel />, makeSession({ me: giuliaMe, runAction }))
    fireEvent.click(screen.getByRole('button', { name: 'Audi Collection' }))
    await waitFor(() => expect(toastMock).toHaveBeenCalledWith(notice))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('F1: a simulated service opens the courtesy car moment and the new level', async () => {
    const runAction = vi.fn(async () => serviceResult)
    renderAt('/?demo=1', <DemoPanel />, makeSession({ runAction }))
    fireEvent.click(screen.getByRole('button', { name: 'Tagliando' }))
    expect(runAction).toHaveBeenCalledWith({ type: 'service', meta: { serviceKind: 'tagliando' } })
    expect(await screen.findByText('Tagliando registrato: +400 punti')).toBeInTheDocument()
    const dialog = within(screen.getByRole('dialog'))
    expect(dialog.getByText('Mentre la tua A3 è in officina, guidi una A5')).toBeInTheDocument()
    expect(dialog.getByText('Audi A5')).toBeInTheDocument()
    expect(dialog.getByText('Nuovo livello: quattro Circle')).toBeInTheDocument()
    expect(toastTitles()).toContain('Nuovo livello: quattro Circle')

    const unlocked = within(dialog.getByRole('region', { name: 'Hai sbloccato' }))
    for (const reward of getLevel(program, 'quattro-circle').rewards) {
      expect(unlocked.getByText(reward.title)).toBeInTheDocument()
    }
  })

  it('F2: an event that crosses 1500 lists what S line Club unlocks, welcome kit included', async () => {
    const runAction = vi.fn(async () => eventLevelUpResult)
    renderAt('/?demo=1', <DemoPanel />, makeSession({ me: giuliaMe, runAction }))
    fireEvent.click(screen.getByRole('button', { name: 'Evento' }))
    expect(runAction).toHaveBeenCalledWith({ type: 'event', meta: { eventName: 'Serata Audi in concessionaria' } })
    expect(await screen.findByRole('dialog')).toBeInTheDocument()
    const dialog = within(screen.getByRole('dialog'))
    expect(dialog.getByRole('heading', { name: 'Evento: +100 punti' })).toBeInTheDocument()
    expect(dialog.getByText('Nuovo livello: S line Club')).toBeInTheDocument()
    expect(dialog.queryByText(/in officina/)).not.toBeInTheDocument()
    expect(toastTitles()).toEqual(['+100 punti', 'Nuovo livello: S line Club'])

    const rewards = getLevel(program, 's-line-club').rewards
    expect(rewards.filter((r) => r.kind === 'welcome_kit')).toHaveLength(1)
    const unlocked = within(dialog.getByRole('region', { name: 'Hai sbloccato' }))
    expect(unlocked.getAllByRole('listitem')).toHaveLength(rewards.length)
    for (const reward of rewards) {
      expect(unlocked.getByText(reward.title)).toBeInTheDocument()
    }
    expect(unlocked.getByText('In regalo')).toBeInTheDocument()
  })

  it('F3: a trade in carries level and history to the new Audi', async () => {
    const runAction = vi.fn(async () => tradeInResult)
    renderAt('/?demo=1', <DemoPanel />, makeSession({ me: paoloMe, runAction }))
    fireEvent.click(screen.getByRole('button', { name: 'Permuta' }))
    expect(await screen.findByRole('dialog')).toBeInTheDocument()
    const dialog = within(screen.getByRole('dialog'))
    expect(dialog.getByRole('heading', { name: `Permuta registrata: +${formatPoints(1000)} punti` })).toBeInTheDocument()
    expect(dialog.getByText('Livello e storico vengono con te sulla nuova Audi.')).toBeInTheDocument()
    expect(dialog.getByText('Nuovo livello: S line Club')).toBeInTheDocument()
    expect(dialog.getByRole('region', { name: 'Hai sbloccato' })).toBeInTheDocument()
    expect(toastTitles()).toContain('Nuovo livello: S line Club')
  })

  it('marks the bonus reward when the new level holds it', async () => {
    const top = getLevel(program, 'rs-vanguard')
    const bonus = top.rewards.find((r) => r.bonus)
    expect(bonus).toBeDefined()
    const runAction = vi.fn(async () => ({
      ...eventLevelUpResult,
      levelUp: 'rs-vanguard',
      me: { ...giuliaMe, level: { current: 'rs-vanguard', next: null, points: 3050, pointsToNext: null, progress: 1 } },
    }))
    renderAt('/?demo=1', <DemoPanel />, makeSession({ me: giuliaMe, runAction }))
    fireEvent.click(screen.getByRole('button', { name: 'Evento' }))
    const region = await screen.findByRole('region', { name: 'Hai sbloccato' })
    const item = within(region)
      .getAllByRole('listitem')
      .find((li) => li.getAttribute('data-bonus') === 'true')
    expect(item).toBeDefined()
    if (!item || !bonus) return
    expect(within(item).getByText(bonus.title)).toBeInTheDocument()
    expect(within(item).getByText('Premio bonus')).toBeInTheDocument()
  })

  it('dialogs never use the signal color', async () => {
    const runAction = vi.fn(async () => serviceResult)
    renderAt('/?demo=1', <DemoPanel />, makeSession({ runAction }))
    fireEvent.click(screen.getByRole('button', { name: 'Tagliando' }))
    const dialog = await screen.findByRole('dialog')
    expect(dialog.querySelector('[class*="signal"]')).toBeNull()
  })
})

describe('InviteButton', () => {
  it('is disabled with a reason for a secondary user', () => {
    renderAt('/', <InviteButton />)
    expect(screen.getByRole('button', { name: 'Invita in famiglia' })).toBeDisabled()
    expect(screen.getByText('Solo il titolare dell’Audi può invitare nuovi guidatori.')).toBeInTheDocument()
  })

  it('opens the dialog for the key user', () => {
    const household = lucaMe.households[0]
    const me = household ? { ...lucaMe, households: [{ ...household, myRole: 'key' as const }] } : lucaMe
    renderAt('/', <InviteButton label="Invita" />, makeSession({ me }))
    fireEvent.click(screen.getByRole('button', { name: 'Invita' }))
    expect(screen.getByText('Posti per utenti secondari: 1 di 5')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('nome@example.com')).toBeInTheDocument()
  })
})

describe('InviteAcceptBanner', () => {
  it('renders nothing without ?invito', () => {
    const { container } = renderAt('/', <InviteAcceptBanner />)
    expect(container).toBeEmptyDOMElement()
  })

  it('renders nothing when anonymous', () => {
    const { container } = renderAt('/?invito=AB12CD', <InviteAcceptBanner />, makeSession({ status: 'anonymous', me: null }))
    expect(container).toBeEmptyDOMElement()
  })
})
