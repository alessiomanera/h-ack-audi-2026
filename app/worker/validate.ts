// Manual input validation (no dependencies). Throws HttpError with Italian messages.
import { program } from '../src/features/audi-with-you/program'
import { canonicalModel } from '../src/features/audi-with-you/engine'
import { COPY } from './copy.it'
import { HttpError, isRecord } from './http'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

const bad = (message: string) => new HttpError(400, 'invalid_input', message)

export function parseName(v: unknown): string {
  const name = typeof v === 'string' ? v.trim().replace(/\s+/g, ' ') : ''
  if (!name) throw bad(COPY.errors.nameRequired)
  if (name.length > 60) throw bad(COPY.errors.nameTooLong)
  return name
}

export function normalizeEmail(v: unknown): string | null {
  if (typeof v !== 'string') return null
  const email = v.trim().toLowerCase()
  return email.length <= 120 && EMAIL_RE.test(email) ? email : null
}

export function parseEmail(v: unknown): string {
  const email = normalizeEmail(v)
  if (!email) throw bad(COPY.errors.emailInvalid)
  return email
}

export function parsePin(v: unknown): string {
  if (typeof v !== 'string' || !/^\d{4}$/.test(v)) throw bad(COPY.errors.pinInvalid)
  return v
}

export function parseVehicle(v: unknown, now: Date): { model: string; year: number } {
  if (!isRecord(v)) throw bad(COPY.errors.vehicleRequired)
  const rawModel = typeof v.model === 'string' ? v.model.trim().replace(/^audi\s+/i, '').replace(/\s+/g, ' ') : ''
  if (!rawModel || rawModel.length > 40) throw bad(COPY.errors.vehicleModelInvalid)
  const year = typeof v.year === 'string' ? Number(v.year) : v.year
  if (typeof year !== 'number' || !Number.isInteger(year) || year < 1990 || year > now.getUTCFullYear() + 1) {
    throw bad(COPY.errors.vehicleYearInvalid)
  }
  return { model: canonicalModel(program, rawModel) ?? rawModel, year }
}

/** Optional short free text (event names, invitee names). */
export function optionalText(v: unknown, max: number): string | null {
  if (typeof v !== 'string') return null
  const s = v.trim().replace(/\s+/g, ' ')
  return s ? s.slice(0, max) : null
}
