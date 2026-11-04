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
renderer.domElement.tabIndex = 0;
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.35));
renderer.setSize(viewportElem.clientWidth, viewportElem.clientHeight);
renderer.outputColorSpace = T.SRGBColorSpace;
renderer.toneMapping = T.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.77;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = T.PCFSoftShadowMap;
viewportElem.appendChild(renderer.domElement);

// Environment & Lighting
const pmrem = new T.PMREMGenerator(renderer);
const roomEnv = new RoomEnvironment();
scene.environment = pmrem.fromScene(roomEnv, 0.04).texture;
roomEnv.dispose();
pmrem.dispose();

const ambientLight = new T.HemisphereLight(0xdde3ea, 0x222830, 0.28);
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
const topViewOccluders = ['TOP_VIEW_MAIN_DUCT', 'TOP_VIEW_CABLE_TRAY'].map(name => scene.getObjectByName(name)).filter(Boolean);
let entryOpen = false;
const entryOverlay = document.getElementById('entry-overlay');
const controlsOverlay = document.getElementById('controls-overlay');
const entryPin = document.getElementById('entry-pin');

// --- 3. Process Simulation & Scenario Management ---
const engine = new ProcessSimulationEngine('normal');
const scenarioMgr = new ScenarioManager(engine);
scenarioMgr.updateSpillVisualization(scene, T);
scenarioMgr.updateDefectVisualization(scene, T);
scenarioMgr.subscribe(scenario => pipes.setScenario(scenario.id));

// --- 4. Robot & Autonomous Inspection Callback ---
let dashboard = null;

function captureCameraSnapshot(station) {
  // Render from the mast lens, independently of the operator's selected view.
  const oldPosition = camera.position.clone();
  const oldQuaternion = camera.quaternion.clone();
  const oldFov = camera.fov;
  const lens = new T.Vector3();
  const direction = new T.Vector3(0, 0, -1);
  rover.cameraHead.getWorldPosition(lens);
  rover.cameraHead.getWorldQuaternion(oldFrameQuaternion);
  direction.applyQuaternion(oldFrameQuaternion);
  camera.position.copy(lens).addScaledVector(direction, 0.16);
  camera.lookAt(camera.position.clone().add(direction));
  if (station?.targetEq === 'P-103' || station?.targetEq === 'GD-901') {
    camera.fov = 45;
    camera.updateProjectionMatrix();
  }
  renderer.render(scene, camera);
  const frame = renderer.domElement.toDataURL('image/jpeg', 0.8);
  camera.position.copy(oldPosition);
  camera.quaternion.copy(oldQuaternion);
  camera.fov = oldFov;
  camera.updateProjectionMatrix();
  return frame;
}

const oldFrameQuaternion = new T.Quaternion();

const rover = createRover(T, scene, (station, stationIndex, missionAtStop) => {
  return new Promise((resolve, reject) => setTimeout(async () => {
    try {
    if (missionAtStop !== rover.missionId) { resolve(); return; }
    const frame = captureCameraSnapshot(station);
    if (dashboard) {
      await dashboard.handleStationObservation(station, stationIndex, frame);
    }
    resolve();
    } catch (error) { reject(error); }
  }, 350));
}, (phase, station) => dashboard?.handleTravelScan(phase, station));

// --- 5. Meta AI Client & Dashboard Controller ---
const metaClient = new MetaInspectionClient();
dashboard = new DashboardController(engine, scenarioMgr, rover, metaClient, camera, scene, T);

