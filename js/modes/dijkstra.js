import { CHORD_GRAPH } from '../data/chords.js';
import { highlightNode, resetAllNodes, dimNodesExcept, getNodePosition } from '../graph/nodes.js';
import { resetAllEdges, highlightPath as highlightEdgePath, dimEdgesExcept } from '../graph/edges.js';
import { animateCamera, fitCameraToPositions } from '../graph/scene.js';
import { playChordSound } from '../audio/engine.js';

let path = [];
let waypoints = [];     // [start, ...stops, end]
let pathMode = 'shortest'; // 'shortest' | 'longest'
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
  waypoints = [];
  resetAllNodes();
  resetAllEdges();
  if (onPathChange) onPathChange([]);
  updateSelectionUI();
}

export function setPathMode(mode) {
  pathMode = mode;
  // Recompute if we already have waypoints
  if (waypoints.length >= 2) {
    computeFullPath();
  }
}

export function getPathMode() {
  return pathMode;
}

// Progressive click logic:
// 1st click = start
// 2nd click = end → compute path
// 3rd+ click = previous end becomes intermediate stop, new click becomes end
export function onChordSelected(chord) {
  if (waypoints.length === 0) {
    // First click: set start
    waypoints = [chord];
    highlightNode(chord, { scale: 1.6, emissiveIntensity: 1.0 });
    updateSelectionUI();
    playChordSound(chord);
  } else if (waypoints.length === 1) {
    // Second click: set end
    if (chord === waypoints[0]) return;
    waypoints.push(chord);
    computeFullPath();
    playChordSound(chord);
  } else {
    // 3rd+ click: current end becomes intermediate, new click is the new end
    waypoints.push(chord);
    computeFullPath();
    playChordSound(chord);
  }
}

// Undo last click
export function undoLastClick() {
  if (waypoints.length === 0) return;

  waypoints.pop();

  if (waypoints.length < 2) {
    // Not enough for a path, just show the start point
    path = [];
    resetAllNodes();
    resetAllEdges();
    if (waypoints.length === 1) {
      highlightNode(waypoints[0], { scale: 1.6, emissiveIntensity: 1.0 });
    }
    if (onPathChange) onPathChange([]);
    updateSelectionUI();
  } else {
    computeFullPath();
  }
}

// Remove a waypoint by index (for inline buttons)
export function removeWaypoint(index) {
  if (index <= 0 || index >= waypoints.length - 1) return;
  waypoints.splice(index, 1);
  if (waypoints.length >= 2) {
    computeFullPath();
  }
}

// Compute path through all waypoints
function computeFullPath() {
  if (waypoints.length < 2) return null;

  path = [];
  let failed = false;
  const findFn = pathMode === 'longest' ? findLongestPath : findShortestPath;

  for (let i = 0; i < waypoints.length - 1; i++) {
    const segment = findFn(CHORD_GRAPH, waypoints[i], waypoints[i + 1]);
    if (!segment) {
      failed = true;
      break;
    }

    // Avoid duplicating the connecting waypoint
    if (i > 0 && segment.length > 0) {
      path.push(...segment.slice(1));
    } else {
      path.push(...segment);
    }
  }

  if (failed) {
    path = [];
    if (onPathChange) onPathChange([]);
    updateSelectionUI();
    return null;
  }

  showPath();
  if (onPathChange) onPathChange([...path]);
  return [...path];
}

// Called from app.js btn-find-path (kept for backward compat)
export function findPath(start, end) {
  reset();
  waypoints = [start, end];
  return computeFullPath();
}

// ── Shortest path (Dijkstra) ──────────────────────────────

class PriorityQueue {
  constructor() { this.items = []; }
  enqueue(item, priority) {
    this.items.push({ item, priority });
    this.items.sort((a, b) => a.priority - b.priority);
  }
  dequeue() { return this.items.shift()?.item; }
  isEmpty() { return this.items.length === 0; }
}

function findShortestPath(graph, start, end) {
  if (!graph[start]) return null;
  if (start === end) return [start];

  const dist = { [start]: 0 };
  const prev = {};
  const queue = new PriorityQueue();
  const visited = new Set();

  queue.enqueue(start, 0);

  while (!queue.isEmpty()) {
    const current = queue.dequeue();
    if (current === end) break;
    if (visited.has(current)) continue;
    visited.add(current);

    for (const neighbor of (graph[current] || [])) {
      const newDist = dist[current] + 1;
      if (newDist < (dist[neighbor] ?? Infinity)) {
        dist[neighbor] = newDist;
        prev[neighbor] = current;
        queue.enqueue(neighbor, newDist);
      }
    }
  }

  const result = [];
  let node = end;
  while (node !== undefined) {
    result.unshift(node);
    node = prev[node];
  }

  return result[0] === start ? result : null;
}

// ── Longest path (most unique chords, least repetitions) ──

function findLongestPath(graph, start, end) {
  if (!graph[start]) return null;
  if (start === end) return [start];

  // DFS with visited set (simple paths only) + time budget to avoid freezing
  const MAX_DEPTH = 15;
  const TIME_BUDGET = 400; // ms
  const t0 = Date.now();
  let bestPath = null;
  let bestLength = 0;

  function dfs(current, target, visited, currentPath, depth) {
    if (depth > MAX_DEPTH) return;
    if (Date.now() - t0 > TIME_BUDGET) return;

    if (current === target && currentPath.length >= 2) {
      if (currentPath.length > bestLength) {
        bestLength = currentPath.length;
        bestPath = [...currentPath];
      }
      return;
    }

    const neighbors = graph[current] || [];
    for (const neighbor of neighbors) {
      if (visited.has(neighbor) && neighbor !== target) continue;

      visited.add(neighbor);
      currentPath.push(neighbor);
      dfs(neighbor, target, visited, currentPath, depth + 1);
      currentPath.pop();
      if (neighbor !== target) visited.delete(neighbor);
    }
  }

  const visited = new Set([start]);
  dfs(start, end, visited, [start], 0);

  return bestPath;
}

