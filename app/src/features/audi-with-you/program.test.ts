// @vitest-environment node
// Structure checks for program.it.json, the single editable program file.
import type { ActionType, LevelId, RewardKind } from '@/shared/types'
import { LEVEL_ORDER, program } from './program'

const ACTION_TYPES: Record<ActionType, true> = {
  join: true,
  invite: true,
  service: true,
  session: true,
  event: true,
  charging: true,
}

const REWARD_KINDS: Record<RewardKind, true> = {
  service: true,
  experience: true,
  recognition: true,
  partner: true,
  courtesy_car: true,
  access: true,
}

function duplicates(values: string[]): string[] {
  return values.filter((v, i) => values.indexOf(v) !== i)
}

describe('program.it.json', () => {
  it('has a name, a claim and non-empty rules', () => {
    expect(program.name).toBe('Audi with you')
    expect(program.claim.length).toBeGreaterThan(0)
    expect(program.rules.length).toBeGreaterThan(0)
    for (const rule of program.rules) expect(rule.trim().length).toBeGreaterThan(0)
  })

  it('uses unique ids everywhere', () => {
    expect(duplicates(program.steps.map((s) => s.id))).toEqual([])
    expect(duplicates(program.levels.map((l) => l.id))).toEqual([])
    expect(duplicates(program.levels.flatMap((l) => l.rewards.map((r) => r.id)))).toEqual([])
    expect(duplicates(program.experiences.items.map((e) => e.id))).toEqual([])
    expect(duplicates(program.segments.map((s) => s.id))).toEqual([])
  })

  it('lists the levels in order with ascending thresholds starting at 0', () => {
    expect(program.levels.map((l) => l.id)).toEqual(LEVEL_ORDER)
    expect(program.levels[0]?.threshold).toBe(0)
    for (let i = 1; i < program.levels.length; i++) {
      const prev = program.levels[i - 1]
      const cur = program.levels[i]
      expect(prev && cur && cur.threshold > prev.threshold).toBe(true)
    }
  })

  it('never lowers the courtesy car from one level to the next', () => {
    for (let i = 1; i < program.levels.length; i++) {
      const prev = program.levels[i - 1]
      const cur = program.levels[i]
      expect(prev && cur && cur.courtesyCar.segmentsUp >= prev.courtesyCar.segmentsUp).toBe(true)
    }
  })

  it('has every action type exactly once, with positive whole points', () => {
    const types = program.actions.map((a) => a.type)
    expect([...types].sort()).toEqual(Object.keys(ACTION_TYPES).sort())
    for (const action of program.actions) {
      expect(Number.isInteger(action.points) && action.points > 0).toBe(true)
      if (action.monthlyCap !== undefined) expect(action.monthlyCap).toBeGreaterThan(0)
      if (action.multiplier) expect(action.multiplier.factor).toBeGreaterThan(1)
    }
  })

  it('uses only known reward kinds', () => {
    for (const reward of program.levels.flatMap((l) => l.rewards)) {
      expect(Object.keys(REWARD_KINDS)).toContain(reward.kind)
    }
  })

  it('gives every experience a valid minimum level', () => {
    const levels: string[] = LEVEL_ORDER
    for (const exp of program.experiences.items) {
      expect(levels).toContain(exp.minLevel satisfies LevelId)
    }
  })

  it('puts every model in exactly one segment', () => {
    const models = program.segments.flatMap((s) => s.models)
    expect(models.length).toBeGreaterThan(0)
    expect(duplicates(models)).toEqual([])
    for (const s of program.segments) expect(s.models.length).toBeGreaterThan(0)
  })
})
