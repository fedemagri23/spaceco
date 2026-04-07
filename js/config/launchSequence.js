/**
 * Secuencia de lanzamiento en pseudocódigo (Torre de control).
 * Formato orientativo: AT … : INSTRUCCIÓN …
 */

export const DEFAULT_LAUNCH_SEQUENCE_SCRIPT = `AT T+0s: THROTTLE 1 100%
AT ALTITUDE 1000m: SEPARATE 1
AT ALTITUDE 1000m: THROTTLE 2 100%
AT ALTITUDE 2000m: YAW -20
AT ALTITUDE 2000m: PITCH 36.7
`;
