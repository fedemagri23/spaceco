/**
 * Órbita esférica alrededor de un punto objetivo: rotar (botón izq), pan (botón der), zoom (rueda).
 * Actualiza `camera` importada de `scene/setup.js` cada frame de interacción.
 */

import { camera, renderer } from '../scene/setup.js';

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

    if (drag.active) {
      cam.theta -= dx * 0.004;
      cam.phi = Math.max(0.12, Math.min(Math.PI / 2 - 0.04, cam.phi - dy * 0.004));
      updateCam();
    }
    if (drag.pan) {
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
    cam.radius = Math.max(60, Math.min(1400, cam.radius + e.deltaY * 0.55));
    updateCam();
  }, { passive: true });
}
