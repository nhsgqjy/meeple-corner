import { isValidAdminKey } from "@/lib/admin";
import { json } from "@/lib/http";
export { OPTIONS } from "@/lib/http";
export async function POST(request: Request) {
  try {
    const p = await request.json() as { key?: unknown };
    if (!isValidAdminKey(typeof p.key === "string" ? p.key : "")) return json(request, { error: "管理口令不正确，请重新输入。" }, 401);
    return json(request, { ok: true });
  } catch { return json(request, { error: "请输入有效的管理口令。" }, 400); }
}
