// Deterministic fictional demo data. Every statement is INSERT OR IGNORE with fixed ids,
// so concurrent auto-seeds are harmless. Dates are relative to `now`.
import type { ActionType, PersonaId, Role, ServiceKind } from '../src/shared/types'
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
  { id: 'u_paolo', email: 'paolo.bianchi@example.com', name: 'Paolo Bianchi', birthYear: 1974, persona: 'paolo', daysAgo: 1250 },
  { id: 'u_luca', email: 'luca.bianchi@example.com', name: 'Luca Bianchi', birthYear: 2005, persona: 'luca', daysAgo: 400 },
  { id: 'u_giulia', email: 'giulia.ferri@example.com', name: 'Giulia Ferri', birthYear: 1997, persona: 'giulia', daysAgo: 910 },
]

const VEHICLES = [
  { id: 'v_bianchi_a3', model: 'A3', year: 2021, daysAgo: 1250 },
  { id: 'v_ferri_q3', model: 'Q3', year: 2025, daysAgo: 330 },
]

const MEMBERSHIPS: { userId: string; vehicleId: string; role: Role; daysAgo: number }[] = [
  { userId: 'u_paolo', vehicleId: 'v_bianchi_a3', role: 'key', daysAgo: 1250 },
  { userId: 'u_luca', vehicleId: 'v_bianchi_a3', role: 'secondary', daysAgo: 400 },
  { userId: 'u_giulia', vehicleId: 'v_ferri_q3', role: 'key', daysAgo: 330 },
]

type SeedLedger = [id: string, userId: string, action: ActionType, points: number, daysAgo: number, meta: LedgerMeta]

const service = (kind: ServiceKind, vehicleModel: string, factor: 1 | 2, extra: LedgerMeta = {}): LedgerMeta => ({
  serviceKind: kind,
  vehicleModel,
  multiplied: factor > 1,
  factor,
  ...extra,
})
/** Giulia's history started on her previous Audi: level and history came with her to the Q3. */
const previousA1: LedgerMeta = { vehicleModel: 'A1', previousVehicle: true }

