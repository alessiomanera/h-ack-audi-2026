// Italian messages returned by the Worker (ApiError.message, notices, persona taglines).
import type { PersonaId } from '../src/shared/types'

export const COPY = {
  errors: {
    notFound: 'Risorsa non trovata.',
    methodNotAllowed: 'Operazione non consentita.',
    internal: 'Qualcosa non ha funzionato. Riprova tra poco.',
    badJson: 'Richiesta non valida.',
    tooLarge: 'Richiesta troppo grande.',
    unauthorized: 'Accedi per continuare.',
    loginFailed: 'Email o PIN non corretti.',
    nameRequired: 'Scrivi il tuo nome.',
    nameTooLong: 'Il nome è troppo lungo.',
    emailInvalid: 'Scrivi un indirizzo email valido.',
    pinInvalid: 'Il PIN è fatto di 4 cifre.',
    emailTaken: 'Questa email è già registrata. Accedi con il tuo PIN.',
    vehicleRequired: 'Indica modello e anno della tua Audi.',
    vehicleModelInvalid: 'Scrivi il modello della tua Audi, per esempio A3.',
    vehicleYearInvalid: "Scrivi l'anno della tua Audi, per esempio 2021.",
    personaUnknown: 'Profilo demo non trovato.',
    actionUnknown: 'Azione non riconosciuta.',
    serviceKindInvalid: 'Tipo di intervento non riconosciuto.',
    sessionKindInvalid: 'Tipo di sessione non riconosciuto.',
    inviteNotFound: 'Invito non trovato.',
    inviteUsed: 'Questo invito è già stato usato.',
    inviteRevoked: 'Questo invito non è più valido.',
    inviteOwn: 'Non puoi accettare un invito che hai creato tu.',
    alreadyMember: 'Fai già parte di questa famiglia in myAudi.',
    slotsFull: 'Questa Audi ha già 5 utenti secondari: è il massimo in myAudi.',
    keyOnly: 'In myAudi solo il titolare può invitare.',
    noVehicle: 'Nessuna Audi collegata al tuo profilo.',
  },
  notices: {
    keyOnly: 'In myAudi solo il titolare può invitare.',
    slotsFull: 'Hai già 5 utenti secondari: è il massimo in myAudi.',
    noVehicle: 'Nessuna Audi collegata al tuo profilo.',
  },
  /** First names used when the demo simulates a family member joining. */
  defaultInviteeNames: ['Sara', 'Marco', 'Elena', 'Matteo', 'Chiara', 'Davide'],
  personas: {
    luca: '21 anni, guida la A3 di famiglia',
    giulia: '29 anni, la sua Q3 in leasing',
    paolo: 'Titolare della A3 di famiglia',
  } satisfies Record<PersonaId, string>,
} as const
