import { render, screen } from '@testing-library/react'
import { encodeQr } from './qr'
import { QrCode } from './QrCode'

describe('QrCode', () => {
  it('renders an accessible svg with a 4-module quiet zone', () => {
    render(<QrCode value="AWY-7K2Q" label="Codice QR della prenotazione AWY-7K2Q" />)
    const svg = screen.getByRole('img', { name: 'Codice QR della prenotazione AWY-7K2Q' })
    expect(svg.tagName.toLowerCase()).toBe('svg')
    const extent = encodeQr('AWY-7K2Q').size + 8
    expect(svg.getAttribute('viewBox')).toBe(`0 0 ${extent} ${extent}`)
    expect(svg.getAttribute('shape-rendering')).toBe('crispEdges')
    expect(svg.getAttribute('width')).toBe('192')
  })

  it('paints a white background and one dark path in literal ink', () => {
    const { container } = render(<QrCode value="AWY-7K2Q" size={240} label="QR" />)
    const rect = container.querySelector('rect')
    expect(rect?.getAttribute('fill')).toBe('#FFFFFF')
    const paths = container.querySelectorAll('path')
    expect(paths).toHaveLength(1)
    expect(paths[0].getAttribute('fill')).toBe('#0B0B0C')
    const dark = encodeQr('AWY-7K2Q').modules.flat().filter(Boolean).length
    expect(paths[0].getAttribute('d')?.match(/M/g)).toHaveLength(dark)
    // The top-left finder starts right after the quiet zone.
    expect(paths[0].getAttribute('d')?.startsWith('M4 4h1v1h-1z')).toBe(true)
    expect(container.querySelector('svg')?.getAttribute('width')).toBe('240')
  })
})
