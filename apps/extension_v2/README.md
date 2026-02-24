# AntiAI Firefox Extension Source Code

## Build Instructions

This extension is built using [Plasmo](https://docs.plasmo.com/), a React-based browser extension framework, and Tailwind CSS.

### Environment Requirements

- Operating System: Windows, macOS, or Linux
- Node.js: v18.x or later
- npm: v9.x or later

### Step-by-Step Build Process

1. **Install Dependencies**
   Navigate to the source directory and run:

   ```bash
   npm install
   ```

   This will install all necessary development and production dependencies, including Plasmo, React, and Tailwind CSS.

2. **Build the Extension for Firefox**
   To produce an exact copy of the Firefox MV2 extension code, run:

   ```bash
   npx plasmo build --target=firefox-mv2
   ```

3. **Locate the Output**
   The built extension will be located in the `build/firefox-mv2-prod` directory.

### Notes for Reviewers

- No proprietary code generators or obfuscators are used. The build process relies strictly on Plasmo (which uses Parcel under the hood) and standard Webpack/Babel plugins for React and TypeScript compilation.
- The compiled zip can also be directly generated via `npx plasmo package --target=firefox-mv2`.
