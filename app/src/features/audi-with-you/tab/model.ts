// Pure helpers for the TabView: derive what the compact view shows from MeResponse and the program.
import type { ActionType, Household, MeResponse, Program, ProgramAction, ProgramReward } from '@/shared/types'
import { previewRewards } from '../portal/metrics'
import { getAction, getLevel, program } from '../program'

/** The first household is the primary one (contract). */
export function primaryHousehold(me: MeResponse): Household | null {
  return me.households[0] ?? null
}

export function firstName(name: string): string {
  return name.trim().split(/\s+/)[0] ?? name
}

export interface ServicePoints {
  points: number
  /** True when the vehicle is old enough for the service multiplier. */
  multiplied: boolean
  /** Program label for the multiplier, shown in the dialog. */
  multiplierLabel: string | null
}

/** Points a service visit earns now, with the age multiplier from program.it.json. */
export function servicePoints(me: MeResponse): ServicePoints {
  const action = getAction(program, 'service')
  const rule = action.multiplier
  const age = primaryHousehold(me)?.vehicle.ageYears ?? 0
  const multiplied = rule !== undefined && age > rule.olderThanYears
  return {
    points: multiplied && rule ? action.points * rule.factor : action.points,
    multiplied,
    multiplierLabel: rule?.label ?? null,
  }
}

export interface NextReward {
  levelName: string
  pointsToNext: number
  rewards: ProgramReward[]
}

/** A preview of the next level (first privilege plus welcome kit, never the bonus), or null at the top level. */
export function nextReward(me: MeResponse, max = 2): NextReward | null {
  const { next, pointsToNext } = me.level
  if (next === null || pointsToNext === null) return null
  const level = getLevel(program, next)
  return { levelName: level.name, pointsToNext, rewards: previewRewards(level, max) }
}

/** Actions that have no tile of their own (service and family have one; join is automatic). */
const TILE_ACTIONS: ReadonlySet<ActionType> = new Set<ActionType>(['join', 'invite', 'service'])

/** Other enabled actions, listed under the tiles with their flat points and caps. */
export function otherActions(p: Program): ProgramAction[] {
  return p.actions.filter((a) => a.enabled && !TILE_ACTIONS.has(a.type))
}

/** First name of the household's key user, when it is not me. */
export function keyUserName(household: Household): string | null {
  const key = household.members.find((m) => m.role === 'key' && !m.isMe)
  return key ? firstName(key.name) : null
}

/** Same page, full view, every other query param (e.g. demo=1) preserved. */
export function fullVersionSearch(params: URLSearchParams): string {
  const next = new URLSearchParams(params)
  next.set('vista', 'completa')
  return `?${next.toString()}`
}
