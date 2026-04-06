# Getting Started

## Requisitos

- Node.js 20+ recomendado.
- Navegador moderno con soporte ES modules.

## Ejecutar local

1. `npm install`
2. Servidor local:
   - `npx serve .`
3. Abrir `spaceco.html` por HTTP.

## Verificación de calidad

- `npm run lint`
- `npm test`

## Errores comunes

- Si abres con `file://`, fallan imports por CORS.
- Si no carga Three.js, revisa conectividad a `unpkg`.
