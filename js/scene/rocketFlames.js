/**
 * Estela de motor: cilindro rojo bajo cada motor; altura ∝ acelerador (0–100 %).
 */

/**
 * @param {THREE.Group} phaseGroup
 * @param {number} throttle01
 * @param {boolean} active
 * @param {number} timeSec
 */
export function updatePhaseFlames(phaseGroup, throttle01, active, timeSec) {
  const flames = phaseGroup.userData.flameMeshes;
  if (!flames) return;
  const t = Math.max(0, Math.min(1, throttle01));
  const flicker = 1 + Math.sin(timeSec * 18) * 0.025;
  /** Altura visual = porcentaje de motor × largo base (100 % = escala 1 en Y). */
  const lenScale = t * flicker;
  const radScale = 0.9 + 0.1 * t;

  flames.forEach((mesh) => {
    mesh.visible = active && t > 0.001;
    if (!mesh.visible) return;

    const baseH = mesh.userData.baseLength ?? 1;
    const anchorY = mesh.userData.trailAnchorY;
    if (anchorY != null && baseH > 0) {
      mesh.position.y = anchorY - (baseH / 2) * lenScale;
    }
    mesh.scale.set(radScale, lenScale, radScale);
  });
}
