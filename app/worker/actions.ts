// POST /api/actions: the demo panel simulates Audi events and sees the points engine at work.
// Points are flat per action (and kind), never per euro, and are never spent.
import type { ActionResult, ServiceKind, SessionKind, SimulatedActionType } from '../src/shared/types'
import { program } from '../src/features/audi-with-you/program'
import {
  ENGINE_COPY,
  computeAward,
  courtesyCarFor,
  monthStartUtc,
  yearStartUtc,
  type LedgerMeta,
} from '../src/features/audi-with-you/engine'
import { COPY } from './copy.it'
import { randomCode, randomHex } from './crypto'
import {
  MAX_SECONDARY,
  buildMe,
  hasLedgerEntry,
  insertLedger,
  ledgerEntryFromNew,
  membershipsFor,
  secondaryCount,
  userStanding,
  type MembershipRow,
  type NewLedgerRow,
  type UserRow,
} from './db'
import { HttpError, isRecord, json, readJsonObject, type Ctx } from './http'
import { requireUser } from './session'
import { optionalText } from './validate'

const SIMULATED: readonly SimulatedActionType[] = [
  'invite',
  'service',
  'accessory',
  'merch',
  'trade_in',
  'session',
  'event',
  'charging',
  'first_audi',
  'anniversary',
]
const SERVICE_KINDS: readonly ServiceKind[] = ['tagliando', 'gomme', 'check_invernale']
const SESSION_KINDS: readonly SessionKind[] = ['dealer', 'driving_experience']

function oneOf<T extends string>(list: readonly T[], v: unknown): v is T {
  return typeof v === 'string' && (list as readonly string[]).includes(v)
}

interface Outcome {
  entry: NewLedgerRow | null
  notice: string | null
  /** Extra statements written in the same batch as the entry. */
  extra: D1PreparedStatement[]
}

const skipped = (notice: string | null): Outcome => ({ entry: null, notice, extra: [] })

function newEntry(user: UserRow, now: Date, action: NewLedgerRow['action'], points: number, meta: LedgerMeta): NewLedgerRow {
  return { id: crypto.randomUUID(), userId: user.id, action, points, meta, createdAt: now.toISOString() }
}

/** Rewarded entries of one action type for this user since `from`. */
async function countSince(db: D1Database, userId: string, action: SimulatedActionType, from: Date): Promise<number> {
  const row = await db
    .prepare('SELECT COUNT(*) AS n FROM ledger WHERE user_id = ? AND action = ? AND points > 0 AND created_at >= ?')
    .bind(userId, action, from.toISOString())
    .first<{ n: number }>()
  return row?.n ?? 0
}

/** Rewarded entries this calendar month and this calendar year, for the caps in program.it.json. */
async function capCounts(db: D1Database, userId: string, action: SimulatedActionType, now: Date) {
  const [thisMonth, thisYear] = await Promise.all([
    countSince(db, userId, action, monthStartUtc(now)),
    countSince(db, userId, action, yearStartUtc(now)),
  ])
  return { thisMonth, thisYear }
}

/** True when trade-in points were already granted for this vehicle, to any user. */
async function vehicleTradedIn(db: D1Database, vehicleId: string): Promise<boolean> {
  const row = await db
    .prepare("SELECT 1 AS hit FROM ledger WHERE action = 'trade_in' AND json_extract(meta, '$.vehicleId') = ? LIMIT 1")
    .bind(vehicleId)
    .first<{ hit: number }>()
  return row !== null
}

/** Flat-points purchase (accessory, merch) with an optional item name for the ledger label. */
async function simulatePurchase(
  db: D1Database,
  user: UserRow,
  type: 'accessory' | 'merch',
  meta: Record<string, unknown>,
  now: Date,
): Promise<Outcome> {
  const counts = await capCounts(db, user.id, type, now)
  const award = computeAward(program, { type, now, ...counts })
  if (award.points === 0) return skipped(award.notice)
  const itemName = optionalText(meta.itemName, 60)
  const entryMeta: LedgerMeta = itemName ? { itemName } : {}
  return { entry: newEntry(user, now, type, award.points, entryMeta), notice: null, extra: [] }
}

