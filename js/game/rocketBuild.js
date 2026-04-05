/**
 * Reglas de ensamblaje:
 * - Salvo cápsula y bahía de carga, cualquier pieza exige que lo último colocado sea un bloque de motores.
 * - Si lo último es un bloque de motores, su cantidad no puede superar el máximo de la pieza que añades.
 * - No se puede añadir nada encima de la cápsula.
 */

import { PARTS } from '../config/parts.js';
import { isFuelTankPartId } from '../config/partSimulation.js';

/** @typedef {{ kind: 'motors', engineId: string, count: number }} MotorClusterSeg */
/** @typedef {{ kind: 'body', id: string }} BodySeg */
/** @typedef {MotorClusterSeg | BodySeg} BuildSegment */

const ENGINE_IDS = new Set(['engine', 'raptorEngine']);

/** Máximo de motores en un mismo bloque al ir sumando motores (tope duro). */
export const MAX_MOTORS_PER_CLUSTER = 4;

/**
 * Cuerpos que no pueden ir justo sobre otro cuerpo: deben ir sobre un bloque de motores.
 * Excepciones: cápsula, bahía de carga y tanque de combustible (pueden ir sobre otro cuerpo de la misma etapa).
 * @param {string} partKey
 * @returns {boolean}
 */
export function mustHaveMotorsBlockBelow(partKey) {
  const p = PARTS[partKey];
  if (!p || typeof p.maxParallelMotors !== 'number') return false;
  return partKey !== 'capsule' && partKey !== 'payloadBay' && !isFuelTankPartId(partKey);
}

/**
 * @param {string} key
 * @returns {boolean}
 */
export function isEngineKey(key) {
  return ENGINE_IDS.has(key);
}

/**
 * @param {unknown} raw
 * @returns {BuildSegment[]}
 */
export function normalizeRocketSpec(raw) {
  if (!raw || !Array.isArray(raw) || raw.length === 0) return [];
  if (typeof raw[0] === 'object' && raw[0] !== null && 'kind' in raw[0]) {
    return /** @type {BuildSegment[]} */ (raw);
  }
  if (typeof raw[0] === 'string') return legacyStringsToSegments(/** @type {string[]} */ (raw));
  return [];
}

/**
 * @param {string[]} parts
 * @returns {BuildSegment[]}
 */
function legacyStringsToSegments(parts) {
  /** @type {BuildSegment[]} */
  const segs = [];
  let i = 0;
  while (i < parts.length) {
    if (ENGINE_IDS.has(parts[i])) {
      const id = parts[i];
      let c = 0;
      while (i < parts.length && parts[i] === id && ENGINE_IDS.has(parts[i])) {
        c++;
        i++;
      }
      segs.push({ kind: 'motors', engineId: id, count: c });
    } else {
      segs.push({ kind: 'body', id: parts[i] });
      i++;
    }
  }
  return segs;
}

/**
 * @param {BuildSegment[]} build
 * @returns {boolean}
 */
function buildHasCapsule(build) {
  return build.some((s) => s.kind === 'body' && s.id === 'capsule');
}

/**
 * @param {string} partKey
 * @param {MotorClusterSeg} motorSeg
 * @returns {string | null}
 */
function checkMotorCountForPart(partKey, motorSeg) {
  const p = PARTS[partKey];
  const maxM = p?.maxParallelMotors;
  if (typeof maxM !== 'number' || maxM < 1) {
    return 'Esta pieza no admite montaje sobre motores (revisa maxParallelMotors).';
  }
  if (motorSeg.count > maxM) {
    return `${p.name} admite como máximo ${maxM} motor(es) en paralelo bajo esta pieza.`;
  }
  return null;
}

/**
 * Intenta añadir una pieza. Mutates `build` e `inv` si devuelve null.
 * @param {BuildSegment[]} build
 * @param {string} partKey
 * @param {Record<string, number>} inv
 * @returns {string | null} mensaje de error, o null si OK
 */
