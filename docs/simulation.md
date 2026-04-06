# Simulación de vuelo

## Módulos

- `js/game/flightSimulation.js`: orquestador público (`startFlightSimulation`, `updateFlightSimulation`).
- `js/game/sim/simulationEvents.js`: cursores ordenados por tiempo/altitud.
- `js/game/sim/simulationActions.js`: aplica `THROTTLE`, `SEPARATE`, `SPIN`, `ENGSPIN`.
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

## Sobre `SPIN` y `ENGSPIN`

- `SPIN X` encola giro sobre fase activa.
- `ENGSPIN fase Xd` encola giro en fase específica (si no fue separada).
- La ejecución es gradual; no hay salto instantáneo de ángulo.
