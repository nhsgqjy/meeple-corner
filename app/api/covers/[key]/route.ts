import { env } from "cloudflare:workers";
import { isUserId } from "@/lib/boardgame";
import { json, corsHeaders } from "@/lib/http";
export { OPTIONS } from "@/lib/http";
export async function GET(request: Request, context: { params: Promise<{ key: string }> }) {
  try {
    const { key } = await context.params;
    if (!isUserId(key)) return json(request,{ error: "图片不存在。" },404);
    const image = await env.BUCKET?.get("covers/"+key);
    if (!image) return json(request,{ error: "图片不存在。" },404);
    const headers = corsHeaders(request);
    headers.set("Content-Type",image.httpMetadata?.contentType || "application/octet-stream");
    headers.set("Cache-Control","public, max-age=31536000, immutable");
    headers.set("X-Content-Type-Options","nosniff"); headers.set("ETag",image.httpEtag);
    return new Response(image.body,{ headers });
  } catch { return json(request,{ error: "图片读取失败。" },503); }
}
