// PlantScout - Shared Connection Graph Data Model
// Directly connects equipment ports with 3D routes, fluid services, and process states.

export const FLUID_SERVICES = {
  'fatty-acid': { name: 'Fatty Acid Feed', category: 'process', color: 0x9e8a58, bandColor: 0xd4b445, dia: 0.05 },
  'polyol': { name: 'Liquid Polyol Feed', category: 'process', color: 0x8a9299, bandColor: 0x5a94a2, dia: 0.05 },
  'solvent-xylene': { name: 'Xylene Solvent', category: 'process', color: 0x768b99, bandColor: 0xe69f24, dia: 0.06 },
  'solids-chute': { name: 'Phthalic Anhydride Chute', category: 'process', color: 0x5a6368, bandColor: 0xb5bec4, dia: 0.12 },
  'minor-additive': { name: 'Catalyst / Additive', category: 'process', color: 0x6e7b85, bandColor: 0x88c2b5, dia: 0.03 },
  'alkyd-base': { name: 'Unthinned Alkyd Resin', category: 'process', color: 0x8a6332, bandColor: 0xb87928, dia: 0.08 },
  'thinned-resin': { name: 'Thinned Alkyd Solution', category: 'process', color: 0x96733c, bandColor: 0xd68d2b, dia: 0.07 },
  'filtered-resin': { name: 'Filtered Product Resin', category: 'process', color: 0xa88444, bandColor: 0xeda43b, dia: 0.07 },
  'overhead-vapour': { name: 'Solvent/Water Vapour', category: 'process', color: 0x828a91, bandColor: 0xc47db5, dia: 0.14 },
  'condensate': { name: 'Mixed Condensate', category: 'process', color: 0x73828c, bandColor: 0x7db5c4, dia: 0.06 },
  'reflux-solvent': { name: 'Recovered Solvent Reflux', category: 'process', color: 0x768b99, bandColor: 0xe69f24, dia: 0.05 },
  'reaction-water': { name: 'Reaction Byproduct Water', category: 'process', color: 0x5c7b88, bandColor: 0x4896ab, dia: 0.05 },
  'process-vent': { name: 'Conditioned Process Vent', category: 'vent', color: 0x687075, bandColor: 0xab599b, dia: 0.08 },
  'thermal-fluid': { name: 'Hot Thermal Oil (240°C)', category: 'utility', color: 0x47494a, bandColor: 0xcc4433, dia: 0.09, insulated: true },
  'cooling-water': { name: 'Plant Cooling Water', category: 'utility', color: 0x3d5463, bandColor: 0x3388bb, dia: 0.08 },
  'instrument-air': { name: 'Instrument Air (7 bar)', category: 'utility', color: 0x566b7a, bandColor: 0x44aacc, dia: 0.04 },
  'contained-drain': { name: 'Contained Sump Drainage', category: 'drain', color: 0x383e42, bandColor: 0x777777, dia: 0.07 },
  'room-ventilation': { name: 'Room Extraction Air', category: 'vent', color: 0x4e585f, bandColor: 0x8899aa, dia: 0.35 }
};

