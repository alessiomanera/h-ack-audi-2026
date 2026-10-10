// Points engine: pure, deterministic functions shared by the Worker and the UI.
// No I/O. Every number comes from program.it.json; pass `now` in explicitly.
// Points are never spent: they only accumulate, and only those earned in the last
// `program.windowMonths` months count for the level.
import type {
  ActionType,
  CourtesyCarOffer,
  LevelId,
  LevelProgress,
  LevelRequirement,
  Program,
  ProgramAction,
  ProgramLevel,
  ProgramReward,
  RewardClaimConfig,
  Role,
  ServiceKind,
  SessionKind,
} from '../../shared/types'
import { getAction, getLevel, isLevelReached, levelsInOrder } from './program'

/** Points earned in the first `EXPIRING_WITHIN_DAYS` days of the window leave it within that many days. */
export const EXPIRING_WITHIN_DAYS = 90

const DAY_MS = 86_400_000

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
  charging: 'Ricariche Audi del mese',
  accessory: (itemName: string | null) =>
    itemName ? `Accessorio originale Audi: ${itemName}` : 'Accessorio originale Audi',
  merch: (itemName: string | null) => (itemName ? `Audi Collection: ${itemName}` : 'Audi Collection'),
  tradeIn: (vehicleModel: string | null) =>
    vehicleModel ? `Permuta della tua ${vehicleModel} per una nuova Audi` : 'Permuta per una nuova Audi',
  firstAudi: 'La tua prima Audi',
  firstAudiInviter: (name: string) => `${name} ha preso la sua prima Audi`,
  firstAudiInviterGeneric: 'Un familiare ha preso la sua prima Audi',
  anniversary: (programName: string) => `Un anno in ${programName}`,
  notice: {
    disabled: 'Questa azione non è attiva nel programma in questo momento.',
    alreadyJoined: 'Hai già ricevuto i punti di benvenuto.',
    alreadyInvited: 'I punti per questo invito sono già stati assegnati.',
    chargingCap: 'Hai già ricevuto i punti ricarica di questo mese. Il conteggio riparte il mese prossimo.',
    merchCap: (cap: number) =>
      `Hai già ${cap} acquisti Audi Collection premiati questo mese. Il conteggio riparte il mese prossimo.`,
    monthlyCap: (cap: number) =>
      `Questa attività è già stata premiata ${cap} volte questo mese. Il conteggio riparte il mese prossimo.`,
    monthlyOnce: 'Questa attività è già stata premiata questo mese. Il conteggio riparte il mese prossimo.',
    eventCap: (cap: number) => `Hai già ${cap} eventi premiati quest'anno.`,
    yearlyOnce: "Questa attività è già stata premiata quest'anno.",
    yearlyCap: (cap: number) => `Questa attività è già stata premiata ${cap} volte quest'anno.`,
    alreadyTradedIn: 'Hai già ricevuto i punti per la permuta di questa Audi.',
    firstAudiSecondaryOnly:
      "I punti prima Audi sono per chi guida l'Audi di famiglia come utente secondario e ora ne prende una sua.",
    alreadyFirstAudi: 'Hai già ricevuto i punti per la tua prima Audi.',
    anniversaryDone: 'Questo anniversario è già stato festeggiato: ci vediamo al prossimo.',
  },
  booking: {
    rewardUnknown: 'Premio non trovato.',
    notBookable: 'Questo premio non richiede una prenotazione: è già tuo quando raggiungi il livello.',
    levelNotReached: (levelName: string) => `Si sblocca a ${levelName}: continua a prenderti cura della tua Audi.`,
    alreadyBooked: 'Hai già prenotato questo premio.',
    choiceMissing: (label: string) => `Manca un passaggio: ${lowerFirst(label)}.`,
    choiceInvalid: (label: string) => `${label}: questa opzione non è disponibile, scegline una tra quelle proposte.`,
    soldOut: "Posti esauriti per questa data: scegline un'altra.",
  },
} as const

