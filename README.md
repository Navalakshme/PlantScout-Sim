# PlantScout: Alkyd-Resin Process Basement Simulation & Robot Inspection

PlantScout is an interactive industrial simulation of an enclosed alkyd-resin manufacturing basement. It combines a deterministic 12-stage process simulation, a 37-assembly equipment register, 3D piping, two seeded scenarios, an original mobile inspection robot (SCOUT-01), Meta Muse Spark camera analysis when configured, and structured audit reporting.

---

## 1. Process Definition: Fatty-Acid Route Alkyd Resin Synthesis

The application simulates **solvent-assisted batch alkyd-resin manufacture via the fatty-acid route**:
1. **Raw Material Preparation**: Tall oil fatty acids (TOFA), liquid polyols (glycerol / pentaerythritol solution), and solid phthalic anhydride flake are metered into the main reactor. A small addition vessel handles catalysts or specialty modifiers.
2. **Azeotropic Solvent Reflux**: Reflux solvent (xylene) is added to the reactor to act as an azeotropic distillation carrier.
3. **Esterification & Water Removal**: Under agitation and indirect thermal-oil heating (~205 °C), esterification proceeds. Vapour leaves overhead, condenses in horizontal shell-and-tube condenser `E-201`, and enters decanter separator `V-201`. The upper solvent-rich phase decants and returns by gravity to reactor `R-101`, while the lower aqueous phase drains to closed reaction-water receiver `TK-201`.
4. **Endpoint Confirmation**: Simulated Acid Value falls (<15 mg KOH/g) and Viscosity reaches target (~28.5 Stokes), satisfying simulated quality release permissives.
5. **Conditioning & Thinning**: The base resin is cooled below 130 °C and transferred via pump `P-201` into thinning/blending vessel `BL-301`. Thinning solvent (mineral spirits/xylene) is blended under high-shear mixing, and separate cooling water circulates through the blender jacket to cool the batch to ~48 °C.
6. **Polishing Filtration & Holding**: Thinned resin is pumped via dedicated pump `P-301` through polishing filter `F-301` into finished product storage tank `TK-401`.
7. **Packaging**: Product pump `P-401` transfers resin to filling machine `FL-401`, where containers on digital scale `WS-401` are filled and handled onto roller conveyor `CV-401`.
8. **Batch Tracking**: If downstream equipment holds prior inventory while the reactor cooks a new batch, distinct batch identifiers are maintained (`Batch #B-109` in reactor vs `Batch #B-108` in holding/packaging).

---

## 2. Enclosed Basement Geometry & Coordinate System

- **Dimensions**: 32.0 metres long &times; 20.0 metres wide &times; 7.5 metres clear height.
- **Coordinate Convention**:
  - `X`: West (&minus;) to East (+) [&minus;16.0m to +16.0m]
  - `Z`: North (&minus;) to South (+) [&minus;10.0m to +10.0m]
  - `Y`: Elevation above floor [Floor `Y = 0.0m`]
  - `South Entrance`: Centered at `X = 0.0m, Z = +9.8m`
- **Central Inspection Aisle**: The two equipment banks are drawn closer around `Z = 0`. The core route from `Z = -0.75m` to `Z = +0.75m` is collision-free along the main hall; maintenance approaches branch off it.
- **Equipment Placement**:
  - *Feed Preparation*: Northwest (`X: -13.0 to -7.5, Z: -5.5 to -3.5`)
  - *Reaction & Overhead*: North center (`X: -6.0, Z: -5.0 to -7.6`)
  - *Thinning & Blending*: North (`X: 1.0, Z: -5.0`)
  - *Filtration*: North (`X: 3.5 to 5.5, Z: -5.0`)
  - *Product Storage*: North (`X: 8.5, Z: -5.0`)
  - *Drum Packaging*: Northeast (`X: 10.5 to 14.0, Z: -4.5`)
  - *Utility Interfaces*: Southwest (`X: -13.5 to -5.0, Z: 3.0 to 6.5`)
  - *Electrical & Control Suite*: South (`X: 3.5 to 8.5, Z: 6.5`)
  - *Ventilation & Sump*: Southeast (`X: 10.0 to 14.0, Z: 3.0 to 6.5`)
  - *Robot Dock*: South entrance (`X: 0.0, Z: 7.8`)
