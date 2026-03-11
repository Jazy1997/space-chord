// ============================================
// SPACE CHORDS — Jazz Harmony Data Layer
// ============================================

// ── Jazz Progression Map ──────────────────────────────────
// Ogni accordo chiave mappa a 5 categorie di successori:
//   low      = risoluzione / punto di riposo
//   mid      = sviluppo diatonico standard
//   high     = sorpresa / interscambio modale
//   cycle    = spinta propulsiva (ciclo delle quinte)
//   parallel = movimento cromatico / modale

export const JAZZ_PROGRESSION_MAP = {

  // ── AREA TONALITÀ MAGGIORE (C) ──

  Cmaj7: {
    low: ['Am7', 'Em7'],
    mid: ['Dm7', 'Fmaj7', 'G7'],
    high: ['Bb7', 'Fm7', 'A7', 'D7', 'E7', 'Ab7'],
    cycle: ['Fmaj7', 'F7', 'Fm7'],
    parallel: ['Dbmaj7', 'Bbmaj7', 'Ebmaj7']
  },

  Dm7: {
    low: ['Cmaj7', 'Fmaj7', 'Am7'],
    mid: ['G7', 'G7sus4', 'Em7'],
    high: ['Db7', 'Bb7', 'Abmaj7', 'Eb7'],
    cycle: ['G7', 'G7alt', 'G7sus4', 'Db7'],
    parallel: ['Ebm7', 'Dbm7', 'Em7']
  },

  Em7: {
    low: ['Cmaj7', 'Am7'],
    mid: ['Fmaj7', 'Dm7', 'G7'],
    high: ['Eb7', 'Ab7', 'A7'],
    cycle: ['Am7', 'A7', 'A7alt', 'Eb7'],
    parallel: ['Fm7', 'Ebm7', 'Dm7']
  },

  Fmaj7: {
    low: ['Cmaj7', 'Em7', 'Am7'],
    mid: ['G7', 'Dm7'],
    high: ['Bb7', 'Abmaj7', 'Dbmaj7', 'Gbmaj7', 'Bdim7'],
    cycle: ['Bbmaj7', 'Bb7', 'Bdim7', 'Fm7'],
    parallel: ['Gbmaj7', 'Ebmaj7', 'Abmaj7']
  },

  G7: {
    low: ['Cmaj7', 'Em7', 'Am7'],
    mid: ['C7', 'Fm7', 'Bdim7'],
    high: ['Db7', 'Abmaj7', 'Bb7', 'Ebmaj7', 'G7alt'],
    cycle: ['Cmaj7', 'C7', 'Cm7', 'Gbmaj7'],
    parallel: ['Ab7', 'Gb7', 'F7']
  },

  Am7: {
    low: ['Cmaj7', 'Em7'],
    mid: ['Dm7', 'Fmaj7', 'G7'],
    high: ['D7', 'Ab7', 'Bb7', 'Db7'],
    cycle: ['Dm7', 'D7', 'D7alt', 'Ab7'],
    parallel: ['Bbm7', 'Abm7', 'Gm7']
  },

  'Bm7b5': {
    low: ['Cmaj7', 'Am7'],
    mid: ['E7', 'G7', 'Fmaj7'],
    high: ['Bb7', 'Eb7', 'Fm7', 'Dbmaj7'],
    cycle: ['E7', 'E7alt', 'Bb7'],
    parallel: ['Cm7b5', 'Bbm7b5']
  },

  // ── LOGICA PARALLELA & TADD DAMERON (bII, bIII, bVI, bVII) ──

  Bbmaj7: {
    low: ['Cmaj7'],
    mid: ['Dm7', 'F7'],
    high: ['Fm7', 'Bb7', 'Dm7', 'G7'],
    cycle: ['Ebmaj7', 'Ebm7', 'Eb7'],
    parallel: ['Cmaj7', 'Abmaj7', 'Dbmaj7']
  },

  Ebmaj7: {
    low: ['Cm7', 'Cmaj7'],
    mid: ['Fm7', 'Bb7', 'Dm7b5'],
    high: ['Bb7', 'Dbmaj7', 'G7alt'],
    cycle: ['Abmaj7', 'Ab7', 'Abm7'],
    parallel: ['Fmaj7', 'Dbmaj7', 'Bbmaj7']
  },

  Abmaj7: {
    low: ['Cm7', 'Ebmaj7', 'G7'],
    mid: ['Bb7', 'Dm7b5'],
    high: ['G7b9', 'Bdim7', 'F7'],
    cycle: ['Dbmaj7', 'Db7', 'Gbmaj7'],
    parallel: ['Bbmaj7', 'Gbmaj7', 'Ebmaj7']
  },

  Dbmaj7: {
    low: ['Cmaj7'],
    mid: ['Bdim7', 'Ebmaj7'],
    high: ['Gbmaj7', 'Ebm7', 'Bb7'],
    cycle: ['Gbmaj7', 'Gb7', 'Cbmaj7'],
    parallel: ['Ebmaj7', 'Cmaj7', 'Abmaj7']
  },

  // ── AREA DI DO MINORE ──

  Cm7: {
    low: ['Abmaj7', 'Ebmaj7', 'Am7b5'],
    mid: ['Fm7', 'G7', 'Dm7b5', 'F7'],
    high: ['D7', 'Bb7', 'Dbmaj7', 'Bdim7'],
    cycle: ['Fm7', 'F7', 'Bb7'],
    parallel: ['Dbm7', 'Bbm7', 'Dm7']
  },

  'Dm7b5': {
    low: ['Cm7', 'Abmaj7', 'Fm7'],
    mid: ['G7b9', 'G7alt', 'Bdim7'],
    high: ['Db7', 'Bb7', 'Ebmaj7', 'Ab7'],
    cycle: ['G7', 'G7alt', 'G7b9', 'Db7'],
    parallel: ['Ebm7b5', 'Dbm7b5']
  },

  Ebaugmaj7: {
    low: ['Cm7', 'Am7b5'],
    mid: ['G7alt', 'F7', 'Bdim7'],
    high: ['D7alt', 'Abmaj7', 'Db7', 'Gb7'],
    cycle: ['Abmaj7', 'Abmaj7#5'],
    parallel: ['Emaj7#5', 'Dmaj7#5']
  },

  Fm7: {
    low: ['Cm7', 'Ebmaj7', 'Cmaj7'],
    mid: ['Bb7', 'G7', 'Dm7b5'],
    high: ['Db7', 'Abmaj7', 'Bdim7', 'F7', 'Bbmaj7'],
    cycle: ['Bb7', 'Bbmaj7', 'Ebmaj7', 'Eb7'],
    parallel: ['Gm7', 'Em7', 'Gbm7']
  },

  'Am7b5': {
    low: ['Cm7', 'Cmaj7'],
    mid: ['D7', 'D7alt', 'G7alt'],
    high: ['F7', 'Ab7', 'Bdim7', 'Bb7'],
    cycle: ['D7', 'D7alt', 'Ab7'],
    parallel: ['Bbm7b5', 'Abm7b5']
  },

  Bb7: {
    low: ['Cmaj7', 'Ebmaj7', 'Cm7'],
    mid: ['Abmaj7', 'F7', 'G7'],
    high: ['Db7', 'E7', 'Bbmaj7'],
    cycle: ['Ebmaj7', 'Eb7', 'Ebm7'],
    parallel: ['B7', 'Ab7', 'A7']
  },

  Bdim7: {
    low: ['Cm7', 'Cmaj7'],
    mid: ['Abmaj7', 'G7b9'],
    high: ['E7', 'Db7', 'D7alt'],
    cycle: ['Cm7', 'Cmaj7', 'E7'],
    parallel: ['Cdim7', 'Bbdim7']
  }
};

