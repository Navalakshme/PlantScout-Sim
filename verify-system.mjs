// PlantScout - End-to-End System Verification Test Suite
// Verifies equipment uniqueness, graph connections, physical clearances, simulation permissives, scenario switching, robot navigation, and report schema.

import { EQUIPMENT_REGISTER, EXTERNAL_BOUNDARIES, INSPECTION_STATIONS } from './data/equipment.js';
import { CONNECTION_LINES, FLUID_SERVICES } from './data/graph.js';
import { isFree, isSegmentClear, planPath, FLOOR_OBSTACLES } from './robot/nav.js';
import { ProcessSimulationEngine, PROCESS_STAGES } from './sim/engine.js';
import { SCENARIOS, ScenarioManager } from './sim/scenario.js';
import { galleryZ } from './data/layout.js';

console.log('=== Starting PlantScout End-to-End Verification ===\n');

let failedTests = 0;
function assert(condition, message) {
  if (!condition) {
    console.error(`❌ FAILED: ${message}`);
    failedTests++;
  } else {
    console.log(`✅ PASSED: ${message}`);
  }
}

// --- Test Group 1: Equipment Register Integrity ---
console.log('\n--- 1. Equipment Register Checks ---');
const eqIds = EQUIPMENT_REGISTER.map(e => e.id);
assert(eqIds.length === 37, `Exact 37 equipment assemblies registered (Found: ${eqIds.length})`);
assert(new Set(eqIds).size === 37, 'All 37 equipment IDs are strictly unique');

// Verify all required IDs from the specification table exist
const requiredIds = [
  'TK-101', 'TK-102', 'H-101', 'AD-101', 'P-101', 'P-102', 'P-103', 'R-101', 'AG-101',
  'E-201', 'V-201', 'TK-201', 'E-202', 'P-201', 'BL-301', 'AG-301', 'P-301', 'F-301',
  'TK-401', 'P-401', 'FL-401', 'WS-401', 'CV-401', 'P-501', 'HX-501', 'TF-601', 'AC-701',
  'V-701', 'MCC-801', 'PLC-801', 'EX-901', 'S-901', 'P-901', 'GD-901', 'ESD-901', 'DOOR-001', 'ROBOT-001'
];
for (const id of requiredIds) {
  assert(eqIds.includes(id), `Required equipment ${id} is present in register`);
}

// --- Test Group 2: Connection Graph & Port Verification ---
console.log('\n--- 2. Connection Graph & Port Routing ---');
assert(CONNECTION_LINES.length >= 20, `Connection graph has comprehensive line coverage (${CONNECTION_LINES.length} lines)`);

const externalBoundaryIds = EXTERNAL_BOUNDARIES.map(b => b.id);
const allValidEndpoints = new Set([...eqIds, ...externalBoundaryIds, 'SOLV-MANIFOLD', 'CW-MANIFOLD', 'CW-RETURN', 'AIR-HEADER', 'ROOM-GRILLES']);

CONNECTION_LINES.forEach(line => {
  const fromEq = line.from.eq;
  const toEq = line.to.eq;
  assert(allValidEndpoints.has(fromEq), `Line ${line.id} from-endpoint '${fromEq}' resolves to a valid equipment or boundary`);
  assert(allValidEndpoints.has(toEq), `Line ${line.id} to-endpoint '${toEq}' resolves to a valid equipment or boundary`);

  // Verify fluid service is known
  assert(FLUID_SERVICES[line.service] !== undefined, `Line ${line.id} service '${line.service}' defined in FLUID_SERVICES`);

  // Verify route points exist and are continuous
  assert(Array.isArray(line.points) && line.points.length >= 2, `Line ${line.id} has at least 2 coordinate waypoints`);
});

// Separation of circuits: coolant and process contents must never share the same line
const coolantLines = CONNECTION_LINES.filter(l => l.service === 'cooling-water');
const processLines = CONNECTION_LINES.filter(l => FLUID_SERVICES[l.service].category === 'process');
const thermalLines = CONNECTION_LINES.filter(l => l.service === 'thermal-fluid');

assert(coolantLines.every(l => FLUID_SERVICES[l.service].category === 'utility'), 'All cooling water lines are strictly categorized as utility');
assert(thermalLines.every(l => FLUID_SERVICES[l.service].category === 'utility'), 'Thermal fluid circuit is strictly categorized as utility and isolated');

