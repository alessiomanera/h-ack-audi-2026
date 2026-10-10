// @vitest-environment node
import { alignmentPositions, encodeQr, formatBits, numDataCodewords, type QrEcc, type QrMatrix } from './qr'

const ECC_CODES: Record<QrEcc, number> = { L: 1, M: 0, Q: 3, H: 2 }

/** Reference symbol for "AWY-7K2Q" at ECC M, produced by Nayuki's qrcodegen (version 1, mask 4). */
const GOLDEN_AWY = [
  '#######.#..#..#######',
  '#.....#...###.#.....#',
  '#.###.#..#.#..#.###.#',
  '#.###.#.##.##.#.###.#',
  '#.###.#.#..##.#.###.#',
  '#.....#.#...#.#.....#',
  '#######.#.#.#.#######',
  '........#.#..........',
  '#...#.#####.######..#',
  '###.#..###..####.##.#',
  '#...###.#...##..#.##.',
  '.#.###.##.###..#...#.',
  '.##..##..###.##..####',
  '........##.##..##..##',
  '#######.#..#..###..#.',
  '#.....#...#..##..#...',
  '#.###.#.#.#.###.#..#.',
  '#.###.#..##.###..#.##',
  '#.###.#..#..##..#....',
  '#.....#..#.##....#...',
  '#######.#.##..##.#..#',
]

function toRows(qr: QrMatrix): string[] {
  return qr.modules.map((row) => row.map((d) => (d ? '#' : '.')).join(''))
}

/** Checks the 7x7 finder (plus light separator) whose top-left corner is (x0, y0). */
function expectFinder(qr: QrMatrix, x0: number, y0: number): void {
  for (let dy = 0; dy < 7; dy++) {
    for (let dx = 0; dx < 7; dx++) {
      const ring = Math.max(Math.abs(dx - 3), Math.abs(dy - 3))
      expect(qr.modules[y0 + dy][x0 + dx], `finder at ${x0},${y0} module ${dx},${dy}`).toBe(ring !== 2)
    }
  }
}

/** Reads the first copy of the format information (bit i at the positions ISO 18004 assigns it). */
function readFormatFirst(qr: QrMatrix): number {
  const m = qr.modules
  const at = (x: number, y: number) => (m[y][x] ? 1 : 0)
  let bits = 0
  for (let i = 0; i <= 5; i++) bits |= at(8, i) << i
  bits |= at(8, 7) << 6
  bits |= at(8, 8) << 7
  bits |= at(7, 8) << 8
  for (let i = 9; i < 15; i++) bits |= at(14 - i, 8) << i
  return bits
}

function readFormatSecond(qr: QrMatrix): number {
  const m = qr.modules
  const s = qr.size
  let bits = 0
  for (let i = 0; i < 8; i++) bits |= (m[8][s - 1 - i] ? 1 : 0) << i
  for (let i = 8; i < 15; i++) bits |= (m[s - 15 + i][8] ? 1 : 0) << i
  return bits
}

/** Unmasks and BCH-checks 15 format bits; returns the ECC code and mask, or null if invalid. */
function decodeFormat(raw: number): { eccCode: number; mask: number } | null {
  const bits = raw ^ 0x5412
  const data = bits >>> 10
  let rem = data
  for (let i = 0; i < 10; i++) rem = (rem << 1) ^ ((rem >>> 9) * 0x537)
  if (((data << 10) | rem) !== bits) return null
  return { eccCode: data >>> 3, mask: data & 7 }
}

