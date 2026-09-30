import type {
  API,
  DynamicPlatformPlugin,
  Logging,
  PlatformAccessory,
  PlatformConfig,
} from 'homebridge';

interface LGThinQSystemBoilerConfig extends PlatformConfig {
  accessToken?: string;
  country?: string;
  refreshInterval?: number;
}

/**
 * Dynamic Homebridge platform for LG ThinQ devices reported as
 * DEVICE_SYSTEM_BOILER. Accessory discovery will be enabled after the real
 * device profile has been captured and covered by fixtures.
 */
export class LGThinQSystemBoilerPlatform implements DynamicPlatformPlugin {
  private readonly accessories = new Map<string, PlatformAccessory>();

  constructor(
    private readonly log: Logging,
    private readonly config: LGThinQSystemBoilerConfig,
    private readonly api: API,
  ) {
    this.api.on('didFinishLaunching', () => {
      if (!this.config.accessToken) {
        this.log.warn('No ThinQ Personal Access Token configured; device discovery is disabled.');
        return;
      }

      this.log.info(
        'LG ThinQ System Boiler platform initialized for country %s; live discovery is pending profile validation.',
        (this.config.country ?? 'IT').toUpperCase(),
      );
    });
  }

  configureAccessory(accessory: PlatformAccessory): void {
    this.accessories.set(accessory.UUID, accessory);
    this.log.debug('Restored cached accessory: %s', accessory.displayName);
  }
}

