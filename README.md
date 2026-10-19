<p align="center">
   <img src="https://raw.githubusercontent.com/horror69dev/weather-extension/main/.github/assets/banner.svg" alt="Weather Extension Banner" />
</p>

<div align="center">

**Browser extension for current weather and 7-day forecast — Chrome, Firefox, Edge, Opera, Brave & Safari**

[![Release](https://img.shields.io/github/v/release/horror69dev/weather-extension?style=flat-square&color=4a90b8)](https://github.com/horror69dev/weather-extension/releases)
[![License](https://img.shields.io/badge/license-MIT-green?style=flat-square)](LICENSE)
[![Languages](https://img.shields.io/badge/languages-24-blue?style=flat-square)](src/locales/)
[![Stars](https://img.shields.io/github/stars/horror69dev/weather-extension?style=flat-square&color=fbbf24)](https://github.com/horror69dev/weather-extension/stargazers)

*A project by [horror69dev](https://github.com/horror69dev)*

</div>

## Features

- **Current weather** - Temperature, condition, humidity & wind
- **7-day forecast** - Today + next 6 days
- **24 languages** - Select in the popup, saved automatically
- **Location detection** - Automatic via geolocation or IP
- **Favorites** - Save and quickly load locations
- **Unit toggle** - Celsius / Fahrenheit (persisted)

## Screenshots

<p align="center">
  <img src="https://raw.githubusercontent.com/horror69dev/weather-extension/main/.github/assets/Screenshot-Weather.png" alt="Weather Tab" width="32%" />
  <img src="https://raw.githubusercontent.com/horror69dev/weather-extension/main/.github/assets/Screenshot-Forecast.png" alt="Forecast Tab" width="32%" />
  <img src="https://raw.githubusercontent.com/horror69dev/weather-extension/main/.github/assets/Screenshot-Favorites.png" alt="Favorites Tab" width="32%" />
</p>

## Package Structure

This release provides **three packages** for all supported browsers:

| Package | Browsers | Format | Installation |
|:---|:---|:---|:---|
| `weather-extension-chromium-v*.zip` | Chrome, Edge, Opera, Brave | ZIP | Load unpacked in developer mode |
| `weather-extension-firefox-v*.xpi` | Firefox | XPI | Install directly via `about:addons` |
| `weather-extension-safari-v*.zip` | Safari (macOS) | ZIP (contains `.app`) | Move to Applications, enable in Safari |

### Why this structure?

- **Chromium browsers** (Chrome, Edge, Opera, Brave) share the same extension format (Manifest V3) — one ZIP works for all.
- **Firefox** uses Manifest V3 and requires a signed `.xpi` for installation.
- **Safari** requires a native macOS `.app` bundle for distribution — the Safari ZIP contains the converted app built with `safari-web-extension-converter`.

## Installation

### Chrome / Edge / Opera / Brave

1. Download `weather-extension-chromium-v*.zip` from [Releases](../../releases)
2. Extract the ZIP file to a folder
3. Open your browser's extensions page:
   - **Chrome**: `chrome://extensions/`
   - **Edge**: `edge://extensions/`
   - **Opera**: `opera://extensions/`
   - **Brave**: `brave://extensions/`
4. Enable **Developer mode** (toggle in top right corner)
5. Click **Load unpacked** → select the extracted folder

### Firefox

1. Download `weather-extension-firefox-v*.xpi` from [Releases](../../releases)
2. Open Firefox and navigate to `about:addons`
3. Click the gear icon (⚙️) in the top right
4. Select **Install Add-on From File...**
5. Select the downloaded `.xpi` file and confirm the installation

### Safari (macOS)

**Option A: Using the .app bundle (recommended)**

1. Download `weather-extension-safari-v*.zip` from [Releases](../../releases)
2. Extract the ZIP — it contains `WeatherExtension.app`
3. Move `WeatherExtension.app` to your `/Applications` folder
4. Open **Safari** → **Settings** → **Extensions**
5. Enable **Weather Extension** in the extensions list
6. If prompted, allow the extension in **System Settings** → **Privacy & Security**

**Option B: Using developer mode (no .app)**

1. Download `weather-extension-chromium-v*.zip` from [Releases](../../releases)
2. Extract the ZIP file to a folder
3. Open **Safari** → **Settings** → **Advanced** → enable **Show Develop menu in menu bar**
4. From the **Develop** menu → **Show Extension Builder** → click **+** → **Add Extension**
5. Select the extracted folder

## Development

```bash
git clone https://github.com/horror69dev/weather-extension.git
cd weather-extension
```

No API key required - uses [Open-Meteo](https://open-meteo.com/) (free, no signup).

### Build release packages locally

```bash
# Install dependencies first
npm install

# Build all targets
node build/build.mjs all

# Build specific target
node build/build.mjs chromium
node build/build.mjs firefox
node build/build.mjs safari
```

Or use the npm script:
```bash
npm run build
```

See [Package Structure](#package-structure) above for details on the output artifacts.

## Release

Releases are triggered by pushing a git tag matching `v*.*.*`:

```bash
# tag a release
git tag v1.0.0 && git push origin v1.0.0

# or with a prerelease suffix (package files still use base version)
git tag v1.0.1-beta && git push origin v1.0.1-beta
```

the tag version is used for the github release only. the actual extension version
is set in `package.json` and `src/manifest.json` — update those locally before tagging.

advanced: manual release via **GitHub Actions** → [Release Build](../../actions/workflows/release.yml)

### Build matrix

| Job | Runner | Output |
|:---|:---|:---|
| `package-chromium` | `ubuntu-latest` | `weather-extension-chromium-v*.zip` |
| `package-firefox` | `ubuntu-latest` | `weather-extension-firefox-v*.xpi` |
| `package-safari` | `macos-latest` | `weather-extension-safari-v*.zip` (contains `.app`) |
| `release` | `ubuntu-latest` | GitHub Release with all packages |

## API

Uses [Open-Meteo](https://open-meteo.com/) (free, no API key required)

- `/v1/forecast` - Current weather + 7-day forecast
- `/v1/search` - Geocoding (location search)
- `/v1/reverse` - Reverse geocoding (coordinates to name)

## Contributors

Thanks to all contributors who have helped this project:

<p align="center">
  <a href="https://github.com/horror69dev/weather-extension/graphs/contributors">
    <img src="https://contrib.rocks/image?repo=horror69dev/weather-extension" alt="Contributors" />
  </a>
</p>

## Star History

<p align="center">
  <a href="https://www.star-history.com/?repos=horror69dev%2Fweather-extension&type=date&legend=top-left">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="https://api.star-history.com/chart?repos=horror69dev%2Fweather-extension&type=date&theme=dark&legend=top-left" />
      <source media="(prefers-color-scheme: light)" srcset="https://api.star-history.com/chart?repos=horror69dev%2Fweather-extension&type=date&legend=top-left" />
      <img alt="Star History Chart" src="https://api.star-history.com/chart?repos=horror69dev%2Fweather-extension&type=date&legend=top-left" />
    </picture>
  </a>
</p>

## License

This project is licensed under the `MIT License` - see the [LICENSE](LICENSE) file for details.

## Copyright

Originally created by [horror69dev](https://github.com/horror69dev).

Weather data provided by [Open-Meteo](https://open-meteo.com/).
