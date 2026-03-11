import * as THREE from 'three';
import { getCamera, getRenderer } from './scene.js';
import { getAllNodeMeshes } from './nodes.js';

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

let hoveredChord = null;
let onHoverCallback = null;
let onClickCallback = null;
let enabled = true;
let frameCounter = 0;

export function initInteraction() {
  const renderer = getRenderer();
  const canvas = renderer.domElement;

  canvas.addEventListener('mousemove', onMouseMove);
  canvas.addEventListener('click', onClick);
  canvas.addEventListener('touchend', onTouchEnd);
}

function getMousePosition(event, target) {
  const rect = target.getBoundingClientRect();
  mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
}

function onMouseMove(event) {
  if (!enabled) return;

  // Throttle raycasting to every 3rd frame
  frameCounter++;
  if (frameCounter % 3 !== 0) return;

  getMousePosition(event, event.target);
  performRaycast(false);
}

function onClick(event) {
  if (!enabled) return;
  getMousePosition(event, event.target);
  performRaycast(true);
}

function onTouchEnd(event) {
  if (!enabled) return;
  if (event.changedTouches.length === 0) return;

  const touch = event.changedTouches[0];
  getMousePosition(touch, event.target);
  performRaycast(true);
}

function performRaycast(isClick) {
  const camera = getCamera();
  raycaster.setFromCamera(mouse, camera);

  const meshes = getAllNodeMeshes();
  const intersects = raycaster.intersectObjects(meshes);

  if (intersects.length > 0) {
    const chord = intersects[0].object.userData.chord;

    if (isClick) {
      if (onClickCallback) onClickCallback(chord);
    } else {
      if (chord !== hoveredChord) {
        hoveredChord = chord;
        if (onHoverCallback) onHoverCallback(chord);
        // Change cursor
        getRenderer().domElement.style.cursor = 'pointer';
      }
    }
  } else {
    if (hoveredChord !== null) {
      hoveredChord = null;
      if (onHoverCallback) onHoverCallback(null);
      getRenderer().domElement.style.cursor = 'default';
    }
  }
}

export function onNodeHover(callback) {
  onHoverCallback = callback;
}

export function onNodeClick(callback) {
  onClickCallback = callback;
}

export function setInteractionEnabled(flag) {
  enabled = flag;
}

export function getHoveredChord() {
  return hoveredChord;
}
