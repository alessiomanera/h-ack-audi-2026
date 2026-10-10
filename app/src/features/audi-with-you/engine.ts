// Points engine: pure, deterministic functions shared by the Worker and the UI.
// No I/O. Every number comes from program.it.json; pass `now` in explicitly.
import type {
  ActionType,
  CourtesyCarOffer,
  LevelId,
  LevelProgress,
  Program,
  ProgramLevel,
  ServiceKind,
  SessionKind,
} from '../../shared/types'
import { getAction, getLevel } from './program'

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
  notice: {
    disabled: 'Questa azione non è attiva nel programma in questo momento.',
    alreadyJoined: 'Hai già ricevuto i punti di benvenuto.',
    alreadyInvited: 'I punti per questo invito sono già stati assegnati.',
    chargingCap: (cap: number) =>
      `Hai già ${cap} ricariche premiate questo mese. Il conteggio riparte il mese prossimo.`,
  },
} as const

// ---------- Levels ----------

function levelsByThreshold(program: Program): ProgramLevel[] {
  return [...program.levels].sort((a, b) => a.threshold - b.threshold)
}

export function levelForPoints(program: Program, points: number): LevelId {
  const levels = levelsByThreshold(program)
  let current = levels[0]
  for (const level of levels) {
    if (points >= level.threshold) current = level
  }
  return current.id
}

export function levelProgress(program: Program, points: number): LevelProgress {
  const levels = levelsByThreshold(program)
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
  /** charging: rewarded charging entries already in this calendar month. */
  chargingThisMonth?: number
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
  const base: Award = { points: action.points, notice: null, multiplied: false, factor: 1 }

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
    case 'charging': {
      const cap = action.monthlyCap
      if (cap !== undefined && (input.chargingThisMonth ?? 0) >= cap) {
        return none(ENGINE_COPY.notice.chargingCap(cap))
      }
      return base
    }
    case 'session':
    case 'event':
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
  }
}
