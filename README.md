# PlantScout — Resin-Unit Robot Inspection Simulation

PlantScout is an interactive, software-only inspection simulation. It places a virtual rover in a dark lower-level pump gallery beneath an epoxy-resin solution process unit. The upper process level shows the reactor and recovery/finishing equipment that the basement lines serve.

## What is in the environment

- A low-ceiling concrete gallery with structural bays, an access stair, a separate dry electrical/MCC room, ventilation, detector heads, a contained sump and a narrow service aisle.
- A resin-unit process arrangement: batch reactor, reflux condenser, condensate separator, blend/holding tank, xylene day tank and polish filter.
- Tagged pump skids, line headers, risers, valves, flanges, pressure gauges, cable trays and a synthetic process-floor cutaway.
- Scout-01, a four-wheel rover model with a moving inspection route, light, lidar marker and simulated telemetry.
- Four rehearsal cases: xylene-line vapour release, resin-transfer pump overheat, blocked route and baseline. Findings appear in the inspection log and can be exported as JSON.

## Process basis and source use

The process sequence is based on the epoxy-resin-solution process flow and equipment descriptions in the [Star Industries EIA/EMP report](https://environmentclearance.nic.in/writereaddata/online/EC/020420224ezpn1q5ohl49620151ADSreplywithenclosures.pdf), prepared with Hubert Enviro Care Systems. The report describes condensation polymerisation, solvent blending/cooling, filtration, condenser/separator recovery and process-water treatment. It does not provide a basement general-arrangement drawing. The lower gallery arrangement, dimensions and 3D geometry here are original simulation design choices; this is not a replica of the named factory. No EIA diagram or image is included in the project.

## Controls

- Drag in the scene to orbit and use the wheel to zoom.
- **Route** toggles the planned path; **Lights** toggles the facility work lights; **Deck** shows or hides process-floor slab sections; **Recenter** restores the overview; **Focus robot** moves the camera to Scout-01.
- Choose a rehearsal and select **Start inspection**. The rover follows the route and updates the timeline, coverage, telemetry and report. **Reset** returns it to the entrance.
- Export the current inspection summary as a JSON file after a mission finishes.

## Run locally

Requires Node.js and a browser with internet access. Three.js and the display fonts load from public CDNs.

```powershell
node serve.cjs
```

Open <http://127.0.0.1:8765>.

## Simulation boundaries

The scene is assembled from original Three.js geometry. It is a process-grounded visual and interaction prototype, not a surveyed facility or engineering-accurate digital twin. Robot motion, route blockage, gas index and temperature are scripted values. There is no physics engine, real robot, calibrated sensor, or Meta model/API connection in this version. “No anomaly observed” does not establish that a real area is safe for human entry.

## Later engineering path

For higher-fidelity robotics, the next step is a collision-aware facility and rover simulation with ROS 2 sensors, connected to this dashboard through recorded telemetry. Meta vision models can later help describe or segment simulator images; they should not replace the simulator as the authority for sensor readings or route outcomes.
