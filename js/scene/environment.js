/**
 * Entorno visual: océano, isla con meseta lisa para edificios, orilla orgánica, grid y decoración
 * no interactiva (árboles, tanques). No depende de la lógica de negocio del juego.
 */

import * as THREE from 'https://unpkg.com/three@0.128.0/build/three.module.js';
import { scene } from './setup.js';

/** Altura Y de la superficie donde se apoyan edificios y plataforma (debe coincidir con `createBuildings`). */
export const BUILD_ZONE_SURFACE_Y = 0;

const PLATEAU = {
  cx: -12,
  cz: -28,
  rx: 242,
  rz: 202,
};

const ISLAND = {
  cx: -6,
  cz: -20,
};

function smoothstep(edge0, edge1, x) {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

/** 0 en el centro de la meseta, sube hacia 1 fuera del elipse (zona de construcción). */
function plateauMetric(x, z) {
  const nx = (x - PLATEAU.cx) / PLATEAU.rx;
  const nz = (z - PLATEAU.cz) / PLATEAU.rz;
  return nx * nx + nz * nz;
}

/** Radio de costa variable con el ángulo: isla no rectangular. */
function shoreRadius(angle) {
  return (
    312
    + 54 * Math.sin(3 * angle + 0.35)
    + 36 * Math.sin(5 * angle - 1.05)
    + 26 * Math.cos(2 * angle + 0.75)
    + 18 * Math.sin(7 * angle + 2.0)
  );
}

/** Relieve fuera de la meseta (solo funciones deterministas, sin ruido por vértice aleatorio). */
function hillHeight(x, z) {
  return (
    Math.sin(x * 0.022) * Math.cos(z * 0.018) * 10
    + Math.sin(x * 0.0105 + z * 0.0125) * 6.5
    + Math.sin(x * 0.038 + 1.4) * Math.cos(z * 0.034 - 0.85) * 3.5
  );
}

/**
 * Altura del terreno en (x,z). La zona de edificios coincide con BUILD_ZONE_SURFACE_Y.
 * @param {number} x
 * @param {number} z
 */
export function terrainHeightAt(x, z) {
  const pm = plateauMetric(x, z);
  const yLand = pm <= 1
    ? BUILD_ZONE_SURFACE_Y
    : BUILD_ZONE_SURFACE_Y + smoothstep(1, 1.12, pm) * hillHeight(x, z);

  const dx = x - ISLAND.cx;
  const dz = z - ISLAND.cz;
  const r = Math.hypot(dx, dz);
  const angle = Math.atan2(dz, dx);
  const rLim = shoreRadius(angle);

  const shoreT = smoothstep(rLim - 38, rLim + 16, r);
  const beachY = -3.4;
  let y = yLand * (1 - shoreT) + beachY * shoreT;

  const deepT = smoothstep(rLim + 20, rLim + 52, r);
  y = y * (1 - deepT) + (-15.5) * deepT;
  return y;
}

function terrainColorAt(x, z, y) {
  const pm = plateauMetric(x, z);
  const dx = x - ISLAND.cx;
  const dz = z - ISLAND.cz;
  const r = Math.hypot(dx, dz);
  const rLim = shoreRadius(Math.atan2(dz, dx));

  const grass = { r: 0.2, g: 0.74, b: 0.32 };
  const grassDeep = { r: 0.14, g: 0.58, b: 0.24 };
  const sand = { r: 0.9, g: 0.82, b: 0.58 };
  const slope = { r: 0.24, g: 0.62, b: 0.3 };

  if (pm <= 1.02) return grass;
  if (y < -9) return { r: 0.06, g: 0.22, b: 0.28 };
  if (r > rLim - 28 && y < 1.5) {
    const sandMix = smoothstep(rLim - 36, rLim + 6, r);
    if (sandMix > 0.35) {
      const t = smoothstep(0.35, 1, sandMix);
      return {
        r: grassDeep.r * (1 - t) + sand.r * t,
        g: grassDeep.g * (1 - t) + sand.g * t,
        b: grassDeep.b * (1 - t) + sand.b * t,
      };
    }
  }
  if (y > 2.5) return grassDeep;
  const hillBlend = smoothstep(1, 1.2, pm);
  return {
    r: grass.r * (1 - hillBlend) + slope.r * hillBlend,
    g: grass.g * (1 - hillBlend) + slope.g * hillBlend,
    b: grass.b * (1 - hillBlend) + slope.b * hillBlend,
  };
}

/**
 * Crea un árbol simple (tronco + copa) en (x, z).
 * @param {number} x
 * @param {number} z
 * @param {number} [s=1] escala
 */
function tree(x, z, s = 1) {
  const gy = terrainHeightAt(x, z);
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.9 * s, 1.3 * s, 5 * s, 5),
    new THREE.MeshLambertMaterial({ color: 0x6b3a1a, flatShading: true }),
  );
  trunk.position.set(x, gy + 2.5 * s, z);
  trunk.castShadow = true;
  scene.add(trunk);

  const crown = new THREE.Mesh(
    new THREE.ConeGeometry(5 * s, 10 * s, 5),
    new THREE.MeshLambertMaterial({ color: 0x27ae3f, flatShading: true }),
  );
  crown.position.set(x, gy + 11 * s, z);
  crown.rotation.y = Math.random() * Math.PI * 2;
  crown.castShadow = true;
  scene.add(crown);
}

