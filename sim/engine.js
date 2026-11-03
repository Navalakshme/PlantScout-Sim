// PlantScout - Process Simulation Engine
// Deterministic state machine, thermal dynamics, mass/volume conservation, and batch tracking.

export const PROCESS_STAGES = [
  { id: '01_standby', name: 'Standby / Pre-Start', desc: 'Plant idle, verifying utility readiness and safety interlocks.' },
  { id: '02_utility_checks', name: 'Utility Readiness Checks', desc: 'Instrument air, extraction ventilation, and cooling water circulating.' },
  { id: '03_charging', name: 'Raw Material Metering & Reactor Charging', desc: 'Pumping fatty acids and polyol, charging phthalic anhydride solids and solvent.' },
  { id: '04_mixing_heating', name: 'Agitation & Thermal-Fluid Heating', desc: 'Reactor agitator operating, hot thermal oil circulating through reactor jacket.' },
  { id: '05_reaction_recovery', name: 'Polymerisation & Overhead Water Separation', desc: 'Esterification reaction, vapour condensing in E-201, decanting water in V-201, solvent returning to R-101.' },
  { id: '06_endpoint_confirmation', name: 'Simulated Batch Endpoint Release', desc: 'Verifying simulated acid value (<15 mg KOH/g) and simulated viscosity release criteria.' },
  { id: '07_conditioning_transfer', name: 'Thermal Conditioning & Resin Transfer', desc: 'Cooling batch below transfer limit, pumping base resin via P-201 into blender BL-301.' },
  { id: '08_blending_cooling', name: 'Thinning, Blending & Product Cooling', desc: 'Adding thinning solvent, high-shear agitation, cooling water circulating through blender jacket.' },
  { id: '09_filtration', name: 'Polishing Filtration', desc: 'Pumping thinned resin via P-301 through filter F-301 to remove extraneous solids.' },
  { id: '10_product_holding', name: 'Finished Product Storage', desc: 'Buffering clear filtered resin in TK-401 ready for drum packaging.' },
  { id: '11_filling_packaging', name: 'Drum Filling & Container Handling', desc: 'Metered packaging via lance FL-401 onto scale WS-401 and roller conveyor CV-401.' },
  { id: '12_complete', name: 'Batch Cycle Complete', desc: 'Batch completed successfully, all transfer lines purged and isolated.' }
];

export class ProcessSimulationEngine {
  constructor(initialScenario = 'normal') {
    this.scenario = initialScenario; // 'normal' | 'defective'
    this.stageIndex = 0;
    this.stageElapsed = 0;
    this.stageDuration = 14; // seconds per stage in auto demo mode
    this.isAutoAdvancing = false;
    this.isPaused = false;
    this.isEmergencyStopped = false;

    // Batch Tracking
    this.batchReactor = 'Batch #B-109 (Alkyd Long-Oil FA)';
    this.batchDownstream = 'Batch #B-108 (Alkyd Enamel Base)';

    // Live State Variables (deterministic bookkeeping)
    this.levels = {
      'TK-101': 88.0,
      'TK-102': 84.0,
      'R-101': 0.0,
      'TK-201': 5.0,
      'BL-301': 0.0,
      'TK-401': 76.5, // Holds previous Batch #B-108 initially
      'S-901': 14.0
    };

    this.temperatures = {
      'R-101_proc': 24.0,
      'R-101_jkt': 24.0,
      'BL-301_proc': 24.0,
      'E-201_cond': 22.0,
      'E-201_cw': 20.0,
      'P-301_brg': 52.3, // Defect target
      'TF-601_sup': 240.0,
      'ambient': 23.5
    };

    this.pressures = {
      'V-701': 6.8,
      'P-103': 0.0,
      'F-301_in': 0.0,
      'F-301_out': 0.0,
      'F-301_dp': 0.0
    };

    this.flows = {
      'P-101': 0.0,
      'P-102': 0.0,
      'P-103': 0.0,
      'P-201': 0.0,
      'P-301': 0.0,
      'P-401': 0.0,
      'P-501': 28.5,
      'EX-901': 4600.0
    };

    this.speeds = {
      'AG-101': 0.0,
      'AG-301': 0.0,
      'EX-901': 1450.0
    };

    this.analyticals = {
      'acid_value': 88.0, // mg KOH/g
      'viscosity': 4.5,    // Stokes
      'reaction_water_kg': 0.0,
      'solids_percent': 100.0,
      'container_mass_kg': 18.5 // tare
    };

    this.qualityReleaseApproved = false;
    this.activeAlarms = [];
  }

