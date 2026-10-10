import { describe, expect, it } from 'vitest'
import type { ActionType, LevelRequirement, Program } from '../../shared/types'
import { getAction, getLevel, program } from './program'
import {
  ENGINE_COPY,
  EXPIRING_WITHIN_DAYS,
  checkBooking,
  computeAward,
  courtesyCarFor,
  expiringRange,
  ledgerLabel,
  levelForPoints,
  levelProgress,
  monthStartUtc,
  pointsFor,
  requirementMet,
  seatsLeftByChoice,
  summarizeLedger,
  vehicleAgeYears,
  windowStart,
  yearStartUtc,
  type PointsRow,
} from './engine'

const now = new Date('2026-10-10T10:00:00Z')
const yes = () => true
const no = () => false
const RS_LABEL = 'almeno un passaggio in officina ufficiale negli ultimi 12 mesi'

describe('levels', () => {
  it('reads the 36 month window and the RS Vanguard requirement from the program', () => {
    expect(program.windowMonths).toBe(36)
    expect(getLevel(program, 'rs-vanguard').requires).toEqual({ action: 'service', withinMonths: 12, label: RS_LABEL })
  })

  it('maps window points to the four levels at the exact thresholds', () => {
    expect(levelForPoints(program, 0, yes)).toBe('icon-circle')
    expect(levelForPoints(program, 999, yes)).toBe('icon-circle')
    expect(levelForPoints(program, 1000, yes)).toBe('quattro-circle')
    expect(levelForPoints(program, 2499, yes)).toBe('quattro-circle')
    expect(levelForPoints(program, 2500, yes)).toBe('s-line-club')
    expect(levelForPoints(program, 4999, yes)).toBe('s-line-club')
    expect(levelForPoints(program, 5000, yes)).toBe('rs-vanguard')
    expect(levelForPoints(program, 9000, yes)).toBe('rs-vanguard')
  })

  it('keeps RS Vanguard locked without a recent service, whatever the points', () => {
    expect(levelForPoints(program, 5000)).toBe('s-line-club')
    expect(levelForPoints(program, 5200, no)).toBe('s-line-club')
    const blocked = levelProgress(program, { points: 5200, satisfied: no })
    expect(blocked).toEqual({
      current: 's-line-club',
      next: 'rs-vanguard',
      points: 5200,
      lifetimePoints: 5200,
      expiring: null,
      blockedBy: RS_LABEL,
      pointsToNext: 0,
      progress: 1,
    })
    const open = levelProgress(program, { points: 5200, satisfied: yes })
    expect(open).toMatchObject({ current: 'rs-vanguard', next: null, blockedBy: null, pointsToNext: null, progress: 1 })
  })

  it('sets blockedBy only once the threshold is met', () => {
    expect(levelProgress(program, { points: 4999, satisfied: no }).blockedBy).toBeNull()
    expect(levelProgress(program, { points: 2500, satisfied: no }).blockedBy).toBeNull()
  })

  it('does not depend on the order of levels in the JSON', () => {
    const shuffled: Program = { ...program, levels: [...program.levels].reverse() }
    expect(levelForPoints(shuffled, 1200)).toBe('quattro-circle')
    expect(levelProgress(shuffled, { points: 0 }).next).toBe('quattro-circle')
  })

  it('computes progress between thresholds', () => {
    expect(levelProgress(program, { points: 0 })).toEqual({
      current: 'icon-circle',
      next: 'quattro-circle',
      points: 0,
      lifetimePoints: 0,
      expiring: null,
      blockedBy: null,
      pointsToNext: 1000,
      progress: 0,
    })
    expect(levelProgress(program, { points: 500 }).progress).toBeCloseTo(0.5)

    // Demo flows. Luca 650 -> 1250, Giulia 2350 -> 2550, Paolo 1700 -> 2700.
    expect(levelProgress(program, { points: 650 })).toMatchObject({ current: 'icon-circle', pointsToNext: 350 })
    expect(levelProgress(program, { points: 1250 })).toMatchObject({ current: 'quattro-circle', pointsToNext: 1250 })
    expect(levelProgress(program, { points: 2350 })).toMatchObject({ current: 'quattro-circle', pointsToNext: 150 })
    expect(levelProgress(program, { points: 2550 })).toMatchObject({ current: 's-line-club', next: 'rs-vanguard' })
    expect(levelProgress(program, { points: 1700 })).toMatchObject({ current: 'quattro-circle', pointsToNext: 800 })
    const paolo = levelProgress(program, { points: 2700, lifetimePoints: 3100, expiring: { points: 150, withinDays: 90 } })
    expect(paolo).toMatchObject({
      current: 's-line-club',
      next: 'rs-vanguard',
      pointsToNext: 2300,
      lifetimePoints: 3100,
      expiring: { points: 150, withinDays: 90 },
    })
    expect(paolo.progress).toBeCloseTo(200 / 2500)
  })
})

