// Italian copy for reward bookings, the rolling points window and the myAudi phone chrome.
// Short affirmative sentences, no dashes as punctuation. Booking never spends points.
export const bookingCopy = {
  level: {
    windowLabel: (years: number) => `Punti degli ultimi ${years} anni`,
    blockedBy: (level: string, requirement: string) => `Per ${level} serve anche ${requirement}`,
    expiring: (points: string, days: number) => `${points} punti escono dal conteggio entro ${days} giorni`,
    requires: (requirement: string) => `Serve anche ${requirement}`,
  },

  reward: {
    locked: (level: string) => `Si sblocca a ${level}`,
    booked: 'Prenotato',
    codeLabel: 'Codice',
  },

  dialog: {
    eyebrow: 'Premio del tuo livello',
    seatsLeft: (seats: number) => (seats === 1 ? 'Resta 1 posto' : `Restano ${seats} posti`),
    soldOut: 'Posti finiti',
    summary: 'La tua scelta',
    free: 'Prenotare non consuma punti.',
    confirming: 'Un attimo',
    doneEyebrow: 'Prenotazione confermata',
    alreadyEyebrow: 'Hai già prenotato',
    codeLabel: 'Il tuo codice',
    codeHint: 'Lo ritrovi sempre in "I tuoi premi".',
    noPointsSpent: (points: string) => `Nessun punto speso: i tuoi ${points} punti restano tuoi.`,
    close: 'Chiudi',
    ticketsLabel: 'Biglietti',
    ticketsHint: 'Uno per ogni persona sul tuo account',
    ticketsRow: (n: number) => (n === 1 ? '1 persona' : `${n} persone`),
    qrHint: "Mostralo all'ingresso",
    qrLabel: (code: string) => `QR code della prenotazione ${code}`,
    shippingTitle: 'Spedizione confermata',
    shippingTo: "All'indirizzo del tuo profilo myAudi",
    shippingEta: 'Arriva entro 5 giorni lavorativi',
    errors: {
      forbidden: 'Questo premio si sblocca a un livello che non hai ancora raggiunto.',
      conflict: 'Hai già prenotato questo premio, oppure i posti sono finiti.',
      badChoice: 'Scegli un valore per ogni opzione.',
    },
  },

  concierge: {
    cta: 'Contatta il concierge',
    body: 'Nel servizio reale ti risponde una persona della tua concessionaria, per cambi di data, accessi e domande.',
    prototype: 'Prototipo: nessun messaggio viene inviato.',
  },

  myBookings: {
    title: 'I tuoi premi',
    intro: 'Quello che hai prenotato con il tuo livello. I punti restano tuoi.',
    nav: 'Premi',
    empty: 'Quando raggiungi un livello, qui trovi i premi che prenoti. Prenotare non consuma punti.',
    bookedOn: (date: string) => `Prenotato il ${date}`,
    codeLabel: 'Codice',
    showQr: 'Mostra il QR',
    hideQr: 'Nascondi il QR',
    shipped: 'Spedizione confermata, entro 5 giorni lavorativi',
  },

  levelRewards: {
    title: 'Premi del tuo livello',
    hint: 'Prenoti quando vuoi. I punti restano tuoi.',
  },

  demo: {
    firstAudiHint: 'solo guidatore invitato',
  },

  phone: {
    subtitle: 'myAudi',
    profile: 'Profilo',
    navLabel: 'Menu myAudi',
    nav: {
      car: 'Veicolo',
      navigation: 'Navigazione',
      voice: 'Assistente vocale',
      program: 'Audi with you',
      discover: 'Scopri Audi',
      shop: 'Negozio',
    },
  },

  history: {
    lifetime: (points: string) => `Da sempre: ${points} punti`,
    window: (years: number) => `Il livello conta i punti degli ultimi ${years} anni.`,
  },

  earn: {
    yearlyCap: (cap: number) => `Max ${cap} all’anno`,
    inviterPoints: (points: string) => `+${points} a chi ti ha invitato`,
    kindPoints: (label: string, points: string) => `${label}: +${points}`,
    kinds: {
      tagliando: 'Tagliando',
      gomme: 'Cambio gomme',
      check_invernale: 'Check invernale',
      dealer: 'Sessione in concessionaria',
      driving_experience: 'Audi driving experience',
    } as Record<string, string>,
  },

  service: {
    upTo: (points: string) => `fino a +${points} punti`,
  },
} as const