  reset(scenario = 'normal') {
    this.scenario = scenario;
    this.stageIndex = 0;
    this.stageElapsed = 0;
    this.isAutoAdvancing = false;
    this.isPaused = false;
    this.isEmergencyStopped = false;
    this.qualityReleaseApproved = false;
    this.activeAlarms = [];

    this.batchReactor = 'Batch #B-109 (Alkyd Long-Oil FA)';
    this.batchDownstream = 'Batch #B-108 (Alkyd Enamel Base)';

    this.levels['TK-101'] = 88.0;
    this.levels['TK-102'] = 84.0;
    this.levels['R-101'] = 0.0;
    this.levels['TK-201'] = 5.0;
    this.levels['BL-301'] = 0.0;
    this.levels['TK-401'] = 76.5;
    this.levels['S-901'] = 14.0;

    this.temperatures['R-101_proc'] = 24.0;
    this.temperatures['R-101_jkt'] = 24.0;
    this.temperatures['BL-301_proc'] = 24.0;
    this.temperatures['E-201_cond'] = 22.0;
    this.temperatures['E-201_cw'] = 20.0;
    this.temperatures['P-301_brg'] = scenario === 'defective' ? 108.4 : 52.3;

    this.pressures['V-701'] = 6.8;
    this.pressures['P-103'] = 0.0;
    this.pressures['F-301_in'] = 0.0;
    this.pressures['F-301_out'] = 0.0;
    this.pressures['F-301_dp'] = 0.0;

    this.analyticals['acid_value'] = 88.0;
    this.analyticals['viscosity'] = 4.5;
    this.analyticals['reaction_water_kg'] = 0.0;
    this.analyticals['solids_percent'] = 100.0;
    this.analyticals['container_mass_kg'] = 18.5;
  }

  setStage(index) {
    if (index >= 0 && index < PROCESS_STAGES.length) {
      this.stageIndex = index;
      this.stageElapsed = 0;
    }
  }

  nextStage() {
    if (this.stageIndex < PROCESS_STAGES.length - 1) {
      this.setStage(this.stageIndex + 1);
    }
  }

  prevStage() {
    if (this.stageIndex > 0) {
      this.setStage(this.stageIndex - 1);
    }
  }

  triggerEmergencyStop() {
    this.isEmergencyStopped = true;
    this.flows['P-101'] = 0;
    this.flows['P-102'] = 0;
    this.flows['P-103'] = 0;
    this.flows['P-201'] = 0;
    this.flows['P-301'] = 0;
    this.flows['P-401'] = 0;
    this.speeds['AG-101'] = 0;
    this.speeds['AG-301'] = 0;
    this.activeAlarms.push({
      id: 'ALM-ESD-01',
      tag: 'ESD-901',
      severity: 'CRITICAL',
      message: 'EMERGENCY SHUTDOWN TRIPPED - All process pumps & drives isolated'
    });
  }

  resumeFromEmergencyStop() {
    this.isEmergencyStopped = false;
    this.activeAlarms = this.activeAlarms.filter(a => a.id !== 'ALM-ESD-01');
  }

