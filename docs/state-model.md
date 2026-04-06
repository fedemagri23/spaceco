# State Model

## `gameState` (fuente de verdad runtime)

Definido en `js/game/state.js`.

Bloques principales:

- economía e inventario: `money`, `inv`, `cargoInv`
- cohetes: `savedRockets`, `build`, `selectedRocket`, `padRocket`, `padPayloadId`
- secuencia: `launchSequenceScript`, `launchSequenceTimeMap`, `launchSequenceAltitudeMap`
- simulación: `rocketEntity`, `flightSimRunning`

## `rocketEntity`

Definido por `createRocketEntityState()` en `js/game/rocketEntity.js`.

Campos clave:

- traslación: `position`, `velocity`, `acceleration`
- orientación: `angleDeg`, `angularVelocityDegS`, `pendingEngineSpinDegByPhase`
- masa y gravedad: `mass`, `referenceMassKg`, `gravity`
- propulsión y etapas: `throttleByPhase`, `separatedPhases`, `fuelTanks`, `maxPhase`

## Compatibilidad legacy

Se soportan cohetes en formato:

- nuevo: `build` (segmentos `{ kind: 'motors'|'body', ... }`)
- legacy: `parts` (`string[]`)

La normalización ocurre en `js/game/rocketBuild.js`.
