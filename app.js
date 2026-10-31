import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const el = (id) => document.getElementById(id);
const sceneError = el('sceneError');
const loading = el('loading');
const viewport = el('viewport');

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x080d10);
scene.fog = new THREE.Fog(0x080d10, 42, 78);

const camera = new THREE.PerspectiveCamera(39, 1, 0.1, 180);
const defaultCamera = new THREE.Vector3(26, 26, 31);
camera.position.copy(defaultCamera);

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.28;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.domElement.setAttribute('aria-label', 'Interactive three-dimensional chemical process area simulation');
viewport.prepend(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 1.8, 0);
controls.enableDamping = true;
controls.dampingFactor = 0.065;
controls.maxPolarAngle = Math.PI * 0.485;
controls.minDistance = 9;
controls.maxDistance = 60;

scene.add(new THREE.HemisphereLight(0x9fb9b2, 0x1b2425, 1.05));
const keyLight = new THREE.DirectionalLight(0xd1d0bd, 2.1);
keyLight.position.set(-9, 19, 11);
keyLight.castShadow = true;
keyLight.shadow.mapSize.set(2048, 2048);
keyLight.shadow.camera.left = -22;
keyLight.shadow.camera.right = 22;
keyLight.shadow.camera.top = 20;
keyLight.shadow.camera.bottom = -20;
keyLight.shadow.bias = -0.0004;
scene.add(keyLight);
const fillLight = new THREE.PointLight(0x7eaaa0, 16, 44, 2);
fillLight.position.set(0, 5.8, -8);
scene.add(fillLight);

const mat = (color, roughness = 0.72, metalness = 0.12, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness, metalness, ...extra });
const materials = {
  floor: mat(0x42494a, 0.96, 0.03),
  concrete: mat(0x505858, 0.95, 0.02),
  wall: mat(0x5b6261, 0.94, 0.02),
  steel: mat(0x778382, 0.48, 0.58),
  steelDark: mat(0x343e40, 0.62, 0.48),
  pipe: mat(0x81908d, 0.39, 0.64),
  pipeWarm: mat(0x8c644b, 0.48, 0.5),
  copper: mat(0x76533d, 0.44, 0.7),
  paintGreen: mat(0x485d54, 0.68, 0.24),
  paintBlue: mat(0x42565d, 0.58, 0.3),
  yellow: mat(0xb77c2d, 0.58, 0.25),
  safety: mat(0xc19042, 0.63, 0.12),
  tank: mat(0x596661, 0.48, 0.58),
  robot: mat(0x324f46, 0.4, 0.48),
  robotTop: mat(0x789785, 0.39, 0.28),
  rubber: mat(0x171c1e, 0.92, 0.02),
  gaugeFace: mat(0xc7c3ad, 0.88, 0.02),
  glass: new THREE.MeshStandardMaterial({ color: 0x83b6b4, roughness: 0.22, metalness: 0.22, transparent: true, opacity: 0.38 }),
  ledGreen: new THREE.MeshBasicMaterial({ color: 0x69d69a, toneMapped: false }),
  ledAmber: new THREE.MeshBasicMaterial({ color: 0xffb84c, toneMapped: false }),
  ledRed: new THREE.MeshBasicMaterial({ color: 0xe45e4b, toneMapped: false }),
  ledBlue: new THREE.MeshBasicMaterial({ color: 0x64c4dd, toneMapped: false }),
  glowGreen: new THREE.MeshBasicMaterial({ color: 0x67e0a1, toneMapped: false }),
  route: new THREE.LineBasicMaterial({ color: 0x6ee0a5, transparent: true, opacity: 0.78 }),
};

function box(parent, x, y, z, sx, sy, sz, material, cast = true, receive = true) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), material);
  mesh.position.set(x, y, z);
  mesh.castShadow = cast;
  mesh.receiveShadow = receive;
  parent.add(mesh);
  return mesh;
}

function cylinder(parent, x, y, z, radiusTop, radiusBottom, height, material, segments = 20, rotation = null) {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radiusTop, radiusBottom, height, segments), material);
  mesh.position.set(x, y, z);
  if (rotation) mesh.rotation.set(rotation.x || 0, rotation.y || 0, rotation.z || 0);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

function pipe(parent, from, to, radius, material) {
  const a = new THREE.Vector3(...from);
  const b = new THREE.Vector3(...to);
  const direction = new THREE.Vector3().subVectors(b, a);
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, direction.length(), 16), material);
  mesh.position.copy(a).add(b).multiplyScalar(0.5);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize());
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

function torus(parent, x, y, z, radius, tube, material, rotation = new THREE.Vector3(Math.PI / 2, 0, 0)) {
  const mesh = new THREE.Mesh(new THREE.TorusGeometry(radius, tube, 8, 28), material);
  mesh.position.set(x, y, z);
  mesh.rotation.set(rotation.x, rotation.y, rotation.z);
  mesh.castShadow = true;
  parent.add(mesh);
  return mesh;
}

function makeTextSprite(text, color = '#bad0c5') {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 96;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = 'rgba(12,20,22,.76)';
  ctx.beginPath();
  ctx.roundRect(8, 12, 496, 72, 14);
  ctx.fill();
  ctx.strokeStyle = 'rgba(113,167,137,.65)';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.font = '600 27px monospace';
  ctx.fillStyle = color;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 256, 48);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, transparent: true, depthWrite: false }));
  sprite.scale.set(3.3, 0.62, 1);
  return sprite;
}

// Full basement envelope. The open roof is a deliberate cutaway so the machinery stays visible.
const facilityLights = [];
const conveyorRollers = [];
const panelStatusLights = [];
const ceilingPanels = new THREE.Group();
scene.add(ceilingPanels);
ceilingPanels.visible = false;

box(scene, 0, -0.34, 0, 35.2, 0.62, 25.2, materials.concrete, false, true);
box(scene, 0, -0.04, 0, 34.2, 0.1, 24.2, materials.floor, false, true);
const grid = new THREE.GridHelper(34.2, 38, 0x4d5a58, 0x252e30);
grid.position.y = 0.018;
grid.material.transparent = true;
grid.material.opacity = 0.16;
scene.add(grid);

// Perimeter concrete walls, with an open service hatch along the near wall.
box(scene, 0, 3.18, -12.05, 34.2, 6.35, 0.38, materials.wall);
box(scene, -17.05, 3.18, 0, 0.38, 6.35, 24.2, materials.wall);
box(scene, 17.05, 3.18, 0, 0.38, 6.35, 24.2, materials.wall);
box(scene, -15.0, 3.18, 12.05, 4.0, 6.35, 0.38, materials.wall);
box(scene, 3.9, 0.42, 12.05, 26.0, 0.84, 0.38, materials.wall);
box(scene, -11.1, 6.03, 12.05, 4.0, 0.45, 0.4, materials.steelDark);
for (const x of [-15.9, -12.8, -9.6, -6.4, -3.2, 0, 3.2, 6.4, 9.6, 12.8, 16.0]) {
  box(scene, x, 3.25, -11.82, 0.05, 6.1, 0.025, materials.steelDark, false, false);
  box(scene, x, 3.25, 11.82, 0.05, 6.1, 0.025, materials.steelDark, false, false);
}
for (const z of [-9, -6, -3, 0, 3, 6, 9]) {
  box(scene, -16.82, 3.2, z, 0.025, 6.0, 0.05, materials.steelDark, false, false);
  box(scene, 16.82, 3.2, z, 0.025, 6.0, 0.05, materials.steelDark, false, false);
}
// Concrete panel joints, service conduits and wall-mounted cable trunking.
for (const z of [-10.6, -7.3, -4.0, -0.7, 2.6, 5.9, 9.2]) {
  box(scene, -16.79, 4.7, z, 0.08, 0.13, 0.1, materials.steel);
  box(scene, 16.79, 4.7, z, 0.08, 0.13, 0.1, materials.steel);
}
for (const x of [-15.8, -13.2, -10.6, -8.0, 10.5, 13.2, 15.6]) {
  box(scene, x, 5.75, -11.8, 0.08, 0.28, 0.08, materials.safety);
}

