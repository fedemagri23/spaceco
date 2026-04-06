/**
 * Simulación de lanzamiento: bucle físico, mapas de tiempo/altitud, separación de fases.
 */

import { scene } from '../scene/setup.js';
import { gameState } from './state.js';
import { buildPhasePlanFromSpec, getActiveBottomPhase } from './rocketPhases.js';
import {
  recomputeEntityMass,
  removeFuelTanksForSeparatedPhase,
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
import { ROCKET_MESH_VISUAL_SCALE } from '../scene/rocketMesh.js';
import { updatePhaseFlames } from '../scene/rocketFlames.js';

/** @type {ReturnType<typeof buildPhasePlanFromSpec> | null} */
let cachedPlan = null;

/** @type {Set<number>} */
let firedMissionTimes;

/** @type {Set<number>} */
let firedAltitudes;

/** @type {{ group: THREE.Group, velocity: { x: number, y: number, z: number } }[]} */
let debrisList = [];

/** @type {number} */
let lastFrameTime = 0;

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
 * @param {string} raw
 */
function applySequenceAction(raw) {
  const s = raw.trim();
  let m = s.match(/^THROTTLE\s+(\d+)\s+(\d+(?:\.\d+)?)\s*%$/i);
  if (m) {
    const phase = Number(m[1]);
    const pct = Math.max(0, Math.min(100, Number(m[2])));
    gameState.rocketEntity.throttleByPhase[phase] = pct / 100;
    return;
  }
  m = s.match(/^SEPARATE\s+(\d+)$/i);
  if (m) {
    separatePhaseNumber(Number(m[1]));
    return;
  }
  m = s.match(/^SPIN\s+([-+]?\d+)$/i);
  if (m) {
    const angle = Number(m[1]); 
    gameState.rocketEntity.angleDeg += angle;
    return;
  }
}

function separatePhaseNumber(phaseNum) {
  const root = getPadRocketGroup();
  if (!root || !root.userData.phaseGroups) return;
  const ent = gameState.rocketEntity;
  if (ent.separatedPhases.has(phaseNum)) return;

  /** @type {THREE.Group[]} */
  const groups = root.userData.phaseGroups;
  const idx = phaseNum - 1;
  if (idx < 0 || idx >= groups.length) return;

  const pg = groups[idx];
  const h = pg.userData.phaseHeight ?? 0;

  scene.attach(pg);

  const v0 = ent.velocity;
  const sepVy = Math.max(v0.y * 0.9, 0);
  debrisList.push({
    group: pg,
    velocity: {
      x: v0.x + (Math.random() - 0.5) * 0.35,
      y: sepVy + (Math.random() - 0.5) * 0.6,
      z: v0.z + (Math.random() - 0.5) * 0.35,
    },
  });

  for (const ch of root.children) {
    ch.position.y -= h;
  }

  groups.splice(idx, 1);

  ent.separatedPhases.add(phaseNum);
  removeFuelTanksForSeparatedPhase(ent, phaseNum);
  recomputeEntityMass(ent, cachedPlan);

  /** Base del cohete restante debe quedar donde estaba la base de la siguiente fase (evita salto visual). */
  ent.position.y += h * ROCKET_MESH_VISUAL_SCALE;
}

function processPendingTimeEvents() {
  const tMap = gameState.launchSequenceTimeMap;
  const ent = gameState.rocketEntity;
  tMap.forEach((actions, t) => {
    if (ent.missionElapsed < t || firedMissionTimes.has(t)) return;
    firedMissionTimes.add(t);
    actions.forEach(applySequenceAction);
  });
}

function processPendingAltitudeEvents() {
  const altMap = gameState.launchSequenceAltitudeMap;
  const ent = gameState.rocketEntity;
  const altM = ent.position.y - PAD_SURFACE_Y;
  altMap.forEach((actions, alt) => {
    if (altM < alt || firedAltitudes.has(alt)) return;
    firedAltitudes.add(alt);
    actions.forEach(applySequenceAction);
  });
}

function updateDebris(dt) {
  const g = gameState.rocketEntity.gravity;
  debrisList.forEach((d) => {
    d.velocity.y -= g * dt;
    d.group.position.x += d.velocity.x * dt;
    d.group.position.y += d.velocity.y * dt;
    d.group.position.z += d.velocity.z * dt;
    d.group.rotation.x += dt * 0.7;
    d.group.rotation.z += dt * 0.4;
  });
}

function updateFlamesVisual(timeSec) {
  const root = getPadRocketGroup();
  if (!root || !root.userData.phaseGroups || !cachedPlan) return;
  const ent = gameState.rocketEntity;
  const active = getActiveBottomPhase(ent.separatedPhases, ent.maxPhase);
  root.userData.phaseGroups.forEach((pg) => {
    const orig = pg.userData.originalPhaseIndex ?? pg.userData.phaseIndex;
    const th = ent.throttleByPhase[orig] ?? 0;
    const on =
      active === orig && th > 0 && activeStageCanProduceThrust(ent, cachedPlan, orig);
    updatePhaseFlames(pg, th, on, timeSec);
  });
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
  ent.missionElapsed = 0;
  ent.velocity = { x: 0, y: 0, z: 0 };
  ent.acceleration = { x: 0, y: 0, z: 0 };
  ent.position = { x: PAD_X, y: PAD_SURFACE_Y, z: PAD_Z };

  cachedPlan = buildPhasePlanFromSpec(spec);
  ent.maxPhase = cachedPlan.phases.length;
  /** Tanques y masa coherentes con el montaje (por si el estado no se inicializó al desplegar). */
  initRocketPropellantFromPadSpec(spec, ent);

  firedMissionTimes = new Set();
  firedAltitudes = new Set();
  debrisList = [];

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

  const dt = Math.min(0.08, Math.max(0, (nowMs - lastFrameTime) / 1000));
  lastFrameTime = nowMs;
  if (dt <= 0) return;

  const ent = gameState.rocketEntity;
  const root = getPadRocketGroup();
  if (!root || !cachedPlan) {
    gameState.flightSimRunning = false;
    return;
  }

  ent.missionElapsed += dt;

  processPendingTimeEvents();
  processPendingAltitudeEvents();

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

  root.position.set(ent.position.x, ent.position.y, ent.position.z);
  root.rotation.z = (ent.angleDeg * Math.PI) / 180 - Math.PI / 2;

  updateDebris(dt);
  updateFlamesVisual(ent.missionElapsed);
}