- **Entrance**: Each basement opens at a closed south vestibule door. Choose **Approach door**, then enter the demonstration PIN `2048`. Movement pauses inside until the controls guide is dismissed. Switching basements returns to the closed door and asks for the PIN again.
- **On-equipment displays**: Equipment signs show the assembly tag, name and temperature in both scenarios. A red display indicates a configured temperature alarm. Where no temperature sensor exists, the value is explicitly labelled simulated surface temperature.
- **External Boundaries**:
  - Bulk solvent storage, thermal fluid combustion heater, cooling tower, and waste/vapour treatment reside outside the basement shell, connected via labelled wall terminals: `EXT-SOLVENT`, `EXT-THERMAL`, `EXT-COOLING`, `EXT-VAPOUR`, `EXT-WASTE`.

---

## 3. Equipment Register (37 Assemblies)

| Tag | Equipment Assembly | Subsystem | Function & Physical Distinctiveness |
|---|---|---|---|
| `TK-101` | Fatty-Acid Feed Vessel | Feed | Small vertical cylindrical tank with dished heads, level transmitter and containment curb. |
| `TK-102` | Liquid Polyol Feed Vessel | Feed | Dedicated vertical feed tank with level sensor and independent supply line. |
| `H-101` | Enclosed Solids Charging Station | Feed | Conical hopper with charging gate and flanged chute into reactor for solid phthalic anhydride. |
| `AD-101` | Minor-Addition Vessel | Feed | Small vertical addition cylinder with graduated sight glass for catalyst dosing. |
| `P-101` | Fatty-Acid Feed Pump | Feed | Centrifugal metering pump with blue motor, coupling guard, and flanged nozzles. |
| `P-102` | Polyol Feed Pump | Feed | Dedicated polyol metering pump assembly. |
| `P-103` | Solvent Supply Pump/Interface | Feed | Controlled supply pump feeding solvent manifold branches A (reactor) and B (blender). |
| `R-101` | Jacketed Alkyd Reactor | Reaction | Main 316 stainless reaction vessel, thermal-fluid jacket, sight glasses, bottom dump valve. |
| `AG-101` | Reactor Agitator Drive | Reaction | Top drive motor, reduction gearbox, double mechanical seal and mixing shaft entry. |
| `E-201` | Main Overhead Condenser | Recovery | Horizontal shell-and-tube exchanger condensing solvent/water vapour overhead. |
| `V-201` | Condensate Phase Separator | Recovery | Horizontal liquid-liquid decanter with sight glass, gravity solvent return, and aqueous drain. |
| `TK-201` | Closed Reaction-Water Receiver | Recovery | Vertical receiving vessel accumulating reaction water before effluent transfer. |
| `E-202` | Vent Condenser | Recovery | Secondary shell-and-tube exchanger conditioning process vent gases before boundary. |
| `P-201` | Reactor-to-Blender Pump | Transfer | Centrifugal transfer pump connecting R-101 bottom outlet to BL-301. |
| `BL-301` | Thinning & Blending Vessel | Blending | Jacketed vessel with cooling jacket, high-shear agitator, and solvent addition nozzle. |
| `AG-301` | Blender Agitator Drive | Blending | Electric motor and gearbox turning high-shear blending impellers in BL-301. |
| `P-301` | Blender-to-Filter Pump | Filtration | Filtration feed pump (*Target for motor bearing overtemp in Defective scenario*). |
| `F-301` | Polishing Filter Skid | Filtration | Cylindrical filter vessel with swing-bolt clamp lid, basket filter, PT-IN, PT-OUT, and DPT. |
| `TK-401` | Finished-Product Storage Tank | Storage | Large vertical 304 stainless storage tank buffering clean filtered alkyd resin. |
| `P-401` | Product Filling Pump | Packaging | Transfer pump moving finished resin from TK-401 to packaging filling lance. |
| `FL-401` | Filling Station | Packaging | Lance support frame, pneumatic filling lance, and vapor recovery shroud. |
| `WS-401` | Weighing Platform | Packaging | Heavy-duty digital scale load cell platform under filling container. |
| `CV-401` | Container Roller Station | Packaging | Gravity roller conveyor handling packaged drums to pallet staging. |
| `P-501` | Cooling-Water Interface | Utilities | Recirculation pump and boundary interface header for plant cooling loop. |
| `HX-501` | Utility Heat Exchanger | Utilities | Plate-and-frame heat exchanger with tie rods and four flanged connections. |
| `TF-601` | Thermal-Fluid Boundary | Utilities | Insulated wall penetration terminal connecting external furnace to R-101 jacket. |
| `AC-701` | Instrument-Air Package | Utilities | Rotary screw air compressor enclosure with intake louvres and control panel. |
| `V-701` | Air Receiver | Utilities | Vertical buffer vessel with safety relief valve and distribution manifold. |
| `MCC-801` | Motor-Control Centre | Electrical | 3-bay switchgear cabinets housing pump starters, VFDs, and power busway. |
| `PLC-801` | Process Control Station | Electrical | Operator HMI console desk and automation controller rack. |
| `EX-901` | Room Extraction Assembly | Ventilation | Centrifugal exhaust blower with ductwork discharging to external treatment boundary. |
| `S-901` | Contained Collection Sump | Containment | Recessed floor pit with galvanized grating and level sensor for spill collection. |
| `P-901` | Sump Transfer Pump | Containment | Self-priming pump transferring collected drainage to external wastewater boundary. |
| `GD-901` | Gas-Detector Assemblies | Safety | Optical/catalytic LEL solvent vapour sensor heads in reaction and pump bays. |
| `ESD-901` | Emergency Isolation Station | Safety | High-visibility yellow/red wall station with mushroom e-stop push button. |
| `DOOR-001` | Entrance Assembly | Access | Personnel fire/blast-rated door connecting south vestibule to basement hall. |
| `ROBOT-001` | Inspection Robot & Dock | Robotics | Original 4-wheel mobile rover SCOUT-01 with mast camera, 2D LiDAR, and floor dock. |

