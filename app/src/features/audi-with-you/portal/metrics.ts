// Pure helpers that turn a MeResponse into the numbers the full version shows.
import type { LedgerEntry, LevelId, MeResponse, ProgramAction, ProgramLevel, ProgramReward } from '@/shared/types'
import { formatPoints } from '@/lib/utils'
import { bonusReward, getLevel, program } from '../program'
import { bookingCopy } from '../shared/booking.copy.it'
import { portalCopy } from './copy.it'

export interface PortalMetrics {
  /** Points of the rolling window: they set the level. */
  totalPoints: number
  /** All points ever earned, window or not. */
  lifetimePoints: number
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
    lifetimePoints: me.level.lifetimePoints ?? me.level.points,
    levelName: getLevel(program, me.level.current).name,
    pointsToNext: me.level.pointsToNext,
    familyPoints: household ? household.members.reduce((sum, m) => sum + m.points, 0) : me.level.points,
    serviceCount: me.ledger.filter((e) => e.action === 'service').length,
    experienceCount: me.ledger.filter((e) => e.action === 'session' || e.action === 'event').length,
  }
}

/**
 * Rules of an action as short Italian labels: service multiplier, once (per user or per vehicle),
 * both sides, monthly cap. Points are always flat per action.
 */
export function actionNotes(action: ProgramAction): string[] {
  const copy = portalCopy.earn
  const notes: string[] = []
  if (action.multiplier) notes.push(copy.multiplier(action.multiplier.factor, action.multiplier.olderThanYears))
  if (action.oncePerVehicle) notes.push(copy.oncePerVehicle)
  // invite is once per invitee: "a te e a chi entra" says it better than "una volta".
  else if (action.once && !action.bothSides) notes.push(copy.once)
  if (action.bothSides) notes.push(copy.bothSides)
  if (action.monthlyCap) notes.push(copy.monthlyCap(action.monthlyCap))
  if (action.yearlyCap) notes.push(bookingCopy.earn.yearlyCap(action.yearlyCap))
  if (action.inviterPoints) notes.push(bookingCopy.earn.inviterPoints(formatPoints(action.inviterPoints)))
  return notes
}

export interface KindPoints {
  kind: string
  label: string
  points: number
}

/** Flat points per kind (service: tagliando, gomme...; session: dealer, driving), in program order. */
export function kindPoints(action: ProgramAction): KindPoints[] {
  if (!action.pointsByKind) return []
  return Object.entries(action.pointsByKind).map(([kind, points]) => ({
    kind,
    label: bookingCopy.earn.kinds[kind] ?? kind,
    points,
  }))
}

/** Highest points an action can award once (the biggest kind, or the flat points). */
export function maxPoints(action: ProgramAction): number {
  const kinds = kindPoints(action)
  return kinds.length > 0 ? Math.max(...kinds.map((k) => k.points)) : action.points
}

/** A welcome kit whose title does not already say "Kit di benvenuto": the UI adds that label. */
export function needsWelcomeKitLabel(reward: ProgramReward): boolean {
  const label = portalCopy.levels.welcomeKit.toLowerCase()
  return reward.kind === 'welcome_kit' && !reward.title.toLowerCase().includes(label)
}

export interface NextReward {
  levelId: LevelId
  levelName: string
  /** A few rewards of the next level (the welcome kit included), without the bonus reward. */
  rewards: ProgramReward[]
  /** The program's bonus reward (the custom wrap) when the next level is the one that unlocks it. */
  bonus: ProgramReward | null
}

/**
 * Up to `max` rewards of a level to preview: the first privileges, plus the welcome kit when the level has one.
 * The bonus reward is left out: the UI shows it as its own card.
 */
export function previewRewards(level: ProgramLevel, max: number): ProgramReward[] {
  const rewards = level.rewards.filter((r) => !r.bonus)
  const kit = rewards.find((r) => r.kind === 'welcome_kit')
  if (!kit || max < 1) return rewards.slice(0, max)
  return [...rewards.filter((r) => r !== kit).slice(0, max - 1), kit]
}

/** "Prossimo traguardo": the next level, a preview of its rewards and its bonus reward. Null at the top level. */
export function nextReward(me: MeResponse, count = 3): NextReward | null {
  if (!me.level.next) return null
  const level = getLevel(program, me.level.next)
  const bonus = bonusReward(program)
  return {
    levelId: level.id,
    levelName: level.name,
    rewards: previewRewards(level, count),
    bonus: bonus && bonus.level.id === level.id ? bonus.reward : null,
  }
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
