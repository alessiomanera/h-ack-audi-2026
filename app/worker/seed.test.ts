// @vitest-environment node
// The demo flows depend on these seeded numbers: keep them in sync with the comments in seed.ts.
import { describe, expect, it } from 'vitest'
import { program } from '../src/features/audi-with-you/program'
import { computeAward, levelProgress, summarizeLedger, type PointsRow } from '../src/features/audi-with-you/engine'
import { SEED_LEDGER } from './seed'

const DAY_MS = 86_400_000
const now = new Date('2026-10-10T10:00:00Z')

function rowsOf(userId: string, at: Date = now): (PointsRow & { meta: Record<string, unknown> })[] {
  return SEED_LEDGER.filter((r) => r[1] === userId).map(([, , action, points, daysAgo, meta]) => ({
    action,
    points,
    createdAt: new Date(at.getTime() - daysAgo * DAY_MS).toISOString(),
    meta,
  }))
}

function standing(userId: string) {
  return levelProgress(program, summarizeLedger(program, rowsOf(userId), now))
}

describe('demo seed', () => {
  it('starts Luca at 650 window points (Icon Circle)', () => {
    expect(standing('u_luca')).toMatchObject({ current: 'icon-circle', points: 650, lifetimePoints: 650, expiring: null })
    // F1: a tagliando on the 2021 A3 is doubled and crosses quattro Circle.
    const award = computeAward(program, { type: 'service', now, kind: 'tagliando', vehicleYear: 2021 })
    expect(650 + award.points).toBe(1250)
  })

  it('starts Giulia at 2350 window points (quattro Circle) with history up to about 30 months old', () => {
    expect(standing('u_giulia')).toMatchObject({ current: 'quattro-circle', points: 2350, lifetimePoints: 2350, expiring: null })
    const oldest = Math.max(...SEED_LEDGER.filter((r) => r[1] === 'u_giulia').map((r) => r[4]))
    expect(oldest).toBeGreaterThan(850)
    expect(oldest).toBeLessThan(1000)
    // F2: her event of the demo must still be rewarded this calendar year.
    const thisYear = rowsOf('u_giulia').filter((r) => r.action === 'event' && r.createdAt >= '2026-01-01').length
    expect(thisYear).toBeLessThanOrEqual(5)
    expect(computeAward(program, { type: 'event', now, thisYear }).points).toBe(100)
    expect(2350 + 100 + 100).toBeGreaterThanOrEqual(2500)
  })

  it('starts Paolo at 1700 window points with older history and 100 to 200 points expiring', () => {
    const paolo = standing('u_paolo')
    expect(paolo).toMatchObject({ current: 'quattro-circle', points: 1700 })
    expect(paolo.lifetimePoints).toBeGreaterThan(paolo.points)
    expect(paolo.expiring?.withinDays).toBe(90)
    expect(paolo.expiring?.points).toBeGreaterThanOrEqual(100)
    expect(paolo.expiring?.points).toBeLessThanOrEqual(200)
    // F3: the trade-in moves him to S line Club.
    expect(levelProgress(program, { points: 1700 + 1000 }).current).toBe('s-line-club')
  })

  it('respects the monthly and yearly caps and never seeds negative points', () => {
    for (const userId of ['u_luca', 'u_giulia', 'u_paolo']) {
      const rows = rowsOf(userId)
      expect(rows.every((r) => r.points > 0)).toBe(true)
      for (const action of program.actions) {
        const mine = rows.filter((r) => r.action === action.type)
        if (action.monthlyCap !== undefined) {
          const byMonth = new Map<string, number>()
          for (const r of mine) byMonth.set(r.createdAt.slice(0, 7), (byMonth.get(r.createdAt.slice(0, 7)) ?? 0) + 1)
          for (const n of byMonth.values()) expect(n).toBeLessThanOrEqual(action.monthlyCap)
        }
        if (action.yearlyCap !== undefined) {
          const byYear = new Map<string, number>()
          for (const r of mine) byYear.set(r.createdAt.slice(0, 4), (byYear.get(r.createdAt.slice(0, 4)) ?? 0) + 1)
          for (const n of byYear.values()) expect(n).toBeLessThanOrEqual(action.yearlyCap)
        }
      }
    }
  })

  it('uses the points of program.it.json for every seeded service and session', () => {
    for (const [, , action, points, , meta] of SEED_LEDGER) {
      if (action === 'service') {
        const kind = String(meta.serviceKind)
        const factor = Number(meta.factor)
        expect(points).toBe((program.actions.find((a) => a.type === 'service')?.pointsByKind?.[kind] ?? 0) * factor)
      }
      if (action === 'session') {
        const kind = String(meta.sessionKind)
        expect(points).toBe(program.actions.find((a) => a.type === 'session')?.pointsByKind?.[kind])
      }
    }
  })
})
