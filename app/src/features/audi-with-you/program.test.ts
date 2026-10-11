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
  first_audi: true,
  anniversary: true,
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

/** Rewards the demo books, with the level that unlocks them. */
const BOOKABLE: Record<string, string> = {
  'icon-kit': 'icon-circle',
  'quattro-kit': 'quattro-circle',
  'sline-kit': 's-line-club',
  'rs-kit': 'rs-vanguard',
  'quattro-fasttrack': 'quattro-circle',
  'sline-dolomiti': 's-line-club',
  'sline-designweek': 's-line-club',
  'rs-wrap': 'rs-vanguard',
}

function levelOfReward(id: string): string | undefined {
  return program.levels.find((l) => l.rewards.some((r) => r.id === id))?.id
}

function rewardById(id: string) {
  return rewards.find((r) => r.id === id)
}

describe('program.it.json', () => {
  it('has a name, a claim, a version and non-empty rules', () => {
    expect(program.name).toBe('Audi with you')
    expect(program.claim.length).toBeGreaterThan(0)
    expect(program.version).toBe('1.0 (H-ACK, 10/10/2026)')
    expect(program.windowMonths).toBe(36)
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

  it('uses the T006 thresholds and the RS Vanguard service requirement', () => {
    expect(program.levels.map((l) => [l.id, l.threshold])).toEqual([
      ['icon-circle', 0],
      ['quattro-circle', 1000],
      ['s-line-club', 2500],
      ['rs-vanguard', 5000],
    ])
    const rs = program.levels.find((l) => l.id === 'rs-vanguard')
    expect(rs?.requires).toMatchObject({ action: 'service', withinMonths: 12 })
    expect(rs?.requires?.label.length).toBeGreaterThan(0)
    for (const level of program.levels) if (level.id !== 'rs-vanguard') expect(level.requires).toBeUndefined()
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

  it('caps Audi Collection, charging and events and grants a trade-in once per vehicle', () => {
    expect(getAction(program, 'merch').monthlyCap).toBe(4)
    expect(getAction(program, 'charging').monthlyCap).toBe(1)
    expect(getAction(program, 'charging').points).toBe(25)
    expect(getAction(program, 'charging').description).toMatch(/con almeno 4 ricariche Audi nel mese/)
    expect(getAction(program, 'event').yearlyCap).toBe(6)
    expect(getAction(program, 'trade_in').oncePerVehicle).toBe(true)
    expect(getAction(program, 'trade_in').points).toBe(1000)
  })

  it('gives points by kind for service and sessions, doubled on an older Audi', () => {
    const service = getAction(program, 'service')
    expect(service.pointsByKind).toEqual({ tagliando: 300, gomme: 100, check_invernale: 100 })
    expect(service.multiplier).toMatchObject({ olderThanYears: 2, factor: 2 })
    expect(getAction(program, 'session').pointsByKind).toEqual({ dealer: 150, driving_experience: 250 })
    for (const action of program.actions) {
      for (const value of Object.values(action.pointsByKind ?? {})) expect(Number.isInteger(value) && value > 0).toBe(true)
      if (action.yearlyCap !== undefined) expect(Number.isInteger(action.yearlyCap) && action.yearlyCap > 0).toBe(true)
    }
  })

  it('rewards the first Audi of an invited driver, and the inviter', () => {
    const first = getAction(program, 'first_audi')
    expect(first.points).toBe(1000)
    expect(first.inviterPoints).toBe(500)
    expect(first.once).toBe(true)
    expect(getAction(program, 'join').points).toBe(100)
    expect(getAction(program, 'invite')).toMatchObject({ points: 100, bothSides: true })
    expect(getAction(program, 'anniversary').points).toBe(200)
  })

  it('keeps every action enabled, in the T006 order', () => {
    expect(program.actions.map((a) => a.type)).toEqual([
      'join',
      'invite',
      'service',
      'accessory',
      'merch',
      'trade_in',
      'first_audi',
      'anniversary',
      'session',
      'event',
      'charging',
    ])
    for (const action of program.actions) expect(action.enabled).toBe(true)
  })

  it('uses only known reward kinds', () => {
    for (const reward of rewards) expect(Object.keys(REWARD_KINDS)).toContain(reward.kind)
  })

  it('gives every level exactly one welcome kit, shipped home with no tickets', () => {
    for (const level of program.levels) {
      expect(level.rewards.filter((r) => r.kind === 'welcome_kit'), level.id).toHaveLength(1)
    }
    for (const kit of rewards.filter((r) => r.kind === 'welcome_kit')) {
      expect(kit.claim, kit.id).toBeDefined()
      expect(kit.claim?.delivery, kit.id).toBe('shipping')
      expect(kit.claim?.options[0]?.id).toBe('spedizione')
      expect(kit.claim?.tickets).toBeUndefined()
      expect(kit.claim?.seatsPerChoice).toBeUndefined()
    }
  })

  it('books the ski day with tickets and a QR code', () => {
    const claim = rewardById('sline-dolomiti')?.claim
    expect(claim?.tickets).toBe(true)
    expect(claim?.delivery ?? 'qr').toBe('qr')
    expect(claim?.seatsPerChoice).toBe(20)
  })

  it('puts the bookable rewards at the right levels', () => {
    for (const [id, level] of Object.entries(BOOKABLE)) {
      expect(levelOfReward(id), id).toBe(level)
      expect(rewardById(id)?.claim, id).toBeDefined()
    }
    expect(rewardById('sline-dolomiti')?.claim?.seatsPerChoice).toBe(20)
    expect(rewardById('sline-designweek')?.claim?.seatsPerChoice).toBe(30)
    expect(rewardById('rs-wrap')?.claim?.seatsPerChoice).toBe(10)
    expect(rewardById('quattro-fasttrack')?.claim?.seatsPerChoice).toBeUndefined()
    const dolomiti = rewardById('sline-dolomiti')?.claim
    expect(dolomiti?.options.map((o) => o.id)).toEqual(['hub', 'data'])
    expect(dolomiti?.options[0]?.choices).toEqual(["Cortina d'Ampezzo", 'Alta Badia', 'Madonna di Campiglio'])
    expect(rewardById('quattro-fasttrack')?.claim?.options.map((o) => o.id)).toEqual(['data', 'concessionaria'])
    expect(rewardById('rs-wrap')?.claim?.options.map((o) => o.id)).toEqual(['zona'])
  })

  it('gives every claim a cta, a confirmation and options with choices', () => {
    for (const reward of rewards) {
      const claim = reward.claim
      if (!claim) continue
      expect(claim.cta.trim().length, reward.id).toBeGreaterThan(0)
      expect(claim.confirmation.trim().length, reward.id).toBeGreaterThan(0)
      expect(claim.options.length, reward.id).toBeGreaterThan(0)
      expect(duplicates(claim.options.map((o) => o.id)), reward.id).toEqual([])
      for (const option of claim.options) {
        expect(option.label.trim().length, `${reward.id}.${option.id}`).toBeGreaterThan(0)
        expect(option.choices.length, `${reward.id}.${option.id}`).toBeGreaterThan(0)
        expect(duplicates(option.choices), `${reward.id}.${option.id}`).toEqual([])
      }
      if (claim.seatsPerChoice !== undefined) {
        expect(Number.isInteger(claim.seatsPerChoice) && claim.seatsPerChoice > 0).toBe(true)
        expect(reward.limited, reward.id).toBe(true)
      }
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

  it('keeps reward copy truthful: no World Cup as a place, nothing promised as free', () => {
    const texts = rewards.flatMap((r) => [
      r.title,
      r.description,
      r.note ?? '',
      r.claim?.cta ?? '',
      r.claim?.confirmation ?? '',
      ...(r.claim?.options.flatMap((o) => [o.label, ...o.choices]) ?? []),
    ])
    const all = [...texts, ...program.experiences.items.flatMap((e) => [e.title, e.description, e.place ?? ''])]
    for (const text of all) expect(text).not.toMatch(/FIS Ski World Cup/)
    for (const text of texts) expect(text).not.toMatch(/\bgratis\b|gratuit/i)
    const fisi = program.experiences.items.find((e) => e.id === 'fisi')
    expect(fisi?.description).toMatch(/previa approvazione della FISI/)
  })

  it('states the rolling window and that points are never spent', () => {
    const rules = program.rules.join(' ')
    expect(rules).toMatch(/36 mesi/)
    expect(rules).toMatch(/non si spendono/)
    expect(rules).toMatch(/non consuma punti/)
    expect(rules).not.toMatch(/non scadono/)
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

describe('T007: experience catalog', () => {
  it('has at least 7 experiences, at least 3 bookable through a level reward with the same level', () => {
    const items = program.experiences.items
    expect(items.length).toBeGreaterThanOrEqual(7)
    const bookable = items.filter((i) => i.rewardId)
    expect(bookable.length).toBeGreaterThanOrEqual(3)
    for (const item of bookable) {
      const level = program.levels.find((l) => l.rewards.some((r) => r.id === item.rewardId))
      expect(level?.id, item.id).toBe(item.minLevel)
      expect(level?.rewards.find((r) => r.id === item.rewardId)?.claim, item.id).toBeDefined()
    }
    expect(items.find((i) => i.id === 'hub')?.rewardId).toBe('sline-dolomiti')
  })
})
