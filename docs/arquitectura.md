# Arquitectura del proyecto

## Vista rápida

```
spaceco/
├── spaceco.html
├── css/main.css
├── js/
│   ├── main.js
│   ├── config/      # catálogos + tuning
│   ├── game/        # estado y simulación
│   │   └── sim/     # submódulos de pipeline de vuelo
│   ├── scene/       # mundo 3D
│   ├── ui/          # paneles y HUD
│   └── input/       # cámara y raycast
├── tests/           # smoke tests node --test
└── docs/
```

## Bootstrap (`js/main.js`)

1. `initScene` + `bindResize`
2. `initUI3D`
3. `createEnvironment` + `createBuildings`
4. `initPanelBindings` (acciones `data-action` del HTML)
5. `refreshMoneyHud`
6. `initCameraControls`
7. loop:
   - `updateFlightSimulation`
   - `updateFollowCameraFromRocket`
   - `updateFollowAtmosphereFromRocket`
   - `updateFollowHud`
   - `renderUICanvases`
   - `renderer.render(scene, camera)`

## Dominios principales

- `js/game/state.js`: estado global mutable de partida.
- `js/game/flightSimulation.js`: fachada de simulación.
- `js/game/sim/*.js`: eventos, acciones, debris, actitud, sync visual.
- `js/scene/rocketMeshFactory.js`: factoría común para mallas de cohete.
- `js/ui/panels.js`: orquestación de paneles y acciones UI.

## Decisiones clave

- Compatibilidad estricta de DSL de lanzamiento.
- UI sin `onclick` inline: binding por `data-action`.
- Three.js vía CDN ES modules (`unpkg`).
- `gameState` sigue siendo singleton, pero se modularizó la lógica crítica alrededor de él.
