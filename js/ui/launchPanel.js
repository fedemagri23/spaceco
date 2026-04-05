/**
 * Panel "Plataforma de Lanzamiento": lista de cohetes guardados, selección y despliegue en 3D.
 */

import { gameState } from '../game/state.js';
import { PARTS } from '../config/parts.js';
import { PAYLOAD_ITEMS, PAYLOAD_BAY_MAX_KG } from '../config/payloadItems.js';
import { buildRocketMesh } from '../scene/rocketMesh.js';
import { buildPayloadMesh } from '../scene/payloadMesh.js';
import { placeRocketOnPad } from '../scene/rocketPad.js';
import { activeUICanvases } from './ui3d.js';
import { closeAllPanels } from './closePanels.js';
import { normalizeRocketSpec, buildSegmentLabels } from '../game/rocketBuild.js';

/**
 * @param {unknown} rocketSpec - `build` o `parts` (legacy)
 */
function showRocketTooltip(rocketSpec) {
  const tooltip = document.getElementById('tooltip');
  if (!tooltip) return;
  const segs = normalizeRocketSpec(rocketSpec);
  let html = '<div class="tooltip-title">Especificaciones del Cohete</div>';

  segs.forEach((s) => {
    if (s.kind === 'motors') {
      const p = PARTS[s.engineId];
      if (!p || !p.props) return;
      html += `<div style="border-top:1px solid rgba(127,232,255,0.25); margin:8px 0; padding-top:8px; color:#AAFF55; font-size:11px; letter-spacing:1.5px; font-weight:bold;">${s.count}× ${p.name}</div>`;
      Object.entries(p.props).forEach(([propKey, val]) => {
        html += `<div class="tooltip-prop">
          <span class="tooltip-key">${propKey}:</span>
          <span class="tooltip-val">${val}</span>
        </div>`;
      });
    } else {
      const p = PARTS[s.id];
      if (!p || !p.props) return;
      html += `<div style="border-top:1px solid rgba(127,232,255,0.25); margin:8px 0; padding-top:8px; color:#AAFF55; font-size:11px; letter-spacing:1.5px; font-weight:bold;">${p.name}</div>`;
      Object.entries(p.props).forEach(([propKey, val]) => {
        html += `<div class="tooltip-prop">
          <span class="tooltip-key">${propKey}:</span>
          <span class="tooltip-val">${val}</span>
        </div>`;
      });
    }
  });

  tooltip.innerHTML = html;
  tooltip.classList.add('on');
}

function rocketSpecForList(r) {
  return r.build ?? r.parts ?? [];
}

/**
 * @param {unknown} spec
 * @returns {boolean}
 */
function buildHasPayloadBay(spec) {
  return normalizeRocketSpec(spec).some((s) => s.kind === 'body' && s.id === 'payloadBay');
}

/**
 * Devuelve a almacén la carga montada en el cohete de plataforma (al cambiar de cohete).
 */
function returnPadPayloadToWarehouse() {
  const id = gameState.padPayloadId;
  if (!id) return;
  gameState.cargoInv[id] = (gameState.cargoInv[id] || 0) + 1;
  gameState.padPayloadId = null;
}

/**
 * Asigna o quita carga útil en el cohete desplegado (requiere bahía de carga).
 * @param {string | null} newId - clave de `PAYLOAD_ITEMS`, o null para vaciar bahía
 */
export function setPadPayload(newId) {
  if (!gameState.padRocket) return;
  if (!buildHasPayloadBay(rocketSpecForList(gameState.padRocket))) return;
  const prev = gameState.padPayloadId;
  if (prev === newId) return;
  if (newId && !PAYLOAD_ITEMS[newId]) return;
  if (newId && PAYLOAD_ITEMS[newId].weightKg > PAYLOAD_BAY_MAX_KG) return;

  if (newId && (gameState.cargoInv[newId] || 0) < 1) return;

  if (prev) {
    gameState.cargoInv[prev] = (gameState.cargoInv[prev] || 0) + 1;
  }
  gameState.padPayloadId = null;

  if (newId) {
    gameState.cargoInv[newId]--;
    gameState.padPayloadId = newId;
  }
  drawPadCargoSection();
}

function currentPayloadWeightKg() {
  const id = gameState.padPayloadId;
  if (!id || !PAYLOAD_ITEMS[id]) return 0;
  return PAYLOAD_ITEMS[id].weightKg;
}

