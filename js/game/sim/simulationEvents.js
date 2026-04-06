/**
 * Índices de eventos por tiempo/altitud para evitar escaneo completo por frame.
 */

/** @type {{ t: number, actions: string[] }[]} */
let timeEvents = [];
/** @type {{ alt: number, actions: string[] }[]} */
let altitudeEvents = [];
let timeCursor = 0;
let altitudeCursor = 0;

/**
 * @param {Map<number, string[]>} timeMap
 * @param {Map<number, string[]>} altitudeMap
 */
export function resetEventCursors(timeMap, altitudeMap) {
  timeEvents = [...timeMap.entries()]
    .map(([t, actions]) => ({ t, actions: [...actions] }))
    .sort((a, b) => a.t - b.t);
  altitudeEvents = [...altitudeMap.entries()]
    .map(([alt, actions]) => ({ alt, actions: [...actions] }))
    .sort((a, b) => a.alt - b.alt);
  timeCursor = 0;
  altitudeCursor = 0;
}

/**
 * @param {number} missionElapsed
 * @param {(action: string) => void} applyAction
 */
export function processPendingTimeEvents(missionElapsed, applyAction) {
  while (timeCursor < timeEvents.length && missionElapsed >= timeEvents[timeCursor].t) {
    timeEvents[timeCursor].actions.forEach(applyAction);
    timeCursor++;
  }
}

/**
 * @param {number} altitudeM
 * @param {(action: string) => void} applyAction
 */
export function processPendingAltitudeEvents(altitudeM, applyAction) {
  while (altitudeCursor < altitudeEvents.length && altitudeM >= altitudeEvents[altitudeCursor].alt) {
    altitudeEvents[altitudeCursor].actions.forEach(applyAction);
    altitudeCursor++;
  }
}
