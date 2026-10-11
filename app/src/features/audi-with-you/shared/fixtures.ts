// Test fixtures for the shared components. Fictional people only.
// Level ids follow program.it.json: icon-circle (0), quattro-circle (1000), s-line-club (2500), rs-vanguard (5000).
// Points are the rolling 36 month window and are never spent; lifetimePoints adds what left the window.
import type {
  ActionResult,
  BookingResponse,
  CourtesyCarOffer,
  LevelProgress,
  MeResponse,
  ProgramReward,
  RewardBooking,
} from '@/shared/types'
import type { SessionValue } from '@/state/session'

/** A LevelProgress with the window fields at their quiet defaults. */
export function progress(p: Pick<LevelProgress, 'current' | 'next' | 'points' | 'pointsToNext' | 'progress'> & Partial<LevelProgress>): LevelProgress {
  return { lifetimePoints: p.points, expiring: null, blockedBy: null, ...p }
}

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
  claim: {
    cta: 'Richiedi il tuo posto',
    options: [{ id: 'zona', label: 'Scegli la zona del wrap', choices: ['Tetto', 'Calotte degli specchietti', 'Linee laterali'] }],
    seatsPerChoice: 10,
    confirmation: 'Richiesta registrata.',
  },
}

/** S line Club experience with two options and limited seats (F2 demo moment). */
export const dolomitiReward: ProgramReward = {
  id: 'sline-dolomiti',
  title: 'Una giornata Audi sulle Dolomiti',
  description: 'Accoglienza e lounge in un hub Audi, deposito sci e un modulo di Audi driving experience su neve.',
  kind: 'experience',
  limited: true,
  note: 'Servizi sulle piste da definire con Dolomiti Superski',
  claim: {
    cta: 'Prenota',
    options: [
      { id: 'hub', label: "Scegli l'hub", choices: ["Cortina d'Ampezzo", 'Alta Badia', 'Madonna di Campiglio'] },
      { id: 'data', label: 'Scegli la data', choices: ['Sabato 16 gennaio 2027', 'Sabato 30 gennaio 2027', 'Sabato 13 febbraio 2027'] },
    ],
    seatsPerChoice: 20,
    confirmation: 'Ci vediamo in montagna.',
  },
}

/** quattro Circle welcome kit: one option, unlimited. */
export const quattroKitReward: ProgramReward = {
  id: 'quattro-kit',
  title: 'Kit di benvenuto: borraccia e accessori da viaggio',
  description: 'Lo ritiri in concessionaria.',
  kind: 'welcome_kit',
  claim: {
    cta: 'Ritira in concessionaria',
    options: [{ id: 'concessionaria', label: 'Scegli la concessionaria', choices: ['Treviso', 'Padova', 'Milano'] }],
    confirmation: 'Il tuo kit ti aspetta in concessionaria.',
  },
}

export const dolomitiBooking: RewardBooking = {
  id: 'b-1',
  rewardId: 'sline-dolomiti',
  rewardTitle: 'Una giornata Audi sulle Dolomiti',
  levelId: 's-line-club',
  choices: { hub: "Cortina d'Ampezzo", data: 'Sabato 30 gennaio 2027' },
  code: 'AWY-7K2Q',
  tickets: 2,
  delivery: 'qr',
  createdAt: '2026-10-10T12:06:00.000Z',
}

export const fasttrackBooking: RewardBooking = {
  id: 'b-2',
  rewardId: 'quattro-fasttrack',
  rewardTitle: 'Fast track in officina',
  levelId: 'quattro-circle',
  choices: { data: 'Martedì 13 ottobre, 8:30', concessionaria: 'Treviso' },
  code: 'AWY-3F9D',
  tickets: 1,
  delivery: 'qr',
  createdAt: '2026-10-09T09:00:00.000Z',
}

