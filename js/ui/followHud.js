/**
 * Telemetría en pantalla durante la cámara de seguimiento + salida a cámara libre.
 */

import { isCameraFollowMode } from '../input/camera.js';
import { gameState } from '../game/state.js';
import { buildPhasePlanFromSpec, getActiveBottomPhase } from '../game/rocketPhases.js';
import { activeStageCanProduceThrust } from '../game/fuelTanks.js';
import { PAD_SURFACE_Y } from '../scene/rocketPad.js';
import { PARTS } from '../config/parts.js';

function fmt(n, decimals = 1) {
  if (!Number.isFinite(n)) return '—';
  return n.toFixed(decimals);
}

/** Igual que `fmt` pero con signo explícito en positivos (p. ej. aceleración). */
function fmtSigned(n, decimals = 2) {
  if (!Number.isFinite(n)) return '—';
  const s = n.toFixed(decimals);
  if (n > 0) return `+${s}`;
  return s;
}

function vecMag(v) {
  return Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
}

function padRocketSpecList() {
  const r = gameState.padRocket;
  if (!r) return [];
  return r.build ?? r.parts ?? [];
}

/**
 * Actualiza el panel de métricas si el modo seguimiento está activo.
 */
export function updateFollowHud() {
  const root = document.getElementById('follow-camera-hud');
  const grid = document.getElementById('follow-hud-metrics');
  if (!root || !grid) return;

  if (!isCameraFollowMode()) {
    root.classList.remove('on');
    root.setAttribute('aria-hidden', 'true');
    return;
  }

  root.classList.add('on');
  root.setAttribute('aria-hidden', 'false');

  const e = gameState.rocketEntity;
  const altM = e.position.y - PAD_SURFACE_Y;
  const v = e.velocity;
  const a = e.acceleration;
  const speed = vecMag(v);
  const accMag = vecMag(a);
  const tMission = e.missionElapsed;
  const flight = gameState.flightSimRunning;
  const refM = e.referenceMassKg;
  const massPct = refM > 0 ? (100 * e.mass) / refM : null;

  const activePhase = getActiveBottomPhase(e.separatedPhases, e.maxPhase);
  const throttle01 = activePhase != null ? e.throttleByPhase[activePhase] ?? 0 : null;
  const throttlePct = throttle01 != null ? throttle01 * 100 : null;

  let thrustHudExtra = '';
  if (activePhase != null && throttle01 != null && throttle01 > 0) {
    const sl = padRocketSpecList();
    const plan = sl.length ? buildPhasePlanFromSpec(sl) : null;
    if (plan && !activeStageCanProduceThrust(e, plan, activePhase)) {
      thrustHudExtra = ' · sin empuje';
    }
  }

  const tanks = e.fuelTanks || [];
  let tankRows = '';
  if (tanks.length === 0) {
    tankRows = '<div class="fh-row fh-sub"><span class="fh-k">Tanques combustible</span><span class="fh-v">—</span></div>';
  } else {
    tanks.forEach((t) => {
      const pct = t.maxFuelKg > 0 ? (100 * t.currentFuelKg) / t.maxFuelKg : 0;
      const pname = t.partId && PARTS[t.partId]?.name ? PARTS[t.partId].name : 'Tanque';
      tankRows += `<div class="fh-row fh-tank"><span class="fh-k">${pname} · F${t.phase} · #${t.tankIndex}</span><span class="fh-v">${fmt(t.currentFuelKg, 0)} / ${fmt(t.maxFuelKg, 0)} kg · ${fmt(pct, 0)}%</span></div>`;
    });
  }

  grid.innerHTML = `
    <div class="fh-row"><span class="fh-k">Altitud (AGL)</span><span class="fh-v">${fmt(altM, 1)} m</span></div>
    <div class="fh-row"><span class="fh-k">Velocidad</span><span class="fh-v">${fmt(speed, 1)} m/s</span></div>
    <div class="fh-row"><span class="fh-k">Vx · Vy · Vz</span><span class="fh-v">${fmt(v.x, 1)} · ${fmt(v.y, 1)} · ${fmt(v.z, 1)}</span></div>
    <div class="fh-row"><span class="fh-k">Módulo |a|</span><span class="fh-v">${fmt(accMag, 2)} m/s²</span></div>
    <div class="fh-row"><span class="fh-k">Ax · Ay · Az</span><span class="fh-v">${fmtSigned(a.x, 2)} · ${fmtSigned(a.y, 2)} · ${fmtSigned(a.z, 2)}</span></div>
    <div class="fh-row"><span class="fh-k">T misión (T+)</span><span class="fh-v">${fmt(tMission, 2)} s</span></div>
    <div class="fh-row"><span class="fh-k">Ángulo (desde horiz.)</span><span class="fh-v">${fmt(e.angleDeg, 1)} °</span></div>
    <div class="fh-row"><span class="fh-k">Potencia motores</span><span class="fh-v">${activePhase != null && throttlePct != null ? `F${activePhase} · ${fmt(throttlePct, 0)} %${thrustHudExtra}` : '—'}</span></div>
    <div class="fh-section">Masa</div>
    <div class="fh-row"><span class="fh-k">Actual / inicial</span><span class="fh-v">${refM > 0 ? `${fmt(e.mass, 0)} / ${fmt(refM, 0)} kg` : '—'}</span></div>
    <div class="fh-row"><span class="fh-k">% masa sobre inicial</span><span class="fh-v">${massPct !== null ? `${fmt(massPct, 1)} %` : '—'}</span></div>
    <div class="fh-section">Propulsante (tanques en cohete)</div>
    ${tankRows}
    <div class="fh-row"><span class="fh-k">Gravedad g</span><span class="fh-v">${fmt(e.gravity, 2)} m/s²</span></div>
    <div class="fh-row"><span class="fh-k">Simulación</span><span class="fh-v">${flight ? 'en vuelo' : 'en plataforma'}</span></div>
  `;
}