export const CONNECTION_LINES = [
  // --- 1. Feed System Connections ---
  {
    id: 'L-FEED-01',
    from: { eq: 'TK-101', port: 'outlet' },
    to: { eq: 'P-101', port: 'suction' },
    service: 'fatty-acid',
    valves: ['V-101-1'],
    points: [
      [-12.0, 0.4, -4.9],
      [-12.0, 0.4, -4.3]
    ]
  },
  {
    id: 'L-FEED-02',
    from: { eq: 'P-101', port: 'discharge' },
    to: { eq: 'R-101', port: 'fatty_acid_in' },
    service: 'fatty-acid',
    valves: ['V-101-2', 'NRV-101'],
    points: [
      [-12.0, 0.7, -3.4],
      [-12.0, 3.8, -3.4],
      [-6.8, 3.8, -3.4],
      [-6.8, 3.8, -4.8]
    ]
  },
  {
    id: 'L-FEED-03',
    from: { eq: 'TK-102', port: 'outlet' },
    to: { eq: 'P-102', port: 'suction' },
    service: 'polyol',
    valves: ['V-102-1'],
    points: [
      [-10.0, 0.4, -4.9],
      [-10.0, 0.4, -4.3]
    ]
  },
  {
    id: 'L-FEED-04',
    from: { eq: 'P-102', port: 'discharge' },
    to: { eq: 'R-101', port: 'polyol_in' },
    service: 'polyol',
    valves: ['V-102-2', 'NRV-102'],
    points: [
      [-10.0, 0.7, -3.4],
      [-10.0, 3.8, -3.6],
      [-6.5, 3.8, -3.6],
      [-6.5, 3.8, -4.6]
    ]
  },
  {
    id: 'L-FEED-05',
    from: { eq: 'H-101', port: 'chute_out' },
    to: { eq: 'R-101', port: 'solids_in' },
    service: 'solids-chute',
    valves: ['XV-101-SOLIDS'],
    points: [
      [-7.8, 3.2, -5.2],
      [-6.8, 3.8, -4.8],
      [-6.2, 4.0, -4.5]
    ]
  },
  {
    id: 'L-FEED-06',
    from: { eq: 'AD-101', port: 'outlet' },
    to: { eq: 'R-101', port: 'addition_in' },
    service: 'minor-additive',
    valves: ['V-101-ADD'],
    points: [
      [-6.8, 2.8, -5.5],
      [-6.2, 3.5, -5.0],
      [-5.7, 3.8, -4.6]
    ]
  },
  {
    id: 'L-SOLV-01',
    from: { eq: 'EXT-SOLVENT', port: 'supply' },
    to: { eq: 'P-103', port: 'suction' },
    service: 'solvent-xylene',
    valves: ['V-SOLV-ISO'],
    points: [
      [-15.8, 1.5, -4.5],
      [-14.0, 1.5, -4.5],
      [-14.0, 0.4, -4.3],
      [-8.4, 0.4, -4.3]
    ]
  },
  {
    id: 'L-SOLV-02',
    from: { eq: 'P-103', port: 'discharge' },
    to: { eq: 'R-101', port: 'solvent_in' },
    service: 'solvent-xylene',
    valves: ['V-SOLV-MAN-A'],
    points: [
      [-8.4, 0.7, -3.4],
      [-8.4, 3.8, -3.8],
      [-5.4, 3.8, -3.8],
      [-5.4, 3.8, -4.8]
    ]
  },
  {
    id: 'L-SOLV-03',
    from: { eq: 'P-103', port: 'discharge' },
    to: { eq: 'BL-301', port: 'solvent_in' },
    service: 'solvent-xylene',
    valves: ['V-SOLV-MAN-B'],
    points: [
      [-8.4, 3.8, -3.8],
      [0.7, 3.8, -3.8],
      [0.7, 3.8, -4.6]
    ]
  },

  // --- 2. Reaction Overhead Recovery & Phase Separation ---
  {
    id: 'L-REC-01',
    from: { eq: 'R-101', port: 'vapour_out' },
    to: { eq: 'E-201', port: 'vapour_in' },
    service: 'overhead-vapour',
    valves: [],
    points: [
      [-6.0, 4.4, -5.0],
      [-6.0, 5.2, -5.0],
      [-6.0, 5.2, -6.3],
      [-6.0, 5.0, -6.3]
    ]
  },
  {
    id: 'L-REC-02',
    from: { eq: 'E-201', port: 'condensate_out' },
    to: { eq: 'V-201', port: 'condensate_in' },
    service: 'condensate',
    valves: ['V-201-COND'],
    points: [
      [-6.0, 4.3, -7.6],
      [-6.0, 3.7, -7.6]
    ]
  },
  {
    id: 'L-REC-03',
    from: { eq: 'V-201', port: 'solvent_out' },
    to: { eq: 'R-101', port: 'solvent_return_in' },
    service: 'reflux-solvent',
    valves: ['V-201-REFLUX', 'SG-201'],
    points: [
      [-5.6, 3.2, -7.4],
      [-5.6, 3.2, -6.2],
      [-5.7, 3.5, -5.4]
    ]
  },
  {
    id: 'L-REC-04',
    from: { eq: 'V-201', port: 'water_out' },
    to: { eq: 'TK-201', port: 'water_in' },
    service: 'reaction-water',
    valves: ['V-201-AQU', 'SG-202'],
    points: [
      [-6.0, 2.5, -7.6],
      [-6.0, 2.3, -7.2],
      [-4.0, 2.3, -7.2]
    ]
  },
  {
    id: 'L-REC-05',
    from: { eq: 'TK-201', port: 'transfer_out' },
    to: { eq: 'EXT-WASTE', port: 'inlet' },
    service: 'reaction-water',
    valves: ['V-201-DISCH'],
    points: [
      [-4.0, 0.4, -6.6],
      [-4.0, 0.4, -7.8],
      [14.0, 0.4, -7.8],
      [14.0, 1.0, 4.5],
      [15.8, 1.0, 4.5]
    ]
  },
  {
    id: 'L-VENT-01',
    from: { eq: 'V-201', port: 'vent_out' },
    to: { eq: 'E-202', port: 'vent_in' },
    service: 'process-vent',
    valves: [],
    points: [
      [-6.0, 3.8, -7.6],
      [-6.0, 4.2, -8.0],
      [-5.6, 4.2, -8.0]
    ]
  },
  {
    id: 'L-VENT-02',
    from: { eq: 'E-202', port: 'vent_out' },
    to: { eq: 'EXT-VAPOUR', port: 'inlet' },
    service: 'process-vent',
    valves: ['V-202-VENT'],
    points: [
      [-4.4, 4.7, -8.0],
      [-4.4, 5.8, -8.0],
      [14.0, 5.8, -8.0],
      [14.0, 3.5, 6.0],
      [15.8, 3.5, 6.0]
    ]
  },

  // --- 3. Base Resin Transfer to Blending ---
  {
    id: 'L-TRANS-01',
    from: { eq: 'R-101', port: 'bottom_out' },
    to: { eq: 'P-201', port: 'suction' },
    service: 'alkyd-base',
    valves: ['XV-101-DUMP', 'V-201-SUCT'],
    points: [
      [-6.0, 0.5, -5.0],
      [-6.0, 0.4, -4.5],
      [-3.4, 0.4, -4.5]
    ]
  },
  {
    id: 'L-TRANS-02',
    from: { eq: 'P-201', port: 'discharge' },
    to: { eq: 'BL-301', port: 'resin_in' },
    service: 'alkyd-base',
    valves: ['V-201-DISCH-V', 'NRV-201'],
    points: [
      [-2.2, 0.7, -4.5],
      [-2.2, 3.8, -4.8],
      [0.3, 3.8, -4.8]
    ]
  },

  // --- 4. Blending to Filtration Skid ---
  {
    id: 'L-BLEND-01',
    from: { eq: 'BL-301', port: 'bottom_out' },
    to: { eq: 'P-301', port: 'suction' },
    service: 'thinned-resin',
    valves: ['V-301-BTM'],
    points: [
      [1.0, 0.5, -5.0],
      [1.0, 0.4, -4.5],
      [2.9, 0.4, -4.5]
    ]
  },
  {
    id: 'L-FILT-01',
    from: { eq: 'P-301', port: 'discharge' },
    to: { eq: 'F-301', port: 'inlet' },
    service: 'thinned-resin',
    valves: ['V-301-FILT-IN'],
    points: [
      [4.1, 0.7, -4.5],
      [4.1, 1.1, -5.0],
      [4.9, 1.1, -5.0]
    ]
  },
  {
    id: 'L-FILT-02',
    from: { eq: 'F-301', port: 'outlet' },
    to: { eq: 'TK-401', port: 'inlet' },
    service: 'filtered-resin',
    valves: ['V-301-FILT-OUT', 'NRV-301'],
    points: [
      [6.1, 1.1, -5.0],
      [7.2, 1.1, -5.0],
      [7.2, 3.8, -5.0],
      [7.8, 3.8, -5.0]
    ]
  },

  // --- 5. Product Holding to Packaging ---
  {
    id: 'L-PROD-01',
    from: { eq: 'TK-401', port: 'outlet' },
    to: { eq: 'P-401', port: 'suction' },
    service: 'filtered-resin',
    valves: ['V-401-SUCT'],
    points: [
      [8.5, 0.5, -4.4],
      [8.5, 0.4, -4.5],
      [9.9, 0.4, -4.5]
    ]
  },
  {
    id: 'L-PACK-01',
    from: { eq: 'P-401', port: 'discharge' },
    to: { eq: 'FL-401', port: 'lance_in' },
    service: 'filtered-resin',
    valves: ['XV-401-FILL'],
    points: [
      [11.1, 0.7, -4.5],
      [11.1, 2.5, -4.5],
      [12.0, 2.5, -4.5]
    ]
  },

  // --- 6. Thermal Fluid Loop (Isolated) ---
  {
    id: 'L-TF-01',
    from: { eq: 'TF-601', port: 'supply' },
    to: { eq: 'R-101', port: 'jacket_in' },
    service: 'thermal-fluid',
    valves: ['TCV-101-SUP'],
    points: [
      [-13.7, 2.0, 3.0],
      [-13.7, 2.0, -5.2],
      [-6.9, 2.0, -5.2],
      [-6.9, 1.2, -5.2]
    ]
  },
  {
    id: 'L-TF-02',
    from: { eq: 'R-101', port: 'jacket_out' },
    to: { eq: 'TF-601', port: 'return' },
    service: 'thermal-fluid',
    valves: ['V-TF-RET'],
    points: [
      [-5.1, 2.6, -5.2],
      [-5.1, 2.6, -6.0],
      [-13.5, 2.6, -6.0],
      [-13.5, 1.2, 3.0],
      [-13.7, 1.2, 3.0]
    ]
  },

  // --- 7. Cooling Water Circuits (Separate from process and thermal fluid) ---
  {
    id: 'L-CW-01',
    from: { eq: 'EXT-COOLING', port: 'supply' },
    to: { eq: 'P-501', port: 'suction' },
    service: 'cooling-water',
    valves: ['V-CW-SUP-ISO'],
    points: [
      [-15.8, 1.5, 6.0],
      [-13.5, 1.5, 6.0],
      [-13.5, 0.4, 5.5],
      [-12.6, 0.4, 5.5]
    ]
  },
  {
    id: 'L-CW-02',
    from: { eq: 'P-501', port: 'discharge' },
    to: { eq: 'E-201', port: 'coolant_in' },
    service: 'cooling-water',
    valves: ['TCV-201-CW'],
    points: [
      [-11.4, 0.8, 5.5],
      [-11.4, 4.6, 5.5],
      [-11.4, 4.6, -7.0],
      [-6.8, 4.6, -7.0]
    ]
  },
  {
    id: 'L-CW-03',
    from: { eq: 'P-501', port: 'discharge' },
    to: { eq: 'BL-301', port: 'jacket_in' },
    service: 'cooling-water',
    valves: ['TCV-301-CW'],
    points: [
      [-11.4, 0.8, 5.5],
      [-1.0, 0.8, 5.5],
      [-1.0, 1.0, -5.2],
      [0.2, 1.0, -5.2]
    ]
  },
  {
    id: 'L-CW-04',
    from: { eq: 'E-201', port: 'coolant_out' },
    to: { eq: 'EXT-COOLING', port: 'return' },
    service: 'cooling-water',
    valves: ['V-CW-RET-1'],
    points: [
      [-5.2, 4.9, -7.0],
      [-5.2, 5.4, -7.0],
      [-15.0, 5.4, -7.0],
      [-15.0, 2.2, 6.0],
      [-15.8, 2.2, 6.0]
    ]
  },
  {
    id: 'L-CW-05',
    from: { eq: 'BL-301', port: 'jacket_out' },
    to: { eq: 'EXT-COOLING', port: 'return' },
    service: 'cooling-water',
    valves: ['V-CW-RET-2'],
    points: [
      [1.8, 2.5, -5.2],
      [1.8, 5.2, -5.2],
      [-15.0, 5.2, -5.2],
      [-15.0, 2.2, 6.0],
      [-15.8, 2.2, 6.0]
    ]
  },

  // --- 8. Instrument Air Supply ---
  {
    id: 'L-AIR-01',
    from: { eq: 'AC-701', port: 'outlet' },
    to: { eq: 'V-701', port: 'inlet' },
    service: 'instrument-air',
    valves: ['V-AIR-CMP-OUT'],
    points: [
      [-6.2, 1.2, 6.0],
      [-5.5, 1.2, 6.0]
    ]
  },
  {
    id: 'L-AIR-02',
    from: { eq: 'V-701', port: 'outlet' },
    to: { eq: 'PLC-801', port: 'manifold' },
    service: 'instrument-air',
    valves: ['PRV-701'],
    points: [
      [-4.5, 2.2, 6.0],
      [0.0, 2.2, 6.0],
      [7.0, 2.2, 6.0]
    ]
  },

  // --- 9. Sump & Containment Drainage ---
  {
    id: 'L-SUMP-01',
    from: { eq: 'S-901', port: 'suction' },
    to: { eq: 'P-901', port: 'suction' },
    service: 'contained-drain',
    valves: ['V-SUMP-SUCT'],
    points: [
      [13.0, -0.3, 3.5],
      [13.0, 0.3, 4.2]
    ]
  },
  {
    id: 'L-SUMP-02',
    from: { eq: 'P-901', port: 'discharge' },
    to: { eq: 'EXT-WASTE', port: 'inlet' },
    service: 'contained-drain',
    valves: ['V-SUMP-DISCH'],
    points: [
      [13.5, 0.7, 5.0],
      [15.8, 0.7, 5.0]
    ]
  },

  // --- 10. Room Extraction & Ventilation ---
  {
    id: 'L-EXT-01',
    from: { eq: 'EX-901', port: 'discharge_out' },
    to: { eq: 'EXT-VAPOUR', port: 'inlet' },
    service: 'room-ventilation',
    valves: ['DMP-EX-01'],
    points: [
      [11.2, 3.2, 6.0],
      [14.0, 3.2, 6.0],
      [15.8, 3.2, 6.0]
    ]
  }
];
