const fs = require("fs");
const path = require("path");

const srcDir = path.join(__dirname, "..", "src");
const releaseDir = path.join(__dirname, "..", "release");

const CHROMIUM_BROWSERS = ["chrome", "edge", "opera", "brave"];
const SAFARI_BROWSER = "safari";
const FIREFOX_BROWSER = "firefox";

const VALID_TARGETS = ["chromium", "firefox", "safari", "all"];

function parseTarget(arg) {
  const target = (arg || "all").toLowerCase();
  if (!VALID_TARGETS.includes(target)) {
    console.error(`Unknown target: ${arg}`);
    console.error(`  Valid targets: ${VALID_TARGETS.join(", ")}`);
    process.exit(1);
  }
  if (target === "all") return [...CHROMIUM_BROWSERS, FIREFOX_BROWSER, SAFARI_BROWSER];
  if (target === "chromium") return [...CHROMIUM_BROWSERS];
  if (target === "firefox") return [FIREFOX_BROWSER];
  if (target === "safari") return [SAFARI_BROWSER];
}

async function buildIcons(iconsSrc, iconsDest) {
  if (!fs.existsSync(iconsSrc)) {
    console.warn("Icons directory not found:", iconsSrc);
    return;
  }

  fs.mkdirSync(iconsDest, { recursive: true });
  const svgFiles = fs.readdirSync(iconsSrc).filter(f => f.endsWith(".svg"));

  let sharp = null;
  try {
    sharp = require("sharp");
  } catch {
    console.warn("sharp not installed - skipping PNG generation");
  }

  for (const svg of svgFiles) {
    const svgPath = path.join(iconsSrc, svg);
    const baseName = path.basename(svg, ".svg");

    fs.copyFileSync(svgPath, path.join(iconsDest, svg));
    console.log(`  Copied: ${svg}`);

    if (sharp) {
      const svgBuffer = fs.readFileSync(svgPath);
      for (const size of [16, 48, 128]) {
        try {
          const pngBuffer = await sharp(svgBuffer).resize(size, size).png().toBuffer();
          fs.writeFileSync(path.join(iconsDest, `${baseName}-${size}.png`), pngBuffer);
          console.log(`  Generated: ${baseName}-${size}.png`);
        } catch (e) {
          console.warn(`  Failed to generate PNG: ${baseName}-${size}.png`, e.message);
        }
      }
    }
  }
}

async function buildLocales(localesSrc, localesDest) {
  if (!fs.existsSync(localesSrc)) {
    console.warn("Locales directory not found:", localesSrc);
    return;
  }

  fs.mkdirSync(localesDest, { recursive: true });
  const localeFiles = fs.readdirSync(localesSrc).filter(f => f.endsWith(".json"));

  for (const file of localeFiles) {
    fs.copyFileSync(path.join(localesSrc, file), path.join(localesDest, file));
    console.log(`  Copied locale: ${file}`);
  }
}

async function buildForBrowser(browser, baseDir) {
  const buildDir = path.join(baseDir, browser);
  console.log(`\nBuilding for ${browser.toUpperCase()}...`);

  if (fs.existsSync(buildDir)) {
    fs.rmSync(buildDir, { recursive: true });
  }
  fs.mkdirSync(buildDir, { recursive: true });

  const baseFiles = ["popup.html", "popup.css", "popup.js", "background.js", "content.js"];
  for (const file of baseFiles) {
    const srcFile = path.join(srcDir, file);
    if (fs.existsSync(srcFile)) {
      fs.copyFileSync(srcFile, path.join(buildDir, file));
      console.log(`  Copied: ${file}`);
    }
  }

  await buildIcons(path.join(srcDir, "icons"), path.join(buildDir, "icons"));
  await buildLocales(path.join(srcDir, "locales"), path.join(buildDir, "locales"));

  const baseManifest = JSON.parse(fs.readFileSync(path.join(srcDir, "manifest.json"), "utf8"));
  const manifest = generateManifest(baseManifest, browser);

  fs.writeFileSync(
    path.join(buildDir, "manifest.json"),
    JSON.stringify(manifest, null, 2)
  );
  console.log(`  Generated manifest for ${browser}`);
}

