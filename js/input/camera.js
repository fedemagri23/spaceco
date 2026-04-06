/**
 * Órbita esférica alrededor de un punto objetivo: rotar (botón izq), pan (botón der), zoom (rueda).
 * Modo seguimiento: apunta a la fase superior del cohete en plataforma / vuelo.
 */

import * as THREE from 'https://unpkg.com/three@0.128.0/build/three.module.js';
import { camera, renderer } from '../scene/setup.js';
import { getPadRocketGroup } from '../scene/rocketPad.js';
import {
  FOLLOW_CAMERA_DEFAULT_YAW,
  FOLLOW_CAMERA_DISTANCE_MIN,
  FOLLOW_CAMERA_DISTANCE_MAX,
  FOLLOW_CAMERA_BOOTSTRAP_MIN,
  FOLLOW_CAMERA_BOOTSTRAP_MAX,
} from '../config/cameraTuning.js';

/** Estado de la cámara orbital. */
export const cam = {
  theta: 0.55,
  phi: 0.88,
  radius: 680,
  tx: 0,
  ty: 0,
  tz: 0,
};

/**
 * Aplica posición y `lookAt` según `cam`.
 */
export function updateCam() {
  const st = Math.sin(cam.theta);
  const ct = Math.cos(cam.theta);
  const sp = Math.sin(cam.phi);
  const cp = Math.cos(cam.phi);
  camera.position.set(
    cam.tx + cam.radius * sp * st,
    cam.ty + cam.radius * cp,
    cam.tz + cam.radius * sp * ct,
  );
  camera.lookAt(cam.tx, cam.ty, cam.tz);
}

const drag = { active: false, pan: false, sx: 0, sy: 0, downX: 0, downY: 0 };

let cameraFollowMode = false;
/** @type {{ theta: number, phi: number, radius: number, tx: number, ty: number, tz: number } | null} */
let savedCamForFollow = null;

/** Distancia horizontal aprox. al cohete en modo seguimiento (rueda la ajusta). */
let followDistance = 280;
/** Ángulo en XZ desde el que se mira el objetivo (rad). */
const followYaw = FOLLOW_CAMERA_DEFAULT_YAW;

const _followBox = new THREE.Box3();

/**
 * Activa o desactiva la cámara que sigue la parte superior del cohete (fase más alta).
 * @param {boolean} on
 * @returns {boolean} false si se pidió activar sin cohete en escena
 */
export function setCameraFollowMode(on) {
  if (on) {
    if (!getPadRocketGroup()) return false;
    savedCamForFollow = {
      theta: cam.theta,
      phi: cam.phi,
      radius: cam.radius,
      tx: cam.tx,
      ty: cam.ty,
      tz: cam.tz,
    };
    followDistance = Math.max(FOLLOW_CAMERA_BOOTSTRAP_MIN, Math.min(FOLLOW_CAMERA_BOOTSTRAP_MAX, cam.radius * 0.48));
    cameraFollowMode = true;
    return true;
  }
  cameraFollowMode = false;
  if (savedCamForFollow) {
    cam.theta = savedCamForFollow.theta;
    cam.phi = savedCamForFollow.phi;
    cam.radius = savedCamForFollow.radius;
    cam.tx = savedCamForFollow.tx;
    cam.ty = savedCamForFollow.ty;
    cam.tz = savedCamForFollow.tz;
    savedCamForFollow = null;
    updateCam();
  }
  return true;
}

export function isCameraFollowMode() {
  return cameraFollowMode;
}

/**
 * Actualiza posición y mirada hacia la fase superior del cohete (cada frame si el modo está activo).
 */
export function updateFollowCameraFromRocket() {
  if (!cameraFollowMode) return;
  const rocket = getPadRocketGroup();
  if (!rocket) {
    setCameraFollowMode(false);
    return;
  }

  let targetObj = /** @type {THREE.Object3D} */ (rocket);
  const groups = rocket.userData.phaseGroups;
  if (groups && groups.length > 0) {
    let best = groups[0];
    let maxO = best.userData.originalPhaseIndex ?? 0;
    for (let i = 1; i < groups.length; i++) {
      const g = groups[i];
      const o = g.userData.originalPhaseIndex ?? 0;
      if (o > maxO) {
        maxO = o;
        best = g;
      }
    }
    targetObj = best;
  }

  _followBox.setFromObject(targetObj);
  const aimX = (_followBox.min.x + _followBox.max.x) * 0.5;
  const aimZ = (_followBox.min.z + _followBox.max.z) * 0.5;
  const tipY = _followBox.max.y;
  const midY = (_followBox.min.y + _followBox.max.y) * 0.5;
  const lookY = tipY * 0.55 + midY * 0.45;

  const cx = aimX + Math.sin(followYaw) * followDistance;
  const cz = aimZ + Math.cos(followYaw) * followDistance;
  const cy = tipY + followDistance * 0.38;

  camera.position.set(cx, cy, cz);
  camera.lookAt(aimX, lookY, aimZ);
}

/**
 * Registra listeners en el canvas WebGL principal.
 * @param {(x: number, y: number) => void} onHoverMove - cuando no hay drag activo
 * @param {(x: number, y: number, button: number) => void} onClick - clic suave sin movimiento
 */
export function initCameraControls(onHoverMove, onClick) {
  updateCam();
  const cv = renderer.domElement;

  cv.addEventListener('mousedown', (e) => {
    drag.downX = drag.sx = e.clientX;
    drag.downY = drag.sy = e.clientY;
    if (e.button === 0) drag.active = true;
    if (e.button === 2) drag.pan = true;
  });

  cv.addEventListener('mousemove', (e) => {
    const dx = e.clientX - drag.sx;
    const dy = e.clientY - drag.sy;
    drag.sx = e.clientX;
    drag.sy = e.clientY;

    if (drag.active && !cameraFollowMode) {
      cam.theta -= dx * 0.004;
      cam.phi = Math.max(0.12, Math.min(Math.PI / 2 - 0.04, cam.phi - dy * 0.004));
      updateCam();
    }
    if (drag.pan && !cameraFollowMode) {
      const rx = Math.cos(cam.theta);
      const rz = -Math.sin(cam.theta);
      const spd = cam.radius * 0.0012;
      cam.tx += rx * dx * spd;
      cam.tz += rz * dx * spd;
      cam.ty += dy * spd * 0.5;
      updateCam();
    }

    if (!drag.active && !drag.pan) onHoverMove(e.clientX, e.clientY);
  });

  window.addEventListener('mouseup', (e) => {
    const moved = Math.abs(e.clientX - drag.downX) + Math.abs(e.clientY - drag.downY);
    drag.active = drag.pan = false;
    if (e.target instanceof Element && e.target.closest('.panel')) return;
    if (moved < 6 && e.button === 0) onClick(e.clientX, e.clientY, e.button);
  });

  cv.addEventListener('contextmenu', (e) => e.preventDefault());
  cv.addEventListener('wheel', (e) => {
    if (cameraFollowMode) {
      followDistance = Math.max(FOLLOW_CAMERA_DISTANCE_MIN, Math.min(FOLLOW_CAMERA_DISTANCE_MAX, followDistance + e.deltaY * 0.65));
      return;
    }
    cam.radius = Math.max(60, Math.min(1400, cam.radius + e.deltaY * 0.55));
    updateCam();
  }, { passive: true });
}
