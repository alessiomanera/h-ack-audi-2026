# Palette e tipografia del progetto

Fonte unica dei valori: [`tokens.json`](tokens.json). Questo file la spiega.

## Perché questa palette

Sono i colori ufficiali dell'**Audi Revolut F1 Team** (letti dal CSS di audif1.com, variabili `--color-af1-*`). Tre motivi:

1. **Il motorsport è il filo rosso del brief**, e la F1 è l'espressione più recente e più giovane della filosofia Audi "clarity".
2. **Ci distingue dai vicini**: niente rame e nero (CUPRA), niente blu (BMW).
3. **Non sono colori inventati**: sono quelli che Audi usa oggi. In giuria si riconoscono.

Regola d'oro: **scuro di base, un solo elemento rosso per schermata o slide.**

## I colori

| Nome | Hex | Uso |
|---|---|---|
| Carbon | `#161616` | sfondo pagina |
| Graphite | `#2B2929` | card e superfici; testo su chiaro |
| Graphite hover | `#423F3F` | linee sottili; testo secondario su chiaro |
| Grey 03 | `#767373` | solo disabilitato o decorativo, mai testo |
| Titanium | `#B3AFAF` | testo secondario su scuro |
| Grey 01 | `#E0DDDD` | bordi su chiaro |
| Chalk | `#F5F2F2` | testo su scuro; sfondo chiaro |
| White | `#FFFFFF` | testo dei bottoni rossi |
| **Lava** | `#FF2D00` | **l'unico accento**: numero chiave, stato attivo, linea sottile |
| Lava ink | `#D72600` | bottoni rossi con testo bianco; testo rosso su chiaro |

## Contrasti (WCAG, calcolati)

| Coppia | Rapporto | Esito |
|---|---|---|
| Chalk su Carbon | 16,3 | ottimo |
| Chalk su Graphite | 13,0 | ottimo |
| Titanium su Graphite | 6,7 | AA |
| Lava su Carbon | 4,85 | AA, ok per testo |
| White su Lava ink | 5,0 | AA, ok per bottoni |
| Lava su Graphite | 3,9 | solo testo grande |
| White su Lava | 3,7 | solo testo grande |
| Lava su Chalk | 3,35 | solo testo grande: usare Lava ink |
| Grey 03 su Graphite | 3,1 | mai per testo |

## Tipografia

- **Titoli: Archivo** (SemiBold o Bold, allineati a sinistra). La larghezza "Expanded" richiama Audi Type Extended.
- **Testo: Inter** (Regular).
- Etichette piccole in maiuscolo con spaziatura +8%.
- Entrambi gratuiti (Google Fonts) e presenti in Canva.
- Audi Type è proprietario e non è incluso in questa repo: il deploy del giorno lo usava (brand kit degli organizzatori), qui restano Archivo e Inter.

## Stile

- Molto spazio vuoto, griglia a 12 colonne, un messaggio per slide.
- Linee da 1px in Graphite hover. Niente gradienti, glow, neon, ombre.
- Foto: auto o dettagli motorsport, scure, luce da studio. Preferire foto reali Audi alle immagini generate.

## Variante chiara

Sfondo Chalk, testo Graphite, testo secondario Graphite hover, accento Lava ink.
