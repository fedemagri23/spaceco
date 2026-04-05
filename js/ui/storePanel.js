/**
 * Panel "Centro de Distribución": compra de piezas con `gameState.money` e inventario.
 */

import { gameState } from '../game/state.js';
import { PARTS, PART_PRICES } from '../config/parts.js';
import { buildRocketMesh } from '../scene/rocketMesh.js';
import { activeUICanvases } from './ui3d.js';
import { refreshMoneyHud } from './hud.js';

/**
 * Redibuja la tienda y el saldo mostrado dentro del panel.
 */
export function drawStoreGrid() {
  const el = document.getElementById('store-grid');
  const balanceEl = document.getElementById('balance-display');
  if (!el || !balanceEl) return;
  balanceEl.textContent = `$ ${gameState.money.toLocaleString('es-AR')}`;

  el.innerHTML = '';
  Object.entries(PARTS).forEach(([key, p]) => {
    const price = PART_PRICES[key] || 0;
    const card = document.createElement('div');
    card.className = 'part-card';
    card.style.flexDirection = 'column';
    card.style.border = '1px solid rgba(170,255,85,.35)';
    card.innerHTML = `
      <div style="flex:1; display:flex; align-items:center; justify-content:center;">
        <canvas class="p-canvas" width="50" height="50"></canvas>
      </div>
      <div class="p-name">${p.name}</div>
      <div class="p-stock" style="color:#AAFF55; margin-bottom:8px;">$ ${price.toLocaleString('es-AR')}</div>
      <button class="btn" style="margin-top:8px; font-size:11px; padding:8px;">Comprar</button>`;

    const buyBtn = card.querySelector('.btn');
    buyBtn?.addEventListener('click', () => buyPart(key, price));

    el.appendChild(card);

    const cvs = card.querySelector('.p-canvas');
    if (cvs) activeUICanvases.push({ canvas: cvs, group: buildRocketMesh([key]), isDiagonal: false });
  });
}

/**
 * Descuenta dinero y suma una unidad al inventario si hay fondos.
 * @param {string} key
 * @param {number} price
 */
export function buyPart(key, price) {
  if (gameState.money < price) {
    alert('❌ Fondos insuficientes para esta compra');
    return;
  }
  gameState.money -= price;
  gameState.inv[key] = (gameState.inv[key] || 0) + 1;
  refreshMoneyHud();
  const balanceEl = document.getElementById('balance-display');
  if (balanceEl) balanceEl.textContent = `$ ${gameState.money.toLocaleString('es-AR')}`;
  drawStoreGrid();
}
