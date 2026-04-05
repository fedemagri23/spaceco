/**
 * Modelos 3D de carga útil (satélites, etc.) para escena y miniaturas UI.
 */

import * as THREE from 'https://unpkg.com/three@0.128.0/build/three.module.js';

const VISUAL_SCALE = 1.35;

const mat = (hex) => new THREE.MeshLambertMaterial({ color: hex, flatShading: true });

/**
 * Satélite meteorológico: bus central, paneles solares, plato de enlace y antena.
 * @returns {THREE.Group}
 */
function meshWeatherControlSatellite() {
  const g = new THREE.Group();

  const body = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.95, 1.25), mat(0x6a7a8c));
  body.position.y = 0.1;
  g.add(body);

  const panelGeo = new THREE.BoxGeometry(3.8, 0.06, 1.05);
  const panelL = new THREE.Mesh(panelGeo, mat(0x153060));
  panelL.position.set(-2.45, 0.1, 0);
  const panelR = new THREE.Mesh(panelGeo, mat(0x153060));
  panelR.position.set(2.45, 0.1, 0);
  g.add(panelL, panelR);

  const stripeMat = mat(0x2a5088);
  for (let i = 0; i < 5; i++) {
    const x = (i - 2) * 0.75;
    const s = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.08, 1.07), stripeMat);
    s.position.set(-2.45 + x, 0.14, 0);
    g.add(s);
    const s2 = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.08, 1.07), stripeMat);
    s2.position.set(2.45 + x, 0.14, 0);
    g.add(s2);
  }

  const dish = new THREE.Mesh(
    new THREE.SphereGeometry(0.42, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2.1),
    new THREE.MeshLambertMaterial({ color: 0xd0d8e8, flatShading: true, side: THREE.DoubleSide }),
  );
  dish.rotation.x = Math.PI;
  dish.position.set(0, 0.55, 0.72);
  g.add(dish);

  const feed = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 6), mat(0xff4422));
  feed.position.set(0, 0.52, 0.95);
  g.add(feed);

  const boom = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.07, 1.1, 8), mat(0x555566));
  boom.position.set(-0.55, 0.85, -0.35);
  boom.rotation.z = 0.25;
  g.add(boom);

  const tip = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 6), mat(0xff3333));
  tip.position.set(-0.62, 1.38, -0.42);
  g.add(tip);

  g.traverse((o) => {
    if (o instanceof THREE.Mesh) o.castShadow = true;
  });

  return g;
}

/**
 * @param {string} payloadId - clave de `PAYLOAD_ITEMS`
 * @returns {THREE.Group}
 */
export function buildPayloadMesh(payloadId) {
  const g = new THREE.Group();
  if (payloadId === 'weatherControlSatellite') {
    g.add(meshWeatherControlSatellite());
  } else {
    const ph = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), mat(0x886644));
    g.add(ph);
  }
  g.scale.setScalar(VISUAL_SCALE);
  return g;
}
