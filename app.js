import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { buildIndustry } from './industrial-layout.js';

const el = (id) => document.getElementById(id);
const sceneError = el('sceneError');
const loading = el('loading');
const viewport = el('viewport');

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x05090a);
scene.fog = new THREE.Fog(0x080d10, 36, 64);

const camera = new THREE.PerspectiveCamera(39, 1, 0.1, 180);
const defaultCamera = new THREE.Vector3(24, 20, 29);
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
controls.target.set(0, 4.2, 0);
controls.enableDamping = true;
controls.dampingFactor = 0.065;
controls.maxPolarAngle = Math.PI * 0.485;
controls.minDistance = 10;
controls.maxDistance = 60;

scene.add(new THREE.HemisphereLight(0x839990, 0x111817, 0.58));
const keyLight = new THREE.DirectionalLight(0xc4c8b8, 1.25);
keyLight.position.set(-9, 19, 11);
keyLight.castShadow = true;
keyLight.shadow.mapSize.set(2048, 2048);
keyLight.shadow.camera.left = -22;
keyLight.shadow.camera.right = 22;
keyLight.shadow.camera.top = 20;
keyLight.shadow.camera.bottom = -20;
keyLight.shadow.bias = -0.0004;
scene.add(keyLight);
const fillLight = new THREE.PointLight(0x63877e, 8, 34, 2);
fillLight.position.set(0, 5.5, -7);
scene.add(fillLight);

const mat = (color, roughness = 0.72, metalness = 0.12, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness, metalness, ...extra });
const materials = {
  floor: mat(0x303738, 0.96, 0.03),
  concrete: mat(0x424b4b, 0.95, 0.02),
  wall: mat(0x485251, 0.94, 0.02),
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

const { facilityLights, processMotors, panelStatusLights, conveyorRollers, ceilingPanels } = buildIndustry(THREE, scene);

// Seeded event visualization. The hidden event is only shown when selected.
const leakAnchor = new THREE.Group();
leakAnchor.position.set(-5.1, 2.05, -4.8);
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
heatGlow.position.set(0.1, 1.0, -2.6);
scene.add(heatGlow);
const heatHalo = new THREE.Mesh(new THREE.TorusGeometry(0.8, 0.035, 8, 40), new THREE.MeshBasicMaterial({ color: 0xff7956, transparent: true, opacity: 0.0 }));
heatHalo.position.set(0.1, 1.9, -2.6);
scene.add(heatHalo);

const obstacle = new THREE.Group();
box(obstacle, 0, 0.55, 0, 1.1, 1.1, 0.8, mat(0x8c6038, 0.85, 0.08));
box(obstacle, 0, 1.14, 0, 1.15, 0.08, 0.85, materials.safety);
for (const x of [-0.28, 0, 0.28]) box(obstacle, x, 0.7, 0.411, 0.04, 0.22, 0.02, materials.safety, false, false);
obstacle.position.set(5.8, 0, 1.0);
scene.add(obstacle);

const routePoints = [
  new THREE.Vector3(9.95, 0.1, 7.1), new THREE.Vector3(9.95, 0.1, 5.6),
  new THREE.Vector3(9.5, 0.1, 3.5), new THREE.Vector3(7.8, 0.1, 2.0),
  new THREE.Vector3(4.8, 0.1, 1.0), new THREE.Vector3(1.2, 0.1, 0.8),
  new THREE.Vector3(-2.5, 0.1, 0.8), new THREE.Vector3(-5.3, 0.1, 0.2),
  new THREE.Vector3(-5.3, 0.1, -1.1), new THREE.Vector3(-2.8, 0.1, -1.3),
  new THREE.Vector3(0.4, 0.1, -1.1), new THREE.Vector3(3.6, 0.1, -1.1),
  new THREE.Vector3(6.8, 0.1, -0.2), new THREE.Vector3(9.2, 0.1, 1.3),
  new THREE.Vector3(9.0, 0.1, 4.1), new THREE.Vector3(6.3, 0.1, 5.7),
  new THREE.Vector3(2.5, 0.1, 5.9), new THREE.Vector3(-1.8, 0.1, 5.7),
  new THREE.Vector3(-6.0, 0.1, 5.4), new THREE.Vector3(-9.7, 0.1, 5.0),
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

const hazardPosition = new THREE.Vector3(-5.1, 0, -4.8);
const pumpPosition = new THREE.Vector3(-0.8, 0, -2.6);
const obstaclePosition = new THREE.Vector3(5.8, 0, 1.0);

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
  setState('Ready at B1 access door', 'Scout-01 staged in the resin-unit gallery', 'idle');
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
  controls.target.set(0, 4.2, 0);
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
  showToast(ceilingPanels.visible ? 'Process-floor slabs shown.' : 'Cutaway gallery view restored.');
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
  processMotors.forEach((motorPart) => { motorPart.rotateX(delta * 0.85); });
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
