import { env } from "cloudflare:workers";
export function corsHeaders(request: Request) {
  const headers = new Headers({ "Cache-Control": "no-store", Vary: "Origin" });
  const origin = request.headers.get("origin");
  const configured = (env.PUBLIC_ORIGIN || "https://nhsgqjy.github.io").split(",").map(s => s.trim());
  if (origin && (origin === new URL(request.url).origin || configured.includes(origin))) {
    headers.set("Access-Control-Allow-Origin", origin);
    headers.set("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
    headers.set("Access-Control-Allow-Headers", "Content-Type,X-Admin-Key");
    headers.set("Access-Control-Max-Age", "600");
  }
  return headers;
}
export function json(request: Request, data: unknown, status = 200) {
  return Response.json(data, { status, headers: corsHeaders(request) });
}
export function OPTIONS(request: Request) { return new Response(null, { status: 204, headers: corsHeaders(request) }); }