// ── Visualization ─────────────────────────────────────────

function showPath() {
  resetAllNodes();
  resetAllEdges();

  if (path.length === 0) return;

  dimNodesExcept(path);
  dimEdgesExcept(path);

  const pathColor = pathMode === 'longest' ? 0xf0a050 : 0xa78bfa;
  highlightEdgePath(path, pathColor);

  // Highlight waypoints
  for (let i = 0; i < waypoints.length; i++) {
    const wp = waypoints[i];
    if (i === 0) {
      highlightNode(wp, { scale: 1.6, emissiveIntensity: 1.0 });
    } else if (i === waypoints.length - 1) {
      highlightNode(wp, { scale: 1.6, emissiveIntensity: 1.0 });
    } else {
      highlightNode(wp, { scale: 1.4, emissiveIntensity: 0.9 });
    }
  }

  // Middle path nodes
  const waypointSet = new Set(waypoints);
  for (const c of path) {
    if (!waypointSet.has(c)) {
      highlightNode(c, { scale: 1.1, emissiveIntensity: 0.5 });
    }
  }

  // Fit camera
  const positions = path.map(c => getNodePosition(c)).filter(p => p);
  fitCameraToPositions(positions, 1.8);

  updateSelectionUI();
}

function updateSelectionUI() {
  const container = document.getElementById('waypoints-display');
  if (!container) return;

  if (waypoints.length === 0) {
    container.innerHTML = '<span style="font-size:12px; color:var(--text-muted)">Clicca un nodo nel grafo per selezionare la partenza</span>';
    return;
  }

  if (waypoints.length === 1) {
    container.innerHTML = `
      <div style="display:flex; align-items:center; gap:8px; margin-bottom:4px;">
        <span style="font-size:10px; color:var(--accent-green); min-width:50px">Partenza</span>
        <span style="font-family:var(--font-mono); font-size:13px; font-weight:600; color:var(--text-primary)">${waypoints[0]}</span>
      </div>
      <div style="margin-top:4px; font-size:11px; color:var(--text-muted)">Clicca un altro nodo per l'arrivo</div>
    `;
    return;
  }

  let html = '';
  waypoints.forEach((wp, i) => {
    const label = i === 0 ? 'Partenza' : i === waypoints.length - 1 ? 'Arrivo' : `Tappa ${i}`;
    const color = i === 0 ? 'var(--accent-green)' : i === waypoints.length - 1 ? 'var(--accent-purple)' : 'var(--chord-dom7)';

    html += `<div style="display:flex; align-items:center; gap:8px; margin-bottom:4px;">
      <span style="font-size:10px; color:${color}; min-width:50px">${label}</span>
      <span style="font-family:var(--font-mono); font-size:13px; font-weight:600; color:var(--text-primary)">${wp}</span>
      ${i > 0 && i < waypoints.length - 1 ? `<button class="btn btn--sm btn--danger" onclick="window.__removeWaypoint(${i})" style="padding:2px 6px; font-size:10px">\u2715</button>` : ''}
    </div>`;

    if (i < waypoints.length - 1) {
      html += '<div style="margin-left:24px; color:var(--text-muted); font-size:11px">\u2193</div>';
    }
  });

  if (path.length > 0) {
    const uniqueCount = new Set(path).size;
    html += `<div style="margin-top:8px; font-size:11px; color:var(--text-secondary)">
      Percorso: ${path.length} accordi (${uniqueCount} unici)
      ${pathMode === 'longest' ? ' \u2014 pi\u00f9 lungo' : ' \u2014 pi\u00f9 breve'}
    </div>`;
  } else if (waypoints.length >= 2) {
    html += '<div style="margin-top:8px; font-size:11px; color:var(--text-error)">Nessun percorso trovato</div>';
  }

  container.innerHTML = html;
}

// Expose waypoint removal globally for inline onclick
window.__removeWaypoint = function(index) {
  removeWaypoint(index);
};

// Animate playback along the path
export function animatePlayback() {
  if (path.length === 0) return;

  let step = 0;
  const bpm = parseInt(document.getElementById('bpm-slider')?.value || '100');
  const interval = (60 / bpm) * 1000;

  animationTimer = setInterval(() => {
    if (step >= path.length) {
      stopAnimation();
      return;
    }

    const chord = path[step];
    playChordSound(chord, interval / 1000 * 0.8);

    highlightNode(chord, { scale: 1.8, emissiveIntensity: 1.0 });
    if (step > 0) {
      highlightNode(path[step - 1], { scale: 1.1, emissiveIntensity: 0.5 });
    }

    const pos = getNodePosition(chord);
    if (pos) {
      animateCamera(
        { x: pos.x + 6, y: pos.y + 4, z: pos.z + 8 },
        { x: pos.x, y: pos.y, z: pos.z },
        interval / 1000 * 0.7
      );
    }

    if (onPathChange) onPathChange(path, step);
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

export function getWaypoints() {
  return [...waypoints];
}