// --- 6. Camera Views & User Controls ---
let activeCamView = 'walk'; // 'walk' | 'follow' | 'camera'
const keys = new Set();
let walkPitch = 0;
let walkYaw = 0;
dashboard.canEnter = () => entryOpen;
dashboard.onCameraRestored = () => { walkYaw = camera.rotation.y; walkPitch = camera.rotation.x; };
function resizeViewport() {
  requestAnimationFrame(() => {
    const w = Math.max(1, viewportElem.clientWidth), h = Math.max(1, viewportElem.clientHeight);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  });
}
dashboard.onPreviewChanged = () => { activeCamView = 'walk'; resizeViewport(); };
dashboard.onScreenChanged = view => {
  if (view !== 'access') entryOverlay.classList.add('hidden');
  if (view === 'explore') document.querySelector('.view-btn[data-cam="walk"]')?.click();
  if (view === 'inspection') document.querySelector('.view-btn[data-cam="follow"]')?.click();
  resizeViewport();
  window.scrollTo({ top: 0, behavior: 'instant' });
};
dashboard.onAccessRequested = scenario => {
  ++dashboard.flightToken;
  entryOpen = false;
  keys.clear();
  dashboard.interruptInspection();
  dashboard.onProcessStopped?.();
  rover.resetToDock();
  equipment.equipmentMap.get('DOOR-001').rotation.y = 0;
  camera.position.set(0, 1.75, 11.7);
  camera.rotation.set(0, 0, 0);
  camera.fov = 70;
  camera.updateProjectionMatrix();
  walkYaw = 0; walkPitch = 0;
  activeCamView = 'walk';
  document.querySelector('.view-btn[data-cam="walk"]')?.click();
  document.getElementById('entry-basement').value = scenario;
  document.getElementById('entry-kicker').textContent = `PLANTSCOUT • BASEMENT ${scenario === 'normal' ? '1' : '2'}`;
  document.getElementById('entry-instruction').textContent = 'The door is closed. Approach it before entering the demonstration PIN.';
  document.getElementById('entry-approach').classList.remove('hidden');
  document.getElementById('entry-pin-step').classList.add('hidden');
  document.getElementById('entry-error').textContent = '';
  entryPin.value = '';
  entryOverlay.classList.remove('hidden');
};
document.getElementById('entry-approach').addEventListener('click', () => {
  dashboard.flyCameraTo([0, 1.75, 10.9], [0, 1.35, 10.0]);
  document.getElementById('entry-approach').classList.add('hidden');
  document.getElementById('entry-pin-step').classList.remove('hidden');
  document.getElementById('entry-instruction').textContent = 'At the door. Enter the demonstration PIN to unlock the process hall.';
  entryPin.focus();
});
document.getElementById('entry-back').addEventListener('click', () => dashboard.switchView('overview'));
document.getElementById('btn-reset-view').addEventListener('click', resetCameraView);
document.getElementById('btn-reset-camera').addEventListener('click', resetCameraView);
function resetCameraView() {
  ++dashboard.flightToken;
  dashboard.closeEquipmentDetails();
  camera.fov = 70; camera.updateProjectionMatrix();
  if (dashboard.activeView === 'inspection') {
    document.querySelector('.view-btn[data-cam="follow"]')?.click();
  } else {
    document.querySelector('.view-btn[data-cam="walk"]')?.click();
    camera.position.set(0, 1.75, entryOpen ? 5.6 : 11.7);
    camera.rotation.set(0, 0, 0);
    walkYaw = 0; walkPitch = 0;
  }
}

