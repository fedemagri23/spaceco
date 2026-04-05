/**
 * Panel "Galpón de Ensamblaje": inventario, apilado por segmentos (motores en paralelo + cuerpos), preview y guardado.
 */

import { gameState } from '../game/state.js';
import { PARTS } from '../config/parts.js';
import { buildRocketMesh } from '../scene/rocketMesh.js';
import { activeUICanvases } from './ui3d.js';
import { closeAllPanels } from './closePanels.js';
import {
  appendPartOrError,
  peekAppendPartError,
  buildSegmentLabels,
  removeSegmentAndAbove,
  isEngineKey,
  mustHaveMotorsBlockBelow,
} from '../game/rocketBuild.js';

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
  if (typeof p.maxParallelMotors === 'number') {
    html += `<div class="tooltip-prop"><span class="tooltip-key">Motores en paralelo (máx. bajo esta pieza):</span><span class="tooltip-val">${p.maxParallelMotors}</span></div>`;
    if (mustHaveMotorsBlockBelow(partKey)) {
      html += `<div class="tooltip-prop"><span class="tooltip-key">Ensamblaje:</span><span class="tooltip-val">debe ir justo encima de un bloque de motores</span></div>`;
    } else if (partKey === 'capsule' || partKey === 'payloadBay') {
      html += `<div class="tooltip-prop"><span class="tooltip-key">Ensamblaje:</span><span class="tooltip-val">puede ir sobre motores (respetando el máx.) o directamente sobre otro cuerpo</span></div>`;
    }
  }
  if (isEngineKey(partKey)) {
    html += `<div class="tooltip-prop"><span class="tooltip-key">Ensamblaje:</span><span class="tooltip-val">clic repetido añade el mismo motor en paralelo (mismo bloque)</span></div>`;
  }
  tooltip.innerHTML = html;
  tooltip.classList.add('on');
}

function hidePartTooltip() {
  document.getElementById('tooltip')?.classList.remove('on');
}

function setBuildHint(msg) {
  const el = document.getElementById('build-hint');
  if (el) el.textContent = msg || '';
}

/**
 * Clic en #asm-stack: el índice va en `data-idx` (evita `data-i` / `dataset.i` poco fiables).
 * @param {MouseEvent} e
 */
function onAsmStackClick(e) {
  const raw = e.target;
  const el = raw instanceof Element ? raw : raw.parentElement;
  const rm = el?.closest('.rm');
  const stack = document.getElementById('asm-stack');
  if (!rm || !stack || !stack.contains(rm)) return;
  e.preventDefault();
  e.stopPropagation();
  const i = Number.parseInt(rm.getAttribute('data-idx') || '', 10);
  if (!Number.isFinite(i)) return;
  removeSegmentAndAbove(gameState.build, i, gameState.inv);
  setBuildHint('');
  drawPartsGrid();
  drawAsmStack();
}

/**
 * Redibuja la grilla de piezas disponibles en inventario.
 */
export function drawPartsGrid() {
  setBuildHint('');
  const el = document.getElementById('parts-grid');
  if (!el) return;
  el.innerHTML = '';

  const available = Object.entries(PARTS).filter(([k]) => (gameState.inv[k] || 0) > 0);
  if (!available.length) {
    el.innerHTML = '<div class="empty">Sin piezas en inventario.<br>Compra en el Centro de Distribución.</div>';
    return;
  }

  available.forEach(([key, p]) => {
    const stock = gameState.inv[key] || 0;
    const blockedByRules = peekAppendPartError(gameState.build, key, gameState.inv) !== null;
    const card = document.createElement('div');
    card.className = `part-card${blockedByRules ? ' rule-blocked' : ''}`;
    card.innerHTML = `
      <canvas class="p-canvas" width="50" height="50"></canvas>
      <div class="p-name">${p.name}</div>
      <div class="p-stock">Stock: ${stock}</div>`;

    card.addEventListener('mouseenter', () => showPartTooltip(key));
    card.addEventListener('mouseleave', hidePartTooltip);

    card.onclick = () => {
      const err = appendPartOrError(gameState.build, key, gameState.inv);
      if (err) setBuildHint(err);
      else setBuildHint('');
      drawPartsGrid();
      drawAsmStack();
    };

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
 * Lista del ensamblaje (base → punta) con quitar por segmento.
 */
export function drawAsmStack() {
  const el = document.getElementById('asm-stack');
  if (!el) return;
  el.removeEventListener('click', onAsmStackClick);
  el.innerHTML = '';

  updatePreviewCanvas();

  if (!gameState.build.length) {
    el.innerHTML = '<div class="empty">Booster y tanque van siempre sobre motores. Bahía de carga y cápsula pueden ir sobre motores o sobre otro cuerpo. Nada encima de la cápsula.</div>';
    el.addEventListener('click', onAsmStackClick);
    return;
  }

  gameState.build.forEach((seg, idx) => {
    const row = document.createElement('div');
    row.className = 'asm-part';
    let label;
    if (seg.kind === 'motors') {
      const n = PARTS[seg.engineId]?.name || seg.engineId;
      label = `${seg.count}× ${n}`;
    } else {
      label = PARTS[seg.id]?.name || seg.id;
    }
    row.innerHTML = `<span class="asm-part-label">${label}</span>
      <button type="button" class="rm" data-idx="${idx}" aria-label="Quitar segmento">×</button>`;
    el.appendChild(row);
  });

  el.addEventListener('click', onAsmStackClick);
}

/**
 * Guarda el cohete actual en `savedRockets`, limpia el build y cierra UI.
 */
export function saveRocket() {
  if (!gameState.build.length) return;
  const hasBody = gameState.build.some((s) => s.kind === 'body');
  if (!hasBody) {
    setBuildHint('Añade al menos un cuerpo de etapa antes de guardar.');
    return;
  }
  const n = gameState.savedRockets.length + 1;
  gameState.savedRockets.push({ name: `Cohete Mk.${n}`, build: [...gameState.build] });
  gameState.build = [];
  setBuildHint('');
  drawPartsGrid();
  drawAsmStack();
  closeAllPanels();
}
