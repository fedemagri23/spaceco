/**
 * Construye un `THREE.Group` apilando segmentos según ids de piezas y `PARTS`.
 * Usado en la escena 3D principal, en la plataforma y en los canvas UI de previews.
 */

import * as THREE from 'https://unpkg.com/three@0.128.0/build/three.module.js';
import { PARTS } from '../config/parts.js';

/**
 * @param {string[]} parts - ids en orden de apilado (base → punta)
 * @returns {THREE.Group}
 */
export function buildRocketMesh(parts) {
  const g = new THREE.Group();
  let yOff = 0;
  parts.forEach((key) => {
    const p = PARTS[key];
    if (!p) return;
    let geo;
    if (p.shape === 'cone') {
      geo = new THREE.ConeGeometry(p.r, p.h, 7);
    } else {
      geo = new THREE.CylinderGeometry(p.r, p.r * 1.07, p.h, 8);
    }
    const m = new THREE.Mesh(
      geo,
      new THREE.MeshLambertMaterial({ color: p.color, flatShading: true }),
    );
    m.position.y = yOff + p.h / 2;
    m.castShadow = true;
    yOff += p.h;
    g.add(m);
  });
  return g;
}