// Preserve direct links while keeping the entrance gate for both basements.
const urlParams = new URLSearchParams(window.location.search);
if (urlParams.get('scenario') === 'defective') dashboard.setScenario('defective');
if (urlParams.has('stage')) engine.setStage(Number(urlParams.get('stage')) - 1);
if (urlParams.get('view')) dashboard.switchView(urlParams.get('view'));
if (urlParams.get('highlight')) setTimeout(() => dashboard.openEquipmentInScene(urlParams.get('highlight')), 350);
if (urlParams.get('highlight_spill')) {
  dashboard.pendingSpill = true;
  setTimeout(() => dashboard.switchView('access'), 350);
}
if (urlParams.get('auto_report') === '1') {
  entryOpen = true;
  if (engine.stageIndex === 0) engine.setStage(8);
  rover.speedMultiplier = 25.0;
  dashboard.startNewInspection();
}
function showControls() {
  if (!entryOpen) { dashboard.switchView('controls'); return; }
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
  const selectedBasement = document.getElementById('entry-basement').value;
  if (scenarioMgr.currentScenario !== selectedBasement) dashboard.setScenario(selectedBasement);
  ++dashboard.flightToken;
  equipment.equipmentMap.get('DOOR-001').rotation.y = Math.PI / 2;
  entryOverlay.classList.add('hidden');
  camera.position.set(0, 1.75, 5.6);
  camera.rotation.set(0, 0, 0);
  walkYaw = 0; walkPitch = 0;
  dashboard.switchView('explore');
  showControls();
  if (dashboard.pendingEquipmentId) {
    const target = dashboard.pendingEquipmentId;
    dashboard.pendingEquipmentId = null;
    document.getElementById('controls-overlay').classList.add('hidden');
    dashboard.selectEquipment(target);
  }
  if (dashboard.pendingSpill) {
    dashboard.pendingSpill = false;
    document.getElementById('controls-overlay').classList.add('hidden');
    dashboard.highlightSpillInScene();
  }
}
document.getElementById('entry-submit').addEventListener('click', enterBasement);
entryPin.addEventListener('keydown', event => {
  if (event.key === 'Enter') enterBasement();
});
const machineAudio = new AudioContext();
const machineOscillator = machineAudio.createOscillator();
const machineGain = machineAudio.createGain();
machineOscillator.type = 'sawtooth';
machineOscillator.frequency.value = 58;
machineGain.gain.value = 0;
machineOscillator.connect(machineGain).connect(machineAudio.destination);
machineOscillator.start();
dashboard.onProcessStopped = () => machineGain.gain.setTargetAtTime(0, machineAudio.currentTime, 0.1);
document.getElementById('btn-start-system').addEventListener('click', () => {
  machineAudio.resume();
  machineGain.gain.setTargetAtTime(0.012, machineAudio.currentTime, 0.5);
  engine.isPaused = false;
  engine.isAutoAdvancing = true;
  if (engine.stageIndex === 0) engine.nextStage();
  dashboard.updateTopBar();
  document.getElementById('btn-start-system').textContent = '● Resin system running';
  document.getElementById('btn-auto-advance').textContent = 'Auto-Advancing: ON';
});
function leaveInspectionFullscreen() {
  document.body.classList.remove('inspection-active');
  document.getElementById('scan-hud').classList.add('hidden');
  if (document.fullscreenElement) document.exitFullscreen();
}
function enterInspectionFullscreen() {
  if (dashboard.activeView !== 'inspection') return;
  document.body.classList.add('inspection-active');
  document.getElementById('scan-hud').classList.remove('hidden');
  document.querySelector('.viewport-container').requestFullscreen?.().catch(() => leaveInspectionFullscreen());
}
dashboard.onRequestFullscreen = enterInspectionFullscreen;
document.getElementById('btn-enter-fullscreen').addEventListener('click', enterInspectionFullscreen);
document.getElementById('scan-exit').addEventListener('click', leaveInspectionFullscreen);
document.getElementById('scan-pause').addEventListener('click', () => dashboard.pauseInspection());
document.getElementById('scan-resume').addEventListener('click', () => dashboard.resumeInspection());
document.getElementById('scan-stop').addEventListener('click', () => dashboard.stopInspection());
document.getElementById('scan-report').addEventListener('click', () => {
  dashboard.stopInspection();
  leaveInspectionFullscreen();
  dashboard.switchView('report');
});
document.addEventListener('fullscreenchange', () => {
  if (!document.fullscreenElement) {
    document.body.classList.remove('inspection-active');
    document.getElementById('scan-hud').classList.add('hidden');
  }
  window.dispatchEvent(new Event('resize'));
});
let isDragging = false;
let previousPointer = { x: 0, y: 0 };

window.addEventListener('keydown', e => {
  if (!entryOpen || !controlsOverlay.classList.contains('hidden')) return;
  if (/INPUT|SELECT|TEXTAREA/.test(e.target?.tagName || '')) return;
  const k = e.key.toLowerCase();
  if (k.startsWith('arrow') || k === ' ') e.preventDefault();
  keys.add(k);
  if (k === ' ') {
    rover.emergencyStop();
    dashboard.interruptInspection();
    dashboard.updateLiveProgress();
  }
});

