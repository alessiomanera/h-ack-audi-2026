// Deterministic fictional demo data. Every statement is INSERT OR IGNORE with fixed ids,
// so concurrent auto-seeds are harmless. Dates are relative to `now`.
import type { ActionType, PersonaId, Role } from '../src/shared/types'
import type { LedgerMeta } from '../src/features/audi-with-you/engine'
import { hashPin } from './crypto'

export const DEMO_PIN = '1234'

export const PERSONAS: { id: PersonaId; userId: string; role: Role }[] = [
  { id: 'luca', userId: 'u_luca', role: 'secondary' },
  { id: 'giulia', userId: 'u_giulia', role: 'key' },
  { id: 'paolo', userId: 'u_paolo', role: 'key' },
]

const DAY_MS = 86_400_000

interface SeedUser {
  id: string
  email: string
  name: string
  birthYear: number
  persona: PersonaId
  daysAgo: number
}

const USERS: SeedUser[] = [
  { id: 'u_paolo', email: 'paolo.bianchi@example.com', name: 'Paolo Bianchi', birthYear: 1974, persona: 'paolo', daysAgo: 200 },
  { id: 'u_luca', email: 'luca.bianchi@example.com', name: 'Luca Bianchi', birthYear: 2005, persona: 'luca', daysAgo: 120 },
  { id: 'u_giulia', email: 'giulia.ferri@example.com', name: 'Giulia Ferri', birthYear: 1997, persona: 'giulia', daysAgo: 210 },
]

const VEHICLES = [
  { id: 'v_bianchi_a3', model: 'A3', year: 2021, daysAgo: 200 },
  { id: 'v_ferri_q3', model: 'Q3', year: 2025, daysAgo: 210 },
]

const MEMBERSHIPS: { userId: string; vehicleId: string; role: Role; daysAgo: number }[] = [
  { userId: 'u_paolo', vehicleId: 'v_bianchi_a3', role: 'key', daysAgo: 200 },
  { userId: 'u_luca', vehicleId: 'v_bianchi_a3', role: 'secondary', daysAgo: 120 },
  { userId: 'u_giulia', vehicleId: 'v_ferri_q3', role: 'key', daysAgo: 210 },
]

type SeedLedger = [id: string, userId: string, action: ActionType, points: number, daysAgo: number, meta: LedgerMeta]

const tagliandoA3: LedgerMeta = { serviceKind: 'tagliando', vehicleModel: 'A3', multiplied: true, factor: 2 }
const charging = (userId: string, prefix: string, days: number[]): SeedLedger[] =>
  days.map((d, i) => [`l_${prefix}_charging_${i + 1}`, userId, 'charging', 5, d, {}])

const LEDGER: SeedLedger[] = [
  // Paolo Bianchi: 100 + 100 + 400 = 600 (quattro Circle). Demo: Permuta +1000 -> 1600 (S line Club).
  ['l_paolo_join', 'u_paolo', 'join', 100, 200, {}],
  ['l_paolo_invite_luca', 'u_paolo', 'invite', 100, 120, { side: 'inviter', name: 'Luca Bianchi', inviteeId: 'u_luca' }],
  ['l_paolo_service_1', 'u_paolo', 'service', 400, 60, tagliandoA3],
  // Luca Bianchi: 100 + 100 + 100 + 4 x 5 = 320 (Icon Circle). Demo: Tagliando x2 +400 -> 720 (quattro Circle).
  ['l_luca_join', 'u_luca', 'join', 100, 120, {}],
  ['l_luca_invite', 'u_luca', 'invite', 100, 120, { side: 'invitee', name: 'Paolo Bianchi', inviterId: 'u_paolo' }],
  ['l_luca_event_1', 'u_luca', 'event', 100, 45, { eventName: 'Audi Night in concessionaria' }],
  ...charging('u_luca', 'luca', [40, 25, 12, 3]),
  // Giulia Ferri: join 100 + sessions 300 + events 300 + services 400 + charging 10 x 5 + accessory 100
  // + merch 2 x 50 = 1350 (quattro Circle). Demo: Accessorio +100 -> 1450, Evento +100 -> 1550 (S line Club).
  // No merch entry within the last 35 days, so the monthly merch cap never bites in the demo.
  ['l_giulia_join', 'u_giulia', 'join', 100, 210, {}],
  ['l_giulia_session_1', 'u_giulia', 'session', 150, 190, { sessionKind: 'dealer' }],
  ['l_giulia_event_1', 'u_giulia', 'event', 100, 180, { eventName: 'Audi alla Milano Design Week' }],
  ['l_giulia_service_1', 'u_giulia', 'service', 200, 150, { serviceKind: 'tagliando', vehicleModel: 'Q3', multiplied: false, factor: 1 }],
  ['l_giulia_event_2', 'u_giulia', 'event', 100, 120, { eventName: 'Presentazione nuova Audi A5' }],
  ['l_giulia_service_2', 'u_giulia', 'service', 200, 100, { serviceKind: 'gomme', vehicleModel: 'Q3', multiplied: false, factor: 1 }],
  ['l_giulia_session_2', 'u_giulia', 'session', 150, 80, { sessionKind: 'driving_experience' }],
  ['l_giulia_event_3', 'u_giulia', 'event', 100, 60, { eventName: 'Audi hub di Cortina' }],
  ['l_giulia_merch_1', 'u_giulia', 'merch', 50, 70, { itemName: 'Zaino da viaggio' }],
  ['l_giulia_merch_2', 'u_giulia', 'merch', 50, 50, { itemName: 'Cappellino' }],
  ['l_giulia_accessory_1', 'u_giulia', 'accessory', 100, 40, { itemName: 'Barre portatutto' }],
  ...charging('u_giulia', 'giulia', [170, 150, 130, 110, 90, 70, 50, 30, 15, 5]),
]