  update(dt) {
    if (this.isPaused || this.isEmergencyStopped) return;

    this.stageElapsed += dt;

    if (this.isAutoAdvancing && this.stageElapsed >= this.stageDuration) {
      this.stageElapsed = 0;
      this.nextStage();
    }

    const stageId = PROCESS_STAGES[this.stageIndex].id;

    // Gradual approach helper: approaches target with time constant tau
    const approach = (val, target, tau) => val + (target - val) * Math.min(1.0, dt / tau);

    // --- State-Specific Dynamics & Permissives ---
    switch (stageId) {
      case '01_standby':
        this.flows['P-101'] = approach(this.flows['P-101'], 0, 1.0);
        this.flows['P-102'] = approach(this.flows['P-102'], 0, 1.0);
        this.flows['P-103'] = approach(this.flows['P-103'], 0, 1.0);
        this.flows['P-201'] = approach(this.flows['P-201'], 0, 1.0);
        this.flows['P-301'] = approach(this.flows['P-301'], 0, 1.0);
        this.flows['P-401'] = approach(this.flows['P-401'], 0, 1.0);
        this.speeds['AG-101'] = approach(this.speeds['AG-101'], 0, 2.0);
        this.speeds['AG-301'] = approach(this.speeds['AG-301'], 0, 2.0);
        this.temperatures['R-101_jkt'] = approach(this.temperatures['R-101_jkt'], 24.0, 10.0);
        this.temperatures['R-101_proc'] = approach(this.temperatures['R-101_proc'], 24.0, 15.0);
        break;

      case '02_utility_checks':
        this.pressures['V-701'] = approach(this.pressures['V-701'], 6.8, 2.0);
        this.flows['P-501'] = approach(this.flows['P-501'], 28.5, 3.0);
        this.flows['EX-901'] = approach(this.flows['EX-901'], 4600.0, 3.0);
        break;

      case '03_charging':
        // Metering pumps operate within permissives
        this.flows['P-101'] = approach(this.flows['P-101'], 4.8, 2.0);
        this.flows['P-102'] = approach(this.flows['P-102'], 3.6, 2.0);
        this.flows['P-103'] = approach(this.flows['P-103'], 2.0, 2.0); // Reflux solvent xylene

        // Mass / Volume Bookkeeping
        this.levels['TK-101'] = Math.max(20.0, this.levels['TK-101'] - dt * 2.2);
        this.levels['TK-102'] = Math.max(25.0, this.levels['TK-102'] - dt * 1.8);
        this.levels['R-101'] = Math.min(74.5, this.levels['R-101'] + dt * 4.2);
        break;

      case '04_mixing_heating':
        this.flows['P-101'] = approach(this.flows['P-101'], 0, 1.0);
        this.flows['P-102'] = approach(this.flows['P-102'], 0, 1.0);
        this.flows['P-103'] = approach(this.flows['P-103'], 0, 1.0);
        this.speeds['AG-101'] = approach(this.speeds['AG-101'], 95.0, 3.0);

        // Separate jacket thermal fluid circuit heats reactor contents
        this.temperatures['R-101_jkt'] = approach(this.temperatures['R-101_jkt'], 235.0, 6.0);
        this.temperatures['R-101_proc'] = approach(this.temperatures['R-101_proc'], 205.0, 8.0);
        break;

      case '05_reaction_recovery':
        this.speeds['AG-101'] = approach(this.speeds['AG-101'], 95.0, 2.0);
        this.temperatures['R-101_proc'] = approach(this.temperatures['R-101_proc'], 208.0, 4.0);
        this.temperatures['E-201_cond'] = approach(this.temperatures['E-201_cond'], 32.0, 3.0);

        // Water of reaction evolves, acid value falls, viscosity rises
        this.analyticals['acid_value'] = Math.max(12.4, this.analyticals['acid_value'] - dt * 4.5);
        this.analyticals['viscosity'] = Math.min(28.5, this.analyticals['viscosity'] + dt * 1.8);
        this.analyticals['reaction_water_kg'] = Math.min(312.0, this.analyticals['reaction_water_kg'] + dt * 18.0);
        this.levels['TK-201'] = Math.min(48.0, this.levels['TK-201'] + dt * 2.5);
        break;

      case '06_endpoint_confirmation':
        // Quality release state verified
        this.qualityReleaseApproved = true;
        this.analyticals['acid_value'] = 12.4;
        this.analyticals['viscosity'] = 28.5;
        this.speeds['AG-101'] = approach(this.speeds['AG-101'], 50.0, 2.0);
        break;

      case '07_conditioning_transfer':
        // Permissive: Cool below 130°C before transfer
        this.temperatures['R-101_jkt'] = approach(this.temperatures['R-101_jkt'], 90.0, 5.0);
        this.temperatures['R-101_proc'] = approach(this.temperatures['R-101_proc'], 122.0, 5.0);

        if (this.temperatures['R-101_proc'] <= 135.0) {
          // Transfer pump P-201 operates
          this.flows['P-201'] = approach(this.flows['P-201'], 12.5, 2.0);
          this.levels['R-101'] = Math.max(1.5, this.levels['R-101'] - dt * 5.0);
          this.levels['BL-301'] = Math.min(45.0, this.levels['BL-301'] + dt * 3.5);
        }
        break;

      case '08_blending_cooling':
        this.flows['P-201'] = approach(this.flows['P-201'], 0, 1.0);
        this.flows['P-103'] = approach(this.flows['P-103'], 4.5, 2.0); // Thinning solvent branch B
        this.speeds['AG-301'] = approach(this.speeds['AG-301'], 140.0, 2.0);

        // Blender cooling circuit
        this.temperatures['BL-301_proc'] = approach(this.temperatures['BL-301_proc'], 48.0, 6.0);
        this.levels['BL-301'] = Math.min(68.0, this.levels['BL-301'] + dt * 1.5);
        this.analyticals['solids_percent'] = approach(this.analyticals['solids_percent'], 60.2, 3.0);
        break;

      case '09_filtration':
        this.flows['P-103'] = approach(this.flows['P-103'], 0, 1.0);
        this.flows['P-301'] = approach(this.flows['P-301'], 8.5, 2.0);
        this.levels['BL-301'] = Math.max(2.0, this.levels['BL-301'] - dt * 4.2);
        this.levels['TK-401'] = Math.min(88.0, this.levels['TK-401'] + dt * 3.8);

        // Filter pressure dynamics
        if (this.scenario === 'defective') {
          // High differential pressure defect
          this.pressures['F-301_in'] = approach(this.pressures['F-301_in'], 3.85, 2.0);
          this.pressures['F-301_out'] = approach(this.pressures['F-301_out'], 1.00, 2.0);
          this.pressures['F-301_dp'] = 2.85; // Clogged!
          this.temperatures['P-301_brg'] = approach(this.temperatures['P-301_brg'], 108.4, 4.0); // Overheating!
        } else {
          // Normal clean filter
          this.pressures['F-301_in'] = approach(this.pressures['F-301_in'], 2.45, 2.0);
          this.pressures['F-301_out'] = approach(this.pressures['F-301_out'], 2.03, 2.0);
          this.pressures['F-301_dp'] = 0.42; // Normal
          this.temperatures['P-301_brg'] = approach(this.temperatures['P-301_brg'], 52.3, 3.0);
        }
        break;

      case '10_product_holding':
        this.flows['P-301'] = approach(this.flows['P-301'], 0, 1.0);
        this.pressures['F-301_in'] = approach(this.pressures['F-301_in'], 0, 1.0);
        this.pressures['F-301_out'] = approach(this.pressures['F-301_out'], 0, 1.0);
        this.pressures['F-301_dp'] = approach(this.pressures['F-301_dp'], 0, 1.0);
        // Batch in TK-401 now contains finished Batch #B-109
        this.batchDownstream = 'Batch #B-109 (Alkyd Long-Oil FA)';
        break;

      case '11_filling_packaging':
        this.flows['P-401'] = approach(this.flows['P-401'], 2.4, 2.0);
        this.levels['TK-401'] = Math.max(10.0, this.levels['TK-401'] - dt * 2.0);
        this.analyticals['container_mass_kg'] = Math.min(218.5, this.analyticals['container_mass_kg'] + dt * 14.5);
        break;

      case '12_complete':
        this.flows['P-401'] = approach(this.flows['P-401'], 0, 1.0);
        this.analyticals['container_mass_kg'] = 218.5;
        break;
    }

    // Ensure motor bearing temp defect persists if defective scenario
    if (this.scenario === 'defective') {
      this.temperatures['P-301_brg'] = approach(this.temperatures['P-301_brg'], 108.4, 3.0);
    } else {
      this.temperatures['P-301_brg'] = approach(this.temperatures['P-301_brg'], 52.3, 3.0);
    }

    // Evaluate live alarms
    this.updateAlarms();
  }

