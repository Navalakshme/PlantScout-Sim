// PlantScout - Equipment 3D Models
// Procedural meshes for all 37 assemblies with accurate geometry, ports, and sub-instruments.

import { EQUIPMENT_REGISTER } from '../data/equipment.js';

export function buildEquipmentModels(T, scene) {
  const materials = {
    stainless: new T.MeshStandardMaterial({ color: 0xccd4db, roughness: 0.28, metalness: 0.92 }),
    stainlessBrushed: new T.MeshStandardMaterial({ color: 0x9ba6b0, roughness: 0.42, metalness: 0.85 }),
    steelDark: new T.MeshStandardMaterial({ color: 0x2e353b, roughness: 0.65, metalness: 0.55 }),
    motorBlue: new T.MeshStandardMaterial({ color: 0x284761, roughness: 0.48, metalness: 0.50 }),
    safetyYellow: new T.MeshStandardMaterial({ color: 0xb58c2a, roughness: 0.60 }),
    safetyRed: new T.MeshStandardMaterial({ color: 0x9e312b, roughness: 0.55 }),
    galvanized: new T.MeshStandardMaterial({ color: 0x8a9399, roughness: 0.45, metalness: 0.60 }),
    glass: new T.MeshStandardMaterial({ color: 0xaee1ed, transparent: true, opacity: 0.45, roughness: 0.1 }),
    whiteGauge: new T.MeshBasicMaterial({ color: 0xf5f7f7 }),
    screenGlow: new T.MeshBasicMaterial({ color: 0x48bb78 }),
    drumBlue: new T.MeshStandardMaterial({ color: 0x1f3b54, roughness: 0.40, metalness: 0.35 })
  };

  const equipmentMap = new Map();
  const instrumentDisplays = [];
  let displayClock = 0;
  const animatedObjects = {
    agitatorReactor: null,
    agitatorBlender: null,
    fanExtraction: null,
    pumps: []
  };

  function addMesh(geo, mat, parent, x = 0, y = 0, z = 0) {
    const m = new T.Mesh(geo, mat);
    m.position.set(x, y, z);
    m.castShadow = true;
    m.receiveShadow = true;
    parent.add(m);
    return m;
  }

  function box(parent, x, y, z, w, h, d, mat = materials.steelDark) {
    return addMesh(new T.BoxGeometry(w, h, d), mat, parent, x, y, z);
  }

  function cylinder(parent, x, y, z, rt, rb, h, mat = materials.stainless, rotZ = 0) {
    const m = addMesh(new T.CylinderGeometry(rt, rb, h, 24), mat, parent, x, y, z);
    if (rotZ) m.rotation.z = rotZ;
    return m;
  }

  function gauge(parent, x, y, z, rotY = 0) {
    const stem = cylinder(parent, x, y - 0.08, z, 0.015, 0.015, 0.16, materials.steelDark);
    const dial = cylinder(parent, x, y, z + 0.02, 0.09, 0.09, 0.04, materials.steelDark, Math.PI / 2);
    dial.rotation.y = rotY;
    const face = addMesh(new T.CircleGeometry(0.08, 16), materials.whiteGauge, parent, x, y, z + 0.042);
    face.rotation.y = rotY;
    const needle = box(parent, x, y + 0.02, z + 0.045, 0.008, 0.06, 0.005, materials.safetyRed);
    needle.rotation.z = -0.4;
  }

  function pumpAssembly(parent, x, y, z, id, label) {
    // Base plinth
    box(parent, x, y + 0.1, z, 1.1, 0.2, 0.65, materials.steelDark);
    // Motor
    const motor = cylinder(parent, x - 0.28, y + 0.42, z, 0.18, 0.18, 0.45, materials.motorBlue, Math.PI / 2);
    // Motor terminal box
    box(parent, x - 0.28, y + 0.64, z, 0.14, 0.12, 0.16, materials.steelDark);
    // Coupling guard
    cylinder(parent, x + 0.05, y + 0.42, z, 0.15, 0.15, 0.18, materials.safetyYellow, Math.PI / 2);
    // Pump Volute casing
    const volute = addMesh(new T.SphereGeometry(0.22, 20, 16), materials.stainlessBrushed, parent, x + 0.26, y + 0.42, z);
    volute.scale.set(0.65, 1.0, 1.0);
    // Suction flange (horizontal)
    cylinder(parent, x + 0.26, y + 0.42, z - 0.22, 0.065, 0.065, 0.15, materials.stainless, Math.PI / 2);
    // Discharge flange (vertical)
    cylinder(parent, x + 0.26, y + 0.68, z, 0.055, 0.055, 0.28, materials.stainless);
    // Local pressure gauge
    gauge(parent, x + 0.26, y + 0.95, z);

    animatedObjects.pumps.push({ id, mesh: motor });
  }

  function addInstrumentDisplay(root, spec) {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 224;
    const texture = new T.CanvasTexture(canvas);
    texture.colorSpace = T.SRGBColorSpace;
    const panel = new T.Mesh(
      new T.PlaneGeometry(1.38, 0.60),
      new T.MeshBasicMaterial({ map: texture, side: T.FrontSide, toneMapped: false })
    );
    const northBank = spec.position[2] < 0;
    panel.position.set(0, Math.min(spec.dimensions[1] + 0.38, 3.35),
      (northBank ? 1 : -1) * (spec.dimensions[2] / 2 + 0.18));
    if (!northBank) panel.rotation.y = Math.PI;
    root.add(panel);
    instrumentDisplays.push({ spec, canvas, texture, panel });
  }

  function updateInstrumentDisplay(display, snap) {
    const { spec, canvas, texture } = display;
    const context = canvas.getContext('2d');
    const sensor = spec.instruments?.find(item => item.unit === '°C');
    let value = typeof sensor?.defaultVal === 'number' ? sensor.defaultVal : 24.0;
    if (spec.id === 'R-101') value = snap.temperatures['R-101_proc'];
    if (spec.id === 'BL-301') value = snap.temperatures['BL-301_proc'];
    if (spec.id === 'P-301') value = snap.temperatures['P-301_brg'];
    const alarm = sensor && Number.isFinite(sensor.alarmMax) && value >= sensor.alarmMax;
    context.fillStyle = '#111a20';
    context.fillRect(0, 0, 512, 224);
    context.strokeStyle = alarm ? '#e35f55' : '#718c99';
    context.lineWidth = 8;
    context.strokeRect(4, 4, 504, 216);
    context.fillStyle = '#e9f2f3';
    context.font = 'bold 42px monospace';
    context.fillText(spec.id, 25, 58);
    context.fillStyle = '#9fb2bc';
    context.font = '22px sans-serif';
    context.fillText(spec.name.slice(0, 29), 25, 91);
    context.fillStyle = alarm ? '#ff7167' : '#77dbc4';
    context.font = 'bold 60px monospace';
    context.fillText(`${Number(value).toFixed(1)}°C`, 25, 166);
    context.fillStyle = '#8fa5b1';
    context.font = '18px sans-serif';
    context.fillText(sensor ? sensor.name.toUpperCase() : 'SIMULATED SURFACE TEMP', 25, 197);
    texture.needsUpdate = true;
  }

  // --- Build Every Equipment Assembly ---
  EQUIPMENT_REGISTER.forEach(spec => {
    const root = new T.Group();
    root.name = spec.id;
    root.position.set(spec.position[0], spec.position[1], spec.position[2]);
    root.userData = { spec };

    switch (spec.id) {
      // 1. Feed Vessels TK-101 & TK-102
      case 'TK-101':
      case 'TK-102': {
        // Legs & containment base
        for (const dx of [-0.45, 0.45]) {
          for (const dz of [-0.45, 0.45]) {
            cylinder(root, dx, 0.4, dz, 0.04, 0.04, 0.8, materials.steelDark);
          }
        }
        // Tank shell
        cylinder(root, 0, 1.5, 0, 0.55, 0.55, 1.6, materials.stainless);
        // Dished heads
        const topCap = addMesh(new T.SphereGeometry(0.55, 24, 12), materials.stainless, root, 0, 2.3, 0);
        topCap.scale.y = 0.35;
        const btmCap = addMesh(new T.SphereGeometry(0.55, 24, 12), materials.stainless, root, 0, 0.7, 0);
        btmCap.scale.y = 0.35;
        // Level sight glass
        cylinder(root, 0.56, 1.5, 0, 0.02, 0.02, 1.2, materials.glass);
        gauge(root, 0, 2.65, 0.3);
        break;
      }

      // 2. Solids Hopper H-101
      case 'H-101': {
        // Support frame
        box(root, 0, 0.6, 0, 1.1, 1.2, 1.1, materials.steelDark);
        // Conical hopper
        const cone = addMesh(new T.ConeGeometry(0.5, 0.8, 16), materials.stainlessBrushed, root, 0, 1.4, 0);
        cone.rotation.x = Math.PI;
        cylinder(root, 0, 2.0, 0, 0.5, 0.5, 0.6, materials.stainless);
        box(root, 0, 2.35, 0, 0.7, 0.1, 0.7, materials.stainlessBrushed);
        // Chute
        cylinder(root, 0.3, 2.6, 0.15, 0.1, 0.1, 0.8, materials.stainlessBrushed, -0.6);
        break;
      }

      // 3. Minor Additions AD-101
      case 'AD-101': {
        cylinder(root, 0, 0.8, 0, 0.03, 0.03, 0.6, materials.steelDark);
        cylinder(root, 0, 1.4, 0, 0.22, 0.22, 0.7, materials.stainless);
        cylinder(root, 0.23, 1.4, 0, 0.015, 0.015, 0.5, materials.glass);
        break;
      }

      // 4. Feed & Supply Pumps P-101, P-102, P-103
      case 'P-101':
      case 'P-102':
      case 'P-103': {
        pumpAssembly(root, 0, 0, 0, spec.id, spec.name);
        break;
      }

      // 5. Jacketed Reactor R-101
      case 'R-101': {
        // Concrete plinth & steel saddles/legs
        for (const dx of [-0.95, 0.95]) {
          for (const dz of [-0.95, 0.95]) {
            cylinder(root, dx, 0.5, dz, 0.08, 0.08, 1.0, materials.steelDark);
          }
        }
        // Reactor Vessel Shell (Stainless 316)
        cylinder(root, 0, 2.3, 0, 1.15, 1.15, 2.6, materials.stainless);
        // Outer Thermal Jacket (insulated with jacket bands)
        cylinder(root, 0, 2.0, 0, 1.25, 1.25, 2.1, materials.stainlessBrushed);
        // Dished heads
        const topDome = addMesh(new T.SphereGeometry(1.15, 32, 16), materials.stainless, root, 0, 3.6, 0);
        topDome.scale.y = 0.45;
        const btmDome = addMesh(new T.SphereGeometry(1.15, 32, 16), materials.stainless, root, 0, 1.0, 0);
        btmDome.scale.y = 0.45;
        // Thermal jacket ports
        cylinder(root, -0.9, 1.2, -0.2, 0.08, 0.08, 0.35, materials.steelDark, Math.PI / 2);
        cylinder(root, 0.9, 2.6, -0.2, 0.08, 0.08, 0.35, materials.steelDark, Math.PI / 2);
        // Sight glasses
        cylinder(root, 0, 2.8, 1.16, 0.12, 0.12, 0.08, materials.stainless, Math.PI / 2);
        addMesh(new T.CircleGeometry(0.1, 16), materials.glass, root, 0, 2.8, 1.21);
        // Relief assembly connection
        cylinder(root, 0, 4.3, -0.2, 0.065, 0.065, 0.7, materials.stainless);
        gauge(root, -0.4, 4.5, 0.4);
        break;
      }

      // 6. Reactor Agitator AG-101
      case 'AG-101': {
        // Gearbox housing
        box(root, 0, 0.25, 0, 0.65, 0.5, 0.65, materials.steelDark);
        // Motor
        const motor = cylinder(root, 0, 0.75, 0, 0.25, 0.25, 0.55, materials.motorBlue);
        // Drive shaft entry
        cylinder(root, 0, -0.3, 0, 0.12, 0.12, 0.6, materials.stainless);
        animatedObjects.agitatorReactor = root;
        break;
      }

      // 7. Overhead Condenser E-201
      case 'E-201': {
        // Horizontal shell-and-tube body
        const shell = cylinder(root, 0, 0, 0, 0.38, 0.38, 2.2, materials.stainlessBrushed, Math.PI / 2);
        // End bonnets/channels
        cylinder(root, -1.15, 0, 0, 0.39, 0.39, 0.22, materials.motorBlue, Math.PI / 2);
        cylinder(root, 1.15, 0, 0, 0.39, 0.39, 0.22, materials.motorBlue, Math.PI / 2);
        // Flanged nozzles (process in, condensate out, CW in/out)
        cylinder(root, 0, 0.42, 0.2, 0.09, 0.09, 0.2, materials.stainless);
        cylinder(root, 0, -0.42, -0.2, 0.06, 0.06, 0.2, materials.stainless);
        cylinder(root, -0.8, 0.42, 0, 0.07, 0.07, 0.2, materials.steelDark);
        cylinder(root, 0.8, 0.42, 0, 0.07, 0.07, 0.2, materials.steelDark);
        // Support saddles
        box(root, -0.7, -0.45, 0, 0.15, 0.5, 0.6, materials.steelDark);
        box(root, 0.7, -0.45, 0, 0.15, 0.5, 0.6, materials.steelDark);
        break;
      }

      // 8. Condensate Phase Separator V-201
      case 'V-201': {
        // Horizontal decanter vessel
        cylinder(root, 0, 0, 0, 0.35, 0.35, 1.4, materials.stainless, Math.PI / 2);
        // End caps
        const cap1 = addMesh(new T.SphereGeometry(0.35, 20, 12), materials.stainless, root, -0.7, 0, 0);
        cap1.scale.x = 0.4;
        const cap2 = addMesh(new T.SphereGeometry(0.35, 20, 12), materials.stainless, root, 0.7, 0, 0);
        cap2.scale.x = 0.4;
        // Sight tube for phase boundary
        box(root, 0, 0, 0.36, 0.1, 0.45, 0.05, materials.steelDark);
        box(root, 0, 0, 0.39, 0.03, 0.38, 0.02, materials.glass);
        // Separate solvent & water outlets
        cylinder(root, 0.4, 0.4, 0, 0.045, 0.045, 0.25, materials.stainless);
        cylinder(root, -0.4, -0.4, 0, 0.045, 0.045, 0.25, materials.stainless);
        break;
      }

      // 9. Reaction Water Receiver TK-201
      case 'TK-201': {
        cylinder(root, 0, 1.2, 0, 0.5, 0.5, 1.8, materials.stainlessBrushed);
        gauge(root, 0, 2.3, 0.4);
        break;
      }

      // 10. Vent Condenser E-202
      case 'E-202': {
        cylinder(root, 0, 0, 0, 0.22, 0.22, 1.2, materials.stainlessBrushed, Math.PI / 2);
        cylinder(root, -0.65, 0, 0, 0.23, 0.23, 0.15, materials.motorBlue, Math.PI / 2);
        cylinder(root, 0.65, 0, 0, 0.23, 0.23, 0.15, materials.motorBlue, Math.PI / 2);
        break;
      }

      // 11. Transfer Pump P-201
      case 'P-201': {
        pumpAssembly(root, 0, 0, 0, spec.id, spec.name);
        break;
      }

      // 12. Thinning & Blending Vessel BL-301
      case 'BL-301': {
        for (const dx of [-0.85, 0.85]) {
          for (const dz of [-0.85, 0.85]) {
            cylinder(root, dx, 0.45, dz, 0.07, 0.07, 0.9, materials.steelDark);
          }
        }
        cylinder(root, 0, 2.0, 0, 1.05, 1.05, 2.4, materials.stainless);
        cylinder(root, 0, 1.8, 0, 1.15, 1.15, 1.8, materials.stainlessBrushed); // Cooling jacket
        const topDome = addMesh(new T.SphereGeometry(1.05, 24, 12), materials.stainless, root, 0, 3.2, 0);
        topDome.scale.y = 0.4;
        break;
      }

      // 13. Blender Agitator AG-301
      case 'AG-301': {
        box(root, 0, 0.25, 0, 0.55, 0.45, 0.55, materials.steelDark);
        cylinder(root, 0, 0.7, 0, 0.22, 0.22, 0.5, materials.motorBlue);
        animatedObjects.agitatorBlender = root;
        break;
      }

      // 14. Filter Feed Pump P-301
      case 'P-301': {
        // NOTICE: Target pump for motor bearing overtemperature in Defective scenario
        pumpAssembly(root, 0, 0, 0, spec.id, spec.name);
        break;
      }

      // 15. Polishing Filter F-301
      case 'F-301': {
        // Pedestal legs
        for (const a of [0, (Math.PI * 2) / 3, (Math.PI * 4) / 3]) {
          cylinder(root, Math.cos(a) * 0.4, 0.4, Math.sin(a) * 0.4, 0.04, 0.04, 0.8, materials.steelDark);
        }
        // Filter housing body
        cylinder(root, 0, 1.3, 0, 0.42, 0.42, 1.3, materials.stainless);
        // Swing bolt clamp ring
        const ring = addMesh(new T.TorusGeometry(0.44, 0.035, 8, 24), materials.stainlessBrushed, root, 0, 1.95, 0);
        ring.rotation.x = Math.PI / 2;
        // Removable lid dome
        const lid = addMesh(new T.SphereGeometry(0.42, 24, 12), materials.stainless, root, 0, 1.95, 0);
        lid.scale.y = 0.35;
        // 8 eye-bolts around lid
        for (let i = 0; i < 8; i++) {
          const ang = (i * Math.PI) / 4;
          box(root, Math.cos(ang) * 0.45, 1.96, Math.sin(ang) * 0.45, 0.05, 0.09, 0.05, materials.steelDark);
        }
        // Inlet & Outlet pressure gauges
        gauge(root, -0.45, 1.5, 0);
        gauge(root, 0.45, 1.5, 0);
        // Differential pressure transmitter box (DPT)
        box(root, 0, 1.6, 0.45, 0.2, 0.25, 0.12, materials.motorBlue);
        break;
      }

      // 16. Finished Product Storage Tank TK-401
      case 'TK-401': {
        for (const dx of [-0.85, 0.85]) {
          for (const dz of [-0.85, 0.85]) {
            cylinder(root, dx, 0.45, dz, 0.08, 0.08, 0.9, materials.steelDark);
          }
        }
        cylinder(root, 0, 2.2, 0, 1.1, 1.1, 2.7, materials.stainless);
        const dome = addMesh(new T.SphereGeometry(1.1, 24, 12), materials.stainless, root, 0, 3.55, 0);
        dome.scale.y = 0.4;
        gauge(root, 0, 3.8, 0.5);
        break;
      }

      // 17. Product Filling Pump P-401
      case 'P-401': {
        pumpAssembly(root, 0, 0, 0, spec.id, spec.name);
        break;
      }

      // 18. Filling Station FL-401, Weighing Platform WS-401, Roller Bed CV-401
      case 'FL-401': {
        // Gantry mast
        box(root, -0.5, 1.3, 0, 0.1, 2.6, 0.1, materials.galvanized);
        box(root, 0, 2.55, 0, 1.1, 0.1, 0.1, materials.galvanized);
        // Pneumatic filling lance
        cylinder(root, 0, 1.6, 0, 0.035, 0.035, 1.4, materials.stainless);
        box(root, 0, 2.3, 0, 0.18, 0.22, 0.18, materials.safetyYellow);
        // Vapour recovery hood
        cylinder(root, 0, 1.1, 0, 0.18, 0.12, 0.2, materials.stainlessBrushed);
        break;
      }

      case 'WS-401': {
        // Low profile scale base
        box(root, 0, 0.06, 0, 1.0, 0.12, 1.0, materials.steelDark);
        // Scale terminal pillar
        cylinder(root, 0.6, 0.6, 0.4, 0.03, 0.03, 1.1, materials.galvanized);
        box(root, 0.6, 1.18, 0.4, 0.22, 0.18, 0.08, materials.steelDark);
        // Digital display
        box(root, 0.6, 1.18, 0.445, 0.18, 0.1, 0.01, materials.screenGlow);
        break;
      }

      case 'CV-401': {
        // Roller conveyor table
        box(root, 0, 0.25, -0.45, 1.6, 0.1, 0.08, materials.steelDark);
        box(root, 0, 0.25, 0.45, 1.6, 0.1, 0.08, materials.steelDark);
        for (let rx = -0.7; rx <= 0.7; rx += 0.2) {
          cylinder(root, rx, 0.28, 0, 0.035, 0.035, 0.85, materials.galvanized, Math.PI / 2);
        }
        // One packaged steel drum on roller bed
        cylinder(root, -0.3, 0.75, 0, 0.32, 0.32, 0.88, materials.drumBlue);
        break;
      }

      // 19. Cooling Water Interface P-501
      case 'P-501': {
        pumpAssembly(root, 0, 0, 0, spec.id, spec.name);
        break;
      }

      // 20. Utility Heat Exchanger HX-501
      case 'HX-501': {
        // Carbon steel fixed & movable end frames
        box(root, -0.65, 0.85, 0, 0.12, 1.6, 0.85, materials.motorBlue);
        box(root, 0.65, 0.85, 0, 0.12, 1.6, 0.85, materials.motorBlue);
        // Upper & lower carrying bars
        cylinder(root, 0, 1.6, 0, 0.04, 0.04, 1.45, materials.steelDark, Math.PI / 2);
        cylinder(root, 0, 0.15, 0, 0.04, 0.04, 1.45, materials.steelDark, Math.PI / 2);
        // Stainless plate pack
        for (let px = -0.55; px <= 0.55; px += 0.06) {
          box(root, px, 0.85, 0, 0.02, 1.4, 0.75, materials.stainless);
        }
        // Tie rods (4x)
        for (const ty of [0.4, 1.3]) {
          for (const tz of [-0.35, 0.35]) {
            cylinder(root, 0, ty, tz, 0.02, 0.02, 1.5, materials.steelDark, Math.PI / 2);
          }
        }
        break;
      }

      // 21. Thermal-Fluid Boundary TF-601
      case 'TF-601': {
        box(root, 0, 0, 0, 0.4, 1.8, 1.2, materials.steelDark);
        cylinder(root, 0.25, 0.5, 0, 0.08, 0.08, 0.4, materials.safetyRed, Math.PI / 2);
        cylinder(root, 0.25, -0.4, 0, 0.08, 0.08, 0.4, materials.safetyRed, Math.PI / 2);
        break;
      }

      // 22. Instrument Air Package AC-701 & V-701
      case 'AC-701': {
        box(root, 0, 0.7, 0, 1.8, 1.4, 1.2, materials.galvanized);
        // Acoustic louvres
        for (let ly = 0.3; ly <= 1.2; ly += 0.12) {
          box(root, -0.3, ly, 0.61, 0.7, 0.03, 0.02, materials.steelDark);
        }
        box(root, 0.5, 1.0, 0.61, 0.35, 0.4, 0.03, materials.motorBlue);
        break;
      }

      case 'V-701': {
        cylinder(root, 0, 1.3, 0, 0.48, 0.48, 1.8, materials.motorBlue);
        const topDome = addMesh(new T.SphereGeometry(0.48, 20, 12), materials.motorBlue, root, 0, 2.2, 0);
        topDome.scale.y = 0.35;
        gauge(root, 0, 2.3, 0.45);
        break;
      }

      // 23. Electrical Suite MCC-801 & PLC-801
      case 'MCC-801': {
        // 3-bay switchgear cabinet
        box(root, 0, 1.1, 0, 2.8, 2.2, 0.8, materials.galvanized);
        for (const bx of [-0.9, 0, 0.9]) {
          box(root, bx, 1.8, 0.41, 0.4, 0.3, 0.02, materials.steelDark);
          box(root, bx, 1.8, 0.425, 0.1, 0.08, 0.01, materials.screenGlow);
          box(root, bx + 0.25, 1.3, 0.41, 0.06, 0.12, 0.04, materials.safetyRed); // Isolator switch
        }
        break;
      }

      case 'PLC-801': {
        // Automation console desk & screens
        box(root, 0, 0.55, 0, 1.8, 1.1, 0.85, materials.galvanized);
        box(root, 0, 1.15, 0.15, 1.6, 0.1, 0.4, materials.steelDark);
        // 2 HMI screens
        for (const sx of [-0.4, 0.4]) {
          box(root, sx, 1.45, 0.1, 0.55, 0.38, 0.05, materials.steelDark);
          box(root, sx, 1.45, 0.13, 0.5, 0.34, 0.01, materials.screenGlow);
        }
        break;
      }

      // 24. Ventilation EX-901
      case 'EX-901': {
        // Scroll housing
        const scroll = cylinder(root, 0, 1.2, 0, 0.65, 0.65, 0.55, materials.motorBlue, Math.PI / 2);
        // Drive motor
        cylinder(root, 0.6, 1.2, 0, 0.22, 0.22, 0.45, materials.steelDark, Math.PI / 2);
        // Discharge transition duct
        box(root, -0.4, 1.9, 0, 0.45, 0.9, 0.45, materials.galvanized);
        animatedObjects.fanExtraction = scroll;
        break;
      }

      // 25. Sump S-901 & Pump P-901
      case 'S-901': {
        // Pit frame
        box(root, 0, 0.02, 0, 1.8, 0.04, 1.4, materials.steelDark);
        // Galvanized grating bars
        for (let gx = -0.8; gx <= 0.8; gx += 0.1) {
          box(root, gx, 0.02, 0, 0.02, 0.04, 1.3, materials.galvanized);
        }
        break;
      }

      case 'P-901': {
        pumpAssembly(root, 0, 0, 0, spec.id, spec.name);
        break;
      }

      // 26. Gas Detector GD-901
      case 'GD-901': {
        cylinder(root, 0, 0, 0, 0.08, 0.08, 0.22, materials.motorBlue);
        cylinder(root, 0, -0.15, 0, 0.05, 0.05, 0.12, materials.stainlessBrushed);
        break;
      }

      // 27. Emergency Isolation Station ESD-901
      case 'ESD-901': {
        box(root, 0, 0, 0, 0.35, 0.5, 0.2, materials.safetyYellow);
        cylinder(root, 0, 0.08, 0.14, 0.08, 0.08, 0.08, materials.safetyRed, Math.PI / 2);
        break;
      }

      // 28. Door Assembly DOOR-001
      case 'DOOR-001': {
        box(root, 0, 1.3, 0, 1.8, 2.6, 0.16, materials.steelDark);
        box(root, 0, 1.3, 0.09, 1.5, 2.3, 0.03, materials.galvanized);
        box(root, 0, 1.3, 0.12, 1.35, 2.1, 0.03, materials.steelDark);
        box(root, 0, 1.85, 0.16, 0.5, 0.38, 0.02, materials.glass); // Inspection window
        box(root, 0, 1.3, 0.17, 1.2, 0.08, 0.08, materials.stainless); // Push bar
        for (const h of [0.35, 1.3, 2.2]) box(root, -0.91, h, 0, 0.10, 0.18, 0.22, materials.stainless);
        box(root, 0, 2.7, 0.13, 0.9, 0.16, 0.04, materials.screenGlow); // Access indicator
        break;
      }

      // 29. Robot Dock ROBOT-001
      case 'ROBOT-001': {
        // Dock charging contacts and floor ramp
        box(root, 0, 0.02, 0, 1.2, 0.04, 1.2, materials.steelDark);
        cylinder(root, -0.3, 0.05, 0, 0.06, 0.06, 0.04, materials.stainlessBrushed);
        cylinder(root, 0.3, 0.05, 0, 0.06, 0.06, 0.04, materials.stainlessBrushed);
        break;
      }
    }

    if (spec.id !== 'DOOR-001' && spec.id !== 'ROBOT-001') addInstrumentDisplay(root, spec);
    scene.add(root);
    equipmentMap.set(spec.id, root);
  });

  return {
    equipmentMap,
    animatedObjects,
    update(dt, simEngine) {
      const snap = simEngine.getTelemetrySnapshot();
      displayClock += dt;
      if (displayClock > 0.4) {
        displayClock = 0;
        for (const display of instrumentDisplays) updateInstrumentDisplay(display, snap);
      }

      // Animate Agitators
      if (animatedObjects.agitatorReactor && snap.speeds['AG-101'] > 0) {
        animatedObjects.agitatorReactor.rotation.y += dt * (snap.speeds['AG-101'] / 60) * Math.PI * 2;
      }
      if (animatedObjects.agitatorBlender && snap.speeds['AG-301'] > 0) {
        animatedObjects.agitatorBlender.rotation.y += dt * (snap.speeds['AG-301'] / 60) * Math.PI * 2;
      }

      // Animate Room Exhaust Fan
      if (animatedObjects.fanExtraction && snap.speeds['EX-901'] > 0) {
        animatedObjects.fanExtraction.rotation.x += dt * 15.0;
      }
    }
  };
}
