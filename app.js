// PlantScout — Main Application Bootstrap
// Connects Three.js rendering, process simulation, robot kinematics, Meta AI client, and UI dashboard.

import * as T from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

import { buildBasementEnvironment } from './graphics/basement-environment.js';
import { buildEquipmentModels } from './graphics/equipment-models.js';
import { buildPipeNetwork } from './graphics/pipes.js';

import { ProcessSimulationEngine } from './sim/engine.js';
import { ScenarioManager } from './sim/scenario.js';

import { createRover } from './robot/rover.js';
import { isFree } from './robot/nav.js';

import { MetaInspectionClient } from './ai/meta-client.js';
import { DashboardController } from './ui/dashboard.js';
import { EQUIPMENT_REGISTER } from './data/equipment.js';

// --- 1. Scene, Camera & WebGL Renderer ---
const viewportElem = document.getElementById('viewport');
const scene = new T.Scene();
scene.background = new T.Color(0x13171a);
scene.fog = new T.FogExp2(0x13171a, 0.012);

const camera = new T.PerspectiveCamera(70, viewportElem.clientWidth / viewportElem.clientHeight, 0.1, 100);
camera.rotation.order = 'YXZ';
camera.position.set(0.0, 1.75, 11.7); // Stop at the sealed vestibule door first

const renderer = new T.WebGLRenderer({ antialias: true, powerPreference: 'high-performance', preserveDrawingBuffer: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.6));
renderer.setSize(viewportElem.clientWidth, viewportElem.clientHeight);
renderer.outputColorSpace = T.SRGBColorSpace;
renderer.toneMapping = T.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.85;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = T.PCFSoftShadowMap;
viewportElem.appendChild(renderer.domElement);

// Environment & Lighting
const pmrem = new T.PMREMGenerator(renderer);
const roomEnv = new RoomEnvironment();
scene.environment = pmrem.fromScene(roomEnv, 0.04).texture;
roomEnv.dispose();
pmrem.dispose();

const ambientLight = new T.HemisphereLight(0xdde3ea, 0x222830, 0.38);
scene.add(ambientLight);

const mainSun = new T.DirectionalLight(0xf5eedc, 0.38);
mainSun.position.set(2, 9, 3);
mainSun.target.position.set(0, 0, 0);
mainSun.castShadow = true;
mainSun.shadow.mapSize.set(1024, 1024);
mainSun.shadow.camera.left = -16;
mainSun.shadow.camera.right = 16;
mainSun.shadow.camera.top = 10;
mainSun.shadow.camera.bottom = -10;
mainSun.shadow.camera.far = 25;
scene.add(mainSun, mainSun.target);

// --- 2. 3D World Construction ---
const basement = buildBasementEnvironment(T, scene);
const equipment = buildEquipmentModels(T, scene);
const pipes = buildPipeNetwork(T, scene);

// --- 3. Process Simulation & Scenario Management ---
const engine = new ProcessSimulationEngine('normal');
const scenarioMgr = new ScenarioManager(engine);
scenarioMgr.updateSpillVisualization(scene, T);

// --- 4. Robot & Autonomous Inspection Callback ---
let dashboard = null;

function captureCameraSnapshot() {
  // Capture current canvas frame as base64 thumbnail
  return renderer.domElement.toDataURL('image/jpeg', 0.85);
}

const rover = createRover(T, scene, (station, stationIndex) => {
  // On Station Stop: capture frame & submit to dashboard inspection session
  setTimeout(() => {
    const frame = captureCameraSnapshot();
    if (dashboard) {
      dashboard.handleStationObservation(station, stationIndex, frame);
    }
  }, 350); // Small delay to let masthead camera settle on target
});

// --- 5. Meta AI Client & Dashboard Controller ---
const metaClient = new MetaInspectionClient();
dashboard = new DashboardController(engine, scenarioMgr, rover, metaClient, camera, scene, T);

// URL Query Parameter Initialisation for testing & direct linking
const urlParams = new URLSearchParams(window.location.search);
if (urlParams.get('scenario') === 'defective') {
  dashboard.setScenario('defective');
  document.getElementById('scenario-select').value = 'defective';
}
if (urlParams.has('stage')) {
  engine.setStage(Number(urlParams.get('stage')) - 1);
}
if (urlParams.get('view')) {
  dashboard.switchView(urlParams.get('view'));
}
if (urlParams.get('highlight')) {
  setTimeout(() => dashboard.selectEquipment(urlParams.get('highlight')), 350);
}
if (urlParams.get('highlight_spill')) {
  setTimeout(() => dashboard.highlightSpillInScene(), 350);
}
if (urlParams.get('auto_report') === '1') {
  rover.speedMultiplier = 25.0; // Rapid fast-forward for verification
  dashboard.startNewInspection();
}

