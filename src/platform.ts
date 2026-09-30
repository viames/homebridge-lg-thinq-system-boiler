import { randomUUID } from 'node:crypto';

import type { API, DynamicPlatformPlugin, Logging, PlatformAccessory, PlatformConfig, Service } from 'homebridge';
import { currentClimateState, targetClimateState, type BoilerState } from './model.js';
import { SystemBoilerDevice, ThinQApi, type ThinQApiResponse } from './thinq.js';

interface LGThinQSystemBoilerConfig extends PlatformConfig {
  accessToken?: string;
  country?: string;
  refreshInterval?: number;
}

interface DeviceMetadata {
  deviceId: string;
  deviceType: string;
  modelName: string;
  alias: string;
  reportable: boolean;
}

interface AccessoryContext { device?: DeviceMetadata }

const DEVICE_TYPE = 'DEVICE_SYSTEM_BOILER';
const PLUGIN_NAME = 'homebridge-lg-thinq-system-boiler';
const PLATFORM_NAME = 'LGThinQSystemBoiler';

export class LGThinQSystemBoilerPlatform implements DynamicPlatformPlugin {
  private readonly accessories = new Map<string, PlatformAccessory<AccessoryContext>>();
  private readonly thinQ: ThinQApi;
  private readonly refreshIntervalMs: number;

  constructor(
    private readonly log: Logging,
    private readonly config: LGThinQSystemBoilerConfig,
    readonly api: API,
  ) {
    this.refreshIntervalMs = Math.max(30, Math.min(600, config.refreshInterval ?? 60)) * 1000;
    this.thinQ = new ThinQApi(config.accessToken ?? '', (config.country ?? 'IT').toUpperCase(), randomUUID());
    this.api.on('didFinishLaunching', () => {
      if (!this.config.accessToken) {
        this.log.warn('No ThinQ Personal Access Token configured; device discovery is disabled.');
        return;
      }
      void this.discoverDevices();
    });
  }

  configureAccessory(accessory: PlatformAccessory<AccessoryContext>): void {
    this.accessories.set(accessory.UUID, accessory);
    this.log.debug('Restored cached accessory: %s', accessory.displayName);
  }

  private async discoverDevices(): Promise<void> {
    try {
      const body = requireBody(await this.thinQ.asyncGetDeviceList(), 'Device discovery');
      const devices = normalizeDeviceList(body).map(getDeviceMetadata)
        .filter((device): device is DeviceMetadata => device !== null && device.deviceType === DEVICE_TYPE);
      const active = new Set<string>();
      for (const device of devices) {
        const uuid = this.api.hap.uuid.generate(device.deviceId);
        active.add(uuid);
        let accessory = this.accessories.get(uuid);
        if (!accessory) {
          accessory = new this.api.platformAccessory<AccessoryContext>(device.alias, uuid);
          accessory.context.device = device;
          this.api.registerPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [accessory]);
          this.accessories.set(uuid, accessory);
          this.log.info('Added LG ThinQ system boiler: %s (%s)', device.alias, device.modelName);
        } else {
          accessory.context.device = device;
        }
        const profile = requireBody(await this.thinQ.asyncGetDeviceProfile(device.deviceId), `Profile request for ${device.alias}`);
        const boiler = new SystemBoilerDevice(
          this.thinQ, device.deviceId, device.deviceType, device.modelName, device.alias, device.reportable,
          profile as Record<string, never>,
        );
        new SystemBoilerAccessory(this, accessory, boiler, device);
      }
      const stale = [...this.accessories.values()].filter((accessory) => !active.has(accessory.UUID));
      if (stale.length > 0) {
        this.api.unregisterPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, stale);
        stale.forEach((accessory) => this.accessories.delete(accessory.UUID));
      }
      this.log.info('Configured %d LG ThinQ system boiler(s).', devices.length);
    } catch (error) {
      this.log.error('LG ThinQ discovery failed: %s', errorMessage(error));
    }
  }

  get characteristic(): API['hap']['Characteristic'] { return this.api.hap.Characteristic; }
  get pollingInterval(): number { return this.refreshIntervalMs; }
}

