import test from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizeRocketSpec,
  appendPartOrError,
  removeSegmentAndAbove,
} from '../js/game/rocketBuild.js';

test('normalizeRocketSpec convierte string[] legacy a segmentos', () => {
  const out = normalizeRocketSpec(['engine', 'engine', 'fuelTank', 'capsule']);
  assert.deepEqual(out, [
    { kind: 'motors', engineId: 'engine', count: 2 },
    { kind: 'body', id: 'fuelTank' },
    { kind: 'body', id: 'capsule' },
  ]);
});

test('appendPartOrError respeta regla de capsula final', () => {
  const build = [{ kind: 'motors', engineId: 'engine', count: 1 }, { kind: 'body', id: 'capsule' }];
  const inv = { engine: 3, fuelTank: 3 };
  const err = appendPartOrError(build, 'fuelTank', inv);
  assert.match(String(err), /cápsula cierra el cohete/i);
});

test('removeSegmentAndAbove devuelve piezas al inventario', () => {
  const build = [
    { kind: 'motors', engineId: 'engine', count: 2 },
    { kind: 'body', id: 'fuelTank' },
    { kind: 'body', id: 'capsule' },
  ];
  const inv = { engine: 0, fuelTank: 0, capsule: 0 };
  removeSegmentAndAbove(build, 1, inv);
  assert.equal(build.length, 1);
  assert.equal(inv.fuelTank, 1);
  assert.equal(inv.capsule, 1);
});
