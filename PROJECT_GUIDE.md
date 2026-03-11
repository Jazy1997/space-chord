# Space Chords — Guida Progetto

## 1. Panoramica

Applicazione web per comporre progressioni di accordi jazz basata su un **Jazz Harmony Engine** con grafo di transizioni armoniche categorizzate. L'utente naviga il grafo attraverso 4 modalità di composizione, visualizza la struttura armonica in 3D, ascolta la progressione in tempo reale e può esportare il risultato come file MIDI.

Il sistema usa `JAZZ_PROGRESSION_MAP` dove ogni accordo ha 5 categorie di successori (low/mid/high/cycle/parallel) con pesi dinamici controllati da due potenziometri (Tensione e Direzione).

---

## 2. Jazz Harmony Engine

### 2.1 Struttura Dati

Il cuore dell'applicazione è `JAZZ_PROGRESSION_MAP`: un dizionario dove ogni accordo chiave mappa a 5 categorie di successori.

```javascript
JAZZ_PROGRESSION_MAP = {
  'Cmaj7': {
    low:      ['Am7', 'Em7'],           // Risoluzione, moto morbido
    mid:      ['Dm7', 'Fmaj7'],         // Diatonico, prevedibile
    high:     ['Ebmaj7', 'Abmaj7', 'Dbmaj7'],  // Sorpresa, cromatico
    cycle:    ['G7', 'G7sus4'],         // Ciclo delle quinte
    parallel: ['Cm7', 'Cbmaj7']        // Modale, parallelo
  },
  // ... 18 accordi chiave totali
};
```

**Categorie:**
| Categoria | Significato | Esempio da Cmaj7 |
|-----------|-------------|-------------------|
| `low` | Risoluzione, moto morbido | Am7, Em7 |
| `mid` | Diatonico, prevedibile | Dm7, Fmaj7 |
| `high` | Sorpresa, cromatismo | Ebmaj7, Abmaj7 |
| `cycle` | Ciclo delle quinte | G7, G7sus4 |
| `parallel` | Modale, parallelo minore/maggiore | Cm7, Cbmaj7 |

### 2.2 Accordi Chiave (18)

```
Cmaj7, Dm7, Em7, Fmaj7, G7, Am7,
Cm7, Fm7, Gm7, Abmaj7, Bbmaj7, Ebmaj7,
Bm7b5, Dbmaj7, Gbmaj7, Bbm7, Ebm7, Abm7
```

### 2.3 Accordi Solo-Successore (~35)

Accordi che appaiono nelle categorie ma non sono chiavi in `JAZZ_PROGRESSION_MAP`. Il sistema usa `SUCCESSOR_FALLBACKS` per mapparli ai successori del loro "parent":

```javascript
SUCCESSOR_FALLBACKS = {
  'G7sus4':  'G7',     // sus4 → parent dom7
  'G7alt':   'G7',     // altered → parent dom7
  'G7b9':    'G7',
  'D7alt':   'Dm7',
  'E7alt':   'Em7',
  // ...
};
```

### 2.4 CHORD_GRAPH (derivato)

Per compatibilità con tutti i moduli (tree, random, dijkstra, edges, interaction), `CHORD_GRAPH` è auto-derivato:

```javascript
// Merge di tutte le 5 categorie + fallback per solo-successori
CHORD_GRAPH['Cmaj7'] = [...new Set([...low, ...mid, ...high, ...cycle, ...parallel])];
```

### 2.5 Classificazione Tipi Accordo

| Tipo | Suffisso | Colore | Hex |
|------|----------|--------|-----|
| `major7` | maj7, maj7#5 | Warm gold | `#e8d8a0` |
| `minor7` | m7 | Soft blue | `#5b8def` |
| `dom7` | 7, 7sus4, 7alt, 7b9 | Amber | `#f0a050` |
| `half_dim` | m7b5 | Muted purple | `#b088d0` |
| `dim7` | dim7 | Deep red | `#d05050` |
| `aug` | maj7#5 | Teal | `#50d0a0` |

### 2.6 Famiglie (Layout 3D)

3 cluster per il force-directed layout:

