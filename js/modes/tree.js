import { CHORD_GRAPH } from '../data/chords.js';
import { highlightNode, resetAllNodes, dimNodesExcept, getNodePosition } from '../graph/nodes.js';
import { highlightOutgoing, resetAllEdges, highlightEdge } from '../graph/edges.js';
import { fitCameraToPositions } from '../graph/scene.js';
import { playChordSound } from '../audio/engine.js';

let path = [];
let currentChord = null;
let onPathChange = null;

export function init(callbacks) {
  onPathChange = callbacks.onPathChange;
  reset();
}

export function destroy() {
  reset();
}

export function reset() {
  path = [];
  currentChord = null;
  resetAllNodes();
  resetAllEdges();
  if (onPathChange) onPathChange([]);
}

export function onChordSelected(chord) {
  if (currentChord === null) {
    // First chord
    currentChord = chord;
    path = [chord];
    updateVisuals();
    playChordSound(chord);
    if (onPathChange) onPathChange([...path]);
    return;
  }

  // Check if valid successor
  const successors = CHORD_GRAPH[currentChord] || [];
  if (!successors.includes(chord)) return;

  // Advance
  currentChord = chord;
  path.push(chord);
  updateVisuals();
  playChordSound(chord);
  if (onPathChange) onPathChange([...path]);
}

export function undo() {
  if (path.length <= 1) {
    reset();
    if (onPathChange) onPathChange([]);
    return;
  }

  path.pop();
  currentChord = path[path.length - 1];
  updateVisuals();
  if (onPathChange) onPathChange([...path]);
}

function updateVisuals() {
  resetAllNodes();
  resetAllEdges();

  if (!currentChord) return;

  const successors = CHORD_GRAPH[currentChord] || [];
  const activeChords = [currentChord, ...successors];

  // Keep path chords visible
  for (const c of path) {
    if (!activeChords.includes(c)) activeChords.push(c);
  }

  dimNodesExcept(activeChords);

  // Highlight current
  highlightNode(currentChord, { scale: 1.6, emissiveIntensity: 1.0 });

  // Highlight successors with pulse
  for (const s of successors) {
    highlightNode(s, { scale: 1.3, emissiveIntensity: 0.6, pulseAnim: true });
  }

  // Highlight outgoing edges
  highlightOutgoing(currentChord, 0x4a9eff);

  // Highlight path edges
  for (let i = 0; i < path.length - 1; i++) {
    highlightEdge(path[i], path[i + 1], 0x4ade80, 0.7);
  }

  // Auto-zoom to show current chord + all successors
  const positionsToFit = [getNodePosition(currentChord)];
  for (const s of successors) {
    const p = getNodePosition(s);
    if (p) positionsToFit.push(p);
  }
  fitCameraToPositions(positionsToFit, 2.0);
}

export function getPath() {
  return [...path];
}

export function canUndo() {
  return path.length > 0;
}
