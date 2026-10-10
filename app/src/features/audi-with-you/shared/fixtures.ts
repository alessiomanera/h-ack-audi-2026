// Test fixtures for the shared components. Fictional people only.
import type { ActionResult, CourtesyCarOffer, MeResponse } from '@/shared/types'
import type { SessionValue } from '@/state/session'

export const lucaMe: MeResponse = {
  user: { id: 'u-luca', email: 'luca@example.com', name: 'Luca Bianchi', birthYear: 2005, createdAt: '2026-09-01T10:00:00.000Z' },
  level: { current: 'start', next: 'plus', points: 320, pointsToNext: 180, progress: 0.64 },
  households: [
    {
      vehicle: { id: 'v-a3', model: 'A3', year: 2021, ageYears: 5 },
      myRole: 'secondary',
      members: [
        { userId: 'u-paolo', name: 'Paolo Bianchi', role: 'key', points: 900, level: 'plus', isMe: false },
        { userId: 'u-luca', name: 'Luca Bianchi', role: 'secondary', points: 320, level: 'start', isMe: true },
      ],
      secondarySlots: { used: 1, max: 5 },
      pendingInvites: [],
    },
  ],
  ledger: [],
  courtesyCar: {
    level: 'start',
    rule: { label: 'Standard', description: 'Auto di cortesia dello stesso segmento della tua Audi.', segmentsUp: 0 },
    ownModel: 'A3',
    offeredModel: 'A3',
  },
}

export const plusOffer: CourtesyCarOffer = {
  level: 'plus',
  rule: {
    label: 'Un segmento in più',
    description: "Quando disponibile, un'Audi di un segmento superiore alla tua.",
    segmentsUp: 1,
  },
  ownModel: 'A3',
  offeredModel: 'A5',
}

export const lucaAfterService: MeResponse = {
  ...lucaMe,
  level: { current: 'plus', next: 'vorsprung', points: 720, pointsToNext: 780, progress: 0.22 },
  courtesyCar: plusOffer,
}

export const serviceResult: ActionResult = {
  entry: {
    id: 'l-1',
    action: 'service',
    points: 400,
    label: 'Tagliando in officina Audi',
    meta: { serviceKind: 'tagliando' },
    createdAt: '2026-10-10T12:00:00.000Z',
  },
  awarded: 400,
  notice: null,
  levelUp: 'plus',
  courtesyCar: plusOffer,
  me: lucaAfterService,
}

const noop = async () => {}

export function makeSession(overrides: Partial<SessionValue> = {}): SessionValue {
  return {
    status: 'authenticated',
    me: lucaMe,
    refresh: noop,
    login: noop,
    signup: noop,
    loginAs: noop,
    logout: noop,
    runAction: async () => serviceResult,
    createInvite: async () => {
      throw new Error('not stubbed')
    },
    acceptInvite: noop,
    resetDemo: noop,
    ...overrides,
  }
}
