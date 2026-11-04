// PlantScout - Procedural Pipe Network
// Renders 3D pipes, bends, flanges, supports, and service bands directly from data/graph.js.

import { CONNECTION_LINES, FLUID_SERVICES } from '../data/graph.js';

export function buildPipeNetwork(T, scene) {
  const root = new T.Group();
  root.name = 'PIPE_NETWORK';

  const defaultPipeMat = new T.MeshStandardMaterial({ color: 0x6e777d, roughness: 0.45, metalness: 0.70 });
  const flangeMat = new T.MeshStandardMaterial({ color: 0x333a40, roughness: 0.55, metalness: 0.60 });
  const hangerMat = new T.MeshStandardMaterial({ color: 0x485057, roughness: 0.60, metalness: 0.50 });

  // Cache materials for service color bands
  const bandMaterials = new Map();
  Object.entries(FLUID_SERVICES).forEach(([key, spec]) => {
    bandMaterials.set(key, new T.MeshStandardMaterial({
      color: spec.bandColor,
      roughness: 0.50,
      metalness: 0.30
    }));
  });

  const lineMeshes = new Map();
  const leakParts = { intact: null, cut: [] };

  function pipeSegment(a, b, radius, mat = defaultPipeMat) {
    const av = new T.Vector3(...a), bv = new T.Vector3(...b);
    const dir = bv.clone().sub(av);
    const len = dir.length();
    if (len < 0.001) return null;

    const geo = new T.CylinderGeometry(radius, radius, len, 16);
    const m = new T.Mesh(geo, mat);
    m.position.copy(av.add(bv).multiplyScalar(0.5));
    m.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), dir.normalize());
    m.castShadow = true;
    m.receiveShadow = true;
    root.add(m);
    return m;
  }

  function flangeJoint(pos, radius, normal) {
    const geo = new T.CylinderGeometry(radius * 1.55, radius * 1.55, 0.05, 16);
    const m = new T.Mesh(geo, flangeMat);
    m.position.set(...pos);
    m.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), normal.clone().normalize());
    root.add(m);
  }

  function elbowSphere(pos, radius, mat = defaultPipeMat) {
    const geo = new T.SphereGeometry(radius * 1.08, 16, 12);
    const m = new T.Mesh(geo, mat);
    m.position.set(...pos);
    root.add(m);
  }

  function serviceBand(pos, radius, serviceKey, normal) {
    const mat = bandMaterials.get(serviceKey) || defaultPipeMat;
    const geo = new T.CylinderGeometry(radius * 1.14, radius * 1.14, 0.12, 16);
    const m = new T.Mesh(geo, mat);
    m.position.set(...pos);
    m.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), normal.clone().normalize());
    root.add(m);
  }

  function ceilingHanger(pos, radius) {
    if (pos[1] > 2.0 && pos[1] < 6.8) {
      const topY = 7.1; // Overhead I-beam height
      const rodLen = topY - pos[1];
      const geo = new T.CylinderGeometry(0.012, 0.012, rodLen, 8);
      const m = new T.Mesh(geo, hangerMat);
      m.position.set(pos[0], pos[1] + rodLen * 0.5, pos[2]);
      root.add(m);
    }
  }

  // Build each connection line in graph
  CONNECTION_LINES.forEach(line => {
    const serviceSpec = FLUID_SERVICES[line.service] || { dia: 0.06 };
    const radius = serviceSpec.dia * 0.5;
    const pts = line.points;
    const segments = [];

    for (let i = 0; i < pts.length - 1; i++) {
      const p1 = pts[i];
      const p2 = pts[i + 1];
      const v1 = new T.Vector3(...p1), v2 = new T.Vector3(...p2);
      const dir = v2.clone().sub(v1).normalize();

      // Main pipe segment
      const seg = pipeSegment(p1, p2, radius, defaultPipeMat);
      if (seg) segments.push(seg);
      if (line.id === 'L-SOLV-02' && i === 0 && seg) {
        leakParts.intact = seg;
        const midpoint = v1.clone().lerp(v2, 0.62);
        const cutLength = 0.58;
        const leftEnd = midpoint.clone().addScaledVector(dir, -cutLength / 2);
        const rightStart = midpoint.clone().addScaledVector(dir, cutLength / 2);
        leakParts.cut.push(pipeSegment(p1, leftEnd.toArray(), radius, defaultPipeMat));
        leakParts.cut.push(pipeSegment(rightStart.toArray(), p2, radius, defaultPipeMat));
        for (const end of [leftEnd, rightStart]) {
          const collar = new T.Mesh(new T.CylinderGeometry(radius * 2.1, radius * 2.1, 0.08, 16), flangeMat);
          collar.position.copy(end);
          collar.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), dir);
          root.add(collar);
          leakParts.cut.push(collar);
        }
        leakParts.cut.forEach(part => { part.visible = false; });
      }

      // Flanges at endpoints
      if (i === 0) {
        flangeJoint(p1, radius, dir);
      }
      if (i === pts.length - 2) {
        flangeJoint(p2, radius, dir);
      }

      // Smooth elbow at interior corners
      if (i > 0) {
        elbowSphere(p1, radius, defaultPipeMat);
      }

      // Subtle service identification band at midpoint of long segments
      const len = v1.distanceTo(v2);
      if (len > 1.2 && !(line.id === 'L-SOLV-02' && i === 0)) {
        const mid = v1.clone().add(v2).multiplyScalar(0.5);
        serviceBand([mid.x, mid.y, mid.z], radius, line.service, dir);

        // Ceiling hanger for elevated horizontal runs
        if (Math.abs(dir.y) < 0.2 && mid.y > 2.5) {
          ceilingHanger([mid.x, mid.y, mid.z], radius);
        }
      }
    }

    lineMeshes.set(line.id, {
      line,
      segments,
      service: line.service
    });
  });

  scene.add(root);

  return {
    root,
    lineMeshes,
    setScenario(scenario) {
      const broken = scenario === 'defective';
      if (leakParts.intact) leakParts.intact.visible = !broken;
      leakParts.cut.forEach(part => { part.visible = broken; });
    },
    highlightLine(lineId, active = true) {
      const entry = lineMeshes.get(lineId);
      if (!entry) return;
      entry.segments.forEach(seg => {
        if (active) {
          seg.material = new T.MeshStandardMaterial({
            color: 0x63b3ed,
            emissive: 0x2b6cb0,
            roughness: 0.3,
            metalness: 0.8
          });
        } else {
          seg.material = defaultPipeMat;
        }
      });
    }
  };
}
