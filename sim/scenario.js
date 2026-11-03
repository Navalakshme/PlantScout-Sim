// PlantScout - Scenario Manager
import { galleryZ } from '../data/layout.js';
// Manages Normal vs Defective scenarios with deterministic seeds, physical spill puddle, and state reset.

export const SCENARIOS = {
  normal: {
    id: 'normal',
    name: 'Normal Basement',
    seed: 42,
    description: 'All configured services and equipment operate consistently within normal limits. Clean floor, no spills.',
    injectedDefects: [],
    p301BearingTemp: 52.3,
    f301FilterDp: 0.42,
    spill: null
  },
  defective: {
    id: 'defective',
    name: 'Defective Basement',
    seed: 1337,
    description: 'Contains an uncontained solvent/oil spill near pump P-301, elevated motor bearing temperature, and restricted filter DP.',
    injectedDefects: [
      {
        id: 'DEF-01-SPILL',
        type: 'Liquid Floor Spill',
        targetEq: 'P-301',
        location: [4.8, 0.005, -3.2],
        footprint: [1.8, 1.2],
        description: 'Uncontained dark amber solvent/oil pooling spreading across concrete floor near P-301 pump base.',
        severity: 'CRITICAL',
        suspectedSubstance: 'Aliphatic solvent / resin mixture'
      },
      {
        id: 'DEF-02-TEMP',
        type: 'Motor Bearing Overtemperature',
        targetEq: 'P-301',
        tag: 'P-301.TT-BRG',
        value: 108.4,
        unit: '°C',
        warnLimit: 75.0,
        alarmLimit: 90.0,
        severity: 'CRITICAL',
        description: 'Drive-end bearing on P-301 exceeds demonstration alarm threshold (108.4 °C vs alarm 90.0 °C).'
      },
      {
        id: 'DEF-03-FILTER',
        type: 'Restricted Filter Cartridge',
        targetEq: 'F-301',
        tag: 'F-301.DPT',
        value: 2.85,
        unit: 'bar',
        warnLimit: 1.50,
        alarmLimit: 2.20,
        severity: 'WARNING',
        description: 'Differential pressure across polishing filter F-301 elevated due to particulate accumulation.'
      }
    ],
    p301BearingTemp: 108.4,
    f301FilterDp: 2.85,
    spill: {
      position: [4.8, 0.005, -3.2],
      size: [1.8, 1.2],
      rotationY: 0.25
    }
  }
};

SCENARIOS.defective.spill.position[2] = galleryZ(SCENARIOS.defective.spill.position[2]);
for (const defect of SCENARIOS.defective.injectedDefects) {
  if (defect.location) defect.location[2] = galleryZ(defect.location[2]);
}

export class ScenarioManager {
  constructor(engine) {
    this.engine = engine;
    this.currentScenario = 'normal';
    this.spillMesh = null;
    this.listeners = new Set();
  }

  getScenario() {
    return SCENARIOS[this.currentScenario];
  }

  setScenario(scenarioKey, scene, ThreeInstance) {
    if (!SCENARIOS[scenarioKey]) return;
    this.currentScenario = scenarioKey;

    // Reset simulation engine to matching scenario
    this.engine.reset(scenarioKey);

    // Update 3D scene spill visualization
    if (scene && ThreeInstance) {
      this.updateSpillVisualization(scene, ThreeInstance);
    }

    this.notify();
  }

  updateSpillVisualization(scene, T) {
    // Remove existing spill mesh if present
    if (this.spillMesh) {
      scene.remove(this.spillMesh);
      if (this.spillMesh.geometry) this.spillMesh.geometry.dispose();
      if (this.spillMesh.material) {
        if (this.spillMesh.material.map) this.spillMesh.material.map.dispose();
        this.spillMesh.material.dispose();
      }
      this.spillMesh = null;
    }

    const scenario = SCENARIOS[this.currentScenario];
    if (scenario.spill) {
      // Create procedural irregular oil puddle mesh with realistic wet glossy appearance
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 512;
      const ctx = canvas.getContext('2d');

      // Draw irregular dark amber puddle contour
      ctx.clearRect(0, 0, 512, 512);
      ctx.fillStyle = '#1c150c'; // Dark resin/oil core
      ctx.beginPath();
      const cx = 256, cy = 256;
      for (let angle = 0; angle < Math.PI * 2; angle += 0.08) {
        // Organic radial perturbation
        const r = 180 + Math.sin(angle * 5) * 28 + Math.cos(angle * 3) * 35 + Math.sin(angle * 9) * 14;
        const x = cx + Math.cos(angle) * r;
        const y = cy + Math.sin(angle) * r * 0.72; // Elliptical spread
        if (angle === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.fill();

      // Add soft wet feather edge
      const grad = ctx.createRadialGradient(cx, cy, 120, cx, cy, 230);
      grad.addColorStop(0, 'rgba(42, 28, 12, 0.95)');
      grad.addColorStop(0.7, 'rgba(32, 22, 10, 0.85)');
      grad.addColorStop(1, 'rgba(20, 15, 8, 0.0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(cx, cy, 240, 0, Math.PI * 2);
      ctx.fill();

      const puddleTexture = new T.CanvasTexture(canvas);
      puddleTexture.colorSpace = T.SRGBColorSpace;

      const puddleGeo = new T.PlaneGeometry(scenario.spill.size[0], scenario.spill.size[1], 16, 16);
      const puddleMat = new T.MeshStandardMaterial({
        map: puddleTexture,
        transparent: true,
        opacity: 0.94,
        roughness: 0.08,   // High specularity for liquid surface
        metalness: 0.22,
        polygonOffset: true,
        polygonOffsetFactor: -2,
        polygonOffsetUnits: -2
      });

      this.spillMesh = new T.Mesh(puddleGeo, puddleMat);
      this.spillMesh.rotation.x = -Math.PI / 2;
      this.spillMesh.rotation.z = scenario.spill.rotationY;
      this.spillMesh.position.set(scenario.spill.position[0], scenario.spill.position[1], scenario.spill.position[2]);
      this.spillMesh.receiveShadow = true;
      this.spillMesh.name = 'OIL_SPILL_MESH';
      scene.add(this.spillMesh);
    }
  }

  subscribe(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  notify() {
    const sc = this.getScenario();
    this.listeners.forEach(fn => fn(sc));
  }
}
