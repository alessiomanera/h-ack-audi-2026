# Sistema di punteggio di Audi with you

Task [T006](../../../tasks/T006-sistema-punteggio.md) · Proposta di Evelyn (sessione Claude), 10/10/2026, da validare con il team. Parte dalla tab "sistema punti" del Google Doc (4 tier) e dalla decisione del team: **contano solo i punti degli ultimi 3 anni, quelli più vecchi si annullano**. I numeri dei punti sono una proposta di progetto, non dati: sono calibrati sui profili della demo (sezione 6).

> **Decisione del 10/10/2026, ore 15:30 (Alessio, T004).** Adottati i tier, le soglie, la finestra di 36 mesi e i punti per azione di questo documento, **senza punti spendibili**: i punti si sommano e basta, ogni livello sblocca premi ed esperienze che si prenotano senza consumare punti. Il "secondo contatore" e la sezione 4 (costo in punti dei premi) sono superati: restano qui come alternativa valutata e scartata. Il prototipo e il copione seguono la decisione.

## In breve

- **Un'azione, un contatore (decisione del 10/10).** Ogni punto guadagnato fa salire di **livello** e non si spende mai. I premi e le esperienze si sbloccano con il livello e si prenotano senza consumare punti.
- **Finestra mobile di 36 mesi.** Il livello si calcola sui punti degli ultimi 3 anni; ogni punto esce dal conteggio 36 mesi dopo essere stato guadagnato.
- **Si sale prendendosi cura dell'Audi, non comprando.** Nessun tier si ottiene acquistando un modello, nessuna spesa in euro dà punti.
- **Quattro tier:** Icon Circle (0), quattro Circle (1.000), S line Club (2.500), RS Vanguard (5.000).

---

## 1. Il criterio: perché due contatori e una finestra di 3 anni

Abbiamo confrontato quattro modelli usati in altri settori.

