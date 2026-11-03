// PlantScout - Robot Navigation & Floor Obstacle Map
import { galleryZ } from '../data/layout.js';
// Grid-based A* routing, collision clearances, and field-of-view line-of-sight verification.

// 2D Obstacle bounding boxes [minX, maxX, minZ, maxZ] on the basement floor
export const FLOOR_OBSTACLES = [
  // North equipment block (Feed, Reaction, Blending, Filtration, Storage, Packaging)
  // X: -13.5 to +15.0, Z: -6.8 to -3.2 (with access corridors)
  [-13.0, -7.0, -6.8, -3.2], // Feed preparation skid & pumps
  [-7.2, -4.5, -6.5, -3.4],  // Jacketed reactor R-101 & condenser area
  [-4.2, -2.0, -8.2, -3.5],  // Recovery vessels TK-201 & transfer pump
  [0.0, 2.2, -6.5, -3.5],    // Blending vessel BL-301 & agitator
  [2.8, 6.8, -6.2, -3.5],    // Pump P-301 & polishing filter F-301 skid
  [7.2, 9.8, -6.5, -3.5],    // Product storage tank TK-401 & pump
  [10.0, 15.0, -5.8, -3.4],  // Packaging machine FL-401, scale WS-401, rollers CV-401

  // Southwest utility block
  [-13.5, -8.0, 4.2, 7.2],   // CW pump P-501, Heat exchanger HX-501
  [-7.8, -3.5, 4.5, 7.5],    // Air compressor AC-701 & air receiver V-701

  // Southeast electrical & ventilation block
  [3.2, 5.8, 5.2, 7.5],      // Motor control centre MCC-801
  [6.2, 8.8, 5.2, 7.5],      // Process control station PLC-801
  [9.5, 12.0, 4.8, 7.2],     // Room extraction fan EX-901
  [12.0, 14.5, 2.8, 6.0],    // Contained sump S-901 & pump P-901

  // Perimeter wall bounds
  [-16.5, -15.5, -10.5, 10.5], // West wall
  [15.5, 16.5, -10.5, 10.5],  // East wall
  [-16.5, 16.5, -10.5, -9.5], // North wall
  [-16.5, -1.2, 9.5, 10.5],   // South wall west
  [1.2, 16.5, 9.5, 10.5]      // South wall east (leaves X: -1.2 to 1.2 doorway open)
];

for (const obstacle of FLOOR_OBSTACLES.slice(0, 13)) {
  obstacle[2] = galleryZ(obstacle[2]);
  obstacle[3] = galleryZ(obstacle[3]);
}

// Check if a point (x, z) is free of obstacles with a given clearance radius
export function isFree(x, z, radius = 0.42) {
  // Room bounds check
  if (x < -15.2 + radius || x > 15.2 - radius) return false;
  if (z < -9.2 + radius || z > 9.2 - radius) return false;

  // Obstacle boxes check
  for (const [minX, maxX, minZ, maxZ] of FLOOR_OBSTACLES) {
    if (
      x >= minX - radius &&
      x <= maxX + radius &&
      z >= minZ - radius &&
      z <= maxZ + radius
    ) {
      return false;
    }
  }
  return true;
}

// Check if a straight-line segment from p1 to p2 is completely free
export function isSegmentClear(p1, p2, radius = 0.42) {
  const dx = p2[0] - p1[0];
  const dz = p2[1] - p1[1];
  const dist = Math.hypot(dx, dz);
  const steps = Math.ceil(dist / 0.15);

  for (let i = 0; i <= steps; i++) {
    const t = i / (steps || 1);
    const x = p1[0] + dx * t;
    const z = p1[1] + dz * t;
    if (!isFree(x, z, radius)) return false;
  }
  return true;
}

// Simulated 2D LiDAR range scan from (x, z) at given angle
export function getLidarRange(x, z, angle, maxDist = 12.0) {
  const cosA = Math.cos(angle);
  const sinA = Math.sin(angle);
  const step = 0.12;

  for (let d = step; d <= maxDist; d += step) {
    const testX = x + sinA * d;
    const testZ = z + cosA * d;
    if (!isFree(testX, testZ, 0.08)) {
      return +d.toFixed(2);
    }
  }
  return +maxDist.toFixed(2);
}

