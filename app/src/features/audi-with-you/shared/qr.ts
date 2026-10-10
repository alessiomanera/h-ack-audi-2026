// Dependency-free QR Code Model 2 encoder (ISO/IEC 18004), byte mode, versions 1 to 10.
// Structure follows the well-known Nayuki reference algorithm: pick the smallest version, build the
// bit stream, add Reed-Solomon ECC per block and interleave, draw function patterns, place the
// codewords in the zigzag order, then try the 8 masks and keep the one with the lowest penalty.

export type QrEcc = 'L' | 'M' | 'Q' | 'H'

export interface QrOptions {
  ecc?: QrEcc
  minVersion?: number
  mask?: number
}

export interface QrMatrix {
  size: number
  version: number
  mask: number
  /** modules[y][x], true = dark. */
  modules: boolean[][]
}

const MAX_VERSION = 10

/** Two-bit format code of each ECC level (ISO 18004 table 12). */
const ECC_FORMAT_BITS: Record<QrEcc, number> = { L: 1, M: 0, Q: 3, H: 2 }

/** ECC codewords per block, indexed by version (index 0 unused). */
const ECC_PER_BLOCK: Record<QrEcc, readonly number[]> = {
  L: [-1, 7, 10, 15, 20, 26, 18, 20, 24, 30, 18],
  M: [-1, 10, 16, 26, 18, 24, 16, 18, 22, 22, 26],
  Q: [-1, 13, 22, 18, 26, 18, 24, 18, 22, 20, 24],
  H: [-1, 17, 28, 22, 16, 22, 28, 26, 26, 24, 28],
}

/** Number of error correction blocks, indexed by version (index 0 unused). */
const NUM_BLOCKS: Record<QrEcc, readonly number[]> = {
  L: [-1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 4],
  M: [-1, 1, 1, 1, 2, 2, 4, 4, 4, 5, 5],
  Q: [-1, 1, 1, 2, 2, 4, 4, 6, 6, 8, 8],
  H: [-1, 1, 1, 2, 4, 4, 4, 5, 6, 8, 8],
}

const PENALTY_N1 = 3
const PENALTY_N2 = 3
const PENALTY_N3 = 40
const PENALTY_N4 = 10

function getBit(value: number, i: number): boolean {
  return ((value >>> i) & 1) !== 0
}

/** Data modules available in a version, after all function patterns (format and version included). */
export function numRawDataModules(version: number): number {
  let result = (16 * version + 128) * version + 64
  if (version >= 2) {
    const numAlign = Math.floor(version / 7) + 2
    result -= (25 * numAlign - 10) * numAlign - 55
    if (version >= 7) result -= 36
  }
  return result
}

/** Data codewords (8-bit) available for a version and ECC level. */
export function numDataCodewords(version: number, ecc: QrEcc): number {
  return Math.floor(numRawDataModules(version) / 8) - ECC_PER_BLOCK[ecc][version] * NUM_BLOCKS[ecc][version]
}

/** Centre coordinates of the alignment patterns, ascending. */
export function alignmentPositions(version: number): number[] {
  if (version === 1) return []
  const size = version * 4 + 17
  const numAlign = Math.floor(version / 7) + 2
  const step = Math.ceil((version * 4 + 4) / (numAlign * 2 - 2)) * 2
  const result = [6]
  for (let pos = size - 7; result.length < numAlign; pos -= step) result.splice(1, 0, pos)
  return result
}

// Reed-Solomon over GF(2^8) with the primitive polynomial 0x11D.

function gfMultiply(x: number, y: number): number {
  let z = 0
  for (let i = 7; i >= 0; i--) {
    z = (z << 1) ^ ((z >>> 7) * 0x11d)
    z ^= ((y >>> i) & 1) * x
  }
  return z & 0xff
}

function rsDivisor(degree: number): number[] {
  const result: number[] = new Array<number>(degree).fill(0)
  result[degree - 1] = 1
  let root = 1
  for (let i = 0; i < degree; i++) {
    for (let j = 0; j < result.length; j++) {
      result[j] = gfMultiply(result[j], root)
      if (j + 1 < result.length) result[j] ^= result[j + 1]
    }
    root = gfMultiply(root, 0x02)
  }
  return result
}

