/**
 * Fases de lanzamiento: cada bloque [motores + cuerpos hasta el siguiente bloque de motores]
 * cuenta como una fase (índice 1 desde la base).
 */

import { PARTS } from '../config/parts.js';
import { normalizeRocketSpec } from './rocketBuild.js';

/**
 * Masa usada en simulación para una pieza (desde `PARTS[id].sim`).
 * @param {string} partKey
 * @returns {number}
 */
export function estimatePartMassKg(partKey) {
  const p = PARTS[partKey];
  const s = p?.sim;
  if (!s) return 500;
  if (typeof s.propellantMaxKg === 'number') {
    return typeof s.fullMassKg === 'number' ? s.fullMassKg : (s.dryMassKg ?? 0) + s.propellantMaxKg;
  }
  if (typeof s.massKg === 'number') return s.massKg;
  return 500;
}

/**
 * @param {object[]} segments
 * @param {number} motorIdx
 * @returns {number}
 */
function motorClusterMass(segments, motorIdx) {
  const seg = segments[motorIdx];
  if (!seg || seg.kind !== 'motors') return 0;
  const m = estimatePartMassKg(seg.engineId);
  return m * seg.count;
}

/**
 * @param {unknown} spec
 * @returns {{
 *   segments: object[],
 *   phases: { phase: number, segmentStart: number, segmentEnd: number, massKg: number }[],
 * }}
 */
export function buildPhasePlanFromSpec(spec) {
  const segments = normalizeRocketSpec(spec);
  /** @type {{ phase: number, segmentStart: number, segmentEnd: number, massKg: number }[]} */
  const phases = [];
  let i = 0;
  let phaseNum = 0;

  while (i < segments.length) {
    const seg = segments[i];
    if (seg.kind !== 'motors') {
      i++;
      continue;
    }
    phaseNum++;
    const segmentStart = i;
    let mass = motorClusterMass(segments, i);
    i++;
    while (i < segments.length && segments[i].kind === 'body') {
      const b = segments[i];
      mass += estimatePartMassKg(b.id);
      i++;
    }
    const segmentEnd = i - 1;
    phases.push({ phase: phaseNum, segmentStart, segmentEnd, massKg: mass });
  }

  return { segments, phases };
}

/**
 * Fase inferior activa: la de menor número que aún no se ha separado.
 * @param {Set<number>} separatedPhases
 * @param {number} maxPhase
 * @returns {number | null}
 */
export function getActiveBottomPhase(separatedPhases, maxPhase) {
  for (let p = 1; p <= maxPhase; p++) {
    if (!separatedPhases.has(p)) return p;
  }
  return null;
}
