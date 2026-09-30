import { randomUUID } from 'node:crypto';

const API_KEY = 'ZkVkqP9jq44HuWkbNX9EKzZmmn7ToPY3A4vQ4tY8';
const AIC = new Set(['AG', 'AR', 'AW', 'BB', 'BO', 'BR', 'BS', 'BZ', 'CA', 'CL', 'CO', 'CR', 'CU', 'DM', 'DO', 'EC', 'GD', 'GT', 'GY', 'HN', 'HT', 'JM', 'KN', 'LC', 'MX', 'NI', 'PA', 'PE', 'PR', 'PY', 'SR', 'SV', 'TT', 'US', 'UY', 'VC', 'VE']);
const KIC = new Set(['AU', 'BD', 'CN', 'HK', 'ID', 'IN', 'JP', 'KH', 'KR', 'LA', 'LK', 'MM', 'MY', 'NP', 'NZ', 'PH', 'SG', 'TH', 'TW', 'VN']);

export interface ThinQApiResponse {
  status: number;
  body: unknown | null;
  errorCode: string | null;
  errorMessage: string | null;
}

export class ThinQApi {
  private readonly baseUrl: string;

  constructor(
    private readonly accessToken: string,
    private readonly country: string,
    private readonly clientId: string,
  ) {
    const code = country.toUpperCase();
    const region = AIC.has(code) ? 'aic' : KIC.has(code) ? 'kic' : 'eic';
    this.baseUrl = `https://api-${region}.lgthinq.com`;
  }

  async asyncGetDeviceList(): Promise<ThinQApiResponse> { return this.request('GET', 'devices'); }
  async asyncGetDeviceProfile(deviceId: string): Promise<ThinQApiResponse> {
    return this.request('GET', `devices/${encodeURIComponent(deviceId)}/profile`);
  }
  async asyncGetDeviceStatus(deviceId: string): Promise<ThinQApiResponse> {
    return this.request('GET', `devices/${encodeURIComponent(deviceId)}/state`);
  }
  async asyncPostDeviceControl(deviceId: string, payload: Record<string, unknown>): Promise<ThinQApiResponse> {
    return this.request('POST', `devices/${encodeURIComponent(deviceId)}/control`, payload, true);
  }

  private async request(
    method: 'GET' | 'POST',
    endpoint: string,
    payload?: Record<string, unknown>,
    conditional = false,
  ): Promise<ThinQApiResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/${endpoint}`, {
        method,
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
          'x-api-key': API_KEY,
          'x-client-id': this.clientId,
          'x-country': this.country.toUpperCase(),
          'x-message-id': messageId(),
          'x-service-phase': 'OP',
          ...(conditional ? { 'x-conditional-control': 'true' } : {}),
        },
        body: payload ? JSON.stringify(payload) : undefined,
        signal: AbortSignal.timeout(15000),
      });
      const data = await response.json() as Record<string, unknown>;
      const error = isRecord(data.error) ? data.error : {};
      return {
        status: response.status,
        body: data.response ?? null,
        errorCode: stringOrNull(error.code),
        errorMessage: stringOrNull(error.message),
      };
    } catch (error) {
      return { status: 500, body: null, errorCode: 'NETWORK_ERROR', errorMessage: error instanceof Error ? error.message : String(error) };
    }
  }
}

export class SystemBoilerDevice {
  private state: Record<string, unknown> = {};

  constructor(
    readonly thinqApi: ThinQApi,
    readonly deviceId: string,
    ..._unused: unknown[]
  ) {
    void _unused;
  }

  setStatus(state: Record<string, unknown>): void { this.state = state; }

  getStatus(property: string): unknown {
    const operation = record(this.state.operation);
    const job = record(this.state.boilerJobMode);
    const room = celsiusEntry(this.state.roomTemperatureInUnits);
    const hotWater = celsiusEntry(this.state.hotWaterTemperatureInUnits);
    const values: Record<string, unknown> = {
      boilerOperationMode: operation.boilerOperationMode,
      hotWaterMode: operation.hotWaterMode,
      roomTempMode: operation.roomTempMode,
      currentJobMode: job.currentJobMode,
      roomCurrentTemperatureC: room.currentTemperature,
      roomTargetTemperatureC: room.targetTemperature,
      hotWaterCurrentTemperatureC: hotWater.currentTemperature,
      hotWaterTargetTemperatureC: hotWater.targetTemperature,
    };
    return values[property] ?? null;
  }

  setBoilerOperationMode(mode: string): Promise<ThinQApiResponse> {
    return this.control({ operation: { boilerOperationMode: mode } });
  }
  setCurrentJobMode(mode: string): Promise<ThinQApiResponse> {
    return this.control({ boilerJobMode: { currentJobMode: mode } });
  }
  setHotWaterMode(mode: string): Promise<ThinQApiResponse> {
    return this.control({ operation: { hotWaterMode: mode } });
  }
  setHotWaterTargetTemperatureC(temperature: number): Promise<ThinQApiResponse> {
    return this.control({ hotWaterTemperatureInUnits: { targetTemperature: temperature, unit: 'C' } });
  }
  setRoomAirCoolTargetTemperatureC(temperature: number): Promise<ThinQApiResponse> {
    return this.roomTarget('airCoolTargetTemperature', temperature);
  }
  setRoomAirHeatTargetTemperatureC(temperature: number): Promise<ThinQApiResponse> {
    return this.roomTarget('airHeatTargetTemperature', temperature);
  }
  setRoomWaterCoolTargetTemperatureC(temperature: number): Promise<ThinQApiResponse> {
    return this.roomTarget('waterCoolTargetTemperature', temperature);
  }
  setRoomWaterHeatTargetTemperatureC(temperature: number): Promise<ThinQApiResponse> {
    return this.roomTarget('waterHeatTargetTemperature', temperature);
  }

  private roomTarget(property: string, temperature: number): Promise<ThinQApiResponse> {
    return this.control({ roomTemperatureInUnits: { [property]: temperature, unit: 'C' } });
  }
  private control(payload: Record<string, unknown>): Promise<ThinQApiResponse> {
    return this.thinqApi.asyncPostDeviceControl(this.deviceId, payload);
  }
}

function messageId(): string {
  return Buffer.from(randomUUID().replaceAll('-', ''), 'hex').toString('base64url');
}
function record(value: unknown): Record<string, unknown> { return isRecord(value) ? value : {}; }
function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}
function stringOrNull(value: unknown): string | null { return typeof value === 'string' ? value : null; }
function celsiusEntry(value: unknown): Record<string, unknown> {
  if (!Array.isArray(value)) {return {};}
  return record(value.find((entry) => isRecord(entry) && entry.unit === 'C'));
}