function rsRemainder(data: readonly number[], divisor: readonly number[]): number[] {
  const result: number[] = divisor.map(() => 0)
  for (const b of data) {
    const factor = b ^ (result.shift() ?? 0)
    result.push(0)
    divisor.forEach((coef, i) => {
      result[i] ^= gfMultiply(coef, factor)
    })
  }
  return result
}

/** Splits data into blocks, appends ECC to each, and interleaves them (ISO 18004 section 7.6). */
function addEccAndInterleave(data: readonly number[], version: number, ecc: QrEcc): number[] {
  const numBlocks = NUM_BLOCKS[ecc][version]
  const blockEccLen = ECC_PER_BLOCK[ecc][version]
  const rawCodewords = Math.floor(numRawDataModules(version) / 8)
  const numShortBlocks = numBlocks - (rawCodewords % numBlocks)
  const shortBlockLen = Math.floor(rawCodewords / numBlocks)

  const blocks: number[][] = []
  const divisor = rsDivisor(blockEccLen)
  for (let i = 0, k = 0; i < numBlocks; i++) {
    const len = shortBlockLen - blockEccLen + (i < numShortBlocks ? 0 : 1)
    const dat = data.slice(k, k + len)
    k += len
    const eccBytes = rsRemainder(dat, divisor)
    if (i < numShortBlocks) dat.push(0)
    blocks.push(dat.concat(eccBytes))
  }

  const result: number[] = []
  for (let i = 0; i < blocks[0].length; i++) {
    blocks.forEach((block, j) => {
      // Skip the padding byte of short blocks.
      if (i !== shortBlockLen - blockEccLen || j >= numShortBlocks) result.push(block[i])
    })
  }
  return result
}

function utf8Bytes(text: string): number[] {
  return Array.from(new TextEncoder().encode(text))
}

class Builder {
  readonly size: number
  readonly modules: boolean[][]
  readonly isFunction: boolean[][]
  readonly version: number
  readonly ecc: QrEcc

  constructor(version: number, ecc: QrEcc) {
    this.version = version
    this.ecc = ecc
    this.size = version * 4 + 17
    this.modules = Array.from({ length: this.size }, () => new Array<boolean>(this.size).fill(false))
    this.isFunction = Array.from({ length: this.size }, () => new Array<boolean>(this.size).fill(false))
  }

  private setFunction(x: number, y: number, dark: boolean): void {
    this.modules[y][x] = dark
    this.isFunction[y][x] = true
  }

  drawFunctionPatterns(): void {
    const size = this.size
    for (let i = 0; i < size; i++) {
      this.setFunction(6, i, i % 2 === 0)
      this.setFunction(i, 6, i % 2 === 0)
    }
    this.drawFinder(3, 3)
    this.drawFinder(size - 4, 3)
    this.drawFinder(3, size - 4)

    const pos = alignmentPositions(this.version)
    const last = pos.length - 1
    for (let i = 0; i < pos.length; i++) {
      for (let j = 0; j < pos.length; j++) {
        const corner = (i === 0 && j === 0) || (i === 0 && j === last) || (i === last && j === 0)
        if (!corner) this.drawAlignment(pos[i], pos[j])
      }
    }
    // Reserve the format area (real bits are drawn after masking) and draw the version blocks.
    this.drawFormatBits(0)
    this.drawVersion()
  }

  /** Finder pattern plus its separator, clipped to the symbol. */
  private drawFinder(x: number, y: number): void {
    for (let dy = -4; dy <= 4; dy++) {
      for (let dx = -4; dx <= 4; dx++) {
        const dist = Math.max(Math.abs(dx), Math.abs(dy))
        const xx = x + dx
        const yy = y + dy
        if (xx >= 0 && xx < this.size && yy >= 0 && yy < this.size) this.setFunction(xx, yy, dist !== 2 && dist !== 4)
      }
    }
  }

  private drawAlignment(x: number, y: number): void {
    for (let dy = -2; dy <= 2; dy++) {
      for (let dx = -2; dx <= 2; dx++) this.setFunction(x + dx, y + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1)
    }
  }

