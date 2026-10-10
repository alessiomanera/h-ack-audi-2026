---
id: T007
title: Catalogo esperienze e prenotazione premi (biglietti, QR, spedizione, concierge)
status: doing
owner: Alessio
executor: claude
branch: testing
scope: app/**, tasks/T007-*.md
depends_on: T004
---

# T007: Catalogo esperienze e prenotazione premi

## Contesto
Richiesta di Alessio (10/10, 15:45): nella demo l'utente sceglie un'esperienza da un catalogo e la prenota fino alla conferma. I punti non si spendono mai: prenotare non consuma punti. La demo per la giuria usa l'evento sci (il presidente, Dolomiti Superski). Partire da T004 già fatto: contratto in `app/src/shared/types.ts` (RewardClaimConfig, RewardBooking, BookingRequest, RewardAvailability, POST /api/bookings, GET /api/rewards/:id/availability), `app/worker/bookings.ts`, `shared/BookingDialog.tsx`, `shared/MyBookings.tsx`, `shared/qr.ts` + `QrCode.tsx` (encoder QR senza dipendenze).

## Passi
1. **Contratto (`types.ts`, a mano).** Aggiungere `DeliveryKind = 'qr' | 'shipping'`, `RewardClaimConfig.delivery` e `tickets?`, `ProgramExperience.claim?`, `RewardBooking.itemKind / tickets / delivery / qrPayload / shipping`, `BookingRequest.tickets?`, `RewardAvailability.maxTickets`.
2. **Catalogo (`program.it.json`, `experiences.items`).** Almeno 7 esperienze, 3 prenotabili con `claim`:
   - **`dolomiti`**, "Una giornata Audi sulle Dolomiti", minLevel `s-line-club`. È la demo sci. Contenuto: accoglienza e lounge nell'hub Audi, deposito sci, un modulo di Audi driving experience su neve.
     - opzione `hub`: Cortina d'Ampezzo, Alta Badia, Madonna di Campiglio;
     - opzione `data`: sabato 16 gennaio 2027, sabato 30 gennaio 2027, sabato 13 febbraio 2027;
     - `seatsPerChoice` 20, `tickets` true, `delivery` qr;
     - nota "Servizi sulle piste da definire con Dolomiti Superski".
   - **`neve-ghiaccio`**, "Audi driving experience su neve e ghiaccio", minLevel `quattro-circle`, con data, posti, biglietti e QR.
   - **`conosci`**, "Conosci la tua Audi" in concessionaria, minLevel `icon-circle`, con concessionaria, data, biglietti e QR.
   - **Segnaposto** "Presto prenotabile", senza `claim`: Design Week (Audi Design Hub), atleti FISI (previa approvazione della FISI), eventi in concessionaria, "Nata all'H-ACK".
   - Se T004 ha messo `sline-dolomiti` tra i premi di S line Club, spostarlo nel catalogo come `dolomiti`.
3. **Premi di livello prenotabili.**
   - Kit di benvenuto (`icon-kit`, `quattro-kit`, `sline-kit`, `rs-kit`): `delivery` shipping, nessun biglietto.
   - `quattro-fasttrack` e `rs-wrap`: `delivery` qr, nessun biglietto.
4. **Worker.**
   - **Ricerca:** l'id della prenotazione si cerca tra i premi e tra le esperienze. Il livello minimo è quello del premio o il `minLevel` dell'esperienza.
   - **Biglietti:** da 1 a `maxTickets`, cioè il numero di persone del nucleo principale (titolare più guidatori invitati, almeno 1).
   - **Posti:** `seatsPerChoice` meno la somma dei biglietti già prenotati per la stessa prima scelta.
   - **QR:** `qrPayload` = `AWY|<code>|<id>|<tickets>`, senza dati personali.
   - **Spedizione:** `shipping` = `{ to: "all'indirizzo del tuo profilo myAudi", eta: "entro 5 giorni lavorativi" }`. Nessun indirizzo reale raccolto.
   - **Migrazione:** se la 0003 è già applicata in remoto, creare `0004_booking_tickets.sql` (ALTER TABLE bookings ADD COLUMN tickets, delivery, item_kind).
   - **Seed:** aggiungere un guidatore invitato a Giulia (Marco, senza PIN), così la prenotazione sci mostra 2 biglietti. Giulia resta a 2.350 punti nella finestra.
5. **UI.**
   - **Catalogo:** sezione "Esperienze" nel portale (griglia di card) e nella tab. Ogni card mostra il livello, "Prenota" se il livello è raggiunto, "Si sblocca a X" se non lo è, "Presto prenotabile" per i segnaposto.
   - **BookingDialog:**
     1. le opzioni (con "Restano N posti" sulla prima);
     2. il selettore biglietti da 1 a `maxTickets`, con l'etichetta "Uno per ogni persona sul tuo account";
     3. il riepilogo e la conferma;
     4. la conferma finale: per gli eventi un QR grande (`QrCode`) con il codice e "Mostralo all'ingresso"; per i gadget "Spedizione confermata" con l'indirizzo del profilo myAudi e i tempi. In entrambi i casi "Nessun punto speso".
   - **Concierge:** pulsante "Contatta il concierge" dopo la conferma e in "I tuoi premi". È un segnaposto: apre un dialog "Nel servizio reale ti risponde una persona della tua concessionaria", con il testo "prototipo".
   - **Dialog "Hai sbloccato":** elenca anche le esperienze del nuovo livello con "Prenota". Dopo F2 Giulia e F3 Paolo porta a `dolomiti`.
   - **"I tuoi premi":** mostra di nuovo il QR (o lo stato della spedizione) e il concierge.
   - **Stile:** nessun lava nei dialog.
6. Test: catalogo (7 card, 3 prenotabili), selettore biglietti limitato, QR presente nella conferma, spedizione per i kit, concierge, worker (biglietti oltre il massimo = 400, posti esauriti = 409). `npm run check` verde, `compliance.test.ts` verde.
7. Deploy (in ordine):
   ```
   cd app && cmd /c "npx vite build" && cmd /c "npx wrangler d1 migrations apply audi-with-you --remote" && cmd /c "npx wrangler deploy"
   ```
   Poi `curl -X POST https://audi-with-you.<account>.workers.dev/api/demo/reset`, aspettare circa 30 secondi (propagazione) e rifare il reset.

## Acceptance
- [ ] Catalogo con almeno 7 esperienze, 3 prenotabili, sul sito live
- [ ] Demo sci: Giulia (dopo F2) prenota "Una giornata Audi sulle Dolomiti" per 2 persone: QR leggibile da telefono, codice AWY, "Nessun punto speso", in "I tuoi premi"
- [ ] Paolo (dopo F3) prenota la stessa esperienza per sé e Luca (2 biglietti)
- [ ] Kit di benvenuto con conferma di spedizione a domicilio
- [ ] Pulsante concierge dopo la prenotazione e in "I tuoi premi"
- [ ] F1, F2 e F3 di T004 ancora verdi sul sito live
- [ ] Nessun file modificato fuori da `scope`

## Verify
```
cd app && cmd /c npm run check
```

## Blockers
(L'esecutore scrive qui se serve toccare file fuori da `scope`.)
