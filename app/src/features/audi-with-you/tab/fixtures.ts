// Fictional MeResponse fixtures for tests and previews. Emails end with @example.com.
import type { Household, MeResponse } from '@/shared/types'
import { getLevel, program } from '../program'

const vehicle = { id: 'v-a3', model: 'A3', year: 2021, ageYears: 5 }

const lucaHousehold: Household = {
  vehicle,
  myRole: 'secondary',
  members: [
    { userId: 'u-paolo', name: 'Paolo', role: 'key', points: 300, level: 'start', isMe: false },
    { userId: 'u-luca', name: 'Luca', role: 'secondary', points: 750, level: 'plus', isMe: true },
  ],
  secondarySlots: { used: 1, max: 5 },
  pendingInvites: [],
}

/** Luca, 21, drives the family A3 as secondary user. Level Plus. */
export const lucaMe: MeResponse = {
  user: { id: 'u-luca', email: 'luca@example.com', name: 'Luca', birthYear: 2005, createdAt: '2026-09-01T10:00:00.000Z' },
  level: { current: 'plus', next: 'vorsprung', points: 750, pointsToNext: 750, progress: 0.25 },
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
  courtesyCar: { level: 'plus', rule: getLevel(program, 'plus').courtesyCar, ownModel: 'A3', offeredModel: 'A5' },
}

/** Paolo, key user of the same A3. Level Start. */
export const paoloMe: MeResponse = {
  user: { id: 'u-paolo', email: 'paolo@example.com', name: 'Paolo', birthYear: 1968, createdAt: '2026-08-15T10:00:00.000Z' },
  level: { current: 'start', next: 'plus', points: 300, pointsToNext: 200, progress: 0.6 },
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
  courtesyCar: { level: 'start', rule: getLevel(program, 'start').courtesyCar, ownModel: 'A3', offeredModel: 'A3' },
}

/** Luca after reaching the top level. */
export const lucaVorsprungMe: MeResponse = {
  ...lucaMe,
  level: { current: 'vorsprung', next: null, points: 1600, pointsToNext: null, progress: 1 },
  courtesyCar: {
    level: 'vorsprung',
    rule: getLevel(program, 'vorsprung').courtesyCar,
    ownModel: 'A3',
    offeredModel: 'Q4 e-tron',
  },
}

/** Same user with a vehicle of a different age (to check the service multiplier). */
export function withVehicleAge(me: MeResponse, ageYears: number): MeResponse {
  return {
    ...me,
    households: me.households.map((h) => ({ ...h, vehicle: { ...h.vehicle, ageYears, year: 2026 - ageYears } })),
  }
}
