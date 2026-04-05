/**
 * Panel "Galpón de Ensamblaje": inventario, apilado de piezas, preview y guardado de cohete.
 */

import { gameState } from '../game/state.js';
import { PARTS } from '../config/parts.js';
import { buildRocketMesh } from '../scene/rocketMesh.js';
import { activeUICanvases } from './ui3d.js';
import { closeAllPanels } from './closePanels.js';

/**
 * @param {string} partKey
 */
function showPartTooltip(partKey) {
  const p = PARTS[partKey];
  if (!p || !p.props) return;
  const tooltip = document.getElementById('tooltip');
  if (!tooltip) return;
  let html = `<div class="tooltip-title">${p.name}</div>`;
  Object.entries(p.props).forEach(([key, val]) => {
    html += `<div class="tooltip-prop">
      <span class="tooltip-key">${key}:</span>
      <span class="tooltip-val">${val}</span>
    </div>`;
  });
  tooltip.innerHTML = html;
  tooltip.classList.add('on');
}

function hidePartTooltip() {
  document.getElementById('tooltip')?.classList.remove('on');
}

/**
 * Redibuja la grilla de piezas disponibles en inventario.
 */
export function drawPartsGrid() {
  const el = document.getElementById('parts-grid');
  if (!el) return;
  el.innerHTML = '';
  Object.entries(PARTS).forEach(([key, p]) => {
    const stock = gameState.inv[key] || 0;
    const card = document.createElement('div');
    card.className = `part-card${stock === 0 ? ' depleted' : ''}`;
    card.innerHTML = `
      <canvas class="p-canvas" width="50" height="50"></canvas>
      <div class="p-name">${p.name}</div>
      <div class="p-stock">Stock: ${stock}</div>`;

    card.addEventListener('mouseenter', () => {
      if (stock > 0) showPartTooltip(key);
    });
    card.addEventListener('mouseleave', hidePartTooltip);

    if (stock > 0) {
      card.onclick = () => {
        gameState.build.push(key);
        gameState.inv[key]--;
        drawPartsGrid();
        drawAsmStack();
      };
    }
    el.appendChild(card);

    const cvs = card.querySelector('.p-canvas');
    if (cvs) activeUICanvases.push({ canvas: cvs, group: buildRocketMesh([key]), isDiagonal: false });
  });
}

/**
 * Actualiza el canvas de preview del cohete en construcción.
 */
function updatePreviewCanvas() {
  const canvas = document.getElementById('preview-canvas');
  if (!canvas) return;

  const idx = activeUICanvases.findIndex((c) => c.canvas === canvas);
  if (idx >= 0) activeUICanvases.splice(idx, 1);

  const ctx = canvas.getContext('2d');
  if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (gameState.build.length === 0) return;

  const group = buildRocketMesh(gameState.build);
  activeUICanvases.push({ canvas, group, isDiagonal: false });
}

/**
 * Lista vertical del ensamblaje actual con botón quitar.
 */
export function drawAsmStack() {
  const el = document.getElementById('asm-stack');
  if (!el) return;
  el.innerHTML = '';

  updatePreviewCanvas();

  if (!gameState.build.length) {
    el.innerHTML = '<div class="empty">Agrega piezas desde el inventario.</div>';
    return;
  }

  [...gameState.build].reverse().forEach((key, idx) => {
    const realIdx = gameState.build.length - 1 - idx;
    const p = PARTS[key];
    const row = document.createElement('div');
    row.className = 'asm-part';
    row.innerHTML = `<span>${p.name}</span>
      <span class="rm" data-i="${realIdx}">X</span>`;
    el.appendChild(row);
  });

  el.querySelectorAll('.rm').forEach((btn) => {
    btn.addEventListener('click', () => {
      const i = Number(/** @type {HTMLElement} */ (btn).dataset.i);
      gameState.inv[gameState.build[i]]++;
      gameState.build.splice(i, 1);
      drawPartsGrid();
      drawAsmStack();
    });
  });
}

/**
 * Guarda el cohete actual en `savedRockets`, limpia el build y cierra UI.
 */
export function saveRocket() {
  if (!gameState.build.length) return;
  const n = gameState.savedRockets.length + 1;
  gameState.savedRockets.push({ name: `Cohete Mk.${n}`, parts: [...gameState.build] });
  gameState.build = [];
  drawPartsGrid();
  drawAsmStack();
  closeAllPanels();
}