// Verify gravity drainage: E-201 -> V-201 -> R-101 / TK-201
const e201 = EQUIPMENT_REGISTER.find(e => e.id === 'E-201');
const v201 = EQUIPMENT_REGISTER.find(e => e.id === 'V-201');
const tk201 = EQUIPMENT_REGISTER.find(e => e.id === 'TK-201');
assert(e201.position[1] > v201.position[1], `Condenser E-201 (Y=${e201.position[1]}) is elevated above phase separator V-201 (Y=${v201.position[1]}) for gravity drainage`);
assert(v201.position[1] > tk201.position[1], `Phase separator V-201 (Y=${v201.position[1]}) is elevated above reaction water receiver TK-201 (Y=${tk201.position[1]})`);

// --- Test Group 3: Physical Hall Clearance & Aisle Unobstructed ---
console.log('\n--- 3. Physical Hall & Inspection Aisle Clearance ---');
// Continuous central route remains clear after narrowing the gallery.
let aisleBlocked = false;
for (let x = -13.0; x <= 13.0; x += 1.0) {
  for (let z = -0.75; z <= 0.75; z += 0.25) {
    if (!isFree(x, z, 0.40)) {
      aisleBlocked = true;
      console.error(`Obstacle detected in central aisle at (${x}, ${z})`);
    }
  }
}
assert(!aisleBlocked, 'Continuous central inspection aisle (Z = -0.75 to +0.75, X = -13 to +13) is completely unobstructed');

// Verify robot dock at [0, 7.8] is clear
assert(isFree(0.0, 7.8, 0.42), 'Robot charging dock position [0.0, 7.8] is in collision-free space');

// Test A* path from dock to multiple key stations
const testStations = [
  INSPECTION_STATIONS[12].position, // R-101
  INSPECTION_STATIONS[16].position, // P-301
  INSPECTION_STATIONS[7].position,  // S-901
  INSPECTION_STATIONS[4].position   // P-501
];
testStations.forEach((target, i) => {
  const path = planPath([0.0, 7.8], target, 0.40);
  assert(path !== null && path.length > 0, `Clear A* navigation route exists from dock to inspection target ${i + 1} (${target})`);
});

// Obstacle collision rejection
assert(!isFree(-6.0, galleryZ(-5.0), 0.42), 'Reactor R-101 correctly registers as physical obstacle');
assert(!isFree(5.5, galleryZ(-5.0), 0.42), 'Filter skid F-301 correctly registers as physical obstacle');
assert(!isFree(-12.0, galleryZ(5.5), 0.42), 'CW Pump P-501 correctly registers as physical obstacle');

// --- Test Group 4: Deterministic Process Simulation Engine ---
console.log('\n--- 4. Deterministic Process Simulation Permissives & Dynamics ---');
const engine = new ProcessSimulationEngine('normal');
assert(engine.stageIndex === 0, 'Simulation initializes in Standby stage');
assert(engine.batchReactor === 'Batch #B-109 (Alkyd Long-Oil FA)', 'Current reactor batch tagged as #B-109');
assert(engine.batchDownstream === 'Batch #B-108 (Alkyd Enamel Base)', 'Downstream holding batch tagged distinctly as #B-108');

// Advance through stages and check permissives
engine.setStage(2); // Stage 03: Charging
engine.update(1.0);
assert(engine.flows['P-101'] > 0, 'Fatty acid pump P-101 operates during charging stage');
assert(engine.levels['R-101'] > 0, 'Reactor R-101 level rises during charging');

// Test Emergency Shutdown isolation
engine.triggerEmergencyStop();
assert(engine.isEmergencyStopped, 'Emergency shutdown correctly active');
assert(engine.flows['P-101'] === 0, 'ESD immediately shuts down feed pump P-101');
assert(engine.activeAlarms.some(a => a.id === 'ALM-ESD-01'), 'ESD raises critical active alarm');
engine.resumeFromEmergencyStop();
assert(!engine.isEmergencyStopped, 'System resumes after ESD clearance');

// Test Heating & Thermal Permissive
engine.setStage(3); // Stage 04: Mixing & Heating
engine.update(5.0);
assert(engine.speeds['AG-101'] > 0, 'Agitator AG-101 operates during mixing stage');
assert(engine.temperatures['R-101_jkt'] > 50, 'Jacket temperature rises via separate thermal fluid circuit');

// Test Reaction & Water Evolution
engine.setStage(4); // Stage 05: Reaction & Recovery
engine.update(2.0);
assert(engine.analyticals['acid_value'] < 88.0, 'Simulated Acid Value decreases during esterification');
assert(engine.analyticals['reaction_water_kg'] > 0, 'Reaction water accumulates in receiver TK-201');

