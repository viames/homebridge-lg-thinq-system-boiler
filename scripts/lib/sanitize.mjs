const PRIVATE_KEY_PATTERN = /(?:access.?token|auth|client.?id|device.?id|email|account|user|serial|uuid|mac|ssid|ip.?address|address|location.?id)/i;

export function sanitizeValue(value) {
  if (Array.isArray(value)) {
    return value.map(sanitizeValue);
  }

  if (value === null || typeof value !== 'object') {
    return value;
  }

  return Object.fromEntries(
    Object.entries(value)
      .filter(([key]) => !PRIVATE_KEY_PATTERN.test(key))
      .map(([key, nestedValue]) => [key, sanitizeValue(nestedValue)]),
  );
}

export function normalizeDeviceList(body) {
  if (Array.isArray(body)) {
    return body;
  }

  if (!body || typeof body !== 'object') {
    return [];
  }

  for (const key of ['devices', 'deviceList', 'result']) {
    if (Array.isArray(body[key])) {
      return body[key];
    }
  }

  return [];
}

export function getDeviceMetadata(device) {
  const info = device?.deviceInfo ?? device ?? {};
  return {
    deviceId: device?.deviceId ?? info.deviceId,
    deviceType: info.deviceType ?? device?.deviceType,
    modelName: info.modelName ?? device?.modelName ?? 'Unknown',
    reportable: info.reportable ?? device?.reportable ?? null,
  };
}

