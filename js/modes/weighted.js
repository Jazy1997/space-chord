import { JAZZ_PROGRESSION_MAP, CHORD_GRAPH, CHORD_NOTES, SUCCESSOR_FALLBACKS, getCommonNoteCount } from '../data/chords.js';
import { highlightNode, resetAllNodes, dimNodesExcept, getNodePosition } from '../graph/nodes.js';
import { resetAllEdges, highlightEdge, highlightPath } from '../graph/edges.js';
import { animateCamera } from '../graph/scene.js';
import { playChordSound } from '../audio/engine.js';

let path = [];
let animationTimer = null;
let onPathChange = null;

// Engine state — resets each generation
let engineState = {
  tensionCounter: 0,
  lastTwoCategories: [],
  path: []
};

export function init(callbacks) {
  onPathChange = callbacks.onPathChange;
  reset();
}

export function destroy() {
  stopAnimation();
  reset();
}

export function reset() {
  stopAnimation();
  path = [];
  engineState = { tensionCounter: 0, lastTwoCategories: [], path: [] };
  resetAllNodes();
  resetAllEdges();
  if (onPathChange) onPathChange([]);
}

// ---- Resolve the progression map for any chord ----
// If it's a key chord, use its map directly.
// If it's a successor-only chord, use its parent's map.
function getMapForChord(chord) {
  if (JAZZ_PROGRESSION_MAP[chord]) return JAZZ_PROGRESSION_MAP[chord];
  const parent = SUCCESSOR_FALLBACKS[chord];
  if (parent && JAZZ_PROGRESSION_MAP[parent]) return JAZZ_PROGRESSION_MAP[parent];
  return null;
}

// ---- Weight Calculation ----
// The two knobs create a 2D space:
//   Tension (T):   0 = safe/tonal ←→ 100 = wild/dissonant
//   Direction (D): 0 = cycle of 5ths ←→ 100 = parallel/chromatic
//
// At T=0, D=0 → very predictable ii-V-I style (cycle + low + mid dominate)
// At T=100, D=100 → wild chromatic jumps (high + parallel dominate)

function calculateWeights(current, tensionKnob, directionKnob, state) {
  const map = getMapForChord(current);

  // No map at all — flat random fallback
  if (!map) {
    const successors = CHORD_GRAPH[current] || [];
    return successors.map(s => ({ chord: s, weight: 1, category: 'mid' }));
  }

  const T = tensionKnob;   // 0–100
  const D = directionKnob; // 0–100

  // ── Compute category weights ──
  // Hard cutoffs create DRAMATIC contrast between knob extremes.
  // At T=0, D=0: ONLY low + mid + cycle (pure tonal, cycle-of-5ths).
  // At T=100, D=100: high + parallel dominate (wild chromatic).

  // LOW (resolution): dominant at low tension, fades at high
  let wLow = T < 15 ? 40 : Math.max(35 - T * 0.3, 2);

  // MID (diatonic): strong at low tension, moderate at high
  let wMid = T < 15 ? 45 : Math.max(40 - T * 0.25, 5);

  // HIGH (surprise): ZERO at low tension, ramps up
  let wHigh = T < 20 ? 0 : (T - 20) * 0.6;  // 0 until T=20, then 0→48

  // CYCLE (circle of 5ths): dominant when D<50, fades at D>50
  let wCycle = D < 20 ? 50 : Math.max(50 - D * 0.45, 3);

  // PARALLEL (chromatic/modal): ZERO when D<20, ramps up
  let wParallel = D < 20 ? 0 : (D - 20) * 0.6;  // 0 until D=20, then 0→48

  // Cross-influence: tension also boosts parallel slightly, direction also boosts high slightly
  if (T >= 20) wParallel += T * 0.1;
  if (D >= 20) wHigh += D * 0.08;

  const baseWeights = {
    low: wLow,
    mid: wMid,
    high: wHigh,
    cycle: wCycle,
    parallel: wParallel
  };

  // ── Saturation: prevent chaos ──
  // If last 2 categories were both tense, force resolution
  const last2 = state.lastTwoCategories;
  if (last2.length >= 2) {
    const tense = ['high', 'parallel'];
    if (tense.includes(last2[0]) && tense.includes(last2[1])) {
      baseWeights.low *= 5;
      baseWeights.mid *= 3;
      baseWeights.high *= 0.05;
      baseWeights.parallel *= 0.05;
      baseWeights.cycle *= 2;
    }
  }

  // ── Tension counter: progressive resolution pressure ──
  const tc = state.tensionCounter;
  if (tc >= 8) {
    baseWeights.low *= 8;
    baseWeights.mid *= 0.3;
    baseWeights.high *= 0.01;
    baseWeights.cycle *= 0.3;
    baseWeights.parallel *= 0.01;
  } else if (tc >= 5) {
    baseWeights.low *= 3;
    baseWeights.mid *= 1.5;
    baseWeights.high *= 0.2;
    baseWeights.parallel *= 0.2;
  }

  // ── Build weighted list from categories ──
  const result = [];
  const categories = ['low', 'mid', 'high', 'cycle', 'parallel'];

  for (const cat of categories) {
    // Skip categories with zero weight entirely (hard cutoff)
    if (baseWeights[cat] <= 0) continue;

    const chords = map[cat] || [];
    if (chords.length === 0) continue;

    const perChordWeight = baseWeights[cat] / chords.length;
    for (const chord of chords) {
      let w = perChordWeight;

      // Common-note bonus: small additive, max +15%
      const common = getCommonNoteCount(current, chord);
      if (common >= 2) {
        w *= 1 + Math.min(common * 0.05, 0.15);
      }

      // Avoid immediate repetition
      if (state.path.length > 0 && chord === state.path[state.path.length - 1]) {
        w *= 0.05;
      }

      result.push({ chord, weight: Math.max(w, 0.01), category: cat });
    }
  }

  return result;
}

