/**
 * Simulación de lanzamiento: fachada/orquestador del pipeline de vuelo.
 */

import { gameState } from './state.js';
import { buildPhasePlanFromSpec, getActiveBottomPhase } from './rocketPhases.js';
import {
  burnFuelForActiveStage,
  activeStageCanProduceThrust,
  initRocketPropellantFromPadSpec,
} from './fuelTanks.js';
import {
  airDensityAtAltitude,
  dragAcceleration,
  thrustAccelerationFromNewtons,
  integrateEuler,
  estimateClusterThrustNewtons,
  gravityAtAltitudeMS2,
} from './physics.js';
import { getPadRocketGroup, PAD_SURFACE_Y, PAD_X, PAD_Z } from '../scene/rocketPad.js';
import { SIM_MAX_DT_S } from '../config/simTuning.js';
import { createApplySequenceAction } from './sim/simulationActions.js';
import {
  resetEventCursors,
  processPendingTimeEvents,
  processPendingAltitudeEvents,
} from './sim/simulationEvents.js';
import { clearDebris, updateDebris } from './sim/simulationDebris.js';
import { updateAttitudeStep } from './sim/simulationAttitude.js';
import { syncRocketTransform, updateFlamesVisual } from './sim/simulationVisualSync.js';

/** @type {ReturnType<typeof buildPhasePlanFromSpec> | null} */
let cachedPlan = null;
let lastFrameTime = 0;
/** @type {(raw: string) => void} */
let applySequenceActionFn = () => {};

/**
 * @param {unknown} rocket
 * @returns {unknown[]}
 */
function specList(rocket) {
  if (!rocket) return [];
  return rocket.build ?? rocket.parts ?? [];
}

function padRocketSpec() {
  return specList(gameState.padRocket);
}

/**
 * Inicia estado de simulación (tras cuenta atrás). T+0 aquí.
 */
export function startFlightSimulation() {
  const spec = padRocketSpec();
  if (!spec.length) return;

  const ent = gameState.rocketEntity;
  ent.separatedPhases.clear();
  ent.throttleByPhase = {};
  ent.pendingEngineSpinDegByPhase = {};
  ent.angularVelocityDegS = 0;
  ent.missionElapsed = 0;
  ent.velocity = { x: 0, y: 0, z: 0 };
  ent.acceleration = { x: 0, y: 0, z: 0 };
  ent.position = { x: PAD_X, y: PAD_SURFACE_Y, z: PAD_Z };

  cachedPlan = buildPhasePlanFromSpec(spec);
  ent.maxPhase = cachedPlan.phases.length;
  applySequenceActionFn = createApplySequenceAction({
    rocketEntity: ent,
    getPlan: () => cachedPlan,
  });
  /** Tanques y masa coherentes con el montaje (por si el estado no se inicializó al desplegar). */
  initRocketPropellantFromPadSpec(spec, ent);

  resetEventCursors(gameState.launchSequenceTimeMap, gameState.launchSequenceAltitudeMap);
  clearDebris();

  const root = getPadRocketGroup();
  if (root) root.position.set(PAD_X, PAD_SURFACE_Y, PAD_Z);

  lastFrameTime = performance.now();
  gameState.flightSimRunning = true;
}

/**
 * Un paso de simulación (llamar desde el bucle principal cada frame).
 * @param {number} nowMs - performance.now()
 */
export function updateFlightSimulation(nowMs) {
  if (!gameState.flightSimRunning) return;

  const dt = Math.min(SIM_MAX_DT_S, Math.max(0, (nowMs - lastFrameTime) / 1000));
  lastFrameTime = nowMs;
  if (dt <= 0) return;

  const ent = gameState.rocketEntity;
  const root = getPadRocketGroup();
  if (!root || !cachedPlan) {
    gameState.flightSimRunning = false;
    return;
  }

  ent.missionElapsed += dt;

  processPendingTimeEvents(ent.missionElapsed, applySequenceActionFn);
  processPendingAltitudeEvents(ent.position.y - PAD_SURFACE_Y, applySequenceActionFn);

  const altM = ent.position.y - PAD_SURFACE_Y;
  ent.gravity = gravityAtAltitudeMS2(altM);
  const rho = airDensityAtAltitude(altM);

  const active = getActiveBottomPhase(ent.separatedPhases, ent.maxPhase);
  const motorsOperational =
    active !== null && cachedPlan && activeStageCanProduceThrust(ent, cachedPlan, active);

  if (motorsOperational) {
    const thBurn = ent.throttleByPhase[active] ?? 0;
    if (thBurn > 0) burnFuelForActiveStage(ent, cachedPlan, active, thBurn, dt);
  }

  let thrustN = 0;
  if (motorsOperational) {
    const th = ent.throttleByPhase[active] ?? 0;
    const ph = cachedPlan.phases.find((p) => p.phase === active);
    if (ph) {
      const seg = cachedPlan.segments[ph.segmentStart];
      if (seg && seg.kind === 'motors') {
        thrustN = estimateClusterThrustNewtons(seg.count, th, seg.engineId);
      }
    }
  }

  const g = ent.gravity; // ya actualizado con g(h) según altitud
  const acc = {
    x: 0,
    y: -g,
    z: 0,
  };

  const thrustAcc = thrustAccelerationFromNewtons(thrustN, ent.mass, ent.angleDeg);
  acc.x += thrustAcc.x;
  acc.y += thrustAcc.y;
  acc.z += thrustAcc.z;

  const dragAcc = dragAcceleration(ent.mass, ent.velocity, rho, ent.dragCoeff, ent.dragRefAreaM2);
  acc.x += dragAcc.x;
  acc.y += dragAcc.y;
  acc.z += dragAcc.z;

  ent.acceleration = { ...acc };
  integrateEuler(ent.position, ent.velocity, acc, dt);

  const activeSpinPhase = getActiveBottomPhase(ent.separatedPhases, ent.maxPhase);
  const pendingSpinDeg = activeSpinPhase !== null
    ? (ent.pendingEngineSpinDegByPhase[activeSpinPhase] ?? 0)
    : 0;
  const applied = updateAttitudeStep({
    entity: ent,
    pendingSpinDeg,
    motorsOperational,
    thrustN,
    dt,
    plan: cachedPlan,
  });
  if (activeSpinPhase !== null && Math.abs(pendingSpinDeg) > 1e-4) {
    ent.angleDeg += applied;
    ent.pendingEngineSpinDegByPhase[activeSpinPhase] = pendingSpinDeg - applied;
    if (Math.abs(ent.pendingEngineSpinDegByPhase[activeSpinPhase]) < 1e-3) {
      ent.pendingEngineSpinDegByPhase[activeSpinPhase] = 0;
    }
  } else {
    ent.angleDeg += applied;
  }

  syncRocketTransform(root, ent);
  updateDebris(dt, ent.gravity);
  updateFlamesVisual(root, ent, cachedPlan, ent.missionElapsed);
}
