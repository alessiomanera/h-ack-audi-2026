// Fictional fixtures for the full version tests. Emails end with @example.com.
// Level ids follow program.it.json: icon-circle, quattro-circle, s-line-club, rs-vanguard.
import type { Household, HouseholdMember, LedgerEntry, LevelId, MeResponse } from '@/shared/types'
import type { SessionStatus, SessionValue } from '@/state/session'
import { getLevel, program } from '../program'

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
    points: 150,
    label: 'Sessione "Conosci la tua Audi"',
    meta: { sessionKind: 'dealer' },
    createdAt: '2026-08-14T12:00:00.000Z',
  },
  {
    id: 'l3',
    action: 'service',
    points: 400,
    label: 'Tagliando in officina Audi (punti doppi)',
    meta: { serviceKind: 'tagliando', multiplied: true },
    createdAt: '2026-07-15T12:00:00.000Z',
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
    points: 400,
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
]

function household(myRole: Household['myRole'], paolo: { points: number; level: LevelId }): Household {
  const members: HouseholdMember[] = [
    { userId: 'u-paolo', name: 'Paolo', role: 'key', points: paolo.points, level: paolo.level, isMe: myRole === 'key' },
    { userId: 'u-luca', name: 'Luca', role: 'secondary', points: 850, level: 'quattro-circle', isMe: myRole === 'secondary' },
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
  level: { current: 'quattro-circle', next: 's-line-club', points: 850, pointsToNext: 650, progress: 0.35 },
  households: [household('secondary', { points: 600, level: 'quattro-circle' })],
  ledger: lucaLedger,
  courtesyCar: {
    level: 'quattro-circle',
    rule: getLevel(program, 'quattro-circle').courtesyCar,
    ownModel: 'A3',
    offeredModel: 'A5',
  },
}

/** Paolo, key user of the A3 (seed: 600 points, quattro Circle), with one pending invite. */
export const paoloMe: MeResponse = {
  user: { id: 'u-paolo', email: 'paolo@example.com', name: 'Paolo', birthYear: 1968, createdAt: '2026-04-02T12:00:00.000Z' },
  level: { current: 'quattro-circle', next: 's-line-club', points: 600, pointsToNext: 900, progress: 0.1 },
  households: [household('key', { points: 600, level: 'quattro-circle' })],
  ledger: paoloLedger,
  courtesyCar: null,
}

/** Paolo after the trade in (demo flow F3): 1600 points, S line Club, next milestone RS Vanguard. */
export const paoloTradeInMe: MeResponse = {
  ...paoloMe,
  level: { current: 's-line-club', next: 'rs-vanguard', points: 1600, pointsToNext: 1400, progress: 100 / 1500 },
  households: [household('key', { points: 1600, level: 's-line-club' })],
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
  level: { current: 'rs-vanguard', next: null, points: 3200, pointsToNext: null, progress: 1 },
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
  }
}
