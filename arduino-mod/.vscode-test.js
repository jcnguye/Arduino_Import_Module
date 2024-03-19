// .vscode-test.js
// default file based off of https://code.visualstudio.com/api/working-with-extensions/testing-extension
import { defineConfig } from '@vscode/test-cli';

export default defineConfig({ files: 'out/test/**/*.test.js' });
