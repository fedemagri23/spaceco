/**
 * Torre de control: secuencia de lanzamiento (pseudocódigo) y botón de lanzamiento.
 */

import { gameState } from '../game/state.js';
import { applyLaunchSequenceMapsToState } from '../game/launchSequenceMaps.js';

let editorBound = false;

function bindEditorOnce() {
  if (editorBound) return;
  const ta = document.getElementById('launch-sequence-editor');
  if (!ta) return;
  editorBound = true;
  ta.addEventListener('input', () => {
    gameState.launchSequenceScript = ta.value;
  });
}

function setSaveStatus(message, isError) {
  const el = document.getElementById('launch-sequence-save-status');
  if (!el) return;
  el.textContent = message;
  el.classList.toggle('ct-save-err', !!isError);
  el.classList.toggle('ct-save-ok', !isError && !!message);
}

/**
 * Sincroniza el textarea con el estado al abrir el panel.
 */
export function syncControlTowerPanel() {
  bindEditorOnce();
  const ta = document.getElementById('launch-sequence-editor');
  if (ta) ta.value = gameState.launchSequenceScript;
  setSaveStatus('', false);
}

/**
 * Guarda el texto y reconstruye mapas de tiempo y altitud (sobrescribe los anteriores).
 */
export function saveLaunchSequenceFromEditor() {
  const ta = document.getElementById('launch-sequence-editor');
  if (!ta) return;
  gameState.launchSequenceScript = ta.value;
  const errors = applyLaunchSequenceMapsToState(gameState.launchSequenceScript, gameState);
  if (errors.length) {
    setSaveStatus(`Avisos: ${errors.join(' · ')}`, true);
  } else {
    setSaveStatus('Secuencia guardada (mapas actualizados).', false);
  }
}

/**
 * Botón de lanzamiento (sin efecto por ahora).
 */
export function onLaunchButtonClick() {
  /* Reservado: sistema de lanzamiento */
}