  /** Format information: 5 data bits, BCH(15,5) with generator 0x537, XOR mask 0x5412. */
  drawFormatBits(mask: number): void {
    const bits = formatBits(this.ecc, mask)
    const size = this.size
    // First copy, around the top-left finder.
    for (let i = 0; i <= 5; i++) this.setFunction(8, i, getBit(bits, i))
    this.setFunction(8, 7, getBit(bits, 6))
    this.setFunction(8, 8, getBit(bits, 7))
    this.setFunction(7, 8, getBit(bits, 8))
    for (let i = 9; i < 15; i++) this.setFunction(14 - i, 8, getBit(bits, i))
    // Second copy, split between the top-right and bottom-left finders.
    for (let i = 0; i < 8; i++) this.setFunction(size - 1 - i, 8, getBit(bits, i))
    for (let i = 8; i < 15; i++) this.setFunction(8, size - 15 + i, getBit(bits, i))
    // Dark module.
    this.setFunction(8, size - 8, true)
  }

  /** Version information for version 7 and up: BCH(18,6) with generator 0x1F25. */
  private drawVersion(): void {
    if (this.version < 7) return
    let rem = this.version
    for (let i = 0; i < 12; i++) rem = (rem << 1) ^ ((rem >>> 11) * 0x1f25)
    const bits = (this.version << 12) | rem
    for (let i = 0; i < 18; i++) {
      const bit = getBit(bits, i)
      const a = this.size - 11 + (i % 3)
      const b = Math.floor(i / 3)
      this.setFunction(a, b, bit)
      this.setFunction(b, a, bit)
    }
  }

  /** Places codewords in the two-column zigzag, skipping function modules and the vertical timing column. */
  drawCodewords(data: readonly number[]): void {
    const size = this.size
    let i = 0
    for (let right = size - 1; right >= 1; right -= 2) {
      if (right === 6) right = 5
      for (let vert = 0; vert < size; vert++) {
        for (let j = 0; j < 2; j++) {
          const x = right - j
          const upward = ((right + 1) & 2) === 0
          const y = upward ? size - 1 - vert : vert
          if (!this.isFunction[y][x] && i < data.length * 8) {
            this.modules[y][x] = getBit(data[i >>> 3], 7 - (i & 7))
            i++
          }
          // Remaining modules (remainder bits) stay light.
        }
      }
    }
  }

  /** XORs the mask pattern onto the data modules; applying it twice undoes it. */
  applyMask(mask: number): void {
    for (let y = 0; y < this.size; y++) {
      for (let x = 0; x < this.size; x++) {
        if (!this.isFunction[y][x] && maskBit(mask, x, y)) this.modules[y][x] = !this.modules[y][x]
      }
    }
  }

  penalty(): number {
    const size = this.size
    const m = this.modules
    let result = 0

    // Rule 1 (runs of 5 or more) and rule 3 (finder-like 1:1:3:1:1 with 4 light modules), rows then columns.
    for (let pass = 0; pass < 2; pass++) {
      for (let a = 0; a < size; a++) {
        let runColor = false
        let runLen = 0
        const history = [0, 0, 0, 0, 0, 0, 0]
        for (let b = 0; b < size; b++) {
          const color = pass === 0 ? m[a][b] : m[b][a]
          if (color === runColor) {
            runLen++
            if (runLen === 5) result += PENALTY_N1
            else if (runLen > 5) result++
          } else {
            this.addHistory(runLen, history)
            if (!runColor) result += this.countFinderLike(history) * PENALTY_N3
            runColor = color
            runLen = 1
          }
        }
        result += this.terminateAndCount(runColor, runLen, history) * PENALTY_N3
      }
    }

    // Rule 2: 2x2 blocks of one color.
    for (let y = 0; y < size - 1; y++) {
      for (let x = 0; x < size - 1; x++) {
        const c = m[y][x]
        if (c === m[y][x + 1] && c === m[y + 1][x] && c === m[y + 1][x + 1]) result += PENALTY_N2
      }
    }

    // Rule 4: dark/light balance, 10 points per 5% step away from 50%.
    let dark = 0
    for (const row of m) for (const cell of row) if (cell) dark++
    const total = size * size
    const k = Math.ceil(Math.abs(dark * 20 - total * 10) / total) - 1
    result += k * PENALTY_N4
    return result
  }

  private countFinderLike(h: readonly number[]): number {
    const n = h[1]
    const core = n > 0 && h[2] === n && h[3] === n * 3 && h[4] === n && h[5] === n
    return (core && h[0] >= n * 4 && h[6] >= n ? 1 : 0) + (core && h[6] >= n * 4 && h[0] >= n ? 1 : 0)
  }

