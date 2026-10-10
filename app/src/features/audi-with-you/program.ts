// Typed access to program.it.json, shared by the Worker and the UI.
// The team edits the JSON; this file only types and indexes it. No level id is hardcoded:
// level order is program.levels sorted by threshold.
import data from './program.it.json'
import type { ActionType, LevelId, Program, ProgramAction, ProgramLevel, ProgramReward } from '../../shared/types'

export const program = data as Program

/** Levels from lowest to highest threshold. */
export function levelsInOrder(p: Program): ProgramLevel[] {
  return [...p.levels].sort((a, b) => a.threshold - b.threshold)
}

/** Level ids of the edited program, from lowest to highest threshold. */
export const LEVEL_ORDER: LevelId[] = levelsInOrder(program).map((l) => l.id)

/** Position of a level in threshold order (0 = entry level), -1 when unknown. */
export function levelIndex(p: Program, id: LevelId): number {
  return levelsInOrder(p).findIndex((l) => l.id === id)
}

/** True when `userLevel` is `minLevel` or above it. */
export function isLevelReached(p: Program, userLevel: LevelId, minLevel: LevelId): boolean {
  const user = levelIndex(p, userLevel)
  const min = levelIndex(p, minLevel)
  return user >= 0 && min >= 0 && user >= min
}

export function getLevel(p: Program, id: LevelId): ProgramLevel {
  const level = p.levels.find((l) => l.id === id)
  if (!level) throw new Error(`Unknown level: ${id}`)
  return level
}

export function getAction(p: Program, type: ActionType): ProgramAction {
  const action = p.actions.find((a) => a.type === type)
  if (!action) throw new Error(`Unknown action: ${type}`)
  return action
}

/** The first reward flagged `bonus` (the custom wrap) and the level that unlocks it. */
export function bonusReward(p: Program): { level: ProgramLevel; reward: ProgramReward } | null {
  for (const level of levelsInOrder(p)) {
    const reward = level.rewards.find((r) => r.bonus)
    if (reward) return { level, reward }
  }
  return null
}
