// Pure helpers that turn a MeResponse into the numbers the full version shows.
import type { LedgerEntry, LevelId, MeResponse, ProgramReward } from '@/shared/types'
import { getLevel, LEVEL_ORDER, program } from '../program'

export interface PortalMetrics {
  totalPoints: number
  levelName: string
  /** Null at the top level. */
  pointsToNext: number | null
  /** Sum of the points of every member of the primary household (own points when there is none). */
  familyPoints: number
  serviceCount: number
  experienceCount: number
}

export function computeMetrics(me: MeResponse): PortalMetrics {
  const household = me.households[0]
  return {
    totalPoints: me.level.points,
    levelName: getLevel(program, me.level.current).name,
    pointsToNext: me.level.pointsToNext,
    familyPoints: household ? household.members.reduce((sum, m) => sum + m.points, 0) : me.level.points,
    serviceCount: me.ledger.filter((e) => e.action === 'service').length,
    experienceCount: me.ledger.filter((e) => e.action === 'session' || e.action === 'event').length,
  }
}

export interface NextReward {
  levelName: string
  rewards: ProgramReward[]
}

/** First rewards of the next level, null at the top level. */
export function nextReward(me: MeResponse, count = 2): NextReward | null {
  if (!me.level.next) return null
  const level = getLevel(program, me.level.next)
  return { levelName: level.name, rewards: level.rewards.slice(0, count) }
}

export function isUnlocked(userLevel: LevelId, minLevel: LevelId): boolean {
  return LEVEL_ORDER.indexOf(userLevel) >= LEVEL_ORDER.indexOf(minLevel)
}

export interface MonthBucket {
  /** "2026-10" */
  key: string
  /** "ott" */
  label: string
  points: number
}

/** Points earned per calendar month, oldest first, for the `months` months ending with `now`'s month. */
export function monthlyPoints(ledger: LedgerEntry[], now: Date, months = 6): MonthBucket[] {
  const buckets: MonthBucket[] = []
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    buckets.push({
      key: monthKey(d),
      label: d.toLocaleDateString('it-IT', { month: 'short' }),
      points: 0,
    })
  }
  const byKey = new Map(buckets.map((b) => [b.key, b]))
  for (const entry of ledger) {
    const bucket = byKey.get(monthKey(new Date(entry.createdAt)))
    if (bucket) bucket.points += entry.points
  }
  return buckets
}

function monthKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}
