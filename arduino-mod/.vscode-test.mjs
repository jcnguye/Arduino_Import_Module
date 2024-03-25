// .vscode-test.js
// default file based off of https://code.visualstudio.com/api/working-with-extensions/testing-extension
// to run these tests:
// npm install --save-dev @vscode/test-cli @vscode/test-electron
// install this extension: https://marketplace.visualstudio.com/items?itemName=ms-vscode.extension-test-runner

import { defineConfig } from '@vscode/test-cli';

export default defineConfig({ files: 'out/test/**/*.test.js' });
