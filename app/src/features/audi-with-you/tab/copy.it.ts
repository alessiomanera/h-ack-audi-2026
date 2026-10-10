// UI copy of the simplified mobile view (TabView), in Italian.
// Program data (level names, rewards, action titles) comes from program.it.json.
export const tabCopy = {
  frame: {
    caption: 'Vista mobile: la sezione Audi with you dentro myAudi',
    note: "Una vista semplice, da usare con un pollice. Livelli, premi e storico completi sono nella versione completa.",
    link: 'Vai alla versione completa',
  },
  anonymous: {
    intro: "Audi with you riconosce chi guida un'Audi, non solo chi l'ha comprata. Entra e fai crescere il tuo livello.",
    discover: 'Come funziona il programma',
  },
  loading: 'Caricamento in corso',
  header: {
    greeting: (name: string) => `Ciao ${name}`,
    vehicle: (model: string, year: number, role: string) => `${model} del ${year}, ${role}`,
    roles: { key: 'titolare', secondary: 'utente secondario' },
    logout: 'Esci',
    logoutError: 'Non è stato possibile uscire. Riprova.',
  },
  next: {
    title: 'Prossimo traguardo',
    topLabel: 'Traguardo raggiunto',
    remaining: (points: string) => `ancora ${points} punti`,
    topTitle: 'Sei al livello più alto',
    topBody: 'Tutti i premi del tuo livello sono attivi. Livello e storico ti seguono anche nella tua prossima Audi.',
  },
  actions: {
    title: 'Cosa puoi fare',
    points: (points: string) => `+${points} punti`,
    more: {
      title: 'Altri modi per fare punti',
      hint: 'Punti fissi per ogni azione, mai in base agli euro spesi.',
    },
    service: {
      doubled: 'Punti doppi',
      perVisit: (points: string) => `${points} punti a ogni passaggio in officina ufficiale`,
      courtesyTitle: 'La tua auto di cortesia a questo livello',
      courtesyMissing: "Aggiungi la tua Audi in myAudi per vedere l'auto di cortesia.",
      how: 'Il passaggio lo prenoti come sempre con la tua officina Audi. I punti arrivano da soli dopo la visita.',
      close: 'Ho capito',
    },
    family: {
      keyTitle: 'Invita in famiglia',
      keyBody: (points: string) => `+${points} punti a te e a chi entra`,
      button: 'Invita',
      full: 'Famiglia al completo',
      slots: (used: number, max: number) => `${used} di ${max} posti usati`,
      memberTitle: 'La tua famiglia',
      memberOf: (name: string) => `Sei nella famiglia di ${name}`,
      memberFallback: "Guidi l'Audi di famiglia",
      memberBody: 'Il tuo livello è solo tuo.',
    },
  },
  ledger: {
    title: 'Ultimi punti',
    empty: 'Ancora nessun punto: il primo arriva con il benvenuto.',
    points: (points: string) => `+${points}`,
    windowHint: 'Contano i punti degli ultimi 3 anni',
    expiring: (points: string, days: number) => `${points} punti escono dal conteggio tra ${days} giorni`,
  },
  bookings: {
    title: 'Le tue prenotazioni',
    empty: 'Ancora nessuna prenotazione.',
    code: (code: string) => `Codice ${code}`,
    noPointsSpent: 'Prenotare non consuma punti.',
  },
  cta: {
    button: 'Apri la versione completa',
    hint: 'Livelli, premi, famiglia e storico completo',
  },
  footer: 'Demo: dati di fantasia',
  prototypeNote: 'Prototipo H-ACK 2026: persone, punti, date e posti sono dimostrativi. Premi e partnership sono proposte.',
} as const
