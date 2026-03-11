import { CHORD_GRAPH, CHORD_FAMILIES } from '../data/chords.js';

// Force-directed 3D layout with pre-seeded cluster positions

// Cluster centers (triangle vertices for 3 groups)
const CLUSTER_CENTERS = {
  'Do Maggiore': { x: -15, y: 5,  z: -8 },
  'Do Minore':   { x: 15,  y: 5,  z: -8 },
  'Modale':      { x: 0,   y: -8, z: 12 }
};

export function computeLayout(iterations = 200) {
  const chords = Object.keys(CHORD_GRAPH);
  const positions = {};

  // Build reverse lookup: chord → family center
  const chordToCenter = {};
  for (const [familyName, members] of Object.entries(CHORD_FAMILIES)) {
    for (const m of members) {
      chordToCenter[m] = CLUSTER_CENTERS[familyName];
    }
  }

  // Initialize positions near cluster centers
  for (const [familyName, members] of Object.entries(CHORD_FAMILIES)) {
    const center = CLUSTER_CENTERS[familyName];
    const count = members.length;

    members.forEach((chord, i) => {
      // Arrange in a circle around cluster center
      const angle = (i / count) * Math.PI * 2;
      const radius = 5 + Math.random() * 2;
      positions[chord] = {
        x: center.x + Math.cos(angle) * radius,
        y: center.y + (Math.random() - 0.5) * 4,
        z: center.z + Math.sin(angle) * radius
      };
    });
  }

  // Build reverse lookup: who references each chord as a successor
  const incomingFrom = {};
  for (const [source, targets] of Object.entries(CHORD_GRAPH)) {
    for (const t of targets) {
      if (!incomingFrom[t]) incomingFrom[t] = [];
      incomingFrom[t].push(source);
    }
  }

  // Place unassigned chords near the cluster of whoever POINTS TO them
  for (const chord of chords) {
    if (positions[chord]) continue;

    // Prefer incoming edges (who uses this chord) over outgoing
    const referrers = incomingFrom[chord] || [];
    let center = null;
    for (const ref of referrers) {
      if (chordToCenter[ref]) {
        center = chordToCenter[ref];
        break;
      }
    }

    // Fallback: try outgoing neighbors
    if (!center) {
      const neighbors = CHORD_GRAPH[chord] || [];
      for (const n of neighbors) {
        if (chordToCenter[n]) {
          center = chordToCenter[n];
          break;
        }
      }
    }

    if (!center) center = { x: 0, y: 0, z: 0 };

    const angle = Math.random() * Math.PI * 2;
    const radius = 6 + Math.random() * 3;
    positions[chord] = {
      x: center.x + Math.cos(angle) * radius,
      y: center.y + (Math.random() - 0.5) * 5,
      z: center.z + Math.sin(angle) * radius
    };
  }

  // Force-directed simulation
  const repulsionStrength = 50;
  const attractionStrength = 0.02;
  const centeringStrength = 0.001;
  const damping = 0.95;

  const velocities = {};
  for (const chord of chords) {
    velocities[chord] = { x: 0, y: 0, z: 0 };
  }

  for (let iter = 0; iter < iterations; iter++) {
    const temp = 1 - iter / iterations; // cooling

    // Repulsion: all pairs
    for (let i = 0; i < chords.length; i++) {
      for (let j = i + 1; j < chords.length; j++) {
        const a = chords[i];
        const b = chords[j];
        const dx = positions[a].x - positions[b].x;
        const dy = positions[a].y - positions[b].y;
        const dz = positions[a].z - positions[b].z;
        const distSq = dx * dx + dy * dy + dz * dz + 0.01;
        const dist = Math.sqrt(distSq);
        const force = (repulsionStrength * temp) / distSq;

        const fx = (dx / dist) * force;
        const fy = (dy / dist) * force;
        const fz = (dz / dist) * force;

        velocities[a].x += fx;
        velocities[a].y += fy;
        velocities[a].z += fz;
        velocities[b].x -= fx;
        velocities[b].y -= fy;
        velocities[b].z -= fz;
      }
    }

    // Attraction: edges
    for (const [source, targets] of Object.entries(CHORD_GRAPH)) {
      for (const target of targets) {
        if (!positions[target] || !positions[source]) continue;
        const dx = positions[target].x - positions[source].x;
        const dy = positions[target].y - positions[source].y;
        const dz = positions[target].z - positions[source].z;
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz + 0.01);

        const idealDist = 6;
        const force = (dist - idealDist) * attractionStrength * temp;

        const fx = (dx / dist) * force;
        const fy = (dy / dist) * force;
        const fz = (dz / dist) * force;

        velocities[source].x += fx;
        velocities[source].y += fy;
        velocities[source].z += fz;
        velocities[target].x -= fx;
        velocities[target].y -= fy;
        velocities[target].z -= fz;
      }
    }

    // Centering force (pull toward cluster center)
    for (const [familyName, members] of Object.entries(CHORD_FAMILIES)) {
      const center = CLUSTER_CENTERS[familyName];
      for (const chord of members) {
        const dx = center.x - positions[chord].x;
        const dy = center.y - positions[chord].y;
        const dz = center.z - positions[chord].z;

        velocities[chord].x += dx * centeringStrength;
        velocities[chord].y += dy * centeringStrength;
        velocities[chord].z += dz * centeringStrength;
      }
    }

    // Apply velocities
    for (const chord of chords) {
      velocities[chord].x *= damping;
      velocities[chord].y *= damping;
      velocities[chord].z *= damping;

      positions[chord].x += velocities[chord].x;
      positions[chord].y += velocities[chord].y;
      positions[chord].z += velocities[chord].z;
    }
  }

  return positions;
}
