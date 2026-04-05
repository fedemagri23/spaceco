/**
 * Panel "Plataforma de Lanzamiento": lista de cohetes guardados, selección y despliegue en 3D.
 */

import { gameState } from '../game/state.js';
import { PARTS } from '../config/parts.js';
import { buildRocketMesh } from '../scene/rocketMesh.js';
import { placeRocketOnPad } from '../scene/rocketPad.js';
import { activeUICanvases } from './ui3d.js';
import { closeAllPanels } from './closePanels.js';

/**
 * Muestra tooltip lateral con especificaciones agregadas del cohete seleccionado.
 * @param {string[]} rocketParts
 */
function showRocketTooltip(rocketParts) {
  const tooltip = document.getElementById('tooltip');
  if (!tooltip) return;
  let html = '<div class="tooltip-title">Especificaciones del Cohete</div>';

  rocketParts.forEach((key) => {
    const p = PARTS[key];
    if (!p || !p.props) return;
    html += `<div style="border-top:1px solid rgba(127,232,255,0.25); margin:8px 0; padding-top:8px; color:#AAFF55; font-size:11px; letter-spacing:1.5px; font-weight:bold;">${p.name}</div>`;
    Object.entries(p.props).forEach(([propKey, val]) => {
      html += `<div class="tooltip-prop">
        <span class="tooltip-key">${propKey}:</span>
        <span class="tooltip-val">${val}</span>
      </div>`;
    });
  });

  tooltip.innerHTML = html;
  tooltip.classList.add('on');
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
    return;
  }

  gameState.savedRockets.forEach((r, i) => {
    const row = document.createElement('div');
    row.className = `rocket-row${gameState.selectedRocket === i ? ' selected' : ''}`;
    row.innerHTML = `
      <canvas class="r-canvas" width="40" height="40"></canvas>
      <div>
        <div class="r-name">${r.name}</div>
        <div class="r-parts">${r.parts.map((k) => PARTS[k]?.name).join(' &rsaquo; ')}</div>
      </div>`;

    row.onclick = () => {
      gameState.selectedRocket = i;
      btn.disabled = false;
      showRocketTooltip(r.parts);
      drawRocketList();
    };
    el.appendChild(row);

    const cvs = row.querySelector('.r-canvas');
    if (cvs) activeUICanvases.push({ canvas: cvs, group: buildRocketMesh(r.parts), isDiagonal: true });
  });
  btn.disabled = gameState.selectedRocket < 0;
}

/**
 * Despliega el cohete seleccionado en la plataforma 3D y cierra paneles.
 */
export function deployRocket() {
  if (gameState.selectedRocket < 0) return;
  gameState.padRocket = gameState.savedRockets[gameState.selectedRocket];
  placeRocketOnPad(gameState.padRocket.parts);
  closeAllPanels();
}
