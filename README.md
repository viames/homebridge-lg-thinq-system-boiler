# homebridge-lg-thinq-system-boiler

Homebridge support for LG ThinQ air-to-water heat pumps exposed by
the official ThinQ Connect API as `DEVICE_SYSTEM_BOILER`.

The integration has been verified on real hardware with an LG THERMA V system
and outdoor unit `HU091.U43`. The implementation is profile-driven and is
intended to support other compatible LG system boilers without hard-coded model
checks.

## HomeKit services

- space heating and cooling;
- domestic hot water;
- power, heat, cool, and automatic modes;
- current and target temperatures.

## Verified compatibility

| LG device | ThinQ profile | Verified HomeKit functions |
| --- | --- | --- |
| THERMA V `HU091.U43` | `AWHP_019101_WW` | heating, cooling, automatic mode, domestic hot water, current and target temperatures |

This setup has been verified through Homebridge on a Raspberry Pi 3 Model B
running 32-bit Raspberry Pi OS. Discovery remains device-type based, so other
compatible LG system boilers do not require hard-coded model names.

## Installation

In **Homebridge UI → Plugins**, search for
`homebridge-lg-thinq-system-boiler` and install it. From a terminal in your
Homebridge plugin directory, the equivalent command is:

```sh
npm install homebridge-lg-thinq-system-boiler
```

### GitHub release archive

Install the packaged release from **Homebridge UI → Plugins → wrench menu →
Install a specific plugin**:

```text
https://github.com/viames/homebridge-lg-thinq-system-boiler/releases/download/v0.1.1/homebridge-lg-thinq-system-boiler-0.1.1.tgz
```

The archive includes the compiled plugin and needs no TypeScript build on the
Homebridge host. Restart Homebridge after configuring it. Add a platform
configuration:

```json
{
  "platform": "LGThinQSystemBoiler",
  "name": "LG ThinQ System Boiler",
  "country": "IT",
  "accessToken": "your ThinQ PAT",
  "refreshInterval": 60
}
```

Create the token at <https://connect-pat.lgthinq.com> with device-list,
device-status, and device-control permissions. Homebridge stores plugin
configuration in its protected local configuration file.

## Read-only device inspection

Create a Personal Access Token at the LG ThinQ Connect developer portal. The
inspection tool only calls the device list, profile, and state endpoints. It does
not send control commands.

```sh
npm install
npm run inspect-device
```

The token is entered without terminal echo and is never written to disk. The
generated file is stored at:

```text
diagnostics/thinq-system-boiler-profile.json
```

Device identifiers, client identifiers, account information, network data, and
credentials are removed from the diagnostic output. Diagnostic JSON files are
ignored by Git.

## Development

```sh
npm install
npm run check
```

CI runs lint, the TypeScript build, tests and a package-content check on Node.js
22 and 24. These automated checks are separate from the hardware validation
documented above.

## Security

Never include a ThinQ Personal Access Token, Ring refresh token, device ID,
serial number, email address, or home/network identifier in issues, fixtures, or
commits. Revoke a token immediately if it is accidentally exposed.

## License

MIT
