/**
 * Panel "Almacén": inventario de carga útil (satélites, etc.), independiente de piezas de cohete.
 */

import { gameState } from '../game/state.js';
import { PAYLOAD_ITEMS } from '../config/payloadItems.js';
import { buildPayloadMesh } from '../scene/payloadMesh.js';
import { activeUICanvases } from './ui3d.js';

/**
 * Redibuja la rejilla de ítems almacenados (stock en galpón, no incluye lo montado en plataforma).
 */
export function drawCargoInventory() {
  const el = document.getElementById('cargo-inventory-grid');
  if (!el) return;
  el.innerHTML = '';

  const onPad = gameState.padPayloadId;
  Object.keys(PAYLOAD_ITEMS).forEach((key) => {
    const def = PAYLOAD_ITEMS[key];
    const card = document.createElement('div');
    card.className = 'cargo-inv-card';
    const propsLines = Object.entries(def.props)
      .map(([k, v]) => `<span class="cargo-prop"><span class="cargo-prop-k">${k}</span> ${v}</span>`)
      .join('');
    card.innerHTML = `
      <canvas class="cargo-canvas" width="80" height="80" aria-hidden="true"></canvas>
      <div class="cargo-inv-body">
        <div class="cargo-inv-name">${def.name}</div>
        <div class="cargo-inv-kind">${def.kind}</div>
        <div class="cargo-inv-meta">${propsLines}</div>
        <div class="cargo-inv-stock">En almacén: <strong>${gameState.cargoInv[key] || 0}</strong>
          ${onPad === key ? ' · <span class="cargo-on-pad">1 en cohete (plataforma)</span>' : ''}</div>
      </div>`;
    el.appendChild(card);

    const cvs = card.querySelector('.cargo-canvas');
    if (cvs) activeUICanvases.push({ canvas: cvs, group: buildPayloadMesh(key), isDiagonal: true });
  });
}
