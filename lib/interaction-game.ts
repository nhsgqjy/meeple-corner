import { env } from "cloudflare:workers";
import { findCatalogGame } from "./catalog";
// Existing foreign keys still point to games. Keep only a compatibility row;
// the static catalog is authoritative and reads never create records.
export async function ensureInteractionGame(id:string) {
  const game=findCatalogGame(id);
  if(!game)return false;
  if(!env.DB)throw new Error("DB unavailable");
  await env.DB.prepare("INSERT INTO games (id,title,category,players,minutes,complexity,description,symbol,accent,cover_url,featured,created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(id) DO NOTHING").bind(game.id,game.title,game.category,game.players,game.minutes,game.complexity,game.description,game.symbol,game.accent,game.coverUrl,Number(game.featured),game.createdAt).run();
  return true;
}
