import { ensureInteractionGame } from "@/lib/interaction-game";
import { and, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { games, votes } from "@/db/schema";
import { isUserId } from "@/lib/boardgame";
import { json } from "@/lib/http";
export { OPTIONS } from "@/lib/http";
type Context = { params: Promise<{ id: string }> };
export async function PUT(request: Request, context: Context) {
  try {
    const { id } = await context.params;
    const payload = await request.json() as { userId?: unknown; active?: unknown };
    if (!isUserId(payload.userId) || typeof payload.active !== "boolean") return json(request, { error: "想玩信息无效。" }, 400);
    const db = getDb();
    if (!(await ensureInteractionGame(id))) return json(request, { error: "这款桌游已不存在。" }, 404);
    if (payload.active) await db.insert(votes).values({ gameId: id, userId: payload.userId }).onConflictDoNothing();
    else await db.delete(votes).where(and(eq(votes.gameId,id), eq(votes.userId,payload.userId)));
    return json(request, { ok: true });
  } catch { return json(request, { error: "想玩没有保存成功，请重试。" }, 500); }
}
