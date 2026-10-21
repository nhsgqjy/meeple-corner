export function isUserId(value: unknown): value is string {
  return typeof value === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}
export function cleanNickname(value: unknown) {
  return typeof value === "string" ? Array.from(value.trim().replace(/[<>\u0000-\u001f]/g, "")).slice(0, 14).join("") : "";
}
export function validGameInput(payload: Record<string, unknown>) {
  const title = typeof payload.title === "string" ? payload.title.trim() : "";
  const category = typeof payload.category === "string" ? payload.category.trim() : "";
  const players = typeof payload.players === "string" ? payload.players.trim() : "";
  const description = typeof payload.description === "string" ? payload.description.trim() : "";
  const minutes = Number(payload.minutes);
  const complexity = ["轻松", "适中", "烧脑"].includes(String(payload.complexity)) ? String(payload.complexity) : "轻松";
  const symbol = typeof payload.symbol === "string" ? payload.symbol.trim().slice(0, 3) : "✦";
  const accent = ["sage", "terracotta", "blue", "plum", "gold", "rose"].includes(String(payload.accent)) ? String(payload.accent) : "sage";
  const coverUrl = typeof payload.coverUrl === "string" ? payload.coverUrl.trim() : "";
  if (!title || Array.from(title).length > 32) return { error: "桌游名称请填写 1–32 个字符。" };
  if (!category || Array.from(category).length > 16) return { error: "请填写桌游类型（最多 16 个字符）。" };
  if (!/^\d{1,2}(?:\s*[-–~至]\s*\d{1,2})?$/.test(players)) return { error: "人数请填写数字，例如 2–4。" };
  const range = players.match(/\d+/g)?.map(Number) || [];
  if (range.some(n => n < 1 || n > 99) || (range.length === 2 && range[0] > range[1])) return { error: "请填写有效的人数范围。" };
  if (!Number.isInteger(minutes) || minutes < 5 || minutes > 600) return { error: "时长需在 5–600 分钟之间。" };
  if (Array.from(description).length > 160) return { error: "简介请控制在 160 个字符以内。" };
  if (coverUrl.length > 2048) return { error: "封面链接太长。" };
  if (coverUrl) {
    let valid = /^\/api\/covers\/[0-9a-f-]{36}$/.test(coverUrl);
    try { const u = new URL(coverUrl); valid ||= u.protocol === "https:" && !u.username && !u.password; } catch { /* relative upload URL */ }
    if (!valid) return { error: "封面请使用 HTTPS 图片链接，或上传图片。" };
  }
  return { value: { title, category, players, minutes, complexity, description, symbol: symbol || "✦", accent, coverUrl, featured: payload.featured === true } };
}
