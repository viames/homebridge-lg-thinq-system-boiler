import test from 'node:test';
import assert from 'node:assert/strict';

import {
  getDeviceMetadata,
  normalizeDeviceList,
  sanitizeValue,
} from '../scripts/lib/sanitize.mjs';

test('sanitizeValue removes identifiers and credentials recursively', () => {
  const input = {
    deviceId: 'secret-device',
    profile: {
      serialNumber: 'secret-serial',
      temperature: 42,
      nested: [{ clientId: 'secret-client', mode: 'HEAT' }],
    },
  };

  assert.deepEqual(sanitizeValue(input), {
    profile: {
      temperature: 42,
      nested: [{ mode: 'HEAT' }],
    },
  });
});

test('normalizeDeviceList accepts the supported ThinQ response shapes', () => {
  const device = { deviceId: '1' };
  assert.deepEqual(normalizeDeviceList([device]), [device]);
  assert.deepEqual(normalizeDeviceList({ devices: [device] }), [device]);
  assert.deepEqual(normalizeDeviceList({ result: [device] }), [device]);
});

test('getDeviceMetadata reads nested deviceInfo fields', () => {
  assert.deepEqual(getDeviceMetadata({
    deviceId: 'device-1',
    deviceInfo: {
      deviceType: 'DEVICE_SYSTEM_BOILER',
      modelName: 'AWHP_TEST',
      reportable: true,
    },
  }), {
    deviceId: 'device-1',
    deviceType: 'DEVICE_SYSTEM_BOILER',
    modelName: 'AWHP_TEST',
    reportable: true,
  });
});

