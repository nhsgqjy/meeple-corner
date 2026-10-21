import { spawnSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const state = path.join(root, '.sites-runtime', 'cloudflare');
mkdirSync(state, { recursive: true });
const result = spawnSync(process.execPath, [path.join(root, 'node_modules/wrangler/bin/wrangler.js'), ...process.argv.slice(2)], {
  cwd: root,
  stdio: 'inherit',
  env: { ...process.env, XDG_CONFIG_HOME: state, WRANGLER_LOG_PATH: path.join(state, 'logs'), WRANGLER_SEND_METRICS: 'false', CLOUDFLARE_CF_FETCH_ENABLED: 'false' },
});
if (result.error) throw result.error;
process.exit(result.status ?? 1);
