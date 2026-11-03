// PlantScout - Inspection Robot SCOUT-01
// 4-wheel rover with camera mast, RGB camera, 2D LiDAR scanner, manual kinematics & auto inspection.

import { isFree, planPath, getLidarRange, isSegmentClear } from './nav.js';
import { INSPECTION_STATIONS } from '../data/equipment.js';

export const ROBOT_COMPONENTS = [
  { name: 'Chassis & Frame', desc: 'Sealed IP66 aluminum monocoque housing drivetrain, compute and power management.' },
  { name: 'Four Drive Wheels', desc: 'Differential drive with solid rubber treaded tires and direct-drive hub motors.' },
  { name: 'Front & Rear Bumpers', desc: 'Heavy-duty neoprene collision bumpers matching the kinematic boundary.' },
  { name: 'Camera Mast', desc: 'Articulated vertical mast elevating the visual sensor payload to 1.15m inspection height.' },
  { name: 'RGB Inspection Camera', desc: 'High-resolution pan-tilt camera with optical zoom and calibrated exposure.' },
  { name: 'Simulated 2D LiDAR', desc: 'Planar range scanner rotating at 10 Hz providing 360° obstacle distance rays.' },
  { name: 'LED Headlights', desc: 'Twin forward LED spot lamps providing illumination in low-light basement corners.' },
  { name: 'Amber Strobe Beacon', desc: 'Visual presence indicator active during autonomous motion.' },
  { name: 'Emergency Stop Switch', desc: 'Physical and simulated safety mushroom switch isolating motor drive circuits.' },
  { name: 'Battery Enclosure', desc: '24V 40Ah Lithium Iron Phosphate battery pack with battery management system.' }
];

