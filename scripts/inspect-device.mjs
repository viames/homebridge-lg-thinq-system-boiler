import { mkdir, writeFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import process from 'node:process';

import { ThinQApi } from 'thinqconnect';

import {
  getDeviceMetadata,
  normalizeDeviceList,
  sanitizeValue,
} from './lib/sanitize.mjs';

const accessToken = process.env.THINQ_PAT;
const country = (process.env.THINQ_COUNTRY ?? 'IT').toUpperCase();
const outputPath = process.env.THINQ_DIAGNOSTIC_OUTPUT
  ?? 'diagnostics/thinq-system-boiler-profile.json';

if (!accessToken) {
  throw new Error('THINQ_PAT is missing. Use npm run inspect-device so the token is requested without echo.');
}

function requireSuccess(response, operation) {
  if (response.status !== 200 || response.body === null) {
    throw new Error(`${operation} failed: ${response.errorCode ?? response.status} ${response.errorMessage ?? ''}`.trim());
  }

  return response.body;
}

const api = new ThinQApi(accessToken, country, randomUUID());
const deviceListBody = requireSuccess(await api.asyncGetDeviceList(), 'Device discovery');
const devices = normalizeDeviceList(deviceListBody)
  .map(getDeviceMetadata)
  .filter(({ deviceType }) => deviceType === 'DEVICE_SYSTEM_BOILER');

if (devices.length === 0) {
  throw new Error('No DEVICE_SYSTEM_BOILER was returned by the LG ThinQ account.');
}

const diagnostics = [];
for (const [index, device] of devices.entries()) {
  if (!device.deviceId) {
    throw new Error(`System boiler ${index + 1} has no usable device identifier.`);
  }

  const profile = requireSuccess(
    await api.asyncGetDeviceProfile(device.deviceId),
    `Profile request for system boiler ${index + 1}`,
  );
  const state = requireSuccess(
    await api.asyncGetDeviceStatus(device.deviceId),
    `State request for system boiler ${index + 1}`,
  );

  diagnostics.push({
    label: `System Boiler ${index + 1}`,
    deviceType: device.deviceType,
    modelName: device.modelName,
    reportable: device.reportable,
    profile: sanitizeValue(profile),
    state: sanitizeValue(state),
  });
}

await mkdir('diagnostics', { recursive: true });
await writeFile(
  outputPath,
  `${JSON.stringify({ schemaVersion: 1, country, devices: diagnostics }, null, 2)}\n`,
  { mode: 0o600 },
);

process.stdout.write(`Wrote anonymized diagnostics for ${diagnostics.length} system boiler(s) to ${outputPath}.\n`);
process.stdout.write('The Personal Access Token and device identifiers were not written to the file.\n');
