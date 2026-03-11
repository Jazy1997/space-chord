import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';

let renderer, scene, camera, controls, composer, bloomPass;
let container;
let animationId;
let starField;
const clock = new THREE.Clock();

// Groups for organizing scene objects
export const nodeGroup = new THREE.Group();
export const edgeGroup = new THREE.Group();
export const particleGroup = new THREE.Group();
export const labelGroup = new THREE.Group();

export function initScene(containerEl) {
  container = containerEl;
  const w = container.clientWidth;
  const h = container.clientHeight;

  // Renderer
  renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: false,
    powerPreference: 'high-performance'
  });
  renderer.setSize(w, h);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x030308, 1);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  container.appendChild(renderer.domElement);

  // Scene
  scene = new THREE.Scene();

  // Deep space background gradient via a large sphere
  const bgGeo = new THREE.SphereGeometry(200, 32, 32);
  const bgMat = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    uniforms: {
      colorTop: { value: new THREE.Color(0x0a0520) },
      colorBottom: { value: new THREE.Color(0x020010) },
      colorAccent: { value: new THREE.Color(0x1a0a30) }
    },
    vertexShader: `
      varying vec3 vWorldPos;
      void main() {
        vec4 worldPos = modelMatrix * vec4(position, 1.0);
        vWorldPos = worldPos.xyz;
        gl_Position = projectionMatrix * viewMatrix * worldPos;
      }
    `,
    fragmentShader: `
      uniform vec3 colorTop;
      uniform vec3 colorBottom;
      uniform vec3 colorAccent;
      varying vec3 vWorldPos;
      void main() {
        float t = (normalize(vWorldPos).y + 1.0) * 0.5;
        vec3 col = mix(colorBottom, colorTop, t);
        // Subtle radial accent
        float d = length(vWorldPos.xz) / 200.0;
        col = mix(col, colorAccent, smoothstep(0.3, 0.0, d) * 0.3);
        gl_FragColor = vec4(col, 1.0);
      }
    `
  });
  scene.add(new THREE.Mesh(bgGeo, bgMat));

  // Camera
  camera = new THREE.PerspectiveCamera(55, w / h, 0.1, 500);
  camera.position.set(0, 12, 45);

  // Controls
  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.06;
  controls.rotateSpeed = 0.5;
  controls.zoomSpeed = 0.8;
  controls.minDistance = 8;
  controls.maxDistance = 100;
  controls.autoRotate = true;
  controls.autoRotateSpeed = 0.2;

  // Lights — soft ambient scene
  const ambientLight = new THREE.AmbientLight(0x181830, 1.0);
  scene.add(ambientLight);

  const dirLight = new THREE.DirectionalLight(0x8888cc, 0.4);
  dirLight.position.set(10, 20, 10);
  scene.add(dirLight);

  // Add groups to scene
  scene.add(edgeGroup);
  scene.add(nodeGroup);
  scene.add(particleGroup);
  scene.add(labelGroup);

  // Star field
  starField = createStarField();

  // Post-processing: bloom
  composer = new EffectComposer(renderer);
  const renderPass = new RenderPass(scene, camera);
  composer.addPass(renderPass);

  bloomPass = new UnrealBloomPass(
    new THREE.Vector2(w, h),
    1.0,   // strength — more bloom for glow effect
    0.5,   // radius
    0.75   // threshold
  );
  composer.addPass(bloomPass);

  // Resize handler
  window.addEventListener('resize', onResize);

  return { renderer, scene, camera, controls, composer };
}

function createStarField() {
  // Multi-layer star field for depth
  const layers = [
    { count: 600, size: 0.08, opacity: 0.4, spread: 180, color: 0x6666aa },
    { count: 300, size: 0.15, opacity: 0.6, spread: 150, color: 0x8888cc },
    { count: 80,  size: 0.3,  opacity: 0.8, spread: 120, color: 0xaaaaee }
  ];

  const group = new THREE.Group();

  for (const layer of layers) {
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(layer.count * 3);

    for (let i = 0; i < layer.count; i++) {
      // Distribute on a sphere shell
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = layer.spread * (0.8 + Math.random() * 0.2);
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const material = new THREE.PointsMaterial({
      color: layer.color,
      size: layer.size,
      transparent: true,
      opacity: layer.opacity,
      sizeAttenuation: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    group.add(new THREE.Points(geometry, material));
  }

  scene.add(group);
  return group;
}

function onResize() {
  if (!container) return;
  const w = container.clientWidth;
  const h = container.clientHeight;

  camera.aspect = w / h;
  camera.updateProjectionMatrix();

  renderer.setSize(w, h);
  composer.setSize(w, h);
  bloomPass.resolution.set(w, h);
}

export function startRenderLoop(onFrame) {
  function animate() {
    animationId = requestAnimationFrame(animate);
    const delta = clock.getDelta();
    const elapsed = clock.getElapsedTime();

    controls.update();

    // Slowly rotate star field
    if (starField) {
      starField.rotation.y = elapsed * 0.005;
      starField.rotation.x = Math.sin(elapsed * 0.003) * 0.02;
    }

    if (onFrame) onFrame(delta, elapsed);

    composer.render();
  }
  animate();
}

export function stopRenderLoop() {
  if (animationId) {
    cancelAnimationFrame(animationId);
    animationId = null;
  }
}

export function getCamera() { return camera; }
export function getControls() { return controls; }
export function getRenderer() { return renderer; }
export function getScene() { return scene; }

// Smooth camera transition
export function animateCamera(targetPos, targetLookAt, duration = 1.2) {
  if (!camera || !controls) return;

  const startPos = camera.position.clone();
  const startTarget = controls.target.clone();
  const endPos = new THREE.Vector3(targetPos.x, targetPos.y, targetPos.z);
  const endTarget = new THREE.Vector3(targetLookAt.x, targetLookAt.y, targetLookAt.z);

  if (typeof gsap !== 'undefined') {
    const tl = { t: 0 };
    gsap.killTweensOf(tl); // Kill any running camera tween
    gsap.to(tl, {
      t: 1,
      duration,
      ease: 'power2.inOut',
      onUpdate() {
        camera.position.lerpVectors(startPos, endPos, tl.t);
        controls.target.lerpVectors(startTarget, endTarget, tl.t);
      }
    });
  } else {
    camera.position.copy(endPos);
    controls.target.copy(endTarget);
  }
}

// Fit camera to show a set of positions with padding
export function fitCameraToPositions(positions, padding = 1.5) {
  if (!positions || positions.length === 0) return;

  const box = new THREE.Box3();
  for (const p of positions) {
    box.expandByPoint(new THREE.Vector3(p.x, p.y, p.z));
  }

  const center = new THREE.Vector3();
  box.getCenter(center);

  const size = new THREE.Vector3();
  box.getSize(size);

  const maxDim = Math.max(size.x, size.y, size.z) * padding;
  const fov = camera.fov * (Math.PI / 180);
  const dist = maxDim / (2 * Math.tan(fov / 2));

  // Position camera looking at center from slightly above and in front
  const offset = new THREE.Vector3(0, dist * 0.3, dist);

  animateCamera(
    { x: center.x + offset.x, y: center.y + offset.y, z: center.z + offset.z },
    { x: center.x, y: center.y, z: center.z },
    0.9
  );
}
