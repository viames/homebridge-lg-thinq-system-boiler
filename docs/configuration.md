# Configuration reference

[← Overview](../README.md) · [Install](installation.md) · [Help](troubleshooting.md) · [Italiano](../README.it.md#configurazione)

## Minimal configuration

Add this object to Homebridge's existing `platforms` array:

```json
{
  "platform": "LGThinQSystemBoiler",
  "name": "LG ThinQ System Boiler",
  "country": "IT",
  "accessToken": "YOUR_THINQ_PAT",
  "refreshInterval": 60
}
```

Replace the token placeholder locally. Replace `IT` if your LG account uses another country. No device IP, room name, model number or device ID is entered.

## All settings

| Key | Default | Meaning |
| --- | --- | --- |
| `platform` | Required: `LGThinQSystemBoiler` | Homebridge platform alias |
| `name` | `LG ThinQ System Boiler` in the form | Platform/log label, not a per-device alias |
| `country` | `IT` | Two-letter LG account country; normalized to uppercase |
| `accessToken` | Required | ThinQ Personal Access Token; no automatic issuance/rotation |
| `refreshInterval` | `60` | Background polling in seconds, clamped to 30–600 |

The UI form requires name, country and token. Without a token, runtime discovery is disabled. HomeKit reads and commands can issue additional status requests; the background interval is not a request-rate ceiling.

The client selects `aic`, `kic` or `eic` regional endpoints using country groups in its source. Use the LG account country rather than the host's location or language. No manual endpoint, local-IP or per-device filter setting is offered.

## Device discovery and names

Startup lists devices in the configured account and selects type `DEVICE_SYSTEM_BOILER`. It retrieves each profile, then applies the plugin's known state/control mapping. This is **not universal support for arbitrary profile schemas**.

Each eligible unit gets one accessory with two thermostat services. Its identity is derived from the LG device ID. The initial name comes from the ThinQ alias, then the device name, or the generic fallback `LG System Boiler`. Services use the suffixes `Clima` and `Acqua sanitaria` in this release. Rename and assign rooms in Apple Home as needed.

All eligible units returned by the account are considered; there is no configured allowlist. Multi-unit discovery is implemented but the documented hardware validation concerns one system. A newly added device or a corrected token/country requires restarting discovery through a Homebridge restart.

## Controls and temperature meaning

### Space climate

| Home control | ThinQ behavior |
| --- | --- |
| Off | Sends boiler `POWER_OFF` |
| Heat / Cool / Auto | Sets `HEAT` / `COOL` / `AUTO`, then boiler `POWER_ON` |
| Current temperature | Celsius entry from `roomTemperatureInUnits.currentTemperature` |
| Target temperature read | Celsius entry from `roomTemperatureInUnits.targetTemperature` |
| Target temperature write | Uses air/water heat/cool target fields according to `roomTempMode` and current job mode |

When `roomTempMode` is `WATER`, the setpoint is a **water-circuit target**, not a room-air target. For other values, the plugin uses the air target fields. Cooling uses the cooling target; Heat and Auto use the heating target fields in this implementation.

HomeKit offers a 5–57 °C climate target range in 1 °C steps. This is an interface bound, **not an operating recommendation** or a model-specific permitted range. LG may reject a value or mode not supported in the current state. Preserve your installer's air/water configuration and use LG controls for installer settings.

The current heating/cooling state is derived from power and selected job mode. It is not a compressor-running measurement, energy meter or separate room thermostat.

### Domestic hot water

| Home control | ThinQ behavior |
| --- | --- |
| Off / Heat | Sets `hotWaterMode` to `OFF` / `ON` |
| Current temperature | Celsius entry from `hotWaterTemperatureInUnits.currentTemperature` |
| Target temperature | Reads target and writes the Celsius hot-water target |

HomeKit represents hot water as a thermostat with Off and Heat, a 30–80 °C target range and 1 °C steps. Those bounds are not recommended water temperatures; the unit enforces its own conditions. An enabled/heating indication reflects the enabled flag, not proof of active heating at that instant.

## State updates and failures

Discovery runs at startup. Each discovered unit is polled in the background at the configured interval. Reads refresh status, and successful control requests are followed by another status request. Concurrent refresh calls for the same accessory share an in-flight refresh.

This release uses polling, not ThinQ event subscriptions. It has no configurable exponential backoff or per-device stale-time setting. A failed initial discovery is logged; after correcting credentials, country or connectivity, restart Homebridge to retry discovery. Do not assume recovery behavior identical to the separate Prana Local plugin.

For an unexpected zero or fixed temperature, check the model's API state shape before trusting the value. The current mapping has fallback values when expected numeric fields are absent; another model may need implementation changes.

## What is not exposed

- LG schedules, energy consumption and history.
- Multiple zones, curve/installer configuration and every model-specific option.
- Humidity, compressor-running telemetry and a separate ambient-air sensor when ThinQ reports water temperature.
- Local/offline control, MQTT event subscriptions or automatic PAT renewal.
- Ordinary `DEVICE_AIR_CONDITIONER` devices and unrelated ThinQ appliances.

Use LG's app/controller for functions beyond this mapping. [Read-only diagnostics](troubleshooting.md#read-only-device-inspection) can help assess another system without changing its settings.
