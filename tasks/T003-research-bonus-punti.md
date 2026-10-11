---
id: T003
title: Ricerca sui bonus utilizzabili nel sistema a punti (Audi e marchi premium)
status: done
owner: Evelyn
executor: claude
branch: testing
scope: knowledge/research/brief4/bonus-reward.md, knowledge/research/brief4/fonti-verificate.md, knowledge/research/brief4/README.md, tasks/T003-research-bonus-punti.md, tasks/BOARD.md
depends_on: T001
---

# T003: Ricerca sui bonus utilizzabili nel sistema a punti

## Contesto
Il Brief 4 chiede meccaniche a punti e reward rilevanti per gli under 35, senza sconti né logiche promozionali e senza reward non sostenibili. Serve una mappa dei bonus che Audi e gli altri marchi premium già usano, per scegliere i nostri senza riciclare e senza violare i Don't. Leggere prima `knowledge/fixed/brief.md` (Brief 4 e Don't) e `knowledge/research/brief4/findings.md`.

## Passi
1. Ricerca dei reward usati da Audi (Italia ed estero) e dai marchi premium (BMW, Mercedes, Porsche, Volvo, Polestar, Tesla, Lexus, Genesis, Land Rover, CUPRA).
2. Classificazione per tipo di bonus, con fonte verificata per ogni fatto.
3. Filtro contro il brief: ammesso, da adattare, escluso.
4. Shortlist di bonus per il nostro sistema a punti, legata agli asset Audi italiani.

## Acceptance
- [x] `knowledge/research/brief4/bonus-reward.md` con tabella dei bonus esistenti, filtro brief e shortlist
- [x] Ogni fatto ha una fonte raggiungibile registrata in `fonti-verificate.md`
- [x] Nessun file modificato fuori da `scope`

## Verify
```
npm run check --if-present
```

## Blockers
Nessuno.
