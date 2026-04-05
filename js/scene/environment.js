/**
 * Entorno visual: océano, terreno procedural con colores por altura, grid y decoración
 * no interactiva (árboles, tanques). No depende de la lógica de negocio del juego.
 */

import * as THREE from 'https://unpkg.com/three@0.128.0/build/three.module.js';
import { scene } from './setup.js';

/**
 * Crea un árbol simple (tronco + copa) en (x, z).
 * @param {number} x
 * @param {number} z
 * @param {number} [s=1] escala
 */
function tree(x, z, s = 1) {
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.9 * s, 1.3 * s, 5 * s, 5),
    new THREE.MeshLambertMaterial({ color: 0x6b3a1a, flatShading: true }),
  );
  trunk.position.set(x, 2.5 * s, z);
  trunk.castShadow = true;
  scene.add(trunk);

  const crown = new THREE.Mesh(
    new THREE.ConeGeometry(5 * s, 10 * s, 5),
    new THREE.MeshLambertMaterial({ color: 0x27ae3f, flatShading: true }),
  );
  crown.position.set(x, 11 * s, z);
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
  const m = new THREE.Mesh(
    new THREE.CylinderGeometry(6, 6, 14, 8),
    new THREE.MeshLambertMaterial({ color: 0x99aacc, flatShading: true }),
  );
  m.position.set(x, 7, z);
  m.castShadow = true;
  m.receiveShadow = true;
  scene.add(m);
  const dome = new THREE.Mesh(
    new THREE.SphereGeometry(6, 8, 4, 0, Math.PI * 2, 0, Math.PI / 2),
    new THREE.MeshLambertMaterial({ color: 0x8899bb, flatShading: true }),
  );
  dome.position.set(x, 14, z);
  scene.add(dome);
}

/**
 * Genera terreno con ruido y colorea vértices por altura.
 */
function makeTerrain() {
  const SIZE = 750;
  const SEGS = 26;
  let geo = new THREE.PlaneGeometry(SIZE, SIZE, SEGS, SEGS);
  geo.rotateX(-Math.PI / 2);

  const pos0 = geo.attributes.position;
  for (let i = 0; i < pos0.count; i++) {
    const x = pos0.getX(i);
    const z = pos0.getZ(i);
    const nx = Math.abs(x) / (SIZE / 2);
    const nz = Math.abs(z) / (SIZE / 2);
    const edge = Math.max(nx, nz);

    let h = Math.sin(x * 0.038) * Math.cos(z * 0.032) * 9
      + Math.sin(x * 0.019 + 1.1) * Math.sin(z * 0.022 + 0.7) * 5
      + (Math.random() - 0.5) * 2.5;

    if (edge > 0.75) h *= Math.max(0, 1 - (edge - 0.75) / 0.25);
    pos0.setY(i, Math.max(0, h));
  }

  geo = geo.toNonIndexed();
  geo.computeVertexNormals();

  const posNI = geo.attributes.position;
  const cnt = posNI.count;
  const cols = new Float32Array(cnt * 3);

  for (let i = 0; i < cnt; i += 3) {
    const h = (posNI.getY(i) + posNI.getY(i + 1) + posNI.getY(i + 2)) / 3;
    let r; let g; let b;
    if (h < 1.0) { r = 0.93; g = 0.79; b = 0.35; } else if (h < 4.5) { r = 0.17; g = 0.76; b = 0.21; } else { r = 0.13; g = 0.58; b = 0.16; }

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
  grid.position.y = 0.6;
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