describe('encodeQr', () => {
  it('fits a short booking code in version 1 or 2 at ECC M', () => {
    const qr = encodeQr('AWY-7K2Q')
    expect([1, 2]).toContain(qr.version)
    expect(qr.size).toBe(qr.version * 4 + 17)
    expect(qr.modules).toHaveLength(qr.size)
    for (const row of qr.modules) expect(row).toHaveLength(qr.size)
  })

  it('matches the reference symbol bit for bit', () => {
    const qr = encodeQr('AWY-7K2Q', { ecc: 'M' })
    expect(qr.version).toBe(1)
    expect(qr.mask).toBe(4)
    expect(toRows(qr)).toEqual(GOLDEN_AWY)
  })

  it('draws finder patterns at three corners and leaves the separators light', () => {
    const qr = encodeQr('https://example.com/b/AWY-7K2Q')
    const s = qr.size
    expectFinder(qr, 0, 0)
    expectFinder(qr, s - 7, 0)
    expectFinder(qr, 0, s - 7)
    for (let i = 0; i < 8; i++) {
      expect(qr.modules[7][i]).toBe(false)
      expect(qr.modules[i][7]).toBe(false)
      expect(qr.modules[7][s - 1 - i]).toBe(false)
      expect(qr.modules[i][s - 8]).toBe(false)
      expect(qr.modules[s - 8][i]).toBe(false)
      expect(qr.modules[s - 1 - i][7]).toBe(false)
    }
  })

  it('draws alternating timing patterns on row 6 and column 6', () => {
    const qr = encodeQr('AWY-7K2Q', { minVersion: 3 })
    for (let i = 8; i < qr.size - 8; i++) {
      expect(qr.modules[6][i]).toBe(i % 2 === 0)
      expect(qr.modules[i][6]).toBe(i % 2 === 0)
    }
  })

  it('places the dark module at (8, 4 * version + 9)', () => {
    for (const v of [1, 2, 5, 7, 10]) {
      for (let mask = 0; mask < 8; mask++) {
        const qr = encodeQr('AWY', { minVersion: v, mask })
        expect(qr.modules[4 * v + 9][8]).toBe(true)
      }
    }
  })

  it('writes both format copies, readable and matching the chosen ECC and mask', () => {
    const levels: QrEcc[] = ['L', 'M', 'Q', 'H']
    for (const ecc of levels) {
      for (let mask = 0; mask < 8; mask++) {
        const qr = encodeQr('AWY-7K2Q', { ecc, mask })
        const first = readFormatFirst(qr)
        expect(readFormatSecond(qr)).toBe(first)
        expect(first).toBe(formatBits(ecc, mask))
        expect(decodeFormat(first)).toEqual({ eccCode: ECC_CODES[ecc], mask })
        expect(qr.mask).toBe(mask)
      }
    }
  })

  it('reports the automatically chosen mask in the format bits', () => {
    const qr = encodeQr('Giornata Dolomiti, 2 biglietti')
    expect(decodeFormat(readFormatFirst(qr))).toEqual({ eccCode: ECC_CODES.M, mask: qr.mask })
  })

  it('draws alignment patterns from version 2', () => {
    expect(alignmentPositions(1)).toEqual([])
    expect(alignmentPositions(2)).toEqual([6, 18])
    expect(alignmentPositions(7)).toEqual([6, 22, 38])
    expect(alignmentPositions(10)).toEqual([6, 28, 50])
    const qr = encodeQr('AWY', { minVersion: 2 })
    const c = 18
    expect(qr.modules[c][c]).toBe(true)
    expect(qr.modules[c - 1][c]).toBe(false)
    expect(qr.modules[c - 2][c - 2]).toBe(true)
  })

  it('writes mirrored version information from version 7', () => {
    const qr = encodeQr('AWY', { minVersion: 7 })
    expect(qr.version).toBe(7)
    const s = qr.size
    let rem = 7
    for (let i = 0; i < 12; i++) rem = (rem << 1) ^ ((rem >>> 11) * 0x1f25)
    const expected = (7 << 12) | rem
    for (let i = 0; i < 18; i++) {
      const bit = ((expected >>> i) & 1) === 1
      const a = s - 11 + (i % 3)
      const b = Math.floor(i / 3)
      expect(qr.modules[b][a]).toBe(bit)
      expect(qr.modules[a][b]).toBe(bit)
    }
  })

  it('picks the smallest version that fits and grows with the payload', () => {
    // Version 1 at M holds 14 bytes in byte mode, version 2 holds 26.
    expect(numDataCodewords(1, 'M')).toBe(16)
    expect(encodeQr('a'.repeat(14)).version).toBe(1)
    expect(encodeQr('a'.repeat(15)).version).toBe(2)
    expect(encodeQr('a'.repeat(26)).version).toBe(2)
    expect(encodeQr('a'.repeat(27)).version).toBe(3)
    expect(encodeQr('a', { minVersion: 4 }).version).toBe(4)
  })

  it('encodes UTF-8 bytes for accented text', () => {
    // 13 characters but 15 bytes: too long for version 1 at M.
    expect(encodeQr('Ciao è perché').version).toBe(2)
  })

  it('throws beyond version 10 and on invalid options', () => {
    expect(() => encodeQr('a'.repeat(500))).toThrow(RangeError)
    expect(() => encodeQr('a', { mask: 8 })).toThrow(RangeError)
    expect(() => encodeQr('a', { minVersion: 11 })).toThrow(RangeError)
  })

  it('is deterministic', () => {
    const a = encodeQr('AWY-SKI-0001|Giulia|2')
    const b = encodeQr('AWY-SKI-0001|Giulia|2')
    expect(b).toEqual(a)
    expect(encodeQr('AWY-SKI-0002|Giulia|2').modules).not.toEqual(a.modules)
  })
})