// Structural columns and exposed ceiling beams make the room read as a basement.
for (const x of [-15, 0, 15]) {
  for (const z of [-10, 0, 10]) {
    const post = box(scene, x, 3.15, z, 0.34, 6.3, 0.34, materials.steelDark);
    box(scene, x, 0.18, z, 0.8, 0.28, 0.8, materials.steel);
    box(scene, x, 5.9, z, 0.8, 0.26, 0.8, materials.steel);
    post.castShadow = true;
  }
}
for (const z of [-10, 0, 10]) {
  box(scene, 0, 6.25, z, 34.0, 0.32, 0.34, materials.steelDark);
}
for (const x of [-15, 0, 15]) {
  box(scene, x, 6.28, 0, 0.32, 0.32, 24.0, materials.steelDark);
}
// Toggleable roof slabs are hidden by default for a readable cutaway view.
for (const [x, z, w, d] of [[-12, -8, 8, 7], [10, -8, 10, 7], [13, 7, 5, 6]]) {
  box(ceilingPanels, x, 6.62, z, w, 0.34, d, materials.concrete, false, true);
}

// Floor markings, containment curbs, drains, grates and a few dark oily patches.
const floorStripe = (x, z, sx, sz, color = materials.safety) => box(scene, x, 0.026, z, sx, 0.018, sz, color, false, false);
for (let i = 0; i < 14; i++) floorStripe(-15.2 + i * 0.56, 8.58, 0.3, 0.12, i % 2 ? materials.steelDark : materials.safety);
for (const [x, z, w, d] of [[-8.7, -4.3, 5.5, 3.3], [8.8, 1.7, 4.0, 4.0], [13.4, -3.8, 2.4, 10.0], [-13.0, 9.4, 7.0, 2.6]]) {
  const line = new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(x - w / 2, 0.035, z - d / 2), new THREE.Vector3(x + w / 2, 0.035, z - d / 2),
    new THREE.Vector3(x + w / 2, 0.035, z + d / 2), new THREE.Vector3(x - w / 2, 0.035, z + d / 2),
  ]), new THREE.LineBasicMaterial({ color: 0xa78142, transparent: true, opacity: 0.58 }));
  scene.add(line);
}
for (const z of [-7.8, 4.2]) {
  box(scene, 0, 0.019, z, 32.0, 0.025, 0.42, materials.steelDark, false, false);
  for (let x = -15.6; x <= 15.6; x += 0.55) box(scene, x, 0.036, z, 0.08, 0.018, 0.34, materials.steel, false, false);
}
const stainMaterial = new THREE.MeshBasicMaterial({ color: 0x11191a, transparent: true, opacity: 0.33, depthWrite: false });
for (const [x, z, sx, sz] of [[-10.5, -6.7, 2.5, 1.2], [-4.2, -8.4, 1.8, 0.8], [5.2, -7.4, 2.3, 0.9], [12.8, 6.6, 2.2, 1.0], [-2.0, 10.0, 1.5, 0.55], [7.0, -1.8, 1.4, 0.7]]) {
  const stain = new THREE.Mesh(new THREE.CircleGeometry(1, 28), stainMaterial);
  stain.rotation.x = -Math.PI / 2;
  stain.position.set(x, 0.032, z);
  stain.scale.set(sx, sz, 1);
  scene.add(stain);
}

// Shared utility fixtures.
function addCagedLight(x, y, z, color = 0xffd39a, intensity = 1.7) {
  box(scene, x, y + 0.18, z, 0.36, 0.12, 1.55, materials.steelDark, false, false);
  box(scene, x, y, z, 0.09, 0.07, 1.12, new THREE.MeshBasicMaterial({ color, toneMapped: false }), false, false);
  for (const dz of [-0.56, -0.28, 0, 0.28, 0.56]) box(scene, x + 0.08, y, z + dz, 0.03, 0.3, 0.025, materials.steel, false, false);
  const light = new THREE.PointLight(color, intensity * 1.7, 12, 2);
  light.position.set(x, y - 0.12, z);
  scene.add(light);
  facilityLights.push(light);
  return light;
}
for (const [x, z, color, intensity] of [[-12, 1, 0xffd6a0, 1.8], [-7, -1, 0xffc77d, 2.0], [-1, 1.5, 0xd7e5dc, 2.0], [5, -1.0, 0xffd2a0, 1.9], [11.8, 2.0, 0xffc876, 1.8], [1, -9.2, 0xd7e5dc, 1.4], [-12, -8.5, 0xffbe72, 1.5]]) addCagedLight(x, 5.45, z, color, intensity);

// Heavy electrical power and motor-control centre beside the service entrance.
function addControlCabinet(x, z, index) {
  const group = new THREE.Group();
  group.position.set(x, 0, z);
  scene.add(group);
  const cabinetColor = index % 2 ? materials.paintGreen : materials.paintBlue;
  box(group, 0, 1.48, 0, 1.16, 2.96, 0.84, cabinetColor);
  box(group, 0, 1.48, 0.435, 1.08, 2.84, 0.07, materials.steelDark, false, true);
  box(group, 0, 1.48, 0.478, 0.96, 2.72, 0.035, cabinetColor, false, true);
  box(group, -0.2, 2.44, 0.505, 0.46, 0.36, 0.035, materials.steelDark, false, false);
  box(group, -0.2, 2.44, 0.529, 0.37, 0.25, 0.014, mat(0x142120, 0.25, 0.24, { emissive: 0x173f36, emissiveIntensity: 0.28 }), false, false);
  box(group, 0.28, 2.44, 0.51, 0.18, 0.34, 0.025, materials.steel, false, false);
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 3; col++) {
      const xLocal = -0.34 + col * 0.29;
      const yLocal = 1.94 - row * 0.3;
      const lens = row === 0 ? [materials.ledGreen, materials.ledAmber, materials.ledRed][col] : [materials.ledRed, materials.ledGreen, materials.ledAmber][(col + index) % 3];
      cylinder(group, xLocal, yLocal, 0.535, 0.065, 0.065, 0.045, materials.steelDark, 14, { x: Math.PI / 2 });
      const led = cylinder(group, xLocal, yLocal, 0.566, 0.041, 0.041, 0.018, lens, 12, { x: Math.PI / 2 });
      panelStatusLights.push(led);
      cylinder(group, xLocal, 1.03 - row * 0.12, 0.538, 0.052, 0.052, 0.055, row === 2 && col === 0 ? materials.ledRed : materials.steel, 14, { x: Math.PI / 2 });
    }
  }
  // Breaker levers, a door pull, louvres, and a guarded emergency stop.
  box(group, 0.39, 1.42, 0.535, 0.055, 0.56, 0.05, materials.yellow, false, false);
  box(group, 0.39, 1.54, 0.57, 0.12, 0.06, 0.08, materials.steel, false, false);
  for (let i = 0; i < 5; i++) box(group, -0.38 + i * 0.15, 0.42, 0.53, 0.08, 0.035, 0.018, materials.steelDark, false, false);
  if (index === 0) {
    cylinder(group, 0.37, 0.82, 0.62, 0.16, 0.16, 0.14, materials.ledRed, 20, { x: Math.PI / 2 });
    box(group, 0.37, 0.63, 0.62, 0.48, 0.07, 0.025, materials.safety, false, false);
  }
  return group;
}
for (let i = 0; i < 7; i++) addControlCabinet(-5.8 + i * 1.28, 9.55, i);
const mainBreaker = new THREE.Group();
mainBreaker.position.set(-14.0, 0, 5.8);
scene.add(mainBreaker);
box(mainBreaker, 0, 1.45, 0, 1.45, 2.9, 1.25, materials.steelDark);
box(mainBreaker, 0, 1.45, 0.64, 1.28, 2.68, 0.08, materials.paintGreen);
box(mainBreaker, 0, 2.36, 0.70, 0.88, 0.54, 0.05, materials.steelDark, false, false);
box(mainBreaker, 0, 2.36, 0.735, 0.75, 0.4, 0.018, mat(0x101b1b, 0.26, 0.18, { emissive: 0x24453d, emissiveIntensity: 0.42 }), false, false);
box(mainBreaker, 0, 1.45, 0.72, 0.12, 0.78, 0.07, materials.yellow, false, false);
box(mainBreaker, 0.12, 1.77, 0.74, 0.42, 0.09, 0.08, materials.steel, false, false);
for (let i = 0; i < 4; i++) cylinder(mainBreaker, -0.43 + i * 0.28, 0.82, 0.73, 0.075, 0.075, 0.06, [materials.ledGreen, materials.ledAmber, materials.ledRed, materials.ledBlue][i], 14, { x: Math.PI / 2 });
const breakerLabel = makeTextSprite('POWER / MOTOR CONTROL', '#e7c983');
breakerLabel.position.set(-14.0, 3.65, 6.45); breakerLabel.scale.set(4.4, 0.74, 1); scene.add(breakerLabel);
box(scene, -15.6, 2.05, 3.5, 0.62, 4.1, 1.15, materials.steelDark);
for (let i = 0; i < 10; i++) box(scene, -15.26, 0.42 + i * 0.32, 3.5, 0.1, 0.11, 0.56, materials.steel, false, false);
for (let i = 0; i < 5; i++) {
  cylinder(scene, -15.15, 0.75 + i * 0.52, 4.18, 0.08, 0.08, 0.12, [materials.ledRed, materials.ledAmber, materials.ledGreen][i % 3], 14, { x: Math.PI / 2 });
  box(scene, -14.98, 0.75 + i * 0.52, 4.18, 0.18, 0.045, 0.045, materials.yellow, false, false);
}
// Cable ladders leave the switchgear and run above the equipment bays.
for (const z of [7.9, 6.9]) {
  box(scene, -4.1, 4.9, z, 21.5, 0.11, 0.16, materials.steelDark, false, false);
  box(scene, -4.1, 5.08, z - 0.38, 21.5, 0.1, 0.16, materials.steelDark, false, false);
  for (let x = -14.5; x <= 6.4; x += 0.7) box(scene, x, 5.0, z - 0.19, 0.055, 0.045, 0.42, materials.steel, false, false);
}

