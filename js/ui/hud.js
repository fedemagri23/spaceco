/**
 * Actualización del HUD (dinero en pantalla). Centraliza el formateo para no duplicar lógica.
 */

import { gameState } from '../game/state.js';

/**
 * Sincroniza el elemento `#money-el` con `gameState.money`.
 */
export function refreshMoneyHud() {
  const el = document.getElementById('money-el');
  if (el) el.textContent = `$ ${gameState.money.toLocaleString('es-AR')}`;
}

/**
 * Sincroniza el elemento `#mission-el` con la misión actual.
 */
export function refreshMissionHud() {
  const el = document.getElementById('mission-el');
  if (el && gameState.activeMission) {
    el.textContent = `Misión: ${gameState.activeMission.title}`;
  }
}

/**
 * Updates wind info in HUD if the weather satellite is active.
 */
export function refreshWindHud() {
  if (gameState.weatherDataUnlocked && gameState.currentWind) {
    const { intensity, direction } = gameState.currentWind;
    let windEl = document.getElementById('wind-el');
    if (!windEl) {
      windEl = document.createElement('div');
      windEl.id = 'wind-el';
      windEl.className = 'hud-pill';
      windEl.style.background = 'rgba(0,100,200,0.6)';
      document.getElementById('hud').appendChild(windEl);
    }
    windEl.textContent = `🌬️ ${intensity.toFixed(1)}m/s @ ${Math.round(direction)}°`;
  }
}
