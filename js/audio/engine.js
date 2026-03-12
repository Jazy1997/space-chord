import { CHORD_NOTES, noteToMidi, midiToFreq } from '../data/chords.js';
import { optimizeVoiceLeading } from './voiceleading.js';

let synth = null;
let reverb = null;
let isReady = false;
let currentVoicing = null;
let volume = -6; // dB
let activeNotes = []; // track what's currently sounding

export async function initAudio() {
  if (isReady) return;

  await Tone.start();

  reverb = new Tone.Reverb({ decay: 2.0, wet: 0.25 });
  await reverb.generate();

  synth = new Tone.PolySynth(Tone.Synth, {
    maxPolyphony: 16,
    oscillator: { type: 'triangle4' },
    envelope: {
      attack: 0.03,
      decay: 0.15,
      sustain: 0.25,
      release: 0.25  // shorter release = less overlap
    }
  });

  synth.volume.value = volume;
  synth.connect(reverb);
  reverb.toDestination();

  isReady = true;
  console.log('[audio] Synth initialized, ready to play');
}

export function setVolume(val) {
  volume = -30 + (val / 100) * 30;
  if (synth) synth.volume.value = volume;
}

// Force-stop all currently sounding notes
function silenceAll() {
  if (!synth) return;
  try {
    // Release any active notes explicitly
    if (activeNotes.length > 0) {
      synth.triggerRelease(activeNotes, Tone.now());
      activeNotes = [];
    }
    synth.releaseAll(Tone.now());
  } catch(e) {
    // Last resort: dispose and recreate
    try { synth.releaseAll(); } catch(e2) {}
  }
}

// Play a single chord — used for clicks and playback
export function playChordSound(chordName, durationSec = null) {
  if (!isReady || !synth) return;

  const notes = CHORD_NOTES[chordName];
  if (!notes) return;

  // Stop previous chord
  silenceAll();

  let voicing;
  const isFixedVoicing = chordName.endsWith('alt') || chordName.endsWith('sus4');
  if (currentVoicing || isFixedVoicing) {
    voicing = optimizeVoiceLeading(currentVoicing || [], chordName);
  } else {
    voicing = notes.map((note, i) => {
      const octave = notes.length > 3 ? 3 : (i < 2 ? 3 : 4);
      return noteToMidi(note, octave);
    }).sort((a, b) => a - b);
  }

  currentVoicing = voicing;

  // Filter out any NaN/invalid MIDI values before converting to frequencies
  const validVoicing = voicing.filter(midi => Number.isFinite(midi));
  if (validVoicing.length === 0) return;

  const freqs = validVoicing.map(midi => midiToFreq(midi));
  const now = Tone.now() + 0.03;
  const dur = durationSec || 0.8;

  // Track active notes for explicit release
  activeNotes = [...freqs];
  synth.triggerAttackRelease(freqs, dur, now);

  // Clear tracking after note ends
  setTimeout(() => { activeNotes = []; }, (dur + 0.3) * 1000);

  return voicing;
}

// Play a single chord without affecting voice leading state (for preview clicks)
export function playChordPreview(chordName) {
  if (!isReady || !synth) return;

  const notes = CHORD_NOTES[chordName];
  if (!notes) return;

  silenceAll();

  const isFixedVoicing = chordName.endsWith('alt') || chordName.endsWith('sus4');
  let voicing;
  if (isFixedVoicing) {
    voicing = optimizeVoiceLeading([], chordName);
  } else {
    voicing = notes.map((note, i) => {
      const octave = notes.length > 3 ? 3 : (i < 2 ? 3 : 4);
      return noteToMidi(note, octave);
    }).sort((a, b) => a - b);
  }

  const validVoicing = voicing.filter(midi => Number.isFinite(midi));
  if (validVoicing.length === 0) return;

  const freqs = validVoicing.map(midi => midiToFreq(midi));
  activeNotes = [...freqs];
  synth.triggerAttackRelease(freqs, 0.6, Tone.now() + 0.03);
  setTimeout(() => { activeNotes = []; }, 900);
}

export function stopPlayback() {
  if (typeof Tone !== 'undefined') {
    try {
      if (Tone.Transport.state === 'started') {
        Tone.Transport.stop();
        Tone.Transport.cancel();
      }
    } catch(e) {}
  }
  silenceAll();
}

export function resetVoiceLeading() {
  currentVoicing = null;
}

export function getCurrentVoicing() {
  return currentVoicing ? [...currentVoicing] : null;
}

export function isAudioReady() {
  return isReady;
}
