# Current equipment and robot implementation

The earlier e6ac943 layout was compared with the stainless-steel rebuild. Restored assemblies include the horizontal phase separator, contained sump, sump and effluent pumps, polish filter with feed pump, extraction fan, detector heads, emergency isolation and reactor instrument assembly.

## Controls
- Descend and enter PIN 2048.
- Equipment opens the searchable inventory of 40 named assemblies with functions and connections. Selecting an entry walks to a collision-checked inspection point. WASD or dragging cancels guided walking.
- Inspection robot opens SCOUT-01. Follow robot and Robot camera enable manual driving: W/S forward/reverse, A/D turn, Space emergency stop. Named hold buttons support touch driving.
- Start automatic route visits 19 stations including dock. Pause/continue, stop/resume, reset, route speed and downloadable visitation log are available.
- The map shows known obstacle footprints, route and simulated lidar rays. Robot parts and their functions are listed inside the robot panel.

## What is implemented
The robot is an original browser kinematic model with four wheels, chassis, bumpers, camera mast, scanner, lights and battery enclosure. A conservative circular footprint prevents collisions with the mapped equipment. A* plans on a known grid and checks path segments. Range sampling queries that floor map. Onboard camera renders the scene at the mast position.

## Limits
This does not run Webots/Gazebo rigid-body physics, SLAM, live gas sensing or AI diagnosis. Route logs prove simulated visits only, not safe operating conditions. Individual equipment readings remain illustrative. This is not an exhaustive engineered plant bill of materials. No Meta credits or paid plugin are used.

## Sources checked
- https://gazebosim.org/docs/harmonic/sensors/ — lidar, IMU and contact sensor concepts.
- https://github.com/cyberbotics/webots/blob/master/docs/guide/webots-cloud.md — distinguishes browser scenes from remotely hosted physics simulations.

No third-party model assets or source code were copied. The earlier process reference does not specify this basement layout.

## Files and checks
equipment.mjs holds the inventory; restored-machinery.js the reinstated models; navigation.mjs shared collisions and routes; rover.js the robot; experience.js the controls and labels. verify-navigation.mjs checks all inspection viewpoints and every automatic-route leg.