| Modello | Come funziona | Chi lo usa | Per noi |
|---|---|---|---|
| **Livello per spesa** | Il livello dipende da quanto spendi in un anno | Sephora Beauty Insider: VIB da 350 dollari l'anno, Rouge da 1.000 ([Beans](https://www.trybeans.com/blog/sephora-beauty-insider-loyalty-program-review)) | ❌ Escluso: è una logica di spesa, esclude gli under 35 e contraddice il Brief 4 |
| **Solo livello, punti non spendibili** | I punti servono solo a salire | Il prototipo attuale (T004) | ⚠️ Semplice, ma tra un livello e l'altro non c'è niente da scegliere |
| **Due contatori** | Punti per lo status, separati da quelli da spendere; spendere non toglie lo status | Miles & More dal 2024: lo status si ottiene con i Points, le miglia premio restano separate ([One Mile at a Time](https://onemileatatime.com/news/lufthansa-miles-more-changes/)); Marriott Bonvoy: notti per lo status, punti per i premi ([AwardWallet](https://awardwallet.com/hotels/marriott-bonvoy/do-marriott-points-expire/)) | ✅ Scelto, semplificato: una sola azione alimenta entrambi |
| **Traguardi con scelta** | A ogni soglia si sceglie un premio da un menu | World of Hyatt Milestone Rewards: a 20, 30, 40 notti si sceglie tra premi diversi ([Hyatt](https://investors.hyatt.com/news/investor-news/news-details/2023/World-of-Hyatt-Redefines-Loyalty-by-Adding-More-Rewards-More-Milestones-More-Choice-and-More-Opportunities-to-Gift-Benefits-to-Loved-Ones/default.aspx)) | ✅ Usato al passaggio di tier: un premio di benvenuto a scelta |

**Perché 3 anni.** Le compagnie aeree ricalcolano lo status ogni anno solare (Miles & More), Marriott annulla i punti dopo 24 mesi senza attività, Strava assegna il titolo di Local Legend su una finestra mobile di 90 giorni ([findings C02](findings.md)). Per un'auto, un anno è troppo corto: tra un tagliando e l'altro passa circa un anno, e i 2 anni sono il momento in cui molti clienti lasciano la rete (mentor Jakala, [note](../../decisions/2026-10-10-mentor-jakala-brief4.md)). **Inferenza:** 3 anni coprono più di un ciclo di manutenzione, premiano la costanza e fanno scendere chi smette di tornare.

**Perché una finestra mobile e non un azzeramento a data fissa.** Con l'azzeramento al 31 dicembre tutti perdono tutto lo stesso giorno; con la finestra mobile ogni punto scade nel suo mese, il livello si muove gradualmente e il cliente sa sempre quanti punti scadono e quando.

---

## 2. Come si guadagnano i punti

Solo azioni che Audi o la concessionaria registrano già: nessun punto per chilometri, stile di guida o telemetria (G03), nessun punto per gli euro spesi.

| Azione | Punti | Limite |
|---|---|---|
| Entri in Audi with you (titolare o guidatore invitato) | 100 | una volta |
| Inviti in famiglia un guidatore che accetta | 100 a te, 100 a lui | fino a 5 guidatori |
| Tagliando in officina ufficiale | 300 | |
| Cambio gomme o check stagionale in officina ufficiale | 100 | |
| **Bonus fedeltà in rete:** se la tua Audi ha più di 2 anni, i punti del service raddoppiano | x2 | |
| Sessione "Conosci la tua Audi" in concessionaria | 150 | |
| Modulo di Audi driving experience completato | 250 | |
| Evento Audi con check-in (concessionaria, hub, Design Week) | 100 | massimo 6 l'anno |
| Ricarica con Audi charging (almeno 4 ricariche nel mese) | 25 | una volta al mese |
| Anniversario: un anno nel programma con almeno un passaggio in rete | 200 | una volta l'anno |
| Il guidatore che hai invitato diventa titolare della sua prima Audi | 1.000 a lui, 500 a te | |

I punti del service vanno a chi porta l'auto in officina (titolare o guidatore invitato).

---

## 3. I quattro tier

Soglie calcolate sui punti guadagnati negli ultimi 36 mesi. I punti usati per i premi contano comunque per il livello.

| Tier | Soglia (ultimi 3 anni) | A chi corrisponde (profili della sezione 6) | Servizi del livello (non si comprano con i punti) |
|---|---|---|---|
| **Icon Circle** | 0, all'ingresso | Chi entra: titolare o guidatore invitato | Badge e card digitale; talk e masterclass digitali su innovazione, sostenibilità e design; check-up digitale al primo passaggio in rete; auto di cortesia dello stesso segmento |
| **quattro Circle** | 1.000 | Circa un anno di cura in rete | Certificazione digitale dello stato dell'auto (Proof of Quality); fast track per le prenotazioni in officina; inviti a giornate tecniche con i capiofficina |
| **S line Club** | 2.500 | Circa due o tre anni di cura continuativa | Accesso riservato negli hub di Cortina, Alta Badia e Madonna di Campiglio; auto di cortesia di un segmento superiore; ritiro e riconsegna per il service dove la concessionaria lo offre |
| **RS Vanguard** | 5.000 e almeno un passaggio in officina ufficiale negli ultimi 12 mesi | I più costanti, o chi ha portato un nuovo titolare in Audi | Prenotazione anticipata delle experience a posti limitati; auto di cortesia di segmento superiore, elettrica se disponibile; un referente dedicato in concessionaria; anteprime riservate dei nuovi modelli |

**Al passaggio di tier** (modello Hyatt) il cliente sceglie un premio di benvenuto tra tre del suo nuovo livello, senza spendere punti.

**Discesa graduale (proposta).** Il livello si ricalcola ogni mese. Se i punti degli ultimi 36 mesi scendono sotto la soglia, si scende di un solo tier alla volta, al massimo una volta ogni 12 mesi. Il cliente vede in anticipo quanti punti scadono nei prossimi 3 mesi.

---

## 4. Il punteggio di premi ed experience (superato il 10/10: i premi non costano punti)

**Criterio di prezzo.** Il costo in punti cresce con il costo reale per Audi o per la concessionaria e con la scarsità dei posti, ed è espresso in **mesi di cura media**: un cliente costante guadagna circa 1.000 punti l'anno (sezione 6), quindi un premio da 500 punti vale circa sei mesi. Nessun premio ha un valore in euro e nessun premio è uno sconto.

| Fascia | Premio o experience | Punti | Tier minimo | Posti |
|---|---|---|---|---|
| Riconoscimento | Badge, card, storico personale, certificazione Proof of Quality | 0 (automatici) | Icon / quattro | Illimitati |
| Audi premi | Portachiavi Audi | 300 | Icon Circle | Illimitati |
| Audi premi | Profumo per l'auto | 400 | Icon Circle | Illimitati |
| Audi premi | Borraccia o accessorio da viaggio Audi | 500 | Icon Circle | Illimitati |
| Audi premi | Kit di cura e pulizia dell'auto | 800 | Icon Circle | Illimitati |
| Audi premi | Pacchetto di cura estetica in concessionaria | 1.500 | quattro Circle | Secondo la capacità dell'officina |
| Experience | Evento con anteprima dei nuovi modelli | 600 | quattro Circle | Limitati per evento |
| Experience | Esperienza di guida con istruttore (modulo di Audi driving experience) | 2.000 | quattro Circle | Limitati |
| Experience | Prova di un altro modello per 48 ore | 2.500 | S line Club | Secondo la flotta demo |
| Experience | Visita esclusiva a una struttura Audi | 3.000 | S line Club | Limitati |
| Experience | Prima fila alla Milano Design Week | 3.500 | S line Club (RS prenota prima) | Pochi |
| Experience | Giornata di guida su ghiaccio nelle Dolomiti | 4.000 | RS Vanguard | Pochi |
| Experience | Incontro con gli atleti FISI (previa approvazione della federazione) | 4.000 | RS Vanguard | Pochissimi |

**Regole per i posti limitati:** prenotazione per tier, con apertura anticipata per RS Vanguard; nessuna estrazione e nessuna classifica.

---

## 5. Cosa abbiamo tolto dalla tab "sistema punti" e perché

| Testo originale | Problema | Al suo posto |
|---|---|---|
| "OPPURE acquistando una vettura con trazione integrale quattro" (quattro Circle) e gli equivalenti per S line e RS | Livello comprato con l'auto: logica di spesa, esclude gli under 35 | Solo punti degli ultimi 3 anni |
| "Prelazione sulle permute... priorità sulle allocazioni dei nuovi modelli" (RS Vanguard) | Tocca allocazioni e tempi di consegna, che il brief tiene fuori | Anteprime riservate dei nuovi modelli |
| "Valorizzazione garantita della permuta" (RS Vanguard) | Supervalutazione: logica promozionale esclusa (brief e mentor Jakala) | Referente dedicato in concessionaria |

---

## 6. Verifica con i profili della demo

Profili del prototipo (T004). Anno medio a regime, senza i punti una tantum.

| Profilo | Anno tipo | Punti l'anno | Tier dopo 1, 2, 3 anni |
|---|---|---|---|
| **Paolo**, titolare dell'A3 del 2021 (più di 2 anni: x2) | tagliando 600, check invernale 200, un evento 100, anniversario 200 | 1.100 | quattro (1.300 con ingresso e invito), quattro (2.400), S line (3.500) |
| **Luca**, 21 anni, guida l'A3 di famiglia | gomme due volte 400, una sessione 150, due eventi 200, anniversario 200 | 950 | quattro (1.150 con ingresso e invito), quattro, S line (circa 3.050) |
| **Giulia**, titolare di una Q3 del 2025 | tagliando 300, gomme due volte 200, un evento 100, anniversario 200 | 800 | Icon (900), quattro (1.700), S line al limite (2.500) |
| **Cliente molto costante** | tutto il service x2 (1.200), due sessioni 300, driving 250, sei eventi 600, ricarica 300, anniversario 200 | circa 2.850 | S line (2.950), RS (5.800), RS |

Quando Luca prende la sua prima Audi: +1.000 a lui e +500 a Paolo. È il momento in cui la famiglia può arrivare a RS Vanguard: l'advocacy generazionale del brief diventa una meccanica.

---

## 7. Da chiedere ai mentor

- **Jakala (i mentor Jakala):** un catalogo di premi fisici (portachiavi, borracce, kit) riscattabili con i punti rientra nelle operazioni a premio del DPR 430/2001, con la cauzione del 20% ([findings G01](findings.md))? Se sì, conviene tenere solo experience e servizi?
- **Audi Italia (il referente Audi Italia):** quanti posti per anno si possono riservare a RS Vanguard per ghiaccio, FISI e Design Week? La flotta demo regge la prova di 48 ore?
- **Tutti:** 5.000 punti in 3 anni per RS Vanguard sono raggiungibili ma rari: è il livello di esclusività giusto?

## Fonti

| Fonte | Editore | Uso |
|---|---|---|
| [Lufthansa Miles & More program changes 2024](https://onemileatatime.com/news/lufthansa-miles-more-changes/) | One Mile at a Time | Status con Points separato dalle miglia premio, per anno solare |
| [World of Hyatt redefines loyalty with more milestones](https://investors.hyatt.com/news/investor-news/news-details/2023/World-of-Hyatt-Redefines-Loyalty-by-Adding-More-Rewards-More-Milestones-More-Choice-and-More-Opportunities-to-Gift-Benefits-to-Loved-Ones/default.aspx) | Hyatt, 2023 (sito investitori, blocca i bot) | Premi a scelta ai traguardi |
| [World of Hyatt 2024 changes](https://thepointsguy.com/news/world-of-hyatt-2024-changes) | The Points Guy | Stesso fatto, fonte raggiungibile |
| [Do Marriott points expire?](https://awardwallet.com/hotels/marriott-bonvoy/do-marriott-points-expire/) | AwardWallet | Punti annullati dopo 24 mesi senza attività |
| [Sephora Beauty Insider loyalty program review](https://www.trybeans.com/blog/sephora-beauty-insider-loyalty-program-review) | Beans | Livelli per spesa annua (modello escluso) |
| [Strava Local Legends](https://www.bikeradar.com/news/strava-local-legend-worldwide-release/) | BikeRadar | Finestra mobile di 90 giorni (findings C02) |
