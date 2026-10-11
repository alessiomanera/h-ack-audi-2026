// D1 row types, small query helpers and the MeResponse builder.
import type {
  ActionType,
  Household,
  HouseholdMember,
  Invite,
  InviteStatus,
  LedgerEntry,
  LevelProgress,
  MeResponse,
  PublicUser,
  RewardBooking,
  Role,
} from '../src/shared/types'
import { program } from '../src/features/audi-with-you/program'
import {
  courtesyCarFor,
  deliveryOf,
  findReward,
  ledgerLabel,
  levelForPoints,
  levelProgress,
  summarizeLedger,
  vehicleAgeYears,
  type LedgerMeta,
  type PointsRow,
} from '../src/features/audi-with-you/engine'

export const MAX_SECONDARY = 5
const LEDGER_LIMIT = 50

export interface UserRow {
  id: string
  email: string
  name: string
  pin_hash: string | null
  birth_year: number | null
  persona_id: string | null
  created_at: string
}

export interface VehicleRow {
  id: string
  model: string
  year: number
}

export interface MembershipRow extends VehicleRow {
  role: Role
}

interface LedgerRow {
  id: string
  action: string
  points: number
  meta: string
  created_at: string
}

interface MemberRow {
  id: string
  name: string
  role: Role
}

interface MemberPointsRow {
  user_id: string
  action: string
  points: number
  created_at: string
}

interface BookingRow {
  id: string
  reward_id: string
  level_id: string
  choices: string
  code: string
  tickets: number
  created_at: string
}

interface InviteRow {
  code: string
  email: string
  status: InviteStatus
  created_at: string
  inviter_name: string
  model: string
}

// A Record keyed by ActionType: adding a new action without listing it here fails typecheck,
// so ledger rows are never silently dropped by toLedgerEntry.
const ACTION_TYPES: Record<ActionType, true> = {
  join: true,
  invite: true,
  service: true,
  accessory: true,
  merch: true,
  trade_in: true,
  session: true,
  event: true,
  charging: true,
  first_audi: true,
  anniversary: true,
}

function isActionType(v: string): v is ActionType {
  return Object.hasOwn(ACTION_TYPES, v)
}

export function parseMeta(raw: string): LedgerMeta {
  const out: LedgerMeta = {}
  try {
    const parsed: unknown = JSON.parse(raw)
    if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
      for (const [k, v] of Object.entries(parsed)) {
        if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') out[k] = v
      }
    }
  } catch {
    // corrupted meta: show the entry without it
  }
  return out
}

export function toPublicUser(u: UserRow): PublicUser {
  return { id: u.id, email: u.email, name: u.name, birthYear: u.birth_year, createdAt: u.created_at }
}

export function toLedgerEntry(row: LedgerRow): LedgerEntry | null {
  if (!isActionType(row.action)) return null
  const meta = parseMeta(row.meta)
  return {
    id: row.id,
    action: row.action,
    points: row.points,
    label: ledgerLabel(program, row.action, meta),
    meta,
    createdAt: row.created_at,
  }
}

// ---------- Queries ----------

export function getUserById(db: D1Database, id: string): Promise<UserRow | null> {
  return db.prepare('SELECT * FROM users WHERE id = ?').bind(id).first<UserRow>()
}

export function getUserByEmail(db: D1Database, email: string): Promise<UserRow | null> {
  return db.prepare('SELECT * FROM users WHERE email = ?').bind(email).first<UserRow>()
}

/** Every ledger row of a user, reduced to what the engine needs (a few dozen rows per user). */
async function pointsRowsFor(db: D1Database, userId: string): Promise<PointsRow[]> {
  const { results } = await db
    .prepare('SELECT action, points, created_at FROM ledger WHERE user_id = ?')
    .bind(userId)
    .all<{ action: string; points: number; created_at: string }>()
  return results.map((r) => ({ action: r.action, points: r.points, createdAt: r.created_at }))
}

/**
 * Level of a user: window points (last `program.windowMonths` months), lifetime points,
 * points leaving the window soon and level requirements (RS Vanguard: a recent service).
 */
