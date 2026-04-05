/**
 * Parseo del pseudocódigo de secuencia → mapas tiempo y altitud.
 * Cada guardado vacía y rellena los `Map` en `gameState` (sin acumular entradas viejas).
 */

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

  console.log('[LaunchSequence] mapas actualizados', {
    tiempo: Object.fromEntries(gameStateSlice.launchSequenceTimeMap),
    altitud: Object.fromEntries(gameStateSlice.launchSequenceAltitudeMap),
    avisosParseo: errors.length ? errors : undefined,
  });

  return errors;
}
