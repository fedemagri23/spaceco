/**
 * Factoría compartida para construir geometría de cohetes.
 */

import * as THREE from 'https://unpkg.com/three@0.128.0/build/three.module.js';
import { PARTS } from '../config/parts.js';

/**
 * Posiciones XZ de centros de motores en un bloque (misma altura Y).
 * 1 centro, 2 línea, 3 triángulo, 4 cuadrado, n≥5 polígono regular.
 * @param {number} n
 * @param {number} r
 * @returns {number[][]}
 */
export function motorOffsetsXZ(n, r) {
  const minD = r * 2.45;
  if (n <= 0) return [];
  if (n === 1) return [[0, 0]];
  if (n === 2) {
    const d = minD * 0.5;
    return [[-d, 0], [d, 0]];
  }
  if (n === 4) {
    const s = minD * 0.52;
    return [[s, s], [s, -s], [-s, s], [-s, -s]];
  }
  const R = minD / (2 * Math.sin(Math.PI / n));
  const out = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + Math.PI / 2;
    out.push([Math.cos(a) * R, Math.sin(a) * R]);
  }
  return out;
}

/**
 * @param {string} partId
 * @returns {THREE.Mesh | null}
 */
export function createPartMesh(partId) {
  const p = PARTS[partId];
  if (!p) return null;
  const geo = p.shape === 'cone'
    ? new THREE.ConeGeometry(p.r, p.h, 7)
    : new THREE.CylinderGeometry(p.r, p.r * 1.07, p.h, 8);
  const m = new THREE.Mesh(
    geo,
    new THREE.MeshLambertMaterial({ color: p.color, flatShading: true }),
  );
  m.castShadow = true;
  return m;
}

/**
 * @param {THREE.Object3D} targetGroup
 * @param {string} engineId
 * @param {number} count
 * @param {number} yOff
 * @param {(engineMesh: THREE.Mesh, meta: { ox: number, oz: number, part: any, yOff: number }) => void} [onEachEngine]
 */
export function appendMotorCluster(targetGroup, engineId, count, yOff, onEachEngine) {
  const p = PARTS[engineId];
  if (!p) return;
  const offsets = motorOffsetsXZ(count, p.r);
  offsets.forEach(([ox, oz]) => {
    const m = createPartMesh(engineId);
    if (!m) return;
    m.position.set(ox, yOff + p.h / 2, oz);
    targetGroup.add(m);

    if (p.ringBelow) {
      const rb = p.ringBelow;
      const ringGeo = new THREE.TorusGeometry(rb.majorR, rb.tube, 8, 16);
      const ring = new THREE.Mesh(
        ringGeo,
        new THREE.MeshLambertMaterial({ color: rb.color, flatShading: true }),
      );
      ring.rotation.x = Math.PI / 2;
      ring.position.set(ox, yOff - rb.tube * 0.5, oz);
      ring.castShadow = true;
      targetGroup.add(ring);
    }

    if (onEachEngine) onEachEngine(m, { ox, oz, part: p, yOff });
  });
}
