import { CHORD_NOTES, noteToMidi } from './chords.js';

// Voicing pianistici di default per ogni accordo
// Formato: array di numeri MIDI nel range 48-72 (C3-C5)
// Triadi: root position con raddoppio dell'ottava
// Settime: tutte e 4 le note

function buildDefaultVoicings() {
  const voicings = {};
  const NOTE_TO_MIDI_MAP = {
    'C': 0, 'C#': 1, 'Db': 1, 'D': 2, 'D#': 3, 'Eb': 3,
    'E': 4, 'F': 5, 'F#': 6, 'Gb': 6, 'G': 7, 'G#': 8,
    'Ab': 8, 'A': 9, 'A#': 10, 'Bb': 10, 'B': 11
  };

  for (const [chord, notes] of Object.entries(CHORD_NOTES)) {
    const midiNotes = [];

    for (const note of notes) {
      const pc = NOTE_TO_MIDI_MAP[note];
      // Place in octave 3 (48-59) or 4 (60-71)
      let midi = pc + 48; // octave 3
      if (midi < 48) midi += 12;

      // If note would be below previous note, bump up an octave
      if (midiNotes.length > 0 && midi <= midiNotes[midiNotes.length - 1]) {
        midi += 12;
      }
      midiNotes.push(midi);
    }

    // For triads, add root doubled an octave above the lowest
    if (midiNotes.length === 3) {
      midiNotes.push(midiNotes[0] + 12);
    }

    // Ensure all notes are in 48-72 range
    const adjusted = midiNotes.map(n => {
      while (n < 48) n += 12;
      while (n > 72) n -= 12;
      return n;
    }).sort((a, b) => a - b);

    voicings[chord] = adjusted;
  }

  return voicings;
}

export const DEFAULT_VOICINGS = buildDefaultVoicings();

// Genera tutti i possibili rivolti di un accordo nel range dato
export function generateInversions(chordName, minMidi = 48, maxMidi = 72) {
  const notes = CHORD_NOTES[chordName];
  if (!notes) return [];

  const NOTE_TO_MIDI_MAP = {
    'C': 0, 'C#': 1, 'Db': 1, 'D': 2, 'D#': 3, 'Eb': 3,
    'E': 4, 'F': 5, 'F#': 6, 'Gb': 6, 'G': 7, 'G#': 8,
    'Ab': 8, 'A': 9, 'A#': 10, 'Bb': 10, 'B': 11
  };

  const pitchClasses = notes.map(n => NOTE_TO_MIDI_MAP[n]);
  const inversions = [];

  // Generate all combinations of octaves for each pitch class
  function generate(index, current) {
    if (index === pitchClasses.length) {
      const sorted = [...current].sort((a, b) => a - b);
      // Check no voice crossing and all in range
      let valid = true;
      for (let i = 0; i < sorted.length; i++) {
        if (sorted[i] < minMidi || sorted[i] > maxMidi) { valid = false; break; }
        if (i > 0 && sorted[i] === sorted[i - 1]) { valid = false; break; }
      }
      if (valid) inversions.push(sorted);
      return;
    }

    const pc = pitchClasses[index];
    // Try octaves 3 and 4
    for (let octave = 3; octave <= 4; octave++) {
      const midi = pc + (octave + 1) * 12;
      if (midi >= minMidi && midi <= maxMidi) {
        current.push(midi);
        generate(index + 1, current);
        current.pop();
      }
    }
  }

  generate(0, []);
  return inversions;
}
