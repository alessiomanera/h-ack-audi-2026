// Auth routes: signup, login (email + 4-digit PIN), demo persona login, logout.
import type { Persona, PersonaId } from '../src/shared/types'
import { program } from '../src/features/audi-with-you/program'
import { computeAward } from '../src/features/audi-with-you/engine'
import { COPY } from './copy.it'
import { hashPin, verifyPin } from './crypto'
import { buildMe, getUserByEmail, getUserById, insertLedger, type UserRow } from './db'
import { HttpError, clearSessionCookie, json, readJsonObject, type Ctx } from './http'
import { acceptInvite, assertCanJoin, findInvite } from './invites'
import { PERSONAS } from './seed'
import { createSession, jsonWithSession, sessionHash } from './session'
import { normalizeEmail, parseEmail, parseName, parsePin, parseVehicle } from './validate'

async function respondWithNewSession(ctx: Ctx, user: UserRow): Promise<Response> {
  const token = await createSession(ctx.db, user.id, ctx.now)
  return jsonWithSession(await buildMe(ctx.db, user, ctx.now), token)
}

/** POST /api/auth/signup */
export async function signup(ctx: Ctx): Promise<Response> {
  const body = await readJsonObject(ctx.req)
  const name = parseName(body.name)
  const email = parseEmail(body.email)
  const pin = parsePin(body.pin)
  const inviteCode = typeof body.inviteCode === 'string' && body.inviteCode.trim() ? body.inviteCode : null

  // Validate everything before creating the user.
  const invite = inviteCode ? await findInvite(ctx.db, inviteCode) : null
  if (invite) await assertCanJoin(ctx.db, invite, null)
  const vehicle = invite ? null : parseVehicle(body.vehicle, ctx.now)
  if (await getUserByEmail(ctx.db, email)) throw new HttpError(409, 'email_taken', COPY.errors.emailTaken)

  const nowIso = ctx.now.toISOString()
  const userId = crypto.randomUUID()
  const pinHash = await hashPin(pin)
  const birthYear = typeof body.birthYear === 'number' && Number.isInteger(body.birthYear) ? body.birthYear : null
  const insertUser = ctx.db
    .prepare('INSERT INTO users (id, email, name, pin_hash, birth_year, persona_id, created_at) VALUES (?, ?, ?, ?, ?, NULL, ?)')
    .bind(userId, email, name, pinHash, birthYear, nowIso)

  if (vehicle) {
    const vehicleId = crypto.randomUUID()
    const join = computeAward(program, { type: 'join', now: ctx.now })
    const stmts: D1PreparedStatement[] = [
      insertUser,
      ctx.db
        .prepare('INSERT INTO vehicles (id, model, year, created_at) VALUES (?, ?, ?, ?)')
        .bind(vehicleId, vehicle.model, vehicle.year, nowIso),
      ctx.db
        .prepare("INSERT INTO memberships (user_id, vehicle_id, role, created_at) VALUES (?, ?, 'key', ?)")
        .bind(userId, vehicleId, nowIso),
    ]
    if (join.points > 0) {
      stmts.push(
        insertLedger(ctx.db, { id: crypto.randomUUID(), userId, action: 'join', points: join.points, meta: {}, createdAt: nowIso }),
      )
    }
    await ctx.db.batch(stmts)
  } else {
    await insertUser.run()
  }

  const user = await getUserById(ctx.db, userId)
  if (!user) throw new Error('user not found after signup')
  if (invite) await acceptInvite(ctx.db, user, invite, ctx.now)
  return respondWithNewSession(ctx, user)
}

/** POST /api/auth/login */
export async function login(ctx: Ctx): Promise<Response> {
  const body = await readJsonObject(ctx.req)
  const email = normalizeEmail(body.email)
  const pin = typeof body.pin === 'string' && /^\d{4}$/.test(body.pin) ? body.pin : null
  const user = email && pin ? await getUserByEmail(ctx.db, email) : null
  if (!user || !pin || !(await verifyPin(pin, user.pin_hash))) {
    throw new HttpError(401, 'login_failed', COPY.errors.loginFailed)
  }
  return respondWithNewSession(ctx, user)
}

function isPersonaId(v: unknown): v is PersonaId {
  return PERSONAS.some((p) => p.id === v)
}

/** POST /api/auth/persona (seeded demo personas only, no PIN) */
export async function personaLogin(ctx: Ctx): Promise<Response> {
  const body = await readJsonObject(ctx.req)
  if (!isPersonaId(body.personaId)) throw new HttpError(400, 'invalid_input', COPY.errors.personaUnknown)
  const user = await ctx.db
    .prepare('SELECT * FROM users WHERE persona_id = ?')
    .bind(body.personaId)
    .first<UserRow>()
  if (!user) throw new HttpError(404, 'persona_not_found', COPY.errors.personaUnknown)
  return respondWithNewSession(ctx, user)
}

/** POST /api/auth/logout */
export async function logout(ctx: Ctx): Promise<Response> {
  const hash = await sessionHash(ctx.req)
  if (hash) await ctx.db.prepare('DELETE FROM sessions WHERE token_hash = ?').bind(hash).run()
  return json({ ok: true }, { headers: { 'Set-Cookie': clearSessionCookie() } })
}

/** GET /api/personas */
export async function listPersonas(ctx: Ctx): Promise<Response> {
  const { results } = await ctx.db
    .prepare('SELECT id, name, persona_id FROM users WHERE persona_id IS NOT NULL')
    .all<{ id: string; name: string; persona_id: string }>()
  const personas: Persona[] = PERSONAS.flatMap((p) => {
    const row = results.find((r) => r.persona_id === p.id)
    return row ? [{ id: p.id, name: row.name, tagline: COPY.personas[p.id], role: p.role }] : []
  })
  return json(personas)
}
