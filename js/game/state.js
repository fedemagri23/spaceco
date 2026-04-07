/**
 * Estado mutable del juego (dinero, inventario, cohetes guardados, ensamblaje actual).
 *
 * Cualquier sistema que modifique progresión del jugador debería leer/escribir aquí
 * o a través de funciones dedicadas que terminen actualizando la UI.
 */

import { PARTS } from '../config/parts.js';
import { PAYLOAD_ITEMS } from '../config/payloadItems.js';
import { DEFAULT_LAUNCH_SEQUENCE_SCRIPT } from '../config/launchSequence.js';
import { RocketEntity } from './RocketEntity.js';
import { applyLaunchSequenceMapsToState } from './launchSequenceMaps.js';

/** Inventario inicial: claves deben coincidir con PARTS. */
function initialInventory() {
  const inv = {};
  Object.keys(PARTS).forEach((k) => { inv[k] = 0; });
  Object.assign(inv, { engine: 3, booster: 2, fuelTank: 4, payloadBay: 1, capsule: 2 });
  return inv;
}

/** Inventario de carga útil (satélites, etc.): claves de `PAYLOAD_ITEMS`. */
function initialCargoInventory() {
  const cargo = {};
  Object.keys(PAYLOAD_ITEMS).forEach((k) => { cargo[k] = 0; });
  cargo.weatherControlSatellite = 1;
  return cargo;
}

/**
 * Objeto global de partida. Se exporta una única instancia; los módulos la importan.
 * @type {{
 *   money: number,
 *   inv: Record<string, number>,
 *   savedRockets: { name: string, build?: unknown, parts?: string[] }[],
 *   build: { kind: string, engineId?: string, count?: number, id?: string }[],
 *   selectedRocket: number,
 *   padRocket: { name: string, build?: unknown, parts?: string[] } | null,
 *   cargoInv: Record<string, number>,
 *   padPayloadId: string | null,
 *   launchSequenceScript: string,
 *   launchSequenceTimeMap: Map<number, string[]>,
 *   launchSequenceAltitudeMap: Map<number, string[]>,
 *   rocketEntity: object,
 *   flightSimRunning: boolean
 * }}
 */
export const gameState = {
  money: 1000000,
  inv: initialInventory(),
  cargoInv: initialCargoInventory(),
  savedRockets: [],
  build: [],
  selectedRocket: -1,
  padRocket: null,
  /** Id de `PAYLOAD_ITEMS` montado en el cohete de la plataforma (null = bahía vacía). */
  padPayloadId: null,
  /** Pseudocódigo de secuencia de lanzamiento (Torre de control). */
  launchSequenceScript: DEFAULT_LAUNCH_SEQUENCE_SCRIPT,
  /** Acciones por instante T+ (segundos), en orden de aparición en el texto. */
  launchSequenceTimeMap: new Map(),
  /** Acciones por altitud (metros), en orden de aparición en el texto. */
  launchSequenceAltitudeMap: new Map(),
  /** Cohete activo (plataforma / vuelo): estado físico (clase RocketEntity). */
  rocketEntity: new RocketEntity(),
  /** Simulación de vuelo activa (bucle de lanzamiento). */
  flightSimRunning: false,
};

applyLaunchSequenceMapsToState(gameState.launchSequenceScript, gameState);
