/**
 * Orquestación de paneles modales: abrir según id, delegar redraws a módulos específicos.
 */

import { closeAllPanels } from './closePanels.js';
import { drawRocketList, deployRocket } from './launchPanel.js';
import { drawPartsGrid, drawAsmStack, saveRocket } from './warehousePanel.js';
import { drawStoreGrid } from './storePanel.js';
import { drawCargoInventory } from './storagePanel.js';
import {
  syncControlTowerPanel,
  onLaunchButtonClick,
  saveLaunchSequenceFromEditor,
  syncControlTowerCameraButtons,
} from './controlTowerPanel.js';
import { setCameraFollowMode as applyCameraFollowMode } from '../input/camera.js';

/**
 * Muestra overlay + panel y refresca contenido dinámico si aplica.
 * @param {string} id - id del elemento `.panel` en el HTML
 */
export function openPanel(id) {
  document.getElementById('overlay')?.classList.add('on');
  document.getElementById(id)?.classList.add('on');
  if (id === 'launch-panel') drawRocketList();
  if (id === 'warehouse-panel') {
    drawPartsGrid();
    drawAsmStack();
  }
  if (id === 'store-panel') drawStoreGrid();
  if (id === 'storage-panel') drawCargoInventory();
  if (id === 'control-tower-panel') syncControlTowerPanel();
}

/**
 * Cierra todos los paneles (alias semántico para UI/HTML).
 */
export function closeAll() {
  closeAllPanels();
}

/**
 * Activa/desactiva cámara de seguimiento y sincroniza UI de Torre de Control.
 * @param {boolean} enable
 */
export function setCameraFollowMode(enable) {
  const st = document.getElementById('launch-sequence-save-status');
  if (enable) {
    if (applyCameraFollowMode(true)) {
      if (st?.classList.contains('ct-save-err') && st.textContent.includes('seguimiento')) {
        st.textContent = '';
        st.classList.remove('ct-save-err');
      }
    } else if (st) {
      st.textContent = 'Despliega un cohete en la plataforma para usar la cámara de seguimiento.';
      st.classList.add('ct-save-err');
      st.classList.remove('ct-save-ok');
    }
  } else {
    applyCameraFollowMode(false);
  }
  syncControlTowerCameraButtons();
}

/**
 * Binding explícito de acciones UI declaradas en `data-action`.
 */
export function initPanelBindings() {
  /** @type {Record<string, () => void>} */
  const actions = {
    'close-all': () => closeAll(),
    'deploy-rocket': () => deployRocket(),
    'save-rocket': () => saveRocket(),
    'launch-go': () => { void onLaunchButtonClick(); },
    'save-launch-sequence': () => saveLaunchSequenceFromEditor(),
    'camera-follow-on': () => setCameraFollowMode(true),
    'camera-follow-off': () => setCameraFollowMode(false),
  };
  document.querySelectorAll('[data-action]').forEach((el) => {
    const action = el.getAttribute('data-action') || '';
    const fn = actions[action];
    if (!fn) return;
    el.addEventListener('click', fn);
  });
}