// ── Accordi "solo-successore" ─────────────────────────────
// Appaiono nelle categorie ma NON sono chiavi in JAZZ_PROGRESSION_MAP.
// Ognuno fallback ai successori del suo accordo parent.
export const SUCCESSOR_FALLBACKS = {
  // Varianti di G7
  'G7sus4':  'G7',
  'G7alt':   'G7',
  'G7b9':    'G7',
  // Varianti di D7
  'D7':      'Dm7',   // non è chiave, fallback al ii
  'D7alt':   'Dm7',
  // Varianti di E7
  'E7':      'Em7',
  'E7alt':   'Em7',
  // Varianti di A7
  'A7':      'Am7',
  'A7alt':   'Am7',
  // Dominanti secondarie
  'F7':      'Fm7',
  'Ab7':     'Abmaj7',
  'Db7':     'Dbmaj7',
  'Eb7':     'Ebmaj7',
  'Gb7':     'Gbmaj7',  // → fallback a Dbmaj7 (Gbmaj7 non è chiave)
  'C7':      'Cm7',
  'B7':      'Bdim7',
  // Accordi maggiori non-chiave
  'Gbmaj7':  'Dbmaj7',
  'Cbmaj7':  'Dbmaj7',
  // Accordi minori non-chiave
  'Abm7':    'Abmaj7',
  'Bbm7':    'Bb7',
  'Gm7':     'G7',
  // C#m7 rimosso (duplicato enarmonico di Dbm7)
  'Ebm7':    'Ebmaj7',
  'Gbm7':    'Fm7',
  'Dbm7':    'Dbmaj7',
  // Accordi aumentati non-chiave
  'Abmaj7#5': 'Abmaj7',
  'Emaj7#5':  'Ebmaj7',
  'Dmaj7#5':  'Dm7',
  // Half-dim non-chiave
  'Cm7b5':   'Cm7',
  'Bbm7b5':  'Bb7',
  'Abm7b5':  'Abmaj7',
  'Ebm7b5':  'Ebmaj7',
  'Dbm7b5':  'Dm7b5',
  // Diminuiti non-chiave
  'Cdim7':   'Cm7',
  'Bbdim7':  'Bb7'
};

