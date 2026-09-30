# homebridge-lg-thinq-system-boiler

Homebridge support for LG ThinQ air-to-water heat pumps exposed by
the official ThinQ Connect API as `DEVICE_SYSTEM_BOILER`.

The first validation target is an LG THERMA V system with outdoor unit
`HU091.U43`. The implementation is profile-driven and is intended to support
other compatible LG system boilers without hard-coded model checks.

## HomeKit services

- space heating and cooling;
- domestic hot water;
- power, heat, cool, and automatic modes;
- current and target temperatures.

The first supported profile is `AWHP_019101_WW`, validated against an LG
THERMA V `HU091.U43`. Discovery remains device-type based, so compatible LG
system boilers do not require hard-coded model names.

## Installation

Install the plugin from this repository, then add a platform configuration:

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

## Security

Never include a ThinQ Personal Access Token, Ring refresh token, device ID,
serial number, email address, or home/network identifier in issues, fixtures, or
commits. Revoke a token immediately if it is accidentally exposed.

## License

MIT
