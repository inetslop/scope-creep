import { execSync } from 'node:child_process';
import { defineConfig } from 'vite';

function gitSha(): string {
  try {
    return execSync('git rev-parse --short HEAD', { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim();
  } catch {
    return 'dev';
  }
}

/**
 * The last commit that changed this game's own folder. The site rebuilds the game on every deploy,
 * also when only other folders changed; this only moves when the game did, so the in-game update
 * notice (ui/updateNotice.ts) never announces a "new version" that is the same game.
 */
function gameSha(fallback: string): string {
  try {
    return execSync('git log -1 --format=%h -- .', { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim() || fallback;
  } catch {
    return fallback;
  }
}

const sha = gitSha();
const game = gameSha(sha);
const builtAt = new Date().toISOString();

export default defineConfig({
  // Relative base so the same build works on GitHub Pages (/scope-creep/chokepoint/) and locally.
  base: './',
  define: {
    __BUILD_SHA__: JSON.stringify(sha),
    __GAME_SHA__: JSON.stringify(game),
    __BUILD_TIME__: JSON.stringify(builtAt),
  },
  build: {
    target: 'es2022',
    chunkSizeWarningLimit: 2500,
    reportCompressedSize: false,
    rolldownOptions: {
      output: {
        // Phaser in its own chunk: its hash only changes when Phaser does, so browsers and the
        // Pages CDN keep it cached across our frequent deploys and only the small game chunk is new.
        codeSplitting: { groups: [{ name: 'phaser', test: /node_modules[\\/]phaser[\\/]/ }] },
      },
    },
  },
  plugins: [
    {
      // version.json lets the deploy workflow skip unchanged builds and lets humans check what's live.
      name: 'emit-version-json',
      generateBundle() {
        this.emitFile({ type: 'asset', fileName: 'version.json', source: JSON.stringify({ sha, game, builtAt }, null, 2) });
      },
    },
  ],
});