function lowerFirst(s: string): string {
  return s.charAt(0).toLowerCase() + s.slice(1)
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

/** First instant of the calendar year of `now` (UTC). */
export function yearStartUtc(now: Date): Date {
  return new Date(Date.UTC(now.getUTCFullYear(), 0, 1))
}

/**
 * The same instant `months` calendar months before `now` (UTC), with the day clamped to the
 * target month (31 March minus 1 month is 28 or 29 February). Entries at or after it are in the window.
 */
export function windowStart(now: Date, months: number): Date {
  const total = now.getUTCFullYear() * 12 + now.getUTCMonth() - months
  const year = Math.floor(total / 12)
  const month = total - year * 12
  const lastDay = new Date(Date.UTC(year, month + 1, 0)).getUTCDate()
  return new Date(
    Date.UTC(
      year,
      month,
      Math.min(now.getUTCDate(), lastDay),
      now.getUTCHours(),
      now.getUTCMinutes(),
      now.getUTCSeconds(),
      now.getUTCMilliseconds(),
    ),
  )
}

/** Entries created in [from, to) leave the window within `EXPIRING_WITHIN_DAYS` days. */
export function expiringRange(now: Date, months: number): { from: Date; to: Date } {
  const from = windowStart(now, months)
  return { from, to: new Date(from.getTime() + EXPIRING_WITHIN_DAYS * DAY_MS) }
}

// ---------- Window and requirements ----------

/** The part of a ledger row the engine needs. */
export interface PointsRow {
  action: string
  points: number
  /** ISO 8601. */
  createdAt: string
}

export type RequirementCheck = (req: LevelRequirement) => boolean

export interface PointsSummary {
  /** Points in the window: they set the level. */
  points: number
  lifetimePoints: number
  expiring: { points: number; withinDays: number } | null
  satisfied: RequirementCheck
}

function at(iso: string): number {
  const t = Date.parse(iso)
  return Number.isNaN(t) ? 0 : t
}

/** True when `rows` contain `req.action` in the last `req.withinMonths` months. */
export function requirementMet(rows: readonly PointsRow[], req: LevelRequirement, now: Date): boolean {
  const from = windowStart(now, req.withinMonths).getTime()
  const to = now.getTime()
  return rows.some((r) => r.action === req.action && at(r.createdAt) >= from && at(r.createdAt) <= to)
}

/** Window points, lifetime points, expiring points and a requirement check from a user's ledger. */
export function summarizeLedger(program: Program, rows: readonly PointsRow[], now: Date): PointsSummary {
  const nowMs = now.getTime()
  const from = windowStart(now, program.windowMonths).getTime()
  const expiringTo = from + EXPIRING_WITHIN_DAYS * DAY_MS
  let points = 0
  let lifetimePoints = 0
  let expiring = 0
  for (const r of rows) {
    const t = at(r.createdAt)
    if (t > nowMs) continue
    lifetimePoints += r.points
    if (t >= from) {
      points += r.points
      if (t < expiringTo && r.points > 0) expiring += r.points
    }
  }
  return {
    points,
    lifetimePoints,
    expiring: expiring > 0 ? { points: expiring, withinDays: EXPIRING_WITHIN_DAYS } : null,
    satisfied: (req) => requirementMet(rows, req, now),
  }
}

// ---------- Levels ----------

const never: RequirementCheck = () => false

/**
 * Highest level whose threshold is met by the window points and whose requirement (if any) holds.
 * Levels are cumulative: an unmet requirement stops the climb there.
 */
export function levelForPoints(program: Program, points: number, satisfied: RequirementCheck = never): LevelId {
  const levels = levelsInOrder(program)
  let current = levels[0]
  for (const level of levels) {
    if (points < level.threshold) break
    if (level !== levels[0] && level.requires && !satisfied(level.requires)) break
    current = level
  }
  return current.id
}

export interface LevelInput {
  /** Window points. */
  points: number
  /** Defaults to `points`. */
  lifetimePoints?: number
  expiring?: { points: number; withinDays: number } | null
  /** Defaults to "no requirement is met". */
  satisfied?: RequirementCheck
}

export function levelProgress(program: Program, input: LevelInput): LevelProgress {
  const { points } = input
  const satisfied = input.satisfied ?? never
  const levels = levelsInOrder(program)
  const currentId = levelForPoints(program, points, satisfied)
  const index = levels.findIndex((l) => l.id === currentId)
  const current = levels[index]
  const next: ProgramLevel | undefined = levels[index + 1]
  const base = {
    current: currentId,
    points,
    lifetimePoints: input.lifetimePoints ?? points,
    expiring: input.expiring ?? null,
  }
  if (!next) return { ...base, next: null, blockedBy: null, pointsToNext: null, progress: 1 }
  const blockedBy = next.requires && points >= next.threshold && !satisfied(next.requires) ? next.requires.label : null
  const span = next.threshold - current.threshold
  const raw = span > 0 ? (points - current.threshold) / span : 1
  return {
    ...base,
    next: next.id,
    blockedBy,
    pointsToNext: Math.max(0, next.threshold - points),
    progress: Math.min(1, Math.max(0, raw)),
  }
}

// ---------- Awards ----------

/** Points of an action for a kind (service: tagliando, gomme...; session: dealer...), before multipliers. */
export function pointsFor(action: ProgramAction, kind?: string | null): number {
  const byKind = action.pointsByKind
  if (kind && byKind && Object.hasOwn(byKind, kind)) return byKind[kind]
  return action.points
}

export interface AwardInput {
  type: ActionType
  now: Date
  /** service: tagliando, gomme, check_invernale; session: dealer, driving_experience. */
  kind?: string
  /** service: model year of the vehicle serviced. */
  vehicleYear?: number
  /** join: the user already received the welcome points. */
  alreadyJoined?: boolean
  /** invite: points for this inviter/invitee pair were already granted. */
  alreadyAwardedForInvitee?: boolean
  /** Actions with `monthlyCap`: rewarded entries of THIS action type in the current calendar month. */
  thisMonth?: number
  /** Actions with `yearlyCap` (and anniversary): rewarded entries of THIS action type in the current calendar year. */
  thisYear?: number
  /** trade_in: points were already granted for a trade-in of this vehicle (by anyone). */
  alreadyTradedIn?: boolean
  /** first_audi: the user's roles across households ('secondary' only means "not yet key user of an Audi"). */
  roles?: readonly Role[]
  /** first_audi: the user already received the first-Audi points. */
  alreadyHadFirstAudi?: boolean
}

export interface Award {
  points: number
  /** Italian explanation when nothing was awarded. */
  notice: string | null
  /** service: the age multiplier was applied. */
  multiplied: boolean
  factor: number
  /** first_audi: points for the key user who invited them (0 otherwise). */
  inviterPoints: number
}

function none(notice: string): Award {
  return { points: 0, notice, multiplied: false, factor: 1, inviterPoints: 0 }
}

function flat(points: number): Award {
  return { points, notice: null, multiplied: false, factor: 1, inviterPoints: 0 }
}

/** Italian notice for an action that reached its monthly cap. */
function monthlyCapNotice(type: ActionType, cap: number): string {
  if (type === 'charging') return ENGINE_COPY.notice.chargingCap
  if (type === 'merch') return ENGINE_COPY.notice.merchCap(cap)
  return cap === 1 ? ENGINE_COPY.notice.monthlyOnce : ENGINE_COPY.notice.monthlyCap(cap)
}

function yearlyCapNotice(type: ActionType, cap: number): string {
  if (type === 'event') return ENGINE_COPY.notice.eventCap(cap)
  if (type === 'anniversary') return ENGINE_COPY.notice.anniversaryDone
  return cap === 1 ? ENGINE_COPY.notice.yearlyOnce : ENGINE_COPY.notice.yearlyCap(cap)
}

/** Points are flat per action (and kind), never proportional to money spent or kilometres. */
export function computeAward(program: Program, input: AwardInput): Award {
  const action = getAction(program, input.type)
  if (!action.enabled) return none(ENGINE_COPY.notice.disabled)
  const monthly = action.monthlyCap
  if (typeof monthly === 'number' && (input.thisMonth ?? 0) >= monthly) return none(monthlyCapNotice(input.type, monthly))
  const yearly = action.yearlyCap
  if (typeof yearly === 'number' && (input.thisYear ?? 0) >= yearly) return none(yearlyCapNotice(input.type, yearly))

  switch (input.type) {
    case 'join':
      return input.alreadyJoined ? none(ENGINE_COPY.notice.alreadyJoined) : flat(action.points)
    case 'invite':
      return input.alreadyAwardedForInvitee ? none(ENGINE_COPY.notice.alreadyInvited) : flat(action.points)
    case 'service': {
      const points = pointsFor(action, input.kind)
      const m = action.multiplier
      if (m && input.vehicleYear !== undefined && vehicleAgeYears(input.vehicleYear, input.now) > m.olderThanYears) {
        return { points: points * m.factor, notice: null, multiplied: true, factor: m.factor, inviterPoints: 0 }
      }
      return flat(points)
    }
    case 'session':
      return flat(pointsFor(action, input.kind))
    case 'trade_in':
      return action.oncePerVehicle && input.alreadyTradedIn ? none(ENGINE_COPY.notice.alreadyTradedIn) : flat(action.points)
    case 'first_audi': {
      const roles = input.roles ?? []
      if (!roles.includes('secondary') || roles.includes('key')) return none(ENGINE_COPY.notice.firstAudiSecondaryOnly)
      if (input.alreadyHadFirstAudi) return none(ENGINE_COPY.notice.alreadyFirstAudi)
      return { ...flat(action.points), inviterPoints: action.inviterPoints ?? 0 }
    }
    case 'anniversary':
      // Granted by the system once per year, even when the program sets no yearlyCap.
      return (input.thisYear ?? 0) >= 1 ? none(ENGINE_COPY.notice.anniversaryDone) : flat(action.points)
    case 'accessory':
    case 'merch':
    case 'event':
    case 'charging':
      return flat(action.points)
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
    const electric = sameFamily.find(isElectric) ?? models.find(isElectric)
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
    case 'first_audi': {
      if (meta.side !== 'inviter') return ENGINE_COPY.firstAudi
      const name = str(meta, 'name')
      return name ? ENGINE_COPY.firstAudiInviter(name) : ENGINE_COPY.firstAudiInviterGeneric
    }
    case 'anniversary':
      return ENGINE_COPY.anniversary(program.name)
  }
}

// ---------- Reward bookings ----------
// Booking a reward never spends points: it only reserves a seat or a pickup.

/** The reward with this id and the level that unlocks it, or null. */
export function findReward(program: Program, rewardId: string): { level: ProgramLevel; reward: ProgramReward } | null {
  for (const level of levelsInOrder(program)) {
    const reward = level.rewards.find((r) => r.id === rewardId)
    if (reward) return { level, reward }
  }
  return null
}

/** Id of the option that limited seats are counted on (the first one), or null. */
export function firstOptionId(claim: RewardClaimConfig): string | null {
  return claim.options[0]?.id ?? null
}

/**
 * Seats left for every choice of the first option, null when the reward is unlimited.
 * `taken` maps a first-option choice to the bookings already made for it.
 */
export function seatsLeftByChoice(claim: RewardClaimConfig, taken: Record<string, number>): Record<string, number> | null {
  const seats = claim.seatsPerChoice
  const first = claim.options[0]
  if (typeof seats !== 'number' || !first) return null
  const out: Record<string, number> = {}
  for (const choice of first.choices) out[choice] = Math.max(0, seats - (taken[choice] ?? 0))
  return out
}

export interface BookingCheckInput {
  /** The user's current level. */
  levelId: LevelId
  rewardId: string
  /** Option id -> chosen value, as sent by the client. */
  choices: Record<string, string>
  /** The user already booked this reward. */
  alreadyBooked: boolean
  /** Bookings of this reward with the same first-option value as `choices`. */
  seatsTakenForFirstChoice: number
}

export type BookingCheck =
  | {
      ok: true
      /** Level that unlocks the reward (not the user's level). */
      levelId: LevelId
      reward: ProgramReward
      claim: RewardClaimConfig
      /** Only the reward's options, in config order. */
      choices: Record<string, string>
      /** Value of the first option, used to count limited seats. */
      firstChoice: string
      /** Seats for this first choice, null when unlimited. */
      seatsPerChoice: number | null
    }
  | { ok: false; status: 400 | 403 | 409; error: string; message: string }

const reject = (status: 400 | 403 | 409, error: string, message: string): BookingCheck => ({
  ok: false,
  status,
  error,
  message,
})

/** Decides whether a booking is allowed. Pure: the caller loads `alreadyBooked` and the seat count. */
export function checkBooking(program: Program, input: BookingCheckInput): BookingCheck {
  const found = findReward(program, input.rewardId)
  if (!found) return reject(400, 'reward_unknown', ENGINE_COPY.booking.rewardUnknown)
  const { level, reward } = found
  const claim = reward.claim
  if (!claim || claim.options.length === 0) return reject(400, 'not_bookable', ENGINE_COPY.booking.notBookable)
  if (!isLevelReached(program, input.levelId, level.id)) {
    return reject(403, 'level_not_reached', ENGINE_COPY.booking.levelNotReached(level.name))
  }
  if (input.alreadyBooked) return reject(409, 'already_booked', ENGINE_COPY.booking.alreadyBooked)

  const choices: Record<string, string> = {}
  for (const option of claim.options) {
    const raw = Object.hasOwn(input.choices, option.id) ? input.choices[option.id] : undefined
    const value = typeof raw === 'string' ? raw.trim() : ''
    if (!value) return reject(400, 'choice_missing', ENGINE_COPY.booking.choiceMissing(option.label))
    if (!option.choices.includes(value)) {
      return reject(400, 'choice_invalid', ENGINE_COPY.booking.choiceInvalid(option.label))
    }
    choices[option.id] = value
  }

  const firstChoice = choices[claim.options[0].id]
  const seats = typeof claim.seatsPerChoice === 'number' ? claim.seatsPerChoice : null
  if (seats !== null && input.seatsTakenForFirstChoice >= seats) {
    return reject(409, 'sold_out', ENGINE_COPY.booking.soldOut)
  }
  return { ok: true, levelId: level.id, reward, claim, choices, firstChoice, seatsPerChoice: seats }
}