// 2D Grid Graph for A* Path Planning
const GRID_STEP = 0.5;
const MIN_X = -15.0, MAX_X = 15.0;
const MIN_Z = -9.0, MAX_Z = 9.0;
const COLS = Math.round((MAX_X - MIN_X) / GRID_STEP) + 1;
const ROWS = Math.round((MAX_Z - MIN_Z) / GRID_STEP) + 1;

function toGrid(x, z) {
  const c = Math.round((x - MIN_X) / GRID_STEP);
  const r = Math.round((z - MIN_Z) / GRID_STEP);
  return [Math.max(0, Math.min(COLS - 1, c)), Math.max(0, Math.min(ROWS - 1, r))];
}

function fromGrid(c, r) {
  return [+(MIN_X + c * GRID_STEP).toFixed(2), +(MIN_Z + r * GRID_STEP).toFixed(2)];
}

// A* Pathfinding between start and goal
export function planPath(start, goal, radius = 0.42) {
  if (!isFree(start[0], start[1], radius)) return null;
  if (!isFree(goal[0], goal[1], radius)) return null;

  // Direct line-of-sight shortcut
  if (isSegmentClear(start, goal, radius)) {
    return [[+goal[0].toFixed(2), +goal[1].toFixed(2)]];
  }

  const [startC, startR] = toGrid(start[0], start[1]);
  const [goalC, goalR] = toGrid(goal[0], goal[1]);

  const openSet = new Set();
  const startKey = `${startC},${startR}`;
  const goalKey = `${goalC},${goalR}`;

  const cameFrom = new Map();
  const gScore = new Map();
  const fScore = new Map();

  const h = (c, r) => Math.hypot(c - goalC, r - goalR);

  gScore.set(startKey, 0);
  fScore.set(startKey, h(startC, startR));
  openSet.add(startKey);

  while (openSet.size > 0) {
    let currentKey = null;
    let lowestF = Infinity;
    for (const key of openSet) {
      const f = fScore.get(key) ?? Infinity;
      if (f < lowestF) {
        lowestF = f;
        currentKey = key;
      }
    }

    if (currentKey === goalKey) {
      // Reconstruct path
      const path = [];
      let curr = currentKey;
      while (cameFrom.has(curr)) {
        const [c, r] = curr.split(',').map(Number);
        path.unshift(fromGrid(c, r));
        curr = cameFrom.get(curr);
      }
      path.push([+goal[0].toFixed(2), +goal[1].toFixed(2)]);

      // Path smoothing: remove redundant intermediate collinear or line-of-sight nodes
      const smoothed = [];
      let pivot = start;
      smoothed.push(pivot);

      let idx = 0;
      while (idx < path.length) {
        let furthest = idx;
        for (let j = path.length - 1; j > idx; j--) {
          if (isSegmentClear(pivot, path[j], radius)) {
            furthest = j;
            break;
          }
        }
        pivot = path[furthest];
        smoothed.push(pivot);
        idx = furthest + 1;
      }

      smoothed.shift(); // remove start
      return smoothed;
    }

    openSet.delete(currentKey);
    const [c, r] = currentKey.split(',').map(Number);

    // 8-neighbour expansion
    const neighbours = [
      [c + 1, r, 1.0], [c - 1, r, 1.0], [c, r + 1, 1.0], [c, r - 1, 1.0],
      [c + 1, r + 1, 1.414], [c - 1, r + 1, 1.414], [c + 1, r - 1, 1.414], [c - 1, r - 1, 1.414]
    ];

    for (const [nc, nr, cost] of neighbours) {
      if (nc < 0 || nc >= COLS || nr < 0 || nr >= ROWS) continue;
      const [wx, wz] = fromGrid(nc, nr);
      if (!isFree(wx, wz, radius)) continue;

      const nKey = `${nc},${nr}`;
      const tentativeG = (gScore.get(currentKey) ?? Infinity) + cost;

      if (tentativeG < (gScore.get(nKey) ?? Infinity)) {
        cameFrom.set(nKey, currentKey);
        gScore.set(nKey, tentativeG);
        fScore.set(nKey, tentativeG + h(nc, nr));
        openSet.add(nKey);
      }
    }
  }

  return null; // No path found
}