/**
 * Tanque de almacenamiento cilíndrico decorativo.
 * @param {number} x
 * @param {number} z
 */
function storageTank(x, z) {
  const gy = terrainHeightAt(x, z);
  const m = new THREE.Mesh(
    new THREE.CylinderGeometry(6, 6, 14, 8),
    new THREE.MeshLambertMaterial({ color: 0x99aacc, flatShading: true }),
  );
  m.position.set(x, gy + 7, z);
  m.castShadow = true;
  m.receiveShadow = true;
  scene.add(m);
  const dome = new THREE.Mesh(
    new THREE.SphereGeometry(6, 8, 4, 0, Math.PI * 2, 0, Math.PI / 2),
    new THREE.MeshLambertMaterial({ color: 0x8899bb, flatShading: true }),
  );
  dome.position.set(x, gy + 14, z);
  scene.add(dome);
}

/**
 * Isla: meseta elíptica plana (verde uniforme) + colinas fuera + costa irregular hacia el mar.
 */
function makeTerrain() {
  const SIZE = 750;
  const SEGS = 64;
  let geo = new THREE.PlaneGeometry(SIZE, SIZE, SEGS, SEGS);
  geo.rotateX(-Math.PI / 2);

  const pos0 = geo.attributes.position;
  for (let i = 0; i < pos0.count; i++) {
    const x = pos0.getX(i);
    const z = pos0.getZ(i);
    pos0.setY(i, terrainHeightAt(x, z));
  }
  pos0.needsUpdate = true;

  geo = geo.toNonIndexed();
  geo.computeVertexNormals();

  const posNI = geo.attributes.position;
  const cnt = posNI.count;
  const cols = new Float32Array(cnt * 3);

  for (let i = 0; i < cnt; i += 3) {
    const hx = (posNI.getX(i) + posNI.getX(i + 1) + posNI.getX(i + 2)) / 3;
    const hz = (posNI.getZ(i) + posNI.getZ(i + 1) + posNI.getZ(i + 2)) / 3;
    const hy = (posNI.getY(i) + posNI.getY(i + 1) + posNI.getY(i + 2)) / 3;
    const { r, g, b } = terrainColorAt(hx, hz, hy);

    for (let j = 0; j < 3; j++) {
      cols[(i + j) * 3] = r;
      cols[(i + j) * 3 + 1] = g;
      cols[(i + j) * 3 + 2] = b;
    }
  }
  geo.setAttribute('color', new THREE.BufferAttribute(cols, 3));

  const mat = new THREE.MeshLambertMaterial({ vertexColors: true, flatShading: true });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.receiveShadow = true;
  scene.add(mesh);
}

/**
 * Añade océano, terreno, grid, árboles y tanques a la escena ya inicializada.
 */
export function createEnvironment() {
  const oceanMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(6000, 6000, 6, 6),
    new THREE.MeshLambertMaterial({ color: 0x0088cc, flatShading: true }),
  );
  oceanMesh.rotation.x = -Math.PI / 2;
  oceanMesh.position.y = -12;
  oceanMesh.receiveShadow = true;
  scene.add(oceanMesh);

  makeTerrain();

  const grid = new THREE.GridHelper(750, 38, 0x004466, 0x003355);
  grid.material.opacity = 0.2;
  grid.material.transparent = true;
  grid.position.y = BUILD_ZONE_SURFACE_Y + 0.08;
  scene.add(grid);

  const treeSpots = [
    [-30, -70, 1], [-15, -90, 0.9], [-50, -55, 1.1], [-5, -110, 1],
    [15, -130, 0.85], [-65, 75, 1], [65, 65, 0.9], [105, 85, 1.1],
    [135, 50, 0.9], [85, -65, 1], [145, -30, 0.95], [-150, -40, 1.05],
    [-140, 60, 0.9], [160, 20, 1], [-110, -80, 0.85],
  ];
  treeSpots.forEach(([x, z, s]) => tree(x, z, s));

  storageTank(-140, -20);
  storageTank(-155, -20);
  storageTank(-140, -38);
}