// Hand wheels, lever valves, pressure gauges and flanged process connections.
function addValve(x, y, z, style = 'wheel', rotation = 0) {
  const group = new THREE.Group();
  group.position.set(x, y, z);
  group.rotation.y = rotation;
  scene.add(group);
  cylinder(group, 0, 0, 0, 0.23, 0.23, 0.28, materials.yellow, 20, { z: Math.PI / 2 });
  cylinder(group, 0, 0, 0.2, 0.105, 0.105, 0.12, materials.steelDark, 16, { z: Math.PI / 2 });
  pipe(group, [0, 0, 0.12], [0, 0.34, 0.12], 0.045, materials.steelDark);
  if (style === 'lever') {
    box(group, 0.0, 0.57, 0.12, 0.11, 0.5, 0.12, materials.safety, false, false).rotation.z = -0.3;
    cylinder(group, 0.0, 0.82, 0.12, 0.08, 0.08, 0.16, materials.steelDark, 14, { z: Math.PI / 2 });
  } else {
    torus(group, 0, 0.52, 0.12, 0.24, 0.035, materials.safety, new THREE.Vector3(0, 0, 0));
    box(group, 0, 0.52, 0.13, 0.46, 0.045, 0.045, materials.safety, false, false);
    cylinder(group, 0, 0.52, 0.13, 0.055, 0.055, 0.12, materials.steelDark, 14, { z: Math.PI / 2 });
  }
  return group;
}
function addGauge(x, y, z, scale = 1) {
  cylinder(scene, x, y, z, 0.19 * scale, 0.19 * scale, 0.12, materials.steelDark, 20, { x: Math.PI / 2 });
  cylinder(scene, x, y, z + 0.07, 0.15 * scale, 0.15 * scale, 0.025, materials.gaugeFace, 24, { x: Math.PI / 2 });
  pipe(scene, [x, y, z + 0.09], [x + 0.055 * scale, y + 0.075 * scale, z + 0.105], 0.012 * scale, mat(0x403c34, 0.8, 0.02));
  for (let i = -2; i <= 2; i++) box(scene, x + i * 0.037 * scale, y - 0.105 * scale, z + 0.093, 0.018 * scale, 0.025 * scale, 0.012, materials.steelDark, false, false);
}

// Pump and motor skids, guards, coupling, gauges, piping and drain pans.
const motorParts = [];
function addPump(x, z, name, primary = false) {
  const group = new THREE.Group();
  group.position.set(x, 0, z);
  scene.add(group);
  box(group, 0, 0.2, 0, 3.15, 0.34, 1.85, materials.steelDark);
  box(group, 0, 0.39, 0, 2.9, 0.08, 1.62, materials.safety);
  box(group, -0.82, 0.76, 0, 0.96, 0.74, 1.03, materials.steel);
  const volute = new THREE.Mesh(new THREE.SphereGeometry(0.58, 22, 16), materials.paintBlue);
  volute.position.set(-0.65, 0.95, 0);
  volute.scale.set(0.94, 0.9, 0.9);
  volute.castShadow = true;
  group.add(volute);
  cylinder(group, -0.68, 1.33, 0, 0.34, 0.34, 0.22, materials.steelDark, 22);
  const motorBody = cylinder(group, 0.52, 0.94, 0, 0.52, 0.52, 1.55, primary ? materials.paintGreen : materials.steelDark, 28, { z: Math.PI / 2 });
  motorBody.castShadow = true;
  motorParts.push(motorBody);
  for (let rib = -5; rib <= 5; rib++) {
    const fin = new THREE.Mesh(new THREE.TorusGeometry(0.49, 0.025, 6, 24), materials.steel);
    fin.position.set(0.52 + rib * 0.12, 0.94, 0);
    fin.rotation.z = Math.PI / 2;
    fin.scale.set(1, 1, 0.98);
    group.add(fin);
  }
  cylinder(group, 1.28, 0.94, 0, 0.16, 0.16, 0.18, materials.steel, 16, { z: Math.PI / 2 });
  box(group, 0.55, 1.48, 0, 1.65, 0.12, 1.12, materials.steelDark);
  // Coupling guard, mounting feet and suction/discharge lines.
  box(group, -0.05, 0.74, 0, 0.32, 0.42, 0.62, materials.safety, false, false);
  for (const dx of [-1.18, -0.42, 0.46, 1.14]) box(group, dx, 0.48, 0, 0.16, 0.1, 1.32, materials.steel);
  pipe(group, [-0.86, 1.05, 0.0], [-1.35, 1.05, 0.0], 0.18, materials.pipe);
  pipe(group, [-1.35, 1.05, 0.0], [-1.35, 2.65, 0.0], 0.14, materials.pipe);
  pipe(group, [-1.35, 2.65, 0.0], [0.45, 2.65, 0.0], 0.14, primary ? materials.pipeWarm : materials.pipe);
  pipe(group, [-0.35, 1.2, 0.0], [-0.35, 2.15, 0.0], 0.12, materials.pipeWarm);
  cylinder(group, -0.35, 2.15, 0, 0.2, 0.2, 0.12, materials.safety, 18, { z: Math.PI / 2 });
  addGauge(x - 0.3, 1.75, z + 0.62, 0.76);
  addValve(x - 0.35, 2.68, z, primary ? 'lever' : 'wheel');
  const label = makeTextSprite(name, '#d6cba9');
  label.position.set(x, 2.25, z + 1.08); label.scale.set(2.3, 0.5, 1); scene.add(label);
}
addPump(-10.0, -4.5, 'P-101 · TRANSFER', true);
addPump(-6.0, -4.5, 'P-102 · PROCESS', false);
addPump(-10.0, -0.2, 'P-103 · RETURN', false);
addPump(-6.0, -0.2, 'P-104 · FEED', false);

