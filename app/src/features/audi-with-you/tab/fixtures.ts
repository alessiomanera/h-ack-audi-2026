// Fictional MeResponse fixtures for tests and previews. Emails end with @example.com.
// Level ids follow program.it.json: icon-circle, quattro-circle, s-line-club, rs-vanguard.
import type { Household, MeResponse } from '@/shared/types'
import { getLevel, program } from '../program'

const vehicle = { id: 'v-a3', model: 'A3', year: 2021, ageYears: 5 }

const lucaHousehold: Household = {
  vehicle,
  myRole: 'secondary',
  members: [
    { userId: 'u-paolo', name: 'Paolo', role: 'key', points: 600, level: 'quattro-circle', isMe: false },
    { userId: 'u-luca', name: 'Luca', role: 'secondary', points: 750, level: 'quattro-circle', isMe: true },
  ],
  secondarySlots: { used: 1, max: 5 },
  pendingInvites: [],
}

/** Luca, 21, drives the family A3 as secondary user. Level quattro Circle, next S line Club. */
export const lucaMe: MeResponse = {
  user: { id: 'u-luca', email: 'luca@example.com', name: 'Luca', birthYear: 2005, createdAt: '2026-09-01T10:00:00.000Z' },
  level: { current: 'quattro-circle', next: 's-line-club', points: 750, pointsToNext: 750, progress: 0.25 },
  households: [lucaHousehold],
  ledger: [
    {
      id: 'l-4',
      action: 'session',
      points: 150,
      label: 'Sessione "Conosci la tua Audi"',
      meta: { sessionKind: 'dealer' },
      createdAt: '2026-10-05T16:00:00.000Z',
    },
    {
      id: 'l-3',
      action: 'service',
      points: 400,
      label: 'Tagliando in officina Audi',
      meta: { serviceKind: 'tagliando', multiplied: true },
      createdAt: '2026-09-20T09:30:00.000Z',
    },
    {
      id: 'l-2',
      action: 'invite',
      points: 100,
      label: 'Invito di famiglia accettato',
      meta: {},
      createdAt: '2026-09-01T10:05:00.000Z',
    },
    {
      id: 'l-1',
      action: 'join',
      points: 100,
      label: 'Benvenuto in Audi with you',
      meta: {},
      createdAt: '2026-09-01T10:00:00.000Z',
    },
  ],
  courtesyCar: {
    level: 'quattro-circle',
    rule: getLevel(program, 'quattro-circle').courtesyCar,
    ownModel: 'A3',
    offeredModel: 'A5',
  },
}

/** Paolo, key user of the same A3 (seed: 600 points). Level quattro Circle. */
export const paoloMe: MeResponse = {
  user: { id: 'u-paolo', email: 'paolo@example.com', name: 'Paolo', birthYear: 1968, createdAt: '2026-08-15T10:00:00.000Z' },
  level: { current: 'quattro-circle', next: 's-line-club', points: 600, pointsToNext: 900, progress: 0.1 },
  households: [
    {
      ...lucaHousehold,
      myRole: 'key',
      members: lucaHousehold.members.map((m) => ({ ...m, isMe: m.role === 'key' })),
    },
  ],
  ledger: [
    {
      id: 'p-2',
      action: 'invite',
      points: 100,
      label: 'Invito di famiglia accettato',
      meta: {},
      createdAt: '2026-09-01T10:05:00.000Z',
    },
    {
      id: 'p-1',
      action: 'join',
      points: 100,
      label: 'Benvenuto in Audi with you',
      meta: {},
      createdAt: '2026-08-15T10:00:00.000Z',
    },
  ],
  courtesyCar: {
    level: 'quattro-circle',
    rule: getLevel(program, 'quattro-circle').courtesyCar,
    ownModel: 'A3',
    offeredModel: 'A5',
  },
}

/** Paolo after the trade in (demo flow F3): S line Club, next milestone RS Vanguard. */
export const paoloTradeInMe: MeResponse = {
  ...paoloMe,
  level: { current: 's-line-club', next: 'rs-vanguard', points: 1600, pointsToNext: 1400, progress: 100 / 1500 },
  courtesyCar: {
    level: 's-line-club',
    rule: getLevel(program, 's-line-club').courtesyCar,
    ownModel: 'A3',
    offeredModel: 'Q4 e-tron',
  },
}

/** Luca after reaching the top level. */
export const lucaTopMe: MeResponse = {
  ...lucaMe,
  level: { current: 'rs-vanguard', next: null, points: 3200, pointsToNext: null, progress: 1 },
  courtesyCar: {
    level: 'rs-vanguard',
    rule: getLevel(program, 'rs-vanguard').courtesyCar,
    ownModel: 'A3',
    offeredModel: 'A6 e-tron',
  },
}

/** Same user with a vehicle of a different age (to check the service multiplier). */
export function withVehicleAge(me: MeResponse, ageYears: number): MeResponse {
  return {
    ...me,
    households: me.households.map((h) => ({ ...h, vehicle: { ...h.vehicle, ageYears, year: 2026 - ageYears } })),
  }
}