// Window = last 36 months (about 1096 days). Points leaving the window within 90 days were earned
// between about 1096 and 1006 days ago. Service is x2 when the vehicle is older than 2 years.
// Caps respected: merch at most 4 a month, charging once a month, events at most 6 a calendar year.
export const SEED_LEDGER: SeedLedger[] = [
  // Paolo Bianchi (A3 2021, key user). Window 1700 (quattro Circle), lifetime 2100, expiring 150.
  // Outside the window: join 100 + tagliando 300 (A3 two years old, x1) = 400.
  // Expiring soon: gomme 100 (x1) + merch 50 = 150.
  // Rest of the window: 3 anniversaries 600 + tagliando 600 (x2) + invite 100 + gomme 200 (x2) + merch 50 = 1550.
  // Demo: Permuta +1000 -> 2700 (S line Club). Luca's "Prima Audi" gives Paolo +500.
  ['l_paolo_join', 'u_paolo', 'join', 100, 1250, {}],
  ['l_paolo_service_1', 'u_paolo', 'service', 300, 1200, service('tagliando', 'A3', 1)],
  ['l_paolo_service_2', 'u_paolo', 'service', 100, 1050, service('gomme', 'A3', 1)],
  ['l_paolo_merch_1', 'u_paolo', 'merch', 50, 1025, { itemName: 'Ombrello' }],
  ['l_paolo_anniversary_1', 'u_paolo', 'anniversary', 200, 885, {}],
  ['l_paolo_service_3', 'u_paolo', 'service', 600, 700, service('tagliando', 'A3', 2)],
  ['l_paolo_anniversary_2', 'u_paolo', 'anniversary', 200, 520, {}],
  ['l_paolo_invite_luca', 'u_paolo', 'invite', 100, 400, { side: 'inviter', name: 'Luca Bianchi', inviteeId: 'u_luca' }],
  ['l_paolo_service_4', 'u_paolo', 'service', 200, 330, service('gomme', 'A3', 2)],
  ['l_paolo_anniversary_3', 'u_paolo', 'anniversary', 200, 155, {}],
  ['l_paolo_merch_2', 'u_paolo', 'merch', 50, 60, { itemName: 'Cappellino' }],
  // Luca Bianchi (secondary user of the family A3). Window 650 (Icon Circle):
  // join 100 + invite 100 + session 150 + event 100 + anniversary 200.
  // Demo: Tagliando on the A3 (x2) +600 -> 1250 (quattro Circle). Prima Audi +1000.
  ['l_luca_join', 'u_luca', 'join', 100, 400, {}],
  ['l_luca_invite', 'u_luca', 'invite', 100, 400, { side: 'invitee', name: 'Paolo Bianchi', inviterId: 'u_paolo' }],
  ['l_luca_session_1', 'u_luca', 'session', 150, 300, { sessionKind: 'dealer' }],
  ['l_luca_event_1', 'u_luca', 'event', 100, 200, { eventName: 'Audi Night in concessionaria' }],
  ['l_luca_anniversary_1', 'u_luca', 'anniversary', 200, 35, {}],
  // Giulia Ferri (Q3 2025, key user; before it an A1). Window 2350 (quattro Circle), oldest entry about 30 months.
  // A1 years: join 100 + tagliando 600 (x2) + driving experience 250 + gomme 200 (x2) + event 100 + anniversary 200 = 1450.
  // Q3 months: session 150 + 2 events 200 + anniversary 200 + merch 50 + tagliando 300 (x1) = 900.
  // Two events in the last 12 months, so the yearly cap of 6 never bites in the demo.
  // Demo: Accessorio +100 -> 2450, Evento +100 -> 2550 (S line Club), then she books the Dolomiti day.
  ['l_giulia_join', 'u_giulia', 'join', 100, 910, previousA1],
  ['l_giulia_service_1', 'u_giulia', 'service', 600, 880, service('tagliando', 'A1', 2, { previousVehicle: true })],
  ['l_giulia_session_1', 'u_giulia', 'session', 250, 760, { sessionKind: 'driving_experience', ...previousA1 }],
  ['l_giulia_service_2', 'u_giulia', 'service', 200, 700, service('gomme', 'A1', 2, { previousVehicle: true })],
  ['l_giulia_event_1', 'u_giulia', 'event', 100, 547, { eventName: 'Audi alla Milano Design Week', ...previousA1 }],
  ['l_giulia_anniversary_1', 'u_giulia', 'anniversary', 200, 545, previousA1],
  ['l_giulia_session_2', 'u_giulia', 'session', 150, 325, { sessionKind: 'dealer', vehicleModel: 'Q3' }],
  ['l_giulia_event_2', 'u_giulia', 'event', 100, 270, { eventName: "Audi hub di Cortina d'Ampezzo" }],
  ['l_giulia_event_3', 'u_giulia', 'event', 100, 240, { eventName: 'Audi Night in concessionaria' }],
  ['l_giulia_anniversary_2', 'u_giulia', 'anniversary', 200, 180, {}],
  ['l_giulia_merch_1', 'u_giulia', 'merch', 50, 90, { itemName: 'Zaino da viaggio' }],
  ['l_giulia_service_3', 'u_giulia', 'service', 300, 60, service('tagliando', 'Q3', 1)],
]

/** Past bookings. Booking never spends points. */
const BOOKINGS = [
  {
    // Paolo collected his quattro Circle welcome kit at the Treviso dealer.
    id: 'b_paolo_quattro_kit',
    userId: 'u_paolo',
    rewardId: 'quattro-kit',
    levelId: 'quattro-circle',
    choices: { concessionaria: 'Treviso' },
    firstChoice: 'Treviso',
    code: 'AWY-P4OL',
    daysAgo: 50,
  },
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
      .bind('FAMA3L', 'v_bianchi_a3', 'u_paolo', 'luca.bianchi@example.com', 'u_luca', at(401)),
  )
  for (const [id, userId, action, points, daysAgo, meta] of SEED_LEDGER) {
    stmts.push(
      db
        .prepare('INSERT OR IGNORE INTO ledger (id, user_id, action, points, meta, created_at) VALUES (?, ?, ?, ?, ?, ?)')
        .bind(id, userId, action, points, JSON.stringify(meta), at(daysAgo)),
    )
  }
  for (const b of BOOKINGS) {
    stmts.push(
      db
        .prepare(
          'INSERT OR IGNORE INTO bookings (id, user_id, reward_id, level_id, choices, first_choice, code, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        )
        .bind(b.id, b.userId, b.rewardId, b.levelId, JSON.stringify(b.choices), b.firstChoice, b.code, at(b.daysAgo)),
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

/** Deletes every row and re-seeds, in one transaction. Bookings go first: they reference users. */
export async function resetDemo(db: D1Database, now: Date): Promise<void> {
  const pinHash = await hashPin(DEMO_PIN)
  const wipe = ['bookings', 'ledger', 'invites', 'sessions', 'memberships', 'vehicles', 'users'].map((t) =>
    db.prepare(`DELETE FROM ${t}`),
  )
  await db.batch([...wipe, ...seedStatements(db, now, pinHash)])
}
