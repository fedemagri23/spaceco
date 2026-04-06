import test from 'node:test';
import assert from 'node:assert/strict';
import { parseLaunchSequenceScript, validateSequenceActionLine } from '../js/game/launchSequenceMaps.js';

test('parseLaunchSequenceScript parsea acciones por tiempo y altitud', () => {
  const script = [
    'AT T+0s: THROTTLE 1 100%',
    'AT ALTITUDE 1000m: SEPARATE 1',
    'AT ALTITUDE 1000m: ENGSPIN 2 -20d',
  ].join('\n');
  const parsed = parseLaunchSequenceScript(script);
  assert.equal(parsed.errors.length, 0);
  assert.deepEqual(parsed.timeMap.get(0), ['THROTTLE 1 100%']);
  assert.deepEqual(parsed.altitudeMap.get(1000), ['SEPARATE 1', 'ENGSPIN 2 -20d']);
});

test('validateSequenceActionLine rechaza throttle fuera de rango', () => {
  const err = validateSequenceActionLine('THROTTLE 1 120%', 7);
  assert.ok(err);
  assert.match(err, /THROTTLE exige porcentaje/);
});

test('validateSequenceActionLine valida formato ENGSPIN', () => {
  assert.equal(validateSequenceActionLine('ENGSPIN 1 40d', 2), null);
  assert.match(String(validateSequenceActionLine('ENGSPIN 0 40d', 3)), /fase >= 1/);
});
