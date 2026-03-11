import * as THREE from 'three';
import { CHORD_GRAPH, CHORD_TYPE, JAZZ_PROGRESSION_MAP } from '../data/chords.js';
import { nodeGroup, labelGroup } from './scene.js';

// Color palette per tipo accordo
const TYPE_COLORS = {
  major7:   new THREE.Color(0xe8d8a0),  // warm gold-white
  minor7:   new THREE.Color(0x5b8def),  // soft blue
  dom7:     new THREE.Color(0xf0a050),  // warm amber
  half_dim: new THREE.Color(0xb088d0),  // muted purple
  dim7:     new THREE.Color(0xd05050),  // deep red
  aug:      new THREE.Color(0x50d0a0),  // teal
  // Fallback per vecchi tipi (compatibilità)
  minor:    new THREE.Color(0x5b8def),
  major:    new THREE.Color(0xc8c8d8)
};

const TYPE_GLOW = {
  major7:   new THREE.Color(0x665520),
  minor7:   new THREE.Color(0x2244aa),
  dom7:     new THREE.Color(0x885520),
  half_dim: new THREE.Color(0x442266),
  dim7:     new THREE.Color(0x662020),
  aug:      new THREE.Color(0x206644),
  minor:    new THREE.Color(0x2244aa),
  major:    new THREE.Color(0x555566)
};

const nodeMeshes = {};  // chord -> group (sphere + ring)
const nodeSpheres = {}; // chord -> inner sphere mesh
const hitMeshes = [];   // invisible hit spheres for raycasting
const labelSprites = {}; // chord -> sprite
const nodeBaseScale = {};
const nodeRings = {};   // chord -> ring mesh