// --- 6. Camera Views & User Controls ---
let activeCamView = 'walk'; // 'walk' | 'follow' | 'camera'
const keys = new Set();
let entryOpen = false;
const entryOverlay = document.getElementById('entry-overlay');
const controlsOverlay = document.getElementById('controls-overlay');
const entryPin = document.getElementById('entry-pin');
function showControls() {
  if (!entryOpen) return;
  controlsOverlay.classList.remove('hidden');
  document.getElementById('controls-close').focus();
}
document.getElementById('btn-controls').addEventListener('click', showControls);
document.getElementById('controls-close').addEventListener('click', () => {
  controlsOverlay.classList.add('hidden');
  renderer.domElement.focus();
});
function enterBasement() {
  if (entryPin.value !== '2048') {
    document.getElementById('entry-error').textContent = 'Incorrect demonstration PIN.';
    entryPin.focus();
    return;
  }
  entryOpen = true;
  equipment.equipmentMap.get('DOOR-001').rotation.y = Math.PI / 2;
  entryOverlay.classList.add('hidden');
  camera.position.set(0, 1.75, 8.9);
  camera.rotation.set(0, 0, 0);
  showControls();
}
document.getElementById('entry-submit').addEventListener('click', enterBasement);
entryPin.addEventListener('keydown', event => {
  if (event.key === 'Enter') enterBasement();
});
entryPin.focus();
let isDragging = false;
let previousPointer = { x: 0, y: 0 };
let walkPitch = 0;
let walkYaw = 0;

window.addEventListener('keydown', e => {
  if (!entryOpen || !controlsOverlay.classList.contains('hidden')) return;
  const k = e.key.toLowerCase();
  keys.add(k);
  if (k === ' ') {
    rover.emergencyStop();
  }
});

window.addEventListener('keyup', e => {
  keys.delete(e.key.toLowerCase());
});

renderer.domElement.addEventListener('pointerdown', e => {
  isDragging = true;
  previousPointer = { x: e.clientX, y: e.clientY };
  renderer.domElement.setPointerCapture(e.pointerId);

  // Check raycasting for clicking on equipment
  handleEquipmentRaycast(e);
});

renderer.domElement.addEventListener('pointermove', e => {
  if (!isDragging) return;
  const dx = e.clientX - previousPointer.x;
  const dy = e.clientY - previousPointer.y;
  previousPointer = { x: e.clientX, y: e.clientY };

  if (activeCamView === 'walk') {
    walkYaw -= dx * 0.003;
    walkPitch = T.MathUtils.clamp(walkPitch - dy * 0.003, -1.2, 1.2);
    camera.rotation.y = walkYaw;
    camera.rotation.x = walkPitch;
  } else if (activeCamView === 'camera') {
    // Aim robot mast camera
    rover.aimCamera(
      rover.cameraHead.rotation.y - dx * 0.004,
      rover.cameraHead.rotation.x - dy * 0.004
    );
  }
});

renderer.domElement.addEventListener('pointerup', e => {
  isDragging = false;
});

// Equipment Click Raycasting
const raycaster = new T.Raycaster();
const mouseVec = new T.Vector2();

function handleEquipmentRaycast(e) {
  const rect = renderer.domElement.getBoundingClientRect();
  mouseVec.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
  mouseVec.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

  raycaster.setFromCamera(mouseVec, camera);
  const intersects = raycaster.intersectObjects(scene.children, true);

  for (const hit of intersects) {
    let obj = hit.object;
    while (obj && obj !== scene) {
      if (obj.userData && obj.userData.spec) {
        dashboard.selectEquipment(obj.userData.spec.id);
        return;
      }
      obj = obj.parent;
    }
  }
}

// Mobile/Touch Driving Buttons
const touchControls = {
  fwd: document.getElementById('drive-fwd'),
  rev: document.getElementById('drive-rev'),
  left: document.getElementById('drive-left'),
  right: document.getElementById('drive-right')
};

const heldTouch = new Set();
if (touchControls.fwd) {
  ['fwd', 'rev', 'left', 'right'].forEach(dir => {
    const btn = touchControls[dir];
    if (!btn) return;
    btn.onpointerdown = e => { e.preventDefault(); heldTouch.add(dir); };
    btn.onpointerup = btn.onpointercancel = () => heldTouch.delete(dir);
  });
}

// Camera View Mode Switching
document.querySelectorAll('.view-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    activeCamView = btn.dataset.cam;
    const drivingHud = document.getElementById('robot-driving-hud');
    if (drivingHud) {
      drivingHud.classList.toggle('hidden', activeCamView === 'walk');
    }
  });
});

