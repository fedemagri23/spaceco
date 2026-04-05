/**
 * Edificios y props del mapa: plataforma, galpón, centro de distribución, caminos, camiones.
 *
 * Las mallas que deben abrir UI se registran con `registerClickable`.
 * La geometría decorativa usa helpers locales sin registro.
 */

import * as THREE from 'https://unpkg.com/three@0.128.0/build/three.module.js';
import { scene } from './setup.js';
import { registerClickable } from './interaction.js';

/**
 * Caja con sombras, anclada con la base en y (el centro Y se desplaza +h/2).
 * @param {number} w
 * @param {number} h
 * @param {number} d
 * @param {number} color
 * @param {number} x
 * @param {number} y
 * @param {number} z
 * @param {boolean} [cast=true]
 * @returns {THREE.Mesh}
 */
function box(w, h, d, color, x, y, z, cast = true) {
  const m = new THREE.Mesh(
    new THREE.BoxGeometry(w, h, d),
    new THREE.MeshLambertMaterial({ color, flatShading: true }),
  );
  m.position.set(x, y + h / 2, z);
  m.castShadow = cast;
  m.receiveShadow = true;
  scene.add(m);
  return m;
}

/**
 * Camión decorativo (no clickeable).
 * @param {number} x
 * @param {number} z
 * @param {number} [rotation=0]
 */
function truck(x, z, rotation = 0) {
  const body = box(8, 3.5, 4, 0xff6644, x, 0, z, true);
  body.rotation.y = rotation;

  const cabin = box(3, 3, 3, 0xff5533, x - 4.5, 0, z, true);
  cabin.rotation.y = rotation;

  const wheelMat = new THREE.MeshLambertMaterial({ color: 0x222222, flatShading: true });
  const mkWheel = (wx, wz) => {
    const wmesh = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 0.8, 16), wheelMat);
    wmesh.position.set(wx, 1, wz);
    wmesh.rotation.z = Math.PI / 2;
    wmesh.castShadow = true;
    scene.add(wmesh);
  };
  mkWheel(x - 2, z - 2.2);
  mkWheel(x - 2, z + 2.2);
  mkWheel(x + 3, z - 2.2);
  mkWheel(x + 3, z + 2.2);
}

/** Construye toda la arquitectura del nivel. Llamar una vez tras `initScene`. */
export function createBuildings() {
  const PAD_X = 55;
  const PAD_Z = 0;
  const PAD_Y = 5;

  registerClickable(box(48, 5, 48, 0x8899aa, PAD_X, 0, PAD_Z), 'launchpad', ':: Plataforma de Lanzamiento');
  box(20, 4.6, 12, 0x556677, PAD_X, 0, PAD_Z);
  registerClickable(box(38, 1, 38, 0x667788, PAD_X, 5, PAD_Z), 'launchpad', ':: Plataforma de Lanzamiento');

  box(6, 40, 6, 0x889aab, PAD_X - 20, 0, PAD_Z - 14);
  box(6, 40, 6, 0x889aab, PAD_X - 20, 0, PAD_Z + 14);
  box(30, 3, 3, 0x778899, PAD_X - 5, 40, PAD_Z);
  box(30, 2, 2, 0x778899, PAD_X - 5, 28, PAD_Z);

  box(3, 1, 28, 0x778899, PAD_X - 20, 12, PAD_Z);
  box(3, 1, 28, 0x778899, PAD_X - 20, 24, PAD_Z);
  box(3, 1, 28, 0x778899, PAD_X - 20, 36, PAD_Z);

  const WH_X = -85;
  const WH_Z = 30;
  registerClickable(box(65, 22, 40, 0xcc8833, WH_X, 0, WH_Z), 'warehouse', ':: Galpón de Ensamblaje');
  registerClickable(box(68, 9, 43, 0xaa6622, WH_X, 22, WH_Z), 'warehouse', ':: Galpón de Ensamblaje');
  box(12, 16, 1.5, 0x221100, WH_X, 0, WH_Z + 20.5);
  box(8, 4, 1, 0x331500, WH_X - 18, 14, WH_Z + 20.5);
  box(8, 4, 1, 0x331500, WH_X + 18, 14, WH_Z + 20.5);
  box(70, 3, 4, 0x995511, WH_X, 31, WH_Z);

  box(140, 0.4, 10, 0x556655, -15, 0, PAD_Z, false);

  const DC_X = -85;
  const DC_Z = -100;

  registerClickable(box(70, 18, 50, 0x667799, DC_X, 0, DC_Z), 'store', ':: Centro de Distribución');
  registerClickable(box(75, 8, 55, 0x5566aa, DC_X, 18, DC_Z), 'store', ':: Centro de Distribución');

  box(14, 14, 2, 0x333355, DC_X - 30, 0, DC_Z + 25.5);
  box(14, 14, 2, 0x333355, DC_X + 30, 0, DC_Z + 25.5);

  truck(DC_X - 50, DC_Z + 35, 0.3);
  truck(DC_X - 35, DC_Z + 40, 0.5);
  truck(DC_X, DC_Z + 38, 0.2);
  truck(DC_X + 40, DC_Z + 35, -0.3);
}
