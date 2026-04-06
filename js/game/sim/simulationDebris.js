/**
 * Gestión de etapas separadas (debris): alta y actualización por frame.
 */

/** @type {{ group: THREE.Group, velocity: { x: number, y: number, z: number } }[]} */
let debrisList = [];

export function clearDebris() {
  debrisList = [];
}

/**
 * @param {THREE.Group} group
 * @param {{ x: number, y: number, z: number }} sourceVelocity
 */
export function pushSeparatedDebris(group, sourceVelocity) {
  // Impulso inicial descendente para evitar que la etapa descartada "caiga hacia arriba".
  const sepVy = Math.min(sourceVelocity.y * 0.2 - 12, -4);
  debrisList.push({
    group,
    velocity: {
      x: sourceVelocity.x + (Math.random() - 0.5) * 0.35,
      y: sepVy + (Math.random() - 0.5) * 0.6,
      z: sourceVelocity.z + (Math.random() - 0.5) * 0.35,
    },
  });
}

/**
 * @param {number} dt
 * @param {number} gravity
 */
export function updateDebris(dt, gravity) {
  debrisList.forEach((d) => {
    d.velocity.y -= gravity * dt;
    d.group.position.x += d.velocity.x * dt;
    d.group.position.y += d.velocity.y * dt;
    d.group.position.z += d.velocity.z * dt;
    d.group.rotation.x += dt * 0.7;
    d.group.rotation.z += dt * 0.4;
  });
}
