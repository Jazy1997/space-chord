import { midiToNoteName } from './voiceleading.js';

/**
 * Export the current progression as a MIDI file and trigger download.
 *
 * @param {string[]} chordNames - Array of chord names in the progression
 * @param {number[][]} voicings - Array of voicings (MIDI note arrays) for each chord
 * @param {number} bpm - Tempo in BPM
 */
export function exportMIDI(chordNames, voicings, bpm = 100) {
  if (!chordNames || chordNames.length === 0) return;
  if (typeof MidiWriter === 'undefined') {
    console.error('midi-writer-js not loaded');
    return;
  }

  const track = new MidiWriter.Track();
  track.setTempo(bpm);
  track.addTrackName('Chord Progression');

  for (let i = 0; i < chordNames.length; i++) {
    const voicing = voicings[i] || [];

    // Convert MIDI numbers to note name strings
    const pitchNames = voicing.map(midi => midiToNoteName(midi));

    track.addEvent(new MidiWriter.NoteEvent({
      pitch: pitchNames,
      duration: '1',  // whole note (1 bar)
      velocity: 80
    }));
  }

  const writer = new MidiWriter.Writer([track]);

  // Build file and trigger download
  const dataUri = writer.dataUri();
  const fileName = chordNames.join('-') + '.mid';

  const link = document.createElement('a');
  link.href = dataUri;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Generate voicings for a progression with voice leading optimization.
 * Used when we need voicings for MIDI export but didn't collect them during playback.
 */
export async function generateVoicingsForExport(chordNames) {
  // Import dynamically to avoid circular dependency
  const { CHORD_NOTES, noteToMidi } = await import('../data/chords.js');
  const { optimizeVoiceLeading } = await import('./voiceleading.js');

  const voicings = [];
  let currentVoicing = null;

  for (const chord of chordNames) {
    const notes = CHORD_NOTES[chord];
    if (!notes) continue;

    if (currentVoicing) {
      currentVoicing = optimizeVoiceLeading(currentVoicing, chord);
    } else {
      currentVoicing = notes.map((note, i) => {
        const octave = notes.length > 3 ? 3 : (i < 2 ? 3 : 4);
        return noteToMidi(note, octave);
      }).sort((a, b) => a - b);
    }

    voicings.push([...currentVoicing]);
  }

  return voicings;
}
