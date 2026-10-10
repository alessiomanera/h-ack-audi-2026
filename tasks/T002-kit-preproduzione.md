---
id: T002
title: Kit pre-produzione Brief 4 verifica numeri, outline 10 slide, KPI, QA giuria
status: doing
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
- [ ] Tabella di verifica numeri completa in `knowledge/research/brief4/verifica.md` con verdetti e frasi pronte per slide
- [ ] Analisi controesempi su affermazioni assolute documentata
- [ ] `pitch/outline.md` riscritta con max 10 slide, timing 5:00, criteri giuria e dati verificati
- [ ] `pitch/kpi-brief4.md` con 10-12 KPI divisi nei 4 gruppi sui canali esistenti
- [ ] `pitch/qa-giuria-brief4.md` con 3 domande per giurato/mentor e prove utili collegate
- [ ] Nessun file modificato fuori da `scope`

## Verify
```
cmd /c npm run check
```

## Blockers
Nessun blocco attualmente riscontrato.
