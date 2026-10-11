// Session cookie handling: only the SHA-256 of the token is stored in D1.
import { COPY } from './copy.it'
import { newSessionToken, sha256Hex } from './crypto'
import { getUserById, type UserRow } from './db'
import { HttpError, SESSION_COOKIE, getCookie, json, sessionCookie, type Ctx } from './http'

export const SESSION_TTL_SECONDS = 7 * 24 * 60 * 60

export async function createSession(db: D1Database, userId: string, now: Date): Promise<string> {
  const token = newSessionToken()
  const tokenHash = await sha256Hex(token)
  await db.batch([
    db.prepare('DELETE FROM sessions WHERE user_id = ? AND expires_at <= ?').bind(userId, now.getTime()),
    db
      .prepare('INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?, ?, ?)')
      .bind(tokenHash, userId, now.getTime() + SESSION_TTL_SECONDS * 1000),
  ])
  return token
}

/** Hash of the session token in the request cookie, or null. */
export async function sessionHash(req: Request): Promise<string | null> {
  const token = getCookie(req, SESSION_COOKIE)
  if (!token || !/^[0-9a-f]{64}$/.test(token)) return null
  return sha256Hex(token)
}

export async function currentUser(ctx: Ctx): Promise<UserRow | null> {
  const hash = await sessionHash(ctx.req)
  if (!hash) return null
  const row = await ctx.db
    .prepare('SELECT user_id FROM sessions WHERE token_hash = ? AND expires_at > ?')
    .bind(hash, ctx.now.getTime())
    .first<{ user_id: string }>()
  return row ? getUserById(ctx.db, row.user_id) : null
}

export async function requireUser(ctx: Ctx): Promise<UserRow> {
  const user = await currentUser(ctx)
  if (!user) throw new HttpError(401, 'unauthorized', COPY.errors.unauthorized)
  return user
}

/** JSON response that also sets a fresh session cookie. */
export function jsonWithSession(data: unknown, token: string): Response {
  return json(data, { headers: { 'Set-Cookie': sessionCookie(token, SESSION_TTL_SECONDS) } })
}
