import { spawnSync } from 'node:child_process';
import { copyFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('../', import.meta.url));
const result = spawnSync(process.execPath, ['node_modules/vite/bin/vite.js','build','--config','frontend/vite.config.ts'], {
  cwd:root, env:{...process.env,VITE_API_BASE:'/',PAGES_BASE:'/'},stdio:'inherit',
});
if(result.status !== 0) process.exit(result.status ?? 1);
copyFileSync(new URL('../cloudflare/pages-proxy.js',import.meta.url),new URL('../pages-dist/_worker.js',import.meta.url));
writeFileSync(new URL('../pages-dist/_routes.json',import.meta.url),JSON.stringify({version:1,include:['/api/*'],exclude:[]}));
console.log('Cloudflare Pages output ready in pages-dist.');
