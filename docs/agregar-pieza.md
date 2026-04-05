# Cómo agregar una pieza de cohete

Una pieza es un **id de string** compartido por: inventario, ensamblaje, malla 3D y tienda.

## 1. Definir la pieza (`js/config/parts.js`)

En el objeto **`PARTS`**, añade una entrada nueva:

```js
miPieza: {
  name: 'Nombre visible',
  color: 0xRRGGBB,   // color Three.js
  h: 5,               // altura del segmento apilado
  r: 2.0,             // radio
  shape: 'cone',      // o 'cylinder'
  props: {            // aparece en tooltips / fichas
    peso: '100 kg',
    // ...
  },
},
```

- **`shape`**: `buildRocketMesh` en `js/scene/rocketMesh.js` usa `cone` o `cylinder`. Si necesitas otra forma, extiende esa función con un nuevo caso.

## 2. Precio en tienda

En **`PART_PRICES`**, misma clave:

```js
miPieza: 80000,
```

La tienda recorre `PARTS` y lee el precio de `PART_PRICES`; si falta, muestra `0`.

## 3. Inventario inicial (opcional)

En **`js/game/state.js`**, función **`initialInventory()`**, añade stock inicial si no basta con el default `0` para claves nuevas:

```js
Object.assign(inv, { ..., miPieza: 2 });
```

## 4. Comprobar UI

- **Galpón**: la grilla se genera recorriendo `PARTS`; la nueva pieza aparece sola.
- **Tienda**: igual; el botón Comprar usa `buyPart` del módulo store.
- **Preview / plataforma**: usan `buildRocketMesh`, sin cambios extra.

## 5. Tipos (opcional)

Si usas chequeo de tipos/JSDoc, actualiza **`js/types.js`** (`PartShape`, etc.) para documentar nuevas formas o campos.
