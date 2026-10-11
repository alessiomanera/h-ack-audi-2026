// Family invites: create (key user), preview (public), accept (secondary user joins).
import type { CreateInviteResponse, InvitePreview, InviteStatus } from '../src/shared/types'
import { program } from '../src/features/audi-with-you/program'
import { computeAward } from '../src/features/audi-with-you/engine'
import { COPY } from './copy.it'
import { randomCode } from './crypto'
import {
  MAX_SECONDARY,
  buildMe,
  getUserById,
  hasLedgerEntry,
  insertLedger,
  membershipsFor,
  secondaryCount,
  toInvite,
  type UserRow,
} from './db'
import { HttpError, json, readJsonObject, type Ctx } from './http'
import { requireUser } from './session'
import { parseEmail } from './validate'

export interface InviteRecord {
  code: string
  vehicle_id: string
  inviter_id: string
  email: string
  status: InviteStatus
  invitee_id: string | null
  created_at: string
}

function normalizeCode(code: string): string {
  return code.trim().toUpperCase()
}

export async function findInvite(db: D1Database, code: string): Promise<InviteRecord> {
  const invite = await db
    .prepare('SELECT * FROM invites WHERE code = ?')
    .bind(normalizeCode(code))
    .first<InviteRecord>()
  if (!invite) throw new HttpError(404, 'invite_not_found', COPY.errors.inviteNotFound)
  return invite
}

/** Throws when `userId` (or a new user, when null) cannot join through this invite. */
export async function assertCanJoin(db: D1Database, invite: InviteRecord, userId: string | null): Promise<void> {
  if (invite.status === 'accepted') throw new HttpError(409, 'invite_used', COPY.errors.inviteUsed)
  if (invite.status === 'revoked') throw new HttpError(409, 'invite_revoked', COPY.errors.inviteRevoked)
  if (userId) {
    if (invite.inviter_id === userId) throw new HttpError(409, 'invite_own', COPY.errors.inviteOwn)
    const member = await db
      .prepare('SELECT 1 AS hit FROM memberships WHERE user_id = ? AND vehicle_id = ?')
      .bind(userId, invite.vehicle_id)
      .first<{ hit: number }>()
    if (member) throw new HttpError(409, 'already_member', COPY.errors.alreadyMember)
  }
  if ((await secondaryCount(db, invite.vehicle_id)) >= MAX_SECONDARY) {
    throw new HttpError(409, 'slots_full', COPY.errors.slotsFull)
  }
}

/**
 * Joins the invite's vehicle as secondary user and grants join + invite points
 * to the invitee and invite points to the inviter (each once per pair).
 */
export async function acceptInvite(db: D1Database, user: UserRow, invite: InviteRecord, now: Date): Promise<void> {
  await assertCanJoin(db, invite, user.id)
  const nowIso = now.toISOString()
  // Claim the invite first so two concurrent accepts cannot both succeed.
  const claim = await db
    .prepare("UPDATE invites SET status = 'accepted', invitee_id = ? WHERE code = ? AND status = 'pending'")
    .bind(user.id, invite.code)
    .run()
  if (claim.meta.changes === 0) throw new HttpError(409, 'invite_used', COPY.errors.inviteUsed)

  const inviter = await getUserById(db, invite.inviter_id)
  const inviterName = inviter?.name ?? ''
  const [joined, inviteeGot, inviterGot] = await Promise.all([
    hasLedgerEntry(db, user.id, 'join'),
    hasLedgerEntry(db, user.id, 'invite', 'inviterId', invite.inviter_id),
    hasLedgerEntry(db, invite.inviter_id, 'invite', 'inviteeId', user.id),
  ])
  const joinAward = computeAward(program, { type: 'join', now, alreadyJoined: joined })
  const inviteeAward = computeAward(program, { type: 'invite', now, alreadyAwardedForInvitee: inviteeGot })
  const inviterAward = computeAward(program, { type: 'invite', now, alreadyAwardedForInvitee: inviterGot })

  const stmts: D1PreparedStatement[] = [
    db
      .prepare("INSERT INTO memberships (user_id, vehicle_id, role, created_at) VALUES (?, ?, 'secondary', ?)")
      .bind(user.id, invite.vehicle_id, nowIso),
  ]
  if (joinAward.points > 0) {
    stmts.push(
      insertLedger(db, { id: crypto.randomUUID(), userId: user.id, action: 'join', points: joinAward.points, meta: {}, createdAt: nowIso }),
    )
  }
  if (inviteeAward.points > 0) {
    stmts.push(
      insertLedger(db, {
        id: crypto.randomUUID(),
        userId: user.id,
        action: 'invite',
        points: inviteeAward.points,
        meta: { side: 'invitee', name: inviterName, inviterId: invite.inviter_id },
        createdAt: nowIso,
      }),
    )
  }
  if (inviter && inviterAward.points > 0) {
    stmts.push(
      insertLedger(db, {
        id: crypto.randomUUID(),
        userId: inviter.id,
        action: 'invite',
        points: inviterAward.points,
        meta: { side: 'inviter', name: user.name, inviteeId: user.id },
        createdAt: nowIso,
      }),
    )
  }
  await db.batch(stmts)
}

// ---------- Routes ----------

/** POST /api/invites */
export async function createInvite(ctx: Ctx): Promise<Response> {
  const user = await requireUser(ctx)
  const body = await readJsonObject(ctx.req)
  const email = parseEmail(body.email)
  const household = (await membershipsFor(ctx.db, user.id)).find((m) => m.role === 'key')
  if (!household) throw new HttpError(403, 'key_only', COPY.errors.keyOnly)
  if ((await secondaryCount(ctx.db, household.id)) >= MAX_SECONDARY) {
    throw new HttpError(409, 'slots_full', COPY.errors.slotsFull)
  }
  const createdAt = ctx.now.toISOString()
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = randomCode(6)
    const res = await ctx.db
      .prepare(
        "INSERT OR IGNORE INTO invites (code, vehicle_id, inviter_id, email, status, invitee_id, created_at) VALUES (?, ?, ?, ?, 'pending', NULL, ?)",
      )
      .bind(code, household.id, user.id, email, createdAt)
      .run()
    if (res.meta.changes === 1) {
      const out: CreateInviteResponse = {
        invite: toInvite({ code, email, status: 'pending', created_at: createdAt, inviter_name: user.name, model: household.model }),
        link: `/?invito=${code}`,
      }
      return json(out)
    }
  }
  throw new Error('invite code collision')
}

/** GET /api/invites/:code */
export async function previewInvite(ctx: Ctx): Promise<Response> {
  const invite = await findInvite(ctx.db, ctx.params.code)
  const row = await ctx.db
    .prepare('SELECT u.name AS inviter_name, v.model FROM users u, vehicles v WHERE u.id = ? AND v.id = ?')
    .bind(invite.inviter_id, invite.vehicle_id)
    .first<{ inviter_name: string; model: string }>()
  const preview: InvitePreview = {
    code: invite.code,
    inviterName: row?.inviter_name ?? '',
    vehicleModel: row?.model ?? '',
    status: invite.status,
  }
  return json(preview)
}

/** POST /api/invites/:code/accept */
export async function acceptInviteRoute(ctx: Ctx): Promise<Response> {
  const user = await requireUser(ctx)
  const invite = await findInvite(ctx.db, ctx.params.code)
  await acceptInvite(ctx.db, user, invite, ctx.now)
  return json(await buildMe(ctx.db, user, ctx.now))
}
