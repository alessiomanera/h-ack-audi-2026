// Typed access to program.it.json, shared by the Worker and the UI.
// The team edits the JSON; this file only types and indexes it.
import data from './program.it.json'
import type { ActionType, LevelId, Program, ProgramAction, ProgramLevel } from '../../shared/types'

export const program = data as Program

export const LEVEL_ORDER: LevelId[] = ['start', 'plus', 'vorsprung']

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