export function appendPartOrError(build, partKey, inv) {
  const p = PARTS[partKey];
  if (!p) return 'Pieza desconocida.';

  const last = build.length ? build[build.length - 1] : null;
  if (last && last.kind === 'body' && last.id === 'capsule') {
    return 'La cápsula cierra el cohete; no puedes añadir más piezas.';
  }

  if (isEngineKey(partKey)) {
    if ((inv[partKey] || 0) < 1) return 'Sin stock de esta pieza.';
    if (!last) {
      build.push({ kind: 'motors', engineId: partKey, count: 1 });
      inv[partKey]--;
      return null;
    }
    if (last.kind === 'motors') {
      if (last.engineId !== partKey) {
        return 'En un mismo bloque todos los motores deben ser del mismo tipo.';
      }
      if (last.count >= MAX_MOTORS_PER_CLUSTER) {
        return 'Máximo de motores en este bloque; coloca una pieza encima o otra etapa.';
      }
      last.count++;
      inv[partKey]--;
      return null;
    }
    if (last.kind === 'body') {
      build.push({ kind: 'motors', engineId: partKey, count: 1 });
      inv[partKey]--;
      return null;
    }
  }

  if (typeof p.maxParallelMotors !== 'number') return 'Esta pieza no se apila como cuerpo.';
  if ((inv[partKey] || 0) < 1) return 'Sin stock de esta pieza.';

  if (partKey === 'capsule' && buildHasCapsule(build)) {
    return 'Solo una cápsula.';
  }

  if (!last) {
    return 'Empieza con motores en la base o coloca piezas en orden.';
  }

  if (mustHaveMotorsBlockBelow(partKey)) {
    if (last.kind !== 'motors') {
      return 'Esta pieza debe ir justo encima de un bloque de motores (coloca o amplía motores antes).';
    }
    const err = checkMotorCountForPart(partKey, last);
    if (err) return err;
    build.push({ kind: 'body', id: partKey });
    inv[partKey]--;
    return null;
  }

  // Cápsula o bahía de carga: pueden ir sobre motores o sobre otro cuerpo (no sobre cápsula; ya filtrado).
  if (last.kind === 'motors') {
    const err = checkMotorCountForPart(partKey, last);
    if (err) return err;
    build.push({ kind: 'body', id: partKey });
    inv[partKey]--;
    return null;
  }

  if (last.kind === 'body') {
    build.push({ kind: 'body', id: partKey });
    inv[partKey]--;
    return null;
  }

  return 'Estado de ensamblaje inválido.';
}

/**
 * Simula `appendPartOrError` sin mutar `build` ni `inv` (para UI: piezas no colocables).
 * @param {BuildSegment[]} build
 * @param {string} partKey
 * @param {Record<string, number>} inv
 * @returns {string | null} mensaje de error, o null si se podría colocar
 */
export function peekAppendPartError(build, partKey, inv) {
  const buildCopy = build.map((s) =>
    s.kind === 'motors'
      ? { kind: 'motors', engineId: s.engineId, count: s.count }
      : { kind: 'body', id: s.id },
  );
  const invCopy = { ...inv };
  return appendPartOrError(buildCopy, partKey, invCopy);
}

/**
 * Elimina un segmento por índice y devuelve piezas al inventario.
 * @param {BuildSegment[]} build
 * @param {number} index
 * @param {Record<string, number>} inv
 */
export function removeSegmentAt(build, index, inv) {
  const seg = build[index];
  if (!seg) return;
  if (seg.kind === 'motors') {
    inv[seg.engineId] = (inv[seg.engineId] || 0) + seg.count;
  } else {
    inv[seg.id] = (inv[seg.id] || 0) + 1;
  }
  build.splice(index, 1);
}

/**
 * Quita el segmento `fromIndex` y todos los que van encima (hacia la punta).
 * @param {BuildSegment[]} build
 * @param {number} fromIndex
 * @param {Record<string, number>} inv
 */
export function removeSegmentAndAbove(build, fromIndex, inv) {
  if (!Number.isFinite(fromIndex) || fromIndex < 0 || fromIndex >= build.length) return;
  for (let j = build.length - 1; j >= fromIndex; j--) {
    removeSegmentAt(build, j, inv);
  }
}

/**
 * Texto resumido para listados (una línea por segmento).
 * @param {BuildSegment[] | unknown} spec
 * @returns {string[]}
 */
export function buildSegmentLabels(spec) {
  const build = normalizeRocketSpec(spec);
  return build.map((s) => {
    if (s.kind === 'motors') {
      const n = PARTS[s.engineId]?.name || s.engineId;
      return `${s.count}× ${n}`;
    }
    return PARTS[s.id]?.name || s.id;
  });
}