function drawPadCargoSection() {
  const block = document.getElementById('pad-payload-block');
  const hint = document.getElementById('pad-payload-hint');
  const list = document.getElementById('pad-payload-list');
  if (!block || !hint || !list) return;

  if (!gameState.padRocket) {
    block.style.display = 'none';
    return;
  }

  block.style.display = 'block';
  const spec = rocketSpecForList(gameState.padRocket);

  if (!buildHasPayloadBay(spec)) {
    hint.textContent = 'Este cohete no incluye bahía de carga; no puedes asignar satélites.';
    list.innerHTML = '';
    return;
  }

  const w = currentPayloadWeightKg();
  hint.textContent = `Bahía: hasta ${PAYLOAD_BAY_MAX_KG} kg · Carga montada: ${w} kg`;

  list.innerHTML = '';

  const noneBtn = document.createElement('button');
  noneBtn.type = 'button';
  noneBtn.className = `btn cargo-payload-btn${!gameState.padPayloadId ? ' selected' : ''}`;
  noneBtn.textContent = 'Sin carga útil';
  noneBtn.onclick = () => setPadPayload(null);
  list.appendChild(noneBtn);

  Object.keys(PAYLOAD_ITEMS).forEach((key) => {
    const def = PAYLOAD_ITEMS[key];
    const onPad = gameState.padPayloadId === key;
    if ((gameState.cargoInv[key] || 0) < 1 && !onPad) return;

    const row = document.createElement('div');
    row.className = 'cargo-payload-row';
    const sel = onPad ? ' selected' : '';
    row.innerHTML = `
      <canvas class="cargo-payload-canvas" width="52" height="52" aria-hidden="true"></canvas>
      <div class="cargo-payload-info">
        <span class="cargo-payload-name">${def.name}</span>
        <span class="cargo-payload-w">${def.weightKg} kg</span>
      </div>`;
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `btn cargo-payload-btn${sel}`;
    btn.textContent = onPad ? 'Montado' : 'Montar en bahía';
    btn.disabled = !!onPad;
    if (!onPad) btn.onclick = () => setPadPayload(key);
    row.appendChild(btn);
    list.appendChild(row);

    const cvs = row.querySelector('.cargo-payload-canvas');
    if (cvs) activeUICanvases.push({ canvas: cvs, group: buildPayloadMesh(key), isDiagonal: true });
  });
}

/**
 * Redibuja la lista de cohetes y registra canvas 3D para el loop UI.
 */
export function drawRocketList() {
  const el = document.getElementById('rocket-list');
  const btn = document.getElementById('deploy-btn');
  if (!el || !btn) return;
  el.innerHTML = '';

  if (!gameState.savedRockets.length) {
    el.innerHTML = '<div class="empty">Sin cohetes ensamblados.<br>Ve al galpón primero.</div>';
    btn.disabled = true;
    drawPadCargoSection();
    return;
  }

  gameState.savedRockets.forEach((r, i) => {
    const spec = rocketSpecForList(r);
    const row = document.createElement('div');
    row.className = `rocket-row${gameState.selectedRocket === i ? ' selected' : ''}`;
    const labels = buildSegmentLabels(spec);
    row.innerHTML = `
      <canvas class="r-canvas" width="40" height="40"></canvas>
      <div>
        <div class="r-name">${r.name}</div>
        <div class="r-parts">${labels.join(' · ')}</div>
      </div>`;

    row.onclick = () => {
      gameState.selectedRocket = i;
      btn.disabled = false;
      showRocketTooltip(spec);
      drawRocketList();
    };
    el.appendChild(row);

    const cvs = row.querySelector('.r-canvas');
    if (cvs) activeUICanvases.push({ canvas: cvs, group: buildRocketMesh(spec), isDiagonal: true });
  });
  btn.disabled = gameState.selectedRocket < 0;
  drawPadCargoSection();
}

/**
 * Despliega el cohete seleccionado en la plataforma 3D y cierra paneles.
 */
export function deployRocket() {
  if (gameState.selectedRocket < 0) return;
  returnPadPayloadToWarehouse();
  gameState.padRocket = gameState.savedRockets[gameState.selectedRocket];
  const spec = rocketSpecForList(gameState.padRocket);
  placeRocketOnPad(spec);
  closeAllPanels();
}
