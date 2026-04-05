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
 * Cilindro con sombras, anclado con la base en y.
 * @param {number} rTop Radio superior
 * @param {number} rBottom Radio inferior
 * @param {number} h Altura
 * @param {number} color
 * @param {number} x
 * @param {number} y
 * @param {number} z
 * @param {boolean} [cast=true]
 * @returns {THREE.Mesh}
 */
function cylinder(rTop, rBottom, h, color, x, y, z, cast = true) {
  const m = new THREE.Mesh(
    new THREE.CylinderGeometry(rTop, rBottom, h, 32), // 32 segmentos para que se vea suave
    new THREE.MeshLambertMaterial({ color, flatShading: true })
  );
  // Anclamos la base en Y
  m.position.set(x, y + h / 2, z);
  m.castShadow = cast;
  m.receiveShadow = true;
  scene.add(m);
  return m;
}

/**
 * Esfera con sombras, apoyada en su base (y).
 * @param {number} r Radio
 * @param {number} color
 * @param {number} x
 * @param {number} y
 * @param {number} z
 * @param {boolean} [cast=true]
 * @returns {THREE.Mesh}
 */
function sphere(r, color, x, y, z, cast = true) {
  const m = new THREE.Mesh(
    new THREE.SphereGeometry(r, 32, 16),
    new THREE.MeshLambertMaterial({ color, flatShading: true })
  );
  // Anclamos la base de la esfera en Y (y + radio)
  m.position.set(x, y + r, z);
  m.castShadow = cast;
  m.receiveShadow = true;
  scene.add(m);
  return m;
}

/**
 * Cono con sombras, anclado con la base en y.
 * @param {number} r Radio de la base
 * @param {number} h Altura
 * @param {number} color
 * @param {number} x
 * @param {number} y
 * @param {number} z
 * @param {boolean} [cast=true]
 * @returns {THREE.Mesh}
 */
function cone(r, h, color, x, y, z, cast = true) {
  const m = new THREE.Mesh(
    new THREE.ConeGeometry(r, h, 32),
    new THREE.MeshLambertMaterial({ color, flatShading: true })
  );
  // Anclamos la base en Y
  m.position.set(x, y + h / 2, z);
  m.castShadow = cast;
  m.receiveShadow = true;
  scene.add(m);
  return m;
}

/**
 * Plato parabólico con sombras, apoyado sobre su vértice base (y).
 * @param {number} r Radio de la esfera original
 * @param {number} depth Profundidad del plato (Ángulo en radianes, ej: Math.PI / 3)
 * @param {number} color
 * @param {number} x
 * @param {number} y
 * @param {number} z
 * @param {boolean} [cast=true]
 * @returns {THREE.Mesh}
 */
function dish(r, depth, color, x, y, z, cast = true) {
  const m = new THREE.Mesh(
    new THREE.SphereGeometry(r, 32, 16, 0, Math.PI * 2, 0, depth),
    new THREE.MeshLambertMaterial({ 
      color, 
      flatShading: true, 
      side: THREE.DoubleSide
    })
  );
  
  m.rotation.x = Math.PI; 
  
  m.position.set(x, y + r, z);
  
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

function buildAntenna(x, y, z, scale) {
  const colorGris = 0x888888;
  const colorOscuro = 0x444444;
  const colorRojo = 0xff0000;

  box(2 * scale, 0.5 * scale, 2 * scale, colorGris, x, y, z);
  cone(0.8 * scale, 1 * scale, colorOscuro, x, y + 0.5 * scale, z);
  cylinder(0.1 * scale, 0.2 * scale, 4 * scale, colorGris, x, y + 1.5 * scale, z);
  sphere(0.25 * scale, colorRojo, x, y + 5.5 * scale, z);
  const arm = cylinder(0.05 * scale, 0.05 * scale, 2 * scale, colorOscuro, x, y + 4 * scale, z);
  arm.rotation.z = Math.PI / 2;
}

function buildParabolicAntenna(x, y, z, scale) {
  const colorBase = 0x444444;
  const colorPlato = 0xdddddd;
  const colorLNB = 0xff3300;

  cylinder(0.1 * scale, 0.15 * scale, 2 * scale, colorBase, x, y, z);

  const head = new THREE.Group();
  head.position.set(x, y + 2 * scale, z);
  scene.add(head);

  const plate = dish(1.5 * scale, Math.PI / 3.5, colorPlato, 0, 0, 0);
  head.add(plate);

  const arm = cylinder(0.02 * scale, 0.02 * scale, 1.2 * scale, colorBase, 0, 0, 0);
  head.add(arm);

  const receptor = sphere(0.1 * scale, colorLNB, 0, 1.2, 0);
  head.add(receptor);

  head.rotation.x = Math.PI / 4;
  head.rotation.y = Math.PI / 6;
}

/** Construye toda la arquitectura del nivel. Llamar una vez tras `initScene`. */
export function createBuildings() {
  const PAD_X = -265;
  const PAD_Z = 100;

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

  const CC_X = 65;
  const CC_Z = -100;

  registerClickable(box(48, 16, 48, 0x9f9f9f, CC_X, 0, CC_Z), 'control_tower', ':: Torre de control');
  registerClickable(box(48, 8, 48, 0x4ba8fa, CC_X, 16, CC_Z), 'control_tower', ':: Torre de control');
  registerClickable(box(48, 4, 48, 0x9f9f9f, CC_X, 24, CC_Z), 'control_tower', ':: Torre de control');
  registerClickable(box(48, 8, 48, 0x4ba8fa, CC_X, 28, CC_Z), 'control_tower', ':: Torre de control');
  registerClickable(box(48, 4, 48, 0x9f9f9f, CC_X, 36, CC_Z), 'control_tower', ':: Torre de control');
  buildAntenna(CC_X - 14, 40, CC_Z + 14, 3);
  registerClickable(box(22, 8, 22, 0x9f9f9f, CC_X+8, 40, CC_Z+8), 'control_tower', ':: Torre de control');
  buildParabolicAntenna(CC_X + 8, 48, CC_Z + 8, 10);
}
