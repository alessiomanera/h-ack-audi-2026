# Prompt Google Stitch & Generazione Immagini Placeholder per Canva

Questo documento raccoglie le indicazioni di stile e i prompt pronti per generare immagini placeholder e mockup UI coerenti con l'identità visiva Audi ([tokens.json](tokens.json), [palette.md](palette.md), [voice.md](voice.md)) per le 10 slide del pitch deck Canva.

Il mockup generato con Stitch non è incluso in questa repo (immagine e HTML nell'archivio privato):
- `code.html`: Mockup interattivo della shell mobile myAudi con tab Loyalty evidenziata.
- `screen.png`: Screenshot del mockup mobile pronto per Canva.

---

## 1. Master Style Prompt (Direzione Visiva Globale)

Da usare come prefisso o impostazione di stile in Google Stitch / generatori visivi:

```text
Editorial premium automotive photography for Audi Italia. Minimalist, dark-first studio atmosphere, deep carbon black (#161616) and charcoal graphite (#2B2929) tones. Subtle, razor-sharp lighting, Hasselblad medium format camera feel, 50mm lens, f/2.8, realistic textures, matte finishes. At most one subtle accent of Audi Lava Red (#FF2D00). No neon glows, no futuristic holograms, no lens flares, no cheesy CGI, no generic stock clichés.
```

---

## 2. Prompt per le Slide del Pitch Deck

### A. Cover & Hero (Slide 1 e Slide 4)
*Scopo: Copertina e manifesto dell'idea con silhouette Audi in penombra.*
```text
Cinematic dark studio shot of a modern Audi silhouette emerging from shadow, sleek aerodynamic body lines, matte carbon background (#161616), razor-thin precision LED daytime running light reflection, soft graphite highlight along the shoulder line, ultra-clean composition, high contrast, understated German luxury, quiet confidence, 8k resolution, photorealistic, no badges exaggeration, no glowing trails.
```

### B. Il Target Under 35 & Usato (Slide 2 e Slide 3)
*Scopo: Il cliente reale nel quotidiano con una vettura usata recente.*
```text
Authentic documentary portrait of a stylish 28-year-old Italian driver in a minimalist modern urban parking architecture, overcast natural daylight through concrete pillars, standing next to a pristine modern used Audi A3 Sportback, casual understated dark attire (black knitwear), genuine thoughtful expression looking at vehicle details, cinematic 35mm film grain, muted graphite and grey palette, candid, real, anti-stock-photo.
```

### C. Concessionaria come Box di Gara: Pit-Stop 15 Minuti (Slide 5 e Slide 7)
*Scopo: Area service ordinata ed efficiente come un box Formula 1.*
```text
Architectural interior photograph of an Audi dealership express service bay, spotless polished concrete floor, pristine minimal workstation with diagnostic screens, modern Audi car on a low-profile lift receiving a quick inspection, warm technical lighting, immaculate order, Formula 1 pit-stop precision meets luxury boutique service, graphite surfaces with a single subtle red accent detail on tool bay, crisp, photorealistic, clean.
```

### D. Esperienza Territoriale: Audi Mountain Lounge Dolomiti (Slide 6 e Slide 8)
*Scopo: Reward esperienziale negli hub montani Audi (Cortina / Madonna di Campiglio).*
```text
Contemporary alpine luxury hospitality lounge, Audi Mountain Lounge in the Dolomites, floor-to-ceiling glass windows revealing snow-covered alpine peaks at dusk, refined dark timber, graphite stone and minimalist warm interior seating, cozy architectural atmosphere, elegant subtle luxury, quiet ambiance, authentic winter hospitality, editorial architecture magazine photography.
```

### E. Esperienza Territoriale: Milano Design Week / FuoriSalone (Slide 6 e Slide 8)
*Scopo: Accesso culturale e fast-track all'Audi Design Hub.*
```text
Minimalist architectural installation in a historic Milanese courtyard during Milan Design Week, dark monolithic geometric pavilion designed by modern architects, subtle ambient lighting, young creative professionals networking in understated dark coats, overcast twilight sky, intellectual and design-forward atmosphere, editorial FuoriSalone photo, refined, sophisticated.
```

---

## 3. Regole d'Oro per Canva

1. **Un solo elemento rosso (Lava `#FF2D00`)** per slide o schermata.
2. **Sfondo scuro uniforme**: Carbon `#161616` (o card Graphite `#2B2929`).
3. **Tipografia**: Titoli in Archivo Bold, testi in Inter Regular.
4. **Trasparenza AI**: Registrare ogni asset generato in [`pitch/ai-usage.md`](../pitch/ai-usage.md).