// Vertical process vessels with domed heads, nozzle pads, ladders, legs and rails.
function addVessel(x, z, radius, height, name, paint = materials.tank) {
  const vessel = new THREE.Group();
  vessel.position.set(x, 0, z);
  scene.add(vessel);
  cylinder(vessel, 0, height / 2 + 0.4, 0, radius, radius, height, paint, 32);
  cylinder(vessel, 0, height + 0.4, 0, radius * 0.8, radius, 0.2, materials.steel, 32);
  const cap = new THREE.Mesh(new THREE.SphereGeometry(radius, 28, 14, 0, Math.PI * 2, 0, Math.PI / 2), paint);
  cap.position.set(0, height + 0.5, 0);
  cap.castShadow = true;
  vessel.add(cap);
  cylinder(vessel, 0, 0.34, 0, radius * 1.08, radius * 1.08, 0.25, materials.steelDark, 28);
  for (const y of [0.62, height * 0.52 + 0.4, height + 0.34]) torus(vessel, 0, y, 0, radius * 1.015, 0.035, materials.steel);
  // Four anchor shoes and the lower drain nozzle.
  for (let a = 0; a < 4; a++) {
    const angle = a * Math.PI / 2 + Math.PI / 4;
    const lx = Math.cos(angle) * radius * 0.74;
    const lz = Math.sin(angle) * radius * 0.74;
    box(vessel, lx, 0.45, lz, 0.18, 0.52, 0.18, materials.steelDark);
  }
  // Front-facing ladder and a small top service platform.
  for (const dx of [-0.33, 0.33]) pipe(vessel, [dx, 0.55, radius + 0.08], [dx, height + 1.3, radius + 0.08], 0.035, materials.safety);
  for (let y = 0.75; y < height + 1.1; y += 0.38) pipe(vessel, [-0.33, y, radius + 0.08], [0.33, y, radius + 0.08], 0.025, materials.steel);
  torus(vessel, 0, height + 1.15, 0, radius + 0.28, 0.025, materials.safety);
  addGauge(x, height * 0.58 + 0.55, z + radius + 0.08, 0.84);
  pipe(vessel, [0, 0.55, -radius], [0, 0.25, -radius - 0.75], 0.13, materials.pipe);
  pipe(vessel, [0, 0.25, -radius - 0.75], [-0.8, 0.25, -radius - 0.75], 0.13, materials.pipe);
  const sign = makeTextSprite(name, '#d9ccab');
  sign.position.set(x, height + 2.0, z); sign.scale.set(2.45, 0.5, 1); scene.add(sign);
  return vessel;
}
addVessel(8.7, 1.0, 1.32, 3.3, 'V-201 · MIX TANK');
addVessel(11.0, -5.4, 1.05, 3.55, 'V-202 · SEPARATOR', materials.paintBlue);
addVessel(6.6, -8.4, 0.88, 2.9, 'V-203 · FILTER POT', materials.paintGreen);
addVessel(10.8, 7.0, 0.82, 2.7, 'V-204 · BUFFER');

// Horizontal receiver vessels on cradles.
function addHorizontalTank(x, z, length, radius, label) {
  const group = new THREE.Group();
  group.position.set(x, 0, z);
  scene.add(group);
  box(group, 0, 0.35, 0, length + 0.7, 0.44, radius * 2.5, materials.steelDark);
  for (const dx of [-length * 0.28, length * 0.28]) box(group, dx, 0.82, 0, 0.62, 0.7, radius * 2.25, materials.steel);
  const tank = cylinder(group, 0, 1.15, 0, radius, radius, length, materials.tank, 32, { z: Math.PI / 2 });
  tank.castShadow = true;
  for (const dx of [-length * 0.38, 0, length * 0.38]) {
    torus(group, dx, 1.15, 0, radius * 0.96, 0.04, materials.steel, new THREE.Vector3(0, Math.PI / 2, 0));
  }
  cylinder(group, 0, 1.15 + radius * 0.94, 0, 0.28, 0.28, 0.32, materials.steelDark, 18);
  pipe(group, [length * 0.45, 1.15, 0], [length * 0.45 + 0.55, 1.15, 0], 0.12, materials.pipeWarm);
  const sign = makeTextSprite(label, '#d8cba9');
  sign.position.set(x, 2.55, z + radius + 0.4); sign.scale.set(2.3, 0.48, 1); scene.add(sign);
}
addHorizontalTank(12.9, -9.0, 4.4, 0.72, 'R-301 · RECEIVER');
addHorizontalTank(13.0, 8.6, 3.6, 0.62, 'R-302 · SOLVENT');

// Roller conveyors with guard rails, drive motors, pallets, drums and metal tins.
function addDrum(x, z, color = 0x53676b, scale = 1) {
  const group = new THREE.Group();
  group.position.set(x, 0, z);
  group.scale.setScalar(scale);
  scene.add(group);
  cylinder(group, 0, 0.52, 0, 0.36, 0.36, 0.94, mat(color, 0.62, 0.42), 24);
  cylinder(group, 0, 1.0, 0, 0.34, 0.36, 0.07, materials.steelDark, 24);
  torus(group, 0, 0.28, 0, 0.355, 0.035, materials.steel);
  torus(group, 0, 0.69, 0, 0.36, 0.027, materials.steel);
  torus(group, 0, 0.9, 0, 0.36, 0.025, materials.steel);
  cylinder(group, -0.11, 1.045, 0, 0.055, 0.055, 0.018, materials.steel, 14);
  cylinder(group, 0.12, 1.045, 0, 0.04, 0.04, 0.018, materials.steel, 14);
  box(group, 0, 0.58, 0.365, 0.24, 0.25, 0.016, materials.steelDark, false, false);
  box(group, 0, 0.58, 0.378, 0.18, 0.16, 0.012, materials.gaugeFace, false, false);
  return group;
}
function addTin(x, z, height = 0.6, radius = 0.24) {
  const group = new THREE.Group();
  group.position.set(x, 0, z);
  scene.add(group);
  cylinder(group, 0, height / 2, 0, radius, radius, height, materials.steel, 20);
  cylinder(group, 0, height + 0.025, 0, radius * 0.9, radius * 0.9, 0.05, materials.steelDark, 20);
  torus(group, 0, height * 0.2, 0, radius * 0.98, 0.022, materials.safety);
  box(group, 0, height * 0.58, radius + 0.01, radius * 1.25, height * 0.25, 0.018, materials.gaugeFace, false, false);
}
function addConveyor(x, zStart, zEnd, drumCount = 5) {
  const middle = (zStart + zEnd) / 2;
  const length = Math.abs(zEnd - zStart);
  box(scene, x, 0.86, middle, 1.55, 0.19, length + 0.4, materials.steelDark);
  box(scene, x, 0.97, middle, 1.24, 0.06, length, materials.rubber, false, false);
  for (const dx of [-0.69, 0.69]) box(scene, x + dx, 1.12, middle, 0.1, 0.3, length + 0.25, materials.safety, false, false);
  for (let z = Math.min(zStart, zEnd) + 0.18; z < Math.max(zStart, zEnd); z += 0.46) {
    const roller = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.075, 1.33, 14), materials.steel);
    roller.position.set(x, 0.97, z);
    roller.rotation.z = Math.PI / 2;
    roller.castShadow = true;
    scene.add(roller);
    conveyorRollers.push(roller);
  }
  for (const z of [zStart, zEnd]) for (const dx of [-0.56, 0.56]) {
    box(scene, x + dx, 0.47, z, 0.12, 0.78, 0.16, materials.steelDark);
    box(scene, x + dx, 0.15, z, 0.42, 0.12, 0.34, materials.safety);
  }
  const drive = cylinder(scene, x, 0.95, Math.max(zStart, zEnd) + 0.24, 0.24, 0.24, 0.7, materials.paintGreen, 18, { z: Math.PI / 2 });
  drive.castShadow = true;
  for (let i = 0; i < drumCount; i++) {
    const z = zStart + (zEnd - zStart) * ((i + 0.55) / drumCount);
    addDrum(x, z, [0x465d64, 0x655f4c, 0x384d52, 0x6d6047][i % 4], 0.82);
  }
}
addConveyor(14.8, -4.2, 5.5, 7);
addConveyor(4.9, -10.2, -7.0, 2);
// Spill pallets and stacked metal tins beside the moving line.
for (const [x, z] of [[12.6, 5.8], [12.9, 6.4], [13.3, 5.8]]) {
  box(scene, x, 0.14, z, 0.72, 0.25, 0.74, materials.safety);
  addDrum(x, z, 0x4b5960, 0.9);
}
for (const [x, z, h] of [[11.9, 4.4, 0.65], [12.4, 4.45, 0.82], [12.9, 4.5, 0.58], [13.3, 7.5, 0.8], [12.6, 7.5, 0.56]]) addTin(x, z, h, 0.22);

