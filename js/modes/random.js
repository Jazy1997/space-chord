import { CHORD_GRAPH } from '../data/chords.js';
import { highlightNode, resetAllNodes, dimNodesExcept, getNodePosition } from '../graph/nodes.js';
import { resetAllEdges, highlightEdge, highlightPath } from '../graph/edges.js';
import { animateCamera } from '../graph/scene.js';
import { playChordSound } from '../audio/engine.js';

let path = [];
let animationTimer = null;
let onPathChange = null;

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
  resetAllNodes();
  resetAllEdges();
  if (onPathChange) onPathChange([]);
}

export function generate(startChord, length) {
  reset();

  if (!CHORD_GRAPH[startChord]) return [];

  path = [startChord];
  let current = startChord;

  for (let i = 1; i < length; i++) {
    const successors = CHORD_GRAPH[current];
    if (!successors || successors.length === 0) break;
    const next = successors[Math.floor(Math.random() * successors.length)];
    path.push(next);
    current = next;
  }

  // Animate the generation
  animateGeneration();

  return [...path];
}

function animateGeneration() {
  let step = 0;
  resetAllNodes();
  resetAllEdges();

  // Show first chord
  const allChords = [...new Set(path)];
  dimNodesExcept(allChords);

  const bpm = parseInt(document.getElementById('bpm-slider')?.value || '100');
  const interval = (60 / bpm) * 1000; // ms per beat

  animationTimer = setInterval(() => {
    if (step >= path.length) {
      stopAnimation();
      // Final state: highlight full path
      highlightPath(path, 0x4ade80);
      for (const c of path) {
        highlightNode(c, { scale: 1.2, emissiveIntensity: 0.5 });
      }
      highlightNode(path[path.length - 1], { scale: 1.5, emissiveIntensity: 0.8 });
      return;
    }

    const chord = path[step];

    // Highlight current node
    highlightNode(chord, { scale: 1.5, emissiveIntensity: 0.8 });

    // Highlight edge from previous
    if (step > 0) {
      highlightEdge(path[step - 1], chord, 0x4ade80, 0.8);
      // Reset previous node to smaller
      highlightNode(path[step - 1], { scale: 1.1, emissiveIntensity: 0.4 });
    }

    // Play sound — duration matches interval to avoid overlap
    playChordSound(chord, interval / 1000 * 0.8);

    // Camera follow
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
