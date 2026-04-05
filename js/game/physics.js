/**
 * Física de vuelo: gravedad, empuje, roce aerodinámico e integración.
 */

/** Densidad del aire a nivel del suelo (kg/m³) — modelo simplificado. */
export const AIR_DENSITY_SEA_LEVEL = 1.225;

/** Escala de altura para decay exponencial de densidad (m). */
const AIR_SCALE_HEIGHT = 8500;

/**
 * Densidad del aire a una altitud sobre la plataforma (m).
 * @param {number} altitudeM
 * @returns {number}
 */
export function airDensityAtAltitude(altitudeM) {
  return AIR_DENSITY_SEA_LEVEL * Math.exp(-Math.max(0, altitudeM) / AIR_SCALE_HEIGHT);
}

/**
 * Aceleración de arrastre opuesta a la velocidad (m/s²).
 * @param {number} massKg
 * @param {{ x: number, y: number, z: number }} velocity
 * @param {number} rho - densidad (kg/m³)
 * @param {number} dragCoeff - Cd
 * @param {number} refAreaM2 - área de referencia (m²)
 * @returns {{ x: number, y: number, z: number }}
 */
export function dragAcceleration(massKg, velocity, rho, dragCoeff, refAreaM2) {
  if (massKg <= 0) return { x: 0, y: 0, z: 0 };
  const vx = velocity.x;
  const vy = velocity.y;
  const vz = velocity.z;
  const speed = Math.sqrt(vx * vx + vy * vy + vz * vz);
  if (speed < 1e-6) return { x: 0, y: 0, z: 0 };

  const q = 0.5 * rho * speed * speed * dragCoeff * refAreaM2;
  const aMag = q / massKg;
  const inv = 1 / speed;
  return { x: -vx * inv * aMag, y: -vy * inv * aMag, z: -vz * inv * aMag };
}

/**
 * Aceleración por empuje (ángulo desde la horizontal: 0° = plano, 90° = hacia +Y).
 * @param {number} thrustN
 * @param {number} massKg
 * @param {number} angleDeg
 * @returns {{ x: number, y: number, z: number }}
 */
export function thrustAccelerationFromNewtons(thrustN, massKg, angleDeg) {
  if (massKg <= 0) return { x: 0, y: 0, z: 0 };
  const rad = (angleDeg * Math.PI) / 180;
  const a = thrustN / massKg;
  return { x: a * Math.cos(rad), y: a * Math.sin(rad), z: 0 };
}

/**
 * Suma vectores 3D.
 * @param {{x:number,y:number,z:number}} a
 * @param {{x:number,y:number,z:number}} b
 */
export function addVec3(a, b) {
  return { x: a.x + b.x, y: a.y + b.y, z: a.z + b.z };
}

/**
 * Integración explícita de Euler.
 * @param {{x:number,y:number,z:number}} pos
 * @param {{x:number,y:number,z:number}} vel
 * @param {{x:number,y:number,z:number}} acc
 * @param {number} dt
 */
export function integrateEuler(pos, vel, acc, dt) {
  vel.x += acc.x * dt;
  vel.y += acc.y * dt;
  vel.z += acc.z * dt;
  pos.x += vel.x * dt;
  pos.y += vel.y * dt;
  pos.z += vel.z * dt;
}

/**
 * Empuje total aproximado por bloque de motores (N). Placeholder por motor.
 * @param {number} motorCount
 * @param {number} throttle01
 * @returns {number}
 */
export function estimateClusterThrustNewtons(motorCount, throttle01) {
  const perMotor = 800000;
  return perMotor * motorCount * Math.max(0, Math.min(1, throttle01));
}