// Multi-level process pipe rack, steel supports, brackets, flanges and drops to equipment.
for (const x of [-13.5, -8.0, -2.5, 3.0, 8.5, 14.0]) {
  for (const z of [-2.3, 2.3]) {
    box(scene, x, 2.45, z, 0.22, 4.9, 0.22, materials.steelDark);
    box(scene, x, 4.72, 0, 0.36, 0.16, 4.9, materials.steel);
    box(scene, x, 0.34, 0, 0.5, 0.2, 5.0, materials.steelDark);
  }
}
const pipeLines = [
  { y: 3.65, z: -1.8, r: 0.15, material: materials.pipeWarm },
  { y: 3.95, z: -1.1, r: 0.105, material: materials.pipe },
  { y: 4.25, z: -0.35, r: 0.13, material: materials.paintGreen },
  { y: 4.55, z: 0.42, r: 0.09, material: materials.copper },
  { y: 4.88, z: 1.15, r: 0.16, material: materials.pipe },
  { y: 5.18, z: 1.82, r: 0.105, material: materials.pipeWarm },
];
for (const line of pipeLines) {
  pipe(scene, [-15.3, line.y, line.z], [15.1, line.y, line.z], line.r, line.material);
  for (const x of [-13.5, -8.0, -2.5, 3.0, 8.5, 14.0]) cylinder(scene, x, line.y, line.z, line.r * 1.32, line.r * 1.32, 0.13, materials.steelDark, 14, { z: Math.PI / 2 });
}
for (const [x, z, yTop, material] of [[-10, -1.8, 2.55, materials.pipeWarm], [-6.3, -1.1, 2.3, materials.pipe], [-2.8, 1.15, 2.8, materials.pipeWarm], [2.35, -1.8, 2.0, materials.pipeWarm], [6.8, -0.35, 2.45, materials.paintGreen], [9.6, 1.15, 2.5, materials.pipe]]) {
  const yBottom = 1.1;
  const line = pipeLines.find((item) => item.z === z);
  if (line) {
    pipe(scene, [x, line.y, z], [x, yTop, z], 0.09, material);
    pipe(scene, [x, yTop, z], [x, yBottom, z], 0.075, material);
    addValve(x, yTop + 0.15, z, x % 2 ? 'lever' : 'wheel');
    addGauge(x + 0.32, yTop + 0.4, z + 0.14, 0.72);
  }
}
// Utility headers along the back wall and vertical drops to the vessel nozzles.
for (let i = 0; i < 4; i++) {
  const x = 4.8 + i * 2.7;
  const y = 2.55 + i * 0.26;
  pipe(scene, [x, y, -10.4], [x, y, -3.0], 0.095 + (i % 2) * 0.025, i % 2 ? materials.pipe : materials.pipeWarm);
  pipe(scene, [x, y, -10.4], [x, y + 0.72, -11.4], 0.08, materials.steel);
  for (const z of [-9.0, -6.0, -3.2]) cylinder(scene, x, y, z, 0.15, 0.15, 0.12, materials.steelDark, 14, { z: Math.PI / 2 });
  addValve(x, y + 0.2, -7.6, i % 2 ? 'lever' : 'wheel');
}
// Short branches, reducers and flanged joints make the rack read as a working manifold.
for (const [x, z] of [[-9.4, -1.1], [-4.3, 0.42], [1.5, -0.35], [7.2, 1.15], [12.2, -1.8]]) {
  pipe(scene, [x, 3.95, z], [x, 2.75, z], 0.1, materials.pipeWarm);
  pipe(scene, [x, 2.75, z], [x + 0.85, 2.75, z], 0.1, materials.pipe);
  cylinder(scene, x + 0.28, 2.75, z, 0.18, 0.18, 0.13, materials.safety, 16, { z: Math.PI / 2 });
  addValve(x + 0.52, 2.82, z, 'wheel');
}

// Safety railings, platforms, access ladder and a service stair at the far end.
function addRailing(x1, z1, x2, z2, y = 1.2, height = 0.95) {
  pipe(scene, [x1, y, z1], [x2, y, z2], 0.035, materials.safety);
  pipe(scene, [x1, y - height, z1], [x2, y - height, z2], 0.03, materials.safety);
  const length = new THREE.Vector3(x2 - x1, 0, z2 - z1).length();
  const count = Math.max(2, Math.floor(length / 0.85));
  for (let i = 0; i <= count; i++) {
    const t = i / count;
    box(scene, THREE.MathUtils.lerp(x1, x2, t), y - height / 2, THREE.MathUtils.lerp(z1, z2, t), 0.055, height, 0.055, materials.safety);
  }
}
for (let i = 0; i < 9; i++) {
  const x = -15.4 + i * 0.4;
  const y = 0.25 + i * 0.31;
  box(scene, x, y, -9.8, 0.52, 0.12, 1.7, materials.steelDark);
  box(scene, x, y + 0.07, -9.8, 0.52, 0.035, 1.7, materials.safety, false, false);
}
addRailing(-15.5, -9.0, -12.0, -9.0, 3.25, 1.05);
addRailing(-12.0, -9.0, -12.0, -6.7, 3.25, 1.05);
for (let i = 0; i < 10; i++) {
  const y = 0.35 + i * 0.3;
  pipe(scene, [-16.0, y, -5.5], [-16.0, y + 0.15, -5.5], 0.025, materials.safety);
}
pipe(scene, [-16.25, 0.4, -5.5], [-16.25, 3.35, -5.5], 0.04, materials.safety);
pipe(scene, [-15.75, 0.4, -5.5], [-15.75, 3.35, -5.5], 0.04, materials.safety);

// Zone signs and fixed equipment identifiers.
const powerSign = makeTextSprite('B1 · POWER / START', '#e9c579');
powerSign.position.set(-11.0, 4.25, 11.7); powerSign.scale.set(3.8, 0.68, 1); scene.add(powerSign);
const pumpSign = makeTextSprite('01 · PUMP & MOTOR BAY'); pumpSign.position.set(-8.2, 3.45, -6.0); pumpSign.scale.set(3.6, 0.6, 1); scene.add(pumpSign);
const pipeSign = makeTextSprite('02 · OVERHEAD MANIFOLD'); pipeSign.position.set(0.2, 5.7, -1.1); pipeSign.scale.set(4.0, 0.62, 1); scene.add(pipeSign);
const tankSign = makeTextSprite('03 · PROCESS VESSELS'); tankSign.position.set(9.7, 5.65, 1.2); tankSign.scale.set(3.8, 0.6, 1); scene.add(tankSign);
const storeSign = makeTextSprite('04 · DRUM TRANSFER'); storeSign.position.set(14.7, 3.6, 5.5); storeSign.scale.set(3.0, 0.55, 1); scene.add(storeSign);

