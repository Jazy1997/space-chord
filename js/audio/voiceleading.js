import { CHORD_NOTES } from '../data/chords.js';

const NOTE_TO_MIDI_MAP = {
  'C': 0, 'C#': 1, 'Db': 1, 'D': 2, 'D#': 3, 'Eb': 3,
  'E': 4, 'Fb': 4, 'F': 5, 'F#': 6, 'Gb': 6, 'G': 7, 'G#': 8,
  'Ab': 8, 'A': 9, 'A#': 10, 'Bb': 10, 'B': 11, 'Cb': 11
};

const MIN_MIDI = 48; // C3
const MAX_MIDI = 72; // C5

/**
 * Find the voicing of targetChord that minimizes total semitone movement
 * from the currentVoicing.
 *
 * @param {number[]} currentVoicing - Array of MIDI note numbers (sorted ascending)
 * @param {string} targetChordName - Name of the target chord
 * @returns {number[]} Optimized voicing as sorted MIDI numbers
 */
export function optimizeVoiceLeading(currentVoicing, targetChordName) {
  const notes = CHORD_NOTES[targetChordName];
  if (!notes) return currentVoicing;

  const pitchClasses = notes.map(n => NOTE_TO_MIDI_MAP[n]);
  const candidates = generateCandidateVoicings(pitchClasses, currentVoicing.length);

  if (candidates.length === 0) {
    // Fallback: simple voicing
    return buildSimpleVoicing(pitchClasses, currentVoicing.length);
  }

  let bestVoicing = candidates[0];
  let bestScore = Infinity;

  for (const candidate of candidates) {
    const score = voiceLeadingScore(currentVoicing, candidate);
    if (score < bestScore) {
      bestScore = score;
      bestVoicing = candidate;
    }
  }

  return bestVoicing;
}

/**
 * Generate all valid voicings of given pitch classes within the MIDI range.
 * Matches the voice count of the current voicing.
 */
function generateCandidateVoicings(pitchClasses, voiceCount) {
  const candidates = [];

  // Get all possible MIDI notes for each pitch class in range
  const noteOptions = pitchClasses.map(pc => {
    const options = [];
    for (let octave = 3; octave <= 5; octave++) {
      const midi = pc + (octave + 1) * 12;
      if (midi >= MIN_MIDI && midi <= MAX_MIDI) {
        options.push(midi);
      }
    }
    return options;
  });

  // If we need more voices than pitch classes (e.g., doubling for triads)
  if (voiceCount > pitchClasses.length) {
    // Add root doubling options (octave above)
    const rootPc = pitchClasses[0];
    const rootOptions = [];
    for (let octave = 3; octave <= 5; octave++) {
      const midi = rootPc + (octave + 1) * 12;
      if (midi >= MIN_MIDI && midi <= MAX_MIDI) {
        rootOptions.push(midi);
      }
    }
    noteOptions.push(rootOptions);
  }

  // Generate combinations
  const combos = [];
  function combine(index, current) {
    if (index === noteOptions.length) {
      if (current.length >= voiceCount) {
        const sorted = current.slice(0, voiceCount).sort((a, b) => a - b);
        // Validate: no duplicates, no voice crossing
        let valid = true;
        for (let i = 1; i < sorted.length; i++) {
          if (sorted[i] <= sorted[i - 1]) { valid = false; break; }
        }
        if (valid) combos.push(sorted);
      }
      return;
    }

    for (const option of noteOptions[index]) {
      current.push(option);
      combine(index + 1, current);
      current.pop();
    }
  }

  combine(0, []);
  return combos;
}

/**
 * Calculate the voice leading "cost" between two voicings.
 * Lower is better.
 */
function voiceLeadingScore(from, to) {
  if (from.length !== to.length) {
    // Match lengths by using the minimum
    const len = Math.min(from.length, to.length);
    from = from.slice(0, len);
    to = to.slice(0, len);
  }

  let totalMovement = 0;
  for (let i = 0; i < from.length; i++) {
    totalMovement += Math.abs(from[i] - to[i]);
  }

  return totalMovement;
}

/**
 * Fallback: build a simple voicing in the middle of the range.
 */
function buildSimpleVoicing(pitchClasses, voiceCount) {
  const notes = [];
  for (const pc of pitchClasses) {
    let midi = pc + 60; // octave 4
    if (midi < MIN_MIDI) midi += 12;
    if (midi > MAX_MIDI) midi -= 12;
    notes.push(midi);
  }

  // Add doubling if needed
  while (notes.length < voiceCount) {
    notes.push(notes[0] + 12 <= MAX_MIDI ? notes[0] + 12 : notes[0]);
  }

  return notes.sort((a, b) => a - b).slice(0, voiceCount);
}

/**
 * Convert MIDI number to note name string (e.g., 60 -> "C4")
 */
export function midiToNoteName(midi) {
  const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const octave = Math.floor(midi / 12) - 1;
  const note = noteNames[midi % 12];
  return `${note}${octave}`;
}
