/**
 * Actualización del HUD (dinero en pantalla). Centraliza el formateo para no duplicar lógica.
 */

import { gameState } from '../game/state.js';

/**
 * Sincroniza el elemento `#money-el` con `gameState.money`.
 */
export function refreshMoneyHud() {
  const el = document.getElementById('money-el');
  if (el) el.textContent = `$ ${gameState.money.toLocaleString('es-AR')}`;
}
