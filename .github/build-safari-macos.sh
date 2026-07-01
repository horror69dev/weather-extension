#!/bin/bash
set -euo pipefail

VERSION="${1:?Usage: build-safari-macos.sh <version>}"
REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SAFARI_DIR="$REPO_ROOT/release/safari"
OUTPUT="$REPO_ROOT/release/weather-extension-safari-v${VERSION}.zip"
XCODE_PROJECT="$REPO_ROOT/release/WeatherExtension/WeatherExtension.xcodeproj"

if [ ! -d "$SAFARI_DIR" ]; then
  echo "ERROR: Safari build directory not found: $SAFARI_DIR"
  exit 1
fi

rm -f "$OUTPUT"

if ! command -v xcodebuild &> /dev/null; then
  echo "WARNING: Xcode not available — packaging raw Safari build"
  cd "$SAFARI_DIR"
  zip -r -q "$OUTPUT" .
  echo "$OUTPUT (raw, no .app)"
  exit 0
fi

echo "Running safari-web-extension-converter..."
if ! xcrun safari-web-extension-converter "$SAFARI_DIR" \
  --project-location "$REPO_ROOT/release/" \
  --app-name "WeatherExtension" \
  --bundle-identifier "com.horror69dev.weather-extension" \
  --copy-resources \
  --force 2>&1; then
  echo "WARNING: Converter failed — falling back to raw ZIP"
  cd "$SAFARI_DIR"
  zip -r -q "$OUTPUT" .
  echo "$OUTPUT (fallback)"
  exit 0
fi

echo "Building Xcode project..."
cd "$REPO_ROOT/release/WeatherExtension"

SCHEME=$(xcodebuild -project "$XCODE_PROJECT" -list 2>/dev/null | sed -n '/Schemes:/,/^$/p' | grep -v 'Schemes:' | grep -v '^$' | grep -v '(iOS)' | grep -v '(watchOS)' | grep -v '(tvOS)' | head -n1 | tr -d '[:space:]')
if [ -z "$SCHEME" ]; then
  SCHEME="WeatherExtension"
fi

if ! xcodebuild \
  -project "$XCODE_PROJECT" \
  -scheme "$SCHEME" \
  -configuration Release \
  -derivedDataPath "$REPO_ROOT/release/WeatherExtension/build/" \
  build 2>&1; then
  echo "WARNING: Xcode build failed — falling back to raw ZIP"
  cd "$SAFARI_DIR"
  zip -r -q "$OUTPUT" .
  echo "$OUTPUT (fallback)"
  exit 0
fi

APP_PATH="$REPO_ROOT/release/WeatherExtension/build/Build/Products/Release/WeatherExtension.app"
if [ -d "$APP_PATH" ]; then
  echo "Packaging .app into ZIP..."
  ditto -c -k --keepParent "$APP_PATH" "$OUTPUT"
  echo "$OUTPUT (contains WeatherExtension.app)"
else
  echo "WARNING: .app not found — falling back to raw ZIP"
  cd "$SAFARI_DIR"
  zip -r -q "$OUTPUT" .
  echo "$OUTPUT (fallback)"
fi
