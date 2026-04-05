/**
 * Construye un `THREE.Group` apilando segmentos según ids de piezas y `PARTS`.
 * Usado en la escena 3D principal, en la plataforma y en los canvas UI de previews.
 */

import * as THREE from 'https://unpkg.com/three@0.128.0/build/three.module.js';
import { PARTS } from '../config/parts.js';

/**
 * Escala uniforme del modelo respecto a `h`/`r` en `PARTS`.
 * La plataforma (~38×38) y las miniaturas UI encuadran bien con ~2.
 */
export const ROCKET_MESH_VISUAL_SCALE = 1.5;

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
    g.add(m);

    if (p.ringBelow) {
      const rb = p.ringBelow;
      const ringGeo = new THREE.TorusGeometry(rb.majorR, rb.tube, 8, 16);
      const ring = new THREE.Mesh(
        ringGeo,
        new THREE.MeshLambertMaterial({ color: rb.color, flatShading: true }),
      );
      ring.rotation.x = Math.PI / 2;
      ring.position.y = yOff - rb.tube * 0.5;
      ring.castShadow = true;
      g.add(ring);
    }

    yOff += p.h;
  });
  g.scale.setScalar(ROCKET_MESH_VISUAL_SCALE);
  return g;
}