// Seeded event visualization. The hidden event is only shown when selected.
const leakAnchor = new THREE.Group();
leakAnchor.position.set(2.35, 2.75, -1.8);
scene.add(leakAnchor);
const vaporMaterial = new THREE.MeshStandardMaterial({ color: 0xf0a948, transparent: true, opacity: 0.13, roughness: 0.3, emissive: 0x5d3108, emissiveIntensity: 0.7, depthWrite: false });
const vaporCloud = new THREE.Group();
for (const [x, y, z, r] of [[0, 0, 0, 0.7], [-0.35, -0.3, 0.05, 0.48], [0.35, -0.15, -0.1, 0.54], [0.05, 0.45, 0.1, 0.48]]) {
  const puff = new THREE.Mesh(new THREE.IcosahedronGeometry(r, 2), vaporMaterial.clone());
  puff.position.set(x, y, z); puff.scale.set(1.15, 0.72, 0.9); vaporCloud.add(puff);
}
leakAnchor.add(vaporCloud);
const leakGlow = new THREE.PointLight(0xffa43f, 0, 5, 2);
leakGlow.position.set(0, 0, 0);
leakAnchor.add(leakGlow);
const leakMarker = new THREE.Mesh(new THREE.SphereGeometry(0.1, 16, 12), new THREE.MeshBasicMaterial({ color: 0xf4ab42 }));
leakMarker.position.copy(leakAnchor.position);
scene.add(leakMarker);

const heatGlow = new THREE.PointLight(0xff6849, 0, 4.2, 2);
heatGlow.position.set(-10.0, 1.05, -4.5);
scene.add(heatGlow);
const heatHalo = new THREE.Mesh(new THREE.TorusGeometry(0.8, 0.035, 8, 40), new THREE.MeshBasicMaterial({ color: 0xff7956, transparent: true, opacity: 0.0 }));
heatHalo.position.set(-10.0, 1.9, -4.5);
scene.add(heatHalo);

const obstacle = new THREE.Group();
box(obstacle, 0, 0.55, 0, 1.1, 1.1, 0.8, mat(0x8c6038, 0.85, 0.08));
box(obstacle, 0, 1.14, 0, 1.15, 0.08, 0.85, materials.safety);
for (const x of [-0.28, 0, 0.28]) box(obstacle, x, 0.7, 0.411, 0.04, 0.22, 0.02, materials.safety, false, false);
obstacle.position.set(2.0, 0, -2.15);
scene.add(obstacle);

const routePoints = [
  new THREE.Vector3(-11.1, 0.1, 10.5), new THREE.Vector3(-11.1, 0.1, 7.8),
  new THREE.Vector3(-8.6, 0.1, 6.1), new THREE.Vector3(-4.2, 0.1, 5.8),
  new THREE.Vector3(-3.1, 0.1, 2.6), new THREE.Vector3(-3.1, 0.1, -1.3),
  new THREE.Vector3(-4.7, 0.1, -4.1), new THREE.Vector3(-8.1, 0.1, -6.2),
  new THREE.Vector3(-3.7, 0.1, -6.6), new THREE.Vector3(0.3, 0.1, -5.2),
  new THREE.Vector3(2.0, 0.1, -2.15), new THREE.Vector3(5.2, 0.1, -4.9),
  new THREE.Vector3(9.6, 0.1, -3.6), new THREE.Vector3(11.3, 0.1, 0.0),
  new THREE.Vector3(10.9, 0.1, 4.2), new THREE.Vector3(7.5, 0.1, 6.3),
  new THREE.Vector3(2.8, 0.1, 6.4), new THREE.Vector3(-2.2, 0.1, 6.3),
];
const routeGeometry = new THREE.BufferGeometry().setFromPoints(routePoints);
const routeLine = new THREE.Line(routeGeometry, materials.route);
routeLine.computeLineDistances();
routeLine.material = new THREE.LineDashedMaterial({ color: 0x70dfa5, dashSize: 0.28, gapSize: 0.18, transparent: true, opacity: 0.78 });
scene.add(routeLine);

const routeMarkers = [];
routePoints.forEach((point, index) => {
  const ring = new THREE.Mesh(new THREE.RingGeometry(0.13, 0.18, 24), new THREE.MeshBasicMaterial({ color: index === 0 ? 0x88e7b2 : 0x58bd88, side: THREE.DoubleSide, transparent: true, opacity: 0.75 }));
  ring.rotation.x = -Math.PI / 2;
  ring.position.set(point.x, 0.06, point.z);
  scene.add(ring);
  routeMarkers.push(ring);
});

// Mobile inspection robot with camera mast, lidar puck and status lamps.
const robot = new THREE.Group();
scene.add(robot);
const base = box(robot, 0, 0.32, 0, 0.95, 0.42, 0.7, materials.robot);
base.castShadow = true;
box(robot, -0.08, 0.58, 0, 0.58, 0.16, 0.53, materials.robotTop);
box(robot, 0.28, 0.58, 0, 0.19, 0.15, 0.42, materials.safety);
for (const x of [-0.31, 0.31]) for (const z of [-0.37, 0.37]) {
  const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.13, 18), materials.rubber);
  wheel.position.set(x, 0.24, z);
  wheel.rotation.x = Math.PI / 2;
  wheel.castShadow = true;
  robot.add(wheel);
}
cylinder(robot, -0.22, 0.85, -0.05, 0.045, 0.055, 0.48, materials.steel);
box(robot, -0.22, 1.1, -0.05, 0.42, 0.24, 0.33, materials.steelDark);
const cameraLens = new THREE.Mesh(new THREE.SphereGeometry(0.075, 16, 12), new THREE.MeshBasicMaterial({ color: 0x69d8ed }));
cameraLens.position.set(-0.015, 1.12, 0.12);
robot.add(cameraLens);
const lidarBase = cylinder(robot, 0.05, 0.69, -0.05, 0.22, 0.22, 0.1, materials.steelDark, 20);
const lidarTop = cylinder(robot, 0.05, 0.76, -0.05, 0.19, 0.19, 0.06, materials.glowGreen, 20);
const lamp = new THREE.PointLight(0x67dffc, 3, 3.2, 2);
lamp.position.set(0.13, 1.1, 0.22);
robot.add(lamp);
const footprint = new THREE.Mesh(new THREE.CircleGeometry(0.72, 32), new THREE.MeshBasicMaterial({ color: 0x53bde4, transparent: true, opacity: 0.12, side: THREE.DoubleSide, depthWrite: false }));
footprint.rotation.x = -Math.PI / 2;
footprint.position.y = 0.035;
robot.add(footprint);

const sensorCone = new THREE.Mesh(new THREE.ConeGeometry(0.68, 2.5, 22, 1, true), new THREE.MeshBasicMaterial({ color: 0x64d5e2, transparent: true, opacity: 0.08, side: THREE.DoubleSide, depthWrite: false }));
sensorCone.rotation.z = -Math.PI / 2;
sensorCone.position.set(1.18, 0.84, 0.1);
robot.add(sensorCone);

const robotLightRing = new THREE.Mesh(new THREE.RingGeometry(0.45, 0.52, 32), new THREE.MeshBasicMaterial({ color: 0x67dfff, transparent: true, opacity: 0.8, side: THREE.DoubleSide }));
robotLightRing.rotation.x = -Math.PI / 2;
robotLightRing.position.y = 0.045;
robot.add(robotLightRing);

robot.position.copy(routePoints[0]);
robot.scale.setScalar(1.25);

const scenarioSelect = el('scenarioSelect');
let scenario = scenarioSelect.value;
let running = false;
let blocked = false;
let progress = 0;
let elapsed = 0;
let lastFrame = performance.now();
let findings = [];
let logged = { gas: false, heat: false, blocked: false };
let lastTelemetry = { gas: 4, temp: 24 };
let toastTimer;

