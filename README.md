# 桌游小馆 · 今天玩什么？

GitHub 保存完整源码；网页、目录与内置图片是静态资源。Sites 仅提供共享想玩、分轮投票、评分和管理员投票接口。暂不迁移 CloudBase。

## 本地运行

- npm ci --include=dev --include=optional
- npm run dev：完整页面及本地 D1 接口
- npm run build：Sites Worker 构建
- npm run build:pages：GitHub Pages 静态构建（pages-dist）

## 修改桌游

目录：public/catalog/games.json；封面：public/images/；现有封面图集：public/game-art-atlas.png。

保持已有 id 不变，它关联长期想玩、评分和历史选票。新增条目填写唯一 id、createdAt 和 isNew:true；下架仅移除静态条目，历史互动不删除。coverUrl 留空沿用内置图集，或填写 /images/xxx.webp。npm run catalog:validate 会检查目录和封面。

GitHub main 推送会自动发布 Pages。当前正式入口仍是 https://meeple-corner-qjy.hjzmwjhwdn.chatgpt.site 。更新正式入口需要同步发布 Sites；新增或移除游戏 ID 时也必须发布后端的目录校验快照。GitHub Actions 不会自动发布 Sites。

## 动态接口

GET /api/interactions?userId=... 返回按游戏 ID 的想玩、选票、评分及当前轮次，前端将它与静态目录合并。互动请求失败时目录仍可浏览，互动操作暂时禁用。

PUT /api/games/:id/want、vote、rating 保存互动；POST /api/rounds 开启新轮次；POST /api/admin/verify 校验口令。旧 GET /api/games 仅作为兼容入口。目录新增/修改/删除、封面上传接口已关闭，返回 410。

## 存储与发布

D1 保留互动记录；原 games 表仅为旧外键提供兼容记录，已不作为目录来源。没有数据清空或新增数据库迁移。R2 绑定及旧封面读取接口暂保留供回退，不再接受新上传。

ADMIN_KEY 只设置在服务端秘密配置；PUBLIC_ORIGIN 配置允许的前端域名。不要提交 .dev.vars、.env、.wrangler、备份或凭证。匿名身份在同一浏览器延续，不是防刷票账号系统。

发布、备份与维护说明见 DEPLOYMENT.md。完整源码直接检出构建，不再依赖仓库 ZIP。
