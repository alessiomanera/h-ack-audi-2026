# h-ack-audi-2026

Spazio di lavoro del team per **H-ACK | Co-Design the Future** (Audi x H-FARM, sabato 10 ottobre 2026). Qui stanno il prototipo, le regole condivise per gli agenti AI, la copia del Google Doc del team, la palette e il registro delle sessioni.

Repo **privata**. Tutto ciò che produciamo all'H-ACK è ceduto a Volkswagen Group Italia (regolamento, art. 10).

## Come lavoriamo

Il manuale operativo è la tab **WORKFLOW** del Google Doc del team, copiata in [`docs/WORKFLOW.md`](docs/WORKFLOW.md). Per iniziare: [`docs/ONBOARDING.md`](docs/ONBOARDING.md) (5 minuti).

| Cosa | Dove |
|---|---|
| Idee, ricerca, decisioni | Google Doc del team (copia in `knowledge/team-doc/`) |
| Codice, regole AI, palette, task, registro sessioni | questa repo |
| Presentazione | Canva |
| Foto, video, PDF, export | cartella Drive `H-ACK_AUDI_2026` |

## Struttura

| Percorso | Contenuto |
|---|---|
| `.agents/AGENTS.md` | regole comuni a tutti gli agenti AI (Claude, Antigravity, Gemini) |
| `.claude/` | impostazioni, hook e skill di Claude Code |
| `knowledge/` | fatti confermati (`fixed/`), copia del Google Doc (`team-doc/`), note e decisioni |
| `brand/` | palette, token, tono di voce, prompt Canva |
| `tasks/` | un file per task, con `scope` e criteri di accettazione; `BOARD.md` è generato |
| `pitch/` | struttura del pitch, script, registro uso AI |
| `scripts/` | sincronizzazione Google Doc, registro sessioni, privacy scan, utilità |
| `HISTORY.md` | registro automatico: chi ha chiesto cosa, quando, con quale strumento |

## Comandi

Una volta dopo il clone: `npm install` (attiva l'hook che blocca dati sensibili nei commit).

| Comando | Cosa fa |
|---|---|
| `npm run ship` | controlli + `git pull --rebase` + `git push` |
| `npm run align:git` | stato del repo locale rispetto a GitHub |
| `npm run log -- --tool <strumento> "prompt"` | aggiunge una riga a `HISTORY.md` (per strumenti diversi da Claude Code) |
| `npm run tasks:board` | rigenera `tasks/BOARD.md` |
| `npm run agents:sync` | rigenera `GEMINI.md` da `.agents/AGENTS.md` |
| `npm run privacy:scan` | controlla tutta la repo per segreti e dati personali |

In Claude Code basta scrivere **"allinea"** per sincronizzare repo locale, GitHub e Google Doc.

## Branch

`testing` per il lavoro di tutti i giorni, `main` solo per la versione che vede la giuria (via PR approvata da Alessio).
