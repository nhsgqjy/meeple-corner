import { json } from "@/lib/http";
import { isValidAdminKey } from "@/lib/admin";
export { OPTIONS } from "@/lib/http";
async function staticCatalog(request:Request){if(!isValidAdminKey(request.headers.get("x-admin-key")))return json(request,{error:"请先通过管理员验证。"},401);return json(request,{error:"目录已改为静态维护，请在 GitHub 修改 public/catalog/games.json。原互动记录不会删除。"},410);}
export const PATCH=staticCatalog;
export const DELETE=staticCatalog;
