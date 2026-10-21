import { ensureInteractionGame } from "@/lib/interaction-game";
import { json } from "@/lib/http";
export { OPTIONS } from "@/lib/http";
import { and, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { ratings } from "@/db/schema";
import { isUserId } from "@/lib/boardgame";

type RouteContext = { params: Promise<{ id: string }> };

export async function PUT(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const payload = (await request.json()) as { userId?: unknown; score?: unknown };
    if (!isUserId(payload.userId) || !Number.isInteger(payload.score) || Number(payload.score) < 1 || Number(payload.score) > 5) return json(request, { error: "请选择 1–5 星。" }, 400);
    if (!(await ensureInteractionGame(id))) return json(request,{error:"这款桌游已不在目录中。"},404);
    const db = getDb();
    await db.insert(ratings).values({ gameId: id, userId: payload.userId, score: Number(payload.score) }).onConflictDoUpdate({
      target: [ratings.gameId, ratings.userId],
      set: { score: Number(payload.score), updatedAt: new Date().toISOString() },
    });
    return json(request, { ok: true });
  } catch {
    return json(request, { error: "评分没有保存成功，请稍后重试。" }, 500);
  }
}