// ── CHORD_GRAPH derivato ──────────────────────────────────
// Grafo piatto per compatibilità (tree mode, dijkstra, edges, etc.)

export const CHORD_GRAPH = {};

// 1. Accordi chiave: merge tutte le categorie
for (const [chord, categories] of Object.entries(JAZZ_PROGRESSION_MAP)) {
  const all = new Set();
  for (const arr of Object.values(categories)) {
    for (const c of arr) all.add(c);
  }
  CHORD_GRAPH[chord] = [...all];
}

// 2. Accordi solo-successore: ereditano i successori dal parent
for (const [chord, parent] of Object.entries(SUCCESSOR_FALLBACKS)) {
  if (!CHORD_GRAPH[chord]) {
    // Usa i successori del parent (se il parent è una chiave)
    const parentSuccessors = CHORD_GRAPH[parent];
    if (parentSuccessors) {
      CHORD_GRAPH[chord] = [...parentSuccessors];
    } else {
      CHORD_GRAPH[chord] = [];
    }
  }
}

// ── Helper functions ──────────────────────────────────────

export function getAllSuccessors(chord) {
  return CHORD_GRAPH[chord] || [];
}

export function getSuccessorsByCategory(chord, category) {
  const map = JAZZ_PROGRESSION_MAP[chord];
  if (!map) return [];
  return map[category] || [];
}

export function getCommonNoteCount(chordA, chordB) {
  const notesA = CHORD_NOTES[chordA];
  const notesB = CHORD_NOTES[chordB];
  if (!notesA || !notesB) return 0;
  const setB = new Set(notesB);
  return notesA.filter(n => setB.has(n)).length;
}

// ── CHORD_NOTES ───────────────────────────────────────────
// Pitch classes per ogni accordo (usate per audio, voice leading, MIDI)

export const CHORD_NOTES = {
  // ── Accordi chiave (18) ──
  'Cmaj7':    ['C', 'E', 'G', 'B'],
  'Dm7':      ['D', 'F', 'A', 'C'],
  'Em7':      ['E', 'G', 'B', 'D'],
  'Fmaj7':    ['F', 'A', 'C', 'E'],
  'G7':       ['G', 'B', 'D', 'F'],
  'Am7':      ['A', 'C', 'E', 'G'],
  'Bm7b5':    ['B', 'D', 'F', 'A'],

  'Bbmaj7':   ['Bb', 'D', 'F', 'A'],
  'Ebmaj7':   ['Eb', 'G', 'Bb', 'D'],
  'Abmaj7':   ['Ab', 'C', 'Eb', 'G'],
  'Dbmaj7':   ['Db', 'F', 'Ab', 'C'],

  'Cm7':      ['C', 'Eb', 'G', 'Bb'],
  'Dm7b5':    ['D', 'F', 'Ab', 'C'],
  'Ebaugmaj7':['Eb', 'G', 'B', 'D'],
  'Fm7':      ['F', 'Ab', 'C', 'Eb'],
  'Am7b5':    ['A', 'C', 'Eb', 'G'],
  'Bb7':      ['Bb', 'D', 'F', 'Ab'],
  'Bdim7':    ['B', 'D', 'F', 'Ab'],

  // ── Dominanti secondarie / varianti ──
  'D7':       ['D', 'F#', 'A', 'C'],
  'D7alt':    ['D', 'Eb', 'Ab', 'C'],
  'E7':       ['E', 'G#', 'B', 'D'],
  'E7alt':    ['E', 'F', 'Bb', 'D'],
  'A7':       ['A', 'C#', 'E', 'G'],
  'A7alt':    ['A', 'Bb', 'Eb', 'G'],
  'F7':       ['F', 'A', 'C', 'Eb'],
  'C7':       ['C', 'E', 'G', 'Bb'],
  'Ab7':      ['Ab', 'C', 'Eb', 'Gb'],
  'Db7':      ['Db', 'F', 'Ab', 'Cb'],
  'Eb7':      ['Eb', 'G', 'Bb', 'Db'],
  'Gb7':      ['Gb', 'Bb', 'Db', 'Fb'],
  'B7':       ['B', 'D#', 'F#', 'A'],

  // Varianti di G7
  'G7sus4':   ['G', 'C', 'D', 'F'],
  'G7alt':    ['G', 'Ab', 'Db', 'F'],
  'G7b9':     ['G', 'B', 'D', 'F', 'Ab'],

  // ── Accordi maggiori non-chiave ──
  'Gbmaj7':   ['Gb', 'Bb', 'Db', 'F'],
  'Cbmaj7':   ['Cb', 'Eb', 'Gb', 'Bb'],

  // ── Accordi minori non-chiave ──
  'Abm7':     ['Ab', 'Cb', 'Eb', 'Gb'],
  'Bbm7':     ['Bb', 'Db', 'F', 'Ab'],
  'Gm7':      ['G', 'Bb', 'D', 'F'],
  // C#m7 rimosso (duplicato enarmonico di Dbm7)
  'Ebm7':     ['Eb', 'Gb', 'Bb', 'Db'],
  'Gbm7':     ['Gb', 'A', 'Db', 'E'],
  'Dbm7':     ['Db', 'E', 'Ab', 'B'],

  // ── Accordi aumentati non-chiave ──
  'Abmaj7#5': ['Ab', 'C', 'E', 'G'],
  'Emaj7#5':  ['E', 'G#', 'C', 'D#'],
  'Dmaj7#5':  ['D', 'F#', 'Bb', 'C#'],

  // ── Half-dim non-chiave ──
  'Cm7b5':    ['C', 'Eb', 'Gb', 'Bb'],
  'Bbm7b5':   ['Bb', 'Db', 'E', 'Ab'],
  'Abm7b5':   ['Ab', 'Cb', 'D', 'Gb'],
  'Ebm7b5':   ['Eb', 'Gb', 'A', 'Db'],
  'Dbm7b5':   ['Db', 'E', 'G', 'B'],

  // ── Diminuiti non-chiave ──
  'Cdim7':    ['C', 'Eb', 'Gb', 'A'],
  'Bbdim7':   ['Bb', 'Db', 'E', 'G']
};

