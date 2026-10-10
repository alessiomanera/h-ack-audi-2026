// Fictional MeResponse fixtures for tests and previews. Emails end with @example.com.
// Level ids follow program.it.json: icon-circle (0), quattro-circle (1000), s-line-club (2500), rs-vanguard (5000).
import type { Household, LevelProgress, MeResponse, RewardBooking } from '@/shared/types'
import { getLevel, program } from '../program'

function progress(p: Pick<LevelProgress, 'current' | 'next' | 'points' | 'pointsToNext' | 'progress'> & Partial<LevelProgress>): LevelProgress {
  return { lifetimePoints: p.points, expiring: null, blockedBy: null, ...p }
}

/** Paolo's booking of the quattro Circle fast track. */
export const fasttrackBooking: RewardBooking = {
  id: 'b-2',
  rewardId: 'quattro-fasttrack',
  rewardTitle: 'Fast track in officina',
  levelId: 'quattro-circle',
  choices: { data: 'Martedì 13 ottobre, 8:30', concessionaria: 'Treviso' },
  code: 'AWY-3F9D',
  createdAt: '2026-10-09T09:00:00.000Z',
}

const vehicle = { id: 'v-a3', model: 'A3', year: 2021, ageYears: 5 }

const lucaHousehold: Household = {
  vehicle,
  myRole: 'secondary',
  members: [
    { userId: 'u-paolo', name: 'Paolo', role: 'key', points: 1700, level: 'quattro-circle', isMe: false },
    { userId: 'u-luca', name: 'Luca', role: 'secondary', points: 1250, level: 'quattro-circle', isMe: true },
  ],
  secondarySlots: { used: 1, max: 5 },
  pendingInvites: [],
}

/** Luca, 21, drives the family A3 as secondary user. Level quattro Circle, next S line Club. */
export const lucaMe: MeResponse = {
  user: { id: 'u-luca', email: 'luca@example.com', name: 'Luca', birthYear: 2005, createdAt: '2026-09-01T10:00:00.000Z' },
  level: progress({ current: 'quattro-circle', next: 's-line-club', points: 1250, pointsToNext: 1250, progress: 250 / 1500 }),
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
      points: 600,
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
  bookings: [],
}

/** Paolo, key user of the same A3 (seed: 1700 window points, 150 leaving soon). Level quattro Circle. */
export const paoloMe: MeResponse = {
  user: { id: 'u-paolo', email: 'paolo@example.com', name: 'Paolo', birthYear: 1968, createdAt: '2022-03-01T10:00:00.000Z' },
  level: progress({
    current: 'quattro-circle',
    next: 's-line-club',
    points: 1700,
    pointsToNext: 800,
    progress: 700 / 1500,
    lifetimePoints: 1850,
    expiring: { points: 150, withinDays: 90 },
  }),
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
  bookings: [fasttrackBooking],
}

/** Paolo after the trade in (demo flow F3): S line Club, next milestone RS Vanguard. */
export const paoloTradeInMe: MeResponse = {
  ...paoloMe,
  level: progress({ current: 's-line-club', next: 'rs-vanguard', points: 2700, pointsToNext: 2300, progress: 200 / 2500 }),
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
  level: progress({ current: 'rs-vanguard', next: null, points: 5200, pointsToNext: null, progress: 1 }),
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
