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
    description: 'Seeded spill, hot bearing, restricted filter, cut solvent pipe with detector alarm, and visible sample particles.',
    injectedDefects: [
      {
        id: 'DEF-01-SPILL',
        type: 'Liquid Floor Spill',
        targetEq: 'P-301',
        location: [4.8, 0.005, -0.7],
        footprint: [1.8, 1.2],
        description: 'Seeded dark amber liquid pooling across the floor near P-301; its chemical identity has not been measured.',
        severity: 'WARNING',
        suspectedSubstance: 'Unknown'
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
        severity: 'CRITICAL',
        description: 'Differential pressure across polishing filter F-301 elevated due to particulate accumulation.'
      },
      {
        id: 'DEF-04-PIPE', type: 'Broken Solvent Transfer Pipe', targetEq: 'P-103',
        location: [-8.4, 2.6, -3.65], severity: 'CRITICAL',
        description: 'Visible discontinuity in simulated L-SOLV-02 transfer pipe with a vapor effect. The graphic alone cannot identify gas or concentration.'
      },
      {
        id: 'DEF-05-GAS', type: 'Gas Detector Alarm', targetEq: 'GD-901',
        tag: 'GD-901.AT-01', value: 23.4, unit: '% LEL', warnLimit: 10, alarmLimit: 20,
        severity: 'CRITICAL', description: 'Simulated vapour detector reads 23.4% LEL, above its 20% LEL demonstration alarm.'
      },
      {
        id: 'DEF-06-PARTICLES', type: 'Visible Sample Particles', targetEq: 'F-301',
        location: [5.5, 1.35, -4.15], severity: 'WARNING',
        description: 'Dark particles are visible in the simulated F-301 sample sight glass; composition is unknown.'
      }
    ],
    p301BearingTemp: 108.4,
    f301FilterDp: 2.85,
    gasDetectorLel: 23.4,
    spill: {
      position: [4.8, 0.005, -0.7],
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
    this.defectGroup = null;
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
      this.updateDefectVisualization(scene, ThreeInstance);
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

  updateDefectVisualization(scene, T) {
    if (this.defectGroup) {
      scene.remove(this.defectGroup);
      this.defectGroup.traverse(object => {
        object.geometry?.dispose();
        if (object.material) {
          const materials = Array.isArray(object.material) ? object.material : [object.material];
          materials.forEach(material => material.dispose());
        }
      });
    }
    const group = new T.Group();
    group.name = 'SCENARIO_DEFECT_FIXTURES';
    const defective = this.currentScenario === 'defective';

    // An aisle-facing sample sight glass at F-301 makes contamination visible to the mast camera.
    const sample = new T.Group();
    sample.position.set(5.5, 1.35, galleryZ(-5.0) + 0.76);
    const bezel = new T.Mesh(new T.BoxGeometry(0.67, 0.72, 0.09), new T.MeshStandardMaterial({ color: 0x566570, metalness: 0.8, roughness: 0.25 }));
    sample.add(bezel);
    const glass = new T.Mesh(new T.BoxGeometry(0.53, 0.54, 0.11), new T.MeshPhysicalMaterial({ color: defective ? 0x9c7b42 : 0xaccdd1, transparent: true, opacity: 0.88, roughness: 0.08, metalness: 0.05 }));
    glass.position.z = 0.055;
    sample.add(glass);
    if (defective) {
      for (let i = 0; i < 23; i++) {
        const particle = new T.Mesh(new T.SphereGeometry(0.009 + (i % 4) * 0.003, 8, 6), new T.MeshBasicMaterial({ color: i % 3 ? 0x231e17 : 0x574025 }));
        particle.position.set(((i * 17) % 47) / 100 - 0.23, ((i * 29) % 43) / 100 - 0.21, 0.123);
        sample.add(particle);
      }
    }
    group.add(sample);

    if (defective) {
      const leak = new T.Group();
      leak.name = 'CUT_PIPE_VAPOR_EFFECT';
      leak.position.set(-8.4, 2.6, galleryZ(-3.65));
      for (let i = 0; i < 14; i++) {
        const puff = new T.Mesh(new T.SphereGeometry(0.09 + (i % 4) * 0.045, 9, 7), new T.MeshBasicMaterial({ color: 0xa2b9c3, transparent: true, opacity: 0.18 + (i % 3) * 0.04, depthWrite: false }));
        puff.position.set(0.22 + (i % 5) * 0.07, Math.floor(i / 5) * 0.18 + 0.04, 0.12 + (i % 4) * 0.06);
        leak.add(puff);
      }
      group.add(leak);
    }
    scene.add(group);
    this.defectGroup = group;
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
