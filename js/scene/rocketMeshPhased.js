/**
 * Malla del cohete agrupada por fase de lanzamiento (motores + cuerpos hasta el siguiente bloque de motores).
 */

import * as THREE from 'https://unpkg.com/three@0.128.0/build/three.module.js';
import { PARTS } from '../config/parts.js';
import { normalizeRocketSpec } from '../game/rocketBuild.js';
import { motorOffsetsXZ, ROCKET_MESH_VISUAL_SCALE } from './rocketMesh.js';

/**
 * @param {unknown} spec
 * @returns {{ root: THREE.Group, phaseGroups: THREE.Group[] }}
 */
export function buildRocketMeshPhased(spec) {
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
        m.userData.isMotor = true;
        pg.add(m);

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
          pg.add(ring);
        }

        /** Estela simple: cilindro rojo bajo la base del motor (eje Y); la altura en vuelo la escala `rocketFlames`. */
        const trailH = Math.max(4.2, p.r * 3.2);
        const trailR = p.r * 0.38;
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
        trail.position.set(ox, yOff - trailH / 2, oz);
        trail.renderOrder = 10;
        trail.userData.baseLength = trailH;
        /** Base del motor (Y local del grupo de fase): el tope del cilindro debe quedar aquí al escalar. */
        trail.userData.trailAnchorY = yOff;
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
        let geo;
        if (bp.shape === 'cone') {
          geo = new THREE.ConeGeometry(bp.r, bp.h, 7);
        } else {
          geo = new THREE.CylinderGeometry(bp.r, bp.r * 1.07, bp.h, 8);
        }
        const m = new THREE.Mesh(
          geo,
          new THREE.MeshLambertMaterial({ color: bp.color, flatShading: true }),
        );
        m.position.y = yOff + bp.h / 2;
        m.castShadow = true;
        pg.add(m);
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
