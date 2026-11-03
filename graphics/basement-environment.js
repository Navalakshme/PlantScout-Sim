// PlantScout - Enclosed Industrial Basement Environment
import { galleryZ } from '../data/layout.js';
// Dimensions: 32m long (X: -16 to +16), 20m wide (Z: -10 to +10), 7.5m clear height (Y: 0 to 7.5).
// Central inspection aisle around Z = 0, ~3.4m wide. Floor Y = 0.

export function buildBasementEnvironment(T, scene) {
  function concreteTexture(base, seed) {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 256;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, 256, 256);
    let state = seed;
    const random = () => { state = (1664525 * state + 1013904223) >>> 0; return state / 4294967296; };
    for (let i = 0; i < 9000; i++) {
      const light = random() > 0.47;
      ctx.fillStyle = light ? `rgba(226,230,229,${(random() * 0.045).toFixed(3)})` : `rgba(10,18,22,${(random() * 0.055).toFixed(3)})`;
      const size = 0.4 + random() * 2.2;
      ctx.fillRect(random() * 256, random() * 256, size, size);
    }
    const texture = new T.CanvasTexture(canvas);
    texture.wrapS = texture.wrapT = T.RepeatWrapping;
    texture.repeat.set(8, 5);
    texture.colorSpace = T.SRGBColorSpace;
    texture.anisotropy = 4;
    return texture;
  }
  const floorTexture = concreteTexture('#747a7c', 1729);
  const wallTexture = concreteTexture('#666b6c', 3811);
  const materials = {
    floor: new T.MeshStandardMaterial({ map: floorTexture, color: 0xb8babb, roughness: 0.70, metalness: 0.02 }),
    curb: new T.MeshStandardMaterial({ color: 0x5a5e61, roughness: 0.72, metalness: 0.08 }),
    wall: new T.MeshStandardMaterial({ map: wallTexture, color: 0x9b9d9e, roughness: 0.88, metalness: 0.02 }),
    ceiling: new T.MeshStandardMaterial({ color: 0x3d4042, roughness: 0.90, metalness: 0.05 }),
    steel: new T.MeshStandardMaterial({ color: 0x7a838a, roughness: 0.45, metalness: 0.75 }),
    steelDark: new T.MeshStandardMaterial({ color: 0x2b3136, roughness: 0.60, metalness: 0.55 }),
    galvanized: new T.MeshStandardMaterial({ color: 0x9ba2a6, roughness: 0.40, metalness: 0.65 }),
    aisleStripe: new T.MeshStandardMaterial({ color: 0x9c8845, roughness: 0.65 }), // Restrained industrial yellow
    lampGlow: new T.MeshBasicMaterial({ color: 0xf5eedc, toneMapped: false })
  };
  const drainMat = new T.MeshStandardMaterial({ color: 0x282e31, metalness: 0.65, roughness: 0.62 });

  const group = new T.Group();
  group.name = 'BASEMENT_SHELL';

  function box(x, y, z, w, h, d, mat = materials.steel) {
    const m = new T.Mesh(new T.BoxGeometry(w, h, d), mat);
    m.position.set(x, y, z);
    m.castShadow = true;
    m.receiveShadow = true;
    group.add(m);
    return m;
  }

  function pipe(a, b, r, mat = materials.steel) {
    const av = new T.Vector3(...a), bv = new T.Vector3(...b), v = bv.clone().sub(av);
    const m = new T.Mesh(new T.CylinderGeometry(r, r, v.length(), 16), mat);
    m.position.copy(av.add(bv).multiplyScalar(0.5));
    m.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), v.normalize());
    m.castShadow = true;
    m.receiveShadow = true;
    group.add(m);
    return m;
  }

  // --- 1. Floor, Ceiling, and Perimeter Walls ---
  // Main floor: 32m x 20m, Y = 0 (thickness 0.4m, top at 0)
  const floorMesh = box(0, -0.2, 0, 32.2, 0.4, 20.2, materials.floor);
  floorMesh.name = 'MAIN_FLOOR';

  // Ceiling: 32m x 20m, Y = 7.5m
  box(0, 7.6, 0, 32.2, 0.2, 20.2, materials.ceiling);

  // North Wall (Z = -10.0m)
  box(0, 3.75, -10.1, 32.2, 7.5, 0.2, materials.wall);

  // South Wall (Z = +10.0m) with doorway cutout around X = 0
  box(-9.0, 3.75, 10.1, 14.0, 7.5, 0.2, materials.wall);
  box(9.0, 3.75, 10.1, 14.0, 7.5, 0.2, materials.wall);
  box(0, 5.75, 10.1, 4.0, 3.5, 0.2, materials.wall); // Above doorway
  box(-1.5, 1.3, 10.1, 1.0, 2.6, 0.2, materials.wall);
  box(1.5, 1.3, 10.1, 1.0, 2.6, 0.2, materials.wall);

  // Short, enclosed access vestibule outside the sealed hall door.
  box(0, -0.12, 11.25, 4.2, 0.24, 2.7, materials.floor);
  box(-2.05, 1.55, 11.25, 0.22, 3.1, 2.7, materials.wall);
  box(2.05, 1.55, 11.25, 0.22, 3.1, 2.7, materials.wall);
  box(0, 3.12, 11.25, 4.2, 0.18, 2.7, materials.ceiling);
  box(-1.97, 1.45, 10.2, 0.10, 2.9, 0.12, materials.galvanized);
  box(1.97, 1.45, 10.2, 0.10, 2.9, 0.12, materials.galvanized);
  box(1.45, 1.25, 10.35, 0.34, 0.42, 0.12, materials.steelDark);
  box(1.45, 1.30, 10.43, 0.22, 0.08, 0.03, materials.lampGlow);

  // West Wall (X = -16.0m)
  box(-16.1, 3.75, 0, 0.2, 7.5, 20.2, materials.wall);

  // East Wall (X = +16.0m)
  box(16.1, 3.75, 0, 0.2, 7.5, 20.2, materials.wall);

  // --- 2. Concrete Equipment Plinths & Secondary Containment ---
  // North equipment plinth (X: -14 to +14, Z: -5.0, depth 3.6m, height 0.18m)
  box(0, 0.09, galleryZ(-5.0), 28.0, 0.18, 3.8, materials.curb);

  // Southwest utility plinth (X: -11.0, Z: 5.5, width 8.0, depth 2.6, height 0.15)
  box(-9.5, 0.075, galleryZ(5.5), 9.5, 0.15, 2.8, materials.curb);

  // Southeast electrical enclosure curb (X: 6.0, Z: 6.5, width 7.0, depth 2.2, height 0.12)
  box(6.0, 0.06, galleryZ(6.5), 7.0, 0.12, 2.4, materials.curb);

  // --- 3. Central Inspection Aisle Markings ---
  // Central aisle: 3.4m wide (between Z = -1.7 and Z = +1.7)
  // Subtle demarcation lines along the floor
  box(0, 0.005, -1.1, 28.0, 0.01, 0.1, materials.aisleStripe);
  box(0, 0.005, 1.1, 28.0, 0.01, 0.1, materials.aisleStripe);

  // Access cross-aisle markings from south entrance (X: 0, Z: 1.7 to 9.5)
  box(-1.7, 0.005, 5.6, 0.1, 0.01, 7.8, materials.aisleStripe);
  box(1.7, 0.005, 5.6, 0.1, 0.01, 7.8, materials.aisleStripe);

  // Grated contained drains beside the equipment plinth; the walking aisle stays clear.
  for (const z of [-2.55, 3.05]) {
    box(0, 0.008, z, 27.8, 0.012, 0.32, drainMat);
    for (let x = -13.7; x < 13.8; x += 0.34) {
      box(x, 0.018, z, 0.045, 0.01, 0.30, materials.galvanized);
    }
  }

  // Robot Dock markings at X = 0, Z = 8.0 (yellow border box)
  box(0, 0.006, 8.0, 1.6, 0.005, 1.6, materials.aisleStripe);

  // --- 4. Structural Columns & Roof Trusses ---
  for (const x of [-10, -5, 0, 5, 10]) {
    // Perimeter support columns along North & South lines
    box(x, 3.75, -9.8, 0.5, 7.5, 0.4, materials.wall);
    box(x, 3.75, 9.8, 0.5, 7.5, 0.4, materials.wall);

    // Overhead structural I-beams at Y = 7.1m
    box(x, 7.1, 0, 0.35, 0.45, 19.8, materials.steelDark);
  }

  // --- 5. Overhead Cable Trays & Ventilation Ducts ---
  // Main ventilation duct running East-West at Y = 6.4m, Z = -3.0
  box(0, 6.4, -3.0, 30.0, 0.55, 0.75, materials.galvanized);
  for (let x = -12; x <= 12; x += 4) {
    // Extract grilles along main duct
    box(x, 6.1, -3.0, 0.6, 0.05, 0.6, materials.steelDark);
  }

  // Main electrical cable tray running East-West at Y = 5.8m, Z = 3.0
  box(0, 5.8, 3.0, 28.0, 0.12, 0.65, materials.galvanized);

  // --- 6. Neutral Industrial Lighting & Fixtures ---
  // 3 rows of suspended fluorescent/LED industrial luminaires
  for (const z of [-5.5, 0.0, 5.5]) {
    for (const x of [-12, -6, 0, 6, 12]) {
      // Light housing
      box(x, 6.8, z, 2.4, 0.15, 0.35, materials.steelDark);
      box(x, 6.7, z, 2.2, 0.05, 0.25, materials.lampGlow);

      // Light source
      const light = new T.PointLight(0xf4f0e6, 7.5, 12, 2);
      light.position.set(x, 6.5, z);
      light.castShadow = (Math.abs(x) <= 6 && z === 0); // Shadow on central aisle lights only to preserve performance
      group.add(light);
    }
  }

  // --- 7. Labelled External Service Boundary Panels ---
  function makeWallSign(text, x, y, z, rotY = 0) {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#1c2226';
    ctx.fillRect(0, 0, 512, 128);
    ctx.strokeStyle = '#3d5261';
    ctx.lineWidth = 6;
    ctx.strokeRect(4, 4, 504, 120);
    ctx.fillStyle = '#dce4e8';
    ctx.font = 'bold 28px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(text, 256, 72);

    const texture = new T.CanvasTexture(canvas);
    texture.colorSpace = T.SRGBColorSpace;
    const signMesh = new T.Mesh(new T.PlaneGeometry(1.6, 0.4), new T.MeshBasicMaterial({ map: texture }));
    signMesh.position.set(x, y, z);
    signMesh.rotation.y = rotY;
    group.add(signMesh);
  }

  // West Wall Boundaries
  box(-15.9, 1.5, -4.5, 0.1, 1.2, 1.6, materials.steelDark);
  makeWallSign('EXT-SOLVENT / BULK XYLENE', -15.82, 2.3, -4.5, Math.PI / 2);

  box(-15.9, 1.8, 3.0, 0.1, 1.4, 1.6, materials.steelDark);
  makeWallSign('EXT-THERMAL / OIL HEATER', -15.82, 2.7, 3.0, Math.PI / 2);

  box(-15.9, 1.5, 6.0, 0.1, 1.2, 1.6, materials.steelDark);
  makeWallSign('EXT-COOLING / TOWER LOOP', -15.82, 2.3, 6.0, Math.PI / 2);

  // East Wall Boundaries
  box(15.9, 3.5, 6.0, 0.1, 1.2, 1.6, materials.steelDark);
  makeWallSign('EXT-VAPOUR / VOC OXIDISER', 15.82, 4.3, 6.0, -Math.PI / 2);

  box(15.9, 1.0, 4.5, 0.1, 1.2, 1.6, materials.steelDark);
  makeWallSign('EXT-WASTE / EFFLUENT TRMT', 15.82, 1.8, 4.5, -Math.PI / 2);

  scene.add(group);
  return group;
}
