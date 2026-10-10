// Fictional fixtures for the full version tests. Emails end with @example.com.
import type { Household, LedgerEntry, MeResponse } from '@/shared/types'
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

function household(myRole: Household['myRole']): Household {
  return {
    vehicle,
    myRole,
    members: [
      { userId: 'u-paolo', name: 'Paolo', role: 'key', points: 1200, level: 'plus', isMe: myRole === 'key' },
      { userId: 'u-luca', name: 'Luca', role: 'secondary', points: 850, level: 'plus', isMe: myRole === 'secondary' },
    ],
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

/** Luca, 21, secondary user on his father's A3, level Plus. */
export const lucaMe: MeResponse = {
  user: { id: 'u-luca', email: 'luca@example.com', name: 'Luca', birthYear: 2005, createdAt: '2026-05-12T12:00:00.000Z' },
  level: { current: 'plus', next: 'vorsprung', points: 850, pointsToNext: 650, progress: 0.35 },
  households: [household('secondary')],
  ledger: lucaLedger,
  courtesyCar: { level: 'plus', rule: getLevel(program, 'plus').courtesyCar, ownModel: 'A3', offeredModel: 'A5' },
}

/** Paolo, key user of the A3, with one pending invite. */
export const paoloMe: MeResponse = {
  user: { id: 'u-paolo', email: 'paolo@example.com', name: 'Paolo', birthYear: 1968, createdAt: '2026-04-02T12:00:00.000Z' },
  level: { current: 'plus', next: 'vorsprung', points: 1200, pointsToNext: 300, progress: 0.7 },
  households: [household('key')],
  ledger: [],
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
