# Contributing

[← Overview](README.md)

Focused bug reports, hardware compatibility reports and pull requests are welcome. Use the [issue forms](https://github.com/viames/homebridge-lg-thinq-system-boiler/issues/new/choose) and distinguish tested behavior from assumptions.

## Development

Use Node.js 22 or 24, matching the project CI:

```sh
npm ci --ignore-scripts
npm run check
npm pack --dry-run --ignore-scripts
```

`check` runs lint, TypeScript compilation and tests. The eight current tests cover mode mapping, ThinQ command payloads and diagnostic sanitization/response shapes. They are not live cloud or Homebridge end-to-end tests.

The runtime uses Node's native fetch API and has no production npm dependencies. Installable archives must include compiled `dist/`; source downloads alone require a build. Inspection scripts are source-only development tools.

## Compatibility reports

Start with [read-only inspection](docs/troubleshooting.md#read-only-device-inspection). State the printed model, API type/profile, environment and exact fields/controls examined. Connecting alone does not validate every temperature source or mode.

Do not include live PATs, full configuration files, device IDs, serials or account/home/network identifiers in fixtures or issues. Review sanitized output manually before sharing. Keep diagnostics ignored by Git.

## Changes and release checks

- Retain stable accessory identities and service subtypes.
- Match the actual ThinQ state shape and command fields; do not claim arbitrary profile support.
- Add meaningful tests for runtime changes; keep English and Italian documentation aligned.
- Use generic names and dummy credentials in documentation screenshots. No installation room is assumed.
- Check Markdown links, JSON examples, YAML and archive contents.
- Run the existing checks, build before packing, generate a SHA256 checksum and publish the matching source tag/archive.

The public distribution is GitHub releases, not npm. Source/documentation publication does not automatically update any running Homebridge installation.