class SystemBoilerAccessory {
  private readonly climate: Service;
  private readonly hotWater: Service;
  private state: BoilerState | null = null;
  private refreshPromise: Promise<void> | null = null;

  constructor(
    private readonly platform: LGThinQSystemBoilerPlatform,
    private readonly accessory: PlatformAccessory<AccessoryContext>,
    private readonly boiler: SystemBoilerDevice,
    private readonly metadata: DeviceMetadata,
  ) {
    const { Service, Characteristic } = this.platform.api.hap;
    this.climate = accessory.getService(Service.Thermostat)
      ?? accessory.addService(Service.Thermostat, `${metadata.alias} Clima`, 'climate');
    this.hotWater = accessory.getServiceById(Service.Thermostat, 'hot-water')
      ?? accessory.addService(Service.Thermostat, `${metadata.alias} Acqua sanitaria`, 'hot-water');
    accessory.getService(Service.AccessoryInformation)!
      .setCharacteristic(Characteristic.Manufacturer, 'LG Electronics')
      .setCharacteristic(Characteristic.Model, metadata.modelName)
      .setCharacteristic(Characteristic.SerialNumber, accessory.UUID);
    this.configureClimate();
    this.configureHotWater();
    void this.refresh();
    const timer = setInterval(() => void this.refresh(), this.platform.pollingInterval);
    timer.unref();
  }

  private configureClimate(): void {
    const C = this.platform.characteristic;
    this.climate.getCharacteristic(C.CurrentHeatingCoolingState)
      .onGet(async () => currentClimateState(await this.getState(), C));
    this.climate.getCharacteristic(C.TargetHeatingCoolingState)
      .setProps({ validValues: [0, 1, 2, 3] })
      .onGet(async () => targetClimateState(await this.getState(), C))
      .onSet(async (value) => this.setClimateMode(Number(value)));
    this.climate.getCharacteristic(C.CurrentTemperature)
      .onGet(async () => (await this.getState()).climate.currentTemperature);
    this.climate.getCharacteristic(C.TargetTemperature)
      .setProps({ minValue: 5, maxValue: 57, minStep: 1 })
      .onGet(async () => (await this.getState()).climate.targetTemperature)
      .onSet(async (value) => this.setClimateTemperature(Number(value)));
    this.climate.getCharacteristic(C.TemperatureDisplayUnits).onGet(() => C.TemperatureDisplayUnits.CELSIUS);
  }

  private configureHotWater(): void {
    const C = this.platform.characteristic;
    this.hotWater.getCharacteristic(C.CurrentHeatingCoolingState)
      .onGet(async () => (await this.getState()).hotWater.enabled ? 1 : 0);
    this.hotWater.getCharacteristic(C.TargetHeatingCoolingState)
      .setProps({ validValues: [0, 1] })
      .onGet(async () => (await this.getState()).hotWater.enabled ? 1 : 0)
      .onSet(async (value) => this.runCommand(this.boiler.setHotWaterMode(Number(value) === 0 ? 'OFF' : 'ON')));
    this.hotWater.getCharacteristic(C.CurrentTemperature)
      .onGet(async () => (await this.getState()).hotWater.currentTemperature);
    this.hotWater.getCharacteristic(C.TargetTemperature)
      .setProps({ minValue: 30, maxValue: 80, minStep: 1 })
      .onGet(async () => (await this.getState()).hotWater.targetTemperature)
      .onSet(async (value) => this.runCommand(this.boiler.setHotWaterTargetTemperatureC(Number(value))));
    this.hotWater.getCharacteristic(C.TemperatureDisplayUnits).onGet(() => C.TemperatureDisplayUnits.CELSIUS);
  }

  private async getState(): Promise<BoilerState> {
    await this.refresh();
    if (!this.state) {throw new Error('LG ThinQ did not return a usable system boiler state.');}
    return this.state;
  }

  private async refresh(): Promise<void> {
    if (this.refreshPromise) {return this.refreshPromise;}
    this.refreshPromise = this.doRefresh().finally(() => { this.refreshPromise = null; });
    return this.refreshPromise;
  }

