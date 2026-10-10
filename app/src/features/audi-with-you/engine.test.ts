import { describe, expect, it } from 'vitest'
import type { ActionType, Program } from '../../shared/types'
import { getAction, program } from './program'
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
  it('maps thresholds to the four levels', () => {
    expect(levelForPoints(program, 0)).toBe('icon-circle')
    expect(levelForPoints(program, 499)).toBe('icon-circle')
    expect(levelForPoints(program, 500)).toBe('quattro-circle')
    expect(levelForPoints(program, 1499)).toBe('quattro-circle')
    expect(levelForPoints(program, 1500)).toBe('s-line-club')
    expect(levelForPoints(program, 2999)).toBe('s-line-club')
    expect(levelForPoints(program, 3000)).toBe('rs-vanguard')
    expect(levelForPoints(program, 9000)).toBe('rs-vanguard')
  })

  it('does not depend on the order of levels in the JSON', () => {
    const shuffled: Program = { ...program, levels: [...program.levels].reverse() }
    expect(levelForPoints(shuffled, 600)).toBe('quattro-circle')
    expect(levelProgress(shuffled, 0).next).toBe('quattro-circle')
  })

  it('computes progress between thresholds', () => {
    expect(levelProgress(program, 0)).toEqual({
      current: 'icon-circle',
      next: 'quattro-circle',
      points: 0,
      pointsToNext: 500,
      progress: 0,
    })
    expect(levelProgress(program, 250).progress).toBeCloseTo(0.5)
    expect(levelProgress(program, 320)).toMatchObject({ current: 'icon-circle', pointsToNext: 180 })

    const quattro = levelProgress(program, 1000)
    expect(quattro).toMatchObject({ current: 'quattro-circle', next: 's-line-club', pointsToNext: 500 })
    expect(quattro.progress).toBeCloseTo(0.5)

    // Demo personas: Giulia 1350, Paolo after the trade-in 1600.
    expect(levelProgress(program, 1350)).toMatchObject({ current: 'quattro-circle', pointsToNext: 150 })
    const sline = levelProgress(program, 1600)
    expect(sline).toMatchObject({ current: 's-line-club', next: 'rs-vanguard', pointsToNext: 1400 })
    expect(sline.progress).toBeCloseTo(100 / 1500)

    expect(levelProgress(program, 3000)).toEqual({
      current: 'rs-vanguard',
      next: null,
      points: 3000,
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
    const recent = computeAward(program, { type: 'service', now, vehicleYear: 2025 })
    expect(recent).toMatchObject({ points: 200, multiplied: false, factor: 1 })
  })

  it('gives flat points for accessory, merch, trade-in, session and event', () => {
    expect(computeAward(program, { type: 'accessory', now })).toMatchObject({ points: 100, notice: null })
    expect(computeAward(program, { type: 'merch', now })).toMatchObject({ points: 50, notice: null })
    expect(computeAward(program, { type: 'trade_in', now })).toMatchObject({ points: 1000, notice: null })
    expect(computeAward(program, { type: 'session', now }).points).toBe(150)
    expect(computeAward(program, { type: 'event', now }).points).toBe(100)
  })

  it('never scales points with the vehicle or anything else but the action', () => {
    const flat: ActionType[] = ['accessory', 'merch', 'trade_in', 'session', 'event', 'charging']
    for (const type of flat) {
      const expected = getAction(program, type).points
      const award = computeAward(program, { type, now, vehicleYear: 2010, thisMonth: 0 })
      expect(award).toMatchObject({ points: expected, multiplied: false, factor: 1 })
    }
  })

  it('caps merch at 4 rewarded purchases per month', () => {
    expect(computeAward(program, { type: 'merch', now, thisMonth: 0 }).points).toBe(50)
    expect(computeAward(program, { type: 'merch', now, thisMonth: 3 }).points).toBe(50)
    const capped = computeAward(program, { type: 'merch', now, thisMonth: 4 })
    expect(capped.points).toBe(0)
    expect(capped.notice).toContain('4')
    expect(capped.notice).toContain('Audi Collection')
  })

  it('caps charging at 20 rewarded sessions per month', () => {
    expect(computeAward(program, { type: 'charging', now, thisMonth: 0 }).points).toBe(5)
    expect(computeAward(program, { type: 'charging', now, thisMonth: 19 }).points).toBe(5)
    const capped = computeAward(program, { type: 'charging', now, thisMonth: 20 })
    expect(capped.points).toBe(0)
    expect(capped.notice).toContain('20')
    expect(capped.notice).toContain('ricariche')
    expect(monthStartUtc(now).toISOString()).toBe('2026-10-01T00:00:00.000Z')
  })

  it('ignores the monthly count for actions without a cap', () => {
    expect(computeAward(program, { type: 'accessory', now, thisMonth: 99 }).points).toBe(100)
    expect(computeAward(program, { type: 'event', now, thisMonth: 99 }).points).toBe(100)
  })

  it('grants the trade-in only once per vehicle', () => {
    expect(getAction(program, 'trade_in').oncePerVehicle).toBe(true)
    expect(computeAward(program, { type: 'trade_in', now, alreadyTradedIn: false }).points).toBe(1000)
    const again = computeAward(program, { type: 'trade_in', now, alreadyTradedIn: true })
    expect(again.points).toBe(0)
    expect(again.notice).toBe('Hai già ricevuto i punti per la permuta di questa Audi.')
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
  const offered = (level: string, model: string) => courtesyCarFor(program, level, model).offeredModel

  it('follows the level rules and the model family', () => {
    expect(offered('icon-circle', 'A3')).toBe('A3')
    expect(offered('quattro-circle', 'A3')).toBe('A5')
    expect(offered('quattro-circle', 'Q3')).toBe('Q5')
    expect(offered('quattro-circle', 'A1')).toBe('A3')
    expect(offered('s-line-club', 'Q3')).toBe('Q4 e-tron')
    expect(offered('rs-vanguard', 'A3')).toBe('A6 e-tron')
  })

  it('stays in the top segment and keeps unknown models', () => {
    expect(offered('quattro-circle', 'A8')).toBe('A8')
    expect(offered('rs-vanguard', 'TT')).toBe('TT')
    const offer = courtesyCarFor(program, 'quattro-circle', 'Audi A3')
    expect(offer).toMatchObject({ level: 'quattro-circle', ownModel: 'Audi A3', offeredModel: 'A5' })
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

  it('labels accessory, merch and trade-in entries', () => {
    expect(ledgerLabel(program, 'accessory', {})).toBe('Accessorio originale Audi')
    expect(ledgerLabel(program, 'accessory', { itemName: 'Barre portatutto' })).toBe(
      'Accessorio originale Audi: Barre portatutto',
    )
    expect(ledgerLabel(program, 'merch', {})).toBe('Audi Collection')
    expect(ledgerLabel(program, 'merch', { itemName: 'Cappellino' })).toBe('Audi Collection: Cappellino')
    expect(ledgerLabel(program, 'trade_in', { vehicleId: 'v_bianchi_a3', vehicleModel: 'A3' })).toBe(
      'Permuta della tua A3 per una nuova Audi',
    )
  })
})
