# SpaceCo — Orbital Ops

Simulador 3D de ensamblaje y lanzamiento de cohetes en navegador (ES modules + Three.js CDN).

## Quickstart

1. Instala dependencias de desarrollo:
   - `npm install`
2. Levanta un servidor HTTP local (no `file://`):
   - `npx serve .`
3. Abre `spaceco.html` desde esa URL.

## Calidad de código

- `npm run lint` — chequeos estáticos JS.
- `npm run lint:fix` — autofix de reglas compatibles.
- `npm test` — smoke tests de módulos críticos de dominio.

## Documentación

La guía principal está en [`docs/README.md`](docs/README.md), incluyendo arquitectura, flujo runtime y mapa de archivos para cambios manuales.