describe('rolling window', () => {
  it('goes back whole calendar months, clamping the day', () => {
    expect(windowStart(now, 36).toISOString()).toBe('2023-10-10T10:00:00.000Z')
    expect(windowStart(now, 12).toISOString()).toBe('2025-10-10T10:00:00.000Z')
    expect(windowStart(new Date('2026-03-31T08:00:00Z'), 1).toISOString()).toBe('2026-02-28T08:00:00.000Z')
    expect(windowStart(new Date('2024-03-31T08:00:00Z'), 1).toISOString()).toBe('2024-02-29T08:00:00.000Z')
    expect(windowStart(new Date('2026-01-15T00:00:00Z'), 13).toISOString()).toBe('2024-12-15T00:00:00.000Z')
    expect(monthStartUtc(now).toISOString()).toBe('2026-10-01T00:00:00.000Z')
    expect(yearStartUtc(now).toISOString()).toBe('2026-01-01T00:00:00.000Z')
  })

  it('flags the first 90 days of the window as expiring', () => {
    expect(EXPIRING_WITHIN_DAYS).toBe(90)
    const range = expiringRange(now, 36)
    expect(range.from.toISOString()).toBe('2023-10-10T10:00:00.000Z')
    expect(range.to.toISOString()).toBe('2024-01-08T10:00:00.000Z')
  })

  it('sums window, lifetime and expiring points', () => {
    const rows: PointsRow[] = [
      { action: 'join', points: 100, createdAt: '2023-05-01T09:00:00.000Z' }, // before the window
      { action: 'service', points: 300, createdAt: '2023-10-10T09:59:59.999Z' }, // 1 ms before the window
      { action: 'service', points: 100, createdAt: '2023-10-10T10:00:00.000Z' }, // window start: in, expiring
      { action: 'merch', points: 50, createdAt: '2023-12-01T10:00:00.000Z' }, // expiring
      { action: 'event', points: 100, createdAt: '2024-01-08T10:00:00.000Z' }, // in, no longer expiring
      { action: 'anniversary', points: 200, createdAt: '2026-05-01T10:00:00.000Z' },
      { action: 'event', points: 100, createdAt: '2026-12-01T10:00:00.000Z' }, // future: ignored
    ]
    const s = summarizeLedger(program, rows, now)
    expect(s.points).toBe(450)
    expect(s.lifetimePoints).toBe(850)
    expect(s.expiring).toEqual({ points: 150, withinDays: 90 })
    expect(levelProgress(program, s)).toMatchObject({ current: 'icon-circle', points: 450, lifetimePoints: 850 })
  })

  it('reports no expiring points when the oldest window entry is recent', () => {
    const s = summarizeLedger(program, [{ action: 'join', points: 100, createdAt: '2025-01-01T00:00:00.000Z' }], now)
    expect(s).toMatchObject({ points: 100, lifetimePoints: 100, expiring: null })
    expect(summarizeLedger(program, [], now)).toMatchObject({ points: 0, lifetimePoints: 0, expiring: null })
  })

  it('checks level requirements against the recent ledger', () => {
    const req: LevelRequirement = { action: 'service', withinMonths: 12, label: RS_LABEL }
    const at = (iso: string, action = 'service'): PointsRow[] => [{ action, points: 300, createdAt: iso }]
    expect(requirementMet(at('2025-11-10T10:00:00.000Z'), req, now)).toBe(true)
    expect(requirementMet(at('2025-10-10T10:00:00.000Z'), req, now)).toBe(true)
    expect(requirementMet(at('2025-09-10T10:00:00.000Z'), req, now)).toBe(false)
    expect(requirementMet(at('2026-05-10T10:00:00.000Z', 'event'), req, now)).toBe(false)

    const rows: PointsRow[] = [
      { action: 'trade_in', points: 5000, createdAt: '2026-06-01T10:00:00.000Z' },
      { action: 'service', points: 200, createdAt: '2025-06-01T10:00:00.000Z' },
    ]
    const blocked = levelProgress(program, summarizeLedger(program, rows, now))
    expect(blocked).toMatchObject({ current: 's-line-club', points: 5200, blockedBy: RS_LABEL })
    const serviced = [...rows, { action: 'service', points: 300, createdAt: '2026-09-01T10:00:00.000Z' }]
    expect(levelProgress(program, summarizeLedger(program, serviced, now))).toMatchObject({
      current: 'rs-vanguard',
      blockedBy: null,
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

  it('reads points by kind', () => {
    const service = getAction(program, 'service')
    expect(pointsFor(service, 'tagliando')).toBe(300)
    expect(pointsFor(service, 'gomme')).toBe(100)
    expect(pointsFor(service, 'check_invernale')).toBe(100)
    expect(pointsFor(service, 'sconosciuto')).toBe(service.points)
    expect(pointsFor(service)).toBe(service.points)
    const session = getAction(program, 'session')
    expect(pointsFor(session, 'dealer')).toBe(150)
    expect(pointsFor(session, 'driving_experience')).toBe(250)
  })

  it('doubles the kind points for vehicles older than 2 years', () => {
    expect(vehicleAgeYears(2021, now)).toBe(5)
    const tagliando = computeAward(program, { type: 'service', now, kind: 'tagliando', vehicleYear: 2021 })
    expect(tagliando).toMatchObject({ points: 600, multiplied: true, factor: 2, notice: null })
    expect(computeAward(program, { type: 'service', now, kind: 'gomme', vehicleYear: 2021 }).points).toBe(200)
    expect(computeAward(program, { type: 'service', now, kind: 'check_invernale', vehicleYear: 2023 }).points).toBe(200)
    // Boundary: exactly 2 years is not "older than 2".
    expect(computeAward(program, { type: 'service', now, kind: 'tagliando', vehicleYear: 2024 }).points).toBe(300)
    const recent = computeAward(program, { type: 'service', now, kind: 'gomme', vehicleYear: 2025 })
    expect(recent).toMatchObject({ points: 100, multiplied: false, factor: 1 })
  })

  it('gives sessions their kind points', () => {
    expect(computeAward(program, { type: 'session', now, kind: 'dealer' }).points).toBe(150)
    expect(computeAward(program, { type: 'session', now, kind: 'driving_experience' }).points).toBe(250)
  })

  it('gives flat points for accessory, merch, trade-in, event and charging', () => {
    expect(computeAward(program, { type: 'accessory', now })).toMatchObject({ points: 100, notice: null })
    expect(computeAward(program, { type: 'merch', now })).toMatchObject({ points: 50, notice: null })
    expect(computeAward(program, { type: 'trade_in', now })).toMatchObject({ points: 1000, notice: null })
    expect(computeAward(program, { type: 'event', now })).toMatchObject({ points: 100, notice: null })
    expect(computeAward(program, { type: 'charging', now })).toMatchObject({ points: 25, notice: null })
  })

  it('never scales flat actions with the vehicle or anything else but the action', () => {
    const flat: ActionType[] = ['accessory', 'merch', 'trade_in', 'event', 'charging']
    for (const type of flat) {
      const expected = getAction(program, type).points
      const award = computeAward(program, { type, now, vehicleYear: 2010, thisMonth: 0, thisYear: 0 })
      expect(award).toMatchObject({ points: expected, multiplied: false, factor: 1, inviterPoints: 0 })
    }
  })

  it('caps merch at 4 rewarded purchases per month', () => {
    expect(computeAward(program, { type: 'merch', now, thisMonth: 3 }).points).toBe(50)
    const capped = computeAward(program, { type: 'merch', now, thisMonth: 4 })
    expect(capped.points).toBe(0)
    expect(capped.notice).toContain('4')
    expect(capped.notice).toContain('Audi Collection')
  })

  it('rewards charging once a month', () => {
    expect(getAction(program, 'charging').description).toContain('almeno 4 ricariche Audi nel mese')
    expect(computeAward(program, { type: 'charging', now, thisMonth: 0 }).points).toBe(25)
    const capped = computeAward(program, { type: 'charging', now, thisMonth: 1 })
    expect(capped.points).toBe(0)
    expect(capped.notice).toBe(ENGINE_COPY.notice.chargingCap)
    expect(capped.notice).toContain('mese')
  })

  it('caps events at 6 per calendar year', () => {
    expect(computeAward(program, { type: 'event', now, thisYear: 5 }).points).toBe(100)
    const capped = computeAward(program, { type: 'event', now, thisYear: 6 })
    expect(capped.points).toBe(0)
    expect(capped.notice).toBe("Hai già 6 eventi premiati quest'anno.")
  })

  it('ignores counts for actions without a cap', () => {
    expect(computeAward(program, { type: 'accessory', now, thisMonth: 99, thisYear: 99 }).points).toBe(100)
    expect(computeAward(program, { type: 'event', now, thisMonth: 99 }).points).toBe(100)
  })

  it('grants the trade-in only once per vehicle', () => {
    expect(getAction(program, 'trade_in').oncePerVehicle).toBe(true)
    expect(computeAward(program, { type: 'trade_in', now, alreadyTradedIn: false }).points).toBe(1000)
    const again = computeAward(program, { type: 'trade_in', now, alreadyTradedIn: true })
    expect(again.points).toBe(0)
    expect(again.notice).toBe('Hai già ricevuto i punti per la permuta di questa Audi.')
  })

  it('grants the first Audi to secondary drivers only, once, with points for the inviter', () => {
    const first = computeAward(program, { type: 'first_audi', now, roles: ['secondary'] })
    expect(first).toMatchObject({ points: 1000, inviterPoints: 500, notice: null })
    for (const roles of [['key'], ['key', 'secondary'], []] as const) {
      const award = computeAward(program, { type: 'first_audi', now, roles })
      expect(award).toMatchObject({ points: 0, inviterPoints: 0, notice: ENGINE_COPY.notice.firstAudiSecondaryOnly })
    }
    const again = computeAward(program, { type: 'first_audi', now, roles: ['secondary'], alreadyHadFirstAudi: true })
    expect(again).toMatchObject({ points: 0, inviterPoints: 0, notice: ENGINE_COPY.notice.alreadyFirstAudi })
  })

  it('grants the anniversary once a year', () => {
    expect(computeAward(program, { type: 'anniversary', now, thisYear: 0 }).points).toBe(200)
    const again = computeAward(program, { type: 'anniversary', now, thisYear: 1 })
    expect(again).toMatchObject({ points: 0, notice: ENGINE_COPY.notice.anniversaryDone })
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
    expect(ledgerLabel(program, 'charging', {})).toBe('Ricariche Audi del mese')
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

  it('labels the first Audi on both sides and the anniversary', () => {
    expect(ledgerLabel(program, 'first_audi', { side: 'invitee', inviterName: 'Paolo Bianchi' })).toBe('La tua prima Audi')
    expect(ledgerLabel(program, 'first_audi', {})).toBe('La tua prima Audi')
    expect(ledgerLabel(program, 'first_audi', { side: 'inviter', name: 'Luca Bianchi' })).toBe(
      'Luca Bianchi ha preso la sua prima Audi',
    )
    expect(ledgerLabel(program, 'anniversary', {})).toBe('Un anno in Audi with you')
  })
})

describe('checkBooking', () => {
  // Small synthetic program: booking rules must not depend on the content of program.it.json.
  const base = program.levels[0]
  const synthetic: Program = {
    ...program,
    levels: [
      { ...base, id: 'low', name: 'Livello base', threshold: 0, requires: undefined, rewards: [] },
      {
        ...base,
        id: 'mid',
        name: 'Livello medio',
        threshold: 100,
        requires: undefined,
        rewards: [
          {
            id: 'mid-day',
            title: 'Giornata in montagna',
            description: 'Prova',
            kind: 'experience',
            limited: true,
            claim: {
              cta: 'Prenota',
              options: [
                { id: 'hub', label: "Scegli l'hub", choices: ['Nord', 'Sud'] },
                { id: 'data', label: 'Scegli la data', choices: ['Sabato', 'Domenica'] },
              ],
              seatsPerChoice: 2,
              confirmation: 'Ci vediamo lì.',
            },
          },
          {
            id: 'mid-kit',
            title: 'Kit di benvenuto',
            description: 'Prova',
            kind: 'welcome_kit',
            claim: {
              cta: 'Ritira in concessionaria',
              options: [{ id: 'concessionaria', label: 'Scegli la concessionaria', choices: ['Treviso', 'Padova'] }],
              confirmation: 'Ti aspettiamo.',
            },
          },
          { id: 'mid-card', title: 'Tessera', description: 'Prova', kind: 'recognition' },
        ],
      },
    ],
  }
  const day = { hub: 'Sud', data: 'Domenica' }
  const input = { levelId: 'mid', rewardId: 'mid-day', choices: day, alreadyBooked: false, seatsTakenForFirstChoice: 0 }

  it('accepts a valid booking and returns the unlocking level and the first choice', () => {
    const ok = checkBooking(synthetic, { ...input, choices: { hub: ' Sud ', data: 'Domenica', extra: 'x' } })
    expect(ok).toMatchObject({ ok: true, levelId: 'mid', firstChoice: 'Sud', seatsPerChoice: 2, choices: day })
    expect(checkBooking(synthetic, { ...input, seatsTakenForFirstChoice: 1 }).ok).toBe(true)
    const kit = checkBooking(synthetic, { ...input, rewardId: 'mid-kit', choices: { concessionaria: 'Treviso' } })
    expect(kit).toMatchObject({ ok: true, firstChoice: 'Treviso', seatsPerChoice: null })
    // Unlimited rewards ignore the seat count.
    const busy = checkBooking(synthetic, {
      ...input,
      rewardId: 'mid-kit',
      choices: { concessionaria: 'Padova' },
      seatsTakenForFirstChoice: 999,
    })
    expect(busy.ok).toBe(true)
  })

  it('rejects a level not reached with 403', () => {
    expect(checkBooking(synthetic, { ...input, levelId: 'low' })).toEqual({
      ok: false,
      status: 403,
      error: 'level_not_reached',
      message: 'Si sblocca a Livello medio: continua a prenderti cura della tua Audi.',
    })
  })

  it('rejects a second booking and a sold out choice with 409', () => {
    expect(checkBooking(synthetic, { ...input, alreadyBooked: true })).toMatchObject({
      ok: false,
      status: 409,
      message: 'Hai già prenotato questo premio.',
    })
    expect(checkBooking(synthetic, { ...input, seatsTakenForFirstChoice: 2 })).toMatchObject({
      ok: false,
      status: 409,
      message: "Posti esauriti per questa data: scegline un'altra.",
    })
  })

  it('rejects missing or unknown choices and unknown rewards with 400', () => {
    expect(checkBooking(synthetic, { ...input, choices: { hub: 'Sud' } })).toMatchObject({
      ok: false,
      status: 400,
      error: 'choice_missing',
    })
    expect(checkBooking(synthetic, { ...input, choices: { hub: 'Est', data: 'Sabato' } })).toMatchObject({
      ok: false,
      status: 400,
      error: 'choice_invalid',
    })
    expect(checkBooking(synthetic, { ...input, rewardId: 'nope' })).toMatchObject({ ok: false, status: 400 })
    expect(checkBooking(synthetic, { ...input, rewardId: 'mid-card' })).toMatchObject({
      ok: false,
      status: 400,
      error: 'not_bookable',
    })
  })

  it('counts seats left per first choice', () => {
    const claim = synthetic.levels[1].rewards[0].claim
    if (!claim) throw new Error('missing claim')
    expect(seatsLeftByChoice(claim, { Sud: 1 })).toEqual({ Nord: 2, Sud: 1 })
    expect(seatsLeftByChoice(claim, { Nord: 5 })).toEqual({ Nord: 0, Sud: 2 })
    const kitClaim = synthetic.levels[1].rewards[1].claim
    if (!kitClaim) throw new Error('missing claim')
    expect(seatsLeftByChoice(kitClaim, {})).toBeNull()
  })

  it('lets S line Club book the Dolomiti day of the demo, not quattro Circle', () => {
    const dolomiti = {
      levelId: 's-line-club',
      rewardId: 'sline-dolomiti',
      choices: { hub: "Cortina d'Ampezzo", data: 'Sabato 30 gennaio 2027' },
      alreadyBooked: false,
      seatsTakenForFirstChoice: 0,
    }
    expect(checkBooking(program, dolomiti)).toMatchObject({ ok: true, levelId: 's-line-club', firstChoice: "Cortina d'Ampezzo" })
    expect(checkBooking(program, { ...dolomiti, levelId: 'quattro-circle' })).toMatchObject({
      ok: false,
      status: 403,
      message: 'Si sblocca a S line Club: continua a prenderti cura della tua Audi.',
    })
  })
})
