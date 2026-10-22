// Pages serves the frontend and forwards only /api requests to the existing API.
// No database credentials or admin secrets are needed in this deployment.
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (!url.pathname.startsWith('/api/')) return env.ASSETS.fetch(request);
    const upstream = new URL(url.pathname + url.search, 'https://meeple-corner-api.812097204.workers.dev');
    try {
      const response = await fetch(new Request(upstream, request), {
        redirect: 'manual',
        signal: AbortSignal.timeout(12000),
      });
      const headers = new Headers(response.headers);
      headers.set('Cache-Control', 'no-store');
      headers.delete('Set-Cookie');
      return new Response(response.body, {status: response.status, headers});
    } catch {
      return Response.json({error:'数据服务暂时无法连接，请稍后重试。'}, {
        status:503, headers:{'Cache-Control':'no-store'},
      });
    }
  },
};
