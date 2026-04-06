# Mapa de archivos (guía para tocar a mano)

Este documento indica qué hace cada archivo y dónde tocar según el cambio que quieras hacer.

## Raíz

- `spaceco.html`
  - **Qué hace:** estructura DOM de HUD/paneles y botones.
  - **Toca aquí si:** agregas panel nuevo, botón nuevo, `data-action` nuevo.
- `css/main.css`
  - **Qué hace:** estilos globales.
  - **Toca aquí si:** cambias layout/estética de paneles o HUD.
- `js/main.js`
  - **Qué hace:** bootstrap y game loop.
  - **Toca aquí si:** necesitas inicializar un sistema nuevo al arrancar.

## Config (`js/config`)

- `parts.js`: catálogo de piezas + precios.
- `payloadItems.js`: catálogo de cargas útiles.
- `partSimulation.js`: parámetros físicos por pieza.
- `launchSequence.js`: script DSL default.
- `simTuning.js`: tuning de simulación.
- `cameraTuning.js`: tuning de cámara.
- `uiTuning.js`: tuning de UI.

**Si quieres cambiar rendimiento/comportamiento base**, empieza por `simTuning.js` y `cameraTuning.js`.

## Game (`js/game`)

- `state.js`
  - estado global.
  - tocar para nuevas mecánicas persistentes.
- `rocketEntity.js`
  - estado físico del cohete activo.
  - tocar para nuevos campos físicos.
- `rocketBuild.js`
  - reglas de ensamblaje.
  - tocar para nuevas restricciones de build.
- `rocketPhases.js`
  - cálculo de fases.
  - tocar para lógica de staging distinta.
- `fuelTanks.js`
  - combustible y masa.
  - tocar para consumo/mass model.
- `physics.js`
  - ecuaciones de gravedad, drag, empuje e integración.
  - tocar para alterar modelo de vuelo.
- `launchSequenceMaps.js`
  - parser/validador DSL.
  - tocar para agregar comandos nuevos.
- `flightSimulation.js`
  - orquesta pipeline por frame.
  - tocar para cambiar orden de simulación.

### Submódulos simulación (`js/game/sim`)

- `simulationEvents.js`
  - cursores por tiempo/altitud.
  - tocar para scheduling de eventos.
- `simulationActions.js`
  - ejecuta acciones DSL (`THROTTLE`, `SEPARATE`, `SPIN`, `ENGSPIN`).
  - tocar para semántica de comandos.
- `simulationDebris.js`
  - física visual de etapas descartadas.
  - tocar para comportamiento de separación/cascada.
- `simulationAttitude.js`
  - dinámica angular.
  - tocar para realismo de giro.
- `simulationVisualSync.js`
  - sync transform + llamas.
  - tocar para visuales del cohete en vuelo.

## Scene (`js/scene`)

- `setup.js`: scene/camera/renderer.
- `environment.js`: terreno/mar/props.
- `buildings.js`: edificios e interacción.
- `interaction.js`: registro de clickables.
- `rocketPad.js`: cohete en plataforma.
- `rocketMesh.js`: malla simple de cohete (UI/preview).
- `rocketMeshPhased.js`: malla por fases (vuelo).
- `rocketMeshFactory.js`: geometría compartida (evitar duplicación).
- `rocketFlames.js`: estelas de motor.
- `followAtmosphere.js`: atmósfera vinculada a cámara/cohete.
- `payloadMesh.js`: malla de carga útil.

**Si agregas una forma nueva de pieza**, toca `rocketMeshFactory.js` y valida `rocketMeshPhased.js`.

## Input (`js/input`)

- `camera.js`
  - controles orbitales + seguimiento.
  - tocar para ergonomía de cámara.
- `raycast.js`
  - hover/click 3D y apertura de panel por tipo.
  - tocar para nuevas interacciones sobre edificios.

## UI (`js/ui`)

- `panels.js`
  - orquestación de paneles y bindings `data-action`.
  - tocar para nuevos botones globales.
- `closePanels.js`
  - cierre de overlays/paneles.
- `hud.js`
  - HUD superior de dinero.
- `followHud.js`
  - telemetría modo seguimiento.
- `controlTowerPanel.js`
  - editor DSL y lanzamiento.
- `launchPanel.js`
  - selección/despliegue de cohete + carga útil.
- `warehousePanel.js`
  - ensamblaje.
- `storePanel.js`
  - compras.
- `storagePanel.js`
  - inventario de carga útil.
- `ui3d.js`
  - mini-render de canvases en UI.

## Tests (`tests`)

- `launchSequenceMaps.test.js`: parser/validación DSL.
- `rocketBuild.test.js`: reglas de ensamblaje.
- `rocketPhases.test.js`: cálculo de fases.

## Dónde tocar según objetivo

- **Agregar comando DSL:** `launchSequenceMaps.js`, `simulationActions.js`, `docs/launch-sequence-dsl.md`.
- **Cambiar física de giro:** `simulationAttitude.js`, `simTuning.js`, `followHud.js`.
- **Cambiar separación de etapas:** `simulationActions.js`, `simulationDebris.js`.
- **Agregar panel nuevo:** `spaceco.html`, `ui/panels.js`, módulo `ui/*Panel.js`, `raycast.js` (si abre desde edificio).
- **Agregar pieza nueva:** `config/parts.js`, `config/partSimulation.js`, `rocketMeshFactory.js`, docs de pieza.
