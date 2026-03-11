// ============================================
// CHORD COMPOSER — Main App Entry Point
// ============================================

import { CHORD_GRAPH, CHORD_NOTES, noteToMidi } from './data/chords.js';
import { initScene, startRenderLoop, getControls } from './graph/scene.js';
import { computeLayout } from './graph/layout.js';
import { createNodes, updateNodes, resetAllNodes, getNodePosition } from './graph/nodes.js';
import { createEdges, resetAllEdges } from './graph/edges.js';
import { initInteraction, onNodeHover, onNodeClick } from './graph/interaction.js';
import { initAudio, playChordSound, playChordPreview, setVolume, stopPlayback, resetVoiceLeading, isAudioReady, getCurrentVoicing } from './audio/engine.js';
import { optimizeVoiceLeading, midiToNoteName } from './audio/voiceleading.js';

import * as treeMode from './modes/tree.js';
import * as randomMode from './modes/random.js';
import * as weightedMode from './modes/weighted.js';
import * as dijkstraMode from './modes/dijkstra.js';

import { showToast } from './ui/toast.js';
import { updateTimeline, clearTimeline, setPlayingIndex, setOnChordClick } from './ui/timeline.js';
import { populateDropdowns, updateInfoPanel, updateVoiceLeadingInfo, showModeControls, setOnChordTagClick } from './ui/panels.js';

// State
let currentMode = 'tree';
let currentPath = [];
let collectedVoicings = [];
let playbackTimer = null;

const modes = {
  tree: treeMode,
  random: randomMode,
  weighted: weightedMode,
  dijkstra: dijkstraMode
};

// ---- Initialize ----
async function init() {
  console.log('[init] Computing layout...');
  const positions = computeLayout(250);

  console.log('[init] Initializing 3D scene...');
  const container = document.getElementById('canvas-container');
  initScene(container);

  console.log('[init] Creating nodes...');
  createNodes(positions);
  console.log('[init] Creating edges...');
  createEdges(positions);

  console.log('[init] Starting render loop...');
  startRenderLoop((delta, elapsed) => {
    updateNodes(elapsed);
  });

  console.log('[init] Setting up interaction...');
  initInteraction();

  populateDropdowns();
  showModeControls('tree');

  setupAudioOverlay();
  bindModeNav();
  bindSliders();
  bindTimelineControls();
  bindModeSpecificControls();
  setupGraphInteraction();
  setupTimelineChordClick();
  setupInfoPanelChordClick();

  initMode('tree');

  console.log('[init] Chord Composer initialized successfully');
}

// ---- Audio Overlay ----
function setupAudioOverlay() {
  const overlay = document.getElementById('audio-overlay');
  overlay.addEventListener('click', async () => {
    await initAudio();
    overlay.classList.add('hidden');
    showToast('Audio abilitato', 'success');
  });
}

// ---- Timeline Chord Click (hear individual chords) ----
function setupTimelineChordClick() {
  setOnChordClick(async (chord, index) => {
    if (!isAudioReady()) {
      await initAudio();
      document.getElementById('audio-overlay')?.classList.add('hidden');
    }
    playChordPreview(chord);

    // Brief highlight
    setPlayingIndex(index);
    setTimeout(() => setPlayingIndex(-1), 400);
  });
}

// ---- Info Panel Chord Click (select successor from panel) ----
function setupInfoPanelChordClick() {
  setOnChordTagClick((chord) => {
    const controls = getControls();
    if (controls) controls.autoRotate = false;

    // Delegate to current mode's chord selection
    modes[currentMode]?.onChordSelected?.(chord);
  });
}

// ---- Mode Navigation ----
function bindModeNav() {
  const buttons = document.querySelectorAll('#mode-nav .mode-btn');
  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      const mode = btn.dataset.mode;
      if (mode === currentMode) return;

      buttons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      switchMode(mode);
    });
  });
}

function switchMode(newMode) {
  modes[currentMode]?.destroy?.();

  resetAllNodes();
  resetAllEdges();
  clearTimeline();
  currentPath = [];
  collectedVoicings = [];
  stopCurrentPlayback();
  resetVoiceLeading();

  showModeControls(newMode);
  currentMode = newMode;

  initMode(newMode);

  const controls = getControls();
  if (controls) controls.autoRotate = true;
}

