# Cómo agregar un edificio (interactivo en el mapa)

Los edificios que el jugador **clickea** deben:

1. Existir como malla(es) en la escena.
2. Registrar al menos una malla “representativa” en **`clickables`** con `userData` coherente.

## Opción A: caja simple (patrón actual)

En **`js/scene/buildings.js`** (o un nuevo módulo cargado desde `main.js` después de `createBuildings`):

1. Crea la geometría con el helper local **`box(...)`** o con `THREE.Mesh` a mano y `scene.add(mesh)`.
2. Para abrir UI al clicar:

```js
import { registerClickable } from './interaction.js';

registerClickable(mesh, 'miEdificio', ':: Mi Edificio Cool');
```

- **`type`**: string que interpretará el raycast (debe ser único para tu lógica).
- **`label`**: texto del tooltip al pasar el mouse (puede ser corto).

## Opción B: múltiples cajas, un solo clic

Varias mallas pueden compartir el mismo `userData` si cada una llama a `registerClickable` con el mismo `type` y `label`, o si agrupas en un `Group` y registras solo las hijas que deben ser objetivo del raycast (hoy el código intersecta el array plano `clickables`).

## Conectar el clic a un panel

En **`js/input/raycast.js`**, dentro de **`doClick`**, añade una rama:

```js
if (type === 'miEdificio') openPanel('mi-panel');
```

Asegúrate de que exista en **`spaceco.html`** un elemento `<div class="panel" id="mi-panel">...</div>`.

## Conectar el panel a la lógica

1. Crea **`js/ui/miPanel.js`** con funciones `drawMiPanel()` / acciones que necesites.
2. En **`js/ui/panels.js`**, importa tu módulo y en **`openPanel`** añade:

```js
if (id === 'mi-panel') drawMiPanel();
```

3. Si agregas acciones en shell HTML, usa `data-action` y registra el handler en `initPanelBindings()` de `js/ui/panels.js`.

Ver también [agregar-panel.md](./agregar-panel.md).

## Edificios solo decorativos

No llames a `registerClickable`. Puedes añadir geometría en `buildings.js` o en `environment.js` según quieras que sea “arquitectura del nivel” o “naturaleza / props”.
