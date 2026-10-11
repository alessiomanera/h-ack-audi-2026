---
id: T004
title: Prototipo "Audi with you" (myAudi tab + portale web + Worker)
status: done
owner: Alessio
executor: claude
branch: testing
scope: app/**, tasks/T004-*.md, .github/workflows/**
depends_on: T003
---

# T004: Prototipo "Audi with you"

## Contesto
Prototipo cliccabile del Brief 4: una tab "Audi with you" dentro l'app myAudi (mockup in /app) che apre un portale web a pagina singola (/) con il programma completo. Punti che non si spendono, livelli che seguono la persona fino alla sua prossima Audi. Leggere prima `knowledge/decisions/2026-10-10-direzione-brief4.md` e `knowledge/decisions/2026-10-10-mentor-jakala-brief4.md`.

## Passi
1. Scaffold di `app/` come pacchetto npm separato (base: frontend di goodsoil, ripulito): Vite, React, TypeScript strict, Tailwind v4, shadcn/ui, Vitest, Cloudflare Vite plugin.
2. Contratto API in `app/src/shared/types.ts`, programma in `app/src/features/audi-with-you/program.it.json`.
3. Worker con API JSON sotto `/api`, D1 (utenti, sessioni, veicoli, membership, inviti, ledger), auth email + PIN, seed demo (famiglia Bianchi, Giulia).
4. Motore punti puro con test Vitest.
5. Portale web (/) e mockup myAudi (/app), pannello demo con `?demo=1`.
6. Deploy su workers.dev.

## Acceptance
- [ ] `/app` mostra il mockup myAudi con la tab "Audi with you" e il link al portale
- [ ] `/` mostra il portale con tutte le sezioni previste, dati dal Worker
- [ ] Login con email + PIN e "Accedi come" per le persone demo
- [ ] Pannello demo (`?demo=1`): service simulato mostra punti animati e auto di cortesia del livello
- [ ] Test Vitest del motore punti verdi, typecheck verde
- [ ] Nessuno sconto, credito in euro, estrazione, punti per km, riferimento F1; il prodotto non si chiama mai "app"
- [ ] URL workers.dev funzionante
- [ ] Modello T006 deciso da Alessio (10/10, ore 15:30): quattro livelli Icon Circle 0, quattro Circle 1.000, S line Club 2.500, RS Vanguard 5.000 (più un passaggio in officina negli ultimi 12 mesi); contano i punti degli ultimi 36 mesi; i punti si sommano e non si spendono mai; ordine e id solo da `program.it.json`
- [ ] Punti fissi per azione, mai per euro: tagliando 300, gomme e check 100 (x2 oltre 2 anni), sessione 150, driving experience 250, evento 100 (max 6 l'anno), ricarica 25 (una volta al mese), accessorio 100, Audi Collection 50 (max 4 al mese), permuta 1.000 (una volta per Audi), prima Audi del guidatore invitato 1.000 (+500 a chi l'ha invitato), anniversario 200, ingresso 100, invito 100 a entrambi
- [ ] Prenotazione premi senza spendere punti: almeno 3 flussi completi (kit di benvenuto, fast track in officina, giornata Audi sulle Dolomiti), con codice e "I tuoi premi"
- [ ] Premio bonus "Wrap personalizzato" a RS Vanguard (card chalk, immagine nascosta se manca), posti limitati per accesso anticipato
- [ ] Testi verificabili: asset Audi solo se nel brief, il resto come proposta; nota "prototipo, dati dimostrativi"
- [ ] LevelCard con quattro cerchi hairline (uno pieno per livello raggiunto), unico elemento lava della schermata
- [ ] F1 Luca (650): Tagliando +600, quattro Circle, "Mentre la tua A3 è in officina, guidi una A5"
- [ ] F2 Giulia (2.350): Accessorio + Evento, S line Club, "Hai sbloccato", prenotazione "Una giornata Audi sulle Dolomiti"
- [ ] F3 Paolo (1.700): Permuta +1.000, S line Club, "Livello e storico vengono con te sulla nuova Audi", "Prossimo traguardo: RS Vanguard" con il wrap
- [ ] Nessun file modificato fuori da `scope`

## Verify
```
cd app && cmd /c npm run check
```

## Blockers
(L'esecutore scrive qui se serve toccare file fuori da `scope`.)
- **Da Evelyn (T006, 10/10/2026), per Alessio:** il team ha fissato il sistema loyalty a **4 tier** (tab "sistema punti" del Doc): Icon Circle (0), quattro Circle (1.000), S line Club (2.500), RS Vanguard (5.000 e un passaggio in officina negli ultimi 12 mesi). **Contano solo i punti degli ultimi 36 mesi**, i più vecchi si annullano; gli stessi punti si **usano** per premi ed experience senza far scendere di livello. `program.it.json` ha ancora 3 livelli (Start, Plus, Vorsprung) e la regola "i punti non si spendono e non scadono": il copione del pitch (`pitch/script.md`) e la demo devono dire la stessa cosa. Punti per azione, soglie e prezzi dei premi: `knowledge/research/brief4/sistema-punteggio.md`.
- **Risposta di Alessio (10/10, ore 15:30):** adottato il modello T006 (soglie 1.000 / 2.500 / 5.000, requisito officina per RS Vanguard, finestra di 36 mesi, punti per azione) **senza punti spendibili**: i punti si accumulano e basta, prenotare un premio non consuma punti. Copione e research vanno allineati a questo.
