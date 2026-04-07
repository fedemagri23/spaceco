/**
 * Malla del cohete agrupada por fase de lanzamiento (motores + cuerpos hasta el siguiente bloque de motores).
 */

import * as THREE from 'https://unpkg.com/three@0.128.0/build/three.module.js';
import { PARTS } from '../config/parts.js';
import { normalizeRocketSpec } from '../game/rocketBuild.js';
import { ROCKET_MESH_VISUAL_SCALE } from './rocketMesh.js';
import { appendMotorCluster, createPartMesh, createPayloadMesh } from './rocketMeshFactory.js';

/**
 * @param {unknown} spec
 * @param {string | null} payloadId
 * @returns {{ root: THREE.Group, phaseGroups: THREE.Group[] }}
 */
export function buildRocketMeshPhased(spec, payloadId = null) {
  const segments = normalizeRocketSpec(spec);
  const root = new THREE.Group();
  /** @type {THREE.Group[]} */
  const phaseGroups = [];

  let segIdx = 0;
  let baseY = 0;

  while (segIdx < segments.length) {
    const seg = segments[segIdx];
    if (seg.kind !== 'motors') {
      segIdx++;
      continue;
    }

    const phaseIndex = phaseGroups.length + 1;
    const pg = new THREE.Group();
    pg.userData.phaseIndex = phaseIndex;
    pg.userData.originalPhaseIndex = phaseIndex;
    pg.userData.flameMeshes = [];

    let yOff = 0;
    const p = PARTS[seg.engineId];
    if (p) {
      appendMotorCluster(pg, seg.engineId, seg.count, yOff, (m, { ox, oz, part, yOff: yBase }) => {
        m.userData.isMotor = true;
        /** Estela simple: cilindro rojo bajo la base del motor (eje Y); la altura en vuelo la escala `rocketFlames`. */
        const trailH = Math.max(4.2, part.r * 3.2);
        const trailR = part.r * 0.38;
        const trailGeo = new THREE.CylinderGeometry(trailR, trailR * 1.08, trailH, 10);
        const trail = new THREE.Mesh(
          trailGeo,
          new THREE.MeshBasicMaterial({
            color: 0xd82222,
            transparent: true,
            opacity: 0.9,
            depthTest: false,
            depthWrite: false,
          }),
        );
        trail.position.set(ox, yBase - trailH / 2, oz);
        trail.renderOrder = 10;
        trail.userData.baseLength = trailH;
        /** Base del motor (Y local del grupo de fase): el tope del cilindro debe quedar aquí al escalar. */
        trail.userData.trailAnchorY = yBase;
        trail.userData.phaseIndex = phaseIndex;
        trail.userData.originalPhaseIndex = phaseIndex;
        trail.visible = false;
        pg.add(trail);
        pg.userData.flameMeshes.push(trail);
      });
      yOff += p.h;
    }

    segIdx++;
    while (segIdx < segments.length && segments[segIdx].kind === 'body') {
      const bs = segments[segIdx];
      const bp = PARTS[bs.id];
      if (bp) {
        const m = createPartMesh(bs.id);
        if (!m) {
          segIdx++;
          continue;
        }
        m.position.y = yOff + bp.h / 2;
        pg.add(m);

        if (bs.id === 'payloadBay' && payloadId) {
          const payloadMesh = createPayloadMesh(payloadId);
          if (payloadMesh) {
            payloadMesh.position.y = yOff + bp.h / 2;
            pg.add(payloadMesh);
            root.userData.payloadMesh = payloadMesh;
          }
        }

        yOff += bp.h;
      }
      segIdx++;
    }

    const phaseHeight = yOff;
    pg.userData.phaseHeight = phaseHeight;
    pg.position.y = baseY;
    baseY += phaseHeight;
    root.add(pg);
    phaseGroups.push(pg);
  }

  root.scale.setScalar(ROCKET_MESH_VISUAL_SCALE);
  root.userData.phaseGroups = phaseGroups;
  return { root, phaseGroups };
}
