/**
 * Estado mutable del juego (dinero, inventario, cohetes guardados, ensamblaje actual).
 *
 * Cualquier sistema que modifique progresión del jugador debería leer/escribir aquí
 * o a través de funciones dedicadas que terminen actualizando la UI.
 */

import { PARTS } from '../config/parts.js';

/** Inventario inicial: claves deben coincidir con PARTS. */
function initialInventory() {
  const inv = {};
  Object.keys(PARTS).forEach((k) => { inv[k] = 0; });
  Object.assign(inv, { engine: 3, booster: 2, fuelTank: 4, payloadBay: 1, capsule: 2 });
  return inv;
}

/**
 * Objeto global de partida. Se exporta una única instancia; los módulos la importan.
 * @type {{
 *   money: number,
 *   inv: Record<string, number>,
 *   savedRockets: { name: string, parts: string[] }[],
 *   build: string[],
 *   selectedRocket: number,
 *   padRocket: { name: string, parts: string[] } | null
 * }}
 */
export const gameState = {
  money: 1000000,
  inv: initialInventory(),
  savedRockets: [],
  build: [],
  selectedRocket: -1,
  padRocket: null,
};
