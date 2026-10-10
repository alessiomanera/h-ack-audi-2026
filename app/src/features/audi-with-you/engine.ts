// Points engine: pure, deterministic functions shared by the Worker and the UI.
// No I/O. Every number comes from program.it.json; pass `now` in explicitly.
import type {
  ActionType,
  CourtesyCarOffer,
  LevelId,
  LevelProgress,
  Program,
  ServiceKind,
  SessionKind,
} from '../../shared/types'
import { getAction, getLevel, levelsInOrder } from './program'

/** Italian labels and notices produced by the engine. */
export const ENGINE_COPY = {
  join: (programName: string) => `Benvenuto in ${programName}`,
  inviteAccepted: (name: string) => `Invito accettato: ${name}`,
  inviteJoined: (inviterName: string) => `Invito di ${inviterName} accettato`,
  inviteGeneric: 'Invito accettato',
  service: {
    tagliando: 'Tagliando in officina Audi',
    gomme: 'Cambio gomme in officina Audi',
    check_invernale: 'Check invernale in officina Audi',
  } satisfies Record<ServiceKind, string>,
  session: {
    dealer: 'Sessione Conosci la tua Audi',
    driving_experience: 'Audi driving experience',
  } satisfies Record<SessionKind, string>,
  event: (name: string) => `Check-in evento: ${name}`,
  eventDefaultName: 'Evento in concessionaria',
  charging: 'Ricarica Audi',
  accessory: (itemName: string | null) =>
    itemName ? `Accessorio originale Audi: ${itemName}` : 'Accessorio originale Audi',
  merch: (itemName: string | null) => (itemName ? `Audi Collection: ${itemName}` : 'Audi Collection'),
  tradeIn: (vehicleModel: string | null) =>
    vehicleModel ? `Permuta della tua ${vehicleModel} per una nuova Audi` : 'Permuta per una nuova Audi',
  notice: {
    disabled: 'Questa azione non è attiva nel programma in questo momento.',
    alreadyJoined: 'Hai già ricevuto i punti di benvenuto.',
    alreadyInvited: 'I punti per questo invito sono già stati assegnati.',
    chargingCap: (cap: number) =>
      `Hai già ${cap} ricariche premiate questo mese. Il conteggio riparte il mese prossimo.`,
    merchCap: (cap: number) =>
      `Hai già ${cap} acquisti Audi Collection premiati questo mese. Il conteggio riparte il mese prossimo.`,
    monthlyCap: (cap: number) =>
      `Questa attività è già stata premiata ${cap} volte questo mese. Il conteggio riparte il mese prossimo.`,
    alreadyTradedIn: 'Hai già ricevuto i punti per la permuta di questa Audi.',
  },
} as const

/** Italian notice for an action that reached its monthly cap. */
function monthlyCapNotice(type: ActionType, cap: number): string {
  if (type === 'charging') return ENGINE_COPY.notice.chargingCap(cap)
  if (type === 'merch') return ENGINE_COPY.notice.merchCap(cap)
  return ENGINE_COPY.notice.monthlyCap(cap)
}

// ---------- Levels ----------

export function levelForPoints(program: Program, points: number): LevelId {
  const levels = levelsInOrder(program)
  let current = levels[0]
  for (const level of levels) {
    if (points >= level.threshold) current = level
  }
  return current.id
}

export function levelProgress(program: Program, points: number): LevelProgress {
  const levels = levelsInOrder(program)
  const currentId = levelForPoints(program, points)
  const index = levels.findIndex((l) => l.id === currentId)
  const current = levels[index]
  const next = levels[index + 1]
  if (!next) {
    return { current: currentId, next: null, points, pointsToNext: null, progress: 1 }
  }
  const span = next.threshold - current.threshold
  const raw = span > 0 ? (points - current.threshold) / span : 1
  return {
    current: currentId,
    next: next.id,
    points,
    pointsToNext: Math.max(0, next.threshold - points),
    progress: Math.min(1, Math.max(0, raw)),
  }
}

// ---------- Time helpers ----------

/** Whole calendar years since the vehicle's model year. */
export function vehicleAgeYears(year: number, now: Date): number {
  return Math.max(0, now.getUTCFullYear() - year)
}

/** First instant of the calendar month of `now` (UTC). */
export function monthStartUtc(now: Date): Date {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1))
}

// ---------- Awards ----------

export interface AwardInput {
  type: ActionType
  now: Date
  /** service: model year of the vehicle serviced. */
  vehicleYear?: number
  /** join: the user already received the welcome points. */
  alreadyJoined?: boolean
  /** invite: points for this inviter/invitee pair were already granted. */
  alreadyAwardedForInvitee?: boolean
  /** Actions with `monthlyCap` (merch, charging): rewarded entries of THIS action type in the current calendar month. */
  thisMonth?: number
  /** trade_in: points were already granted for a trade-in of this vehicle (by anyone). */
  alreadyTradedIn?: boolean
}

export interface Award {
  points: number
  /** Italian explanation when nothing was awarded. */
  notice: string | null
  /** service: the age multiplier was applied. */
  multiplied: boolean
  factor: number
}

