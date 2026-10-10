// API contract shared by the Worker (app/worker) and the UI (app/src).
// Change it only together with both sides.

// ---------- Program (shape of features/audi-with-you/program.it.json) ----------

/** A level id from program.it.json. Level order is `program.levels` sorted by threshold; code never hardcodes an id. */
export type LevelId = string

/** Ledger action types. `join` and `invite` are granted by the system, the rest come from Audi data. */
export type ActionType =
  | 'join'
  | 'invite'
  | 'service'
  | 'accessory'
  | 'merch'
  | 'trade_in'
  | 'session'
  | 'event'
  | 'charging'
  /** An invited secondary driver becomes key user of their first Audi: points to them and to the inviter. */
  | 'first_audi'
  /** One year in the program with at least one visit to the official network. */
  | 'anniversary'

/** Actions the demo panel can simulate through POST /api/actions. */
export type SimulatedActionType = Exclude<ActionType, 'join'>

export type ServiceKind = 'tagliando' | 'gomme' | 'check_invernale'
export type SessionKind = 'dealer' | 'driving_experience'

export interface ProgramAction {
  type: ActionType
  title: string
  description: string
  points: number
  enabled: boolean
  /** Granted at most once per user (join) or once per invitee (invite). */
  once?: boolean
  /** invite: points go to both inviter and invitee. */
  bothSides?: boolean
  /** service: points multiplied when the vehicle is older than `olderThanYears`. */
  multiplier?: { olderThanYears: number; factor: number; label: string }
  /** Points per kind, overriding `points` (service: tagliando 300, gomme 100; session: dealer 150, driving 250). */
  pointsByKind?: Record<string, number>
  /** Any action (merch, charging): maximum number of rewarded occurrences per calendar month. */
  monthlyCap?: number
  /** Any action (event): maximum number of rewarded occurrences per calendar year. */
  yearlyCap?: number
  /** first_audi: points also granted to the user who invited them. */
  inviterPoints?: number
  /** trade_in: granted at most once per vehicle. */
  oncePerVehicle?: boolean
  examples?: string[]
}

export type RewardKind =
  | 'service'
  | 'experience'
  | 'recognition'
  | 'partner'
  | 'courtesy_car'
  | 'access'
  /** Object given once on reaching the level (portachiavi, borraccia...). Never redeemed with points. */
  | 'welcome_kit'
  | 'design'

export interface ProgramReward {
  id: string
  title: string
  description: string
  kind: RewardKind
  /** Shown highlighted in the levels table (courtesy car row). */
  highlight?: boolean
  /** Limited seats: assigned by early access per level, never by draw or ranking. */
  limited?: boolean
  /** Free-text status label, e.g. "da negoziare". */
  note?: string
  /** Bonus reward shown as a highlighted card (chalk, never lava), e.g. the custom wrap. */
  bonus?: boolean
  /** Public image path, e.g. "/rewards/wrap-demo.jpg". The UI hides it when the file is missing. */
  image?: string
  /** Booking flow. Booking never spends points. Absent: the reward is shown, not booked. */
  claim?: RewardClaimConfig
}

export interface RewardClaimOption {
  /** Key stored in the booking, e.g. "hub", "data", "concessionaria". */
  id: string
  /** Italian label, e.g. "Scegli l'hub". */
  label: string
  choices: string[]
}

/** How a booked reward reaches the user: a QR code shown at the entrance, or home shipping (gadgets). */
export type DeliveryKind = 'qr' | 'shipping'

export interface RewardClaimConfig {
  /** Button label, e.g. "Prenota", "Ricevi a casa". */
  cta: string
  /** Default "qr". "shipping" confirms delivery to the address of the myAudi profile. */
  delivery?: DeliveryKind
  /** Events: the user picks 1 ticket per person on their account (key user plus invited drivers). */
  tickets?: boolean
  /** Choices made in order; every option needs one value. */
  options: RewardClaimOption[]
  /** Limited rewards: seats for each choice of the FIRST option (demo data). */
  seatsPerChoice?: number
  /** Italian text on the confirmation screen. */
  confirmation: string
}

export interface CourtesyCarRule {
  /** Short label, e.g. "Standard", "Un segmento in più". */
  label: string
  description: string
  /** How many segments above the user's own vehicle (0 = same segment). */
  segmentsUp: number
  /** Electric model offered when available. */
  electricWhenAvailable?: boolean
}

