# Cómo agregar un panel modal

Los paneles reutilizan el overlay **`#overlay`** y la clase **`.panel`** definida en `css/main.css`.

## 1. Markup en `spaceco.html`

Copia un bloque existente (`launch-panel`, `warehouse-panel`, …) y cambia **ids** y textos:

```html
<div class="panel" id="mi-panel">
  <div class="panel-hdr">
    <span class="panel-title">/// Título</span>
    <button type="button" class="x-btn" data-action="close-all">X</button>
  </div>
  <div class="panel-body">
    <!-- contenido -->
  </div>
</div>
```

- El cierre global usa `data-action="close-all"` y bindings en `initPanelBindings()`.

## 2. Abrir el panel desde código

- Desde raycast: `openPanel('mi-panel')` (ver [agregar-edificio.md](./agregar-edificio.md)).
- Desde otro módulo: `import { openPanel } from './panels.js'` (ojo con dependencias circulares; si hace falta, importación dinámica o mover la llamada a `main.js`).

## 3. Orquestación en `js/ui/panels.js`

Importa tu módulo de UI y en **`openPanel`**:

```js
if (id === 'mi-panel') drawMiPanel();
```

Así cada vez que se muestra el panel, refrescas listas, botones, etc.

## 4. Lógica en un módulo dedicado

Crea **`js/ui/miPanel.js`**:

- Exporta **`drawMiPanel()`** para poblar el DOM.
- Si necesitas cerrar al terminar una acción, importa **`closeAllPanels`** desde **`closePanels.js`** (no desde `panels.js` si eso crea un ciclo).

## 5. Acciones UI (sin globals)

Si necesitas un botón global del shell, usa `data-action="mi-accion"` en HTML y registra el handler en `initPanelBindings()` de `panels.js`.

## 6. Estilos

- Reutiliza **`.lbl`**, **`.btn`**, **`.empty`**, grids existentes.
- Si necesitas clases nuevas, añádelas en **`css/main.css`** con un comentario de sección para mantener el archivo ordenado.
