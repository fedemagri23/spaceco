/**
 * Cielo y niebla según altitud del cohete, solo en cámara de seguimiento (transición hacia aspecto espacial).
 */

import * as THREE from 'https://unpkg.com/three@0.128.0/build/three.module.js';
import { scene, renderer } from './setup.js';
import { isCameraFollowMode } from '../input/camera.js';
import { gameState } from '../game/state.js';
import { PAD_SURFACE_Y } from './rocketPad.js';

/** Valores iniciales (deben coincidir con `initScene` en setup.js). */
const BASE = {
  clear: 0x5ecfff,
  fog: 0x8ad8ff,
  density: 0.0007,
};

/** Aspecto “espacio”: cielo casi negro y niebla muy tenue. */
const SPACE = {
  clear: 0x020612,
  fog: 0x050a14,
  density: 0.000035,
};

const ALT_BLEND_START_M = 6_000;
const ALT_BLEND_END_M = 85_000;

const _cA = new THREE.Color();
const _cB = new THREE.Color();
const _cMix = new THREE.Color();

let followAtmosphereWasOn = false;

function smoothstep(edge0, edge1, x) {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

function applyBaseAtmosphere() {
  renderer.setClearColor(BASE.clear);
  const fog = scene.fog;
  if (fog instanceof THREE.FogExp2) {
    fog.color.setHex(BASE.fog);
    fog.density = BASE.density;
  }
}

/**
 * Llamar cada frame desde el bucle principal: en modo seguimiento oscurece el cielo con la altitud AGL.
 */
export function updateFollowAtmosphereFromRocket() {
  if (!isCameraFollowMode()) {
    if (followAtmosphereWasOn) {
      applyBaseAtmosphere();
      followAtmosphereWasOn = false;
    }
    return;
  }

  followAtmosphereWasOn = true;

  const y = gameState.rocketEntity?.position?.y;
  if (!Number.isFinite(y)) {
    applyBaseAtmosphere();
    return;
  }

  const altM = Math.max(0, y - PAD_SURFACE_Y);
  const u = smoothstep(ALT_BLEND_START_M, ALT_BLEND_END_M, altM);

  _cA.setHex(BASE.clear);
  _cB.setHex(SPACE.clear);
  _cMix.copy(_cA).lerp(_cB, u);
  renderer.setClearColor(_cMix);

  const fog = scene.fog;
  if (fog instanceof THREE.FogExp2) {
    _cA.setHex(BASE.fog);
    _cB.setHex(SPACE.fog);
    _cMix.copy(_cA).lerp(_cB, u);
    fog.color.copy(_cMix);
    fog.density = BASE.density + (SPACE.density - BASE.density) * u;
  }
}