// ── CHORD_TYPE ────────────────────────────────────────────
// Classificazione per colori e visualizzazione

export const CHORD_TYPE = {};

function classifyChord(name) {
  if (/dim7$/.test(name))       return 'dim7';
  if (/m7b5$/.test(name))       return 'half_dim';
  if (/augmaj7$/.test(name))    return 'aug';
  if (/maj7#5$/.test(name))     return 'aug';
  if (/maj7$/.test(name))       return 'major7';
  if (/m7$/.test(name))         return 'minor7';
  if (/7sus4$/.test(name))      return 'dom7';
  if (/7alt$/.test(name))       return 'dom7';
  if (/7b9$/.test(name))        return 'dom7';
  if (/7$/.test(name))          return 'dom7';
  return 'major7';
}

// Classifica tutti gli accordi presenti in CHORD_GRAPH
for (const chord of Object.keys(CHORD_GRAPH)) {
  CHORD_TYPE[chord] = classifyChord(chord);
}
// Assicura anche gli accordi in CHORD_NOTES
for (const chord of Object.keys(CHORD_NOTES)) {
  if (!CHORD_TYPE[chord]) {
    CHORD_TYPE[chord] = classifyChord(chord);
  }
}

// ── CHORD_FAMILIES ────────────────────────────────────────
// Cluster per layout 3D

export const CHORD_FAMILIES = {
  'Do Maggiore': ['Cmaj7', 'Dm7', 'Em7', 'Fmaj7', 'G7', 'Am7', 'Bm7b5'],
  'Do Minore':   ['Cm7', 'Dm7b5', 'Ebaugmaj7', 'Fm7', 'Am7b5', 'Bb7', 'Bdim7'],
  'Modale':      ['Bbmaj7', 'Ebmaj7', 'Abmaj7', 'Dbmaj7']
};

// ── Utility functions ─────────────────────────────────────

const NOTE_TO_MIDI = {
  'C': 0, 'C#': 1, 'Db': 1, 'D': 2, 'D#': 3, 'Eb': 3,
  'E': 4, 'Fb': 4, 'F': 5, 'F#': 6, 'Gb': 6, 'G': 7, 'G#': 8,
  'Ab': 8, 'A': 9, 'A#': 10, 'Bb': 10, 'B': 11, 'Cb': 11
};

export function noteToMidi(note, octave) {
  const pc = NOTE_TO_MIDI[note];
  if (pc === undefined) return 60; // fallback C4
  return pc + (octave + 1) * 12;
}

export function midiToFreq(midi) {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

export function noteNameWithOctave(note, octave) {
  return note + octave;
}