function initMode(mode) {
  const callbacks = {
    onPathChange: (path, activeIndex) => {
      currentPath = Array.isArray(path) ? path : [];
      updateTimeline(currentPath, activeIndex !== undefined ? activeIndex : -1);

      // Update undo button
      const undoBtn = document.getElementById('btn-undo');
      if (undoBtn && currentMode === 'tree') {
        undoBtn.disabled = currentPath.length === 0;
      }

      // Collect voicings
      const voicing = getCurrentVoicing();
      if (voicing) {
        updateVoiceLeadingInfo(voicing);
        if (currentPath.length > collectedVoicings.length) {
          collectedVoicings.push([...voicing]);
        }
      }
    }
  };

  modes[mode]?.init?.(callbacks);

  const controls = getControls();
  if (controls) {
    controls.autoRotate = mode !== 'tree' && mode !== 'dijkstra';
  }
}

// ---- Graph Interaction ----
function setupGraphInteraction() {
  onNodeHover((chord) => {
    if (chord) {
      updateInfoPanel(chord);
    }
  });

  onNodeClick((chord) => {
    if (!chord) return;

    const controls = getControls();
    if (controls) controls.autoRotate = false;

    // Delegate to current mode
    modes[currentMode]?.onChordSelected?.(chord);
  });
}

// ---- Sliders ----
function bindSliders() {
  const bpmSlider = document.getElementById('bpm-slider');
  const bpmValue = document.getElementById('bpm-value');
  bpmSlider.addEventListener('input', () => {
    bpmValue.textContent = bpmSlider.value;
  });

  const volSlider = document.getElementById('volume-slider');
  volSlider.addEventListener('input', () => {
    setVolume(parseInt(volSlider.value));
  });

  const randomLength = document.getElementById('random-length');
  const randomLengthVal = document.getElementById('random-length-value');
  if (randomLength) {
    randomLength.addEventListener('input', () => {
      randomLengthVal.textContent = randomLength.value;
    });
  }

  const weightedLength = document.getElementById('weighted-length');
  const weightedLengthVal = document.getElementById('weighted-length-value');
  if (weightedLength) {
    weightedLength.addEventListener('input', () => {
      weightedLengthVal.textContent = weightedLength.value;
    });
  }

  const tensionKnob = document.getElementById('tension-knob');
  const tensionVal = document.getElementById('tension-knob-value');
  if (tensionKnob) {
    tensionKnob.addEventListener('input', () => {
      tensionVal.textContent = tensionKnob.value;
    });
  }

  const directionKnob = document.getElementById('direction-knob');
  const directionVal = document.getElementById('direction-knob-value');
  if (directionKnob) {
    directionKnob.addEventListener('input', () => {
      directionVal.textContent = directionKnob.value;
    });
  }
}

// ---- Playback ----
function stopCurrentPlayback() {
  if (playbackTimer) {
    clearInterval(playbackTimer);
    playbackTimer = null;
  }
  stopPlayback();
  setPlayingIndex(-1);
}

