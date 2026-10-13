// Vitest config for `export-skladiste.test.ts` — runs the export with divetiq-cicak's own
// toolchain (its node_modules, TypeScript transform, jsdom) without touching that repo:
// the root is cicak, the only test file is the one next to this config, and Vite's cache
// goes to edvin's (git-ignored) node_modules. Run it from divetiq-cicak:
//
//   cd ../divetiq-cicak
//   node_modules/.bin/vitest run --config ../divetiq-edvin/scripts/vitest.export-skladiste.config.mjs
//
// No imports on purpose: the config is resolved from edvin, where vitest is not installed.
const SCRIPTS = new URL('./', import.meta.url).pathname
const EDVIN = new URL('../', import.meta.url).pathname
const CICAK = new URL('../../divetiq-cicak/', import.meta.url).pathname

export default {
  root: CICAK,
  cacheDir: `${EDVIN}node_modules/.vite-export-skladiste`,
  test: {
    globals: true,
    environment: 'jsdom',
    dir: SCRIPTS,
    include: ['export-skladiste.test.ts'],
    // The demo's own zone; the frozen clock in the script is a local Sarajevo time.
    env: { TZ: 'Europe/Sarajevo' },
    testTimeout: 600_000,
    pool: 'forks',
  },
}
