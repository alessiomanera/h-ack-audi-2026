// Fictional fixtures for the full version tests. Emails end with @example.com.
// Level ids follow program.it.json: icon-circle (0), quattro-circle (1000), s-line-club (2500), rs-vanguard (5000).
// Points are the rolling 36 month window, never spent; lifetimePoints adds what left the window.
import type { Household, HouseholdMember, LedgerEntry, LevelId, LevelProgress, MeResponse, RewardBooking } from '@/shared/types'
import type { SessionStatus, SessionValue } from '@/state/session'
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

const vehicle = { id: 'veh-a3', model: 'A3', year: 2021, ageYears: 5 }

const lucaLedger: LedgerEntry[] = [
  {
    id: 'l5',
    action: 'event',
    points: 100,
    label: 'Evento Audi in concessionaria',
    meta: { eventName: 'Serata in concessionaria' },
    createdAt: '2026-09-18T12:00:00.000Z',
  },
  {
    id: 'l4',
    action: 'session',
    points: 250,
    label: 'Audi driving experience',
    meta: { sessionKind: 'driving_experience' },
    createdAt: '2026-08-14T12:00:00.000Z',
  },
  {
    id: 'l3',
    action: 'service',
    points: 600,
    label: 'Tagliando in officina Audi (punti doppi)',
    meta: { serviceKind: 'tagliando', multiplied: true },
    createdAt: '2026-07-15T12:00:00.000Z',
  },
  {
    id: 'l2b',
    action: 'accessory',
    points: 100,
    label: 'Accessorio originale: Barre portatutto',
    meta: { itemName: 'Barre portatutto' },
    createdAt: '2026-06-03T12:00:00.000Z',
  },
  {
    id: 'l2',
    action: 'invite',
    points: 100,
    label: 'Invito accettato in famiglia',
    meta: {},
    createdAt: '2026-05-12T12:00:00.000Z',
  },
  {
    id: 'l1',
    action: 'join',
    points: 100,
    label: 'Benvenuto in Audi with you',
    meta: {},
    createdAt: '2026-05-12T12:00:00.000Z',
  },
]

const paoloLedger: LedgerEntry[] = [
  {
    id: 'p3',
    action: 'service',
    points: 600,
    label: 'Tagliando in officina Audi (punti doppi)',
    meta: { serviceKind: 'tagliando', multiplied: true },
    createdAt: '2026-06-10T12:00:00.000Z',
  },
  {
    id: 'p2',
    action: 'invite',
    points: 100,
    label: 'Invito accettato in famiglia',
    meta: {},
    createdAt: '2026-05-12T12:00:00.000Z',
  },
  {
    id: 'p1',
    action: 'join',
    points: 100,
    label: 'Benvenuto in Audi with you',
    meta: {},
    createdAt: '2026-04-02T12:00:00.000Z',
  },
  {
    id: 'p0',
    action: 'service',
    points: 150,
    label: 'Tagliando in officina Audi',
    meta: { serviceKind: 'tagliando' },
    createdAt: '2022-06-10T12:00:00.000Z',
  },
]

function household(myRole: Household['myRole'], paolo: { points: number; level: LevelId }): Household {
  const members: HouseholdMember[] = [
    { userId: 'u-paolo', name: 'Paolo', role: 'key', points: paolo.points, level: paolo.level, isMe: myRole === 'key' },
    { userId: 'u-luca', name: 'Luca', role: 'secondary', points: 1250, level: 'quattro-circle', isMe: myRole === 'secondary' },
  ]
  return {
    vehicle,
    myRole,
    members,
    secondarySlots: { used: 1, max: 5 },
    pendingInvites:
      myRole === 'key'
        ? [
            {
              code: 'AB12CD',
              email: 'sara@example.com',
              status: 'pending',
              inviterName: 'Paolo',
              vehicleModel: 'A3',
              createdAt: '2026-10-01T12:00:00.000Z',
            },
          ]
        : [],
  }
}

/** Luca, 21, secondary user on his father's A3, level quattro Circle. */
export const lucaMe: MeResponse = {
  user: { id: 'u-luca', email: 'luca@example.com', name: 'Luca', birthYear: 2005, createdAt: '2026-05-12T12:00:00.000Z' },
  level: progress({ current: 'quattro-circle', next: 's-line-club', points: 1250, pointsToNext: 1250, progress: 250 / 1500 }),
  households: [household('secondary', { points: 1700, level: 'quattro-circle' })],
  ledger: lucaLedger,
  courtesyCar: {
    level: 'quattro-circle',
    rule: getLevel(program, 'quattro-circle').courtesyCar,
    ownModel: 'A3',
    offeredModel: 'A5',
  },
  bookings: [],
}

/** Paolo, key user of the A3 (seed: 1700 window points, one older entry, 150 leaving soon), one pending invite. */
export const paoloMe: MeResponse = {
  user: { id: 'u-paolo', email: 'paolo@example.com', name: 'Paolo', birthYear: 1968, createdAt: '2022-06-10T12:00:00.000Z' },
  level: progress({
    current: 'quattro-circle',
    next: 's-line-club',
    points: 1700,
    pointsToNext: 800,
    progress: 700 / 1500,
    lifetimePoints: 1850,
    expiring: { points: 150, withinDays: 90 },
  }),
  households: [household('key', { points: 1700, level: 'quattro-circle' })],
  ledger: paoloLedger,
  courtesyCar: null,
  bookings: [fasttrackBooking],
}

/** Paolo after the trade in (demo flow F3): 2700 points, S line Club, next milestone RS Vanguard. */
export const paoloTradeInMe: MeResponse = {
  ...paoloMe,
  level: progress({
    current: 's-line-club',
    next: 'rs-vanguard',
    points: 2700,
    pointsToNext: 2300,
    progress: 200 / 2500,
    lifetimePoints: 2850,
    expiring: { points: 150, withinDays: 90 },
  }),
  households: [household('key', { points: 2700, level: 's-line-club' })],
  ledger: [
    {
      id: 'p4',
      action: 'trade_in',
      points: 1000,
      label: 'Permuta in concessionaria Audi',
      meta: {},
      createdAt: '2026-10-10T12:00:00.000Z',
    },
    ...paoloLedger,
  ],
  courtesyCar: {
    level: 's-line-club',
    rule: getLevel(program, 's-line-club').courtesyCar,
    ownModel: 'A3',
    offeredModel: 'Q4 e-tron',
  },
}

/** A member at the top level: no next milestone. */
export const topLevelMe: MeResponse = {
  ...lucaMe,
  level: progress({ current: 'rs-vanguard', next: null, points: 5200, pointsToNext: null, progress: 1 }),
  courtesyCar: null,
}

const notInTests = async (): Promise<never> => {
  throw new Error('Not available in tests')
}

/** A fixed SessionValue for SessionTestProvider. */
export function makeSession(status: SessionStatus, me: MeResponse | null = null): SessionValue {
  return {
    status,
    me,
    refresh: async () => {},
    login: async () => {},
    signup: async () => {},
    loginAs: async () => {},
    logout: async () => {},
    runAction: notInTests,
    createInvite: notInTests,
    acceptInvite: async () => {},
    resetDemo: async () => {},
    bookReward: notInTests,
  }
}
