// PlantScout - Equipment Register
// Exact 37 assemblies for solvent-assisted batch alkyd-resin manufacture (fatty-acid route).

export const EQUIPMENT_REGISTER = [
  // --- Feed Preparation (Northwest, X -13 to -7.5, Z -5.5 to -3.5) ---
  {
    id: 'TK-101',
    name: 'Fatty-Acid Feed Vessel',
    group: 'Feed Preparation',
    subsystem: 'feed',
    position: [-12.0, 0, -5.5],
    dimensions: [1.2, 2.6, 1.2],
    viewpoint: [-12.0, -2.5],
    target: [-12.0, 1.3, -5.5],
    fn: 'Small feed vessel supplying liquid fatty acid (tall oil fatty acid) with level transmitter and containment curb.',
    ports: {
      outlet: [-12.0, 0.4, -4.9],
      vent: [-12.0, 2.7, -5.5]
    },
    instruments: [
      { tag: 'TK-101.LT-01', name: 'Level Transmitter', type: 'Level', unit: '%', normalMin: 15, normalMax: 95, warnMax: 98, alarmMax: 99, defaultVal: 85.0 },
      { tag: 'TK-101.TT-01', name: 'Liquid Temperature', type: 'Process Liquid Temp', unit: '°C', normalMin: 18, normalMax: 35, warnMax: 45, alarmMax: 55, defaultVal: 24.2 }
    ]
  },
  {
    id: 'TK-102',
    name: 'Liquid Polyol Feed Vessel',
    group: 'Feed Preparation',
    subsystem: 'feed',
    position: [-10.0, 0, -5.5],
    dimensions: [1.2, 2.6, 1.2],
    viewpoint: [-10.0, -2.5],
    target: [-10.0, 1.3, -5.5],
    fn: 'Dedicated vessel with its own supply line holding liquid polyol (glycerol / pentaerythritol solution).',
    ports: {
      outlet: [-10.0, 0.4, -4.9],
      vent: [-10.0, 2.7, -5.5]
    },
    instruments: [
      { tag: 'TK-102.LT-01', name: 'Level Transmitter', type: 'Level', unit: '%', normalMin: 15, normalMax: 95, warnMax: 98, alarmMax: 99, defaultVal: 80.0 },
      { tag: 'TK-102.TT-01', name: 'Liquid Temperature', type: 'Process Liquid Temp', unit: '°C', normalMin: 20, normalMax: 40, warnMax: 50, alarmMax: 60, defaultVal: 28.5 }
    ]
  },
  {
    id: 'H-101',
    name: 'Enclosed Solids Charging Station',
    group: 'Feed Preparation',
    subsystem: 'feed',
    position: [-8.4, 0, -5.5],
    dimensions: [1.1, 2.2, 1.1],
    viewpoint: [-8.4, -2.5],
    target: [-8.4, 1.5, -5.5],
    fn: 'Hopper and charging interface with an enclosed, flanged chute to the reactor for solid acid/anhydride (phthalic anhydride).',
    ports: {
      chute_out: [-7.8, 3.2, -5.2]
    },
    instruments: [
      { tag: 'H-101.WT-01', name: 'Charge Scale', type: 'Mass', unit: 'kg', normalMin: 0, normalMax: 1200, warnMax: 1250, alarmMax: 1300, defaultVal: 750.0 },
      { tag: 'H-101.ZS-01', name: 'Charging Gate Interlock', type: 'Interlock Status', unit: 'state', defaultVal: 'CLOSED' }
    ]
  },
  {
    id: 'AD-101',
    name: 'Minor-Addition Vessel',
    group: 'Feed Preparation',
    subsystem: 'feed',
    position: [-7.3, 0, -6.6],
    dimensions: [0.6, 1.6, 0.6],
    viewpoint: [-7.3, -2.5],
    target: [-7.3, 1.2, -6.6],
    fn: 'Small metered addition assembly with sight glass for controlled minor catalyst or modifier additions.',
    ports: {
      outlet: [-6.8, 2.8, -5.5]
    },
    instruments: [
      { tag: 'AD-101.LT-01', name: 'Addition Level', type: 'Level', unit: 'L', normalMin: 0, normalMax: 50, warnMax: 52, alarmMax: 55, defaultVal: 25.0 }
    ]
  },
  {
    id: 'P-101',
    name: 'Fatty-Acid Feed Pump',
    group: 'Feed Preparation',
    subsystem: 'feed',
    position: [-12.0, 0, -3.8],
    dimensions: [1.0, 0.8, 0.6],
    viewpoint: [-12.0, -2.3],
    target: [-12.0, 0.6, -3.8],
    fn: 'Motor, coupling guard, pump casing and flanged ports metering fatty acid from TK-101 to R-101.',
    ports: {
      suction: [-12.0, 0.4, -4.3],
      discharge: [-12.0, 0.7, -3.4]
    },
    instruments: [
      { tag: 'P-101.FT-01', name: 'Feed Flow', type: 'Flow Rate', unit: 'm3/h', normalMin: 0, normalMax: 6.0, warnMax: 7.0, alarmMax: 8.0, defaultVal: 0.0 },
      { tag: 'P-101.TT-BRG', name: 'Motor Bearing Temp', type: 'Bearing Temp', unit: '°C', normalMin: 20, normalMax: 65, warnMax: 75, alarmMax: 90, defaultVal: 48.0 }
    ]
  },
  {
    id: 'P-102',
    name: 'Polyol Feed Pump',
    group: 'Feed Preparation',
    subsystem: 'feed',
    position: [-10.0, 0, -3.8],
    dimensions: [1.0, 0.8, 0.6],
    viewpoint: [-10.0, -2.3],
    target: [-10.0, 0.6, -3.8],
    fn: 'Dedicated polyol feed pump transferring polyol from TK-102 to R-101.',
    ports: {
      suction: [-10.0, 0.4, -4.3],
      discharge: [-10.0, 0.7, -3.4]
    },
    instruments: [
      { tag: 'P-102.FT-01', name: 'Feed Flow', type: 'Flow Rate', unit: 'm3/h', normalMin: 0, normalMax: 5.0, warnMax: 6.0, alarmMax: 7.0, defaultVal: 0.0 },
      { tag: 'P-102.TT-BRG', name: 'Motor Bearing Temp', type: 'Bearing Temp', unit: '°C', normalMin: 20, normalMax: 65, warnMax: 75, alarmMax: 90, defaultVal: 47.5 }
    ]
  },
  {
    id: 'P-103',
    name: 'Solvent Supply Pump/Interface',
    group: 'Feed Preparation',
    subsystem: 'feed',
    position: [-8.4, 0, -3.8],
    dimensions: [1.0, 0.8, 0.6],
    viewpoint: [-8.4, -2.3],
    target: [-8.4, 0.6, -3.8],
    fn: 'Controlled solvent supply receiving reflux solvent (xylene) from external solvent storage to manifold branches A (reactor) & B (blender).',
    ports: {
      suction: [-8.4, 0.4, -4.3],
      discharge: [-8.4, 0.7, -3.4]
    },
    instruments: [
      { tag: 'P-103.FT-01', name: 'Solvent Supply Flow', type: 'Flow Rate', unit: 'm3/h', normalMin: 0, normalMax: 8.0, warnMax: 9.0, alarmMax: 10.0, defaultVal: 0.0 },
      { tag: 'P-103.PT-01', name: 'Manifold Pressure', type: 'Pressure', unit: 'bar', normalMin: 1.5, normalMax: 4.0, warnMax: 5.0, alarmMax: 6.0, defaultVal: 2.8 }
    ]
  },

  // --- Reaction Area (North, around X -6.0, Z -5.0) ---
  {
    id: 'R-101',
    name: 'Jacketed Alkyd Reactor',
    group: 'Reaction',
    subsystem: 'reaction',
    position: [-6.0, 0, -5.0],
    dimensions: [2.4, 4.4, 2.4],
    viewpoint: [-6.0, -2.5],
    target: [-6.0, 2.4, -5.0],
    fn: 'Main reaction vessel with thermal-fluid jacket, bottom outlet, instrument nozzles, and sight glasses.',
    ports: {
      fatty_acid_in: [-6.8, 3.8, -4.8],
      polyol_in: [-6.5, 3.8, -4.6],
      solids_in: [-6.2, 4.0, -4.5],
      addition_in: [-5.7, 3.8, -4.6],
      solvent_in: [-5.4, 3.8, -4.8],
      vapour_out: [-6.0, 4.4, -5.0],
      solvent_return_in: [-5.7, 3.5, -5.4],
      jacket_in: [-6.9, 1.2, -5.2],
      jacket_out: [-5.1, 2.6, -5.2],
      bottom_out: [-6.0, 0.5, -5.0],
      relief_out: [-6.0, 4.6, -5.2]
    },
    instruments: [
      { tag: 'R-101.TT-01', name: 'Process Liquid Temp', type: 'Process Liquid Temp', unit: '°C', normalMin: 20, normalMax: 235, warnMax: 245, alarmMax: 255, defaultVal: 205.0 },
      { tag: 'R-101.TT-JKT', name: 'Jacket Return Temp', type: 'Jacket Temp', unit: '°C', normalMin: 20, normalMax: 250, warnMax: 260, alarmMax: 270, defaultVal: 220.0 },
      { tag: 'R-101.LT-01', name: 'Reactor Level', type: 'Level', unit: '%', normalMin: 5, normalMax: 85, warnMax: 90, alarmMax: 95, defaultVal: 72.0 },
      { tag: 'R-101.PT-01', name: 'Internal Pressure', type: 'Pressure', unit: 'mbar', normalMin: -20, normalMax: 150, warnMax: 250, alarmMax: 400, defaultVal: 15.0 },
      { tag: 'R-101.AV-SIM', name: 'Simulated Acid Value', type: 'Analytical (Simulated)', unit: 'mg KOH/g', normalMin: 5.0, normalMax: 25.0, warnMax: 35.0, alarmMax: 50.0, defaultVal: 12.4 },
      { tag: 'R-101.VISC-SIM', name: 'Simulated Viscosity', type: 'Analytical (Simulated)', unit: 'Stokes', normalMin: 18.0, normalMax: 36.0, warnMax: 42.0, alarmMax: 50.0, defaultVal: 28.5 }
    ]
  },
  {
    id: 'AG-101',
    name: 'Reactor Agitator Drive',
    group: 'Reaction',
    subsystem: 'reaction',
    position: [-6.0, 4.5, -5.0],
    dimensions: [0.8, 1.2, 0.8],
    viewpoint: [-6.0, -2.5],
    target: [-6.0, 4.8, -5.0],
    fn: 'Explosion-proof electric motor, reduction gearbox and double mechanical seal driving internal turbine impellers.',
    ports: {},
    instruments: [
      { tag: 'AG-101.ST-01', name: 'Agitator Speed', type: 'Speed', unit: 'RPM', normalMin: 0, normalMax: 125, warnMax: 135, alarmMax: 150, defaultVal: 95.0 },
      { tag: 'AG-101.TT-BRG', name: 'Gearbox Temp', type: 'Bearing Temp', unit: '°C', normalMin: 20, normalMax: 68, warnMax: 78, alarmMax: 90, defaultVal: 54.0 }
    ]
  },

  // --- Overhead Recovery System (North, behind R-101, elevated for gravity flow) ---
  {
    id: 'E-201',
    name: 'Main Overhead Condenser',
    group: 'Overhead Recovery',
    subsystem: 'recovery',
    position: [-6.0, 4.7, -7.0],
    dimensions: [2.2, 0.8, 0.8],
    viewpoint: [-6.0, -2.5],
    target: [-6.0, 4.7, -7.0],
    fn: 'Horizontal shell-and-tube condenser with separate process vapour and cooling water circuits.',
    ports: {
      vapour_in: [-6.0, 5.0, -6.3],
      condensate_out: [-6.0, 4.3, -7.6],
      coolant_in: [-6.8, 4.6, -7.0],
      coolant_out: [-5.2, 4.9, -7.0]
    },
    instruments: [
      { tag: 'E-201.TT-COND-OUT', name: 'Condensate Outlet Temp', type: 'Process Liquid Temp', unit: '°C', normalMin: 20, normalMax: 45, warnMax: 55, alarmMax: 65, defaultVal: 32.0 },
      { tag: 'E-201.TT-CW-OUT', name: 'Coolant Return Temp', type: 'Coolant Temp', unit: '°C', normalMin: 15, normalMax: 35, warnMax: 42, alarmMax: 50, defaultVal: 27.5 }
    ]
  },
  {
    id: 'V-201',
    name: 'Condensate Phase Separator (Decanter)',
    group: 'Overhead Recovery',
    subsystem: 'recovery',
    position: [-6.0, 3.1, -7.6],
    dimensions: [1.6, 0.9, 0.8],
    viewpoint: [-6.0, -2.5],
    target: [-6.0, 3.1, -7.6],
    fn: 'Horizontal decanter separator separating upper solvent-rich phase (returns by gravity to R-101) from lower aqueous reaction water (drains to TK-201).',
    ports: {
      condensate_in: [-6.0, 3.7, -7.6],
      solvent_out: [-5.6, 3.2, -7.4],
      water_out: [-6.0, 2.5, -7.6],
      vent_out: [-6.0, 3.8, -7.6]
    },
    instruments: [
      { tag: 'V-201.LT-SOLV', name: 'Solvent Interface Level', type: 'Level', unit: 'mm', normalMin: 120, normalMax: 280, warnMax: 320, alarmMax: 360, defaultVal: 210.0 },
      { tag: 'V-201.LT-AQU', name: 'Water Interface Level', type: 'Level', unit: 'mm', normalMin: 40, normalMax: 160, warnMax: 190, alarmMax: 220, defaultVal: 95.0 }
    ]
  },
  {
    id: 'TK-201',
    name: 'Closed Reaction-Water Receiver',
    group: 'Overhead Recovery',
    subsystem: 'recovery',
    position: [-4.0, 0, -7.2],
    dimensions: [1.2, 2.4, 1.2],
    viewpoint: [-4.0, -2.5],
    target: [-4.0, 1.2, -7.2],
    fn: 'Closed vertical receiving vessel accumulating separated water of reaction prior to waste neutralization.',
    ports: {
      water_in: [-4.0, 2.3, -7.2],
      transfer_out: [-4.0, 0.4, -6.6],
      vent: [-4.0, 2.5, -7.2]
    },
    instruments: [
      { tag: 'TK-201.LT-01', name: 'Receiver Level', type: 'Level', unit: '%', normalMin: 5, normalMax: 85, warnMax: 90, alarmMax: 95, defaultVal: 44.0 },
      { tag: 'TK-201.WT-01', name: 'Accumulated Water Mass', type: 'Mass', unit: 'kg', normalMin: 0, normalMax: 800, warnMax: 850, alarmMax: 900, defaultVal: 312.0 }
    ]
  },
  {
    id: 'E-202',
    name: 'Vent Condenser',
    group: 'Overhead Recovery',
    subsystem: 'recovery',
    position: [-5.0, 4.4, -8.0],
    dimensions: [1.4, 0.6, 0.6],
    viewpoint: [-5.0, -2.5],
    target: [-5.0, 4.4, -8.0],
    fn: 'Secondary vapour condenser knocking down residual solvent before non-condensable process vent leads to external boundary.',
    ports: {
      vent_in: [-5.6, 4.2, -8.0],
      vent_out: [-4.4, 4.7, -8.0],
      coolant_in: [-5.2, 4.1, -8.0],
      coolant_out: [-4.8, 4.7, -8.0]
    },
    instruments: [
      { tag: 'E-202.TT-VENT', name: 'Vent Exit Temp', type: 'Vent Temp', unit: '°C', normalMin: 10, normalMax: 25, warnMax: 32, alarmMax: 40, defaultVal: 18.2 }
    ]
  },

  // --- Intermediate Transfer & Blending (North, around X 1.0, Z -5.0) ---
  {
    id: 'P-201',
    name: 'Reactor-to-Blender Transfer Pump',
    group: 'Transfer',
    subsystem: 'transfer',
    position: [-2.8, 0, -4.5],
    dimensions: [1.0, 0.8, 0.6],
    viewpoint: [-2.8, -2.5],
    target: [-2.8, 0.6, -4.5],
    fn: 'Centrifugal resin transfer pump moving conditioned alkyd base from R-101 to thinning/blending vessel BL-301.',
    ports: {
      suction: [-3.4, 0.4, -4.5],
      discharge: [-2.2, 0.7, -4.5]
    },
    instruments: [
      { tag: 'P-201.FT-01', name: 'Transfer Flow', type: 'Flow Rate', unit: 'm3/h', normalMin: 0, normalMax: 15.0, warnMax: 18.0, alarmMax: 20.0, defaultVal: 0.0 },
      { tag: 'P-201.TT-BRG', name: 'Motor Bearing Temp', type: 'Bearing Temp', unit: '°C', normalMin: 20, normalMax: 68, warnMax: 75, alarmMax: 90, defaultVal: 50.4 }
    ]
  },
  {
    id: 'BL-301',
    name: 'Thinning & Blending Vessel',
    group: 'Blending',
    subsystem: 'blending',
    position: [1.0, 0, -5.0],
    dimensions: [2.2, 3.8, 2.2],
    viewpoint: [1.0, -2.5],
    target: [1.0, 2.0, -5.0],
    fn: 'Jacketed vessel equipped with high-efficiency cooling jacket and agitator for thinning resin with mineral spirits/xylene.',
    ports: {
      resin_in: [0.3, 3.8, -4.8],
      solvent_in: [0.7, 3.8, -4.6],
      bottom_out: [1.0, 0.5, -5.0],
      jacket_in: [0.2, 1.0, -5.2],
      jacket_out: [1.8, 2.5, -5.2]
    },
    instruments: [
      { tag: 'BL-301.TT-01', name: 'Blender Liquid Temp', type: 'Process Liquid Temp', unit: '°C', normalMin: 20, normalMax: 65, warnMax: 75, alarmMax: 85, defaultVal: 48.0 },
      { tag: 'BL-301.LT-01', name: 'Blender Level', type: 'Level', unit: '%', normalMin: 5, normalMax: 90, warnMax: 94, alarmMax: 98, defaultVal: 65.0 },
      { tag: 'BL-301.SOLIDS-SIM', name: 'Simulated Non-Volatiles (Solids)', type: 'Analytical (Simulated)', unit: '%', normalMin: 58.0, normalMax: 62.0, warnMax: 65.0, alarmMax: 70.0, defaultVal: 60.2 }
    ]
  },
  {
    id: 'AG-301',
    name: 'Blender Agitator Drive',
    group: 'Blending',
    subsystem: 'blending',
    position: [1.0, 4.0, -5.0],
    dimensions: [0.7, 1.1, 0.7],
    viewpoint: [1.0, -2.5],
    target: [1.0, 4.3, -5.0],
    fn: 'Electric motor and high-torque gearbox driving the thinning and homogenisation impeller in BL-301.',
    ports: {},
    instruments: [
      { tag: 'AG-301.ST-01', name: 'Agitator Speed', type: 'Speed', unit: 'RPM', normalMin: 0, normalMax: 180, warnMax: 195, alarmMax: 210, defaultVal: 140.0 },
      { tag: 'AG-301.TT-BRG', name: 'Motor Bearing Temp', type: 'Bearing Temp', unit: '°C', normalMin: 20, normalMax: 65, warnMax: 75, alarmMax: 90, defaultVal: 51.0 }
    ]
  },

  // --- Filtration Skid (North, around X 5.0, Z -5.0) ---
  {
    id: 'P-301',
    name: 'Blender-to-Filter Pump',
    group: 'Filtration',
    subsystem: 'filtration',
    position: [3.5, 0, -4.5],
    dimensions: [1.0, 0.8, 0.6],
    viewpoint: [3.5, -2.5],
    target: [3.5, 0.6, -4.5],
    fn: 'Dedicated filtration feed pump moving thinned resin solution from BL-301 through polishing filter F-301.',
    ports: {
      suction: [2.9, 0.4, -4.5],
      discharge: [4.1, 0.7, -4.5]
    },
    instruments: [
      { tag: 'P-301.FT-01', name: 'Filter Feed Flow', type: 'Flow Rate', unit: 'm3/h', normalMin: 0, normalMax: 12.0, warnMax: 14.0, alarmMax: 16.0, defaultVal: 8.5 },
      // NOTICE: P-301.TT-BRG is the target for defect injection in Scenario 2 (108.4 °C vs warn 75 °C, alarm 90 °C)
      { tag: 'P-301.TT-BRG', name: 'Pump Bearing Temp', type: 'Bearing Temp', unit: '°C', normalMin: 20, normalMax: 65, warnMax: 75, alarmMax: 90, defaultVal: 52.3 }
    ]
  },
  {
    id: 'F-301',
    name: 'Polishing Filter Skid',
    group: 'Filtration',
    subsystem: 'filtration',
    position: [5.5, 0, -5.0],
    dimensions: [1.0, 2.2, 1.0],
    viewpoint: [5.5, -2.5],
    target: [5.5, 1.3, -5.0],
    fn: 'Recognisable cylindrical filter vessel with quick-opening swing-bolt lid, internal basket/filter bag, inlet/outlet pressure gauges and differential pressure transmitter.',
    ports: {
      inlet: [4.9, 1.1, -5.0],
      outlet: [6.1, 1.1, -5.0]
    },
    instruments: [
      { tag: 'F-301.PT-IN', name: 'Filter Inlet Pressure', type: 'Pressure', unit: 'bar', normalMin: 1.5, normalMax: 3.5, warnMax: 4.5, alarmMax: 5.5, defaultVal: 2.45 },
      { tag: 'F-301.PT-OUT', name: 'Filter Outlet Pressure', type: 'Pressure', unit: 'bar', normalMin: 1.0, normalMax: 3.0, warnMax: 4.0, alarmMax: 5.0, defaultVal: 2.03 },
      // NOTICE: F-301.DPT is the differential pressure (Inlet - Outlet). Normal: ~0.42 bar. Defect: 2.85 bar!
      { tag: 'F-301.DPT', name: 'Filter Differential Pressure', type: 'Differential Pressure', unit: 'bar', normalMin: 0.1, normalMax: 0.8, warnMax: 1.5, alarmMax: 2.2, defaultVal: 0.42 }
    ]
  },

  // --- Product Holding (North, around X 8.5, Z -5.0) ---
  {
    id: 'TK-401',
    name: 'Finished-Product Storage Tank',
    group: 'Product Holding',
    subsystem: 'storage',
    position: [8.5, 0, -5.0],
    dimensions: [2.2, 4.0, 2.2],
    viewpoint: [8.5, -2.5],
    target: [8.5, 2.0, -5.0],
    fn: 'Vertical 304 stainless steel product storage tank buffering clean, filtered alkyd resin solution prior to packaging.',
    ports: {
      inlet: [7.8, 3.8, -5.0],
      outlet: [8.5, 0.5, -4.4],
      vent: [8.5, 4.2, -5.0]
    },
    instruments: [
      { tag: 'TK-401.LT-01', name: 'Product Tank Level', type: 'Level', unit: '%', normalMin: 10, normalMax: 90, warnMax: 95, alarmMax: 98, defaultVal: 76.5 },
      { tag: 'TK-401.TT-01', name: 'Product Temperature', type: 'Process Liquid Temp', unit: '°C', normalMin: 15, normalMax: 40, warnMax: 50, alarmMax: 60, defaultVal: 26.0 }
    ]
  },

  // --- Packaging & Filling (Northeast, X 10.5 to 14.0, Z -4.5) ---
  {
    id: 'P-401',
    name: 'Product Filling Pump',
    group: 'Packaging',
    subsystem: 'packaging',
    position: [10.5, 0, -4.5],
    dimensions: [1.0, 0.8, 0.6],
    viewpoint: [10.5, -2.5],
    target: [10.5, 0.6, -4.5],
    fn: 'Positive transfer pump moving finished alkyd resin from TK-401 to packaging filling lance.',
    ports: {
      suction: [9.9, 0.4, -4.5],
      discharge: [11.1, 0.7, -4.5]
    },
    instruments: [
      { tag: 'P-401.FT-01', name: 'Packaging Feed Flow', type: 'Flow Rate', unit: 'm3/h', normalMin: 0, normalMax: 6.0, warnMax: 7.0, alarmMax: 8.0, defaultVal: 2.4 },
      { tag: 'P-401.TT-BRG', name: 'Motor Bearing Temp', type: 'Bearing Temp', unit: '°C', normalMin: 20, normalMax: 65, warnMax: 75, alarmMax: 90, defaultVal: 46.8 }
    ]
  },
  {
    id: 'FL-401',
    name: 'Filling Station',
    group: 'Packaging',
    subsystem: 'packaging',
    position: [12.5, 0, -4.5],
    dimensions: [1.2, 2.6, 1.2],
    viewpoint: [12.5, -2.5],
    target: [12.5, 1.4, -4.5],
    fn: 'Subsurface filling lance support mast, pneumatic shut-off valve and vapor recovery shroud.',
    ports: {
      lance_in: [12.0, 2.5, -4.5],
      lance_tip: [12.5, 1.1, -4.5]
    },
    instruments: [
      { tag: 'FL-401.ZS-01', name: 'Lance Elevation', type: 'Position Status', unit: 'state', defaultVal: 'DOWN' },
      { tag: 'FL-401.XV-01', name: 'Filling Valve', type: 'Valve Status', unit: 'state', defaultVal: 'METERING' }
    ]
  },
  {
    id: 'WS-401',
    name: 'Weighing Platform',
    group: 'Packaging',
    subsystem: 'packaging',
    position: [12.5, 0, -4.5],
    dimensions: [1.0, 0.15, 1.0],
    viewpoint: [12.5, -2.5],
    target: [12.5, 0.2, -4.5],
    fn: 'Heavy-duty digital scale load cell platform positioned below the container during filling.',
    ports: {},
    instruments: [
      { tag: 'WS-401.WT-01', name: 'Container Gross Mass', type: 'Mass', unit: 'kg', normalMin: 18.0, normalMax: 225.0, warnMax: 228.0, alarmMax: 232.0, defaultVal: 184.2 }
    ]
  },
  {
    id: 'CV-401',
    name: 'Container Roller Station',
    group: 'Packaging',
    subsystem: 'packaging',
    position: [14.0, 0, -4.5],
    dimensions: [1.6, 0.6, 1.0],
    viewpoint: [14.0, -2.5],
    target: [14.0, 0.6, -4.5],
    fn: 'Gravity roller conveyor section transferring filled steel drums to staging pallets. Passive mechanical handling.',
    ports: {},
    instruments: [
      { tag: 'CV-401.PE-01', name: 'Roller Drum Presence', type: 'Sensor Status', unit: 'state', defaultVal: 'PRESENT' }
    ]
  },

  // --- Utility Skid Interfaces (Southwest, X -13.5 to -5.0, Z 3.0 to 6.5) ---
  {
    id: 'P-501',
    name: 'Cooling-Water Circulation Interface',
    group: 'Utilities',
    subsystem: 'utility',
    position: [-12.0, 0, 5.5],
    dimensions: [1.2, 0.9, 0.8],
    viewpoint: [-12.0, 3.5],
    target: [-12.0, 0.7, 5.5],
    fn: 'Cooling water recirculation pump taking coolant from external boundary header through utility exchangers and jackets.',
    ports: {
      suction: [-12.6, 0.4, 5.5],
      discharge: [-11.4, 0.8, 5.5]
    },
    instruments: [
      { tag: 'P-501.FT-01', name: 'Cooling Water Flow', type: 'Flow Rate', unit: 'm3/h', normalMin: 10.0, normalMax: 45.0, warnMax: 50.0, alarmMax: 55.0, defaultVal: 28.5 },
      { tag: 'P-501.PT-01', name: 'Cooling Supply Pressure', type: 'Pressure', unit: 'bar', normalMin: 2.5, normalMax: 4.5, warnMax: 5.5, alarmMax: 6.0, defaultVal: 3.6 }
    ]
  },
  {
    id: 'HX-501',
    name: 'Utility Heat Exchanger',
    group: 'Utilities',
    subsystem: 'utility',
    position: [-9.5, 0, 5.5],
    dimensions: [1.8, 1.6, 1.0],
    viewpoint: [-9.5, 3.5],
    target: [-9.5, 1.2, 5.5],
    fn: 'Plate-and-frame heat exchanger with tie rods and four separate flanged nozzles for plant cooling water isolation.',
    ports: {
      process_cw_in: [-10.2, 0.9, 5.5],
      process_cw_out: [-10.2, 1.8, 5.5],
      tower_cw_in: [-8.8, 0.9, 5.5],
      tower_cw_out: [-8.8, 1.8, 5.5]
    },
    instruments: [
      { tag: 'HX-501.TT-IN', name: 'Primary Coolant Inlet', type: 'Coolant Temp', unit: '°C', normalMin: 12, normalMax: 26, warnMax: 30, alarmMax: 35, defaultVal: 18.0 },
      { tag: 'HX-501.TT-OUT', name: 'Secondary Coolant Outlet', type: 'Coolant Temp', unit: '°C', normalMin: 18, normalMax: 34, warnMax: 38, alarmMax: 42, defaultVal: 24.5 }
    ]
  },
  {
    id: 'TF-601',
    name: 'Thermal-Fluid Boundary',
    group: 'Utilities',
    subsystem: 'utility',
    position: [-13.8, 1.5, 3.0],
    dimensions: [0.6, 2.0, 1.4],
    viewpoint: [-12.0, 3.0],
    target: [-13.8, 1.5, 3.0],
    fn: 'Insulated wall penetration terminal connecting external fuel-fired thermal oil furnace to the R-101 jacket circuit.',
    ports: {
      supply: [-13.7, 2.0, 3.0],
      return: [-13.7, 1.2, 3.0]
    },
    instruments: [
      { tag: 'TF-601.TT-SUP', name: 'Thermal Fluid Supply Temp', type: 'Thermal Fluid Temp', unit: '°C', normalMin: 210, normalMax: 260, warnMax: 275, alarmMax: 290, defaultVal: 240.0 },
      { tag: 'TF-601.TT-RET', name: 'Thermal Fluid Return Temp', type: 'Thermal Fluid Temp', unit: '°C', normalMin: 180, normalMax: 235, warnMax: 250, alarmMax: 265, defaultVal: 215.0 },
      { tag: 'TF-601.PT-01', name: 'Thermal Loop Pressure', type: 'Pressure', unit: 'bar', normalMin: 2.0, normalMax: 4.5, warnMax: 5.5, alarmMax: 6.5, defaultVal: 3.2 }
    ]
  },
  {
    id: 'AC-701',
    name: 'Instrument-Air Package',
    group: 'Utilities',
    subsystem: 'utility',
    position: [-7.0, 0, 6.0],
    dimensions: [1.8, 1.4, 1.2],
    viewpoint: [-7.0, 3.5],
    target: [-7.0, 1.0, 6.0],
    fn: 'Sound-attenuated rotary screw air compressor package with intake louvre, aftercooler and refrigeration dryer.',
    ports: {
      outlet: [-6.2, 1.2, 6.0]
    },
    instruments: [
      { tag: 'AC-701.PT-01', name: 'Compressor Discharge Pressure', type: 'Pressure', unit: 'bar', normalMin: 6.5, normalMax: 8.5, warnMax: 9.0, alarmMax: 9.5, defaultVal: 7.4 },
      { tag: 'AC-701.ST-01', name: 'Compressor State', type: 'Operating State', unit: 'state', defaultVal: 'LOADED' }
    ]
  },
  {
    id: 'V-701',
    name: 'Air Receiver',
    group: 'Utilities',
    subsystem: 'utility',
    position: [-5.0, 0, 6.0],
    dimensions: [1.0, 2.5, 1.0],
    viewpoint: [-5.0, 3.5],
    target: [-5.0, 1.5, 6.0],
    fn: 'Vertical steel compressed air buffer receiver with ASME safety relief valve, condensate auto-drain and pneumatic header manifold.',
    ports: {
      inlet: [-5.5, 1.2, 6.0],
      outlet: [-4.5, 2.2, 6.0]
    },
    instruments: [
      { tag: 'V-701.PT-01', name: 'Air Header Pressure', type: 'Pressure', unit: 'bar', normalMin: 6.0, normalMax: 7.5, warnMin: 5.5, alarmMin: 4.8, defaultVal: 6.8 }
    ]
  },

  // --- Electrical & Automation (South, X 3.5 to 8.5, Z 6.5) ---
  {
    id: 'MCC-801',
    name: 'Motor-Control Centre',
    group: 'Electrical',
    subsystem: 'electrical',
    position: [4.5, 0, 6.5],
    dimensions: [2.8, 2.2, 0.8],
    viewpoint: [4.5, 3.5],
    target: [4.5, 1.4, 6.5],
    fn: 'Floor-standing low-voltage switchgear suite housing pump starters, variable frequency drives, and power distribution.',
    ports: {},
    instruments: [
      { tag: 'MCC-801.TT-CAB', name: 'Enclosure Temp', type: 'Cabinet Temp', unit: '°C', normalMin: 18, normalMax: 35, warnMax: 42, alarmMax: 50, defaultVal: 27.8 },
      { tag: 'MCC-801.VT-01', name: 'Main Bus Voltage', type: 'Electrical', unit: 'V', normalMin: 380, normalMax: 415, warnMax: 425, alarmMax: 440, defaultVal: 401.0 }
    ]
  },
  {
    id: 'PLC-801',
    name: 'Process Control Station',
    group: 'Electrical',
    subsystem: 'electrical',
    position: [7.5, 0, 6.5],
    dimensions: [2.0, 1.8, 0.9],
    viewpoint: [7.5, 3.5],
    target: [7.5, 1.2, 6.5],
    fn: 'Central automation rack and operator console monitoring batch permissives, alarms, and safety interlocks.',
    ports: {},
    instruments: [
      { tag: 'PLC-801.SYS-STAT', name: 'Controller Health', type: 'System Status', unit: 'state', defaultVal: 'RUNNING_OK' },
      { tag: 'PLC-801.ALM-CNT', name: 'Active Alarms', type: 'Alarm Count', unit: 'count', normalMin: 0, normalMax: 0, warnMax: 2, alarmMax: 5, defaultVal: 0 }
    ]
  },

  // --- Ventilation & Containment (Southeast, X 10.0 to 14.0, Z 3.0 to 6.5) ---
  {
    id: 'EX-901',
    name: 'Room Extraction Assembly',
    group: 'Ventilation',
    subsystem: 'ventilation',
    position: [10.5, 0, 6.0],
    dimensions: [1.8, 2.2, 1.4],
    viewpoint: [10.5, 3.5],
    target: [10.5, 1.4, 6.0],
    fn: 'Explosion-proof centrifugal extraction fan maintaining negative pressure in the basement with duct discharge to external treatment.',
    ports: {
      duct_in: [10.0, 1.8, 6.0],
      discharge_out: [11.2, 3.2, 6.0]
    },
    instruments: [
      { tag: 'EX-901.FT-01', name: 'Extract Airflow', type: 'Airflow Rate', unit: 'm3/h', normalMin: 3500, normalMax: 5500, warnMin: 3000, alarmMin: 2500, defaultVal: 4600.0 },
      { tag: 'EX-901.DP-01', name: 'Duct Differential Pressure', type: 'Differential Pressure', unit: 'Pa', normalMin: 180, normalMax: 350, warnMin: 120, alarmMin: 80, defaultVal: 240.0 }
    ]
  },
  {
    id: 'S-901',
    name: 'Contained Collection Sump',
    group: 'Containment',
    subsystem: 'containment',
    position: [13.0, 0, 3.5],
    dimensions: [1.8, 0.4, 1.4],
    viewpoint: [13.0, 1.5],
    target: [13.0, 0.1, 3.5],
    fn: 'Recessed floor containment pit with galvanized steel bar grating and level sensor for isolated spill collection.',
    ports: {
      suction: [13.0, -0.3, 3.5]
    },
    instruments: [
      { tag: 'S-901.LT-01', name: 'Sump Level', type: 'Level', unit: '%', normalMin: 0, normalMax: 35, warnMax: 60, alarmMax: 80, defaultVal: 14.2 }
    ]
  },
  {
    id: 'P-901',
    name: 'Sump Transfer Pump',
    group: 'Containment',
    subsystem: 'containment',
    position: [13.0, 0, 5.0],
    dimensions: [0.9, 0.7, 0.6],
    viewpoint: [13.0, 3.5],
    target: [13.0, 0.5, 5.0],
    fn: 'Self-priming waste transfer pump pumping collected drainage from sump S-901 to external industrial wastewater boundary.',
    ports: {
      suction: [13.0, 0.3, 4.2],
      discharge: [13.5, 0.7, 5.0]
    },
    instruments: [
      { tag: 'P-901.ST-01', name: 'Pump State', type: 'Operating State', unit: 'state', defaultVal: 'STANDBY' }
    ]
  },

  // --- Safety & Access (Distributed & South Doorway) ---
  {
    id: 'GD-901',
    name: 'Gas-Detector Assemblies',
    group: 'Safety',
    subsystem: 'safety',
    position: [-6.0, 1.5, -3.0], // Main sensor head in reaction zone, others distributed
    dimensions: [0.3, 0.4, 0.2],
    viewpoint: [-6.0, -1.5],
    target: [-6.0, 1.5, -3.0],
    fn: 'Field solvent vapour gas detector sensor heads (optical/catalytic LEL sensors) monitoring lower explosive limit.',
    ports: {},
    instruments: [
      { tag: 'GD-901.AT-01', name: 'Solvent Vapour Concentration', type: 'Gas Concentration', unit: '% LEL', normalMin: 0, normalMax: 5, warnMax: 10, alarmMax: 20, defaultVal: 0.8 }
    ]
  },
  {
    id: 'ESD-901',
    name: 'Emergency Isolation Station',
    group: 'Safety',
    subsystem: 'safety',
    position: [-1.2, 1.5, 8.8],
    dimensions: [0.4, 0.6, 0.25],
    viewpoint: [-1.2, 7.0],
    target: [-1.2, 1.5, 8.8],
    fn: 'Wall-mounted emergency isolation push-button station with high-visibility yellow/red enclosure and lock-out switch.',
    ports: {},
    instruments: [
      { tag: 'ESD-901.ZS-01', name: 'E-Stop Circuit State', type: 'Safety Interlock', unit: 'state', defaultVal: 'ARMED' }
    ]
  },
  {
    id: 'DOOR-001',
    name: 'Entrance Assembly',
    group: 'Access',
    subsystem: 'access',
    position: [0.0, 0, 9.5],
    dimensions: [1.8, 2.6, 0.3],
    viewpoint: [0.0, 7.5],
    target: [0.0, 1.4, 9.5],
    fn: 'Fire/gas-rated industrial personnel entrance door with magnetic interlock and emergency push-bar.',
    ports: {},
    instruments: [
      { tag: 'DOOR-001.ZS-01', name: 'Door Position', type: 'Access Status', unit: 'state', defaultVal: 'SECURED_CLOSED' }
    ]
  },
  {
    id: 'ROBOT-001',
    name: 'Inspection Robot & Dock',
    group: 'Robotics',
    subsystem: 'robotics',
    position: [0.0, 0, 7.8],
    dimensions: [0.8, 1.2, 0.9],
    viewpoint: [0.0, 6.0],
    target: [0.0, 0.6, 7.8],
    fn: 'Original SCOUT-01 4-wheel mobile inspection rover with camera mast, rotating 2D LiDAR scanner, LED headlights, and floor charging station.',
    ports: {},
    instruments: [
      { tag: 'ROBOT-001.BATTERY', name: 'Battery State of Charge', type: 'Power', unit: '%', normalMin: 20, normalMax: 100, warnMin: 15, alarmMin: 5, defaultVal: 98.0 },
      { tag: 'ROBOT-001.STATUS', name: 'Operational State', type: 'Robotics Status', unit: 'state', defaultVal: 'DOCKED' }
    ]
  }
];

