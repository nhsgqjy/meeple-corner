import { ensureInteractionGame } from "@/lib/interaction-game";
import { json } from "@/lib/http";
export { OPTIONS } from "@/lib/http";
import { and, eq, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { ratings } from "@/db/schema";
import { isUserId } from "@/lib/boardgame";
import { findCatalogGame } from "@/lib/catalog";
import { env } from "cloudflare:workers";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    if (!findCatalogGame(id)) return json(request, { error: "这款桌游已不在目录中。" }, 404);
    const value = new URL(request.url).searchParams.get("page") ?? "0";
    if (!/^\d{1,3}$/.test(value) || Number(value) > 100) return json(request, { error: "评论页码无效。" }, 400);
    const page = Number(value);
    const result = await env.DB!.prepare(`SELECT r.score, r.comment, r.updated_at AS updatedAt, c.color
      FROM ratings r LEFT JOIN player_colors c ON c.user_id = r.user_id
      WHERE r.game_id = ? AND r.comment <> ''
      ORDER BY r.updated_at DESC, r.user_id DESC LIMIT 11 OFFSET ?`).bind(id, page * 10).all();
    const rows = result.results || [];
    return json(request, { comments: rows.slice(0, 10), nextPage: rows.length > 10 && page < 100 ? page + 1 : null });
  } catch {
    return json(request, { error: "评论暂时加载失败，请稍后重试。" }, 503);
  }
}

export async function PUT(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const payload = (await request.json()) as { userId?: unknown; score?: unknown; comment?:unknown };
    if (!isUserId(payload.userId) || typeof payload.score !== "number" || !Number.isFinite(payload.score) || !Number.isInteger(payload.score * 2) || payload.score < 0.5 || payload.score > 5) return json(request, { error: "请选择 0.5–5 星，每半星一档。" }, 400);
    if (!(await ensureInteractionGame(id))) return json(request,{error:"这款桌游已不在目录中。"},404);
    if(payload.comment!==undefined&&(typeof payload.comment!=="string"||payload.comment.length>80))return json(request,{error:"一句话评论最多 80 字。"},400);
    const comment=typeof payload.comment==="string"?payload.comment.replace(/[\r\n]+/g," ").replace(/[\u0000-\u001f\u007f]/g,"").trim():undefined;
    const db = getDb();
    await db.insert(ratings).values({ gameId: id, userId: payload.userId, score: Number(payload.score), comment:comment??"" }).onConflictDoUpdate({
      target: [ratings.gameId, ratings.userId],
      set: { score: Number(payload.score), ...(comment===undefined?{}:{comment}), updatedAt: new Date().toISOString() },
    });
    const summary=await db.select({ratingCount:sql<number>`count(*)`,averageRating:sql<number>`avg(${ratings.score})`}).from(ratings).where(eq(ratings.gameId,id)).get();
    const own=await db.select({comment:ratings.comment}).from(ratings).where(and(eq(ratings.gameId,id),eq(ratings.userId,payload.userId))).get();
    return json(request, { ok: true, rating:{id,ratingCount:Number(summary?.ratingCount||0),averageRating:Number(summary?.averageRating||0),myRating:Number(payload.score),myComment:own?.comment||""} });
  } catch {
    return json(request, { error: "评分没有保存成功，请稍后重试。" }, 500);
  }
}