| Famiglia | Centro 3D | Accordi |
|----------|-----------|---------|
| Do Maggiore | (-15, 5, -8) | Cmaj7, Dm7, Em7, Fmaj7, G7, Am7, Bm7b5 |
| Do Minore | (15, 5, -8) | Cm7, Fm7, Gm7, Abmaj7, Bbmaj7, Ebmaj7 |
| Modale | (0, -8, 12) | Dbmaj7, Gbmaj7, Bbm7, Ebm7, Abm7 |

---

## 3. Algoritmo Pesato (Jazz Engine)

### 3.1 Potenziometri UI

| Controllo | Range | Default | Azione |
|-----------|-------|---------|--------|
| **Tensione** | 0–100 | 30 | 0 = Tonale puro, 100 = Dissonante |
| **Direzione** | 0–100 | 50 | 0 = Ciclo quinte, 100 = Parallelismo |

### 3.2 Calcolo Pesi

```javascript
// Pesi base per categoria
baseWeights = { low: 20, mid: 30, high: 10, cycle: 20, parallel: 20 }

// Direzione (D): sposta cycle ↔ parallel
cycle    += (100 - D) / 5    // max +20 quando D=0
parallel += D / 5             // max +20 quando D=100

// Tensione (T): sposta high ↑, low ↓
high += T / 4                 // max +25 quando T=100
low  -= T / 10                // max -10 quando T=100 (floor a 5)
```

### 3.3 Saturazione

Se le ultime 2 categorie scelte erano `high` o `parallel`:
```
low      *= 4
mid      *= 1.5
high     *= 0.2
parallel *= 0.2
```

### 3.4 Tension Counter (0–10)

| Counter | Effetto |
|---------|---------|
| 0–3 | Nessuna modifica |
| 4–7 | low ×1.8, mid ×1.5, high ×0.5 |
| 8–10 | low ×5, mid ×0.3, high ×0.05 (forza risoluzione) |

**Aggiornamento counter:**
- `low` → counter -= 3 (min 0)
- `mid` / `cycle` → counter -= 1 (min 0)
- `high` / `parallel` → counter += 2 (max 10)

### 3.5 Bonus Note Comuni

Per ogni successore candidato, se condivide 2+ pitch class con l'accordo corrente:
```
weight *= 1 + (commonNotes * 0.1)
```

### 3.6 Anti-ripetizione

L'accordo immediatamente precedente riceve peso ×0.1.

---

## 4. Tech Stack

Tutto caricato via CDN — nessun build tool, nessun bundler.

| Libreria | Versione | Scopo |
|----------|---------|-------|
| **Three.js** | r170 | Visualizzazione 3D del grafo degli accordi |
| **Three.js OrbitControls** | r170 | Navigazione 3D (rotazione, zoom, pan) |
| **Three.js Post-processing** | r170 | Effetto bloom sui nodi attivi |
| **GSAP** | 3.12.5 | Animazioni UI (pannelli, transizioni camera) |
| **Tone.js** | 15.0.4 | Sintesi audio e playback progressione |
| **midi-writer-js** | 3.2.1 | Generazione ed export file MIDI |
| **Google Fonts** | — | Inter (UI) + JetBrains Mono (nomi accordi) |

### CDN URLs
```html
<!-- Three.js (ES Module via import map) -->
<script type="importmap">
{
  "imports": {
    "three": "https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js",
    "three/addons/": "https://cdn.jsdelivr.net/npm/three@0.170.0/examples/jsm/"
  }
}
</script>

<!-- GSAP -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js"></script>

<!-- Tone.js -->
<script src="https://cdn.jsdelivr.net/npm/tone@15.0.4/build/Tone.js"></script>

<!-- midi-writer-js -->
<script src="https://cdn.jsdelivr.net/npm/midi-writer-js@3.2.1/browser/midiwriter.js"></script>

<!-- Google Fonts -->
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;700&display=swap" rel="stylesheet">
```

---

## 5. Struttura File

