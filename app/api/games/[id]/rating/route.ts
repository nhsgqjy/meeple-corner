import { ensureInteractionGame } from "@/lib/interaction-game";
import { json } from "@/lib/http";
export { OPTIONS } from "@/lib/http";
import { eq, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { ratings } from "@/db/schema";
import { isUserId } from "@/lib/boardgame";

type RouteContext = { params: Promise<{ id: string }> };

export async function PUT(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const payload = (await request.json()) as { userId?: unknown; score?: unknown };
    if (!isUserId(payload.userId) || typeof payload.score !== "number" || !Number.isFinite(payload.score) || !Number.isInteger(payload.score * 2) || payload.score < 0.5 || payload.score > 5) return json(request, { error: "请选择 0.5–5 星，每半星一档。" }, 400);
    if (!(await ensureInteractionGame(id))) return json(request,{error:"这款桌游已不在目录中。"},404);
    const db = getDb();
    await db.insert(ratings).values({ gameId: id, userId: payload.userId, score: Number(payload.score) }).onConflictDoUpdate({
      target: [ratings.gameId, ratings.userId],
      set: { score: Number(payload.score), updatedAt: new Date().toISOString() },
    });
    const summary=await db.select({ratingCount:sql<number>`count(*)`,averageRating:sql<number>`avg(${ratings.score})`}).from(ratings).where(eq(ratings.gameId,id)).get();
    return json(request, { ok: true, rating:{id,ratingCount:Number(summary?.ratingCount||0),averageRating:Number(summary?.averageRating||0),myRating:Number(payload.score)} });
  } catch {
    return json(request, { error: "评分没有保存成功，请稍后重试。" }, 500);
  }
}
