import { fireEvent, render, screen, within } from '@testing-library/react'
import { bonusReward, program } from '../program'
import { BonusRewardCard } from './BonusRewardCard'
import { wrapReward } from './fixtures'

describe('BonusRewardCard', () => {
  it('renders the bonus card with title, marker, level and limits', () => {
    render(<BonusRewardCard reward={wrapReward} levelName="RS Vanguard" />)
    const card = screen.getByRole('article', { name: 'Wrap personalizzato' })
    const c = within(card)
    expect(c.getByRole('heading', { name: 'Wrap personalizzato' })).toBeInTheDocument()
    expect(c.getByText('Premio bonus')).toBeInTheDocument()
    expect(c.getByText(wrapReward.description)).toBeInTheDocument()
    expect(c.getByText('Si sblocca a RS Vanguard')).toBeInTheDocument()
    expect(c.getByText('Posti limitati, assegnati in anticipo per livello')).toBeInTheDocument()
    expect(c.getByText(wrapReward.note ?? '')).toBeInTheDocument()
  })

  it('stays in chalk tones, never the signal color', () => {
    const { container } = render(<BonusRewardCard reward={wrapReward} levelName="RS Vanguard" />)
    expect(container.querySelector('[class*="signal"]')).toBeNull()
  })

  it('hides the image after a load error instead of showing it broken', () => {
    render(<BonusRewardCard reward={wrapReward} levelName="RS Vanguard" />)
    const img = screen.getByRole('img', { name: 'Wrap personalizzato, immagine di esempio' })
    expect(img).toHaveAttribute('src', '/rewards/wrap-demo.jpg')
    fireEvent.error(img)
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Wrap personalizzato' })).toBeInTheDocument()
  })

  it('renders without an image when the reward has none', () => {
    render(<BonusRewardCard reward={{ ...wrapReward, image: undefined }} levelName="RS Vanguard" />)
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
    expect(screen.getByText('Premio bonus')).toBeInTheDocument()
  })

  it('teaser variant renders a compact line', () => {
    render(<BonusRewardCard reward={wrapReward} levelName="RS Vanguard" variant="teaser" />)
    const teaser = screen.getByRole('article', { name: 'Wrap personalizzato' })
    expect(teaser).toHaveAttribute('data-variant', 'teaser')
    expect(within(teaser).getByText('Premio bonus')).toBeInTheDocument()
    expect(within(teaser).getByText('Wrap personalizzato')).toBeInTheDocument()
    expect(within(teaser).getByText('Si sblocca a RS Vanguard')).toBeInTheDocument()
    expect(within(teaser).queryByText(wrapReward.description)).not.toBeInTheDocument()
    fireEvent.error(within(teaser).getByRole('img'))
    expect(within(teaser).queryByRole('img')).not.toBeInTheDocument()
  })

  it('renders the bonus of the edited program', () => {
    const bonus = bonusReward(program)
    expect(bonus).not.toBeNull()
    if (!bonus) return
    render(<BonusRewardCard reward={bonus.reward} levelName={bonus.level.name} />)
    expect(screen.getByRole('article', { name: bonus.reward.title })).toBeInTheDocument()
    expect(screen.getByText(`Si sblocca a ${bonus.level.name}`)).toBeInTheDocument()
  })
})
