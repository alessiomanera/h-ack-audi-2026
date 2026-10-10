// POST /api/actions: the demo panel simulates Audi events and sees the points engine at work.
import type { ActionResult, ServiceKind, SessionKind, SimulatedActionType } from '../src/shared/types'
import { program } from '../src/features/audi-with-you/program'
import {
  ENGINE_COPY,
  computeAward,
  courtesyCarFor,
  levelForPoints,
  monthStartUtc,
  type LedgerMeta,
} from '../src/features/audi-with-you/engine'
import { COPY } from './copy.it'
import { randomCode, randomHex } from './crypto'
import {
  MAX_SECONDARY,
  buildMe,
  insertLedger,
  ledgerEntryFromNew,
  membershipsFor,
  secondaryCount,
  userPoints,
  type MembershipRow,
  type NewLedgerRow,
  type UserRow,
} from './db'
import { HttpError, isRecord, json, readJsonObject, type Ctx } from './http'
import { requireUser } from './session'
import { optionalText } from './validate'

const SIMULATED: readonly SimulatedActionType[] = ['invite', 'service', 'session', 'event', 'charging']
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

  const [pointsBefore, households] = await Promise.all([userPoints(db, user.id), membershipsFor(db, user.id)])
  const levelBefore = levelForPoints(program, pointsBefore)
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
      const award = computeAward(program, { type, now, vehicleYear: primary.year })
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
      const award = computeAward(program, { type, now })
      outcome =
        award.points > 0
          ? { entry: newEntry(user, now, type, award.points, { sessionKind: kind }), notice: null, extra: [] }
          : skipped(award.notice)
      break
    }
    case 'event': {
      const eventName = optionalText(meta.eventName, 80) ?? ENGINE_COPY.eventDefaultName
      const award = computeAward(program, { type, now })
      outcome =
        award.points > 0
          ? { entry: newEntry(user, now, type, award.points, { eventName }), notice: null, extra: [] }
          : skipped(award.notice)
      break
    }
    case 'charging': {
      const row = await db
        .prepare("SELECT COUNT(*) AS n FROM ledger WHERE user_id = ? AND action = 'charging' AND created_at >= ?")
        .bind(user.id, monthStartUtc(now).toISOString())
        .first<{ n: number }>()
      const award = computeAward(program, { type, now, chargingThisMonth: row?.n ?? 0 })
      outcome =
        award.points > 0 ? { entry: newEntry(user, now, type, award.points, {}), notice: null, extra: [] } : skipped(award.notice)
      break
    }
    case 'invite':
      outcome = await simulateInvite(db, user, households, meta, now)
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
    levelUp: levelAfter !== levelBefore ? levelAfter : null,
    courtesyCar: type === 'service' && primary ? courtesyCarFor(program, levelAfter, primary.model) : null,
    me,
  }
  return json(result)
}
