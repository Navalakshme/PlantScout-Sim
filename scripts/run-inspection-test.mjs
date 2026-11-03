// PlantScout - Automated Robot Inspection Verification
// Executes simulated robot inspection cycles for both Normal and Defective scenarios.

import { ProcessSimulationEngine } from '../sim/engine.js';
import { ScenarioManager, SCENARIOS } from '../sim/scenario.js';
import { INSPECTION_STATIONS, EQUIPMENT_REGISTER } from '../data/equipment.js';

console.log('=== Running PlantScout Inspection Workflow Test ===\n');

async function testScenarioRun(scenarioKey) {
  console.log(`\n>>> Testing Scenario: ${scenarioKey.toUpperCase()} <<<`);
  const engine = new ProcessSimulationEngine(scenarioKey);
  const scenarioMgr = new ScenarioManager(engine);
  scenarioMgr.setScenario(scenarioKey);

  // Advance simulation to stage 9 (Filtration) so pumps and filters are active
  engine.setStage(8);
  engine.update(2.0);

  const snap = engine.getTelemetrySnapshot();
  console.log(`Process Stage: ${snap.stage.id} (${snap.stage.name})`);
  console.log(`P-301 Bearing Temp: ${snap.temperatures['P-301_brg']} °C`);
  console.log(`F-301 Filter DP: ${snap.pressures['F-301_dp']} bar`);
  console.log(`Active Alarms: ${snap.activeAlarms.length}`);

  const inspectionId = `INSP-TEST-${scenarioKey.toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;
  const visitedStations = new Set();
  const observedEquipment = new Set();
  const findings = [];

  // Traverse all 20 inspection station waypoints
  for (let idx = 0; idx < INSPECTION_STATIONS.length; idx++) {
    const station = INSPECTION_STATIONS[idx];
    visitedStations.add(station.id);
    if (station.targetEq) observedEquipment.add(station.targetEq);

    const evidenceId = `EVID-${String(idx + 1).padStart(2, '0')}`;
    const eqSpec = EQUIPMENT_REGISTER.find(e => e.id === station.targetEq);

    // Build telemetry payload for station
    const relevantTelemetry = {};
    if (eqSpec && eqSpec.instruments) {
      eqSpec.instruments.forEach(inst => {
        let val = inst.defaultVal;
        let st = 'NORMAL';
        if (inst.tag === 'P-301.TT-BRG') {
          val = +snap.temperatures['P-301_brg'].toFixed(1);
          if (val >= 90.0) st = 'ALARM';
          else if (val >= 75.0) st = 'WARNING';
        } else if (inst.tag === 'F-301.DPT') {
          val = +snap.pressures['F-301_dp'].toFixed(2);
          if (val >= 2.2) st = 'WARNING';
        }
        relevantTelemetry[inst.tag] = {
          value: val,
          unit: inst.unit,
          type: inst.type,
          warnMin: inst.warnMin,
          alarmMin: inst.alarmMin,
          warnMax: inst.warnMax,
          alarmMax: inst.alarmMax,
          state: st
        };
      });
    }

    // Call server endpoint
    const payload = {
      inspectionId,
      stationId: station.id,
      stationName: station.name,
      equipmentIds: station.targetEq ? [station.targetEq] : [],
      isSpillZone: Boolean(station.isSpillZone && scenarioKey === 'defective'),
      cameraImageBase64: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
      telemetry: relevantTelemetry,
      thresholds: eqSpec?.instruments?.map(i => ({ tag: i.tag, warnMax: i.warnMax, alarmMax: i.alarmMax })) || [],
      evidenceId
    };

    const res = await fetch('http://127.0.0.1:8765/api/analyze-station', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    if (data.finding) {
      findings.push(data.finding);
    }
  }

  // Synthesize final report via server
  const synthRes = await fetch('http://127.0.0.1:8765/api/synthesize-report', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      inspectionId,
      visitedCount: visitedStations.size,
      totalStations: INSPECTION_STATIONS.length,
      observedCount: observedEquipment.size,
      findings
    })
  });
  const synthData = await synthRes.json();

  console.log(`Visited Stations: ${visitedStations.size}/${INSPECTION_STATIONS.length}`);
  console.log(`Observed Equipment: ${observedEquipment.size}/${EQUIPMENT_REGISTER.length}`);
  console.log(`Total Findings Gathered: ${findings.length}`);
  console.log(`Synthesized Conclusion: "${synthData.conclusion}"`);

  if (scenarioKey === 'normal') {
    const hasCritical = findings.some(f => f.severity === 'CRITICAL');
    if (hasCritical) throw new Error('Normal scenario should have zero critical findings');
    console.log('✅ Normal scenario completed with clean bill of health.');
  } else {
    const p301Finding = findings.find(f => f.equipmentOrLocation === 'P-301');
    if (!p301Finding || p301Finding.severity !== 'CRITICAL') {
      throw new Error('Defective scenario failed to flag P-301 critical severity');
    }
    if (!p301Finding.observation.includes('spill') && !p301Finding.observation.includes('puddle')) {
      throw new Error('Defective scenario failed to identify floor spill in Station 17 observation');
    }
    console.log('✅ Defective scenario successfully detected:');
    console.log(`   - P-301 Bearing Temp Finding: ${p301Finding.measurementComparison}`);
    console.log(`   - Floor Spill Observation: ${p301Finding.observation}`);
    console.log(`   - Suggested Engineering Follow-up: ${p301Finding.suggestedFollowUp}`);
  }
}

async function run() {
  try {
    await testScenarioRun('normal');
    await testScenarioRun('defective');
    console.log('\n🎉 ALL INSPECTION WORKFLOW TESTS PASSED PERFECTLY!');
  } catch (err) {
    console.error('\n❌ INSPECTION WORKFLOW FAILED:', err.message);
    process.exit(1);
  }
}

run();
