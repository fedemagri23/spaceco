/**
 * Construye un `THREE.Group` a partir de segmentos de ensamblaje (motores en paralelo + cuerpos).
 * Acepta también el formato antiguo `string[]` (se normaliza).
 */

import * as THREE from 'https://unpkg.com/three@0.128.0/build/three.module.js';
import { PARTS } from '../config/parts.js';
import { normalizeRocketSpec } from '../game/rocketBuild.js';

/**
 * Escala uniforme del modelo respecto a `h`/`r` en `PARTS`.
 */
export const ROCKET_MESH_VISUAL_SCALE = 1.5;

/**
 * Posiciones XZ de centros de motores en un bloque (misma altura Y).
 * 1 centro, 2 línea, 3 triángulo, 4 cuadrado, n≥5 polígono regular.
 * @param {number} n
 * @param {number} r - radio del motor (PARTS)
 * @returns {number[][]} pares [x, z]
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
 * @param {unknown} spec - `BuildSegment[]` o formato antiguo `string[]`
 * @returns {THREE.Group}
 */
export function buildRocketMesh(spec) {
  const segments = normalizeRocketSpec(spec);
  const g = new THREE.Group();
  let yOff = 0;

  segments.forEach((seg) => {
    if (seg.kind === 'motors') {
      const p = PARTS[seg.engineId];
      if (!p) return;
      const offsets = motorOffsetsXZ(seg.count, p.r);
      offsets.forEach(([ox, oz]) => {
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
        m.position.set(ox, yOff + p.h / 2, oz);
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
          ring.position.set(ox, yOff - rb.tube * 0.5, oz);
          ring.castShadow = true;
          g.add(ring);
        }
      });
      yOff += p.h;
    } else {
      const p = PARTS[seg.id];
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
      yOff += p.h;
    }
  });

  g.scale.setScalar(ROCKET_MESH_VISUAL_SCALE);
  return g;
}
