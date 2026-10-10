import { describe, expect, it } from 'vitest'
import type { Program } from '../../shared/types'
import { program } from './program'
import {
  computeAward,
  courtesyCarFor,
  ledgerLabel,
  levelForPoints,
  levelProgress,
  monthStartUtc,
  vehicleAgeYears,
} from './engine'

const now = new Date('2026-10-10T10:00:00Z')

describe('levels', () => {
  it('maps thresholds to levels', () => {
    expect(levelForPoints(program, 0)).toBe('start')
    expect(levelForPoints(program, 499)).toBe('start')
    expect(levelForPoints(program, 500)).toBe('plus')
    expect(levelForPoints(program, 1499)).toBe('plus')
    expect(levelForPoints(program, 1500)).toBe('vorsprung')
    expect(levelForPoints(program, 9000)).toBe('vorsprung')
  })

  it('computes progress between thresholds', () => {
    expect(levelProgress(program, 0)).toEqual({ current: 'start', next: 'plus', points: 0, pointsToNext: 500, progress: 0 })
    expect(levelProgress(program, 250).progress).toBeCloseTo(0.5)
    expect(levelProgress(program, 320)).toMatchObject({ current: 'start', pointsToNext: 180 })
    const plus = levelProgress(program, 1000)
    expect(plus).toMatchObject({ current: 'plus', next: 'vorsprung', pointsToNext: 500 })
    expect(plus.progress).toBeCloseTo(0.5)
    expect(levelProgress(program, 1500)).toEqual({
      current: 'vorsprung',
      next: null,
      points: 1500,
      pointsToNext: null,
      progress: 1,
    })
  })
})

describe('computeAward', () => {
  it('grants join only once', () => {
    expect(computeAward(program, { type: 'join', now }).points).toBe(100)
    const again = computeAward(program, { type: 'join', now, alreadyJoined: true })
    expect(again.points).toBe(0)
    expect(again.notice).toBeTruthy()
  })

  it('grants invite once per invitee', () => {
    expect(computeAward(program, { type: 'invite', now }).points).toBe(100)
    expect(computeAward(program, { type: 'invite', now, alreadyAwardedForInvitee: true }).points).toBe(0)
  })

  it('doubles service points for vehicles older than 2 years', () => {
    expect(vehicleAgeYears(2021, now)).toBe(5)
    const old = computeAward(program, { type: 'service', now, vehicleYear: 2021 })
    expect(old).toMatchObject({ points: 400, multiplied: true, factor: 2 })
    expect(computeAward(program, { type: 'service', now, vehicleYear: 2023 }).points).toBe(400)
    // Boundary: exactly 2 years is not "older than 2".
    expect(computeAward(program, { type: 'service', now, vehicleYear: 2024 }).points).toBe(200)
    expect(computeAward(program, { type: 'service', now, vehicleYear: 2025 }).points).toBe(200)
  })

  it('gives fixed points for session and event', () => {
    expect(computeAward(program, { type: 'session', now }).points).toBe(150)
    expect(computeAward(program, { type: 'event', now }).points).toBe(100)
  })

  it('caps charging at 20 rewarded sessions per month', () => {
    expect(computeAward(program, { type: 'charging', now, chargingThisMonth: 0 }).points).toBe(5)
    expect(computeAward(program, { type: 'charging', now, chargingThisMonth: 19 }).points).toBe(5)
    const capped = computeAward(program, { type: 'charging', now, chargingThisMonth: 20 })
    expect(capped.points).toBe(0)
    expect(capped.notice).toContain('20')
    expect(monthStartUtc(now).toISOString()).toBe('2026-10-01T00:00:00.000Z')
  })

  it('gives nothing for disabled actions', () => {
    const disabled: Program = {
      ...program,
      actions: program.actions.map((a) => (a.type === 'event' ? { ...a, enabled: false } : a)),
    }
    const award = computeAward(disabled, { type: 'event', now })
    expect(award.points).toBe(0)
    expect(award.notice).toBeTruthy()
  })
})

describe('courtesyCarFor', () => {
  const offered = (level: 'start' | 'plus' | 'vorsprung', model: string) =>
    courtesyCarFor(program, level, model).offeredModel

  it('follows the level rules and the model family', () => {
    expect(offered('start', 'A3')).toBe('A3')
    expect(offered('plus', 'A3')).toBe('A5')
    expect(offered('plus', 'Q3')).toBe('Q5')
    expect(offered('vorsprung', 'Q3')).toBe('Q4 e-tron')
    expect(offered('plus', 'A1')).toBe('A3')
  })

  it('stays in the top segment and keeps unknown models', () => {
    expect(offered('plus', 'A8')).toBe('A8')
    expect(offered('vorsprung', 'TT')).toBe('TT')
    const offer = courtesyCarFor(program, 'plus', 'Audi A3')
    expect(offer).toMatchObject({ level: 'plus', ownModel: 'Audi A3', offeredModel: 'A5' })
    expect(offer.rule.segmentsUp).toBe(1)
  })
})

describe('ledgerLabel', () => {
  it('builds Italian labels', () => {
    expect(ledgerLabel(program, 'service', { serviceKind: 'tagliando' })).toBe('Tagliando in officina Audi')
    expect(ledgerLabel(program, 'service', { serviceKind: 'gomme' })).toBe('Cambio gomme in officina Audi')
    expect(ledgerLabel(program, 'service', { serviceKind: 'check_invernale' })).toBe('Check invernale in officina Audi')
    expect(ledgerLabel(program, 'session', { sessionKind: 'dealer' })).toBe('Sessione Conosci la tua Audi')
    expect(ledgerLabel(program, 'session', { sessionKind: 'driving_experience' })).toBe('Audi driving experience')
    expect(ledgerLabel(program, 'event', { eventName: 'Audi Night' })).toBe('Check-in evento: Audi Night')
    expect(ledgerLabel(program, 'charging', {})).toBe('Ricarica Audi')
    expect(ledgerLabel(program, 'join', {})).toBe('Benvenuto in Audi with you')
    expect(ledgerLabel(program, 'invite', { name: 'Luca Bianchi', side: 'inviter' })).toBe('Invito accettato: Luca Bianchi')
  })
})