const hazardPosition = new THREE.Vector3(2.35, 0, -1.8);
const pumpPosition = new THREE.Vector3(-10.0, 0, -4.5);
const obstaclePosition = new THREE.Vector3(2.0, 0, -2.15);

function setState(title, sub, mode = 'idle') {
  el('stateTitle').textContent = title;
  el('stateSub').textContent = sub;
  const orb = document.querySelector('.state-orb');
  orb.className = `state-orb ${mode}`;
}

function setReportStatus(title, sub, mode = 'idle') {
  const icon = mode === 'alert' ? '!' : mode === 'complete' ? '✓' : mode === 'running' ? '↻' : '◷';
  el('reportStatus').innerHTML = `<span class="report-status-icon ${mode}">${icon}</span><span><strong>${title}</strong><small>${sub}</small></span>`;
}

function showToast(message) {
  const toast = el('toast');
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2300);
}

function addFinding(kind, title, copy, source) {
  if (logged[kind]) return;
  logged[kind] = true;
  const timestamp = formatTime(elapsed);
  findings.unshift({ kind, title, copy, source, timestamp });
  el('reportSummary').classList.add('hidden');
  const card = document.createElement('article');
  card.className = `finding-card ${kind === 'gas' || kind === 'heat' || kind === 'blocked' ? 'warning' : 'info'}`;
  const symbol = kind === 'blocked' ? '↯' : kind === 'route' ? '⌁' : '⚠';
  card.innerHTML = `<div class="finding-top"><span class="finding-mark">${symbol}</span><strong class="finding-title"></strong></div><p class="finding-copy"></p><div class="finding-meta"><span class="evidence-tag"></span><time></time></div>`;
  card.querySelector('.finding-title').textContent = title;
  card.querySelector('.finding-copy').textContent = copy;
  card.querySelector('.evidence-tag').textContent = source;
  card.querySelector('time').textContent = timestamp;
  el('reportFeed').prepend(card);
  el('findingCount').textContent = String(findings.length);
  if (kind === 'gas' || kind === 'heat' || kind === 'blocked') {
    setReportStatus('Finding detected', 'Simulated evidence recorded', 'alert');
    el('hazardCallout').classList.remove('hidden');
  }
}

function formatTime(seconds) {
  const total = Math.max(0, Math.floor(seconds));
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}

function updateScenarioVisuals() {
  const isGas = scenario === 'gas';
  const isHeat = scenario === 'heat';
  const isBlocked = scenario === 'blocked';
  vaporCloud.visible = isGas;
  leakMarker.visible = isGas;
  leakGlow.intensity = isGas ? 5 : 0;
  heatGlow.intensity = isHeat ? 7 : 0;
  heatHalo.material.opacity = isHeat ? 0.38 : 0;
  obstacle.visible = isBlocked;
  if (isGas) el('hazardLabel').textContent = 'Elevated ambient gas index';
  else if (isHeat) el('hazardLabel').textContent = 'Elevated pump surface temperature';
  else if (isBlocked) el('hazardLabel').textContent = 'Route obstruction';
  el('hazardCallout').classList.add('hidden');
}

function updateProgressUi() {
  const pct = Math.max(0, Math.min(100, Math.round((progress / (routePoints.length - 1)) * 100)));
  el('progressText').textContent = `${pct}%`;
  el('progressBar').style.width = `${pct}%`;
  el('timelineProgress').style.width = `${pct}%`;
  el('coverageText').textContent = `${pct}%`;
  el('coverageBar').style.width = `${pct}%`;
  el('zonesText').textContent = `${Math.min(6, Math.floor(pct / 100 * 6))} / 6`;
  el('elapsedText').textContent = formatTime(elapsed);
  el('clockText').textContent = formatTime(elapsed);
  el('timelineLabel').textContent = blocked ? 'Route blocked · inspection incomplete' : running ? 'Robot scanning assigned route' : pct === 100 ? 'Route inspection complete' : pct > 0 ? 'Mission paused' : 'Mission standing by';
  const dot = document.querySelector('.timeline-dot');
  dot.classList.toggle('active', running);
}

function updateRobotPose() {
  const index = Math.min(Math.floor(progress), routePoints.length - 2);
  const t = progress >= routePoints.length - 1 ? 1 : progress - index;
  const start = routePoints[index];
  const end = routePoints[Math.min(index + 1, routePoints.length - 1)];
  robot.position.set(THREE.MathUtils.lerp(start.x, end.x, t), 0, THREE.MathUtils.lerp(start.z, end.z, t));
  const direction = new THREE.Vector3(end.x - start.x, 0, end.z - start.z);
  robot.rotation.y = Math.atan2(direction.x, direction.z);
  el('coordText').innerHTML = `X ${robot.position.x.toFixed(1)}&nbsp;&nbsp; Y ${robot.position.z.toFixed(1)}`;
}

function updateTelemetry() {
  const robotPoint = new THREE.Vector3(robot.position.x, 0, robot.position.z);
  const leakDistance = robotPoint.distanceTo(hazardPosition);
  const pumpDistance = robotPoint.distanceTo(pumpPosition);
  let gas = 4;
  let temperature = 24;
  if (scenario === 'gas') gas = Math.round(4 + Math.max(0, 76 * (1 - leakDistance / 3.45)));
  if (scenario === 'heat') temperature = Math.round(24 + Math.max(0, 69 * Math.exp(-pumpDistance / 2.8)));
  lastTelemetry = { gas: Math.min(gas, 100), temp: temperature };

  el('gasValue').innerHTML = `${String(lastTelemetry.gas).padStart(2, '0')}<span> / 100</span>`;
  el('gasMeter').style.width = `${lastTelemetry.gas}%`;
  el('gasMeter').style.background = lastTelemetry.gas >= 48 ? '#f06c4f' : lastTelemetry.gas >= 28 ? '#e8af53' : '#69dba0';
  el('tempValue').innerHTML = `${lastTelemetry.temp}<span> °C</span>`;
  el('tempMeter').style.width = `${Math.min(100, Math.max(5, lastTelemetry.temp))}%`;
  el('tempMeter').style.background = lastTelemetry.temp >= 72 ? '#ef664e' : lastTelemetry.temp >= 50 ? '#e8af53' : '#7dd7a5';

  if (scenario === 'gas' && lastTelemetry.gas >= 48) {
    addFinding('gas', 'Elevated gas index observed', `Simulated reading reached ${lastTelemetry.gas} relative units near the pipe rack. This is a synthetic sensor value, not a real concentration.`, 'GAS SENSOR · SIM');
  }
  if (scenario === 'heat' && lastTelemetry.temp >= 50) {
    addFinding('heat', 'Pump surface temperature elevated', `Simulated surface reading reached ${lastTelemetry.temp} °C near the pump assembly. Compare with a real site limit before interpreting.`, 'THERMAL SENSOR · SIM');
  }
  if (scenario === 'blocked' && robotPoint.distanceTo(obstaclePosition) < 1.0 && !logged.blocked) {
    blocked = true;
    running = false;
    addFinding('blocked', 'Inspection route obstructed', 'The robot reached a blocked aisle and stopped. The area beyond the obstruction was not inspected.', 'LIDAR / ROUTE · SIM');
    setState('Route blocked', 'Area beyond obstacle not checked', 'alert');
    el('runBtn').classList.remove('paused');
    el('runBtn').innerHTML = '<span class="play-icon">▶</span><span>Inspection stopped</span>';
  }
}

