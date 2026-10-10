---
id: T002
title: Kit pre-produzione Brief 4 verifica numeri, outline 10 slide, KPI, QA giuria
status: review
owner: Alessio
executor: antigravity
branch: testing
scope: knowledge/research/brief4/verifica.md, pitch/outline.md, pitch/kpi-brief4.md, pitch/qa-giuria-brief4.md, tasks/T002-kit-preproduzione.md, tasks/BOARD.md
depends_on: T001
---

# T002: Kit pre-produzione Brief 4: verifica numeri, outline 10 slide, KPI, Q&A giuria

## Contesto
Preparazione del kit di pre-produzione indipendente dall'idea per il Brief 4 (Fidelizzazione under 35), pronto per la produzione del prototipo e del deck alle 13:00. Include verifica puntuale delle fonti primarie, outline del pitch a 10 slide con timing, menu dei KPI a 6 mesi e Q&A simulato per la giuria e i mentor.

## Passi
1. Claim del task e aggiornamento BOARD.md.
2. Verifica analitica fonti e numeri (E01, E02, E03, E05, H01, H03, A01, A08, B01, B03, C06, C07, D01, D02, G01, G02, spazi bianchi 8% vs 25%, controesempi affermazioni assolute) in `knowledge/research/brief4/verifica.md`.
3. Commit parziale e ship al minuto 25.
4. Ristrutturazione scaletta pitch (max 10 slide, 5:00 min, criteri giuria, metriche verificate) in `pitch/outline.md`.
5. Definizione menu 10-12 KPI su canali esistenti (Retention, Advocacy, Partecipazione, Business) in `pitch/kpi-brief4.md`.
6. Generazione Q&A mirato per giurati e mentor in `pitch/qa-giuria-brief4.md`.
7. Consegna finale con status review, board update e ship.

## Acceptance
- [x] Tabella di verifica numeri completa in `knowledge/research/brief4/verifica.md` con verdetti e frasi pronte per slide
- [x] Analisi controesempi su affermazioni assolute documentata
- [x] `pitch/outline.md` riscritta con max 10 slide, timing 5:00, criteri giuria e dati verificati
- [x] `pitch/kpi-brief4.md` con 10-12 KPI divisi nei 4 gruppi sui canali esistenti
- [x] `pitch/qa-giuria-brief4.md` con 3 domande per giurato/mentor e prove utili collegate
- [x] Nessun file modificato fuori da `scope`

## Verify
```
cmd /c npm run check
```

## Blockers
- **Da Evelyn (review di T001, 10/10/2026), per Alessio:** la revisione di T001 ha tolto dati che `pitch/outline.md`, `pitch/kpi-brief4.md`, `pitch/qa-giuria-brief4.md` e `knowledge/research/brief4/verifica.md` usano ancora. Prima di produrre le slide:
  1. **G02 eliminata:** l'art. 6 del DPR 430/2001 non esenta "status, servizi immateriali ed eventi" (esclude concorsi per opere e studi, emittenti TV, sconti). Togliere G02 da outline slide 5, KPI (riga sul 20% di fideiussione), Q&A (righe 14 e 152) e la frase "Zero vincoli burocratici" della slide 8. Nel Q&A la risposta onesta è: "lo stiamo verificando con Jakala".
  2. **H01:** il 51,1% / 51,6% non compare nella fonte S&P Global (comunicato del 14/01/2026, che riporta solo vincitori e 13,6 milioni di immatricolazioni USA). Togliere da outline slide 2 e 9, KPI e Q&A.
  3. **E05:** lo studio LexisNexis è il Mid-Year **2025** (comunicato 21/10/2025), non 2024; sempre "dato USA".
  4. **E02:** "tra privati **o aziende**", gennaio-maggio 2026, non "direttamente tra privati".
  5. **E03:** quota privati NLT 2025 = 20,9% (non 22,1%; il 20,7% 2026 non ha fonte).
  6. **SB01 "8% contro 22-25%":** senza fonte verificata, tolto dagli spazi bianchi.
  7. **A01:** la procedura myAudi per l'usato da privato è documentata solo per Irlanda e USA; non scrivere "(Audi Italia, 2026)".
  Fonti aggiornate: `knowledge/research/brief4/fonti-verificate.md`.
- **Da Evelyn (T006, 10/10/2026):** le correzioni elencate sopra sono state applicate in T006: `pitch/outline.md` riscritta in linea con `pitch/script.md` (8 slide, 4 tier); da `pitch/kpi-brief4.md` tolti gli obiettivi a 6 mesi inventati e i benchmark H01, H02, G02; da `pitch/qa-giuria-brief4.md` e `knowledge/research/brief4/verifica.md` tolti G02, H01, H02, SB01 e corretti E02, E03, E05, A01.

