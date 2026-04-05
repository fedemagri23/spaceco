/**
 * Cierra overlay y paneles modales sin depender de `panels.js`.
 * Evita dependencias circulares cuando otros módulos (ej. lanzamiento) deben cerrar UI.
 */

/**
 * Quita la clase `.on` de todos los `.panel` y del `#overlay`.
 */
export function closeAllPanels() {
  document.querySelectorAll('.panel').forEach((p) => p.classList.remove('on'));
  const ov = document.getElementById('overlay');
  if (ov) ov.classList.remove('on');
}
