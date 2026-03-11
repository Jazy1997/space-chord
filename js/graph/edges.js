import * as THREE from 'three';
import { CHORD_GRAPH } from '../data/chords.js';
import { edgeGroup } from './scene.js';

const edgeMeshes = {};   // "source->target" -> { line, arrow }

const EDGE_COLOR_DEFAULT = new THREE.Color(0x222244);
const EDGE_OPACITY_DEFAULT = 0.08;

export function createEdges(positions) {
  for (const [source, targets] of Object.entries(CHORD_GRAPH)) {
    for (const target of targets) {
      const key = `${source}->${target}`;
      const srcPos = positions[source];
      const tgtPos = positions[target];

      if (!srcPos || !tgtPos) continue;

      const start = new THREE.Vector3(srcPos.x, srcPos.y, srcPos.z);
      const end = new THREE.Vector3(tgtPos.x, tgtPos.y, tgtPos.z);

      // Curved midpoint
      const mid = new THREE.Vector3().lerpVectors(start, end, 0.5);
      const direction = new THREE.Vector3().subVectors(end, start);
      const perpendicular = new THREE.Vector3(-direction.z, direction.y * 0.3, direction.x).normalize();
      mid.add(perpendicular.multiplyScalar(direction.length() * 0.12));

      const curve = new THREE.QuadraticBezierCurve3(start, mid, end);

      // Line — simple but elegant (no tubes, use Line2-style)
      const points = curve.getPoints(30);
      const lineGeo = new THREE.BufferGeometry().setFromPoints(points);
      const lineMat = new THREE.LineBasicMaterial({
        color: EDGE_COLOR_DEFAULT,
        transparent: true,
        opacity: EDGE_OPACITY_DEFAULT,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      });
      const line = new THREE.Line(lineGeo, lineMat);

      // Small dot at the end (arrow indicator)
      const dotGeo = new THREE.SphereGeometry(0.08, 6, 6);
      const dotMat = new THREE.MeshBasicMaterial({
        color: EDGE_COLOR_DEFAULT,
        transparent: true,
        opacity: EDGE_OPACITY_DEFAULT,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      });
      const dot = new THREE.Mesh(dotGeo, dotMat);
      const arrowPoint = curve.getPointAt(0.88);
      dot.position.copy(arrowPoint);

      edgeGroup.add(line);
      edgeGroup.add(dot);

      edgeMeshes[key] = { line, dot, curve };
    }
  }
}

function edgeKey(source, target) {
  return `${source}->${target}`;
}

export function highlightEdge(source, target, color = 0x4a9eff, opacity = 0.7) {
  const key = edgeKey(source, target);
  const edge = edgeMeshes[key];
  if (!edge) return;

  edge.line.material.color.setHex(color);
  edge.line.material.opacity = opacity;
  edge.dot.material.color.setHex(color);
  edge.dot.material.opacity = opacity;
}

export function resetEdge(source, target) {
  const key = edgeKey(source, target);
  const edge = edgeMeshes[key];
  if (!edge) return;

  edge.line.material.color.copy(EDGE_COLOR_DEFAULT);
  edge.line.material.opacity = EDGE_OPACITY_DEFAULT;
  edge.dot.material.color.copy(EDGE_COLOR_DEFAULT);
  edge.dot.material.opacity = EDGE_OPACITY_DEFAULT;
}

export function resetAllEdges() {
  for (const edge of Object.values(edgeMeshes)) {
    edge.line.material.color.copy(EDGE_COLOR_DEFAULT);
    edge.line.material.opacity = EDGE_OPACITY_DEFAULT;
    edge.dot.material.color.copy(EDGE_COLOR_DEFAULT);
    edge.dot.material.opacity = EDGE_OPACITY_DEFAULT;
  }
}

export function highlightOutgoing(chord, color = 0x4a9eff) {
  const targets = CHORD_GRAPH[chord] || [];
  for (const target of targets) {
    highlightEdge(chord, target, color, 0.5);
  }
}

export function highlightPath(path, color = 0x4a9eff) {
  for (let i = 0; i < path.length - 1; i++) {
    highlightEdge(path[i], path[i + 1], color, 0.85);
  }
}

export function dimEdgesExcept(path) {
  const activeKeys = new Set();
  for (let i = 0; i < path.length - 1; i++) {
    activeKeys.add(edgeKey(path[i], path[i + 1]));
  }

  for (const [key, edge] of Object.entries(edgeMeshes)) {
    if (activeKeys.has(key)) {
      edge.line.material.opacity = 0.7;
      edge.dot.material.opacity = 0.7;
    } else {
      edge.line.material.opacity = 0.02;
      edge.dot.material.opacity = 0.02;
    }
  }
}

export function getEdgeCurve(source, target) {
  const key = edgeKey(source, target);
  const edge = edgeMeshes[key];
  return edge ? edge.curve : null;
}