// ---- Timeline Controls ----
function bindTimelineControls() {
  // Play
  document.getElementById('btn-play').addEventListener('click', async () => {
    if (!isAudioReady()) {
      await initAudio();
      document.getElementById('audio-overlay')?.classList.add('hidden');
    }

    if (currentPath.length === 0) {
      showToast('Nessuna progressione da riprodurre', 'error');
      return;
    }

    stopCurrentPlayback();
    resetVoiceLeading();
    collectedVoicings = [];

    const bpm = parseInt(document.getElementById('bpm-slider').value);
    // Duration of each chord in ms — 2 beats per chord
    const intervalMs = (60 / bpm) * 2 * 1000;
    // Note sounds for 80% of the interval, leaving a gap to avoid overlap
    const noteDurationSec = (intervalMs / 1000) * 0.8;
    let step = 0;

    const playStep = () => {
      if (step >= currentPath.length) {
        stopCurrentPlayback();
        return;
      }

      const chord = currentPath[step];
      const voicing = playChordSound(chord, noteDurationSec);
      if (voicing) collectedVoicings.push([...voicing]);
      setPlayingIndex(step);
      updateVoiceLeadingInfo(voicing || getCurrentVoicing());

      step++;
    };

    playStep(); // Play first immediately
    playbackTimer = setInterval(playStep, intervalMs);
  });

  // Stop
  document.getElementById('btn-stop').addEventListener('click', () => {
    stopCurrentPlayback();
  });

  // Export MIDI
  document.getElementById('btn-export-midi').addEventListener('click', async () => {
    if (currentPath.length === 0) {
      showToast('Nessuna progressione da esportare', 'error');
      return;
    }

    // Generate voicings if needed
    if (collectedVoicings.length < currentPath.length) {
      resetVoiceLeading();
      collectedVoicings = [];
      let cv = null;

      for (const chord of currentPath) {
        const notes = CHORD_NOTES[chord];
        if (!notes) continue;

        if (cv) {
          cv = optimizeVoiceLeading(cv, chord);
        } else {
          cv = notes.map((note, i) => {
            const octave = notes.length > 3 ? 3 : (i < 2 ? 3 : 4);
            return noteToMidi(note, octave);
          }).sort((a, b) => a - b);
        }
        collectedVoicings.push([...cv]);
      }
    }

    const { exportMIDI } = await import('./audio/midi-export.js');
    const bpm = parseInt(document.getElementById('bpm-slider').value);
    exportMIDI(currentPath, collectedVoicings, bpm);
    showToast(`MIDI esportato: ${currentPath.join('-')}.mid`, 'success');
  });
}

// ---- Mode-Specific Controls ----
function bindModeSpecificControls() {
  // Tree mode
  document.getElementById('btn-undo')?.addEventListener('click', () => {
    treeMode.undo();
    document.getElementById('btn-undo').disabled = !treeMode.canUndo();
  });

  document.getElementById('btn-clear')?.addEventListener('click', () => {
    treeMode.reset();
    collectedVoicings = [];
    resetVoiceLeading();
    clearTimeline();
  });

  // Random mode
  document.getElementById('btn-generate-random')?.addEventListener('click', async () => {
    if (!isAudioReady()) {
      await initAudio();
      document.getElementById('audio-overlay')?.classList.add('hidden');
    }

    const start = document.getElementById('random-start').value;
    const length = parseInt(document.getElementById('random-length').value);
    collectedVoicings = [];
    resetVoiceLeading();
    randomMode.generate(start, length);
  });

  document.getElementById('btn-clear-random')?.addEventListener('click', () => {
    randomMode.reset();
    collectedVoicings = [];
    clearTimeline();
  });

  // Weighted mode
  document.getElementById('btn-generate-weighted')?.addEventListener('click', async () => {
    if (!isAudioReady()) {
      await initAudio();
      document.getElementById('audio-overlay')?.classList.add('hidden');
    }

    const start = document.getElementById('weighted-start').value;
    const length = parseInt(document.getElementById('weighted-length').value);
    const tension = parseInt(document.getElementById('tension-knob').value);
    const direction = parseInt(document.getElementById('direction-knob').value);
    collectedVoicings = [];
    resetVoiceLeading();
    weightedMode.generate(start, length, tension, direction);
  });

  document.getElementById('btn-clear-weighted')?.addEventListener('click', () => {
    weightedMode.reset();
    collectedVoicings = [];
    clearTimeline();
  });

  // Dijkstra mode — path mode toggle
  const btnShortest = document.getElementById('btn-path-shortest');
  const btnLongest = document.getElementById('btn-path-longest');

  btnShortest?.addEventListener('click', () => {
    btnShortest.classList.add('btn--primary');
    btnLongest.classList.remove('btn--primary');
    dijkstraMode.setPathMode('shortest');
  });

  btnLongest?.addEventListener('click', () => {
    btnLongest.classList.add('btn--primary');
    btnShortest.classList.remove('btn--primary');
    dijkstraMode.setPathMode('longest');
  });

  document.getElementById('btn-undo-dijkstra')?.addEventListener('click', () => {
    dijkstraMode.undoLastClick();
    collectedVoicings = [];
    resetVoiceLeading();
  });

  document.getElementById('btn-clear-dijkstra')?.addEventListener('click', () => {
    dijkstraMode.reset();
    collectedVoicings = [];
    clearTimeline();
  });
}

// ---- Start ----
init().catch(err => {
  console.error('Failed to initialize Space Chords:', err);
  showToast(`Errore: ${err.message || err}`, 'error');
});
