import test from 'node:test';
import assert from 'node:assert/strict';
import { buildPhasePlanFromSpec, getActiveBottomPhase } from '../js/game/rocketPhases.js';

test('buildPhasePlanFromSpec detecta fases por bloques de motores', () => {
  const spec = [
    { kind: 'motors', engineId: 'engine', count: 2 },
    { kind: 'body', id: 'fuelTank' },
    { kind: 'motors', engineId: 'raptorEngine', count: 1 },
    { kind: 'body', id: 'capsule' },
  ];
  const plan = buildPhasePlanFromSpec(spec);
  assert.equal(plan.phases.length, 2);
  assert.equal(plan.phases[0].phase, 1);
  assert.equal(plan.phases[1].phase, 2);
});

test('getActiveBottomPhase devuelve menor fase no separada', () => {
  const separated = new Set([1, 3]);
  assert.equal(getActiveBottomPhase(separated, 4), 2);
  separated.add(2);
  separated.add(4);
  assert.equal(getActiveBottomPhase(separated, 4), null);
});