function none(notice: string): Award {
  return { points: 0, notice, multiplied: false, factor: 1 }
}

export function computeAward(program: Program, input: AwardInput): Award {
  const action = getAction(program, input.type)
  if (!action.enabled) return none(ENGINE_COPY.notice.disabled)
  // Points are flat per action, never proportional to money spent.
  const base: Award = { points: action.points, notice: null, multiplied: false, factor: 1 }
  const cap = action.monthlyCap
  if (typeof cap === 'number' && (input.thisMonth ?? 0) >= cap) return none(monthlyCapNotice(input.type, cap))

  switch (input.type) {
    case 'join':
      return input.alreadyJoined ? none(ENGINE_COPY.notice.alreadyJoined) : base
    case 'invite':
      return input.alreadyAwardedForInvitee ? none(ENGINE_COPY.notice.alreadyInvited) : base
    case 'service': {
      const m = action.multiplier
      if (m && input.vehicleYear !== undefined && vehicleAgeYears(input.vehicleYear, input.now) > m.olderThanYears) {
        return { points: action.points * m.factor, notice: null, multiplied: true, factor: m.factor }
      }
      return base
    }
    case 'trade_in':
      return action.oncePerVehicle && input.alreadyTradedIn ? none(ENGINE_COPY.notice.alreadyTradedIn) : base
    case 'accessory':
    case 'merch':
    case 'session':
    case 'event':
    case 'charging':
      return base
  }
}

// ---------- Courtesy car ----------

function normalizeModel(model: string): string {
  return model.trim().replace(/^audi\s+/i, '').toLowerCase()
}

function family(model: string): 'a' | 'q' | null {
  const first = normalizeModel(model).charAt(0)
  return first === 'a' || first === 'q' ? first : null
}

function isElectric(model: string): boolean {
  return normalizeModel(model).includes('e-tron')
}

/** Canonical spelling of a model from program.segments, or null when unknown. */
export function canonicalModel(program: Program, model: string): string | null {
  const wanted = normalizeModel(model)
  for (const segment of program.segments) {
    const hit = segment.models.find((m) => normalizeModel(m) === wanted)
    if (hit) return hit
  }
  return null
}

export function courtesyCarFor(program: Program, levelId: LevelId, ownModel: string): CourtesyCarOffer {
  const rule = getLevel(program, levelId).courtesyCar
  const offer = (offeredModel: string): CourtesyCarOffer => ({ level: levelId, rule, ownModel, offeredModel })

  const wanted = normalizeModel(ownModel)
  const ownIndex = program.segments.findIndex((s) => s.models.some((m) => normalizeModel(m) === wanted))
  if (ownIndex < 0) return offer(ownModel)

  const targetIndex = Math.min(ownIndex + rule.segmentsUp, program.segments.length - 1)
  const models = program.segments[targetIndex].models
  const fam = family(ownModel)
  const sameFamily = models.filter((m) => family(m) === fam)

  if (rule.electricWhenAvailable) {
    const electric =
      sameFamily.find(isElectric) ?? models.find(isElectric)
    if (electric) return offer(electric)
  }
  if (targetIndex === ownIndex) return offer(canonicalModel(program, ownModel) ?? ownModel)
  return offer(sameFamily[0] ?? models[0] ?? ownModel)
}

// ---------- Ledger labels ----------

export type LedgerMeta = Record<string, string | number | boolean>

function str(meta: LedgerMeta, key: string): string | null {
  const v = meta[key]
  return typeof v === 'string' && v.trim() !== '' ? v : null
}

function isServiceKind(v: string | null): v is ServiceKind {
  return v === 'tagliando' || v === 'gomme' || v === 'check_invernale'
}

function isSessionKind(v: string | null): v is SessionKind {
  return v === 'dealer' || v === 'driving_experience'
}

export function ledgerLabel(program: Program, type: ActionType, meta: LedgerMeta): string {
  switch (type) {
    case 'join':
      return ENGINE_COPY.join(program.name)
    case 'invite': {
      const name = str(meta, 'name')
      if (!name) return ENGINE_COPY.inviteGeneric
      return meta.side === 'invitee' ? ENGINE_COPY.inviteJoined(name) : ENGINE_COPY.inviteAccepted(name)
    }
    case 'service': {
      const kind = str(meta, 'serviceKind')
      return ENGINE_COPY.service[isServiceKind(kind) ? kind : 'tagliando']
    }
    case 'session': {
      const kind = str(meta, 'sessionKind')
      return ENGINE_COPY.session[isSessionKind(kind) ? kind : 'dealer']
    }
    case 'event':
      return ENGINE_COPY.event(str(meta, 'eventName') ?? ENGINE_COPY.eventDefaultName)
    case 'charging':
      return ENGINE_COPY.charging
    case 'accessory':
      return ENGINE_COPY.accessory(str(meta, 'itemName'))
    case 'merch':
      return ENGINE_COPY.merch(str(meta, 'itemName'))
    case 'trade_in':
      return ENGINE_COPY.tradeIn(str(meta, 'vehicleModel'))
  }
}
