---
id: T004
title: Prototipo "Audi with you" (myAudi tab + portale web + Worker)
status: doing
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
- [ ] Nessun file modificato fuori da `scope`

## Verify
```
cd app && cmd /c npm run check
```

## Blockers
(L'esecutore scrive qui se serve toccare file fuori da `scope`.)
