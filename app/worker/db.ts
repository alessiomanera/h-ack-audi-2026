// D1 row types, small query helpers and the MeResponse builder.
import type {
  ActionType,
  Household,
  HouseholdMember,
  Invite,
  InviteStatus,
  LedgerEntry,
  MeResponse,
  PublicUser,
  Role,
} from '../src/shared/types'
import { program } from '../src/features/audi-with-you/program'
import {
  courtesyCarFor,
  ledgerLabel,
  levelForPoints,
  levelProgress,
  vehicleAgeYears,
  type LedgerMeta,
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
  points: number
}

interface InviteRow {
  code: string
  email: string
  status: InviteStatus
  created_at: string
  inviter_name: string
  model: string
}

const ACTION_TYPES: readonly ActionType[] = ['join', 'invite', 'service', 'session', 'event', 'charging']

function isActionType(v: string): v is ActionType {
  return (ACTION_TYPES as readonly string[]).includes(v)
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

export async function userPoints(db: D1Database, userId: string): Promise<number> {
  const row = await db
    .prepare('SELECT COALESCE(SUM(points), 0) AS total FROM ledger WHERE user_id = ?')
    .bind(userId)
    .first<{ total: number }>()
  return row?.total ?? 0
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
      `SELECT u.id, u.name, m.role, COALESCE(SUM(l.points), 0) AS points
         FROM memberships m
         JOIN users u ON u.id = m.user_id
         LEFT JOIN ledger l ON l.user_id = u.id
        WHERE m.vehicle_id = ?
        GROUP BY u.id, u.name, m.role, m.created_at
        ORDER BY CASE m.role WHEN 'key' THEN 0 ELSE 1 END, m.created_at`,
    )
    .bind(m.id)
    .all<MemberRow>()
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
  const [members, invites] = await Promise.all([membersQuery, invitesQuery])

  const memberList: HouseholdMember[] = members.results.map((r) => ({
    userId: r.id,
    name: r.name,
    role: r.role,
    points: r.points,
    level: levelForPoints(program, r.points),
    isMe: r.id === me.id,
  }))
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

export async function buildMe(db: D1Database, user: UserRow, now: Date): Promise<MeResponse> {
  const [memberships, points, ledgerRows] = await Promise.all([
    membershipsFor(db, user.id),
    userPoints(db, user.id),
    db
      .prepare(
        'SELECT id, action, points, meta, created_at FROM ledger WHERE user_id = ? ORDER BY created_at DESC, rowid DESC LIMIT ?',
      )
      .bind(user.id, LEDGER_LIMIT)
      .all<LedgerRow>(),
  ])
  const households = await Promise.all(memberships.map((m) => buildHousehold(db, user, m, now)))
  const level = levelProgress(program, points)
  const primary = households[0]
  return {
    user: toPublicUser(user),
    level,
    households,
    ledger: ledgerRows.results.map(toLedgerEntry).filter((e): e is LedgerEntry => e !== null),
    courtesyCar: primary ? courtesyCarFor(program, level.current, primary.vehicle.model) : null,
  }
}
