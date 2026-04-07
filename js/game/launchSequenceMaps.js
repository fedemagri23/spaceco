/**
 * Parseo del pseudocódigo de secuencia → mapas tiempo y altitud.
 * Cada guardado vacía y rellena los `Map` en `gameState` (sin acumular entradas viejas).
 */

/**
 * Si la acción es THROTTLE, el porcentaje debe estar en [0, 100].
 * @param {string} action
 * @param {number} lineNum - 1-based
 * @returns {string | null} mensaje de error o null
 */
export function validateSequenceActionLine(action, lineNum) {
  const trimmed = action.trim();
  const m = trimmed.match(/^THROTTLE\s+(\d+)\s+(\d+(?:\.\d+)?)\s*%$/i);
  if (m) {
    const pct = parseFloat(m[2]);
    if (!Number.isFinite(pct) || pct < 0 || pct > 100) {
      return `Línea ${lineNum}: THROTTLE exige porcentaje entre 0 y 100 (valor: ${m[2]})`;
    }
    return null;
  }

  // SEPARATE
  let sep = trimmed.match(/^SEPARATE\s+(\d+)$/i);
  if (sep) {
    const phase = parseInt(sep[1], 10);
    if (!Number.isFinite(phase) || phase < 1) {
      return `Línea ${lineNum}: SEPARATE exige número de fase >= 1`;
    }
    return null;
  }

  // RELEASE
  if (trimmed.match(/^RELEASE$/i)) {
    return null;
  }

  // ABORT
  if (trimmed.match(/^ABORT$/i)) {
    return null;
  }

  // YAW
  let ey = trimmed.match(/^YAW\s+([-+]?\d+(?:\.\d+)?)\s*d?$/i);
  if (ey) {
    const deg = parseFloat(ey[1]);
    if (!Number.isFinite(deg)) {
      return `Línea ${lineNum}: YAW exige grados válidos (ej.: YAW 45)`;
    }
    return null; // OK
  }

  // PITCH
  let ez = trimmed.match(/^PITCH\s+([-+]?\d+(?:\.\d+)?)\s*d?$/i);
  if (ez) {
    const deg = parseFloat(ez[1]);
    if (!Number.isFinite(deg)) {
      return `Línea ${lineNum}: PITCH exige grados válidos (ej.: PITCH 45)`;
    }
    return null; // OK
  }

  return null;
}

/**
 * @param {string} script
 * @returns {{ timeMap: Map<number, string[]>, altitudeMap: Map<number, string[]>, errors: string[] }}
 */
export function parseLaunchSequenceScript(script) {
  /** @type {Map<number, string[]>} */
  const timeMap = new Map();
  /** @type {Map<number, string[]>} */
  const altitudeMap = new Map();
  /** @type {string[]} */
  const errors = [];

  const lines = script.split(/\r?\n/);
  lines.forEach((line, i) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;

    let m = trimmed.match(/^AT\s+T\+(\d+(?:\.\d+)?)s\s*:\s*(.*)$/i);
    if (m) {
      const t = parseFloat(m[1]);
      const action = (m[2] || '').trim();
      if (!action) {
        errors.push(`Línea ${i + 1}: acción vacía tras T+${m[1]}s`);
        return;
      }
      const throttleErr = validateSequenceActionLine(action, i + 1);
      if (throttleErr) {
        errors.push(throttleErr);
        return;
      }
      if (!timeMap.has(t)) timeMap.set(t, []);
      timeMap.get(t).push(action);
      return;
    }

    m = trimmed.match(/^AT\s+ALTITUDE\s+(\d+(?:\.\d+)?)m\s*:\s*(.*)$/i);
    if (m) {
      const alt = parseFloat(m[1]);
      const action = (m[2] || '').trim();
      if (!action) {
        errors.push(`Línea ${i + 1}: acción vacía tras ALTITUDE ${m[1]}m`);
        return;
      }
      const throttleErr = validateSequenceActionLine(action, i + 1);
      if (throttleErr) {
        errors.push(throttleErr);
        return;
      }
      if (!altitudeMap.has(alt)) altitudeMap.set(alt, []);
      altitudeMap.get(alt).push(action);
      return;
    }

    errors.push(`Línea ${i + 1}: formato no reconocido (use AT T+…s: o AT ALTITUDE …m:)`);
  });

  return { timeMap, altitudeMap, errors };
}

/**
 * Sobrescribe `gameState.launchSequenceTimeMap` y `launchSequenceAltitudeMap` con el parseo actual.
 * @param {string} script
 * @param {{
 *   launchSequenceTimeMap: Map<number, string[]>,
 *   launchSequenceAltitudeMap: Map<number, string[]>,
 * }} gameStateSlice - típicamente `gameState`
 * @returns {string[]} mensajes de error de parseo (vacío si todo OK)
 */
export function applyLaunchSequenceMapsToState(script, gameStateSlice) {
  const { timeMap, altitudeMap, errors } = parseLaunchSequenceScript(script);

  gameStateSlice.launchSequenceTimeMap.clear();
  gameStateSlice.launchSequenceAltitudeMap.clear();

  timeMap.forEach((actions, t) => {
    gameStateSlice.launchSequenceTimeMap.set(t, [...actions]);
  });
  altitudeMap.forEach((actions, alt) => {
    gameStateSlice.launchSequenceAltitudeMap.set(alt, [...actions]);
  });

  return errors;
}
