# AntiAI Browser Extension

Cross-browser extension for verifying authenticated content on YouTube.

## 🟢 Chromium Browsers (Chrome, Brave, Edge, Opera)

These browsers interact natively with the default `manifest.json`.

1. **Open Extensions Manager**
    * **Chrome/Brave**: Go to `chrome://extensions`
    * **Edge**: Go to `edge://extensions`
    * **Opera**: Go to `opera://extensions`
2. Enable **Developer Mode** (usually a toggle in the top-right corner).
3. Click **Load unpacked**.
4. Select the `apps/extension` folder.

## 🦊 Mozilla Firefox

Firefox requires a specific manifest format for background scripts.

1. **Prepare Manifest**:
    * Rename `manifest.json` to `manifest.chrome.json` (backup).
    * Rename `manifest.firefox.json` to `manifest.json`.
2. **Load Extension**:
    * Go to `about:debugging#/runtime/this-firefox`
    * Click **Load Temporary Add-on...**
    * Select the `manifest.json` file from the `apps/extension` folder.

## 🍎 Apple Safari (macOS)

Safari Web Extensions must be wrapped in a native macOS application.

1. **Prerequisites**: You need a Mac with Xcode installed.
2. **Convert**:
    * Open Terminal.
    * Run: `xcrun safari-web-extension-converter /path/to/apps/extension`
3. **Build**:
    * Xcode will open with the new project.
    * Run the project (Play button) to build and install the extension used for testing.

## 📱 Mobile Browsers

* **Safari (iOS)**: Requires building the iOS app via Xcode (same as macOS step).
* **Firefox (Android)**: Can load via "Debug" features in Firefox Nightly.
* **Orion (iOS)**: Supports Chrome extensions natively.