export async function userStanding(db: D1Database, userId: string, now: Date): Promise<LevelProgress> {
  return levelProgress(program, summarizeLedger(program, await pointsRowsFor(db, userId), now))
}

/** Memberships with their vehicle, key memberships first. */
export async function membershipsFor(db: D1Database, userId: string): Promise<MembershipRow[]> {
  const { results } = await db
    .prepare(
      `SELECT v.id, v.model, v.year, m.role
         FROM memberships m JOIN vehicles v ON v.id = m.vehicle_id
        WHERE m.user_id = ?
        ORDER BY CASE m.role WHEN 'key' THEN 0 ELSE 1 END, m.created_at`,
    )
    .bind(userId)
    .all<MembershipRow>()
  return results
}

/** People on the user's account: members of their primary household (key user first), at least 1. */
export async function accountSize(db: D1Database, userId: string): Promise<number> {
  const row = await db
    .prepare(
      `SELECT COUNT(*) AS n FROM memberships
        WHERE vehicle_id = (
          SELECT vehicle_id FROM memberships WHERE user_id = ?
           ORDER BY CASE role WHEN 'key' THEN 0 ELSE 1 END, created_at LIMIT 1
        )`,
    )
    .bind(userId)
    .first<{ n: number }>()
  return Math.max(1, row?.n ?? 1)
}

export async function secondaryCount(db: D1Database, vehicleId: string): Promise<number> {
  const row = await db
    .prepare("SELECT COUNT(*) AS n FROM memberships WHERE vehicle_id = ? AND role = 'secondary'")
    .bind(vehicleId)
    .first<{ n: number }>()
  return row?.n ?? 0
}

export async function hasLedgerEntry(
  db: D1Database,
  userId: string,
  action: ActionType,
  metaKey?: string,
  metaValue?: string,
): Promise<boolean> {
  const stmt =
    metaKey && metaValue !== undefined
      ? db
          .prepare('SELECT 1 AS hit FROM ledger WHERE user_id = ? AND action = ? AND json_extract(meta, ?) = ? LIMIT 1')
          .bind(userId, action, `$.${metaKey}`, metaValue)
      : db.prepare('SELECT 1 AS hit FROM ledger WHERE user_id = ? AND action = ? LIMIT 1').bind(userId, action)
  return (await stmt.first<{ hit: number }>()) !== null
}

export interface NewLedgerRow {
  id: string
  userId: string
  action: ActionType
  points: number
  meta: LedgerMeta
  createdAt: string
}

export function insertLedger(db: D1Database, row: NewLedgerRow): D1PreparedStatement {
  return db
    .prepare('INSERT INTO ledger (id, user_id, action, points, meta, created_at) VALUES (?, ?, ?, ?, ?, ?)')
    .bind(row.id, row.userId, row.action, row.points, JSON.stringify(row.meta), row.createdAt)
}

export function ledgerEntryFromNew(row: NewLedgerRow): LedgerEntry {
  return {
    id: row.id,
    action: row.action,
    points: row.points,
    label: ledgerLabel(program, row.action, row.meta),
    meta: row.meta,
    createdAt: row.createdAt,
  }
}

// ---------- MeResponse ----------