/** Trade-in of the key user's Audi: once per vehicle. Vehicle and household stay as they are. */
async function simulateTradeIn(db: D1Database, user: UserRow, households: MembershipRow[], now: Date): Promise<Outcome> {
  const household = households.find((h) => h.role === 'key')
  if (!household) return skipped(COPY.notices.tradeInKeyOnly)
  const alreadyTradedIn = await vehicleTradedIn(db, household.id)
  const award = computeAward(program, { type: 'trade_in', now, alreadyTradedIn })
  if (award.points === 0) return skipped(award.notice)
  return {
    entry: newEntry(user, now, 'trade_in', award.points, { vehicleId: household.id, vehicleModel: household.model }),
    notice: null,
    extra: [],
  }
}

/**
 * A secondary driver becomes key user of their first Audi: points to them and, in the same batch,
 * `inviterPoints` to the key user of the household that brought them in. Once per user.
 */
async function simulateFirstAudi(db: D1Database, user: UserRow, households: MembershipRow[], now: Date): Promise<Outcome> {
  const roles = households.map((h) => h.role)
  const alreadyHadFirstAudi = await hasLedgerEntry(db, user.id, 'first_audi')
  const award = computeAward(program, { type: 'first_audi', now, roles, alreadyHadFirstAudi })
  if (award.points === 0) return skipped(award.notice)

  const household = households.find((h) => h.role === 'secondary')
  const keyUser = household
    ? await db
        .prepare(
          "SELECT u.id, u.name FROM memberships m JOIN users u ON u.id = m.user_id WHERE m.vehicle_id = ? AND m.role = 'key' LIMIT 1",
        )
        .bind(household.id)
        .first<{ id: string; name: string }>()
    : null

  const meta: LedgerMeta = { side: 'invitee' }
  if (keyUser) {
    meta.inviterId = keyUser.id
    meta.inviterName = keyUser.name
  }
  if (household) meta.familyVehicleModel = household.model
  const extra: D1PreparedStatement[] = []
  if (keyUser && award.inviterPoints > 0) {
    extra.push(
      insertLedger(db, {
        id: crypto.randomUUID(),
        userId: keyUser.id,
        action: 'first_audi',
        points: award.inviterPoints,
        meta: { side: 'inviter', name: user.name, inviteeId: user.id },
        createdAt: now.toISOString(),
      }),
    )
  }
  return { entry: newEntry(user, now, 'first_audi', award.points, meta), notice: null, extra }
}

function slug(name: string): string {
  return (
    name
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '.')
      .replace(/^\.+|\.+$/g, '') || 'familiare'
  )
}

async function simulateInvite(
  db: D1Database,
  user: UserRow,
  households: MembershipRow[],
  meta: Record<string, unknown>,
  now: Date,
): Promise<Outcome> {
  const household = households.find((h) => h.role === 'key')
  if (!household) return skipped(COPY.notices.keyOnly)
  const used = await secondaryCount(db, household.id)
  if (used >= MAX_SECONDARY) return skipped(COPY.notices.slotsFull)

  const surname = user.name.split(' ').slice(1).join(' ')
  const fallbackFirst = COPY.defaultInviteeNames[used % COPY.defaultInviteeNames.length]
  const inviteeName = optionalText(meta.inviteeName, 40) ?? [fallbackFirst, surname].filter(Boolean).join(' ')
  const inviteeId = crypto.randomUUID()
  const email = `${slug(inviteeName)}.${randomHex(3)}@example.com`
  const nowIso = now.toISOString()

  const joinAward = computeAward(program, { type: 'join', now })
  const inviteAward = computeAward(program, { type: 'invite', now })
  if (inviteAward.points === 0) return skipped(inviteAward.notice)

  const extra: D1PreparedStatement[] = [
    db
      .prepare('INSERT INTO users (id, email, name, pin_hash, birth_year, persona_id, created_at) VALUES (?, ?, ?, NULL, NULL, NULL, ?)')
      .bind(inviteeId, email, inviteeName, nowIso),
    db
      .prepare("INSERT INTO memberships (user_id, vehicle_id, role, created_at) VALUES (?, ?, 'secondary', ?)")
      .bind(inviteeId, household.id, nowIso),
    db
      .prepare(
        "INSERT INTO invites (code, vehicle_id, inviter_id, email, status, invitee_id, created_at) VALUES (?, ?, ?, ?, 'accepted', ?, ?)",
      )
      .bind(randomCode(6), household.id, user.id, email, inviteeId, nowIso),
  ]
  if (joinAward.points > 0) {
    extra.push(
      insertLedger(db, { id: crypto.randomUUID(), userId: inviteeId, action: 'join', points: joinAward.points, meta: {}, createdAt: nowIso }),
    )
  }
  extra.push(
    insertLedger(db, {
      id: crypto.randomUUID(),
      userId: inviteeId,
      action: 'invite',
      points: inviteAward.points,
      meta: { side: 'invitee', name: user.name, inviterId: user.id },
      createdAt: nowIso,
    }),
  )
  const entry = newEntry(user, now, 'invite', inviteAward.points, { side: 'inviter', name: inviteeName, inviteeId })
  return { entry, notice: null, extra }
}

