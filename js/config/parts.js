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
    h: 3,
    r: 2.0,
    shape: 'cone',
    /** Masa, empuje (N) y consumo de propulsante (kg/s por motor a throttle 1). */
    sim: {
      massKg: 411,
      thrustN: 845_000,
      propellantKgPerS: 52,
    },
    props: {
      aceleración: '3.8 g',
      confianza: '98.5%',
      consumo: '52 kg/s',
      empuje: '845 kN',
      peso: '411 kg',
    },
  },
  raptorEngine: {
    name: 'Motor Raptor',
    color: 0x2b2e38,
    h: 2.5,
    r: 1.7,
    shape: 'cone',
    sim: {
      massKg: 320,
      thrustN: 840_000,
      propellantKgPerS: 48,
    },
    ringBelow: {
      color: 0xcc2222,
      majorR: 1.55,
      tube: 0.12,
    },
    props: {
      aceleración: '3.0 g',
      confianza: '98.7%',
      consumo: '48 kg/s',
      empuje: '840 kN',
      peso: '320 kg',
    },
  },
  rs25Engine: {
    name: 'Motor RS-25',
    color: 0x0b0e18,
    h: 4.2,
    r: 2.4,
    shape: 'cone',
    sim: {
      massKg: 3177,
      thrustN: 1_860_000,
      propellantKgPerS: 35,
    },
    props: {
      aceleración: '4.5 g',
      confianza: '99.9%',
      consumo: '35 kg/s',
      empuje: '1860 kN',
      peso: '3177 kg',
    },
  },
  booster: {
    name: 'Booster SRB',
    color: 0x445566,
    h: 7,
    r: 3.3,
    shape: 'cylinder',
    maxParallelMotors: 4,
    sim: { massKg: 920 },
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
    r: 3.1,
    shape: 'cylinder',
    maxParallelMotors: 2,
    sim: {
      dryMassKg: 480,
      propellantMaxKg: 970,
      fullMassKg: 1450,
    },
    props: {
      volumen: '834 L',
      capacidad: '970 kg',
      confianza: '99.1%',
      presión: '28 bar',
      peso: '1450 kg',
    },
  },
  fuelTankXL: {
    name: 'Tanque Comb. XL',
    color: 0xccccdd,
    h: 12,
    r: 3.1,
    shape: 'cylinder',
    maxParallelMotors: 3,
    sim: {
      dryMassKg: 480,
      propellantMaxKg: 1184,
      fullMassKg: 1664,
    },
    props: {
      volumen: '1018 L',
      capacidad: '1184 kg',
      confianza: '98.9%',
      presión: '28 bar',
      peso: '1664 kg',
    },
  },
  payloadBay: {
    name: 'Bahía Carga',
    color: 0xbb8833,
    h: 5,
    r: 3.1,
    shape: 'cylinder',
    maxParallelMotors: 2,
    sim: { massKg: 680 },
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
    h: 6,
    r: 3.0,
    shape: 'cone',
    /** Límite si va sobre un bloque de motores; si va sobre cuerpo, no se usa. */
    maxParallelMotors: 4,
    sim: { massKg: 4200 },
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
  raptorEngine: 67000,
  rs25Engine: 200000,
  booster: 75000,
  fuelTank: 45000,
  fuelTankXL: 65500,
  payloadBay: 60000,
  capsule: 120000,
};
