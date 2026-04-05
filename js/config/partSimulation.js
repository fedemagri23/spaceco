/**
 * Parámetros numéricos de simulación leídos desde `PARTS[].sim`.
 * Añade `sim` a nuevas piezas para que masa, empuje y combustible no queden hardcodeados fuera del catálogo.
 */

import { PARTS } from './parts.js';

/**
 * @param {string} partId
 * @returns {boolean}
 */
export function isFuelTankPartId(partId) {
  const s = PARTS[partId]?.sim;
  return s != null && typeof s.propellantMaxKg === 'number';
}

/**
 * @param {string} partId
 * @returns {{ propellantMaxKg: number, dryMassKg: number, fullMassKg: number } | null}
 */
export function getFuelTankSimulation(partId) {
  const s = PARTS[partId]?.sim;
  if (!s || typeof s.propellantMaxKg !== 'number') return null;
  const prop = s.propellantMaxKg;
  const dry =
    typeof s.dryMassKg === 'number'
      ? s.dryMassKg
      : typeof s.fullMassKg === 'number'
        ? s.fullMassKg - prop
        : 480;
  const full = typeof s.fullMassKg === 'number' ? s.fullMassKg : dry + prop;
  return { propellantMaxKg: prop, dryMassKg: dry, fullMassKg: full };
}

/**
 * Empuje y consumo por motor a plena potencia.
 * @param {string} engineId
 * @returns {{ massKg: number, thrustN: number, propellantKgPerS: number }}
 */
export function getEngineSimulation(engineId) {
  const s = PARTS[engineId]?.sim;
  if (!s || typeof s.thrustN !== 'number') {
    return { massKg: 400, thrustN: 800_000, propellantKgPerS: 50 };
  }
  return {
    massKg: typeof s.massKg === 'number' ? s.massKg : 400,
    thrustN: s.thrustN,
    propellantKgPerS: typeof s.propellantKgPerS === 'number' ? s.propellantKgPerS : 50,
  };
}
