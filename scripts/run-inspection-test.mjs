// Offline inspection fixture verification. This test never calls Meta or spends API credits.
import assert from 'node:assert/strict';
import { ProcessSimulationEngine } from '../sim/engine.js';
import { ScenarioManager } from '../sim/scenario.js';
import { INSPECTION_STATIONS, EQUIPMENT_REGISTER } from '../data/equipment.js';

const stationIds = new Set(INSPECTION_STATIONS.map(station => station.id));
const coveredEquipment = new Set(INSPECTION_STATIONS.map(station => station.targetEq));
assert.equal(INSPECTION_STATIONS.length, 37, 'The route has one stop per registered assembly.');
assert.equal(stationIds.size, 37, 'Every station ID is unique.');
assert.equal(coveredEquipment.size, EQUIPMENT_REGISTER.length, 'The route covers all equipment.');
assert.ok(INSPECTION_STATIONS.some(station => station.isSpillZone && station.targetEq === 'P-301'), 'The route visits the seeded spill zone.');

function inspectFixture(scenarioKey) {
  const engine = new ProcessSimulationEngine(scenarioKey);
  const manager = new ScenarioManager(engine);
  manager.setScenario(scenarioKey);
  engine.setStage(8); // Filtration is the repeatable inspection operating point.
  engine.update(2);
  const telemetry = engine.getTelemetrySnapshot();
  const scenario = manager.getScenario();
  const bearing = telemetry.temperatures['P-301_brg'];
  const filterDp = telemetry.pressures['F-301_dp'];
  const result = {
    scenario: scenarioKey,
    bearing,
    filterDp,
    bearingAlarm: bearing >= 90,
    filterAlarm: filterDp >= 2.2,
    seededSpill: Boolean(scenario.spill)
  };
  console.log(result);
  return result;
}

const normal = inspectFixture('normal');
assert.equal(normal.bearingAlarm, false);
assert.equal(normal.filterAlarm, false);
assert.equal(normal.seededSpill, false);

const defective = inspectFixture('defective');
assert.equal(defective.bearing, 108.4);
assert.equal(defective.filterDp, 2.85);
assert.equal(defective.bearingAlarm, true);
assert.equal(defective.filterAlarm, true);
assert.equal(defective.seededSpill, true);

console.log('Offline route coverage and both scenario fixtures passed.');
