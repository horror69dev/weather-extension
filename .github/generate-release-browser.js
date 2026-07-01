const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const releaseDir = path.join(__dirname, "..", "release");

function getRepoUrl() {
  return process.env.GITHUB_REPOSITORY
    ? `https://github.com/${process.env.GITHUB_REPOSITORY}`
    : "https://github.com/6jt8/weather-extension";
}

function buildInstallManifest() {
  if (!fs.existsSync(path.join(releaseDir, "build-manifest.json"))) {
    return null;
  }
  try {
    return JSON.parse(fs.readFileSync(path.join(releaseDir, "build-manifest.json"), "utf8"));
  } catch {
    return null;
  }
}

function buildInstallFromFilenames() {
  const version = require(path.join(__dirname, "..", "package.json")).version;
  const pkgs = { chromium: null, firefox: null, safari: null };

  if (fs.existsSync(path.join(releaseDir, `weather-extension-chromium-v${version}.zip`))) {
    pkgs.chromium = {
      filename: `weather-extension-chromium-v${version}.zip`,
      format: "zip",
      manifest_version: 3
    };
  }
  if (fs.existsSync(path.join(releaseDir, `weather-extension-firefox-v${version}.xpi`))) {
    pkgs.firefox = {
      filename: `weather-extension-firefox-v${version}.xpi`,
      format: "xpi",
      manifest_version: 2
    };
  }
  if (fs.existsSync(path.join(releaseDir, `weather-extension-safari-v${version}.zip`))) {
    pkgs.safari = {
      filename: `weather-extension-safari-v${version}.zip`,
      format: "zip",
      manifest_version: 3
    };
  }

  return { version, packages: pkgs };
}

function getAutoChangelog() {
  try {
    const lastTag = execSync("git describe --tags --abbrev=0 2>/dev/null", { encoding: "utf8" }).trim();
    if (!lastTag) return null;
    const log = execSync(`git log ${lastTag}..HEAD --oneline --no-merges`, { encoding: "utf8" }).trim();
    if (!log) return null;
    let md = "## Recent Changes\n\n";
    for (const line of log.split("\n")) {
      md += "- " + line + "\n";
    }
    return md;
  } catch {
    return null;
  }
}

function generateReleaseNotes(manifest, releaseType = "release") {
  const v = manifest.version;
  const p = manifest.packages;

  const hasAny = p.chromium || p.firefox || p.safari;
  if (!hasAny) {
    return "# Weather Extension v" + v + "\n\nNo build artifacts available for this target.\n";
  }

  const repo = getRepoUrl();
  const releasesUrl = `${repo}/releases`;

  let md = `# Weather Extension v${v}\n\n`;
  md += "## Release Information\n";
  md += `- **Version:** ${v}\n`;
  md += `- **Build Date:** ${new Date().toUTCString()}\n`;
  md += `- **Release Type:** ${releaseType}\n\n`;

  md += "## Downloads\n\n";
  if (p.chromium) md += `### Chromium (Chrome, Edge, Opera, Brave)\n- **${p.chromium.filename}** — MV3, load unpacked in developer mode\n\n`;
  if (p.firefox) md += `### Firefox\n- **${p.firefox.filename}** — MV2, install directly via about:addons\n\n`;
  if (p.safari) md += `### Safari (macOS)\n- **${p.safari.filename}** — MV3, contains .app bundle\n\n`;

  md += "## Installation\n\n";
  if (p.chromium) {
    md += "### Chromium Browsers\n";
    md += `1. Download \`${p.chromium.filename}\` from [Releases](${releasesUrl})\n`;
    md += "2. Extract the ZIP to a folder\n";
    md += "3. Open your browser extensions page:\n";
    md += "   - Chrome: `chrome://extensions/`\n";
    md += "   - Edge: `edge://extensions/`\n";
    md += "   - Opera: `opera://extensions/`\n";
    md += "   - Brave: `brave://extensions/`\n";
    md += "4. Enable **Developer mode**\n";
    md += "5. Click **Load unpacked** → select the extracted folder\n\n";
  }
  if (p.firefox) {
    md += "### Firefox\n";
    md += `1. Download \`${p.firefox.filename}\` from [Releases](${releasesUrl})\n`;
    md += "2. Open Firefox → `about:addons`\n";
    md += "3. Click the gear icon → **Install Add-on From File...**\n";
    md += "4. Select the `.xpi` file and confirm\n\n";
  }
  if (p.safari) {
    const chromiumFilename = p.chromium ? p.chromium.filename : `weather-extension-chromium-v${v}.zip`;
    md += "### Safari\n";
    md += `1. Download \`${p.safari.filename}\` from [Releases](${releasesUrl})\n`;
    md += "2. Extract the ZIP — it contains `WeatherExtension.app` (or the extension files if .app could not be built)\n";
    md += "3. Move `WeatherExtension.app` to your `/Applications` folder\n";
    md += "4. Open **Safari** → **Settings** → **Extensions** → enable **Weather Extension**\n\n";
    md += "**Alternative (Developer Mode):**\n";
    md += `1. Download \`${chromiumFilename}\`\n`;
    md += "2. Extract and use Safari **Develop** → **Show Extension Builder** → **+** → **Add Extension**\n\n";
  }

  md += "## Package Contents\n";
  md += "- All source files with manifest\n";
  md += "- Icons (SVG + PNG, 16/48/128)\n";
  md += "- Localization files (25+ languages)\n";
  md += "- Popup UI, background & content scripts\n\n";

  md += "## Build Details\n";
  md += "- Chrome: Latest · Edge: 90+ · Opera: 89+ · Brave: 91+\n";
  md += "- Firefox: 109+ · Safari: 14+\n\n";

  const autoChangelog = getAutoChangelog();
  if (autoChangelog) {
    md += autoChangelog + "\n";
  }

  md += "---\n*Automatically built by GitHub Actions*";

  return md;
}

function main() {
  const releaseType = process.env.RELEASE_TYPE || "release";

  let manifest = buildInstallManifest();
  if (!manifest) {
    console.warn("build-manifest.json not found — falling back to filename detection");
    manifest = buildInstallFromFilenames();
  }

  for (const [key, pkg] of Object.entries(manifest.packages || {})) {
    if (pkg && pkg.filename && !fs.existsSync(path.join(releaseDir, pkg.filename))) {
      console.warn("Expected package not found: " + pkg.filename);
      manifest.packages[key] = null;
    }
  }

  const notes = generateReleaseNotes(manifest, releaseType);

  const outPath = path.join(releaseDir, "release-notes.md");
  fs.writeFileSync(outPath, notes);
  console.log("Generated " + outPath);
}

main();