  private terminateAndCount(runColor: boolean, runLen: number, h: number[]): number {
    let len = runLen
    if (runColor) {
      this.addHistory(len, h)
      len = 0
    }
    len += this.size // light border after the symbol
    this.addHistory(len, h)
    return this.countFinderLike(h)
  }

  private addHistory(runLen: number, h: number[]): void {
    const len = h[0] === 0 ? runLen + this.size : runLen // light border before the symbol
    h.pop()
    h.unshift(len)
  }
}

function maskBit(mask: number, x: number, y: number): boolean {
  switch (mask) {
    case 0:
      return (x + y) % 2 === 0
    case 1:
      return y % 2 === 0
    case 2:
      return x % 3 === 0
    case 3:
      return (x + y) % 3 === 0
    case 4:
      return (Math.floor(x / 3) + Math.floor(y / 2)) % 2 === 0
    case 5:
      return ((x * y) % 2) + ((x * y) % 3) === 0
    case 6:
      return (((x * y) % 2) + ((x * y) % 3)) % 2 === 0
    case 7:
      return (((x + y) % 2) + ((x * y) % 3)) % 2 === 0
    default:
      throw new RangeError(`Invalid QR mask ${mask}`)
  }
}

/** The 15 format bits (already XORed with 0x5412) for an ECC level and mask. */
export function formatBits(ecc: QrEcc, mask: number): number {
  const data = (ECC_FORMAT_BITS[ecc] << 3) | mask
  let rem = data
  for (let i = 0; i < 10; i++) rem = (rem << 1) ^ ((rem >>> 9) * 0x537)
  return ((data << 10) | rem) ^ 0x5412
}

/** Encodes text (UTF-8, byte mode) into a QR Code Model 2 symbol. */
export function encodeQr(text: string, opts: QrOptions = {}): QrMatrix {
  const ecc = opts.ecc ?? 'M'
  const minVersion = opts.minVersion ?? 1
  if (!Number.isInteger(minVersion) || minVersion < 1 || minVersion > MAX_VERSION) {
    throw new RangeError(`minVersion must be an integer from 1 to ${MAX_VERSION}`)
  }
  if (opts.mask !== undefined && (!Number.isInteger(opts.mask) || opts.mask < 0 || opts.mask > 7)) {
    throw new RangeError('mask must be an integer from 0 to 7')
  }

  const bytes = utf8Bytes(text)
  let version = minVersion
  let dataBits = 0
  for (; ; version++) {
    if (version > MAX_VERSION) throw new RangeError(`Text too long for a version ${MAX_VERSION} QR code`)
    const countBits = version <= 9 ? 8 : 16
    dataBits = 4 + countBits + bytes.length * 8
    if (bytes.length < 1 << countBits && dataBits <= numDataCodewords(version, ecc) * 8) break
  }

  // Bit stream: mode 0100, character count, data, terminator, byte padding, pad codewords.
  const countBits = version <= 9 ? 8 : 16
  const bits: number[] = []
  const append = (value: number, len: number) => {
    for (let i = len - 1; i >= 0; i--) bits.push((value >>> i) & 1)
  }
  append(0b0100, 4)
  append(bytes.length, countBits)
  for (const b of bytes) append(b, 8)
  const capacityBits = numDataCodewords(version, ecc) * 8
  append(0, Math.min(4, capacityBits - bits.length))
  append(0, (8 - (bits.length % 8)) % 8)
  for (let pad = 0xec; bits.length < capacityBits; pad ^= 0xec ^ 0x11) append(pad, 8)

  const data: number[] = []
  for (let i = 0; i < bits.length; i += 8) {
    let byte = 0
    for (let j = 0; j < 8; j++) byte = (byte << 1) | bits[i + j]
    data.push(byte)
  }

  const qr = new Builder(version, ecc)
  qr.drawFunctionPatterns()
  qr.drawCodewords(addEccAndInterleave(data, version, ecc))

  let mask = opts.mask ?? -1
  if (mask === -1) {
    let best = Infinity
    for (let i = 0; i < 8; i++) {
      qr.applyMask(i)
      qr.drawFormatBits(i)
      const p = qr.penalty()
      if (p < best) {
        best = p
        mask = i
      }
      qr.applyMask(i)
    }
  }
  qr.applyMask(mask)
  qr.drawFormatBits(mask)

  return { size: qr.size, version, mask, modules: qr.modules.map((row) => row.slice()) }
}
