/**
 * Propulsante por tanque de combustible y masa total coherente con separación y consumo.
 * Capacidades y tasas salen de `PARTS[].sim` vía `partSimulation.js`.
 */

import { buildPhasePlanFromSpec, estimatePartMassKg } from './rocketPhases.js';
import {
  isFuelTankPartId,
  getFuelTankSimulation,
  getEngineSimulation,
} from '../config/partSimulation.js';

/**
 * @param {object[]} segments
 * @param {{ phase: number, segmentStart: number, segmentEnd: number }[]} phases
 * @param {number} segIdx
 * @returns {number}
 */
function phaseForSegmentIndex(segments, phases, segIdx) {
  for (const ph of phases) {
    if (segIdx >= ph.segmentStart && segIdx <= ph.segmentEnd) return ph.phase;
  }
  return 1;
}

/**
 * La fase incluye al menos un tanque de combustible con `sim` en el catálogo.
 * @param {ReturnType<typeof buildPhasePlanFromSpec>} plan
 * @param {number} phaseNum
 */
export function phasePlanHasFuelTankInPhase(plan, phaseNum) {
  const ph = plan.phases.find((p) => p.phase === phaseNum);
  if (!ph) return false;
  const segs = plan.segments;
  for (let i = ph.segmentStart + 1; i <= ph.segmentEnd; i++) {
    const s = segs[i];
    if (s && s.kind === 'body' && isFuelTankPartId(s.id)) return true;
  }
  return false;
}

/**
 * @param {object} entity
 * @param {number} phaseNum
 */
export function activePhaseHasPropellantRemaining(entity, phaseNum) {
  const tanks = (entity.fuelTanks || []).filter((t) => t.phase === phaseNum && t.currentFuelKg > 1e-9);
  return tanks.length > 0;
}

/**
 * Motores operativos: montaje con tanque de combustible en la fase y propulsante disponible.
 * @param {object} entity
 * @param {ReturnType<typeof buildPhasePlanFromSpec>} plan
 * @param {number | null} phaseNum
 */
export function activeStageCanProduceThrust(entity, plan, phaseNum) {
  if (phaseNum == null || !plan) return false;
  if (!phasePlanHasFuelTankInPhase(plan, phaseNum)) return false;
  return activePhaseHasPropellantRemaining(entity, phaseNum);
}

/**
 * @param {ReturnType<typeof buildPhasePlanFromSpec>} plan
 * @param {number} phaseNum
 * @returns {number}
 */
export function getMotorCountForPhase(plan, phaseNum) {
  const ph = plan.phases.find((p) => p.phase === phaseNum);
  if (!ph) return 0;
  const seg = plan.segments[ph.segmentStart];
  if (!seg || seg.kind !== 'motors') return 0;
  return Math.max(0, seg.count | 0);
}

/**
 * Inicializa tanques llenos y masa de referencia (cohete completo en plataforma).
 * @param {unknown} spec
 * @param {object} entity - `gameState.rocketEntity`
 */
export function initRocketPropellantFromPadSpec(spec, entity) {
  const plan = buildPhasePlanFromSpec(spec);
  const { segments, phases } = plan;
  entity.referenceMassKg = phases.reduce((acc, p) => acc + p.massKg, 0);
  entity.fuelTanks = [];
  let n = 0;
  segments.forEach((seg, idx) => {
    if (seg.kind !== 'body' || !isFuelTankPartId(seg.id)) return;
    const cfg = getFuelTankSimulation(seg.id);
    if (!cfg) return;
    n += 1;
    entity.fuelTanks.push({
      tankIndex: n,
      segmentIndex: idx,
      partId: seg.id,
      phase: phaseForSegmentIndex(segments, phases, idx),
      maxFuelKg: cfg.propellantMaxKg,
      currentFuelKg: cfg.propellantMaxKg,
      dryMassKg: cfg.dryMassKg,
    });
  });
  recomputeEntityMass(entity, plan);
}

/**
 * Recalcula masa del cohete restante (fases no separadas + propulsante actual).
 * @param {object} entity
 * @param {ReturnType<typeof buildPhasePlanFromSpec> | null} plan
 */
export function recomputeEntityMass(entity, plan) {
  if (!plan) return;
  let m = 0;
  const tankBySeg = new Map(entity.fuelTanks.map((t) => [t.segmentIndex, t]));

  plan.phases.forEach((ph) => {
    if (entity.separatedPhases.has(ph.phase)) return;
    const segs = plan.segments;
    const motorSeg = segs[ph.segmentStart];
    if (motorSeg && motorSeg.kind === 'motors') {
      m += estimatePartMassKg(motorSeg.engineId) * motorSeg.count;
    }
    for (let idx = ph.segmentStart + 1; idx <= ph.segmentEnd; idx++) {
      const seg = segs[idx];
      if (!seg || seg.kind !== 'body') continue;
      if (isFuelTankPartId(seg.id)) {
        const tank = tankBySeg.get(idx);
        m += tank ? tank.dryMassKg + tank.currentFuelKg : estimatePartMassKg(seg.id);
      } else {
        m += estimatePartMassKg(seg.id);
      }
    }
  });

  entity.mass = Math.max(40, m);
}

/**
 * Elimina tanques de una fase separada.
 * @param {object} entity
 * @param {number} phaseNum
 */
export function removeFuelTanksForSeparatedPhase(entity, phaseNum) {
  entity.fuelTanks = entity.fuelTanks.filter((t) => t.phase !== phaseNum);
}

/**
 * Consume propulsante en la fase activa: tasa según tipo de motor × N × acelerador.
 * @param {object} entity
 * @param {ReturnType<typeof buildPhasePlanFromSpec>} plan
 * @param {number | null} activePhase
 * @param {number} throttle01
 * @param {number} dt
 */
export function burnFuelForActiveStage(entity, plan, activePhase, throttle01, dt) {
  if (activePhase == null || throttle01 <= 0 || dt <= 0) return;
  if (!phasePlanHasFuelTankInPhase(plan, activePhase)) return;

  const motorCount = getMotorCountForPhase(plan, activePhase);
  if (motorCount <= 0) return;

  const ph = plan.phases.find((p) => p.phase === activePhase);
  const motorSeg = ph ? plan.segments[ph.segmentStart] : null;
  const engineId = motorSeg && motorSeg.kind === 'motors' ? motorSeg.engineId : 'engine';
  const rate = getEngineSimulation(engineId).propellantKgPerS;

  const tanks = entity.fuelTanks.filter((t) => t.phase === activePhase && t.currentFuelKg > 0);
  if (!tanks.length) return;

  const totalBurn = rate * motorCount * throttle01 * dt;
  const per = totalBurn / tanks.length;
  tanks.forEach((t) => {
    t.currentFuelKg = Math.max(0, t.currentFuelKg - per);
  });
  recomputeEntityMass(entity, plan);
}