```
composition-tool/
│
├── index.html                  # Entry point unico
├── PROJECT_GUIDE.md            # Questa guida
│
├── css/
│   ├── styles.css              # Layout globale, tema dark, tipografia, variabili CSS
│   ├── components.css          # Pannelli glassmorphism, bottoni, slider, chord-tag
│   └── animations.css          # Classi per transizioni GSAP, stati hover/active
│
├── js/
│   ├── app.js                  # Inizializzazione app, routing tra modalità, bindings slider
│   │
│   ├── data/
│   │   └── chords.js           # JAZZ_PROGRESSION_MAP, CHORD_GRAPH (derivato), CHORD_NOTES,
│   │                           # CHORD_TYPE, CHORD_FAMILIES, SUCCESSOR_FALLBACKS, helpers
│   │
│   ├── graph/
│   │   ├── scene.js            # Three.js: WebGLRenderer, PerspectiveCamera, bloom, star field
│   │   ├── layout.js           # Force-directed 3D, 3 cluster (Do Maggiore/Minore/Modale)
│   │   ├── nodes.js            # Sfera + glow + ring orbitale + sprite etichetta per accordo
│   │   ├── edges.js            # TubeGeometry curvo per ogni transizione
│   │   └── interaction.js      # Raycasting, hover, click dispatch
│   │
│   ├── modes/
│   │   ├── tree.js             # Modalità Albero: selezione interattiva passo-passo
│   │   ├── random.js           # Modalità Random: generazione casuale
│   │   ├── weighted.js         # Modalità Pesata: Jazz Engine con tensione/direzione
│   │   └── dijkstra.js         # Modalità Percorso: progressivo + più breve/più lungo
│   │
│   ├── audio/
│   │   ├── engine.js           # Tone.js PolySynth, playChordSound(), playChordPreview()
│   │   ├── voiceleading.js     # Ottimizzazione voice leading (min. movimento semitoni)
│   │   └── midi-export.js      # Generazione MIDI + download blob
│   │
│   └── ui/
│       ├── panels.js           # Info panel (successori per categoria), dropdowns, mode controls
│       ├── timeline.js         # Strip orizzontale progressione con card accordi colorati
│       └── toast.js            # Notifiche temporanee (errori, conferme)
│
└── assets/
    └── favicon.svg             # Icona ✦ Space Chords
```

---

## 6. Le 4 Modalità di Composizione

### 6.1 Modalità Albero (Interattiva)

L'utente costruisce la progressione un accordo alla volta.

**Flusso:**
1. Click su un nodo qualsiasi → diventa il punto di partenza
2. I successori validi si illuminano (pulsazione). Tutti gli altri nodi si attenuano
3. Click su un successore → la timeline si aggiorna, la camera segue
4. Bottone Undo per tornare indietro, Pulisci per ricominciare

### 6.2 Modalità Random (Generativa)

Sceglie casualmente tra i successori disponibili (tutte le categorie merged).

**Parametri UI:**
- Accordo di partenza (dropdown, default Cmaj7)
- Lunghezza progressione (slider: 4–32 accordi)

### 6.3 Modalità Pesata (Jazz Engine)

Il cuore del progetto. Genera progressioni jazz con controllo dinamico dello stile.

**Parametri UI:**
- Accordo di partenza (dropdown, default Cmaj7)
- Lunghezza (slider: 4–32)
- **Tensione** (slider 0–100, default 30): Tonale ↔ Dissonante
- **Direzione** (slider 0–100, default 50): Ciclo Quinte ↔ Parallelismo

**Comportamento:** Vedi sezione 3 per i dettagli dell'algoritmo pesato.

### 6.4 Modalità Percorso (Dijkstra)

Costruzione progressiva del percorso tra accordi.

**Flusso:**
1. Click su un nodo → partenza
2. Click su un altro nodo → arrivo, calcola e anima il percorso
3. Click successivi → spostano l'arrivo in avanti, i precedenti diventano tappe intermedie
4. Toggle "Più breve" / "Più lungo" per cambiare tipo di percorso
5. Undo rimuove l'ultimo waypoint

**Percorso più breve:** BFS/Dijkstra classico (peso uniforme = 1)
**Percorso più lungo:** DFS con backtracking e visited set per trovare il cammino semplice più lungo

---

## 7. Architettura Audio

### 7.1 Motore di Sintesi (Tone.js)

```javascript
const synth = new Tone.PolySynth(Tone.Synth, {
  maxPolyphony: 6,
  oscillator: { type: 'triangle8' },
  envelope: { attack: 0.05, decay: 0.3, sustain: 0.6, release: 0.4 }
});

const reverb = new Tone.Reverb({ decay: 2.5, wet: 0.3 });
synth.connect(reverb);
reverb.toDestination();
```

**Controlli UI:**
- BPM (slider 40–200, default 100)
- Volume (slider 0–100)
- Play / Stop
- Export MIDI

