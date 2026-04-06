# Documentación SpaceCo

## Índice principal

| Documento | Para qué sirve |
|---|---|
| [arquitectura.md](./arquitectura.md) | Módulos, dependencias y orden de arranque |
| [getting-started.md](./getting-started.md) | Setup local y comandos de calidad |
| [runtime-flow.md](./runtime-flow.md) | Flujo por frame y pipeline de juego |
| [state-model.md](./state-model.md) | Contrato de `gameState` y estado físico |
| [simulation.md](./simulation.md) | Física, fases, eventos y actitud |
| [launch-sequence-dsl.md](./launch-sequence-dsl.md) | Sintaxis del editor de Torre de Control |
| [ui-panels.md](./ui-panels.md) | Contratos UI y binding por `data-action` |
| [debug-runbook.md](./debug-runbook.md) | Diagnóstico rápido de problemas comunes |
| [file-map.md](./file-map.md) | Mapa detallado archivo por archivo |
| [agregar-pieza.md](./agregar-pieza.md) | Cómo extender catálogo de piezas |
| [agregar-edificio.md](./agregar-edificio.md) | Cómo añadir edificios interactivos |
| [agregar-panel.md](./agregar-panel.md) | Cómo crear paneles modales nuevos |

## Convención de trabajo

- Mantener compatibilidad de comandos de secuencia (`THROTTLE`, `SEPARATE`, `SPIN`, `ENGSPIN`).
- Evitar `onclick` inline y APIs globales en `window`.
- Encapsular lógica nueva en módulos por dominio (`game/sim`, `ui`, `scene`, `config`).
