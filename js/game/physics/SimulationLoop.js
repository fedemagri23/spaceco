/**
 * SimulationLoop handles the update step of the flight simulation.
 * It coordinates the RocketEntity and PhysicsDefinitions.
 */

import {
  calculateGravity,
  calculateAirDensity,
  calculateDragAcceleration,
  calculateThrustAcceleration,
  calculateWindForce,
  calculateClusterThrust,
  integrateEuler
} from './PhysicsDefinitions.js';
import { getActiveBottomPhase } from '../rocketPhases.js';
import { activeStageCanProduceThrust, burnFuelForActiveStage } from '../fuelTanks.js';
import { updateAttitudeStep } from '../sim/simulationAttitude.js';
import { missionManager } from '../missions/MissionManager.js';

export class SimulationLoop {
  constructor(rocketEntity, flightPlan) {
    this.rocket = rocketEntity;
    this.plan = flightPlan;
    this.windIntensity = 0;
    this.windDirectionDeg = 0;
  }

  /**
   * Sets up wind for the current flight.
   */
  setWind(intensity, directionDeg) {
    this.windIntensity = intensity;
    this.windDirectionDeg = directionDeg;
  }

  /**
   * Advances the simulation by dt seconds.
   */
  step(dt) {
    const r = this.rocket;
    if (!r || !this.plan) return;

    r.missionElapsed += dt;

    const altM = r.getAltitude();
    r.gravity = calculateGravity(altM);
    const rho = calculateAirDensity(altM);

    // 1. Identify active phase and check for thrust
    const active = getActiveBottomPhase(r.separatedPhases, r.maxPhase);
    const motorsOperational = active !== null && activeStageCanProduceThrust(r, this.plan, active);

    let thrustN = 0;
    if (motorsOperational) {
      const throttle = r.getThrottle(active);
      if (throttle > 0) {
        burnFuelForActiveStage(r, this.plan, active, throttle, dt);
        
        const ph = this.plan.phases.find(p => p.phase === active);
        if (ph) {
          const seg = this.plan.segments[ph.segmentStart];
          if (seg && seg.kind === 'motors') {
            thrustN = calculateClusterThrust(seg.count, throttle, seg.engineId);
          }
        }
      }
    }

    // 2. Sum Forces / Accelerations
    const acc = { x: 0, y: -r.gravity, z: 0 };

    // Thrust
    const thrustAcc = calculateThrustAcceleration(thrustN, r.mass, r.angleDeg, r.angleZDeg);
    acc.x += thrustAcc.x;
    acc.y += thrustAcc.y;
    acc.z += thrustAcc.z;

    // Drag
    const dragAcc = calculateDragAcceleration(r.mass, r.velocity, rho, r.dragCoeff, r.dragRefAreaM2);
    acc.x += dragAcc.x;
    acc.y += dragAcc.y;
    acc.z += dragAcc.z;

    // Wind
    const windForce = calculateWindForce(altM, this.windIntensity, this.windDirectionDeg);
    // Acceleration = Force / Mass (simplifying wind force as acceleration contribution for now)
    acc.x += windForce.x / r.mass;
    acc.z += windForce.z / r.mass;

    // 3. Integrate
    integrateEuler(r.position, r.velocity, acc, dt);
    r.acceleration = { ...acc };

    // 4. Update Attitude (Spin/Gimbal)
    // Using legacy updateAttitudeStep for now, but integration could be moved to RocketEntity.
    const pendingSpinY = active !== null ? (r.pendingEngineSpinYDegByPhase[active] ?? 0) : 0;
    const pendingSpinZ = active !== null ? (r.pendingEngineSpinZDegByPhase[active] ?? 0) : 0;

    const applied = updateAttitudeStep({
      entity: r,
      pendingSpinYDeg: pendingSpinY,
      pendingSpinZDeg: pendingSpinZ,
      motorsOperational,
      thrustN,
      dt,
      plan: this.plan,
    });

    // Apply rotation changes to entity
    // angleDeg starts at 90 (vertical). Positive ENGSPINZ should tilt toward horizontal (decrease angleDeg).
    // angleZDeg is horizontal heading (yaw). Positive ENGSPINY rotates clockwise.
    r.angleDeg -= applied.z ?? 0;
    r.angleZDeg += applied.y ?? 0;

    // 5. Check Mission Completion
    missionManager.checkMissionCompletionFrame(r);

    // Consume pending spins
    if (active !== null) {
      if (pendingSpinY !== 0) {
        r.pendingEngineSpinYDegByPhase[active] = Math.max(0, Math.abs(pendingSpinY) - Math.abs(applied.y ?? 0)) * Math.sign(pendingSpinY);
      }
      if (pendingSpinZ !== 0) {
        r.pendingEngineSpinZDegByPhase[active] = Math.max(0, Math.abs(pendingSpinZ) - Math.abs(applied.z ?? 0)) * Math.sign(pendingSpinZ);
      }
    }
  }
}