/** POST /api/actions */
export async function runAction(ctx: Ctx): Promise<Response> {
  const { db, now } = ctx
  const user = await requireUser(ctx)
  const body = await readJsonObject(ctx.req)
  if (!oneOf(SIMULATED, body.type)) throw new HttpError(400, 'invalid_input', COPY.errors.actionUnknown)
  const type = body.type
  const meta = isRecord(body.meta) ? body.meta : {}

  const [before, households] = await Promise.all([userStanding(db, user.id, now), membershipsFor(db, user.id)])
  const primary = households[0] ?? null

  let outcome: Outcome
  switch (type) {
    case 'service': {
      const kind = meta.serviceKind ?? 'tagliando'
      if (!oneOf(SERVICE_KINDS, kind)) throw new HttpError(400, 'invalid_input', COPY.errors.serviceKindInvalid)
      if (!primary) {
        outcome = skipped(COPY.notices.noVehicle)
        break
      }
      const counts = await capCounts(db, user.id, type, now)
      const award = computeAward(program, { type, now, kind, vehicleYear: primary.year, ...counts })
      outcome =
        award.points > 0
          ? {
              entry: newEntry(user, now, type, award.points, {
                serviceKind: kind,
                vehicleModel: primary.model,
                multiplied: award.multiplied,
                factor: award.factor,
              }),
              notice: null,
              extra: [],
            }
          : skipped(award.notice)
      break
    }
    case 'session': {
      const kind = meta.sessionKind ?? 'dealer'
      if (!oneOf(SESSION_KINDS, kind)) throw new HttpError(400, 'invalid_input', COPY.errors.sessionKindInvalid)
      const counts = await capCounts(db, user.id, type, now)
      const award = computeAward(program, { type, now, kind, ...counts })
      outcome =
        award.points > 0
          ? { entry: newEntry(user, now, type, award.points, { sessionKind: kind }), notice: null, extra: [] }
          : skipped(award.notice)
      break
    }
    case 'event': {
      const eventName = optionalText(meta.eventName, 80) ?? ENGINE_COPY.eventDefaultName
      const counts = await capCounts(db, user.id, type, now)
      const award = computeAward(program, { type, now, ...counts })
      outcome =
        award.points > 0
          ? { entry: newEntry(user, now, type, award.points, { eventName }), notice: null, extra: [] }
          : skipped(award.notice)
      break
    }
    case 'charging': {
      const counts = await capCounts(db, user.id, type, now)
      const award = computeAward(program, { type, now, ...counts })
      outcome =
        award.points > 0 ? { entry: newEntry(user, now, type, award.points, {}), notice: null, extra: [] } : skipped(award.notice)
      break
    }
    case 'accessory':
    case 'merch':
      outcome = await simulatePurchase(db, user, type, meta, now)
      break
    case 'trade_in':
      outcome = await simulateTradeIn(db, user, households, now)
      break
    case 'invite':
      outcome = await simulateInvite(db, user, households, meta, now)
      break
    case 'first_audi':
      outcome = await simulateFirstAudi(db, user, households, now)
      break
    case 'anniversary':
      // Granted by the system once a year (seeded in the demo), never from the demo panel.
      outcome = skipped(COPY.notices.anniversarySystemOnly)
      break
  }

  if (outcome.entry) {
    // Extra rows first: the invitee must exist before anything references them.
    await db.batch([...outcome.extra, insertLedger(db, outcome.entry)])
  }

  const me = await buildMe(db, user, now)
  const levelAfter = me.level.current
  const result: ActionResult = {
    entry: outcome.entry ? ledgerEntryFromNew(outcome.entry) : null,
    awarded: outcome.entry?.points ?? 0,
    notice: outcome.notice,
    levelUp: levelAfter !== before.current ? levelAfter : null,
    courtesyCar: type === 'service' && primary ? courtesyCarFor(program, levelAfter, primary.model) : null,
    me,
  }
  return json(result)
}
