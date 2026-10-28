import { execSync } from 'node:child_process';
import { defineConfig } from 'vite';

function gitSha(): string {
  try {
    return execSync('git rev-parse --short HEAD', { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim();
  } catch {
    return 'dev';
  }
}

const sha = gitSha();
const builtAt = new Date().toISOString();

export default defineConfig({
  // Relative base so the same build works on GitHub Pages (/scope-creep/chokepoint/) and locally.
  base: './',
  define: {
    __BUILD_SHA__: JSON.stringify(sha),
    __BUILD_TIME__: JSON.stringify(builtAt),
  },
  build: {
    target: 'es2022',
    chunkSizeWarningLimit: 2500,
    reportCompressedSize: false,
  },
  plugins: [
    {
      // version.json lets the deploy workflow skip unchanged builds and lets humans check what's live.
      name: 'emit-version-json',
      generateBundle() {
        this.emitFile({ type: 'asset', fileName: 'version.json', source: JSON.stringify({ sha, builtAt }, null, 2) });
      },
    },
  ],
});