function generateManifest(base, browser) {
  let manifest = JSON.parse(JSON.stringify(base));

  switch (browser) {
    case "chrome":
    case "edge":
    case "brave":
    case "opera":
      manifest.manifest_version = 3;
      if (browser === "edge") {
        manifest.minimum_chrome_version = "90";
      } else if (browser === "brave") {
        manifest.minimum_chrome_version = "91";
      } else if (browser === "opera") {
        manifest.minimum_chrome_version = "89";
      }
      break;

    case "firefox":
      manifest.manifest_version = 2;
      manifest.browser_action = manifest.action;
      delete manifest.action;
      manifest.permissions = (manifest.permissions || []).concat(manifest.host_permissions || []);
      delete manifest.host_permissions;
      manifest.browser_specific_settings = {
        gecko: {
          id: "weather-extension@horror69dev",
          strict_min_version: "109.0"
        }
      };
      break;

    case "safari":
      manifest.manifest_version = 3;
      manifest.browser_specific_settings = {
        safari: {
          "minimum_version": "14"
        }
      };
      break;
  }

  return manifest;
}

async function build() {
  const targetArg = process.argv[2];
  const browsers = parseTarget(targetArg);

  if (fs.existsSync(releaseDir)) {
    fs.rmSync(releaseDir, { recursive: true });
  }
  fs.mkdirSync(releaseDir, { recursive: true });

  const baseManifest = JSON.parse(fs.readFileSync(path.join(srcDir, "manifest.json"), "utf8"));
  const version = baseManifest.version;

  const buildManifest = {
    version,
    target: (targetArg || "all").toLowerCase(),
    packages: {
      chromium: null,
      firefox: null,
      safari: null
    }
  };

  for (const browser of browsers) {
    await buildForBrowser(browser, releaseDir);
  }

  const hasChromium = browsers.some(b => CHROMIUM_BROWSERS.includes(b));
  const hasFirefox = browsers.includes(FIREFOX_BROWSER);
  const hasSafari = browsers.includes(SAFARI_BROWSER);

  if (hasChromium) {
    buildManifest.packages.chromium = {
      filename: `weather-extension-chromium-v${version}.zip`,
      format: "zip",
      manifest_version: 3,
      browsers: CHROMIUM_BROWSERS.filter(b => browsers.includes(b))
    };
  }

  if (hasFirefox) {
    buildManifest.packages.firefox = {
      filename: `weather-extension-firefox-v${version}.xpi`,
      format: "xpi",
      manifest_version: 2
    };
  }

  if (hasSafari) {
    buildManifest.packages.safari = {
      filename: `weather-extension-safari-v${version}.zip`,
      format: "zip",
      manifest_version: 3,
      note: "Run through safari-web-extension-converter on macOS to produce .app bundle"
    };
  }

  fs.writeFileSync(
    path.join(releaseDir, "build-manifest.json"),
    JSON.stringify(buildManifest, null, 2)
  );
  console.log(`Wrote build-manifest.json`);

  console.log("\nAll builds completed!");
  console.log("\nBuild directories:");
  for (const browser of browsers) {
    console.log(`  - ${browser}: ${path.join(releaseDir, browser)}`);
  }
  console.log("\nOutput packages:");
  if (buildManifest.packages.chromium) console.log(`  - ${buildManifest.packages.chromium.filename}`);
  if (buildManifest.packages.firefox) console.log(`  - ${buildManifest.packages.firefox.filename}`);
  if (buildManifest.packages.safari) console.log(`  - ${buildManifest.packages.safari.filename}`);
}

build().catch(err => {
  console.error("Build failed:", err);
  process.exit(1);
});
