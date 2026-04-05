/**
 * Tipos JSDoc compartidos (sin runtime). Facilita autocompletado en editores.
 * No hace falta importar este archivo en runtime si no usas chequeo de tipos.
 */

/**
 * @typedef {'cone'|'cylinder'} PartShape
 */

/**
 * @typedef {Object} PartDef
 * @property {string} name
 * @property {number} color - color hex Three.js (0xRRGGBB)
 * @property {number} h - altura del segmento
 * @property {number} r - radio aproximado
 * @property {PartShape} shape
 * @property {Record<string, string>} props - texto mostrado en tooltips / tienda
 */

/**
 * @typedef {Object} SavedRocket
 * @property {string} name
 * @property {string[]} parts - ids en orden de apilado (base → punta)
 */

export {};
