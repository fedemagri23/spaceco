/**
 * Carga útil para bahía (no son piezas de ensamblaje del cohete).
 * Inventario separado: `gameState.cargoInv`.
 */

/** @type {Record<string, { name: string, kind: string, weightKg: number, props: Record<string, string> }>} */
export const PAYLOAD_ITEMS = {
  weatherControlSatellite: {
    name: 'Satélite de control meteorológico',
    kind: 'satellite',
    weightKg: 420,
    props: {
      peso: '420 kg',
      órbita: 'LEO polar',
      resolución: '2 km',
      potencia: '850 W',
    },
  },
};

/** Capacidad máxima de la bahía de carga (kg), alineada con PARTS.payloadBay. */
export const PAYLOAD_BAY_MAX_KG = 2800;
