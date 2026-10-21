import { ensureInteractionGame } from "@/lib/interaction-game";
import { env } from "cloudflare:workers";
import { isUserId } from "@/lib/boardgame";
import { json } from "@/lib/http";
export { OPTIONS } from "@/lib/http";
type Context = { params: Promise<{ id: string }> };
export async function PUT(request: Request, context: Context) {
  try {
    const { id } = await context.params;
    const p = await request.json() as { userId?: unknown; active?: unknown; roundId?: unknown };
    if (!isUserId(p.userId) || !isUserId(p.roundId) || typeof p.active !== "boolean") return json(request, { error: "投票信息无效，请刷新。" }, 400);
    if (!env.DB) throw new Error("DB unavailable");
    const game = await ensureInteractionGame(id);
    if (!game) return json(request, { error: "这款桌游已被删除。" }, 404);
    const active = await env.DB.prepare("SELECT id FROM voting_rounds WHERE id = ? AND is_active = 1").bind(p.roundId).first();
    if (!active) return json(request, { error: "投票轮次已更新，请刷新后重新投票。" }, 409);
    const result = p.active
      ? await env.DB.prepare("INSERT INTO round_votes (round_id,user_id,game_id) SELECT ?,?,? WHERE EXISTS (SELECT 1 FROM voting_rounds WHERE id = ? AND is_active = 1) ON CONFLICT(round_id,user_id,game_id) DO NOTHING").bind(p.roundId,p.userId,id,p.roundId).run()
      : await env.DB.prepare("DELETE FROM round_votes WHERE round_id = ? AND user_id = ? AND game_id = ? AND EXISTS (SELECT 1 FROM voting_rounds WHERE id = ? AND is_active = 1)").bind(p.roundId,p.userId,id,p.roundId).run();
    if (p.active && !result.meta.changes) {
      const stillOpen = await env.DB.prepare("SELECT id FROM voting_rounds WHERE id = ? AND is_active = 1").bind(p.roundId).first();
      if (!stillOpen) return json(request, { error: "本轮已结束，请刷新后重试。" }, 409);
    }
    return json(request, { ok: true });
  } catch { return json(request, { error: "投票没有保存成功，请重试。" }, 500); }
}
