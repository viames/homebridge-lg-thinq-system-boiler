# Troubleshooting and FAQ

[← Overview](../README.md) · [Install](installation.md) · [Settings](configuration.md) · [Italiano](../README.it.md#problemi-comuni)

## Start here

| Symptom | First check |
| --- | --- |
| Missing from plugin search | Check npm indexing, or install the compiled GitHub archive |
| `No ThinQ Personal Access Token configured` | Local `accessToken` is missing; save and restart |
| Discovery authentication failure | PAT, selected permissions and LG account country |
| `Configured 0 …` | API device list has no eligible `DEVICE_SYSTEM_BOILER` |
| One thermostat seems missing | Inspect the grouped accessory's services in Home |
| Temperature seems too high or low | Air vs circuit-water source and expected API fields |
| Command rejected | Unit's current mode, permitted range and API error |

## Cannot install or find the plugin

The plugin is published on npm and as [compiled GitHub archives](https://github.com/viames/homebridge-lg-thinq-system-boiler/releases/latest). Search indexing may lag publication; the archive URL installs the documented version directly. Install into the directory used by the running Homebridge, not another copy on the host. The archive includes `dist/`; the GitHub source download alone is not a prebuilt plugin.

## Authentication or country errors

Use a PAT issued for the account that owns the unit, with list/status/control permissions. The plugin needs the **LG account country**, not necessarily the physical installation country. Country chooses the regional API endpoint.

An invalid/revoked token, missing permissions or a wrong account/region can prevent listing, status reads or commands. Create/replace the token through LG's portal when needed, update local configuration, then restart Homebridge. This plugin does not renew credentials automatically. Do not share the token to ask for help.

## No devices found

Confirm the unit is online and controllable in the ThinQ app. Only type `DEVICE_SYSTEM_BOILER` is selected. A regular ThinQ air conditioner is not included, and a THERMA V commercial name does not guarantee the expected API state fields.

Use the read-only inspection tool below to assess the type/profile/state. After fixing connectivity or adding a unit, restart Homebridge: discovery runs at startup, and a failed initial discovery is not scheduled for automatic retry.

## Missing service or No Response in Home

Look for `Configured … LG ThinQ system boiler(s).` and relevant errors in Homebridge logs. Check both climate and hot-water services inside the grouped accessory. Existing bridges need no new pairing; separate child bridges need their own pairing.

This is a cloud integration. Verify internet access, DNS, token validity and LG service/device availability. If every Homebridge accessory fails, inspect bridge/HomeKit connectivity rather than changing only this plugin. Avoid deleting the entire bridge as a first troubleshooting step.

## Temperature or mode looks wrong

Read [the control mapping](configuration.md#controls-and-temperature-meaning). ThinQ may report circuit-water temperature rather than ambient air. The selected target field also depends on air/water control mode and Heat/Cool/Auto.

A zero or fixed temperature can indicate a model with a different state schema: this release uses numeric fallbacks when fields are missing. The current mode indication is derived from reported power/job flags, not live compressor telemetry. Do not infer actual compressor operation or energy consumption from the tile.

HomeKit's displayed setpoint bounds do not override the unit's permitted range. Use native controls and installer guidance for system configuration; report rejected commands with redacted errors and the current operating mode.

## Read-only device inspection

Run this from a **source checkout**, not just the installed release archive. The inspection scripts are development tools and are not included in the runtime package.

```sh
git clone https://github.com/viames/homebridge-lg-thinq-system-boiler.git
cd homebridge-lg-thinq-system-boiler
npm ci --ignore-scripts
npm run inspect-device
```

The command builds the TypeScript source, then prompts for the PAT without terminal echo. By default the country is `IT`; for another account country, run, for example:

```sh
THINQ_COUNTRY=GB npm run inspect-device
```

The tool calls device-list, profile and state endpoints only. It sends **no control commands**. The token is passed to the process in memory/environment, not written by the tool to its output file.

Output is `diagnostics/thinq-system-boiler-profile.json`, created with restricted file permissions and ignored by Git. The sanitizer removes identifier/credential-related keys recursively and replaces per-device labels. Review the file manually before sharing it: automatic removal of known key patterns cannot guarantee every vendor field is anonymous.

Do not use command-line token literals, shell history or public diagnostic attachments as credential storage. [Contributing](../CONTRIBUTING.md).

## Token and diagnostic privacy

Homebridge saves `accessToken` in its local configuration. Treat that file and backups as sensitive. The settings UI masks the input; it does **not** encrypt the stored token. The runtime sends the token to the selected LG ThinQ HTTPS endpoint for authorized requests.

The plugin has no analytics service. Local accessory metadata includes the LG device identifier/alias/model for discovery and identity; avoid sharing full cache/configuration files. Revoke a PAT through LG if exposed or no longer needed.

## Report a problem or another model

[Open an issue](https://github.com/viames/homebridge-lg-thinq-system-boiler/issues/new/choose) with the printed model, API device type/profile when known, plugin/Homebridge/Node versions, OS, expected result, controls actually tested and a short redacted error.

Do not include tokens, LG passwords, serials, device IDs, personal email, home/network identifiers or full configuration files. A model connecting successfully does not verify every mode or temperature mapping.
