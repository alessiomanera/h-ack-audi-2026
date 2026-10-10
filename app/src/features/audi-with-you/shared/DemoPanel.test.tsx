import type { ReactNode } from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { SessionTestProvider, type SessionValue } from '@/state/session'
import { DemoPanel } from './DemoPanel'
import { InviteAcceptBanner } from './InviteAcceptBanner'
import { InviteButton } from './InviteButton'
import { lucaMe, makeSession, serviceResult } from './fixtures'

function renderAt(url: string, ui: ReactNode, session: SessionValue = makeSession()) {
  return render(
    <MemoryRouter initialEntries={[url]}>
      <SessionTestProvider value={session}>{ui}</SessionTestProvider>
    </MemoryRouter>,
  )
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
    for (const name of ['Paolo', 'Luca', 'Giulia', 'Tagliando', 'Ricarica', 'Invita un familiare', 'Reset demo']) {
      expect(screen.getByRole('button', { name })).toBeInTheDocument()
    }
    expect(screen.getByRole('button', { name: 'Luca' })).toHaveAttribute('aria-pressed', 'true')
  })

  it('disables events until a persona is chosen', () => {
    renderAt('/?demo=1', <DemoPanel />, makeSession({ status: 'anonymous', me: null }))
    expect(screen.getByRole('button', { name: 'Tagliando' })).toBeDisabled()
    expect(screen.getByText('Scegli una persona per simulare gli eventi.')).toBeInTheDocument()
  })

  it('a simulated service opens the courtesy car moment', async () => {
    const runAction = vi.fn(async () => serviceResult)
    renderAt('/?demo=1', <DemoPanel />, makeSession({ runAction }))
    fireEvent.click(screen.getByRole('button', { name: 'Tagliando' }))
    expect(runAction).toHaveBeenCalledWith({ type: 'service', meta: { serviceKind: 'tagliando' } })
    expect(await screen.findByText('Tagliando registrato: +400 punti')).toBeInTheDocument()
    expect(screen.getByText('Mentre la tua A3 è in officina, guidi una A5')).toBeInTheDocument()
    expect(screen.getByText('Audi A5')).toBeInTheDocument()
    expect(screen.getByText('Nuovo livello: Plus')).toBeInTheDocument()
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