function resetMission(keepScenario = true) {
  if (!keepScenario) scenario = scenarioSelect.value;
  running = false;
  blocked = false;
  progress = 0;
  elapsed = 0;
  findings = [];
  logged = { gas: false, heat: false, blocked: false };
  el('reportFeed').innerHTML = '';
  el('reportSummary').classList.remove('hidden');
  el('findingCount').textContent = '0';
  el('exportBtn').disabled = true;
  el('runBtn').classList.remove('paused');
  el('runBtn').innerHTML = '<span class="play-icon">▶</span><span>Start inspection</span>';
  el('hazardCallout').classList.add('hidden');
  el('gasValue').innerHTML = '04<span> / 100</span>';
  el('gasMeter').style.width = '4%';
  el('gasMeter').style.background = '#69dba0';
  el('tempValue').innerHTML = '24<span> °C</span>';
  el('tempMeter').style.width = '24%';
  setState('Ready at service entrance', 'Scout-01 staged at Level B1', 'idle');
  setReportStatus('Awaiting inspection', 'Start a mission to collect evidence', 'idle');
  updateScenarioVisuals();
  updateRobotPose();
  updateProgressUi();
}

function completeMission() {
  running = false;
  progress = routePoints.length - 1;
  updateRobotPose();
  updateTelemetry();
  updateProgressUi();
  setState('Inspection complete', 'Assigned route traversed', 'complete');
  if (findings.length === 0) {
    setReportStatus('No anomaly observed', 'No seeded fault crossed the alert threshold', 'complete');
    addFinding('route', 'Assigned route traversed', 'The simulated robot completed its route. This only describes the virtual scenario; it does not establish that a real area is safe.', 'ROUTE TRACE · SIM');
  } else {
    setReportStatus('Inspection complete', `${findings.length} simulated finding${findings.length === 1 ? '' : 's'} recorded`, 'alert');
  }
  el('runBtn').classList.remove('paused');
  el('runBtn').innerHTML = '<span class="play-icon">✓</span><span>Inspection complete</span>';
  el('exportBtn').disabled = false;
  showToast('Virtual inspection complete. Review checked and unchecked areas.');
}

function toggleMission() {
  if (blocked) {
    showToast('Reset the mission to retry this blocked route.');
    return;
  }
  if (progress >= routePoints.length - 1) {
    showToast('Mission is complete. Reset to run it again.');
    return;
  }
  running = !running;
  if (running) {
    setState('Inspection in progress', 'Robot following assigned route', 'running');
    setReportStatus('Inspection in progress', 'Collecting simulated evidence', 'running');
    el('runBtn').classList.add('paused');
    el('runBtn').innerHTML = '<span class="play-icon">Ⅱ</span><span>Pause inspection</span>';
  } else {
    setState('Inspection paused', 'Mission can be resumed', 'idle');
    setReportStatus('Inspection paused', 'Partial coverage; route not complete', 'idle');
    el('runBtn').classList.remove('paused');
    el('runBtn').innerHTML = '<span class="play-icon">▶</span><span>Resume inspection</span>';
  }
}

function downloadReport() {
  const report = {
    product: 'PlantScout prototype 0.1',
    report_type: 'virtual simulation; not a safety clearance',
    scenario: scenarioSelect.options[scenarioSelect.selectedIndex].text,
    time_elapsed: formatTime(elapsed),
    route_coverage_percent: Math.round((progress / (routePoints.length - 1)) * 100),
    simulated_readings_at_export: { ambient_gas_relative_units: lastTelemetry.gas, surface_temperature_celsius: lastTelemetry.temp },
    findings,
    limitations: ['All readings and events are synthetic.', 'No real robot, camera, gas detector, or plant equipment is connected.', 'No anomaly observed is not equivalent to safe for human entry.'],
  };
  const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = 'plantscout-virtual-inspection-report.json';
  anchor.click();
  URL.revokeObjectURL(url);
  showToast('Inspection report saved as JSON.');
}

el('runBtn').addEventListener('click', toggleMission);
el('resetBtn').addEventListener('click', () => resetMission());
scenarioSelect.addEventListener('change', () => { scenario = scenarioSelect.value; resetMission(); });
el('homeViewBtn').addEventListener('click', () => {
  camera.position.copy(defaultCamera);
  controls.target.set(0, 1.8, 0);
  controls.update();
});
el('focusRobotBtn').addEventListener('click', () => {
  const viewOffset = camera.position.clone().sub(controls.target).setLength(10);
  controls.target.set(robot.position.x, 0.55, robot.position.z);
  camera.position.copy(controls.target).add(viewOffset);
  controls.update();
  showToast('Camera focused on Scout-01.');
});
el('routeBtn').addEventListener('click', (event) => {
  const button = event.currentTarget;
  button.classList.toggle('active');
  routeLine.visible = button.classList.contains('active');
  routeMarkers.forEach((marker) => { marker.visible = routeLine.visible; });
});
el('lightsBtn').addEventListener('click', (event) => {
  const on = event.currentTarget.classList.toggle('active');
  facilityLights.forEach((light) => { light.visible = on; });
  event.currentTarget.setAttribute('aria-pressed', String(on));
  showToast(on ? 'Basement work lights on.' : 'Work lights off · indicator lamps remain on.');
});
el('ceilingBtn').addEventListener('click', (event) => {
  ceilingPanels.visible = !ceilingPanels.visible;
  event.currentTarget.classList.toggle('active', ceilingPanels.visible);
  event.currentTarget.setAttribute('aria-pressed', String(ceilingPanels.visible));
  showToast(ceilingPanels.visible ? 'Ceiling panels shown.' : 'Cutaway view restored.');
});
el('exportBtn').addEventListener('click', downloadReport);
el('helpBtn').addEventListener('click', () => el('infoModal').classList.remove('hidden'));
el('reportInfoBtn').addEventListener('click', () => showToast('Every report item names its simulated evidence source.'));
el('closeModal').addEventListener('click', () => el('infoModal').classList.add('hidden'));
el('infoModal').addEventListener('click', (event) => { if (event.target === el('infoModal')) el('infoModal').classList.add('hidden'); });

function resize() {
  const width = viewport.clientWidth;
  const height = viewport.clientHeight;
  if (!width || !height) return;
  renderer.setSize(width, height, false);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
}
new ResizeObserver(resize).observe(viewport);
window.addEventListener('resize', resize);

function animate(now) {
  requestAnimationFrame(animate);
  const delta = Math.min(0.05, (now - lastFrame) / 1000);
  lastFrame = now;
  if (running) {
    elapsed += delta;
    progress += delta * 0.31;
    if (progress >= routePoints.length - 1) progress = routePoints.length - 1;
    updateRobotPose();
    updateTelemetry();
    updateProgressUi();
    if (!blocked && progress >= routePoints.length - 1) completeMission();
  }
  const pulse = 1 + Math.sin(now * 0.0022) * 0.035;
  lidarTop.scale.setScalar(pulse);
  robotLightRing.material.opacity = 0.54 + (Math.sin(now * 0.003) + 1) * 0.16;
  vaporCloud.scale.setScalar(1 + Math.sin(now * 0.0017) * 0.045);
  heatHalo.rotation.z += delta * 0.24;
  conveyorRollers.forEach((roller) => { roller.rotateY(delta * 2.2); });
  motorParts.forEach((motorPart) => { motorPart.rotateY(delta * 0.85); });
  panelStatusLights.forEach((light, index) => {
    if (index % 7 === Math.floor(now / 800) % 7) light.material = Math.floor(now / 800) % 2 ? materials.ledAmber : materials.ledGreen;
  });
  routeMarkers.forEach((marker, i) => {
    const passed = i <= Math.floor(progress);
    marker.material.color.setHex(passed ? 0x86edb5 : 0x4e9870);
    marker.material.opacity = passed ? 0.95 : 0.55;
  });
  controls.update();
  renderer.render(scene, camera);
}

try {
  updateScenarioVisuals();
  resetMission();
  resize();
  loading.classList.add('hidden');
  requestAnimationFrame(animate);
} catch (error) {
  console.error(error);
  loading.classList.add('hidden');
  sceneError.classList.remove('hidden');
}
