/**
 * Orquestación de paneles modales: abrir según id, delegar redraws a módulos específicos.
 * Expone `closeAll` en `window` vía `attachGlobalHandlers` desde `main.js`.
 */

import { closeAllPanels } from './closePanels.js';
import { drawRocketList, deployRocket } from './launchPanel.js';
import { drawPartsGrid, drawAsmStack, saveRocket } from './warehousePanel.js';
import { drawStoreGrid, buyPart } from './storePanel.js';
import { drawCargoInventory } from './storagePanel.js';
import { syncControlTowerPanel, onLaunchButtonClick, saveLaunchSequenceFromEditor } from './controlTowerPanel.js';

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
 * Conecta funciones usadas desde atributos `onclick` en el HTML estático.
 */
export function attachGlobalHandlers() {
  window.closeAll = closeAll;
  window.deployRocket = deployRocket;
  window.buyPart = buyPart;
  window.saveRocket = saveRocket;
  window.onLaunchButtonClick = onLaunchButtonClick;
  window.saveLaunchSequence = saveLaunchSequenceFromEditor;
}
