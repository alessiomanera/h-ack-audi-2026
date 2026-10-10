---
id: T001
title: Deep research Brief 4 panorama loyalty e stato dell'arte
status: done
owner: Alessio
executor: antigravity
branch: testing
scope: knowledge/research/brief4/**, tasks/T001-research-brief4.md, tasks/BOARD.md
depends_on:
---

# T001: Deep research Brief 4: panorama loyalty e stato dell'arte

## Contesto
Ricerca approfondita sul panorama attuale della fidelizzazione Audi, competitor premium, benchmark under 35 fuori dall'automotive, fallimenti recenti, dati sul target italiano, asset Audi, vincoli normativi (DPR 430/2001, GDPR) e KPI per supportare la sessione di concept del team.

## Passi
1. Configurazione task e board.
2. Analisi fonti interne (brief.md, jury.md, briefing team).
3. Esecuzione ricerche web su aree A-H con rigore su fatti vs inferenze e verifica fonti primarie.
4. Consegna parziale minuto 30.
5. Completamento report in knowledge/research/brief4/ (README.md, findings.md, esiste-gia.md, spazi-bianchi.md, fonti-verificate.md).
6. Consegna finale minuto 60.

## Acceptance
- [x] Cartella knowledge/research/brief4 creata con README.md, findings.md, esiste-gia.md, spazi-bianchi.md, fonti-verificate.md (ex sources.md)
- [x] Findings A-H strutturati con ID, fatto, fonte, data, affidabilita, inferenza, flag
- [x] Nessuna violazione dei Don't di brief senza opportuno flag [DON'T]
- [x] Nessun file modificato fuori da `scope`

## Verify
```
cmd /c npm run check
```

## Blockers
Nessun blocco attualmente riscontrato.

## Review
**Esito: accettato con correzioni** (Evelyn, 10/10/2026).
- Ogni link è stato verificato: 13 su 35 davano 404 e sono stati sostituiti con fonti raggiungibili; registro unico in `knowledge/research/brief4/fonti-verificate.md` (ex `sources.md`).
- Tolto tutto ciò che non aveva una fonte: date di pubblicazione inventate, prezzi della driving experience, servizio express in 90 minuti, partner alberghieri Audi USA, Circle of Excellence Mercedes, "oltre il 70% della Gen Z preferisce le esperienze", "8% contro 25%" sull'elettrico, "1,7 milioni" di auto tra privati.
- Eliminate le schede **G02** (presunte esenzioni dell'art. 6 DPR 430/2001 per status ed eventi: il testo non le prevede) e **H02** (NPS senza fonte).
- Corretti: E02 (56,3% tra privati **o aziende**, gennaio-maggio 2026), E03 (quota privati NLT 20,9% nel 2025, non 22,1%), E05 (LexisNexis Mid-Year 2025, dato USA), H01 (tolto il 51,1%, non presente nella fonte S&P), B06 (CUPRA Tribe non è attivo in Italia), C07 (My Dolomiti: niente badge né sorteggi nella fonte), A01 (procedura myAudi documentata in Irlanda e USA, da confermare per l'Italia).

