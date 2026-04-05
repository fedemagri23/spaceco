# Documentación SpaceCo (desarrollo)

Guías breves para extender el juego sin perderse en el código.

| Guía | Para qué sirve |
|------|----------------|
| [arquitectura.md](./arquitectura.md) | Carpetas, orden de arranque, flujo de datos |
| [agregar-pieza.md](./agregar-pieza.md) | Nuevo componente de cohete (modelo + tienda + inventario) |
| [agregar-edificio.md](./agregar-edificio.md) | Nuevo edificio clickeable en el mapa 3D |
| [agregar-panel.md](./agregar-panel.md) | Nuevo panel modal HTML + lógica JS |

**Importante:** el juego usa `import` de ES modules y Three.js vía CDN. Abre `spaceco.html` con un servidor HTTP local (por ejemplo `npx serve` o la extensión Live Server), no con `file://`, para evitar bloqueos CORS de los módulos.
