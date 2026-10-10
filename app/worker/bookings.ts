// Reward bookings: POST /api/bookings and GET /api/rewards/:id/availability.
// Booking a reward never spends points: it only reserves a pickup or a seat.
import type { BookingResponse, RewardAvailability, RewardBooking } from '../src/shared/types'
import { program } from '../src/features/audi-with-you/program'
import {
  ENGINE_COPY,
  checkBooking,
  findReward,
  firstOptionId,
  seatsLeftByChoice,
} from '../src/features/audi-with-you/engine'
import { COPY } from './copy.it'
import { randomCode } from './crypto'
import { buildMe, userStanding } from './db'
import { HttpError, isRecord, json, readJsonObject, type Ctx } from './http'
import { requireUser } from './session'

const MAX_CHOICE_LENGTH = 120

/** Text of an error and of its cause: D1 puts the SQLite message in either. */
function errorText(err: unknown): string {
  if (!(err instanceof Error)) return String(err)
  const cause = err.cause instanceof Error ? err.cause.message : ''
  return `${err.message} ${cause}`
}

function parseChoicesBody(v: unknown): Record<string, string> {
  if (v === undefined || v === null) return {}
  if (!isRecord(v)) throw new HttpError(400, 'invalid_input', COPY.errors.choicesInvalid)
  const out: Record<string, string> = {}
  for (const [k, value] of Object.entries(v)) {
    if (typeof value === 'string') out[k] = value.slice(0, MAX_CHOICE_LENGTH)
  }
  return out
}

async function seatsTaken(db: D1Database, rewardId: string, firstChoice: string): Promise<number> {
  const row = await db
    .prepare('SELECT COUNT(*) AS n FROM bookings WHERE reward_id = ? AND first_choice = ?')
    .bind(rewardId, firstChoice)
    .first<{ n: number }>()
  return row?.n ?? 0
}

async function hasBooked(db: D1Database, userId: string, rewardId: string): Promise<boolean> {
  const row = await db
    .prepare('SELECT 1 AS hit FROM bookings WHERE user_id = ? AND reward_id = ? LIMIT 1')
    .bind(userId, rewardId)
    .first<{ hit: number }>()
  return row !== null
}

/** POST /api/bookings */
export async function createBooking(ctx: Ctx): Promise<Response> {
  const { db, now } = ctx
  const user = await requireUser(ctx)
  const body = await readJsonObject(ctx.req)
  const rewardId = typeof body.rewardId === 'string' ? body.rewardId.trim() : ''
  if (!rewardId) throw new HttpError(400, 'invalid_input', COPY.errors.rewardIdRequired)
  const choices = parseChoicesBody(body.choices)

  const claim = findReward(program, rewardId)?.reward.claim
  const firstId = claim ? firstOptionId(claim) : null
  const firstRaw = firstId && Object.hasOwn(choices, firstId) ? choices[firstId].trim() : ''
  const [level, alreadyBooked, taken] = await Promise.all([
    userStanding(db, user.id, now),
    hasBooked(db, user.id, rewardId),
    seatsTaken(db, rewardId, firstRaw),
  ])
  const check = checkBooking(program, {
    levelId: level.current,
    rewardId,
    choices,
    alreadyBooked,
    seatsTakenForFirstChoice: taken,
  })
  if (!check.ok) throw new HttpError(check.status, check.error, check.message)

  const id = crypto.randomUUID()
  const createdAt = now.toISOString()
  const choicesJson = JSON.stringify(check.choices)
  const seats = check.seatsPerChoice
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = `AWY-${randomCode(4)}`
    const values = [id, user.id, rewardId, check.levelId, choicesJson, check.firstChoice, code, createdAt]
    // Limited seats: the count and the insert are one statement, so the last seat cannot be sold twice.
    const stmt =
      seats === null
        ? db
            .prepare(
              'INSERT INTO bookings (id, user_id, reward_id, level_id, choices, first_choice, code, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            )
            .bind(...values)
        : db
            .prepare(
              `INSERT INTO bookings (id, user_id, reward_id, level_id, choices, first_choice, code, created_at)
               SELECT ?, ?, ?, ?, ?, ?, ?, ?
                WHERE (SELECT COUNT(*) FROM bookings WHERE reward_id = ? AND first_choice = ?) < ?`,
            )
            .bind(...values, rewardId, check.firstChoice, seats)
    let changes: number
    try {
      changes = (await stmt.run()).meta.changes
    } catch (err) {
      const text = errorText(err)
      if (text.includes('bookings.code')) continue
      if (text.includes('UNIQUE')) throw new HttpError(409, 'already_booked', ENGINE_COPY.booking.alreadyBooked)
      throw err
    }
    if (changes === 0) throw new HttpError(409, 'sold_out', ENGINE_COPY.booking.soldOut)

    const booking: RewardBooking = {
      id,
      rewardId,
      rewardTitle: check.reward.title,
      levelId: check.levelId,
      choices: check.choices,
      code,
      createdAt,
    }
    const [takenAfter, me] = await Promise.all([
      seats === null ? Promise.resolve(0) : seatsTaken(db, rewardId, check.firstChoice),
      buildMe(db, user, now),
    ])
    const out: BookingResponse = {
      booking,
      seatsLeft: seats === null ? null : Math.max(0, seats - takenAfter),
      me,
    }
    return json(out)
  }
  throw new Error('booking code collision')
}

/** GET /api/rewards/:id/availability */
export async function rewardAvailability(ctx: Ctx): Promise<Response> {
  const { db } = ctx
  const user = await requireUser(ctx)
  const rewardId = ctx.params.id
  const found = findReward(program, rewardId)
  if (!found) throw new HttpError(404, 'reward_not_found', COPY.errors.rewardNotFound)
  const claim = found.reward.claim
  const [counts, booked] = await Promise.all([
    db
      .prepare('SELECT first_choice, COUNT(*) AS n FROM bookings WHERE reward_id = ? GROUP BY first_choice')
      .bind(rewardId)
      .all<{ first_choice: string; n: number }>(),
    hasBooked(db, user.id, rewardId),
  ])
  const taken: Record<string, number> = {}
  for (const r of counts.results) taken[r.first_choice] = r.n
  const out: RewardAvailability = {
    rewardId,
    seatsLeft: claim ? seatsLeftByChoice(claim, taken) : null,
    booked,
  }
  return json(out)
}
