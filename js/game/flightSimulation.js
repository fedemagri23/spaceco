/**
 * Simulación de lanzamiento: fachada/orquestador del pipeline de vuelo.
 */

import { gameState } from './state.js';
import { buildPhasePlanFromSpec, getActiveBottomPhase } from './rocketPhases.js';
import { FlightComputer } from './control/FlightComputer.js';
import { executeCommand } from './control/CommandRegistry.js';
import { PAD_SURFACE_Y, PAD_X, PAD_Z, getPadRocketGroup } from '../scene/rocketPad.js';
import { SIM_MAX_DT_S } from '../config/simTuning.js';
import { createApplySequenceAction } from './sim/simulationActions.js';
import { resetEventCursors } from './sim/simulationEvents.js';
import { clearDebris, updateDebris } from './sim/simulationDebris.js';
import { updateAttitudeStep } from './sim/simulationAttitude.js';
import { syncRocketTransform, updateFlamesVisual } from './sim/simulationVisualSync.js';
import { SimulationLoop } from './physics/SimulationLoop.js';
import { gameClock } from './GameClock.js';
import { scene } from '../scene/setup.js';
import { addCommandToLog, clearCommandLog } from '../ui/commandLog.js';

/** @type {ReturnType<typeof buildPhasePlanFromSpec> | null} */
let cachedPlan = null;
let lastFrameTime = 0;
let applySequenceActionFn = null;

/** @type {SimulationLoop | null} */
let simLoop = null;
/** @type {FlightComputer | null} */
let flightComputer = null;

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
  ent.reset();
  clearCommandLog();

  cachedPlan = buildPhasePlanFromSpec(spec);
  ent.maxPhase = cachedPlan.phases.length;
  ent.payloadId = gameState.padPayloadId || null;
  ent.isSatelliteReleased = false;

  applySequenceActionFn = createApplySequenceAction({
    rocketEntity: ent,
    getPlan: () => cachedPlan,
  });

  // Import dynamic due to circular dep risk if at top
  import('./fuelTanks.js').then(({ initRocketPropellantFromPadSpec }) => {
    initRocketPropellantFromPadSpec(spec, ent);
  });

  resetEventCursors(gameState.launchSequenceTimeMap, gameState.launchSequenceAltitudeMap);
  clearDebris();

  const root = getPadRocketGroup();
  if (root) root.position.set(PAD_X, PAD_SURFACE_Y, PAD_Z);

  // Initialize Simulation Loop & Flight Computer
  simLoop = new SimulationLoop(ent, cachedPlan);
  flightComputer = new FlightComputer(ent, gameState.launchSequenceTimeMap, gameState.launchSequenceAltitudeMap);
  
  // Set up special command handlers
  flightComputer.setHandlers({
    onSeparate: (phase) => {
      // Lazy load to avoid circular deps
      import('./sim/simulationActions.js').then(({ separatePhaseNumber }) => {
        separatePhaseNumber(phase, ent, () => cachedPlan);
      });
    },
    onAbort: () => {
      abortFlightSimulation();
    },
    onRelease: () => {
      import('./sim/simulationActions.js').then(({ releasePayload }) => {
        releasePayload(ent);
      });
    },
    onCommandExecuted: (line) => {
      addCommandToLog(line);
    }
  });

  // Randomize wind (Realistic range: 0-15 m/s)
  const windIntensity = Math.random() * 15;
  const windDir = Math.random() * 360;
  simLoop.setWind(windIntensity, windDir);
  gameState.currentWind = { intensity: windIntensity, direction: windDir };

  lastFrameTime = performance.now();
  gameState.flightSimRunning = true;
}

export function stopFlightSimulation() {
  gameState.flightSimRunning = false;
  // Reset speed when not flying
  gameClock.setTimeScale(1);
  gameState.simSpeed = 1;
  const se = document.getElementById('sim-speed-el');
  if (se) se.textContent = 'x1';
}

export function abortFlightSimulation() {
  stopFlightSimulation();
  
  // Clear pad rocket as it's lost (remove from persistent inventory)
  if (gameState.padRocket) {
    const rocketIndex = gameState.savedRockets.findIndex(r => r.name === gameState.padRocket.name);
    if (rocketIndex !== -1) {
      gameState.savedRockets.splice(rocketIndex, 1);
    }
    // Clear inventory for parts used in this rocket? 
    // Usually padRocket is built from parts, but in this game's current logic, 
    // once pushed to pad it's a separate entity. 
    gameState.padRocket = null;
  }

  // Clear payload from inventory if it was on board or already released
  if (gameState.padPayloadId) {
    if (gameState.cargoInv[gameState.padPayloadId] > 0) {
      gameState.cargoInv[gameState.padPayloadId]--;
    }
    gameState.padPayloadId = null;
  }

  // Re-sync UI (Launch panel and storage)
  import('../ui/launchPanel.js').then(({ renderRocketList }) => renderRocketList());
  import('../ui/storagePanel.js').then(({ renderCargoInventory }) => renderCargoInventory());
  import('../ui/hud.js').then(({ refreshMoneyHud }) => refreshMoneyHud());

  // Also clear the scene group for the pad rocket if any
  const root = getPadRocketGroup();
  if (root) {
    scene.remove(root);
  }

  // Switch to free camera automatically
  import('../input/camera.js').then(({ setCameraFollowMode }) => {
    setCameraFollowMode(false);
  });

  console.log('Flight Aborted: Rocket and payload lost from inventory.');
}

/**
 * Un paso de simulación (llamar desde el bucle principal cada frame).
 * @param {number} nowMs - performance.now()
 */
export function updateFlightSimulation(nowMs) {
  if (!gameState.flightSimRunning || !simLoop) return;

  // Use simulation speed multiplier from gameState (default 1)
  const timeScale = gameState.simSpeed ?? 1;
  const dtReal = Math.min(SIM_MAX_DT_S, Math.max(0, (nowMs - lastFrameTime) / 1000));
  const dt = dtReal * timeScale;
  lastFrameTime = nowMs;
  if (dt <= 0) return;

  const ent = gameState.rocketEntity;
  const root = getPadRocketGroup();
  if (!root || !cachedPlan) {
    gameState.flightSimRunning = false;
    return;
  }

  // Process events via Flight Computer
  flightComputer.processEvents(ent.missionElapsed, ent.getAltitude());

  // Core Simulation Step
  simLoop.step(dt);

  // Visual Sync
  syncRocketTransform(root, ent);
  updateDebris(dt, ent.gravity);
  updateFlamesVisual(root, ent, cachedPlan, ent.missionElapsed);
}