### 7.2 Voice Leading

Minimizza il movimento totale delle voci tra accordi consecutivi:
1. Genera candidati nelle ottave 3–4 (MIDI 48–72)
2. Calcola score = somma dei movimenti in semitoni
3. Seleziona il candidato con score minimo (no incroci di voci)

### 7.3 Export MIDI

Usa midi-writer-js 3.2.1. Nome file = sequenza accordi (es. `Cmaj7-Dm7-G7-Cmaj7.mid`).

---

## 8. UI/UX Design

### 8.1 Tema Visivo

- **Nome:** Space Chords
- **Sfondo:** `#0a0a0f` (nero profondo)
- **Pannelli:** Glassmorphism — `backdrop-filter: blur(12px); background: rgba(15,15,25,0.7)`
- **Font UI:** Inter (weights 300–700)
- **Font accordi:** JetBrains Mono (monospace)
- **Accenti:** Gradiente blu-viola

### 8.2 Codifica Colori Nodi

| Tipo Accordo | Colore | Hex | CSS Variable |
|--------------|--------|-----|-------------|
| major7 | Warm gold | `#e8d8a0` | `--chord-major7` |
| minor7 | Soft blue | `#5b8def` | `--chord-minor7` |
| dom7 | Amber | `#f0a050` | `--chord-dom7` |
| half_dim | Muted purple | `#b088d0` | `--chord-half_dim` |
| dim7 | Deep red | `#d05050` | `--chord-dim7` |
| aug | Teal | `#50d0a0` | `--chord-aug` |

### 8.3 Layout Desktop

```
+----------------------------------------------------------+
|  [✦ Space Chords]                    [BPM] [VOL]         |  ← Top bar (48px)
+---------+------------------------------------+-----------+
|         |                                    |           |
| MODALITÀ|        GRAFO 3D                    |   INFO    |
|         |        (Three.js Canvas)           |  PANNELLO |
| [Albero]|                                    |           |
| [Random]|                                    |  Accordo  |
| [Pesata]|                                    |  selezion.|
| [Percor]|                                    |  (per cat)|
|         |                                    |           |
| --------|                                    |  Voice    |
| Controlli                                    |  Leading  |
| modalità|                                    |           |
+---------+------------------------------------+-----------+
| [▶][⏹][⬇MIDI]  | Cmaj7 → Dm7 → G7 → Cmaj7             |  ← Timeline (80px)
+----------------------------------------------------------+
```

### 8.4 Info Panel

Mostra i successori raggruppati per le 5 categorie con label colorate:
- **Low (risoluzione)** — verde `#50d0a0`
- **Mid (diatonico)** — giallo `#e8d8a0`
- **High (sorpresa)** — rosso `#d05050`
- **Cycle (quinte)** — arancio `#f0a050`
- **Parallel (modale)** — viola `#b088d0`

### 8.5 Effetti 3D

| Effetto | Descrizione |
|---------|-------------|
| **Bloom** | Nodi e archi attivi brillano con alone luminoso (UnrealBloomPass) |
| **Star field** | Punti casuali nello sfondo cosmico |
| **Camera dolly** | Durante il playback la camera segue il nodo corrente |
| **Ring orbitale** | Anello sottile che ruota attorno a ogni nodo |
| **Dim/Highlight** | Nodi irrilevanti al 12% opacità, attivi al 95% |

---

## 9. Checklist di Verifica

- [x] JAZZ_PROGRESSION_MAP con 18 accordi chiave e 5 categorie
- [x] CHORD_GRAPH derivato automaticamente (compatibile con tutti i moduli)
- [x] SUCCESSOR_FALLBACKS per ~35 accordi solo-successore
- [x] Colori per 6 tipi accordo (major7/minor7/dom7/half_dim/dim7/aug)
- [x] Layout 3D a 3 cluster (Do Maggiore/Minore/Modale)
- [x] Info panel con successori raggruppati per categoria
- [x] Slider Tensione e Direzione nella modalità Pesata
- [x] Algoritmo pesato con saturazione + tension counter + bonus note comuni
- [x] Modalità Percorso con costruzione progressiva e percorso più lungo
- [ ] Test cross-browser (Chrome, Firefox, Safari)
- [ ] Ottimizzazione performance (< 100 draw calls, 60fps)
