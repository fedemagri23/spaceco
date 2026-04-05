/**
 * Definiciones de piezas de cohete y precios de tienda.
 *
 * Cada pieza es una clave (id) que usa el inventario (`gameState.inv`), el ensamblaje y
 * el render 3D. Ver docs/agregar-pieza.md para extender.
 */

/** Catálogo de piezas: cada clave es el id usado en inventario y ensamblaje. */
export const PARTS = {
  engine: {
    name: 'Motor Merlin',
    color: 0x778899,
    h: 4,
    r: 2.0,
    shape: 'cone',
    props: {
      aceleración: '3.8 g',
      confianza: '98.5%',
      consumo: '1.2 L/s',
      empuje: '845 kN',
      peso: '411 kg',
    },
  },
  booster: {
    name: 'Booster SRB',
    color: 0x445566,
    h: 7,
    r: 2.3,
    shape: 'cylinder',
    props: {
      aceleración: '5.2 g',
      empuje: '1200 kN',
      confianza: '97.2%',
      duración: '165 s',
      peso: '920 kg',
    },
  },
  fuelTank: {
    name: 'Tanque Comb.',
    color: 0xccccdd,
    h: 9,
    r: 2.1,
    shape: 'cylinder',
    props: {
      volumen: '834 L',
      capacidad: '970 kg (RP-1)',
      confianza: '99.1%',
      presión: '28 bar',
      peso: '1450 kg',
    },
  },
  payloadBay: {
    name: 'Bahía Carga',
    color: 0xbb8833,
    h: 5,
    r: 2.1,
    shape: 'cylinder',
    props: {
      'capacidad útil': '2.8 tons',
      confianza: '99.4%',
      protección: 'térmica/sísmica',
      volumen: '18 m³',
      peso: '680 kg',
    },
  },
  capsule: {
    name: 'Cápsula',
    color: 0xff6600,
    h: 5,
    r: 2.0,
    shape: 'cone',
    props: {
      'resistencia térmica': '2500 K',
      confianza: '99.7%',
      capacidad: '3 tripulantes',
      peso: '4.2 tons',
    },
  },
};

/** Precio en dinero del juego por id de pieza (debe existir en PARTS). */
export const PART_PRICES = {
  engine: 50000,
  booster: 75000,
  fuelTank: 45000,
  payloadBay: 60000,
  capsule: 120000,
};
