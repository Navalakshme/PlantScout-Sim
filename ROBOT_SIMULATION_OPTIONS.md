# Robot simulation sources for PlantScout

Researched 2026-11-02; updated 2026-11-03. An original browser rover is now implemented, with manual driving, a rendered camera, known-map route planning and simulated range rays. Webots/Gazebo physics are not integrated. No source robot model was copied.

## Source facts

| Source | Reusable pieces | Practical constraint |
| --- | --- | --- |
| [Webots](https://cyberbotics.com/) and its [sample worlds](https://github.com/cyberbotics/webots/tree/master/projects/samples) | Mobile robot models, sensors, controllers, worlds, and a desktop editor. [webots.cloud](https://www.cyberbotics.com/doc/guide/webots-cloud?version=released) can run and show an interactive simulation backed by a GitHub project. | Webots is Apache 2.0, but [sample asset licenses can differ](https://github.com/cyberbotics/webots/blob/master/docs/guide/webots-license-agreement.md); inspect each copied file. Our Three.js scene is not a Webots world, so the plant geometry and collision shapes need conversion or recreation. |
| [Gazebo Sim](https://gazebosim.org/docs/harmonic/getstarted/) and [Fuel](https://gazebosim.org/docs/harmonic/fuel_insert/) | SDF worlds, robot models, simulation plugins, and sensor examples including [lidar and IMU](https://gazebosim.org/docs/harmonic/sensors/). | The official guide says Windows installation has known runtime issues. Gazebo is better suited to a Linux development environment than our current static Vercel site. Check each Fuel asset's license. |
| [NVIDIA Isaac Sim](https://docs.isaacsim.omniverse.nvidia.com/) | USD scenes, articulated robots, realistic sensor simulation, and ROS 2 integration. | [Current requirements](https://docs.isaacsim.omniverse.nvidia.com/6.2.0/installation/requirements.html) are substantial, including 32 GB RAM and an RTX 4080-class GPU at minimum. Check the actual development machine before selecting it. |
| [Poly Haven](https://polyhaven.com/models) | CC0 textures, industrial pipe assets, and lighting references for visual quality. | This is an art asset library, not a robot simulator. Its [CC0 license](https://polyhaven.com/license) allows reuse; model size and scene performance still need review. |
| [Sketchfab downloadable models](https://sketchfab.com/developers/download-api) | A large library of glTF, GLB, and USDZ assets under per-model licenses. | The Download API requires user authentication, and [Creative Commons models need attribution](https://sketchfab.com/developers/download-api/guidelines). Do not assume every model can be reused commercially. |

## Recommendation for this project

Use **Webots** for the first real robot experiment. Start from one licensed mobile robot example with a camera and lidar, then recreate only the plant's walkable floor, walls, door, major equipment footprints, and a few visible inspection targets in a Webots world. Add a simple controller that drives to one target, avoids an obstacle, captures a camera frame, and reports the simulated observations. This tests the core inspection loop before making the scene larger.

The present site can remain the visual walkthrough while the robotics experiment is built. A browser-hosted Webots demo is possible through webots.cloud, but its GitHub project, hosting behavior, and asset permissions must be verified before linking it to PlantScout. [Webots can import 3D models](https://cyberbotics.com/doc/guide/the-user-interface?version=R2021b) such as Blender, OBJ, and Collada files; the current procedural Three.js meshes need an export step and separate physics collision geometry.

This is a platform recommendation, not a claim that the existing Three.js walkthrough already simulates robot motion or sensors.
