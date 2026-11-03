// PlantScout - Enclosed Industrial Basement Environment
// Dimensions: 32m long (X: -16 to +16), 20m wide (Z: -10 to +10), 7.5m clear height (Y: 0 to 7.5).
// Central inspection aisle around Z = 0, ~3.4m wide. Floor Y = 0.

export function buildBasementEnvironment(T, scene) {
  const materials = {
    floor: new T.MeshStandardMaterial({ color: 0x828587, roughness: 0.58, metalness: 0.12 }),
    curb: new T.MeshStandardMaterial({ color: 0x5a5e61, roughness: 0.72, metalness: 0.08 }),
    wall: new T.MeshStandardMaterial({ color: 0x484b4d, roughness: 0.85, metalness: 0.05 }),
    ceiling: new T.MeshStandardMaterial({ color: 0x3d4042, roughness: 0.90, metalness: 0.05 }),
    steel: new T.MeshStandardMaterial({ color: 0x7a838a, roughness: 0.45, metalness: 0.75 }),
    steelDark: new T.MeshStandardMaterial({ color: 0x2b3136, roughness: 0.60, metalness: 0.55 }),
    galvanized: new T.MeshStandardMaterial({ color: 0x9ba2a6, roughness: 0.40, metalness: 0.65 }),
    aisleStripe: new T.MeshStandardMaterial({ color: 0x9c8845, roughness: 0.65 }), // Restrained industrial yellow
    lampGlow: new T.MeshBasicMaterial({ color: 0xf5eedc, toneMapped: false })
  };

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

  // West Wall (X = -16.0m)
  box(-16.1, 3.75, 0, 0.2, 7.5, 20.2, materials.wall);

  // East Wall (X = +16.0m)
  box(16.1, 3.75, 0, 0.2, 7.5, 20.2, materials.wall);

  // --- 2. Concrete Equipment Plinths & Secondary Containment ---
  // North equipment plinth (X: -14 to +14, Z: -5.0, depth 3.6m, height 0.18m)
  box(0, 0.09, -5.0, 28.0, 0.18, 3.8, materials.curb);

  // Southwest utility plinth (X: -11.0, Z: 5.5, width 8.0, depth 2.6, height 0.15)
  box(-9.5, 0.075, 5.5, 9.5, 0.15, 2.8, materials.curb);

  // Southeast electrical enclosure curb (X: 6.0, Z: 6.5, width 7.0, depth 2.2, height 0.12)
  box(6.0, 0.06, 6.5, 7.0, 0.12, 2.4, materials.curb);

  // --- 3. Central Inspection Aisle Markings ---
  // Central aisle: 3.4m wide (between Z = -1.7 and Z = +1.7)
  // Subtle demarcation lines along the floor
  box(0, 0.005, -1.7, 28.0, 0.01, 0.1, materials.aisleStripe);
  box(0, 0.005, 1.7, 28.0, 0.01, 0.1, materials.aisleStripe);

  // Access cross-aisle markings from south entrance (X: 0, Z: 1.7 to 9.5)
  box(-1.7, 0.005, 5.6, 0.1, 0.01, 7.8, materials.aisleStripe);
  box(1.7, 0.005, 5.6, 0.1, 0.01, 7.8, materials.aisleStripe);

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
      const light = new T.PointLight(0xf4f0e6, 45, 14, 1.8);
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
