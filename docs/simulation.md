# Simulación de vuelo

## Módulos

- `js/game/flightSimulation.js`: orquestador público (`startFlightSimulation`, `updateFlightSimulation`).
- `js/game/sim/simulationEvents.js`: cursores ordenados por tiempo/altitud.
- `js/game/sim/simulationActions.js`: aplica `THROTTLE`, `SEPARATE`, `SPIN`, `ENGSPINY`, `ENGSPINZ`.
- `js/game/sim/simulationDebris.js`: física visual de etapas separadas.
- `js/game/sim/simulationAttitude.js`: rotación progresiva por autoridad de empuje.
- `js/game/sim/simulationVisualSync.js`: transform + llamas.

## Pipeline físico

1. gravedad por altitud (`gravityAtAltitudeMS2`)
2. densidad y drag (`airDensityAtAltitude`, `dragAcceleration`)
3. empuje por fase activa (`estimateClusterThrustNewtons`)
4. consumo de combustible (`burnFuelForActiveStage`)
5. integración (`integrateEuler`)
6. actitud angular y aplicación de giro pendiente

## Sobre `SPIN`, `ENGSPINY` y `ENGSPINZ`

- `SPIN X` encola giro sobre fase activa (eje Y).
- `ENGSPINY fase Xd` encola giro en eje Y (pitch) para fase específica (si no fue separada).
- `ENGSPINZ fase Xd` encola giro en eje Z (yaw) para fase específica (si no fue separada).
- La ejecución es gradual; no hay salto instantáneo de ángulo.