async function buildHousehold(db: D1Database, me: UserRow, m: MembershipRow, now: Date): Promise<Household> {
  const membersQuery = db
    .prepare(
      `SELECT u.id, u.name, m.role
         FROM memberships m
         JOIN users u ON u.id = m.user_id
        WHERE m.vehicle_id = ?
        ORDER BY CASE m.role WHEN 'key' THEN 0 ELSE 1 END, m.created_at`,
    )
    .bind(m.id)
    .all<MemberRow>()
  const pointsQuery = db
    .prepare(
      `SELECT l.user_id, l.action, l.points, l.created_at
         FROM ledger l JOIN memberships m ON m.user_id = l.user_id
        WHERE m.vehicle_id = ?`,
    )
    .bind(m.id)
    .all<MemberPointsRow>()
  const invitesQuery =
    m.role === 'key'
      ? db
          .prepare(
            `SELECT i.code, i.email, i.status, i.created_at, u.name AS inviter_name, v.model
               FROM invites i
               JOIN users u ON u.id = i.inviter_id
               JOIN vehicles v ON v.id = i.vehicle_id
              WHERE i.vehicle_id = ? AND i.status = 'pending'
              ORDER BY i.created_at DESC`,
          )
          .bind(m.id)
          .all<InviteRow>()
      : null
  const [members, pointRows, invites] = await Promise.all([membersQuery, pointsQuery, invitesQuery])

  const rowsByUser = new Map<string, PointsRow[]>()
  for (const r of pointRows.results) {
    const list = rowsByUser.get(r.user_id) ?? []
    list.push({ action: r.action, points: r.points, createdAt: r.created_at })
    rowsByUser.set(r.user_id, list)
  }
  const memberList: HouseholdMember[] = members.results.map((r) => {
    const summary = summarizeLedger(program, rowsByUser.get(r.id) ?? [], now)
    return {
      userId: r.id,
      name: r.name,
      role: r.role,
      points: summary.points,
      level: levelForPoints(program, summary.points, summary.satisfied),
      isMe: r.id === me.id,
    }
  })
  const pendingInvites: Invite[] = (invites?.results ?? []).map(toInvite)
  return {
    vehicle: { id: m.id, model: m.model, year: m.year, ageYears: vehicleAgeYears(m.year, now) },
    myRole: m.role,
    members: memberList,
    secondarySlots: { used: memberList.filter((x) => x.role === 'secondary').length, max: MAX_SECONDARY },
    pendingInvites,
  }
}

export function toInvite(r: InviteRow): Invite {
  return {
    code: r.code,
    email: r.email,
    status: r.status,
    inviterName: r.inviter_name,
    vehicleModel: r.model,
    createdAt: r.created_at,
  }
}

/** Option id -> chosen value; anything that is not a string is dropped. */
export function parseChoices(raw: string): Record<string, string> {
  const out: Record<string, string> = {}
  for (const [k, v] of Object.entries(parseMeta(raw))) if (typeof v === 'string') out[k] = v
  return out
}

export function toBooking(row: BookingRow): RewardBooking {
  const reward = findReward(program, row.reward_id)?.reward
  return {
    id: row.id,
    rewardId: row.reward_id,
    rewardTitle: reward?.title ?? row.reward_id,
    levelId: row.level_id,
    choices: parseChoices(row.choices),
    code: row.code,
    tickets: row.tickets ?? 1,
    delivery: deliveryOf(reward?.claim),
    createdAt: row.created_at,
  }
}

export async function bookingsFor(db: D1Database, userId: string): Promise<RewardBooking[]> {
  const { results } = await db
    .prepare(
      'SELECT id, reward_id, level_id, choices, code, tickets, created_at FROM bookings WHERE user_id = ? ORDER BY created_at DESC, rowid DESC',
    )
    .bind(userId)
    .all<BookingRow>()
  return results.map(toBooking)
}

export async function buildMe(db: D1Database, user: UserRow, now: Date): Promise<MeResponse> {
  const [memberships, level, ledgerRows, bookings] = await Promise.all([
    membershipsFor(db, user.id),
    userStanding(db, user.id, now),
    db
      .prepare(
        'SELECT id, action, points, meta, created_at FROM ledger WHERE user_id = ? ORDER BY created_at DESC, rowid DESC LIMIT ?',
      )
      .bind(user.id, LEDGER_LIMIT)
      .all<LedgerRow>(),
    bookingsFor(db, user.id),
  ])
  const households = await Promise.all(memberships.map((m) => buildHousehold(db, user, m, now)))
  const primary = households[0]
  return {
    user: toPublicUser(user),
    level,
    households,
    ledger: ledgerRows.results.map(toLedgerEntry).filter((e): e is LedgerEntry => e !== null),
    courtesyCar: primary ? courtesyCarFor(program, level.current, primary.vehicle.model) : null,
    bookings,
  }
}
