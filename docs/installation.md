# Installation, token setup and updates

[← Overview](../README.md) · [Settings](configuration.md) · [Help](troubleshooting.md) · [Italiano](../README.it.md#installazione)

## Before you begin

You need Homebridge, a compatible LG system boiler already online in the ThinQ app, and internet access from the host and heat pump. This integration talks to **LG's cloud**, not the unit's LAN address. [Compatibility evidence](../README.md#compatibility).

Back up Homebridge configuration and pairing data. Keep the plugin archive separately: GitHub-installed packages may not be included in Homebridge backups.

## Personal Access Token

1. Open [LG's PAT portal](https://connect-pat.lgthinq.com) and sign in with the account that owns the heat pump in ThinQ.
2. Create a token with a descriptive name such as `Homebridge LG System Boiler`.
3. Enable permissions to list devices, read device status and control devices. Portal labels can vary by language/version.
4. Copy the token into the plugin's local `accessToken` field. Do not put your LG password in that field.
5. Set `country` to the two-letter country of the LG account. `IT` is an example/default, not a requirement for all users.

The token is a credential. Store it securely, keep it out of Git/issues/screenshots, and revoke it in LG's portal if exposed or no longer needed. If you replace it, save the new local configuration and restart Homebridge. This plugin does not automatically issue or rotate tokens.

The [LG SDK README](https://github.com/thinq-connect/jsthinqconnect#obtaining-and-using-a-personal-access-token) describes the official PAT flow and country-code conventions.

## Install from GitHub

This guide installs the **compiled GitHub 0.1.4 archive**, including the new documentation and settings help. The plugin is also [published on npm](https://www.npmjs.com/package/homebridge-lg-thinq-system-boiler). Version 0.1.3 adds Node.js 26 support and background polling error handling; control commands are unchanged.

If choosing the npm distribution, use `npm install homebridge-lg-thinq-system-boiler@0.1.4` in your existing plugin directory (or `-g` for an existing global setup). A bare package-name command follows npm, not a GitHub release. Plugin-search indexing may take time after npm publication.

### Official Raspberry Pi image / apt installation

In your Homebridge UI terminal, use the standard storage directory:

```sh
cd /var/lib/homebridge
npm install --omit=dev --ignore-scripts https://github.com/viames/homebridge-lg-thinq-system-boiler/releases/download/v0.1.4/homebridge-lg-thinq-system-boiler-0.1.4.tgz
```

Use the account that owns that directory. An SSH session may need to switch to the Homebridge service account first. Do not change directory ownership or install a second Homebridge copy to resolve a permissions problem.

### Global npm installation

If your existing Homebridge plugins are installed globally:

```sh
npm install -g --omit=dev --ignore-scripts https://github.com/viames/homebridge-lg-thinq-system-boiler/releases/download/v0.1.4/homebridge-lg-thinq-system-boiler-0.1.4.tgz
```

Follow your existing privilege convention. System-wide npm setups may need `sudo`; user-managed Node installations normally do not.

### Docker, NAS and other layouts

Use the installer's documented mechanism and the plugin directory used by the **running Homebridge**. Keep it persistent across container recreation. A plugin version dialog may expect an npm name/version rather than an arbitrary archive URL; use a terminal when your UI does not explicitly accept release URLs.

### Check a download

The [release page](https://github.com/viames/homebridge-lg-thinq-system-boiler/releases/latest) includes `.tgz` and `SHA256SUMS`. Download both into one directory, then use:

```sh
# macOS
shasum -a 256 -c SHA256SUMS

# Linux
sha256sum -c SHA256SUMS
```

Expect `OK`. TypeScript and development tools are not needed on the Homebridge host when installing the compiled archive.

## Configure and verify

In Homebridge UI 5.29, open **Plugins → LG ThinQ System Boiler → Plugin Actions → Plugin Config**. Other versions may call this **Settings**. Enter the token and account country, and leave the refresh interval at 60 seconds unless you have a reason to change it.

Alternatively, add the [minimal JSON object](configuration.md#minimal-configuration) to the existing `platforms` array, preserving the bridge and other plugins.

Save and restart Homebridge once. Expected log messages include:

```text
Added LG ThinQ system boiler: …
Configured 1 LG ThinQ system boiler(s).
```

The first line appears for a newly added accessory, not necessarily on every restart. The number depends on compatible units in the account. `Configured 0 …` means the returned list contained no eligible system boilers; it does not prove every ThinQ appliance is supported.

In Apple Home, check for climate and domestic-hot-water thermostat services. Existing bridges need no new pairing; new bridges/child bridges need their own pairing once. Inspect grouped accessory services or choose **Show as Separate Tiles**, where available. Assign rooms and names yourself.

## Update or roll back

Back up configuration/pairing data, read release notes, then install the chosen archive in the same location using the same method. Restart and check discovery and both services. Use [GitHub releases](https://github.com/viames/homebridge-lg-thinq-system-boiler/releases) for archive installations, or the [npm package](https://www.npmjs.com/package/homebridge-lg-thinq-system-boiler) for npm installations. Their latest version can differ; confirm the version and read its notes before switching distribution.

For rollback, install the previous release's compiled archive if available; older releases may have only source code. Restoring only source requires building it first. Retain local configuration and pairing data unless a documented migration requires a change. Do not remove the entire Homebridge bridge from Apple Home as an update step.

## Remove

1. Back up first, then remove the `LGThinQSystemBoiler` platform entry.
2. Uninstall through your plugin manager, or run `npm uninstall homebridge-lg-thinq-system-boiler` in the original local install directory (`-g` for global installs).
3. Restart Homebridge. If a cached accessory remains, remove only that LG accessory through Homebridge's cached-accessory management.
4. Revoke the PAT in LG's portal when you no longer need this integration or any other client using that token.

Removing this plugin does not require re-pairing other accessories on the same bridge. The heat pump remains managed by its native LG controls and app.
