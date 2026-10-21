import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import { fileURLToPath } from "node:url";
const here=path.dirname(fileURLToPath(import.meta.url));
const repo=process.env.GITHUB_REPOSITORY?.split("/")[1];
export default defineConfig({ root:here, publicDir:path.resolve(here,"../public"), base:process.env.PAGES_BASE || (repo&&!repo.endsWith(".github.io")?"/"+repo+"/":"/"), plugins:[react()], build:{outDir:path.resolve(here,"../pages-dist"),emptyOutDir:true}, preview:{host:"127.0.0.1",port:5174} });
