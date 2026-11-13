# Changelog

## 0.1.3

- Catch initial/background status failures and release polling timers at shutdown.
- Add a regression check for offline recovery using real HomeKit services.
- Declare Node.js 26 support and add it to the CI matrix.

## 0.1.2

- Reworked the project page to match Homebridge Prana Local: centered introduction, badges, quick navigation, feature summary and connection diagram.
- Added complete Italian documentation and dedicated installation, configuration and troubleshooting guides.
- Updated distribution instructions for the compiled GitHub archive and the separately published npm 0.1.1 release.
- Documented cloud/PAT requirements, air/water temperature meaning, actual polling/discovery behavior and unsupported functions.
- Added a real Homebridge settings screenshot with demonstration data, plus bug/hardware issue forms.
- Masked the PAT input in the settings form and added account-country/permission guidance. Masking does not encrypt stored configuration.
- Included documentation in the compiled archive and prepared reproducible release checks.
- Heat-pump runtime source is unchanged from v0.1.0.

## 0.1.1

- Published compiled GitHub distribution, npm package metadata and CI on Node.js 22/24.
- Heat-pump control behavior matches 0.1.0.

## 0.1.0

- Initial working integration for ThinQ `DEVICE_SYSTEM_BOILER` units.
- Climate and domestic-hot-water thermostat services.
- Recorded hardware validation: LG THERMA V HU091.U43, profile AWHP_019101_WW.