// Walking in Walk Mode
function updateWalkMotion(dt) {
  if (!entryOpen || !controlsOverlay.classList.contains('hidden')) return;
  if (activeCamView !== 'walk') return;

  let moveForward = 0;
  let moveStrafe = 0;
  if (keys.has('w') || keys.has('arrowup')) moveForward += 1;
  if (keys.has('s') || keys.has('arrowdown')) moveForward -= 1;
  if (keys.has('d') || keys.has('arrowright')) moveStrafe += 1;
  if (keys.has('a') || keys.has('arrowleft')) moveStrafe -= 1;

  if (moveForward === 0 && moveStrafe === 0) return;

  const moveSpeed = 3.2 * dt;
  const forwardDir = new T.Vector3(0, 0, -1).applyAxisAngle(new T.Vector3(0, 1, 0), camera.rotation.y);
  const sideDir = new T.Vector3(1, 0, 0).applyAxisAngle(new T.Vector3(0, 1, 0), camera.rotation.y);

  const delta = new T.Vector3()
    .addScaledVector(forwardDir, moveForward)
    .addScaledVector(sideDir, moveStrafe)
    .normalize()
    .multiplyScalar(moveSpeed);

  const nx = camera.position.x + delta.x;
  const nz = camera.position.z + delta.z;

  if (isFree(nx, nz, 0.40)) {
    camera.position.x = nx;
    camera.position.z = nz;
  }
}

// Manual Driving in Follow / Camera View
function updateManualDriving(dt) {
  if (!entryOpen || !controlsOverlay.classList.contains('hidden')) return;
  if (activeCamView === 'walk') return;

  let throttle = 0;
  let turn = 0;

  if (keys.has('w') || keys.has('arrowup') || heldTouch.has('fwd')) throttle += 1;
  if (keys.has('s') || keys.has('arrowdown') || heldTouch.has('rev')) throttle -= 1;
  if (keys.has('a') || keys.has('arrowleft') || heldTouch.has('left')) turn += 1;
  if (keys.has('d') || keys.has('arrowright') || heldTouch.has('right')) turn -= 1;

  if (throttle !== 0 || turn !== 0) {
    rover.manualDrive(throttle, turn, dt);
  }
}

// Update Camera Pose depending on mode
function updateCameraPose() {
  if (activeCamView === 'follow') {
    // Smooth chase-cam 2.4m behind rover
    const angle = rover.root.rotation.y;
    const offset = new T.Vector3(
      Math.sin(angle) * 2.4,
      1.8,
      Math.cos(angle) * 2.4
    );
    const targetPos = rover.root.position.clone().add(offset);
    camera.position.lerp(targetPos, 0.12);
    camera.lookAt(rover.root.position.x, rover.root.position.y + 0.65, rover.root.position.z);
  } else if (activeCamView === 'camera') {
    // First-person view directly from masthead camera lens!
    const worldCamPos = new T.Vector3();
    rover.cameraHead.getWorldPosition(worldCamPos);
    // Slight forward offset so camera lens is completely clear of housing
    const forwardOffset = new T.Vector3(0, 0, -0.15).applyQuaternion(rover.cameraHead.quaternion).applyQuaternion(rover.root.quaternion);
    camera.position.copy(worldCamPos).add(forwardOffset);

    // Camera view orientation matching masthead pan/tilt + rover heading
    const lookTarget = camera.position.clone().add(
      new T.Vector3(0, 0, -2.0)
        .applyQuaternion(rover.cameraHead.quaternion)
        .applyQuaternion(rover.root.quaternion)
    );
    camera.lookAt(lookTarget);
  }
}

// --- 7. Main Animation Loop ---
let lastTime = performance.now();
let telemetryAge = 0;

function animate(now) {
  requestAnimationFrame(animate);

  const frameTime = Math.min((now - lastTime) / 1000, 0.1);
  lastTime = now;

  // 1. Process Simulation Engine Step
  engine.update(frameTime);

  // 2. Rover Kinematics & Route Step
  rover.update(frameTime);

  // 3. User Walking & Driving Step
  updateWalkMotion(frameTime);
  updateManualDriving(frameTime);

  // 4. Update Camera Pose
  updateCameraPose();

  // 5. Equipment 3D Animations (agitators, fan, pumps)
  equipment.update(frameTime, engine);

  // 6. UI Updates (Throttle to ~5Hz for smooth DOM performance)
  telemetryAge += frameTime;
  if (telemetryAge >= 0.18) {
    telemetryAge = 0;
    dashboard.updateTelemetryBar();
    dashboard.updateTopBar();
  }

  // 7. WebGL Render
  renderer.render(scene, camera);
}

// Window Resize Handling
window.addEventListener('resize', () => {
  const w = viewportElem.clientWidth;
  const h = viewportElem.clientHeight;
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h);
});

// Start loop
requestAnimationFrame(animate);