function seedStatements(db: D1Database, now: Date, pinHash: string): D1PreparedStatement[] {
  const at = (daysAgo: number) => new Date(now.getTime() - daysAgo * DAY_MS).toISOString()
  const stmts: D1PreparedStatement[] = []
  for (const u of USERS) {
    stmts.push(
      db
        .prepare(
          'INSERT OR IGNORE INTO users (id, email, name, pin_hash, birth_year, persona_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
        )
        .bind(u.id, u.email, u.name, pinHash, u.birthYear, u.persona, at(u.daysAgo)),
    )
  }
  for (const v of VEHICLES) {
    stmts.push(
      db
        .prepare('INSERT OR IGNORE INTO vehicles (id, model, year, created_at) VALUES (?, ?, ?, ?)')
        .bind(v.id, v.model, v.year, at(v.daysAgo)),
    )
  }
  for (const m of MEMBERSHIPS) {
    stmts.push(
      db
        .prepare('INSERT OR IGNORE INTO memberships (user_id, vehicle_id, role, created_at) VALUES (?, ?, ?, ?)')
        .bind(m.userId, m.vehicleId, m.role, at(m.daysAgo)),
    )
  }
  stmts.push(
    db
      .prepare(
        "INSERT OR IGNORE INTO invites (code, vehicle_id, inviter_id, email, status, invitee_id, created_at) VALUES (?, ?, ?, ?, 'accepted', ?, ?)",
      )
      .bind('FAMA3L', 'v_bianchi_a3', 'u_paolo', 'luca.bianchi@example.com', 'u_luca', at(121)),
  )
  for (const [id, userId, action, points, daysAgo, meta] of LEDGER) {
    stmts.push(
      db
        .prepare('INSERT OR IGNORE INTO ledger (id, user_id, action, points, meta, created_at) VALUES (?, ?, ?, ?, ?, ?)')
        .bind(id, userId, action, points, JSON.stringify(meta), at(daysAgo)),
    )
  }
  return stmts
}

/** Inserts the demo personas. One PBKDF2 hash of the public demo PIN is shared by all three. */
export async function seedDemo(db: D1Database, now: Date): Promise<void> {
  const pinHash = await hashPin(DEMO_PIN)
  await db.batch(seedStatements(db, now, pinHash))
}

/** Seeds only when the database has no users yet (fresh deploy after migrations). */
export async function ensureSeeded(db: D1Database, now: Date): Promise<void> {
  const any = await db.prepare('SELECT 1 AS hit FROM users LIMIT 1').first<{ hit: number }>()
  if (!any) await seedDemo(db, now)
}

/** Deletes every row and re-seeds, in one transaction. */
export async function resetDemo(db: D1Database, now: Date): Promise<void> {
  const pinHash = await hashPin(DEMO_PIN)
  const wipe = ['ledger', 'invites', 'sessions', 'memberships', 'vehicles', 'users'].map((t) =>
    db.prepare(`DELETE FROM ${t}`),
  )
  await db.batch([...wipe, ...seedStatements(db, now, pinHash)])
}
