# UI Panels y bindings

## Principios

- No usar `onclick` inline.
- Declarar acciones con `data-action` en `spaceco.html`.
- Registrar listeners en `js/ui/panels.js` (`initPanelBindings`).

## Apertura de paneles

- Entrada: `openPanel(panelId)` en `js/ui/panels.js`.
- Cierre global: `closeAll()` delega en `closeAllPanels()`.

## Sincronización por panel

- `launch-panel`: `drawRocketList()`
- `warehouse-panel`: `drawPartsGrid()` + `drawAsmStack()`
- `store-panel`: `drawStoreGrid()`
- `storage-panel`: `drawCargoInventory()`
- `control-tower-panel`: `syncControlTowerPanel()`

## Cámara seguimiento

- Acción UI: `setCameraFollowMode(boolean)` en `js/ui/panels.js`.
- Controla validación de cohete desplegado y sincroniza botones de torre.
