# DSL de secuencia de lanzamiento

Formato general por línea:

- `AT T+<segundos>s: <acción>`
- `AT ALTITUDE <metros>m: <acción>`

Líneas vacías y comentarios (`# ...`) se ignoran.

## Acciones soportadas

- `THROTTLE <fase> <porcentaje>%`
  - porcentaje en `[0, 100]`
- `SEPARATE <fase>`
- `SPIN <grados>`
- `ENGSPIN <fase> <grados>d`

## Ejemplos

```txt
AT T+0s: THROTTLE 1 100%
AT ALTITUDE 1000m: SEPARATE 1
AT ALTITUDE 1000m: THROTTLE 2 100%
AT ALTITUDE 2000m: ENGSPIN 2 -20d
```

## Validación

`js/game/launchSequenceMaps.js` parsea y valida.  
Los errores se muestran en el estado de guardado del panel Torre de Control.