export function createNodes(positions) {
  const chords = Object.keys(CHORD_GRAPH);

  for (const chord of chords) {
    const type = CHORD_TYPE[chord] || 'major';
    const color = TYPE_COLORS[type];
    const glow = TYPE_GLOW[type];
    const isKey = chord in JAZZ_PROGRESSION_MAP; // key chords are bigger
    const sizeMul = isKey ? 1.4 : 0.8; // 1.4x for key, 0.8x for satellite

    // Node group
    const group = new THREE.Group();
    const pos = positions[chord];
    group.position.set(pos.x, pos.y, pos.z);
    group.userData = { chord, type, isKey };

    // Inner sphere — small, bright core
    const sphereGeo = new THREE.SphereGeometry(0.35 * sizeMul, 20, 20);
    const sphereMat = new THREE.MeshBasicMaterial({
      color: color,
      transparent: true,
      opacity: isKey ? 0.95 : 0.7
    });
    const sphere = new THREE.Mesh(sphereGeo, sphereMat);
    group.add(sphere);

    // Outer glow sphere — larger, transparent
    const glowGeo = new THREE.SphereGeometry(0.6 * sizeMul, 16, 16);
    const glowMat = new THREE.MeshBasicMaterial({
      color: glow,
      transparent: true,
      opacity: isKey ? 0.2 : 0.08,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    const glowSphere = new THREE.Mesh(glowGeo, glowMat);
    group.add(glowSphere);

    // Orbital ring — only for key chords
    const ringGeo = new THREE.TorusGeometry(0.7 * sizeMul, isKey ? 0.03 : 0.015, 8, 32);
    const ringMat = new THREE.MeshBasicMaterial({
      color: color,
      transparent: true,
      opacity: isKey ? 0.4 : 0.15,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI * 0.5;
    group.add(ring);
    nodeRings[chord] = ring;

    nodeGroup.add(group);
    nodeMeshes[chord] = group;
    nodeSpheres[chord] = sphere;
    nodeBaseScale[chord] = 1;

    // Raycasting target — invisible larger sphere at world position
    const hitGeo = new THREE.SphereGeometry(isKey ? 1.2 : 0.9, 8, 8);
    const hitMat = new THREE.MeshBasicMaterial({ visible: false });
    const hitMesh = new THREE.Mesh(hitGeo, hitMat);
    hitMesh.position.set(pos.x, pos.y, pos.z);
    hitMesh.userData = { chord, type };
    nodeGroup.add(hitMesh);
    hitMeshes.push(hitMesh);

    // Text label sprite
    const sprite = createLabelSprite(chord, color, isKey);
    sprite.position.set(pos.x, pos.y + (isKey ? 1.5 : 1.1), pos.z);
    sprite.userData = { chord };
    labelGroup.add(sprite);
    labelSprites[chord] = sprite;
  }
}

function createLabelSprite(text, color, isKey = true) {
  const canvas = document.createElement('canvas');
  const size = 256;
  canvas.width = size;
  canvas.height = size / 2;
  const ctx = canvas.getContext('2d');

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Subtle text shadow — stronger for key chords
  ctx.shadowColor = `rgba(${Math.round(color.r * 255)}, ${Math.round(color.g * 255)}, ${Math.round(color.b * 255)}, ${isKey ? 0.6 : 0.2})`;
  ctx.shadowBlur = isKey ? 16 : 8;

  const fontSize = isKey ? 56 : 44;
  ctx.font = `bold ${fontSize}px JetBrains Mono, monospace`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = `rgba(${Math.round(color.r * 255)}, ${Math.round(color.g * 255)}, ${Math.round(color.b * 255)}, ${isKey ? 1 : 0.7})`;
  ctx.fillText(text, canvas.width / 2, canvas.height / 2);

  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearFilter;

  const material = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthTest: false,
    sizeAttenuation: true
  });

  const sprite = new THREE.Sprite(material);
  const scaleMul = isKey ? 1.0 : 0.75;
  sprite.scale.set(2.8 * scaleMul, 1.4 * scaleMul, 1);

  return sprite;
}

// Get all hit meshes for raycasting
export function getAllNodeMeshes() {
  return hitMeshes;
}

// Highlight a node
export function highlightNode(chord, options = {}) {
  const group = nodeMeshes[chord];
  if (!group) return;

  const { scale = 1.5, emissiveIntensity = 0.8, pulseAnim = false } = options;

  group.scale.setScalar(scale);
  nodeBaseScale[chord] = scale;

  // Brighten the inner sphere
  const sphere = group.children[0];
  if (sphere) sphere.material.opacity = 1.0;

  // Brighten the glow
  const glowSphere = group.children[1];
  if (glowSphere) glowSphere.material.opacity = 0.3 * emissiveIntensity;

  // Brighten ring
  const ring = nodeRings[chord];
  if (ring) ring.material.opacity = 0.6 * emissiveIntensity;

  if (pulseAnim) {
    group.userData.pulse = true;
  }
}

// Reset a single node to default
export function resetNode(chord) {
  const group = nodeMeshes[chord];
  if (!group) return;

  group.scale.setScalar(1);
  nodeBaseScale[chord] = 1;
  group.userData.pulse = false;

  const sphere = group.children[0];
  if (sphere) sphere.material.opacity = 0.95;

  const glowSphere = group.children[1];
  if (glowSphere) glowSphere.material.opacity = 0.15;

  const ring = nodeRings[chord];
  if (ring) ring.material.opacity = 0.3;
}

// Reset all nodes
export function resetAllNodes() {
  for (const chord of Object.keys(nodeMeshes)) {
    resetNode(chord);
  }
}

// Dim all nodes except the given list
export function dimNodesExcept(activeChords) {
  const activeSet = new Set(activeChords);
  for (const [chord, group] of Object.entries(nodeMeshes)) {
    const sphere = group.children[0];
    const glowSphere = group.children[1];
    const ring = nodeRings[chord];

    if (activeSet.has(chord)) {
      if (sphere) sphere.material.opacity = 0.95;
      if (glowSphere) glowSphere.material.opacity = 0.15;
      if (ring) ring.material.opacity = 0.3;
    } else {
      if (sphere) sphere.material.opacity = 0.12;
      if (glowSphere) glowSphere.material.opacity = 0.02;
      if (ring) ring.material.opacity = 0.04;
    }

    // Dim label
    const label = labelSprites[chord];
    if (label) label.material.opacity = activeSet.has(chord) ? 1.0 : 0.1;
  }
}

// Update node animations
export function updateNodes(elapsed) {
  for (const [chord, group] of Object.entries(nodeMeshes)) {
    // Rotate rings gently
    const ring = nodeRings[chord];
    if (ring) {
      ring.rotation.z = elapsed * 0.3 + chord.charCodeAt(0) * 0.1;
    }

    // Pulse animation
    if (group.userData.pulse) {
      const s = nodeBaseScale[chord];
      const pulse = s + Math.sin(elapsed * 3.5) * 0.12;
      group.scale.setScalar(pulse);
    }
  }
}

export function getNodePosition(chord) {
  const group = nodeMeshes[chord];
  if (!group) return null;
  return group.position.clone();
}
