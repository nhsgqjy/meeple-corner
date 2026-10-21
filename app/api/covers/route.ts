import { json } from "@/lib/http";
import { isValidAdminKey } from "@/lib/admin";
export { OPTIONS } from "@/lib/http";
export async function POST(request:Request){if(!isValidAdminKey(request.headers.get("x-admin-key")))return json(request,{error:"请先通过管理员验证。"},401);return json(request,{error:"图片已改为源码管理，请将封面提交到 public/images。"},410);}