  updateAlarms() {
    const alarms = [];

    // Check P-301 Bearing Temp
    if (this.temperatures['P-301_brg'] >= 90.0) {
      alarms.push({
        id: 'ALM-P301-TT',
        tag: 'P-301.TT-BRG',
        equipment: 'P-301',
        severity: 'CRITICAL',
        type: 'Overtemperature Alarm',
        value: this.temperatures['P-301_brg'].toFixed(1) + ' °C',
        threshold: '90.0 °C',
        message: 'Blender-to-filter pump bearing temp critical (108.4 °C vs alarm 90.0 °C).'
      });
    } else if (this.temperatures['P-301_brg'] >= 75.0) {
      alarms.push({
        id: 'WRN-P301-TT',
        tag: 'P-301.TT-BRG',
        equipment: 'P-301',
        severity: 'WARNING',
        type: 'Temperature Warning',
        value: this.temperatures['P-301_brg'].toFixed(1) + ' °C',
        threshold: '75.0 °C',
        message: 'Blender-to-filter pump bearing temp warning.'
      });
    }

    // Check F-301 Differential Pressure
    if (this.pressures['F-301_dp'] >= 2.2) {
      alarms.push({
        id: 'ALM-F301-DPT',
        tag: 'F-301.DPT',
        equipment: 'F-301',
        severity: 'WARNING',
        type: 'Restricted Filter DP',
        value: this.pressures['F-301_dp'].toFixed(2) + ' bar',
        threshold: '2.20 bar',
        message: 'Polishing filter differential pressure restricted (2.85 bar vs alarm 2.20 bar).'
      });
    }

    this.activeAlarms = alarms;
  }

  getTelemetrySnapshot() {
    return {
      scenario: this.scenario,
      stage: PROCESS_STAGES[this.stageIndex],
      stageIndex: this.stageIndex,
      totalStages: PROCESS_STAGES.length,
      stageElapsed: +this.stageElapsed.toFixed(1),
      stageDuration: this.stageDuration,
      isAutoAdvancing: this.isAutoAdvancing,
      isPaused: this.isPaused,
      isEmergencyStopped: this.isEmergencyStopped,
      batchReactor: this.batchReactor,
      batchDownstream: this.batchDownstream,
      qualityReleaseApproved: this.qualityReleaseApproved,
      levels: { ...this.levels },
      temperatures: { ...this.temperatures },
      pressures: { ...this.pressures },
      flows: { ...this.flows },
      speeds: { ...this.speeds },
      analyticals: { ...this.analyticals },
      activeAlarms: [...this.activeAlarms]
    };
  }
}
