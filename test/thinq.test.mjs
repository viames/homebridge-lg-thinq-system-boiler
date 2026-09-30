import assert from 'node:assert/strict';
import test from 'node:test';

import { SystemBoilerDevice } from '../dist/thinq.js';

function fixture() {
  const calls = [];
  const api = {
    asyncPostDeviceControl: async (deviceId, payload) => {
      calls.push({ deviceId, payload });
      return { status: 200, body: {}, errorCode: null, errorMessage: null };
    },
  };
  return { calls, device: new SystemBoilerDevice(api, 'device-1') };
}

test('builds official ThinQ boiler mode payloads', async () => {
  const { calls, device } = fixture();
  await device.setBoilerOperationMode('POWER_ON');
  await device.setCurrentJobMode('COOL');
  assert.deepEqual(calls, [
    { deviceId: 'device-1', payload: { operation: { boilerOperationMode: 'POWER_ON' } } },
    { deviceId: 'device-1', payload: { boilerJobMode: { currentJobMode: 'COOL' } } },
  ]);
});

test('builds temperature payloads with Celsius unit', async () => {
  const { calls, device } = fixture();
  await device.setRoomWaterHeatTargetTemperatureC(35);
  await device.setHotWaterTargetTemperatureC(48);
  assert.deepEqual(calls, [
    { deviceId: 'device-1', payload: { roomTemperatureInUnits: { waterHeatTargetTemperature: 35, unit: 'C' } } },
    { deviceId: 'device-1', payload: { hotWaterTemperatureInUnits: { targetTemperature: 48, unit: 'C' } } },
  ]);
});