---

## 4. Shared Connection Graph & Physical Pipe Routing

All 3D pipework, process state transitions, telemetry, and UI schematics are generated directly from `data/graph.js`:
- Centreline endpoints meet exact equipment nozzle coordinates.
- Proper flanged fittings, elbow spheres, and ceiling hanger rods are procedurally placed.
- Process, utility, vent, and drainage circuits remain strictly separated.
- Gravity drainage flows naturally downward: `E-201` (Y = 4.7m) &rarr; `V-201` (Y = 3.1m) &rarr; `R-101` solvent return (Y = 3.5m) and `TK-201` (Y = 2.3m).
- Subtle service identification bands wrap each pipe according to industrial standards (Xylene solvent = orange, Thermal oil = red, Cooling water = blue, Process resin = brown/gold).

---

## 5. Two Operating Scenarios

### Normal Basement (Seed 42)
- All equipment and utilities operate within normal design parameters.
- Clean concrete floor with zero spills.
- Pump `P-301` bearing temperature: **52.3 °C** (Normal < 65 °C).
- Filter `F-301` differential pressure: **0.42 bar** (Normal 0.1 – 0.8 bar).
- No configured threshold alarms in the normal scenario; the report distinguishes sampled telemetry from unreviewed camera frames.

### Defective Basement (Seed 1337)
- **Visible Liquid Floor Spill**: Physical dark amber glossy puddle mesh (~1.8m &times; 1.2m footprint) rendered directly on the concrete floor adjacent to pump `P-301`.
- **Motor Bearing Overtemperature**: Pump `P-301` drive-end bearing sensor `P-301.TT-BRG` reads **108.4 °C**, exceeding both the warning threshold (75.0 °C) and the alarm threshold (90.0 °C).
- **Restricted Filter Differential Pressure**: Polishing filter `F-301.DPT` reads **2.85 bar** (Inlet 3.85 bar, Outlet 1.00 bar), exceeding the alarm limit of 2.20 bar.
- **Cut Solvent Line**: `L-SOLV-02` has a visible physical gap near `P-103` with a simulated vapor plume.
- **Gas Detector Alarm**: `GD-901.AT-01` reads **23.4% LEL**, above its 20% LEL demonstration alarm. The image alone cannot measure gas concentration or identify it.
- **Sample Particles**: The aisle-facing `F-301` sight glass contains visible dark particles; their composition is unknown.
- The robot reports threshold alarms from simulated instruments. A seeded visual fault that Meta does not confirm is marked **simulation ground truth**, with its frame retained for review.
- Switching basements resets the active process, door, robot, and telemetry. Each basement keeps its own report during the current browser session; evidence is never mixed between reports.

