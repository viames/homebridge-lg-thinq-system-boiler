import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { setImmediate as nextTurn } from 'node:timers/promises';
import test from 'node:test';
import * as hap from '@homebridge/hap-nodejs';

import { LGThinQSystemBoilerPlatform } from '../dist/platform.js';
import { ThinQApi } from '../dist/thinq.js';

/** Verify that an unconfigured platform cannot make a cloud request. */
test('unconfigured platform does not discover or poll devices', async (t) => {
  const api = new EventEmitter();
  let warned = false;
  // The transport mock fails the test if startup ever reaches the cloud.
  t.mock.method(ThinQApi.prototype, 'asyncGetDeviceList', () => assert.fail('Unexpected cloud request'));
  new LGThinQSystemBoilerPlatform({ warn() { warned = true; } }, {}, api);
  api.emit('didFinishLaunching');
  await nextTurn();
  assert.equal(warned, true);
});

/** Exercise discovery and polling with real HomeKit services and synthetic cloud replies. */
test('background status failures are caught, recover, and stop polling on shutdown', async (t) => {
  const api = new EventEmitter();
  const warnings = [];
  let poll;
  let stopped = false;
  let offline = true;
  let reads = 0;
  // Replace only timers and cloud transport; no account or physical device is contacted.
  t.mock.method(globalThis, 'setInterval', (callback) => {
    poll = callback;
    return { unref() { /* The synthetic timer never keeps a process alive. */ } };
  });
  t.mock.method(globalThis, 'clearInterval', () => { stopped = true; });
  t.mock.method(ThinQApi.prototype, 'asyncGetDeviceList', async () => ({
    status: 200,
    body: [{ deviceId: 'SYNTHETIC-ONLY', deviceInfo: { deviceType: 'DEVICE_SYSTEM_BOILER', alias: 'Test boiler' } }],
  }));
  t.mock.method(ThinQApi.prototype, 'asyncGetDeviceProfile', async () => ({ status: 200, body: {} }));
  t.mock.method(ThinQApi.prototype, 'asyncGetDeviceStatus', async () => {
    reads += 1;
    return offline ? { status: 503, body: null } : { status: 200, body: {} };
  });
  // Homebridge owns cached accessories; the fixture supplies its public service API only.
  api.hap = hap;
  api.platformAccessory = class extends hap.Accessory { context = {}; };
  api.registerPlatformAccessories = () => { /* Registration has no external effect in this fixture. */ };
  api.unregisterPlatformAccessories = () => { /* No cached accessories exist in this fixture. */ };
  const log = {
    info() { /* Successful discovery logs are irrelevant to this failure-path check. */ },
    debug() { /* Cached-accessory debug logs are irrelevant to this fixture. */ },
    error(message) { assert.fail(message); },
    warn(...message) { warnings.push(message); },
  };
  new LGThinQSystemBoilerPlatform(log, { accessToken: 'synthetic-test-only' }, api);
  api.emit('didFinishLaunching');
  await nextTurn();
  assert.equal(reads, 1);
  assert.equal(warnings.length, 1);
  poll();
  await nextTurn();
  assert.equal(warnings.length, 2);
  offline = false;
  poll();
  await nextTurn();
  assert.equal(reads, 3);
  assert.equal(warnings.length, 2);
  api.emit('shutdown');
  assert.equal(stopped, true);
});
