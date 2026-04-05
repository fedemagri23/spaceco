/**
 * Torre de control: secuencia de lanzamiento y arranque de simulación.
 */

import { gameState } from '../game/state.js';
import { applyLaunchSequenceMapsToState } from '../game/launchSequenceMaps.js';
import { startFlightSimulation } from '../game/flightSimulation.js';
import { closeAllPanels } from './closePanels.js';
import { isCameraFollowMode } from '../input/camera.js';

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
export function syncControlTowerCameraButtons() {
  const btnFollow = document.getElementById('btn-cam-follow');
  const btnFree = document.getElementById('btn-cam-free');
  if (!btnFollow || !btnFree) return;
  const on = isCameraFollowMode();
  btnFollow.style.display = on ? 'none' : '';
  btnFree.style.display = on ? '' : 'none';
}

export function syncControlTowerPanel() {
  bindEditorOnce();
  const ta = document.getElementById('launch-sequence-editor');
  if (ta) ta.value = gameState.launchSequenceScript;
  setSaveStatus('', false);
  syncControlTowerCameraButtons();
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

function runCountdownOverlay() {
  return new Promise((resolve) => {
    const el = document.getElementById('launch-countdown-overlay');
    const text = el?.querySelector('.launch-countdown-num');
    if (!el || !text) {
      resolve();
      return;
    }
    el.classList.add('on');
    el.setAttribute('aria-hidden', 'false');
    const seq = ['3', '2', '1', 'GO'];
    let i = 0;
    text.textContent = seq[0];
    const id = setInterval(() => {
      i++;
      if (i < seq.length) {
        text.textContent = seq[i];
      } else {
        clearInterval(id);
        setTimeout(() => {
          el.classList.remove('on');
          el.setAttribute('aria-hidden', 'true');
          resolve();
        }, 450);
      }
    }, 1000);
  });
}

/**
 * Cuenta atrás 3-2-1-GO, luego T+0 y simulación de vuelo.
 */
export async function onLaunchButtonClick() {
  if (gameState.flightSimRunning) return;
  if (!gameState.padRocket) {
    setSaveStatus('No hay cohete en la plataforma.', true);
    return;
  }
  saveLaunchSequenceFromEditor();
  applyLaunchSequenceMapsToState(gameState.launchSequenceScript, gameState);
  closeAllPanels();
  await runCountdownOverlay();
  startFlightSimulation();
}
