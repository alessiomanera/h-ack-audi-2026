// @vitest-environment node
// Structure checks for program.it.json, the single editable program file.
import type { ActionType, LevelId, RewardKind } from '@/shared/types'
import { LEVEL_ORDER, bonusReward, getAction, levelsInOrder, program } from './program'

const ACTION_TYPES: Record<ActionType, true> = {
  join: true,
  invite: true,
  service: true,
  accessory: true,
  merch: true,
  trade_in: true,
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
  welcome_kit: true,
  design: true,
}

/** Copy that would contradict the program: levels are reached only by points, trade-in value is never promised. */
const BANNED_COPY = [/valorizzazione garantita/i, /acquistando/i]

function duplicates(values: string[]): string[] {
  return values.filter((v, i) => values.indexOf(v) !== i)
}

const rewards = program.levels.flatMap((l) => l.rewards)

describe('program.it.json', () => {
  it('has a name, a claim, a version and non-empty rules', () => {
    expect(program.name).toBe('Audi with you')
    expect(program.claim.length).toBeGreaterThan(0)
    expect(program.version).toBe('0.2 (H-ACK, 10/10/2026)')
    expect(program.rules.length).toBeGreaterThan(0)
    for (const rule of program.rules) expect(rule.trim().length).toBeGreaterThan(0)
  })

  it('uses unique ids everywhere', () => {
    expect(duplicates(program.steps.map((s) => s.id))).toEqual([])
    expect(duplicates(program.levels.map((l) => l.id))).toEqual([])
    expect(duplicates(rewards.map((r) => r.id))).toEqual([])
    expect(duplicates(program.experiences.items.map((e) => e.id))).toEqual([])
    expect(duplicates(program.segments.map((s) => s.id))).toEqual([])
  })

  it('has 4 levels with strictly ascending thresholds starting at 0', () => {
    expect(program.levels).toHaveLength(4)
    expect(program.levels[0]?.threshold).toBe(0)
    for (let i = 1; i < program.levels.length; i++) {
      const prev = program.levels[i - 1]
      const cur = program.levels[i]
      expect(prev && cur && cur.threshold > prev.threshold).toBe(true)
    }
  })

  it('derives LEVEL_ORDER from the thresholds', () => {
    const sorted = [...program.levels].sort((a, b) => a.threshold - b.threshold).map((l) => l.id)
    expect(LEVEL_ORDER).toEqual(sorted)
    expect(levelsInOrder(program).map((l) => l.id)).toEqual(sorted)
    expect(program.levels.map((l) => l.id)).toEqual(LEVEL_ORDER)
  })

  it('prefixes reward ids with their level', () => {
    const prefix: Record<string, string> = {
      'icon-circle': 'icon-',
      'quattro-circle': 'quattro-',
      's-line-club': 'sline-',
      'rs-vanguard': 'rs-',
    }
    for (const level of program.levels) {
      const p = prefix[level.id]
      expect(p, `unexpected level id ${level.id}`).toBeDefined()
      for (const reward of level.rewards) expect(reward.id.startsWith(p ?? '?')).toBe(true)
    }
  })

  it('never lowers the courtesy car from one level to the next', () => {
    const levels = levelsInOrder(program)
    for (let i = 1; i < levels.length; i++) {
      const prev = levels[i - 1]
      const cur = levels[i]
      expect(prev && cur && cur.courtesyCar.segmentsUp >= prev.courtesyCar.segmentsUp).toBe(true)
    }
  })

  it('has every action type exactly once, with flat whole points and no per-euro field', () => {
    const types = program.actions.map((a) => a.type)
    expect([...types].sort()).toEqual(Object.keys(ACTION_TYPES).sort())
    for (const action of program.actions) {
      expect(Number.isInteger(action.points) && action.points > 0).toBe(true)
      for (const key of Object.keys(action)) expect(key).not.toMatch(/euro|spen[dt]|amount|price/i)
      if (action.monthlyCap !== undefined) expect(Number.isInteger(action.monthlyCap) && action.monthlyCap > 0).toBe(true)
      if (action.multiplier) expect(action.multiplier.factor).toBeGreaterThan(1)
    }
  })

  it('caps Audi Collection and charging per month and grants a trade-in once per vehicle', () => {
    expect(getAction(program, 'merch').monthlyCap).toBe(4)
    expect(getAction(program, 'charging').monthlyCap).toBe(20)
    expect(getAction(program, 'trade_in').oncePerVehicle).toBe(true)
  })

  it('uses only known reward kinds', () => {
    for (const reward of rewards) expect(Object.keys(REWARD_KINDS)).toContain(reward.kind)
  })

  it('gives every level exactly one welcome kit', () => {
    for (const level of program.levels) {
      expect(level.rewards.filter((r) => r.kind === 'welcome_kit'), level.id).toHaveLength(1)
    }
  })

  it('has exactly one bonus reward, at the top level, with the wrap image', () => {
    expect(rewards.filter((r) => r.bonus)).toHaveLength(1)
    const top = levelsInOrder(program).at(-1)
    const bonus = bonusReward(program)
    expect(bonus).not.toBeNull()
    expect(bonus?.level.id).toBe(top?.id)
    expect(bonus?.reward.image).toBe('/rewards/wrap-demo.jpg')
    expect(bonus?.reward.limited).toBe(true)
  })

  it('never promises trade-in value or levels reached by buying a car', () => {
    const texts = [
      ...rewards.flatMap((r) => [r.title, r.description, r.note ?? '']),
      ...program.rules,
      ...program.steps.map((s) => s.body),
      ...program.levels.flatMap((l) => [l.tagline, l.courtesyCar.label, l.courtesyCar.description]),
    ]
    for (const text of texts) for (const re of BANNED_COPY) expect(text).not.toMatch(re)
  })

  it('gives every experience a known minimum level', () => {
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
