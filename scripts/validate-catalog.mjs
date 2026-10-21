import fs from 'node:fs/promises';
import path from 'node:path';
const root=path.resolve(import.meta.dirname,'..');
const catalog=JSON.parse(await fs.readFile(path.join(root,'public/catalog/games.json'),'utf8'));
if(catalog.version!==1||!Array.isArray(catalog.games))throw new Error('目录格式必须是 version:1 和 games 数组');
const ids=new Set();
for(const game of catalog.games){
 if(typeof game.id!=='string'||! /^[a-zA-Z0-9_-]{1,80}$/.test(game.id)||ids.has(game.id))throw new Error('游戏 ID 无效或重复：'+game.id);
 ids.add(game.id);
 for(const key of ['title','category','players','complexity','description','symbol','accent','createdAt','coverUrl'])if(typeof game[key]!=='string')throw new Error(game.id+' 缺少字段 '+key);
 if(!game.title.trim()||!game.category.trim()||!Number.isInteger(game.minutes)||game.minutes<5||game.minutes>600||Number.isNaN(Date.parse(game.createdAt)))throw new Error(game.id+' 目录内容无效');
 if(typeof game.featured!=='boolean'||typeof game.isNew!=='boolean')throw new Error(game.id+' 推荐/上新必须使用布尔值');
 if(game.coverUrl){
  if(!game.coverUrl.startsWith('/images/')||game.coverUrl.includes('..')||/[?#]/.test(game.coverUrl))throw new Error(game.id+' 封面必须使用 /images/ 中的本地文件');
  await fs.access(path.join(root,'public',game.coverUrl));
 }
}
await fs.access(path.join(root,'public/game-art-atlas.png'));
console.log('静态目录有效：'+ids.size+' 款桌游');
