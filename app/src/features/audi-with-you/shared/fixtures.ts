// Test fixtures for the shared components. Fictional people only.
// Level ids follow program.it.json: icon-circle (0), quattro-circle (500), s-line-club (1500), rs-vanguard (3000).
import type { ActionResult, CourtesyCarOffer, MeResponse, ProgramReward } from '@/shared/types'
import type { SessionValue } from '@/state/session'

/** The RS Vanguard bonus, as in program.it.json. */
export const wrapReward: ProgramReward = {
  id: 'rs-wrap',
  title: 'Wrap personalizzato',
  description: 'Un wrap disegnato con il Centro Stile per la tua Audi.',
  kind: 'design',
  bonus: true,
  limited: true,
  image: '/rewards/wrap-demo.jpg',
  note: 'da verificare: un cambio colore totale richiede l’aggiornamento della carta di circolazione',
}

export const lucaMe: MeResponse = {
  user: { id: 'u-luca', email: 'luca@example.com', name: 'Luca Bianchi', birthYear: 2005, createdAt: '2026-09-01T10:00:00.000Z' },
  level: { current: 'icon-circle', next: 'quattro-circle', points: 320, pointsToNext: 180, progress: 0.64 },
  households: [
    {
      vehicle: { id: 'v-a3', model: 'A3', year: 2021, ageYears: 5 },
      myRole: 'secondary',
      members: [
        { userId: 'u-paolo', name: 'Paolo Bianchi', role: 'key', points: 600, level: 'quattro-circle', isMe: false },
        { userId: 'u-luca', name: 'Luca Bianchi', role: 'secondary', points: 320, level: 'icon-circle', isMe: true },
      ],
      secondarySlots: { used: 1, max: 5 },
      pendingInvites: [],
    },
  ],
  ledger: [],
  courtesyCar: {
    level: 'icon-circle',
    rule: { label: 'Standard', description: 'Auto di cortesia dello stesso segmento della tua Audi.', segmentsUp: 0 },
    ownModel: 'A3',
    offeredModel: 'A3',
  },
}

export const quattroOffer: CourtesyCarOffer = {
  level: 'quattro-circle',
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
  level: { current: 'quattro-circle', next: 's-line-club', points: 720, pointsToNext: 780, progress: 0.22 },
  courtesyCar: quattroOffer,
}

/** F1: Luca's tagliando on a 5 year old A3, doubled to +400, moves him to quattro Circle. */
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
  levelUp: 'quattro-circle',
  courtesyCar: quattroOffer,
  me: lucaAfterService,
}

export const giuliaMe: MeResponse = {
  user: { id: 'u-giulia', email: 'giulia@example.com', name: 'Giulia Rossi', birthYear: 1997, createdAt: '2026-09-01T10:00:00.000Z' },
  level: { current: 'quattro-circle', next: 's-line-club', points: 1450, pointsToNext: 50, progress: 0.95 },
  households: [
    {
      vehicle: { id: 'v-q3', model: 'Q3', year: 2025, ageYears: 1 },
      myRole: 'key',
      members: [{ userId: 'u-giulia', name: 'Giulia Rossi', role: 'key', points: 1450, level: 'quattro-circle', isMe: true }],
      secondarySlots: { used: 0, max: 5 },
      pendingInvites: [],
    },
  ],
  ledger: [],
  courtesyCar: null,
}

/** F2: Giulia's event check-in (+100) takes her from 1450 to 1550, into S line Club. */
export const eventLevelUpResult: ActionResult = {
  entry: {
    id: 'l-2',
    action: 'event',
    points: 100,
    label: 'Check-in evento: Serata Audi in concessionaria',
    meta: { eventName: 'Serata Audi in concessionaria' },
    createdAt: '2026-10-10T12:05:00.000Z',
  },
  awarded: 100,
  notice: null,
  levelUp: 's-line-club',
  courtesyCar: null,
  me: {
    ...giuliaMe,
    level: { current: 's-line-club', next: 'rs-vanguard', points: 1550, pointsToNext: 1450, progress: 0.03 },
  },
}

/** F2 first step: an accessory (+100) with no level change opens no dialog. */
export const accessoryResult: ActionResult = {
  entry: {
    id: 'l-3',
    action: 'accessory',
    points: 100,
    label: 'Accessorio originale: Barre portatutto',
    meta: { itemName: 'Barre portatutto' },
    createdAt: '2026-10-10T12:04:00.000Z',
  },
  awarded: 100,
  notice: null,
  levelUp: null,
  courtesyCar: null,
  me: giuliaMe,
}

export const paoloMe: MeResponse = {
  user: { id: 'u-paolo', email: 'paolo@example.com', name: 'Paolo Bianchi', birthYear: 1970, createdAt: '2026-09-01T10:00:00.000Z' },
  level: { current: 'quattro-circle', next: 's-line-club', points: 600, pointsToNext: 900, progress: 0.1 },
  households: [
    {
      vehicle: { id: 'v-a3', model: 'A3', year: 2021, ageYears: 5 },
      myRole: 'key',
      members: [
        { userId: 'u-paolo', name: 'Paolo Bianchi', role: 'key', points: 600, level: 'quattro-circle', isMe: true },
        { userId: 'u-luca', name: 'Luca Bianchi', role: 'secondary', points: 320, level: 'icon-circle', isMe: false },
      ],
      secondarySlots: { used: 1, max: 5 },
      pendingInvites: [],
    },
  ],
  ledger: [],
  courtesyCar: null,
}

/** F3: Paolo trades in his A3 (+1000) and reaches S line Club with level and history intact. */
export const tradeInResult: ActionResult = {
  entry: {
    id: 'l-4',
    action: 'trade_in',
    points: 1000,
    label: 'Permuta in concessionaria Audi',
    meta: {},
    createdAt: '2026-10-10T12:10:00.000Z',
  },
  awarded: 1000,
  notice: null,
  levelUp: 's-line-club',
  courtesyCar: null,
  me: {
    ...paoloMe,
    level: { current: 's-line-club', next: 'rs-vanguard', points: 1600, pointsToNext: 1400, progress: 0.07 },
  },
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