---

## 6. SCOUT-01 Inspection Robot & Autonomous Workflow

- **Chassis & Hardware**: 4-wheel differential drive, solid rubber treaded tires, front/rear neoprene bumpers, rotating 2D LiDAR range scanner, dual forward LED spot lamps, amber status strobe, battery pack, and articulated camera mast.
- **Masthead RGB Camera**: Elevated to 1.15m height, with pan/tilt servos. Camera perspective is positioned forward of the masthead so the onboard view is completely unobstructed.
- **Controls**:
  - `Walk View`: Free first-person exploration of the entire plant.
  - `Follow Robot`: Third-person chase camera trailing smoothly behind the rover.
  - `Masthead Camera`: Direct first-person RGB camera feed from the robot's masthead lens with HUD crosshairs and telemetry.
  - Manual driving via keyboard (`W A S D`, Arrow keys, Space for E-Stop) or interactive on-screen touch buttons.
- **Autonomous Coverage Route (37 Stops, 37 Assemblies)**:
  - Starts at Dock and visits every registered assembly through collision-checked approaches, including the floor spill zone at Station 17. It finishes at the final inspected assembly without an automatic return to Dock.
  - During travel and at each stop, the robot records upper, lower, opposite-side, and floor checks. Installed instruments provide simulated measurements; the report says when no such instrument is installed. At each stop, the robot aims at the target, captures a masthead frame, checks telemetry thresholds, and adds evidence to the basement's report. The full-screen view supports Follow, Masthead, and Top camera modes without resetting the route, plus speed, pause, stop, and report controls.
  - Speech is tied to each station dwell. Route speeds 1×, 2.5×, and 5× use browser-safe voice rates of 0.95×, 1.4×, and 1.8×; the rover waits for each sentence before advancing. A speed change applies to the next sentence without cutting off the current one. Pausing or stopping cancels speech. Meta writes a concise spoken summary when it analyzes a frame; the browser speech engine renders that text.
  - Manual driving pauses the automatic route. **Resume from here** replans toward the current station.

---

## 7. Meta Model AI Integration & Server Architecture

- **Backend**: Vercel Functions in `api/`, with `server.cjs` for a local preview at `http://127.0.0.1:8765`.
- **API Endpoints**:
  - `GET /api/status`: Reports whether `META_API_KEY` is configured; `?verify=1` authenticates with Meta's `/models` endpoint.
  - `POST /api/analyze-station`: Accepts evidence payloads (`{ inspectionId, stationId, equipmentIds, cameraImageBase64, telemetry, thresholds, evidenceId }`).
  - `POST /api/synthesize-report`: Returns a deterministic summary of submitted findings.
- **Model**: `muse-spark-1.3` through `https://api.meta.ai/v1/chat/completions`. The server holds the key. Up to 10 selected masthead images per run are analyzed, prioritizing the spill, filter, cut pipe, and gas detector; all 37 stops still save a photo and simulated instrument readings. The same model response supplies a short spoken summary and an optional normalized visual highlight box.
- **Evidence limits**: The report labels Meta camera findings, simulated telemetry checks, and scenario ground truth separately. A telemetry-only result does not claim that the photo was analyzed. Seeded visual faults are reported as ground truth if the image model does not confirm them. Meta Muse Voice Transcribe is speech-to-text, so spoken output uses browser speech synthesis rather than claiming Meta-generated audio.

