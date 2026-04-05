# Arquitectura del proyecto

## Vista rápida

```
html-6/
├── spaceco.html          # Shell: markup de HUD/paneles + <script type="module" src="js/main.js">
├── css/main.css          # Estilos globales
├── js/
│   ├── main.js           # Bootstrap: init en orden, game loop
│   ├── types.js          # JSDoc (sin runtime)
│   ├── config/parts.js   # Definición de piezas y precios
│   ├── game/state.js     # Estado mutable (dinero, inventario, cohetes)
│   ├── scene/            # Three.js mundo 3D
│   ├── ui/               # Paneles DOM, HUD, renderer 3D en canvas 2D
│   └── input/            # Cámara orbital + raycast
└── docs/                 # Estas guías
```

## Orden de arranque (`main.js`)

1. **`scene/setup.js`** — `initScene`: crea `scene`, `camera`, `renderer`, luces, niebla; monta el canvas en `#app`.
2. **`bindResize`** — escucha `resize` de ventana.
3. **`ui/ui3d.js`** — prepara el mini-renderer para iconos 3D en la UI.
4. **`scene/environment.js`** — océano, terreno, grid, árboles, tanques (no interactivos).
5. **`scene/buildings.js`** — edificios; los que abren UI usan `registerClickable` de `scene/interaction.js`.
6. **`ui/panels.js`** — `attachGlobalHandlers()` asigna `window.closeAll`, `deployRocket`, `buyPart`, `saveRocket` para los `onclick` del HTML.
7. **`ui/hud.js`** — sincroniza dinero en pantalla.
8. **`input/camera.js`** — arrastra para orbitar/pan, rueda para zoom; en movimiento llama a `doHover`; en clic suave llama a `doClick`.
9. **Game loop** — `renderUICanvases()` + `renderer.render(scene, camera)`.

## Estado del juego

Todo lo que deba persistir en memoria durante la partida vive en **`js/game/state.js`** (`gameState`: dinero, inventario, lista de cohetes, ensamblaje actual, selección, cohete en plataforma).

Al añadir mecánicas nuevas, preferí actualizar `gameState` y luego refrescar UI con funciones dedicadas (como `drawStoreGrid` o `refreshMoneyHud`).

## Interacción 3D

- **`scene/interaction.js`** mantiene el array `clickables`. Solo esas mallas participan en raycast.
- **`input/raycast.js`** usa `userData.type` para decidir qué panel abrir y `userData.label` para el tooltip de hover.

## Dependencias circulares

Los paneles que necesitan cerrar la UI importan **`ui/closePanels.js`** (`closeAllPanels`), no `panels.js`, para evitar ciclos con `raycast` → `panels` → …

## Three.js

Los módulos importan:

`https://unpkg.com/three@0.128.0/build/three.module.js`

Equivale al r128 que usabas por CDN en el monolito; si actualizas versión, hazlo en **todos** los archivos que importan Three.
