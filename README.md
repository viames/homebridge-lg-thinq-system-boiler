# homebridge-lg-thinq-system-boiler

Experimental Homebridge support for LG ThinQ air-to-water heat pumps exposed by
the official ThinQ Connect API as `DEVICE_SYSTEM_BOILER`.

The first validation target is an LG THERMA V system with outdoor unit
`HU091.U43`. The implementation is profile-driven and is intended to support
other compatible LG system boilers without hard-coded model checks.

## Project status

The repository is in the diagnostic phase. HomeKit accessories are not enabled
until an anonymized real-device profile has been captured and covered by tests.

Planned HomeKit services:

- space heating and cooling;
- domestic hot water;
- current, inlet, and outlet water temperatures when reported by the appliance.

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

