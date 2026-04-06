/**
 * Construye un `THREE.Group` a partir de segmentos de ensamblaje (motores en paralelo + cuerpos).
 * Acepta también el formato antiguo `string[]` (se normaliza).
 */

import * as THREE from 'https://unpkg.com/three@0.128.0/build/three.module.js';
import { PARTS } from '../config/parts.js';
import { normalizeRocketSpec } from '../game/rocketBuild.js';
import { createPartMesh, appendMotorCluster, motorOffsetsXZ } from './rocketMeshFactory.js';

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
export { motorOffsetsXZ };

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
      appendMotorCluster(g, seg.engineId, seg.count, yOff);
      yOff += p.h;
    } else {
      const p = PARTS[seg.id];
      if (!p) return;
      const m = createPartMesh(seg.id);
      if (!m) return;
      m.position.y = yOff + p.h / 2;
      g.add(m);
      yOff += p.h;
    }
  });

  g.scale.setScalar(ROCKET_MESH_VISUAL_SCALE);
  return g;
}
