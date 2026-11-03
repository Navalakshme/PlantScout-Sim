# PlantScout — Resin Works and SCOUT-01

An enclosed industrial walkthrough with 40 named equipment assemblies, their functions and connections, and an original four-wheel inspection robot.

## Open and explore
Descend the stair and enter demo PIN **2048**. Open **Equipment** to search and select any assembly. Selection walks to a clear inspection viewpoint and displays the part name, purpose and process connections. Click visible labels for details. Drag to look around and use WASD to walk.

Open **Inspection robot** for **Follow robot** or **Robot camera**. W/S drives forward/reverse, A/D turns and Space stops. Named touch buttons offer the same drive controls. **Start automatic route** visits 19 inspection stops including the dock. Pause/continue, emergency stop/resume, route-speed, reset, map and downloadable visitation log are included. Expand **Robot parts and functions** for its component list.

## Restored equipment
Comparison with the earlier e6ac943 layout restored the phase separator, contained sump, sump/effluent pumps, polish filter and feed pump, extraction fan, detector heads, isolation station and reactor instrument assembly. The stainless reactor, blend/holding/product vessels, feed system, condenser/receiver, cooler, filters, packaging, utility heat exchanger, air supply and motor-control equipment remain present. The overhead rack has three rear utility headers.

## Simulation limits
This is an illustrative resin-solution layout, not an exhaustive engineered bill of materials. Robot movement is kinematic; routes and range rays use a known obstacle map. It does not run Webots/Gazebo physics, SLAM or real hazard detection. Camera view is rendered from the robot mast. Route logs record visits, not chemical safety findings. Plant readings are synthetic. No Meta API or paid plugin is used.

See [IMPLEMENTATION_STATUS.md](IMPLEMENTATION_STATUS.md) and [ROBOT_SIMULATION_OPTIONS.md](ROBOT_SIMULATION_OPTIONS.md) for implementation details and checked robot references. No third-party robot assets were copied.

## Run and verify
Run `node serve.cjs` or `python -m http.server 8770`. Three.js and fonts require internet access. `node verify-navigation.mjs` tests every inspection viewpoint, every route leg, obstacle rejection and detours. The browser flow additionally verifies manual forward/reverse/turning, emergency stop, pause, 19/19 automatic-route completion, labels, search and guided equipment inspection.

## Files
- equipment.mjs: named inventory, functions and viewpoints.
- industrial-layout.js / restored-machinery.js: equipment geometry.
- interior.js: enclosed shell, entry, utility and existing process animation.
- navigation.mjs: floor map, collision clearance and A* routing.
- rover.js: robot model and controller.
- experience.js: equipment directory, labels, robot views and controls.
- app.js: rendering, entry, startup sequence and audio.