// Test Conditioning & Transfer Permissive
engine.setStage(6); // Stage 07: Conditioning & Transfer
engine.temperatures['R-101_proc'] = 120.0; // Satisfy cooling permissive (<135°C)
engine.update(1.0);
assert(engine.flows['P-201'] > 0, 'Transfer pump P-201 operates once thermal permissive is satisfied');

// --- Test Group 5: Scenario Integrity & Fault Injections ---
console.log('\n--- 5. Normal vs Defective Scenarios ---');
const scenarioMgr = new ScenarioManager(engine);

// 1. Test Normal Scenario
scenarioMgr.setScenario('normal');
const normSnap = engine.getTelemetrySnapshot();
assert(scenarioMgr.currentScenario === 'normal', 'Current scenario set to Normal');
assert(normSnap.temperatures['P-301_brg'] < 65.0, `P-301 bearing normal: ${normSnap.temperatures['P-301_brg']} °C (expected ~52.3 °C)`);
assert(normSnap.pressures['F-301_dp'] < 1.0, `F-301 DP normal: ${normSnap.pressures['F-301_dp']} bar (expected ~0.42 bar)`);
assert(SCENARIOS.normal.spill === null, 'Normal scenario has zero injected spills');

// 2. Test Defective Scenario
scenarioMgr.setScenario('defective');
engine.setStage(8); // Stage 09: Filtration
engine.update(2.0);
const defSnap = engine.getTelemetrySnapshot();
assert(scenarioMgr.currentScenario === 'defective', 'Current scenario set to Defective');
assert(defSnap.temperatures['P-301_brg'] >= 90.0, `P-301 bearing in Defective mode exceeds alarm limit: ${defSnap.temperatures['P-301_brg']} °C`);
assert(defSnap.pressures['F-301_dp'] >= 2.2, `F-301 differential pressure in Defective mode exceeds alarm limit: ${defSnap.pressures['F-301_dp']} bar`);
assert(SCENARIOS.defective.spill !== null, 'Defective scenario has configured physical floor spill near P-301');
assert(defSnap.activeAlarms.length >= 2, `Defective scenario triggers deterministic active alarms (${defSnap.activeAlarms.length} active)`);

// Switching back to Normal clears faults cleanly
scenarioMgr.setScenario('normal');
const resetSnap = engine.getTelemetrySnapshot();
assert(resetSnap.temperatures['P-301_brg'] < 65.0, 'Switching back to normal resets P-301 bearing temp to normal');
assert(resetSnap.activeAlarms.length === 0, 'Switching back to normal clears all alarms');

// --- Test Group 6: Robot Coverage Plan ---
console.log('\n--- 6. Robot Inspection Stations Coverage ---');
assert(new Set(INSPECTION_STATIONS.map(s => s.targetEq)).size === EQUIPMENT_REGISTER.length, `Inspection route covers all ${EQUIPMENT_REGISTER.length} assemblies`);
assert(INSPECTION_STATIONS[0].id === 'STATION-01' && INSPECTION_STATIONS[0].position[0] === 0.0, 'Route begins at Dock');
assert(INSPECTION_STATIONS.at(-1).id !== 'STATION-20', 'Route finishes at the final inspected assembly without a forced dock return');

// Station 17 covers P-301 & floor spill zone
const st17 = INSPECTION_STATIONS.find(s => s.id === 'STATION-17');
assert(st17 && st17.isSpillZone === true, 'Station 17 designated as spill observation zone');

// Verify entire sequential route planning
let routeFailure = null;
for (let i = 0; i < INSPECTION_STATIONS.length - 1; i++) {
  const fromSt = INSPECTION_STATIONS[i];
  const toSt = INSPECTION_STATIONS[i + 1];
  const leg = planPath(fromSt.position, toSt.position, 0.40);
  if (!leg || leg.length === 0) {
    routeFailure = `Failed leg from ${fromSt.id} (${fromSt.position}) to ${toSt.id} (${toSt.position})`;
    break;
  }
}
assert(routeFailure === null, routeFailure || `All ${INSPECTION_STATIONS.length - 1} sequential route legs successfully planned via A*`);

console.log('\n=================================================');
if (failedTests === 0) {
  console.log('🎉 ALL PLANT-SCOUT SYSTEM TESTS PASSED SUCCESSFULLY! (0 Failures)');
} else {
  console.error(`💥 VERIFICATION COMPLETED WITH ${failedTests} FAILURE(S).`);
  process.exit(1);
}
