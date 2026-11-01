// Process-faithful resin unit with an exposed basement pump gallery.
// The EIA process source describes the process, not a site-specific basement GA;
// this is an original, clearly simulated arrangement built around that process.
export function buildIndustry(THREE, scene) {
  const facilityLights = [];
  const processMotors = [];
  const panelStatusLights = [];
  const conveyorRollers = [];
  const ceilingPanels = new THREE.Group();
  ceilingPanels.visible = false;
  scene.add(ceilingPanels);

  const standard = (color, roughness = 0.72, metalness = 0.12, extra = {}) =>
    new THREE.MeshStandardMaterial({ color, roughness, metalness, ...extra });
  const steel = standard(0x77817e, 0.52, 0.58);
  const steelDark = standard(0x273130, 0.7, 0.44);
  const galvanized = standard(0x687471, 0.48, 0.63);
  const concrete = standard(0x414946, 0.96, 0.01);
  const concreteDark = standard(0x252d2b, 0.98, 0.01);
  const floorMat = standard(0x343b39, 0.96, 0.02);
  const bluePaint = standard(0x36565d, 0.62, 0.3);
  const greenPaint = standard(0x3d594c, 0.62, 0.26);
  const safety = standard(0xb27b32, 0.6, 0.16);
  const resinPipe = standard(0x98704e, 0.48, 0.46);
  const solventPipe = standard(0x9b9c7f, 0.48, 0.5);
  const coolingPipe = standard(0x507f83, 0.48, 0.48);
  const returnPipe = standard(0x6f927b, 0.48, 0.46);
  const warmLightMat = new THREE.MeshBasicMaterial({ color: 0xffd28a, toneMapped: false });
  const greenLightMat = new THREE.MeshBasicMaterial({ color: 0x66d79b, toneMapped: false });
  const amberLightMat = new THREE.MeshBasicMaterial({ color: 0xffb64e, toneMapped: false });
  const redLightMat = new THREE.MeshBasicMaterial({ color: 0xe45c4b, toneMapped: false });
  const faceMat = standard(0xbab9a8, 0.9, 0.01);
  const lensMat = standard(0x111717, 0.22, 0.18, { emissive: 0x16463b, emissiveIntensity: 0.38 });

  function box(parent, x, y, z, sx, sy, sz, material, cast = true, receive = true) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), material);
    mesh.position.set(x, y, z);
    mesh.castShadow = cast;
    mesh.receiveShadow = receive;
    parent.add(mesh);
    return mesh;
  }

  function cylinder(parent, x, y, z, rt, rb, h, material, segments = 24, rotation = null) {
    const mesh = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, segments), material);
    mesh.position.set(x, y, z);
    if (rotation) mesh.rotation.set(rotation.x || 0, rotation.y || 0, rotation.z || 0);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  }

  function pipe(parent, a0, b0, radius, material, segments = 16) {
    const a = new THREE.Vector3(...a0);
    const b = new THREE.Vector3(...b0);
    const delta = new THREE.Vector3().subVectors(b, a);
    const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, delta.length(), segments), material);
    mesh.position.copy(a).add(b).multiplyScalar(0.5);
    mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), delta.normalize());
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  }

  function torus(parent, x, y, z, radius, tube, material, rotation = [Math.PI / 2, 0, 0]) {
    const mesh = new THREE.Mesh(new THREE.TorusGeometry(radius, tube, 8, 28), material);
    mesh.position.set(x, y, z);
    mesh.rotation.set(...rotation);
    mesh.castShadow = true;
    parent.add(mesh);
    return mesh;
  }

  function label(text, x, y, z, width = 3.2, color = '#d6dfda') {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 96;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = 'rgba(7,13,13,.88)';
    ctx.beginPath();
    ctx.roundRect(6, 9, 500, 78, 10);
    ctx.fill();
    ctx.strokeStyle = 'rgba(162,139,91,.72)';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.font = '600 25px monospace';
    ctx.fillStyle = color;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 256, 49, 470);
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, transparent: true, depthWrite: false }));
    sprite.position.set(x, y, z);
    sprite.scale.set(width, width * 0.19, 1);
    scene.add(sprite);
    return sprite;
  }

  function flange(parent, x, y, z, radius, axis = 'y') {
    const ring = torus(parent, x, y, z, radius, 0.045, steel, axis === 'x' ? [0, Math.PI / 2, 0] : axis === 'z' ? [0, 0, 0] : [Math.PI / 2, 0, 0]);
    return ring;
  }

  function handwheel(parent, x, y, z, size = 0.24) {
    cylinder(parent, x, y, z, 0.08, 0.08, 0.14, steelDark, 16, { x: Math.PI / 2 });
    torus(parent, x, y + 0.34, z, size, 0.035, safety, [0, 0, 0]);
    box(parent, x, y + 0.34, z + 0.01, size * 1.8, 0.04, 0.04, safety, false, false);
  }

  function gauge(parent, x, y, z, size = 0.2) {
    cylinder(parent, x, y, z, size, size, 0.1, steelDark, 20, { x: Math.PI / 2 });
    cylinder(parent, x, y, z + 0.065, size * 0.78, size * 0.78, 0.02, faceMat, 24, { x: Math.PI / 2 });
    pipe(parent, [x, y, z + 0.085], [x + size * 0.42, y + size * 0.22, z + 0.09], 0.012, steelDark, 8);
    for (let i = -2; i <= 2; i++) box(parent, x + i * size * 0.27, y - size * 0.56, z + 0.09, 0.018, 0.03, 0.012, steelDark, false, false);
  }

  function valve(parent, x, y, z, material = solventPipe) {
    cylinder(parent, x, y, z, 0.19, 0.19, 0.3, material, 20, { x: Math.PI / 2 });
    cylinder(parent, x, y, z + 0.18, 0.1, 0.1, 0.12, steelDark, 14, { x: Math.PI / 2 });
    pipe(parent, [x, y, z + 0.1], [x, y + 0.34, z + 0.1], 0.04, steelDark, 10);
    handwheel(parent, x, y + 0.33, z + 0.1, 0.22);
  }

  function cagedLight(x, y, z, color = 0xffd28a, intensity = 1.2) {
    box(scene, x, y + 0.17, z, 0.42, 0.12, 1.22, steelDark, false, false);
    box(scene, x, y, z, 0.08, 0.07, 0.84, warmLightMat, false, false);
    for (const dz of [-0.42, -0.21, 0, 0.21, 0.42]) box(scene, x + 0.07, y, z + dz, 0.025, 0.22, 0.025, steel, false, false);
    const light = new THREE.PointLight(color, intensity * 1.5, 12, 2);
    light.position.set(x, y - 0.08, z);
    scene.add(light);
    facilityLights.push(light);
    return light;
  }

  // Concrete basement gallery: a long, low service space with one cutaway face.
  const roomW = 27.0;
  const roomD = 16.4;
  const wallH = 4.7;
  const wallY = wallH / 2;
  box(scene, 0, -0.28, 0, roomW + 0.8, 0.52, roomD + 0.8, concreteDark, false, true);
  box(scene, 0, -0.015, 0, roomW, 0.08, roomD, floorMat, false, true);
  const floorGrid = new THREE.GridHelper(roomW, 32, 0x47524d, 0x252c2a);
  floorGrid.position.y = 0.028;
  floorGrid.material.transparent = true;
  floorGrid.material.opacity = 0.1;
  scene.add(floorGrid);
  box(scene, 0, wallY, -8.2, roomW, wallH, 0.34, concrete, true, true);
  box(scene, -13.34, wallY, 0, 0.34, wallH, roomD, concrete, true, true);
  box(scene, 13.34, wallY, 0, 0.34, wallH, roomD, concrete, true, true);
  // Sectioned front wall, retaining the concrete plinth and the service-entry jambs.
  box(scene, -3.0, 0.56, 8.2, 20.0, 1.12, 0.34, concrete, true, true);
  box(scene, 11.6, 0.56, 8.2, 3.5, 1.12, 0.34, concrete, true, true);
  box(scene, 9.95, 4.52, 8.2, 3.1, 0.28, 0.34, steelDark, false, false);
  box(scene, 8.42, 2.35, 8.2, 0.12, 4.4, 0.38, safety, false, false);
  box(scene, 11.48, 2.35, 8.2, 0.12, 4.4, 0.38, safety, false, false);
  label('B1 · RESIN UNIT PUMP GALLERY', 0, 4.1, -8.0, 5.0, '#e4d5af');
  // Slab edge and structural grid show that process equipment continues above this level.
  for (const x of [-11.2, -5.6, 0, 5.6, 11.2]) {
    for (const z of [-5.8, 0, 5.8]) {
      box(scene, x, 2.28, z, 0.32, 4.56, 0.32, steelDark);
      box(scene, x, 0.16, z, 0.72, 0.24, 0.72, steel);
      box(scene, x, 4.45, z, 0.68, 0.2, 0.68, steel);
    }
  }
  for (const z of [-5.8, 0, 5.8]) box(scene, 0, 4.55, z, roomW, 0.28, 0.32, steelDark);
  for (const x of [-11.2, -5.6, 0, 5.6, 11.2]) box(scene, x, 4.55, 0, 0.32, 0.28, roomD, steelDark);

  // Electrical/MCC room is walled off from the process gallery.
  box(scene, -7.55, wallY, -5.75, 0.24, wallH, 4.9, concrete);
  box(scene, -10.45, wallY, -3.42, 5.8, wallH, 0.24, concrete);
  box(scene, -12.4, wallY, -3.42, 1.9, wallH, 0.24, concrete);
  box(scene, -8.35, wallY, -3.42, 1.4, wallH, 0.24, concrete);
  box(scene, -10.4, 4.52, -5.72, 5.8, 0.28, 4.9, steelDark, false, false);
  box(scene, -10.4, 4.36, -5.72, 5.72, 0.08, 4.78, concrete, false, true);
  label('MCC / DRY ELECTRICAL', -10.35, 3.95, -3.25, 3.3, '#e6cc8c');
  const cabinetXs = [-12.25, -11.05, -9.85, -8.65];
  cabinetXs.forEach((x, idx) => {
    const cabinet = new THREE.Group();
    cabinet.position.set(x, 0, -6.15);
    scene.add(cabinet);
    const color = idx % 2 ? greenPaint : bluePaint;
    box(cabinet, 0, 1.5, 0, 0.92, 2.95, 0.72, color);
    box(cabinet, 0, 1.5, 0.38, 0.84, 2.82, 0.055, steelDark, false, false);
    box(cabinet, 0, 2.48, 0.418, 0.62, 0.34, 0.018, lensMat, false, false);
    for (let row = 0; row < 2; row++) for (let col = 0; col < 3; col++) {
      const lampMat = [greenLightMat, amberLightMat, redLightMat][(col + idx + row) % 3];
      const led = cylinder(cabinet, -0.24 + col * 0.24, 1.91 - row * 0.34, 0.44, 0.055, 0.055, 0.04, lampMat, 12, { x: Math.PI / 2 });
      panelStatusLights.push(led);
    }
    box(cabinet, 0.31, 1.35, 0.44, 0.08, 0.48, 0.04, safety, false, false);
    for (let i = 0; i < 4; i++) box(cabinet, -0.3 + i * 0.18, 0.24, 0.39, 0.06, 0.03, 0.02, steel, false, false);
  });
  box(scene, -12.45, 1.6, -7.18, 0.12, 2.9, 0.1, safety, false, false);
  label('EMERGENCY ISOLATION', -10.25, 3.3, -7.72, 3.2, '#f0bd75');
  // Fire-door leaf is parked open against the inside partition; threshold and closer are visible.
  box(scene, -8.65, 1.75, -3.22, 0.82, 3.5, 0.12, bluePaint);
  box(scene, -8.34, 1.7, -3.12, 0.04, 0.72, 0.05, safety, false, false);

  // Bunded pump bases, centrifugal/gear pump bodies, guarded couplings and local instruments.
  function pumpSkid(x, z, tag, service, paint = bluePaint) {
    const group = new THREE.Group();
    group.position.set(x, 0, z);
    scene.add(group);
    box(group, 0, 0.18, 0, 3.55, 0.3, 1.62, steelDark);
    box(group, 0, 0.35, 0, 3.25, 0.08, 1.38, safety);
    box(group, 0, 0.43, 0, 3.0, 0.08, 1.18, steel);
    for (const dx of [-1.42, -0.48, 0.48, 1.42]) box(group, dx, 0.48, 0, 0.14, 0.12, 1.28, steelDark);
    // Pump volute and suction/discharge nozzles.
    const volute = new THREE.Mesh(new THREE.SphereGeometry(0.48, 24, 18), paint);
    volute.position.set(-0.92, 0.91, 0);
    volute.scale.set(1.0, 0.9, 1.0);
    volute.castShadow = true;
    group.add(volute);
    cylinder(group, -0.92, 1.28, 0, 0.27, 0.27, 0.2, steelDark, 18);
    pipe(group, [-1.15, 0.94, 0], [-1.55, 0.94, 0], 0.16, solventPipe);
    pipe(group, [-1.55, 0.94, 0], [-1.55, 2.05, 0], 0.13, solventPipe);
    pipe(group, [-1.55, 2.05, 0], [0.25, 2.05, 0], 0.13, paint);
    flange(group, -1.42, 2.05, 0, 0.22, 'x');
    valve(group, -0.25, 2.05, 0, paint);
    gauge(group, -1.45, 1.52, 0.52, 0.16);
    gauge(group, 0.2, 2.44, 0.5, 0.16);
    // Motor, cooling fins and coupling guard.
    const motor = cylinder(group, 0.9, 0.93, 0, 0.42, 0.42, 1.42, paint, 28, { z: Math.PI / 2 });
    processMotors.push(motor);
    for (let rib = -5; rib <= 5; rib++) {
      torus(group, 0.9 + rib * 0.105, 0.93, 0, 0.39, 0.025, steel, [0, Math.PI / 2, 0]);
    }
    cylinder(group, 1.64, 0.93, 0, 0.13, 0.13, 0.16, steelDark, 16, { z: Math.PI / 2 });
    box(group, -0.02, 0.73, 0, 0.36, 0.42, 0.6, safety, false, false);
    box(group, 0.84, 1.38, 0, 1.58, 0.1, 0.98, steelDark);
    box(group, -1.35, 0.62, 0.62, 0.6, 0.22, 0.035, steelDark, false, false);
    label(`${tag} · ${service}`, x, 2.72, z + 1.0, 2.7, '#e4dac1');
    return group;
  }

  const pumpCenters = [
    { x: -5.1, z: -2.6, tag: 'P-101', service: 'XYLENE FEED', paint: bluePaint },
    { x: -0.8, z: -2.6, tag: 'P-201', service: 'RESIN TRANSFER', paint: greenPaint },
    { x: 3.5, z: -2.6, tag: 'P-301', service: 'PRODUCT TRANSFER', paint: bluePaint },
    { x: 7.8, z: -2.6, tag: 'P-401', service: 'COOLING WATER', paint: greenPaint },
  ];
  pumpCenters.forEach((p) => pumpSkid(p.x, p.z, p.tag, p.service, p.paint));

  // Secondary pump bay, drain/effluent package, and a removable filter housing.
  function smallPump(x, z, tag, paint = bluePaint) {
    const g = new THREE.Group();
    g.position.set(x, 0, z);
    scene.add(g);
    box(g, 0, 0.16, 0, 1.8, 0.28, 1.2, steelDark);
    const body = new THREE.Mesh(new THREE.SphereGeometry(0.35, 20, 14), paint);
    body.position.set(-0.36, 0.67, 0); body.scale.set(1, 0.9, 1); body.castShadow = true; g.add(body);
    cylinder(g, 0.48, 0.68, 0, 0.3, 0.3, 0.9, steelDark, 22, { z: Math.PI / 2 });
    pipe(g, [-0.5, 0.68, 0], [-0.9, 0.68, 0], 0.09, coolingPipe);
    pipe(g, [-0.9, 0.68, 0], [-0.9, 1.5, 0], 0.08, coolingPipe);
    pipe(g, [-0.9, 1.5, 0], [0.8, 1.5, 0], 0.08, coolingPipe);
    valve(g, 0.5, 1.5, 0, coolingPipe);
    gauge(g, -0.82, 1.05, 0.36, 0.12);
    label(tag, x, 2.0, z + 0.72, 1.9, '#d9dfd7');
  }
  smallPump(-5.9, 3.0, 'P-501 · SUMP', safety);
  smallPump(-3.3, 3.0, 'P-502 · EFFLUENT', bluePaint);
  smallPump(8.0, 3.5, 'P-302 · FILTER FEED', greenPaint);
  // Closed filter housing in the product line.
  cylinder(scene, 5.45, 1.48, 3.15, 0.48, 0.58, 1.85, steel, 28);
  const filterCap = cylinder(scene, 5.45, 2.45, 3.15, 0.36, 0.48, 0.16, steelDark, 24);
  torus(scene, 5.45, 2.43, 3.15, 0.42, 0.035, safety);
  for (const x of [5.1, 5.8]) pipe(scene, [x, 1.48, 3.15], [x, 1.48, 2.25], 0.095, resinPipe);
  label('F-401 · POLISH FILTER', 5.45, 2.98, 4.0, 2.8, '#e4dac1');

  // Containment kerbs keep drips around pumps visible without turning the gallery into a drain pit.
  for (const [x, z, w, d] of [[-5.1, -2.6, 4.4, 2.55], [-0.8, -2.6, 4.4, 2.55], [3.5, -2.6, 4.4, 2.55], [7.8, -2.6, 4.4, 2.55]]) {
    box(scene, x, 0.07, z - d / 2, w, 0.14, 0.11, safety, false, false);
    box(scene, x, 0.07, z + d / 2, w, 0.14, 0.11, safety, false, false);
    box(scene, x - w / 2, 0.07, z, 0.11, 0.14, d, safety, false, false);
    box(scene, x + w / 2, 0.07, z, 0.11, 0.14, d, safety, false, false);
  }

  // Low-point trench, covered sump, level switch and sealed effluent discharge.
  box(scene, 10.9, -0.04, 5.65, 2.25, 0.06, 2.15, concreteDark, false, false);
  box(scene, 10.9, -0.28, 5.65, 1.85, 0.42, 1.75, bluePaint, false, false);
  box(scene, 10.9, -0.04, 5.65, 1.95, 0.07, 1.85, steelDark, false, false);
  for (let x = 10.05; x <= 11.8; x += 0.22) box(scene, x, 0.015, 5.65, 0.035, 0.035, 1.84, steel, false, false);
  for (let z = 4.78; z <= 6.53; z += 0.22) box(scene, 10.9, 0.016, z, 1.92, 0.035, 0.035, steel, false, false);
  cylinder(scene, 11.45, 0.4, 5.55, 0.12, 0.14, 0.65, safety, 16);
  box(scene, 11.45, 1.0, 5.55, 0.26, 0.22, 0.2, steelDark);
  pipe(scene, [11.45, 0.48, 5.55], [11.45, 2.1, 5.55], 0.08, returnPipe);
  pipe(scene, [11.45, 2.1, 5.55], [8.8, 2.1, 5.55], 0.08, returnPipe);
  valve(scene, 9.5, 2.1, 5.55, returnPipe);
  label('S-501 · CONTAINED SUMP', 10.8, 2.65, 6.75, 2.9, '#e4dac1');
  const waterFilm = new THREE.Mesh(new THREE.CircleGeometry(0.42, 28), new THREE.MeshBasicMaterial({ color: 0x345e59, transparent: true, opacity: 0.45, depthWrite: false }));
  waterFilm.rotation.x = -Math.PI / 2;
  waterFilm.position.set(10.9, -0.045, 5.65);
  waterFilm.scale.set(1.35, 1.1, 1);
  scene.add(waterFilm);
  // Separate process-water line heads to treatment; it is not shown draining to the ground.
  pipe(scene, [4.0, 3.35, -4.0], [4.0, 2.1, -4.0], 0.085, returnPipe);
  pipe(scene, [4.0, 2.1, -4.0], [8.8, 2.1, -4.0], 0.085, returnPipe);
  pipe(scene, [8.8, 2.1, -4.0], [8.8, 2.1, 5.55], 0.085, returnPipe);

  // Overhead headers and cable ladder are purpose-routed, supported and separated.
  const headers = [
    { y: 3.45, z: -5.6, r: 0.15, m: resinPipe, text: 'RESIN TRANSFER' },
    { y: 3.78, z: -4.8, r: 0.13, m: solventPipe, text: 'XYLENE FEED / RETURN' },
    { y: 4.08, z: -4.0, r: 0.11, m: coolingPipe, text: 'COOLING WATER' },
    { y: 4.31, z: -3.3, r: 0.09, m: returnPipe, text: 'EFFLUENT / RECOVERY' },
  ];
  headers.forEach((h) => {
    pipe(scene, [-10.5, h.y, h.z], [10.8, h.y, h.z], h.r, h.m, 20);
    for (const x of [-10, -6, -2, 2, 6, 10]) {
      cylinder(scene, x, h.y, h.z, h.r * 1.25, h.r * 1.25, 0.16, steelDark, 16, { z: Math.PI / 2 });
      box(scene, x, 4.43, h.z, 0.07, 0.31, 0.07, steelDark, false, false);
    }
  });
  // Branch risers connect the basement headers to process-floor vessels above.
  for (const [x, z, header, color] of [
    [-5.1, -5.6, 0, resinPipe], [-0.8, -4.8, 1, solventPipe], [3.5, -4.0, 2, coolingPipe],
    [7.8, -3.3, 3, returnPipe], [4.0, -4.0, 2, coolingPipe],
  ]) {
    const h = headers[header];
    pipe(scene, [x, h.y, h.z], [x, 0.95, h.z], 0.095, color);
    pipe(scene, [x, 0.95, h.z], [x, 0.95, z], 0.095, color);
    pipe(scene, [x, 0.95, z], [x, 4.85, z], 0.09, color);
    flange(scene, x, 3.1, z, 0.16, 'y');
    valve(scene, x, 3.25, z, color);
    gauge(scene, x + 0.28, 3.75, z + 0.14, 0.14);
  }
  // Cable tray follows a separate overhead route; small conduits drop to motor isolators.
  box(scene, -0.4, 4.22, 1.15, 22.0, 0.12, 0.52, steelDark, false, false);
  box(scene, -0.4, 4.4, 0.9, 22.0, 0.1, 0.07, steelDark, false, false);
  box(scene, -0.4, 4.4, 1.4, 22.0, 0.1, 0.07, steelDark, false, false);
  for (let x = -10.8; x <= 10.2; x += 0.7) box(scene, x, 4.32, 1.15, 0.04, 0.18, 0.52, steel, false, false);
  for (const p of pumpCenters) {
    pipe(scene, [p.x + 0.9, 4.2, 1.4], [p.x + 0.9, 1.25, p.z + 0.48], 0.035, steelDark, 10);
    box(scene, p.x + 1.12, 1.05, p.z + 0.62, 0.22, 0.34, 0.12, safety, false, false);
  }

  // Ventilation duct, local extract grilles and low-level hydrocarbon detector heads.
  box(scene, 1.5, 4.15, 7.0, 12.2, 0.42, 0.56, galvanized);
  box(scene, -4.4, 4.15, 7.0, 4.0, 0.32, 0.42, galvanized);
  for (const x of [-6.8, -1.8, 3.2, 8.2]) {
    box(scene, x, 4.01, 6.95, 0.72, 0.08, 0.42, steelDark, false, false);
    for (let i = -2; i <= 2; i++) box(scene, x + i * 0.11, 3.96, 6.95, 0.025, 0.06, 0.38, steel, false, false);
  }
  for (const [x, z] of [[-6.2, -0.5], [1.0, 0.8], [8.4, 1.5]]) {
    box(scene, x, 0.9, z, 0.32, 0.42, 0.18, steelDark);
    box(scene, x, 1.1, z + 0.1, 0.11, 0.1, 0.04, amberLightMat, false, false);
    label('GAS DETECTOR · SIM', x, 1.52, z + 0.18, 1.75, '#eccb83');
  }
  label('EXTRACT AIR TO VAPOUR TREATMENT', 3.0, 3.7, 7.15, 3.7, '#d9e0d8');

  // Upper process level: batch reactor, reflux equipment, blend/hold tank, xylene day tank.
  // Lower pump connections rise through the slab; upper vessels remain above the gallery.
  const processSteel = standard(0x72817d, 0.34, 0.7);
  function verticalVessel(x, z, baseY, radius, height, tag, sub, mixer = false, paint = processSteel) {
    const g = new THREE.Group();
    g.position.set(x, baseY, z);
    scene.add(g);
    cylinder(g, 0, height / 2 + radius * 0.55, 0, radius, radius, height, paint, 40);
    const top = new THREE.Mesh(new THREE.SphereGeometry(radius, 32, 18, 0, Math.PI * 2, 0, Math.PI / 2), paint);
    top.position.set(0, height + radius * 0.55, 0); top.castShadow = true; g.add(top);
    const bottom = new THREE.Mesh(new THREE.SphereGeometry(radius, 32, 18, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), paint);
    bottom.position.set(0, radius * 0.55, 0); bottom.castShadow = true; g.add(bottom);
    cylinder(g, 0, radius * 0.22, 0, radius * 0.76, radius * 0.76, 0.18, steelDark, 32);
    for (const yy of [0.45, height * 0.5 + radius * 0.55, height + radius * 0.55]) torus(g, 0, yy, 0, radius * 1.012, 0.045, steel);
    for (let i = 0; i < 4; i++) {
      const a = i * Math.PI / 2 + Math.PI / 4;
      const lx = Math.cos(a) * radius * 0.73;
      const lz = Math.sin(a) * radius * 0.73;
      box(g, lx, 0.2, lz, 0.2, 0.38, 0.2, steelDark);
    }
    // Manway, sample nozzle, level instrument and insulated jacket bands.
    cylinder(g, radius * 0.7, height * 0.58, radius * 0.72, 0.15, 0.15, 0.16, steelDark, 18, { x: Math.PI / 2 });
    torus(g, radius * 0.7, height * 0.58, radius * 0.82, 0.14, 0.025, safety);
    pipe(g, [0, 0.5, -radius], [0, 0.15, -radius - 0.65], 0.12, resinPipe);
    pipe(g, [0, 0.15, -radius - 0.65], [-0.72, 0.15, -radius - 0.65], 0.12, resinPipe);
    valve(g, -0.7, 0.15, -radius - 0.65, resinPipe);
    for (let y = 0.7; y < height + 1.4; y += 0.42) {
      pipe(g, [-radius * 0.78, y, radius * 0.74], [radius * 0.7, y, radius * 0.74], 0.022, safety, 8);
    }
    pipe(g, [-radius * 0.78, 0.6, radius * 0.74], [-radius * 0.78, height + 1.4, radius * 0.74], 0.028, safety, 8);
    pipe(g, [radius * 0.7, 0.6, radius * 0.74], [radius * 0.7, height + 1.4, radius * 0.74], 0.028, safety, 8);
    cylinder(g, 0, height + radius * 1.35, 0, 0.2, 0.2, 0.5, steelDark, 24);
    if (mixer) {
      box(g, 0, height + radius * 1.7, 0, 0.72, 0.62, 0.62, greenPaint);
      cylinder(g, 0, height + radius * 2.05, 0, 0.24, 0.24, 0.16, steel, 24);
      pipe(g, [0, height + radius * 1.55, 0], [0, height * 0.28, 0], 0.07, steelDark);
      box(g, 0.46, height + radius * 1.65, 0, 0.38, 0.14, 0.38, steelDark);
    }
    label(`${tag} · ${sub}`, x, baseY + height + radius * 2.35, z + radius * 0.9, 3.4, '#e0d5b8');
    return g;
  }

  verticalVessel(-3.2, -5.4, 4.95, 1.55, 3.6, 'R-201', 'REACTION KETTLE', true, processSteel);
  verticalVessel(4.25, -5.5, 4.95, 0.82, 2.35, 'D-202', 'CONDENSATE SEPARATOR', false, bluePaint);
  verticalVessel(8.0, -4.9, 4.95, 1.28, 3.2, 'T-301', 'BLEND / HOLD', true, processSteel);

  // Shell-and-tube condenser above the reactor, with saddles, channel head and small vents.
  const condenser = new THREE.Group();
  condenser.position.set(0.4, 7.25, -5.3);
  scene.add(condenser);
  cylinder(condenser, 0, 0, 0, 0.57, 0.57, 3.7, processSteel, 36, { z: Math.PI / 2 });
  for (const x of [-1.38, 1.38]) {
    torus(condenser, x, 0, 0, 0.53, 0.05, steel, [0, Math.PI / 2, 0]);
    box(condenser, x, -0.68, 0, 0.46, 0.34, 1.05, steelDark);
  }
  cylinder(condenser, -1.92, 0, 0, 0.45, 0.45, 0.35, steel, 28, { z: Math.PI / 2 });
  cylinder(condenser, 1.92, 0, 0, 0.45, 0.45, 0.35, steel, 28, { z: Math.PI / 2 });
  for (const x of [-0.9, 0, 0.9]) {
    pipe(condenser, [x, 0.52, 0], [x, 0.95, 0], 0.09, coolingPipe);
    pipe(condenser, [x, -0.52, 0], [x, -0.92, 0], 0.09, coolingPipe);
  }
  label('E-202 · REFLUX CONDENSER', 0.4, 8.2, -4.35, 3.6, '#e0d5b8');

  // Xylene day tank on a raised steel saddle pair, isolated from the basement pump room.
  const dayTank = new THREE.Group();
  dayTank.position.set(10.6, 5.35, 1.8);
  scene.add(dayTank);
  box(dayTank, 0, 0.22, 0, 4.7, 0.35, 1.8, steelDark);
  for (const x of [-1.45, 1.45]) box(dayTank, x, 0.68, 0, 0.52, 0.72, 1.55, steel);
  cylinder(dayTank, 0, 1.32, 0, 0.72, 0.72, 3.45, processSteel, 36, { z: Math.PI / 2 });
  for (const x of [-1.45, 1.45]) torus(dayTank, x, 1.32, 0, 0.7, 0.045, steel, [0, Math.PI / 2, 0]);
  cylinder(dayTank, 0, 2.05, 0, 0.2, 0.2, 0.28, steelDark, 18);
  pipe(dayTank, [-1.6, 1.3, 0], [-2.35, 1.3, 0], 0.11, solventPipe);
  label('TK-101 · XYLENE DAY TANK', 10.5, 7.2, 2.8, 3.2, '#e0d5b8');

  // Upper-floor support skids and a narrow grated operator access strip.
  box(scene, 1.5, 4.82, -5.0, 22.0, 0.16, 0.55, steelDark);
  for (const x of [-8, -4, 0, 4, 8, 12]) {
    box(scene, x, 4.91, -5.0, 0.08, 0.08, 0.55, steel, false, false);
    box(scene, x, 5.02, -5.0, 0.035, 0.08, 0.5, steel, false, false);
  }
  box(scene, 10.55, 4.99, -0.95, 5.0, 0.12, 2.3, steelDark);
  for (let x = 8.2; x <= 12.8; x += 0.22) box(scene, x, 5.06, -0.95, 0.035, 0.035, 2.18, steel, false, false);
  // Reflux vapour up / condensate return and xylene feed risers visible through the cutaway.
  pipe(scene, [-3.2, 4.45, -5.4], [-3.2, 6.6, -5.4], 0.14, resinPipe);
  pipe(scene, [-3.2, 6.6, -5.4], [0.4, 6.6, -5.4], 0.14, resinPipe);
  pipe(scene, [0.4, 6.6, -5.4], [0.4, 7.25, -5.4], 0.12, resinPipe);
  pipe(scene, [0.4, 7.25, -4.72], [4.25, 7.25, -4.72], 0.11, returnPipe);
  pipe(scene, [4.25, 7.25, -4.72], [4.25, 6.45, -4.72], 0.11, returnPipe);
  pipe(scene, [4.25, 6.45, -4.72], [-3.2, 6.45, -4.72], 0.11, returnPipe);
  pipe(scene, [-3.2, 6.45, -4.72], [-3.2, 4.95, -4.72], 0.11, returnPipe);
  pipe(scene, [10.6, 6.65, 1.8], [10.6, 4.95, 1.8], 0.11, solventPipe);
  pipe(scene, [10.6, 4.95, 1.8], [-5.1, 4.95, 1.8], 0.11, solventPipe);
  pipe(scene, [-5.1, 4.95, 1.8], [-5.1, 3.45, 1.8], 0.11, solventPipe);
  valve(scene, 7.2, 4.95, 1.8, solventPipe);
  flange(scene, -5.1, 4.95, 1.8, 0.19, 'y');

  // Service stair to the process deck, wall-mounted handrail and an independent exit door.
  for (let i = 0; i < 13; i++) {
    const y = 0.18 + i * 0.32;
    const z = 6.1 - i * 0.29;
    box(scene, 11.95, y, z, 1.05, 0.12, 0.38, steelDark);
    box(scene, 11.95, y + 0.075, z, 1.02, 0.025, 0.35, safety, false, false);
  }
  pipe(scene, [11.35, 0.35, 6.3], [11.35, 4.35, 2.75], 0.04, safety);
  pipe(scene, [12.55, 0.35, 6.3], [12.55, 4.35, 2.75], 0.04, safety);
  for (let i = 0; i < 7; i++) {
    const t = i / 6;
    const x = 11.35 + t * 1.2;
    const y = 0.42 + t * 3.82;
    const z = 6.2 - t * 3.45;
    pipe(scene, [x, y, z], [x + 0.05, y + 0.04, z], 0.025, steel, 8);
  }
  box(scene, 9.95, 2.1, 8.22, 2.75, 3.6, 0.12, bluePaint);
  box(scene, 10.9, 2.1, 8.12, 0.08, 0.78, 0.06, safety, false, false);
  label('ACCESS / EGRESS', 9.95, 4.0, 7.9, 2.6, '#e4d5af');

  // Vibration isolation, anchors, pipe shoes, wall sleeves and service tags.
  for (const x of [-10.2, -7.4, -2.8, 0.2, 6.6, 9.3]) {
    for (const z of [-7.1, -0.7, 6.1]) {
      box(scene, x, 4.45, z, 0.42, 0.1, 0.42, steel, false, false);
      box(scene, x, 4.34, z, 0.16, 0.13, 0.16, steelDark, false, false);
    }
  }
  for (const [x, z, y] of [[-9.8, -1.3, 3.45], [-4.4, -0.5, 3.78], [0.9, -0.5, 4.08], [6.8, -0.5, 4.31]]) {
    box(scene, x, y, z, 0.48, 0.4, 0.48, steelDark);
    cylinder(scene, x, y, z + 0.25, 0.18, 0.18, 0.06, safety, 16, { x: Math.PI / 2 });
  }

  // Partial process-floor panels can be toggled to inspect the service space below.
  for (const [x, z, w, d] of [[-9.2, 5.0, 7.8, 5.7], [1.2, 5.8, 7.0, 4.2], [11.0, -5.3, 3.8, 4.2], [-10.8, -0.1, 4.4, 3.8]]) {
    box(ceilingPanels, x, 4.82, z, w, 0.18, d, concrete, false, true);
    box(ceilingPanels, x, 4.92, z, w, 0.035, d, steelDark, false, false);
  }

  // Work lights and small status lamps; brightness stays low but the work area remains legible.
  for (const [x, z, c, intensity] of [
    [-10.8, -1.0, 0xffd59b, 1.0], [-5.2, 1.2, 0xffc77d, 1.15], [0.2, 1.1, 0xe3e7d5, 1.0],
    [5.6, 1.2, 0xffd59b, 1.05], [10.2, -0.2, 0xffc77d, 1.0], [0.0, -6.9, 0xe3e7d5, 0.85],
  ]) cagedLight(x, 4.25, z, c, intensity);
  label('PUMP BAY A', -2.8, 3.9, -7.5, 2.2, '#d7d8c8');
  label('PROCESS / TRANSFER HEADER', 2.6, 4.23, -5.9, 3.6, '#dfcfaa');
  label('PRODUCT FILTER & TRANSFER', 6.2, 3.65, 4.5, 3.1, '#d7d8c8');
  label('LEVEL B1 · LOWER PROCESS GALLERY', 0.2, 0.95, 7.98, 3.8, '#e3d6b8');

  return { facilityLights, processMotors, panelStatusLights, conveyorRollers, ceilingPanels };
}
