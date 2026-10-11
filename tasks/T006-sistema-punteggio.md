---
id: T006
title: Sistema di punteggio a 4 tier (finestra di 3 anni) e pulizia dei dati in conflitto con il pitch
status: done
owner: Evelyn
executor: claude
branch: testing
scope: knowledge/research/brief4/sistema-punteggio.md, knowledge/research/brief4/verifica.md, knowledge/research/brief4/fonti-verificate.md, pitch/script.md, pitch/outline.md, pitch/kpi-brief4.md, pitch/qa-giuria-brief4.md, tasks/T006-sistema-punteggio.md, tasks/T002-kit-preproduzione.md, tasks/T004-audi-with-you-build.md, tasks/BOARD.md
depends_on: T003, T005
---

# T006: Sistema di punteggio e pulizia dei dati in conflitto

## Contesto
La tab "sistema punti" del Google Doc definisce 4 tier (Icon Circle, quattro Circle, S line Club, RS Vanguard). Decisione del team: contano solo i punti degli ultimi 3 anni, quelli più vecchi si annullano. Servono il punteggio di ogni azione, di ogni premio o experience e la soglia di ogni tier, con un criterio preso da altri settori. Insieme si tolgono dai file del pitch i dati superati che contraddicono il copione (T005).

## Passi
1. Proposta in `knowledge/research/brief4/sistema-punteggio.md` e nella tab "sistema punti" del Doc (in suggerimento).
2. Copione del pitch aggiornato a 4 tier (repo e tab Pitch).
3. Pulizia dei dati superati in `pitch/outline.md`, `pitch/kpi-brief4.md`, `pitch/qa-giuria-brief4.md`, `knowledge/research/brief4/verifica.md` (file di T002, già in review).
4. Nota in T004: il prototipo ha ancora 3 livelli e "i punti non si spendono".

## Acceptance
- [x] Tabelle: punti per azione, punti per premio ed experience, soglie dei 4 tier, criterio motivato con fonti
- [x] Nessun tier ottenibile comprando un modello, nessuna supervalutazione della permuta, nessuno sconto
- [x] Copione e tab Pitch con 4 tier; nessun dato eliminato in T001 rimasto nei file del pitch

## Verify
```
npm run check --if-present
```

## Blockers
Nessuno.