export interface LevelRequirement {
  /** Action the user must have in the ledger within `withinMonths`, e.g. service in the last 12 months. */
  action: ActionType
  withinMonths: number
  /** Italian, e.g. "almeno un passaggio in officina ufficiale negli ultimi 12 mesi". */
  label: string
}

export interface ProgramLevel {
  id: LevelId
  name: string
  /** Minimum points earned in the last `program.windowMonths` months to reach the level. */
  threshold: number
  /** Extra condition besides the threshold (RS Vanguard: a service in the last 12 months). */
  requires?: LevelRequirement
  tagline: string
  courtesyCar: CourtesyCarRule
  rewards: ProgramReward[]
}

export interface ProgramExperience {
  id: string
  title: string
  description: string
  /** Lowest level with access (or early access, when `limited`). */
  minLevel: LevelId
  limited: boolean
  /** Place, e.g. "Dolomiti", "Milano". */
  place?: string
  /** Bookable through this level reward (its claim and level). Absent: shown as "Presto prenotabile". */
  rewardId?: string
}

export interface ProgramStep {
  id: string
  title: string
  body: string
}

export interface Program {
  name: string
  claim: string
  version: string
  /** Rolling window: only points earned in the last N months count for the level (36). Points are never spent. */
  windowMonths: number
  steps: ProgramStep[]
  actions: ProgramAction[]
  levels: ProgramLevel[]
  /** Vehicle segments from smallest to largest, used for "one segment up" courtesy cars. */
  segments: { id: string; models: string[] }[]
  experiences: { intro: string; items: ProgramExperience[] }
  /** Regolamento breve: one rule per string. */
  rules: string[]
}

// ---------- Domain ----------

export type Role = 'key' | 'secondary'

export interface PublicUser {
  id: string
  email: string
  name: string
  /** Optional, used only to show "under 35" context in the demo. */
  birthYear: number | null
  createdAt: string
}

export interface Vehicle {
  id: string
  model: string
  year: number
  /** Whole years since `year` (computed server-side). */
  ageYears: number
}

export interface LevelProgress {
  current: LevelId
  next: LevelId | null
  /** Points earned in the rolling window (last `program.windowMonths` months). They set the level. Never spent. */
  points: number
  /** All points ever earned, window or not (shown as history, they do not set the level). */
  lifetimePoints: number
  /** Points leaving the window within `withinDays`, null when none. */
  expiring: { points: number; withinDays: number } | null
  /** Italian label of the unmet requirement of `next` when the threshold is met but the requirement is not, else null. */
  blockedBy: string | null
  /** Points still needed for `next`, null at the top level. */
  pointsToNext: number | null
  /** 0..1 progress from current threshold to next threshold (1 at top level). */
  progress: number
}

export interface HouseholdMember {
  userId: string
  name: string
  role: Role
  points: number
  level: LevelId
  isMe: boolean
}

export type InviteStatus = 'pending' | 'accepted' | 'revoked'

export interface Invite {
  code: string
  email: string
  status: InviteStatus
  inviterName: string
  vehicleModel: string
  createdAt: string
}

export interface Household {
  vehicle: Vehicle
  myRole: Role
  members: HouseholdMember[]
  secondarySlots: { used: number; max: number }
  pendingInvites: Invite[]
}

export interface LedgerEntry {
  id: string
  action: ActionType
  points: number
  /** Italian label built server-side from program.it.json, e.g. "Tagliando in officina Audi". */
  label: string
  meta: Record<string, string | number | boolean>
  createdAt: string
}

export interface CourtesyCarOffer {
  level: LevelId
  rule: CourtesyCarRule
  /** The user's own vehicle model, e.g. "A3". */
  ownModel: string
  /** Suggested courtesy model, e.g. "A4" (same as ownModel at Start). */
  offeredModel: string
}

export interface MeResponse {
  user: PublicUser
  level: LevelProgress
  /** Households the user belongs to (as key or secondary user). The first one is the primary. */
  households: Household[]
  /** Newest first. */
  ledger: LedgerEntry[]
  /** Courtesy car the user gets at their current level with the primary household's vehicle. */
  courtesyCar: CourtesyCarOffer | null
  /** Rewards the user booked, newest first. Booking never spends points. */
  bookings: RewardBooking[]
}