  private async doRefresh(): Promise<void> {
    const body = requireBody(
      await this.boiler.thinqApi.asyncGetDeviceStatus(this.metadata.deviceId),
      `State request for ${this.metadata.alias}`,
    );
    this.boiler.setStatus(body as Record<string, never>);
    this.state = readBoilerState(this.boiler);
  }

  private async setClimateMode(value: number): Promise<void> {
    if (value === 0) {
      await this.runCommand(this.boiler.setBoilerOperationMode('POWER_OFF'));
      return;
    }
    await this.runCommand(this.boiler.setCurrentJobMode(value === 1 ? 'HEAT' : value === 2 ? 'COOL' : 'AUTO'));
    await this.runCommand(this.boiler.setBoilerOperationMode('POWER_ON'));
  }

  private async setClimateTemperature(value: number): Promise<void> {
    const state = await this.getState();
    const water = state.climate.temperatureSource === 'WATER';
    const cooling = state.climate.jobMode === 'COOL';
    const command = water
      ? (cooling ? this.boiler.setRoomWaterCoolTargetTemperatureC(value) : this.boiler.setRoomWaterHeatTargetTemperatureC(value))
      : (cooling ? this.boiler.setRoomAirCoolTargetTemperatureC(value) : this.boiler.setRoomAirHeatTargetTemperatureC(value));
    await this.runCommand(command);
  }

  private async runCommand(command: Promise<ThinQApiResponse | undefined>): Promise<void> {
    const response = await command;
    if (!response || response.status < 200 || response.status >= 300) {
      throw new Error(response?.errorMessage ?? response?.errorCode ?? 'LG ThinQ rejected the command.');
    }
    await this.doRefresh();
  }
}

function readBoilerState(boiler: SystemBoilerDevice): BoilerState {
  return {
    climate: {
      powered: boiler.getStatus('boilerOperationMode') === 'POWER_ON',
      jobMode: String(boiler.getStatus('currentJobMode') ?? 'AUTO'),
      temperatureSource: String(boiler.getStatus('roomTempMode') ?? 'WATER'),
      currentTemperature: finiteNumber(boiler.getStatus('roomCurrentTemperatureC'), 0),
      targetTemperature: finiteNumber(boiler.getStatus('roomTargetTemperatureC'), 20),
    },
    hotWater: {
      enabled: boiler.getStatus('hotWaterMode') === 'ON',
      currentTemperature: finiteNumber(boiler.getStatus('hotWaterCurrentTemperatureC'), 0),
      targetTemperature: finiteNumber(boiler.getStatus('hotWaterTargetTemperatureC'), 40),
    },
  };
}

function normalizeDeviceList(body: unknown): unknown[] {
  if (Array.isArray(body)) {return body;}
  if (!body || typeof body !== 'object') {return [];}
  const record = body as Record<string, unknown>;
  for (const key of ['devices', 'deviceList', 'result']) {if (Array.isArray(record[key])) {return record[key];}}
  return [];
}

function getDeviceMetadata(value: unknown): DeviceMetadata | null {
  if (!value || typeof value !== 'object') {return null;}
  const device = value as Record<string, unknown>;
  const info = device.deviceInfo && typeof device.deviceInfo === 'object'
    ? device.deviceInfo as Record<string, unknown> : device;
  const deviceId = stringValue(device.deviceId ?? info.deviceId);
  const deviceType = stringValue(info.deviceType ?? device.deviceType);
  if (!deviceId || !deviceType) {return null;}
  return {
    deviceId,
    deviceType,
    modelName: stringValue(info.modelName ?? device.modelName) || 'Unknown',
    alias: stringValue(device.alias ?? info.alias ?? device.deviceName ?? info.deviceName) || 'LG System Boiler',
    reportable: Boolean(info.reportable ?? device.reportable),
  };
}

function requireBody(response: ThinQApiResponse, operation: string): unknown {
  if (response.status !== 200 || response.body === null) {
    throw new Error(`${operation} failed: ${response.errorCode ?? response.status} ${response.errorMessage ?? ''}`.trim());
  }
  return response.body;
}

function finiteNumber(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}
function stringValue(value: unknown): string { return typeof value === 'string' ? value : ''; }
function errorMessage(error: unknown): string { return error instanceof Error ? error.message : String(error); }
