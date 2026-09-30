import assert from 'node:assert/strict';
import test from 'node:test';
import { currentClimateState, targetClimateState } from '../dist/model.js';

const Characteristic = {
  CurrentHeatingCoolingState: { OFF: 0, HEAT: 1, COOL: 2 },
  TargetHeatingCoolingState: { OFF: 0, HEAT: 1, COOL: 2, AUTO: 3 },
};

const base = {
  climate: { powered: true, jobMode: 'HEAT', temperatureSource: 'WATER', currentTemperature: 28, targetTemperature: 35 },
  hotWater: { enabled: true, currentTemperature: 40, targetTemperature: 41 },
};

test('maps powered-off boiler to HomeKit off', () => {
  const state = { ...base, climate: { ...base.climate, powered: false } };
  assert.equal(currentClimateState(state, Characteristic), Characteristic.CurrentHeatingCoolingState.OFF);
  assert.equal(targetClimateState(state, Characteristic), Characteristic.TargetHeatingCoolingState.OFF);
});

test('maps heating and cooling modes', () => {
  assert.equal(currentClimateState(base, Characteristic), Characteristic.CurrentHeatingCoolingState.HEAT);
  assert.equal(targetClimateState(base, Characteristic), Characteristic.TargetHeatingCoolingState.HEAT);
  const cooling = { ...base, climate: { ...base.climate, jobMode: 'COOL' } };
  assert.equal(currentClimateState(cooling, Characteristic), Characteristic.CurrentHeatingCoolingState.COOL);
  assert.equal(targetClimateState(cooling, Characteristic), Characteristic.TargetHeatingCoolingState.COOL);
});

test('maps LG auto mode to HomeKit auto target', () => {
  const state = { ...base, climate: { ...base.climate, jobMode: 'AUTO' } };
  assert.equal(targetClimateState(state, Characteristic), Characteristic.TargetHeatingCoolingState.AUTO);
});
