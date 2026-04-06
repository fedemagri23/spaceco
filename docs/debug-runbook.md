# Debug Runbook

## La UI no responde al botón

1. Verifica `data-action` correcto en `spaceco.html`.
2. Verifica que `initPanelBindings()` se ejecuta en `main.js`.
3. Revisa consola por errores de imports.

## El panel no abre al hacer clic en edificio

1. Revisa `registerClickable(...)` en `scene/buildings.js`.
2. Revisa mapeo `type -> panel id` en `input/raycast.js`.
3. Confirma que el `id` del panel existe en `spaceco.html`.

## La secuencia no ejecuta una orden

1. Guarda secuencia y revisa mensaje en torre de control.
2. Verifica sintaxis en `docs/launch-sequence-dsl.md`.
3. Revisa `launchSequenceTimeMap` / `launchSequenceAltitudeMap` en runtime.

## La etapa separada cae raro

Revisar `js/game/sim/simulationDebris.js` (`pushSeparatedDebris` y `updateDebris`).

## Checks rápidos

- `npm run lint`
- `npm test`
