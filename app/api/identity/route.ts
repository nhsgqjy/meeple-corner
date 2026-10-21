import { json } from "@/lib/http";
export { OPTIONS } from "@/lib/http";
import { cleanNickname, isUserId } from "@/lib/boardgame";

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as { userId?: unknown; nickname?: unknown };
    const nickname = cleanNickname(payload.nickname);
    if (!isUserId(payload.userId)) return json(request, { error: "请刷新页面后重试。" }, 400);
    if (!nickname) return json(request, { error: "请设置一个昵称。" }, 400);
    return json(request, { userId: payload.userId, nickname });
  } catch {
    return json(request, { error: "无法保存昵称，请重试。" }, 400);
  }
}