/** F1 start: Luca, secondary user on Paolo's 2021 A3, 650 window points, Icon Circle. */
export const lucaMe: MeResponse = {
  user: { id: 'u-luca', email: 'luca@example.com', name: 'Luca Bianchi', birthYear: 2005, createdAt: '2026-09-01T10:00:00.000Z' },
  level: progress({ current: 'icon-circle', next: 'quattro-circle', points: 650, pointsToNext: 350, progress: 0.65 }),
  households: [
    {
      vehicle: { id: 'v-a3', model: 'A3', year: 2021, ageYears: 5 },
      myRole: 'secondary',
      members: [
        { userId: 'u-paolo', name: 'Paolo Bianchi', role: 'key', points: 1700, level: 'quattro-circle', isMe: false },
        { userId: 'u-luca', name: 'Luca Bianchi', role: 'secondary', points: 650, level: 'icon-circle', isMe: true },
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
  bookings: [],
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
  level: progress({ current: 'quattro-circle', next: 's-line-club', points: 1250, pointsToNext: 1250, progress: 250 / 1500 }),
  courtesyCar: quattroOffer,
}

/** F1: Luca's tagliando on a 5 year old A3, doubled to +600, moves him to quattro Circle. */
export const serviceResult: ActionResult = {
  entry: {
    id: 'l-1',
    action: 'service',
    points: 600,
    label: 'Tagliando in officina Audi',
    meta: { serviceKind: 'tagliando', multiplied: true },
    createdAt: '2026-10-10T12:00:00.000Z',
  },
  awarded: 600,
  notice: null,
  levelUp: 'quattro-circle',
  courtesyCar: quattroOffer,
  me: lucaAfterService,
}

/** F4: Luca becomes key user of his first Audi; Paolo, who invited him, gets the inviter points. */
export const firstAudiResult: ActionResult = {
  entry: {
    id: 'l-9',
    action: 'first_audi',
    points: 1000,
    label: 'La tua prima Audi',
    meta: {},
    createdAt: '2026-10-10T12:20:00.000Z',
  },
  awarded: 1000,
  notice: null,
  levelUp: null,
  courtesyCar: null,
  me: {
    ...lucaAfterService,
    level: progress({ current: 'quattro-circle', next: 's-line-club', points: 2250, pointsToNext: 250, progress: 1250 / 1500 }),
  },
}

/** F2 after the accessory: Giulia, key user of a 2025 Q3, 2450 window points, quattro Circle. */
export const giuliaMe: MeResponse = {
  user: { id: 'u-giulia', email: 'giulia@example.com', name: 'Giulia Rossi', birthYear: 1997, createdAt: '2024-04-10T10:00:00.000Z' },
  level: progress({ current: 'quattro-circle', next: 's-line-club', points: 2450, pointsToNext: 50, progress: 1450 / 1500 }),
  households: [
    {
      vehicle: { id: 'v-q3', model: 'Q3', year: 2025, ageYears: 1 },
      myRole: 'key',
      members: [{ userId: 'u-giulia', name: 'Giulia Rossi', role: 'key', points: 2450, level: 'quattro-circle', isMe: true }],
      secondarySlots: { used: 0, max: 5 },
      pendingInvites: [],
    },
  ],
  ledger: [],
  courtesyCar: null,
  bookings: [],
}

/** Giulia right after the event: S line Club, nothing booked yet. */
export const giuliaSlineMe: MeResponse = {
  ...giuliaMe,
  level: progress({ current: 's-line-club', next: 'rs-vanguard', points: 2550, pointsToNext: 2450, progress: 50 / 2500 }),
}

/** F2: Giulia's event check-in (+100) takes her from 2450 to 2550, into S line Club. */
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
  me: giuliaSlineMe,
}

/** F2 booking: Cortina, 30 January. Points unchanged. */
export const dolomitiBookingResponse: BookingResponse = {
  booking: dolomitiBooking,
  seatsLeft: 19,
  me: { ...giuliaSlineMe, bookings: [dolomitiBooking] },
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

/** F3 start: Paolo, key user of the 2021 A3. 1700 window points, 150 older ones, 150 leaving soon. */
export const paoloMe: MeResponse = {
  user: { id: 'u-paolo', email: 'paolo@example.com', name: 'Paolo Bianchi', birthYear: 1970, createdAt: '2022-03-01T10:00:00.000Z' },
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
      vehicle: { id: 'v-a3', model: 'A3', year: 2021, ageYears: 5 },
      myRole: 'key',
      members: [
        { userId: 'u-paolo', name: 'Paolo Bianchi', role: 'key', points: 1700, level: 'quattro-circle', isMe: true },
        { userId: 'u-luca', name: 'Luca Bianchi', role: 'secondary', points: 650, level: 'icon-circle', isMe: false },
      ],
      secondarySlots: { used: 1, max: 5 },
      pendingInvites: [],
    },
  ],
  ledger: [],
  courtesyCar: null,
  bookings: [fasttrackBooking],
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
    level: progress({
      current: 's-line-club',
      next: 'rs-vanguard',
      points: 2700,
      pointsToNext: 2300,
      progress: 200 / 2500,
      lifetimePoints: 2850,
      expiring: { points: 150, withinDays: 90 },
    }),
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
    bookReward: async () => dolomitiBookingResponse,
    ...overrides,
  }
}
