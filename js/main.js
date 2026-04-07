/**
 * Punto de entrada del juego SpaceCo.
 *
 * Orden de arranque:
 * 1. Escena Three.js principal (`initScene`)
 * 2. Entorno y edificios 3D
 * 3. Handlers globales HTML (`onclick`) y HUD
 * 4. Controles de cámara + raycast (hover/clic)
 * 5. Bucle `requestAnimationFrame` (mundo + miniaturas UI 3D)
 */

import { initScene, bindResize, scene, camera, renderer } from './scene/setup.js';
import { createEnvironment } from './scene/environment.js';
import { createBuildings } from './scene/buildings.js';
import { initUI3D, renderUICanvases } from './ui/ui3d.js';
import { initPanelBindings } from './ui/panels.js';
import { refreshMoneyHud, refreshWindHud } from './ui/hud.js';
import { initCameraControls, updateFollowCameraFromRocket } from './input/camera.js';
import { updateFollowAtmosphereFromRocket } from './scene/followAtmosphere.js';
import { updateFollowHud } from './ui/followHud.js';
import { doHover, doClick } from './input/raycast.js';
import { updateFlightSimulation, abortFlightSimulation } from './game/flightSimulation.js';
import { gameClock } from './game/GameClock.js';
import { missionManager } from './game/missions/MissionManager.js';
import { initMissionCenter } from './ui/missionCenter.js';
import { initMissionNotifications } from './ui/missionNotifications.js';
import { openPanel } from './ui/panels.js';
import { gameState } from './game/state.js';

function bootstrap() {
  const app = document.getElementById('app');
  if (!app) {
    console.error('SpaceCo: falta #app en el DOM');
    return;
  }

  initScene(app);
  bindResize();
  initUI3D();
  createEnvironment();
  createBuildings();

  initPanelBindings();
  refreshMoneyHud();
  initMissionCenter();
  initMissionNotifications();

  // Speed controls
  document.querySelectorAll('.speed-btn').forEach(btn => {
    btn.onclick = () => {
      const speed = parseInt(btn.dataset.speed);
      gameClock.setTimeScale(speed);
      gameState.simSpeed = speed; // Sync with flightSim
      document.getElementById('sim-speed-el').textContent = `x${speed}`;
    };
  });

  // Abort control
  const abortBtn = document.getElementById('abort-btn');
  if (abortBtn) {
    abortBtn.onclick = () => {
      import('./game/flightSimulation.js').then(({ abortFlightSimulation }) => {
        abortFlightSimulation();
      });
    };
  }

  initCameraControls(
    (x, y) => doHover(x, y),
    (x, y) => doClick(x, y),
  );

  function loop() {
    requestAnimationFrame(loop);
    const now = performance.now();
    
    // Global Clock & Missions
    gameClock.update();
    missionManager.update(gameClock.totalSeconds);
    
    // Update HUD items
    document.getElementById('clock-el').textContent = gameClock.getDisplayString();
    refreshMoneyHud();
    refreshWindHud();
    
    // Flight sim handles its own DT internally via performance.now()
    updateFlightSimulation(now);
    
    // Show/hide sim controls
    const sc = document.getElementById('sim-controls');
    const se = document.getElementById('sim-speed-el');
    if (gameState.flightSimRunning) {
      if (sc) sc.style.display = 'flex';
      if (se) se.style.display = 'inline-block';
    } else {
      if (sc) sc.style.display = 'none';
      if (se) se.style.display = 'none';
      gameClock.setTimeScale(1); // Reset speed when not flying
      gameState.simSpeed = 1;
    }

    updateFollowCameraFromRocket();
    updateFollowAtmosphereFromRocket();
    updateFollowHud();
    renderUICanvases();
    renderer.render(scene, camera);
  }
  loop();
}

bootstrap();