window.addEventListener('keyup', e => {
  keys.delete(e.key.toLowerCase());
});

renderer.domElement.addEventListener('pointerdown', e => {
  if (!entryOpen) return;
  isDragging = true;
  previousPointer = { x: e.clientX, y: e.clientY };
  dragStart = { x: e.clientX, y: e.clientY };
  renderer.domElement.setPointerCapture(e.pointerId);
});

let dragStart = { x: 0, y: 0 };

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
  if (Math.hypot(e.clientX - dragStart.x, e.clientY - dragStart.y) < 5) handleEquipmentRaycast(e);
  isDragging = false;
});
renderer.domElement.addEventListener('pointercancel', () => { isDragging = false; });
renderer.domElement.addEventListener('wheel', e => {
  if (!entryOpen && !document.body.classList.contains('equipment-preview-open')) return;
  e.preventDefault();
  camera.fov = T.MathUtils.clamp(camera.fov + e.deltaY * 0.025, 38, 90);
  camera.updateProjectionMatrix();
}, { passive: false });

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
        dashboard.selectEquipment(obj.userData.spec.id, { distant: dashboard.activeView === 'pfd' });
        return;
      }
      obj = obj.parent;
    }
  }
  dashboard.closeEquipmentDetails();
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
document.querySelectorAll('.view-btn[data-cam]').forEach(btn => {
  btn.addEventListener('click', () => {
    activeCamView = btn.dataset.cam;
    const drivingHud = document.getElementById('robot-driving-hud');
    if (drivingHud) {
      drivingHud.classList.toggle('hidden', activeCamView === 'walk');
    }
  });
});
if (dashboard.activeView === 'inspection') document.querySelector('.view-btn[data-cam="follow"]').click();

// Walking in Walk Mode
function updateWalkMotion(dt) {
  if (!entryOpen || dashboard.activeView !== 'explore' || !controlsOverlay.classList.contains('hidden')) return;
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
    const wasAutomatic = rover.isMoving || rover.state === 'Station Dwell / Observing';
    rover.manualDrive(throttle, turn, dt);
    if (wasAutomatic) dashboard.stopSpeech();
    if (dashboard.inspectionSession.status === 'In Progress') {
      document.getElementById('scan-title').textContent = 'SCOUT-01 • MANUAL CONTROL';
      document.getElementById('scan-detail').textContent = 'Automatic route paused. Use Resume from here when ready.';
    }
  }
}

// Update Camera Pose depending on mode
function updateCameraPose() {
  if (activeCamView === 'follow') {
    // Keep the camera close and above the rover; pull it forward if a structure occludes it.
    const angle = rover.root.rotation.y;
    const offset = new T.Vector3(
      Math.sin(angle) * 1.85,
      2.65,
      Math.cos(angle) * 1.85
    );
    const desired = rover.root.position.clone().add(offset);
    const targetPos = isFree(desired.x, desired.z, 0.15) ? desired : rover.root.position.clone().add(new T.Vector3(0, 2.85, 0.5));
    camera.position.lerp(targetPos, 0.2);
    camera.lookAt(rover.root.position.x - Math.sin(angle) * 0.6, 0.8, rover.root.position.z - Math.cos(angle) * 0.6);
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
  } else if (activeCamView === 'top') {
    camera.position.lerp(new T.Vector3(rover.root.position.x, 6.65, rover.root.position.z + 0.1), 0.24);
    camera.lookAt(rover.root.position.x, 0.2, rover.root.position.z - 0.2);
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
  if (['access', 'explore', 'inspection'].includes(dashboard.activeView) || (dashboard.activeView === 'pfd' && document.body.classList.contains('equipment-preview-open'))) {
    if (activeCamView === 'top') topViewOccluders.forEach(object => { object.visible = false; });
    renderer.render(scene, camera);
    if (activeCamView === 'top') topViewOccluders.forEach(object => { object.visible = true; });
  }
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
