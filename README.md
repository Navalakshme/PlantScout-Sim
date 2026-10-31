# PlantScout — Chemical Basement Robot Simulation

PlantScout is an interactive, software-only inspection simulation. It places a virtual rover in a dark, cutaway chemical-plant basement so a user can rehearse an inspection route and review synthetic observations before imagining a real deployment.

## What is in the environment

- A large concrete basement with structural columns and beams, work lights, a service entrance, floor markings, drains, cable trays and utility runs.
- A power and motor-control station with breaker cabinets, status lamps, displays, buttons and a main disconnect.
- Process equipment including pump and motor skids, vertical vessels, horizontal receivers, pipe racks, gauges, hand-wheel valves and transfer lines.
- A drum and tin handling zone with conveyors, rollers, pallets and safety rails.
- Scout-01, a four-wheel rover model with a moving inspection route, light, lidar marker and simulated telemetry.
- Four rehearsal cases: vapor release, pump overheat, blocked route and baseline. Findings appear in the inspection log and can be exported as JSON.

## Controls

- Drag in the scene to orbit and use the wheel to zoom.
- **Route** toggles the planned path; **Lights** toggles the facility work lights; **Ceiling** shows or hides roof panels; **Recenter** restores the overview; **Focus robot** moves the camera to Scout-01.
- Choose a rehearsal and select **Start inspection**. The rover follows the route and updates the timeline, coverage, telemetry and report. **Reset** returns it to the entrance.
- Export the current inspection summary as a JSON file after a mission finishes.

## Run locally

Requires Node.js and a browser with internet access. Three.js and the display fonts load from public CDNs.

```powershell
node serve.cjs
```

Open <http://127.0.0.1:8765>.

## Simulation boundaries

The scene is assembled from 3D geometry in Three.js. It is a visual and interaction prototype, not a photorealistic or engineering-accurate digital twin. Robot motion, route blockage, gas index and temperature are scripted values. There is no physics engine, real robot, calibrated sensor, facility model, or Meta model/API connection in this version. “No anomaly observed” does not establish that a real area is safe for human entry.

## Later engineering path

For higher-fidelity robotics, the next step is a modeled facility and rover in Gazebo with ROS 2 sensors and collision-aware navigation, connected to this dashboard through recorded telemetry. Meta vision models can later help describe or segment simulator images; they should not replace the simulator as the authority for sensor readings or route outcomes.