// ---- Weighted Selection ----
function weightedSelect(current, tensionKnob, directionKnob, state) {
  const candidates = calculateWeights(current, tensionKnob, directionKnob, state);
  if (candidates.length === 0) return null;

  const totalWeight = candidates.reduce((sum, c) => sum + c.weight, 0);
  let r = Math.random() * totalWeight;

  for (const c of candidates) {
    r -= c.weight;
    if (r <= 0) {
      updateState(state, c.category, c.chord);
      return c.chord;
    }
  }

  // Fallback
  const last = candidates[candidates.length - 1];
  updateState(state, last.category, last.chord);
  return last.chord;
}

function updateState(state, category, chord) {
  // Update tension counter
  if (category === 'low') {
    state.tensionCounter = Math.max(0, state.tensionCounter - 3);
  } else if (category === 'mid' || category === 'cycle') {
    state.tensionCounter = Math.max(0, state.tensionCounter - 1);
  } else if (category === 'high' || category === 'parallel') {
    state.tensionCounter += 2;
  }
  state.tensionCounter = Math.min(state.tensionCounter, 10);

  // Track last two categories
  state.lastTwoCategories.push(category);
  if (state.lastTwoCategories.length > 2) {
    state.lastTwoCategories.shift();
  }

  state.path.push(chord);
}

// ---- Generate Progression ----
export function generate(startChord, length, tensionKnob = 30, directionKnob = 50) {
  reset();

  if (!CHORD_GRAPH[startChord]) return [];

  // Reset engine state
  engineState = {
    tensionCounter: 0,
    lastTwoCategories: [],
    path: [startChord]
  };

  path = [startChord];
  let current = startChord;

  for (let i = 1; i < length; i++) {
    const next = weightedSelect(current, tensionKnob, directionKnob, engineState);
    if (!next) break;
    path.push(next);
    current = next;
  }

  animateGeneration();
  return [...path];
}

// ---- Animation ----
function animateGeneration() {
  let step = 0;
  resetAllNodes();
  resetAllEdges();

  const allChords = [...new Set(path)];
  dimNodesExcept(allChords);

  const bpm = parseInt(document.getElementById('bpm-slider')?.value || '100');
  const interval = (60 / bpm) * 1000;

  animationTimer = setInterval(() => {
    if (step >= path.length) {
      stopAnimation();
      highlightPath(path, 0xffb347);
      for (const c of path) {
        highlightNode(c, { scale: 1.2, emissiveIntensity: 0.5 });
      }
      highlightNode(path[path.length - 1], { scale: 1.5, emissiveIntensity: 0.8 });
      return;
    }

    const chord = path[step];
    highlightNode(chord, { scale: 1.5, emissiveIntensity: 0.8 });

    if (step > 0) {
      highlightEdge(path[step - 1], chord, 0xffb347, 0.8);
      highlightNode(path[step - 1], { scale: 1.1, emissiveIntensity: 0.4 });
    }

    playChordSound(chord, interval / 1000 * 0.8);

    const pos = getNodePosition(chord);
    if (pos) {
      animateCamera(
        { x: pos.x + 8, y: pos.y + 5, z: pos.z + 10 },
        { x: pos.x, y: pos.y, z: pos.z },
        interval / 1000 * 0.8
      );
    }

    if (onPathChange) onPathChange(path.slice(0, step + 1));
    step++;
  }, interval);
}

function stopAnimation() {
  if (animationTimer) {
    clearInterval(animationTimer);
    animationTimer = null;
  }
}

export function getPath() {
  return [...path];
}
