# Cloudflare 互动后台

## 当前结构

- GitHub Pages：`https://nhsgqjy.github.io/meeple-corner/`，网页、桌游目录和图片。
- Worker：`https://meeple-corner-api.812097204.workers.dev`，互动接口。
- D1：`meeple-corner-interactions`，位于用户自己的 Cloudflare 账号。
- chatgpt.site 保留网页入口，所有 `/api/` 请求通过 `INTERACTION_API_BASE` 转接至新 Worker。

## 发布

入口 `cloudflare/worker.ts` 复用 `app/api` 与 `lib`，不包含 Sites 托管运行时。配置文件为 `cloudflare/wrangler.jsonc`。

```sh
node scripts/run-cloudflare.mjs login --scopes account:read user:read workers_scripts:write d1:write
node scripts/run-cloudflare.mjs d1 migrations apply DB --remote --config cloudflare/wrangler.jsonc
node scripts/run-cloudflare.mjs deploy --config cloudflare/wrangler.jsonc
```

本机授权保存在被忽略的 `.sites-runtime/cloudflare` 目录，不能提交或分享。`ADMIN_KEY` 已作为 Worker Secret 配置，沿用原口令。不能写进源码、Wrangler vars 或 GitHub 页面。当前通过本机授权发布，未向 GitHub 配置 Cloudflare 部署令牌。

目录 ID 或后端逻辑修改后，需要重新发布 Worker；GitHub Pages 工作流只自动发布前端。目录和原始图片继续在 `public` 中维护，前端接口地址由 deploy-pages.yml 的 `VITE_API_BASE` 配置。

## 数据与备份

切换时旧后台短暂只读，五张表逐项核对一致后接管流量。最终迁移数据：games 15 行、voting_rounds 2 行、votes 0 行、ratings 6 行、round_votes 4 行。旧库只是切换时副本，不再接收新写入。

迁移备份与最终快照保存在本机 `.sites-runtime/cloudflare`，未提交 GitHub。匿名浏览器身份和游戏 ID 保持原样；两个网页域名仍各自保存浏览器身份。

手动导出当前数据库：

```sh
node scripts/run-cloudflare.mjs d1 export DB --remote --config cloudflare/wrangler.jsonc --output .sites-runtime/cloudflare/manual-backup.sql
```

导出后应另存至个人备份位置；尚未设置自动异地备份。平台恢复窗口以控制台当前套餐为准。

回退时不能直接改回旧库，因为新互动已经写入新库。应先暂停写入、备份并同步最新数据，确认一致后切换。

## Sites 兼容配置

保留原 `.openai/hosting.json` 的项目 ID、DB 和 BUCKET。Sites 前端更新仍单独发布。`INTERACTION_READ_ONLY=1` 仅用于迁移暂停旧库写入，迁移后已移除；`INTERACTION_API_BASE` 现指向新 Worker。新 API 不需要 R2，图片从前端源码获取。
