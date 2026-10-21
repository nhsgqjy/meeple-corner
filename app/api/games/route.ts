import { json } from "@/lib/http";
import { catalog } from "@/lib/catalog";
import { readInteractions } from "@/lib/interactions";
import { isValidAdminKey } from "@/lib/admin";
export { OPTIONS } from "@/lib/http";
// Compatibility for previously published clients; no longer reads or seeds games.
export async function GET(request:Request){try{const data=await readInteractions(new URL(request.url).searchParams.get("userId"));return json(request,{...data,games:catalog.map(g=>({...g,...data.games.find(m=>m.id===g.id)}))});}catch{return json(request,{error:"互动数据暂时不可用。"},503);}}
export async function POST(request:Request){if(!isValidAdminKey(request.headers.get("x-admin-key")))return json(request,{error:"请先通过管理员验证。"},401);return json(request,{error:"目录已改为静态维护，请在 GitHub 修改 public/catalog/games.json。"},410);}