export function createRover(T, scene, onStationStop) {
  const root = new T.Group();
  root.name = 'ROBOT-001_SCOUT';
  root.position.set(0.0, 0, 7.8); // Dock position
  root.rotation.y = 0; // Facing North
  scene.add(root);

  const materials = {
    chassis: new T.MeshStandardMaterial({ color: 0x36454f, roughness: 0.45, metalness: 0.60 }),
    steel: new T.MeshStandardMaterial({ color: 0x8a959e, roughness: 0.35, metalness: 0.85 }),
    bumper: new T.MeshStandardMaterial({ color: 0x181e24, roughness: 0.90 }),
    tire: new T.MeshStandardMaterial({ color: 0x15181a, roughness: 0.85 }),
    yellow: new T.MeshStandardMaterial({ color: 0xc49b29, roughness: 0.55 }),
    red: new T.MeshStandardMaterial({ color: 0xa83228, roughness: 0.50 }),
    lens: new T.MeshStandardMaterial({ color: 0x0d2133, roughness: 0.1, metalness: 0.9 }),
    headlightGlow: new T.MeshBasicMaterial({ color: 0xfffaed })
  };

  function addMesh(geo, mat, p = root, x = 0, y = 0, z = 0) {
    const m = new T.Mesh(geo, mat);
    m.position.set(x, y, z);
    m.castShadow = true;
    m.receiveShadow = true;
    p.add(m);
    return m;
  }

  function box(p, x, y, z, w, h, d, mat = materials.chassis) {
    return addMesh(new T.BoxGeometry(w, h, d), mat, p, x, y, z);
  }

  function cylinder(p, x, y, z, rt, rb, h, mat = materials.steel, rotZ = 0) {
    const m = addMesh(new T.CylinderGeometry(rt, rb, h, 20), mat, p, x, y, z);
    if (rotZ) m.rotation.z = rotZ;
    return m;
  }

  // --- Build Rover Geometry ---
  // Main chassis box
  box(root, 0, 0.35, 0, 0.65, 0.25, 0.88, materials.chassis);
  // Upper equipment deck
  box(root, 0, 0.50, -0.05, 0.52, 0.08, 0.60, materials.steel);
  // Front & rear rubber bumpers
  box(root, 0, 0.28, -0.47, 0.72, 0.12, 0.08, materials.bumper);
  box(root, 0, 0.28, 0.47, 0.72, 0.12, 0.08, materials.bumper);

  // Four drive wheels
  const wheels = [];
  for (const wx of [-0.38, 0.38]) {
    for (const wz of [-0.28, 0.28]) {
      const wGroup = new T.Group();
      wGroup.position.set(wx, 0.22, wz);
      root.add(wGroup);

      // Rubber tire
      const tire = cylinder(wGroup, 0, 0, 0, 0.22, 0.22, 0.15, materials.tire, Math.PI / 2);
      // Steel hub
      cylinder(wGroup, 0, 0, 0, 0.12, 0.12, 0.16, materials.steel, Math.PI / 2);
      // Tire treads
      for (let i = 0; i < 8; i++) {
        const ang = (i * Math.PI) / 4;
        box(wGroup, 0, Math.cos(ang) * 0.21, Math.sin(ang) * 0.21, 0.16, 0.025, 0.04, materials.tire);
      }
      wheels.push(wGroup);
    }
  }

  // Headlights (forward facing: negative Z is forward)
  for (const lx of [-0.24, 0.24]) {
    cylinder(root, lx, 0.42, -0.45, 0.05, 0.05, 0.04, materials.steel, Math.PI / 2);
    box(root, lx, 0.42, -0.475, 0.08, 0.08, 0.01, materials.headlightGlow);
  }

  // 2D LiDAR scanner housing
  const lidarHousing = cylinder(root, 0, 0.58, -0.28, 0.12, 0.12, 0.08, materials.chassis);
  const lidarRotor = cylinder(root, 0, 0.64, -0.28, 0.10, 0.10, 0.06, materials.steel);
  box(root, 0, 0.64, -0.34, 0.04, 0.03, 0.03, materials.headlightGlow); // Optical window

  // Mast & Pan/Tilt Camera Head
  const mastBase = cylinder(root, 0, 0.82, 0.08, 0.035, 0.035, 0.55, materials.steel);
  const cameraHead = new T.Group();
  cameraHead.position.set(0, 1.15, 0.08); // Camera pivot height
  root.add(cameraHead);

  // Camera enclosure (offset back from lens so lens is at the forefront)
  box(cameraHead, 0, 0, 0.06, 0.22, 0.14, 0.16, materials.chassis);
  // Camera lens cylinder (pointing forward along -Z)
  const lensMesh = cylinder(cameraHead, 0, 0, -0.06, 0.05, 0.05, 0.08, materials.lens, Math.PI / 2);

  // Strobe beacon & E-stop switch on rear deck
  const warningBeacon = cylinder(root, -0.18, 0.58, 0.25, 0.04, 0.04, 0.08, materials.yellow);
  cylinder(root, 0.18, 0.58, 0.25, 0.045, 0.045, 0.06, materials.red);

  // Route visualisation line
  const routeLineMat = new T.LineBasicMaterial({ color: 0x48bb78, linewidth: 2, transparent: true, opacity: 0.75 });
  let routeLine = null;

  // State
  let state = 'Docked'; // 'Docked' | 'En Route' | 'Inspecting' | 'Paused' | 'Emergency Stop' | 'Complete'
  let stationIndex = 0;
  let activePath = [];
  let isMoving = false;
  let isPaused = false;
  let isEstop = false;
  let dwellTimer = 0;
  let inspectionPending = false;
  let alertActive = false;
  let beaconTime = 0;
  let panAngle = 0;
  let tiltAngle = 0;
  let driveSpeed = 0;
  let speedMultiplier = 1.0;

  const lidarRays = new Float32Array(24);
  const routeLog = [];

  function drawPlannedRoute() {
    if (routeLine) {
      scene.remove(routeLine);
      routeLine.geometry.dispose();
      routeLine = null;
    }
    if (!activePath.length) return;

    const points = [
      new T.Vector3(root.position.x, 0.06, root.position.z),
      ...activePath.map(p => new T.Vector3(p[0], 0.06, p[1]))
    ];
    routeLine = new T.Line(new T.BufferGeometry().setFromPoints(points), routeLineMat);
    scene.add(routeLine);
  }

  function setGoal(goalPos) {
    const planned = planPath([root.position.x, root.position.z], goalPos, 0.42);
    if (!planned) {
      activePath = [];
      drawPlannedRoute();
      return false;
    }
    activePath = planned;
    drawPlannedRoute();
    return true;
  }

  return {
    root,
    cameraHead,
    get state() { return state; },
    get stationIndex() { return stationIndex; },
    get isPaused() { return isPaused; },
    get isEstop() { return isEstop; },
    get speedMultiplier() { return speedMultiplier; },
    set speedMultiplier(val) { speedMultiplier = val; },
    get lidarRays() { return lidarRays; },
    get routeLog() { return routeLog; },
    setAlert(active) {
      alertActive = active;
      warningBeacon.material = active ? materials.red : materials.yellow;
      warningBeacon.scale.setScalar(active ? 1.8 : 1);
    },

    startAutomaticInspection() {
      if (isEstop) return false;
      stationIndex = 0;
      this.setAlert(false);
      routeLog.length = 0;
      isPaused = false;
      dwellTimer = 0;
      panAngle = 0;
      tiltAngle = 0;

      const firstStation = INSPECTION_STATIONS[0];
      const ok = setGoal(firstStation.position);
      if (ok) {
        state = 'En Route';
        isMoving = true;
        return true;
      } else {
        state = 'Route Blocked';
        return false;
      }
    },

    pause() {
      isPaused = !isPaused;
      if (isPaused) {
        state = 'Paused';
      } else {
        state = activePath.length ? 'En Route' : 'Inspecting';
      }
    },

    emergencyStop() {
      isEstop = true;
      isMoving = false;
      driveSpeed = 0;
      state = 'Emergency Stop';
    },

    resumeControls() {
      isEstop = false;
      isPaused = false;
      state = activePath.length ? 'En Route' : 'Idle';
    },

    resetToDock() {
      isMoving = false;
      isPaused = false;
      isEstop = false;
      activePath = [];
      drawPlannedRoute();
      root.position.set(0.0, 0, 7.8);
      root.rotation.y = 0;
      cameraHead.rotation.set(0, 0, 0);
      stationIndex = 0;
      this.setAlert(false);
      dwellTimer = 0;
      state = 'Docked';
    },

    manualDrive(throttle, turn, dt) {
      if (isEstop || isPaused) return;
      state = 'Manual Driving';
      activePath = [];
      drawPlannedRoute();

      // Differential turn
      root.rotation.y += turn * dt * 1.8;
      wheels.forEach(w => {
        w.rotation.x += Math.sign(w.position.x) * turn * dt * 2.5;
      });

      // Forward/reverse displacement
      const dist = throttle * dt * 1.4;
      const nx = root.position.x - Math.sin(root.rotation.y) * dist; // Note: -Z is forward
      const nz = root.position.z - Math.cos(root.rotation.y) * dist;

      if (isFree(nx, nz, 0.44)) {
        root.position.x = nx;
        root.position.z = nz;
        wheels.forEach(w => { w.rotation.x -= dist / 0.22; });
        driveSpeed = Math.abs(dist / dt);
      } else {
        driveSpeed = 0;
      }
    },

    aimCamera(pan, tilt) {
      panAngle = T.MathUtils.clamp(pan, -Math.PI * 0.8, Math.PI * 0.8);
      tiltAngle = T.MathUtils.clamp(tilt, -Math.PI * 0.25, Math.PI * 0.35);
      cameraHead.rotation.y = panAngle;
      cameraHead.rotation.x = tiltAngle;
    },

    update(dt) {
      beaconTime += dt;
      if (alertActive) warningBeacon.visible = Math.sin(beaconTime * 9) > -0.1;
      else warningBeacon.visible = true;
      // Rotate 2D LiDAR scanner
      lidarRotor.rotation.y += dt * 18.0;

      // Sample 24 LiDAR beams around robot
      for (let i = 0; i < 24; i++) {
        const ang = root.rotation.y + (i * Math.PI) / 12;
        lidarRays[i] = getLidarRange(root.position.x, root.position.z, ang, 10.0);
      }

      if (isPaused || isEstop) return;

      if (isMoving && activePath.length > 0) {
        const step = dt * speedMultiplier * 1.6;
        const target = activePath[0];
        const dx = target[0] - root.position.x;
        const dz = target[1] - root.position.z;
        const dist = Math.hypot(dx, dz);

        // Desired heading (facing target: in Three.js coords where forward is -Z)
        const desiredHeading = Math.atan2(-dx, -dz);
        const headingDiff = Math.atan2(
          Math.sin(desiredHeading - root.rotation.y),
          Math.cos(desiredHeading - root.rotation.y)
        );

        // Smooth steering
        root.rotation.y += T.MathUtils.clamp(headingDiff, -step * 2.5, step * 2.5);

        // Move forward if roughly aligned
        if (Math.abs(headingDiff) < 0.45) {
          const moveDist = Math.min(dist, step);
          const nx = root.position.x - Math.sin(root.rotation.y) * moveDist;
          const nz = root.position.z - Math.cos(root.rotation.y) * moveDist;

          if (isFree(nx, nz, 0.42)) {
            root.position.x = nx;
            root.position.z = nz;
            wheels.forEach(w => { w.rotation.x -= moveDist / 0.22; });
            driveSpeed = moveDist / dt;
          } else {
            driveSpeed = 0;
          }

          if (dist < 0.12) {
            activePath.shift();
            drawPlannedRoute();
          }
        }
      } else if (isMoving && activePath.length === 0) {
        // Arrived at current station stop!
        isMoving = false;
        driveSpeed = 0;
        state = 'Station Dwell / Observing';
        dwellTimer = 4.0 / speedMultiplier; // 4 seconds at the normal inspection speed

        const currentStation = INSPECTION_STATIONS[stationIndex];

        // Aim camera toward target equipment
        if (currentStation.lookAt) {
          const dx = currentStation.lookAt[0] - root.position.x;
          const dz = currentStation.lookAt[2] - root.position.z;
          const dy = currentStation.lookAt[1] - 1.15;
          const targetHeading = Math.atan2(-dx, -dz);
          const relPan = targetHeading - root.rotation.y;
          const relTilt = Math.atan2(dy, Math.hypot(dx, dz));
          this.aimCamera(relPan, -relTilt);
        }

        // Trigger station inspection callback (captures frame, checks telemetry, triggers Meta analysis)
        if (onStationStop) {
          inspectionPending = true;
          Promise.resolve(onStationStop(currentStation, stationIndex))
            .catch(error => console.warn('Station inspection failed', error))
            .finally(() => { inspectionPending = false; });
        }
      } else if (!isMoving && state === 'Station Dwell / Observing') {
        dwellTimer = Math.max(0, dwellTimer - dt);
        if (dwellTimer <= 0 && !inspectionPending) {
          // Advance to next station
          stationIndex++;
          if (stationIndex < INSPECTION_STATIONS.length) {
            const nextStation = INSPECTION_STATIONS[stationIndex];
            const ok = setGoal(nextStation.position);
            if (ok) {
              state = 'En Route';
              isMoving = true;
              panAngle = 0;
              tiltAngle = 0;
              cameraHead.rotation.set(0, 0, 0);
            } else {
              state = 'Route Blocked';
            }
          } else {
            state = 'Inspection Complete';
          }
        }
      }
    },

    getTelemetry() {
      return {
        state,
        position: [+root.position.x.toFixed(2), +root.position.z.toFixed(2)],
        heading: Math.round(((T.MathUtils.radToDeg(-root.rotation.y) % 360) + 360) % 360),
        stationIndex,
        totalStations: INSPECTION_STATIONS.length,
        currentStation: INSPECTION_STATIONS[Math.min(stationIndex, INSPECTION_STATIONS.length - 1)],
        speed: +driveSpeed.toFixed(2),
        frontRange: lidarRays[0]
      };
    }
  };
}
