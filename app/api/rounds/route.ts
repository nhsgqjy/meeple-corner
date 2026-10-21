import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { votingRounds } from "@/db/schema";
import { isValidAdminKey } from "@/lib/admin";
import { json } from "@/lib/http";
export { OPTIONS } from "@/lib/http";
export async function POST(request: Request) {
  if (!isValidAdminKey(request.headers.get("x-admin-key"))) return json(request, { error: "只有管理员可以新开投票。" }, 401);
  try {
    const payload = await request.json() as { title?: unknown };
    const title = typeof payload.title === "string" ? payload.title.trim() : "";
    if (!title || Array.from(title).length > 40) return json(request, { error: "投票名称请填写 1–40 个字符。" }, 400);
    const round = { id: crypto.randomUUID(), title, isActive: true };
    const db = getDb();
    await db.batch([
      db.update(votingRounds).set({ isActive: false, closedAt: new Date().toISOString() }).where(eq(votingRounds.isActive,true)),
      db.insert(votingRounds).values(round),
    ]);
    return json(request, { round }, 201);
  } catch { return json(request, { error: "新投票没有开启成功，请重试。" }, 500); }
}
