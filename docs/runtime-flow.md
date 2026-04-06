# Runtime Flow

## Ciclo por frame

1. `updateFlightSimulation(nowMs)`:
   - procesa eventos de secuencia por tiempo/altitud;
   - actualiza física traslacional;
   - aplica dinámica angular (`SPIN`/`ENGSPIN`);
   - sincroniza malla y estelas.
2. cámara de seguimiento (`input/camera.js`)
3. atmósfera de seguimiento (`scene/followAtmosphere.js`)
4. HUD de seguimiento (`ui/followHud.js`)
5. mini-renders UI (`ui/ui3d.js`)
6. render principal (`scene/setup.js`)

## Flujo de comandos de Torre de Control

`controlTowerPanel` -> `launchSequenceMaps` -> `gameState.launchSequence*Map` -> `game/sim/simulationEvents` -> `game/sim/simulationActions`.

## Flujo de clic en edificios

`scene/buildings` registra `clickables` -> `input/raycast` -> `ui/panels.openPanel`.