---

## 8. Dashboard & Interactive Reporting

- **Task screens**: Overview; Basement 1 Access, Explore, and Robot inspection; Basement 2 Access, Explore, and Robot inspection; Reports; Equipment & process; Controls & help. The sidebar moves between these views without stacking every task on one dashboard. Robot inspection starts the demonstration process and route with one action, and enters a full-viewport scan view. The Equipment & process screen keeps its directory and diagram visible while an assembly opens in a distant 3D preview.
- **Controls & movement**: A guide appears after entry and is available from the sidebar or Controls & help. Mouse wheel zoom, camera reset, manual robot driving, route pause, and resume are supported.
- **Compact Telemetry Bar**: Live stage progress %, R-101 temp & level, BL-301 temp, P-301 bearing temp, F-301 filter DP, container mass, and simulated acid value.
- **Inspection Audit Report**:
  - Basement 1 and Basement 2 report tabs keep separate findings during the current browser session.
  - Metadata cards: Inspection ID, Scenario, Timings, Route Coverage (37/37 Stops), and visited equipment (37/37 on a complete route).
  - Travel scan log shows recent checks by default and offers the full log; JSON export includes all checks.
  - Grounded conclusion banner with color coding.
  - Visual findings cards with camera frame thumbnails, measurement comparisons, confidence/uncertainty, and recommended follow-up.
  - **Evidence viewer**: Clicking a report finding opens its full captured frame on the Reports screen. A Meta-returned visual box is shown only when the model provides a valid location; simulated sensor and seeded-fault entries remain clearly labelled.
  - Export buttons: Download machine-readable JSON report or trigger formatted Print / PDF Export.

---

## 9. Verification & Automated Test Suite

Run the comprehensive test suite:
```powershell
node verify-system.mjs
node scripts/run-inspection-test.mjs
```

The inspection fixture test runs offline and makes no Meta API requests.

Verification covers:
- Exact 37 unique equipment IDs and required assemblies.
- All 35 connection lines resolve to valid endpoints with continuous 3D coordinate waypoints.
- Separation of cooling water, thermal fluid, process streams, and containment drains.
- Gravity elevation of condenser E-201 above separator V-201 above receiver TK-201.
- Central inspection aisle (Z = -1.7 to +1.7m) completely unobstructed by obstacles.
- A* collision-checked navigation routes across all 37 stops.
- Deterministic process permissives, mass conservation, and emergency shutdown isolation.
- Normal vs Defective scenario seeding, spill mesh rendering, and alarm clearing.

---

## 10. How to Run the Application

1. Start the server:
   ```powershell
   node server.cjs
   ```
2. Open your browser:
   ```
   http://127.0.0.1:8765/
   ```
3. Direct linking URL parameters:
   - `?scenario=defective`: Starts in Defective Basement mode.
   - `?stage=9`: Jumps simulation to Stage 09 (Filtration).
   - `?highlight=R-101`: Focuses and highlights reactor R-101.
   - `?highlight_spill=1`: Focuses and highlights the floor spill.
   - `?auto_report=1`: Runs a fast local inspection for verification; open Reports after the route finishes.

---

## 11. Technical Limitations & Disclaimers

1. **Educational Simulation**: This software is an illustrative conceptual simulation. It is not an engineered plant design, operating recipe, or evidence that a real solvent-processing basement is safe or compliant. Do not declare the real environment safe for human entry.
2. **Simplified Chemistry & Kinetics**: The batch state machine uses simplified time-dependent thermal and analytical models (e.g. simulated acid value and viscosity) for demonstration purposes. It does not predict real non-linear polymerization kinetics or runaway industrial exothermic scenarios.
3. **Kinematic Navigation**: Robot locomotion uses browser-based differential drive kinematics and a 2D floor obstacle map rather than full rigid-body physics engines (Webots / Gazebo) or real SLAM.
4. **AI Inference Budget**: In live Meta API mode, image requests are capped at 10 requests per inspection run. The model may miss subtle visual defects; the report exposes uncertainty and preserves the captured frame for review.