export interface RewardBooking {
  id: string
  rewardId: string
  /** Reward title from program.it.json at booking time. */
  rewardTitle: string
  /** Level that unlocks the reward. */
  levelId: LevelId
  /** Option id -> chosen value. */
  choices: Record<string, string>
  /** Code shown to the user and to the dealer, e.g. "AWY-7K2Q". */
  code: string
  /** People admitted with this booking (1 for gadgets and services). */
  tickets: number
  delivery: DeliveryKind
  createdAt: string
}

// ---------- Requests and responses ----------

export interface ApiError {
  error: string
  /** Italian, safe to show to the user. */
  message: string
}

export interface SignupRequest {
  name: string
  email: string
  /** Exactly 4 digits. */
  pin: string
  /** Join an existing household as secondary user. */
  inviteCode?: string
  /** Register as key user of a new vehicle (when no inviteCode). */
  vehicle?: { model: string; year: number }
}

export interface LoginRequest {
  email: string
  pin: string
}

export type PersonaId = 'paolo' | 'luca' | 'giulia'

export interface Persona {
  id: PersonaId
  name: string
  /** Italian one-liner, e.g. "21 anni, guida la A3 di famiglia". */
  tagline: string
  role: Role
}

export interface PersonaLoginRequest {
  personaId: PersonaId
}

export interface CreateInviteRequest {
  email: string
}

export interface CreateInviteResponse {
  invite: Invite
  /** Relative link to share, e.g. "/?invito=AB12CD". */
  link: string
}

export interface InvitePreview {
  code: string
  inviterName: string
  vehicleModel: string
  status: InviteStatus
}

export interface ActionRequest {
  type: SimulatedActionType
  meta?: {
    serviceKind?: ServiceKind
    sessionKind?: SessionKind
    eventName?: string
    /** invite simulation: name of the fictional family member who joins. */
    inviteeName?: string
    /** accessory / merch: item name for the ledger label, e.g. "Barre portatutto". */
    itemName?: string
  }
}

export interface ActionResult {
  /** Null when nothing was awarded (e.g. monthly cap reached, slots full). */
  entry: LedgerEntry | null
  awarded: number
  /** Italian explanation when nothing or less was awarded. */
  notice: string | null
  /** Set when this action moved the user to a new level. */
  levelUp: LevelId | null
  /** Set for `service`: courtesy car at the (possibly new) level. */
  courtesyCar: CourtesyCarOffer | null
  me: MeResponse
}

export interface BookingRequest {
  rewardId: string
  /** Option id -> chosen value, one per option of the reward's claim config. */
  choices: Record<string, string>
  /** Rewards with `claim.tickets`: 1 to the number of people on the user's account. Default 1. */
  tickets?: number
}

export interface BookingResponse {
  booking: RewardBooking
  /** Seats left for the chosen first option after this booking, null when unlimited. */
  seatsLeft: number | null
  /** Points are unchanged by a booking. */
  me: MeResponse
}

export interface RewardAvailability {
  rewardId: string
  /** Seats left per choice of the first option, null when unlimited. */
  seatsLeft: Record<string, number> | null
  /** The current user already booked this reward. */
  booked: boolean
}

// Endpoints (all JSON, session in an HttpOnly cookie named `awy_session`):
// POST /api/auth/signup        SignupRequest        -> MeResponse
// POST /api/auth/login         LoginRequest         -> MeResponse
// POST /api/auth/persona       PersonaLoginRequest  -> MeResponse   (seeded demo personas only)
// POST /api/auth/logout                             -> { ok: true }
// GET  /api/me                                      -> MeResponse   (401 ApiError when anonymous)
// GET  /api/program                                 -> Program
// GET  /api/personas                                -> Persona[]
// POST /api/invites            CreateInviteRequest  -> CreateInviteResponse
// GET  /api/invites/:code                           -> InvitePreview
// POST /api/invites/:code/accept                    -> MeResponse
// POST /api/actions            ActionRequest        -> ActionResult
// POST /api/demo/reset                              -> { ok: true }  (re-seeds the demo data)
// POST /api/bookings           BookingRequest       -> BookingResponse  (403 level not reached, 409 already booked or sold out, 400 bad choice or tickets)
// GET  /api/rewards/:id/availability                -> RewardAvailability