// External Service Boundary Interfaces (labelled wall penetrations)
export const EXTERNAL_BOUNDARIES = [
  { id: 'EXT-SOLVENT', name: 'External Bulk Solvent Storage', position: [-15.8, 1.5, -4.5], type: 'solvent_supply' },
  { id: 'EXT-THERMAL', name: 'External Thermal-Fluid Combustion Heater', position: [-15.8, 1.8, 3.0], type: 'thermal_service' },
  { id: 'EXT-COOLING', name: 'External Plant Cooling Tower & Supply', position: [-15.8, 1.5, 6.0], type: 'cooling_water' },
  { id: 'EXT-VAPOUR', name: 'External VOC Vapour Treatment / Thermal Oxidiser', position: [15.8, 3.5, 6.0], type: 'vapour_treatment' },
  { id: 'EXT-WASTE', name: 'External Industrial Wastewater Neutralisation', position: [15.8, 1.0, 4.5], type: 'effluent_treatment' }
];

// Stations for the inspection robot coverage route
export const INSPECTION_STATIONS = [
  { id: 'STATION-01', name: 'Dock & Initialization', position: [0.0, 7.8], targetEq: 'ROBOT-001', lookAt: [0.0, 0.6, 7.8], isSpillZone: false },
  { id: 'STATION-02', name: 'Utility Edge: Instrument Air Package', position: [-6.0, 3.5], targetEq: 'AC-701', lookAt: [-7.0, 1.0, 6.0], isSpillZone: false },
  { id: 'STATION-03', name: 'Utility Edge: Air Receiver & Header', position: [-4.0, 3.5], targetEq: 'V-701', lookAt: [-5.0, 1.5, 6.0], isSpillZone: false },
  { id: 'STATION-04', name: 'Utility Edge: Heat Exchanger Skid', position: [-9.5, 3.5], targetEq: 'HX-501', lookAt: [-9.5, 1.2, 5.5], isSpillZone: false },
  { id: 'STATION-05', name: 'Utility Edge: CW Pump & Thermal Boundary', position: [-12.0, 3.5], targetEq: 'P-501', lookAt: [-12.0, 0.7, 5.5], isSpillZone: false },
  { id: 'STATION-06', name: 'Electrical Suite: Motor Control Centre', position: [4.5, 3.5], targetEq: 'MCC-801', lookAt: [4.5, 1.4, 6.5], isSpillZone: false },
  { id: 'STATION-07', name: 'Electrical Suite: Process Control Console', position: [7.5, 3.5], targetEq: 'PLC-801', lookAt: [7.5, 1.2, 6.5], isSpillZone: false },
  { id: 'STATION-08', name: 'Containment Zone: Sump & Transfer Pump', position: [12.0, 1.8], targetEq: 'S-901', lookAt: [13.0, 0.2, 3.5], isSpillZone: false },
  { id: 'STATION-09', name: 'Room Ventilation: Exhaust Fan Assembly', position: [10.5, 3.5], targetEq: 'EX-901', lookAt: [10.5, 1.4, 6.0], isSpillZone: false },
  { id: 'STATION-10', name: 'Feed Preparation: Fatty Acid Skid', position: [-12.0, -2.5], targetEq: 'TK-101', lookAt: [-12.0, 1.3, -5.5], isSpillZone: false },
  { id: 'STATION-11', name: 'Feed Preparation: Polyol Skid', position: [-10.0, -2.5], targetEq: 'TK-102', lookAt: [-10.0, 1.3, -5.5], isSpillZone: false },
  { id: 'STATION-12', name: 'Feed Preparation: Solids Hopper & Additions', position: [-8.0, -2.5], targetEq: 'H-101', lookAt: [-8.4, 1.5, -5.5], isSpillZone: false },
  { id: 'STATION-13', name: 'Reaction Area: Jacketed Reactor R-101', position: [-6.0, -2.5], targetEq: 'R-101', lookAt: [-6.0, 2.4, -5.0], isSpillZone: false },
  { id: 'STATION-14', name: 'Overhead Recovery: Condenser & Separator', position: [-5.0, -2.5], targetEq: 'V-201', lookAt: [-6.0, 3.1, -7.6], isSpillZone: false },
  { id: 'STATION-15', name: 'Overhead Recovery: Reaction Water Tank', position: [-3.8, -2.5], targetEq: 'TK-201', lookAt: [-4.0, 1.2, -7.2], isSpillZone: false },
  { id: 'STATION-16', name: 'Transfer & Blending: Blender BL-301', position: [1.0, -2.5], targetEq: 'BL-301', lookAt: [1.0, 2.0, -5.0], isSpillZone: false },
  { id: 'STATION-17', name: 'Filtration Skid: Pump P-301 & Floor Spill Zone', position: [4.0, -2.5], targetEq: 'P-301', lookAt: [4.8, 0.1, -3.5], isSpillZone: true },
  { id: 'STATION-18', name: 'Filtration Skid: Polishing Filter F-301', position: [5.8, -2.5], targetEq: 'F-301', lookAt: [5.5, 1.3, -5.0], isSpillZone: false },
  { id: 'STATION-19', name: 'Storage & Packaging: TK-401 & Filling FL-401', position: [10.5, -2.5], targetEq: 'TK-401', lookAt: [10.5, 1.4, -4.5], isSpillZone: false },
  { id: 'STATION-20', name: 'Return to Robot Dock', position: [0.0, 7.8], targetEq: 'ROBOT-001', lookAt: [0.0, 0.6, 7.8], isSpillZone: false }
];
