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
import { attachGlobalHandlers } from './ui/panels.js';
import { refreshMoneyHud } from './ui/hud.js';
import { initCameraControls } from './input/camera.js';
import { doHover, doClick } from './input/raycast.js';

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

  attachGlobalHandlers();
  refreshMoneyHud();

  initCameraControls(
    (x, y) => doHover(x, y),
    (x, y) => doClick(x, y),
  );

  function loop() {
    requestAnimationFrame(loop);
    renderUICanvases();
    renderer.render(scene, camera);
  }
  loop();
}

bootstrap();
