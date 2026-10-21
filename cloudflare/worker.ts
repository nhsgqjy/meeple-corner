import { GET as interactions } from '../app/api/interactions/route';
import { POST as identity } from '../app/api/identity/route';
import { POST as verify } from '../app/api/admin/verify/route';
import { POST as rounds } from '../app/api/rounds/route';
import { PUT as want } from '../app/api/games/[id]/want/route';
import { PUT as vote } from '../app/api/games/[id]/vote/route';
import { PUT as rating } from '../app/api/games/[id]/rating/route';
import { json, OPTIONS } from '../lib/http';
import { env } from 'cloudflare:workers';

// Reuse the existing API handlers; no frontend or Sites hosting runtime is bundled.
export default {
  async fetch(request: Request): Promise<Response> {
    const pathname = new URL(request.url).pathname;
    if (request.method === 'OPTIONS') return OPTIONS(request);
    if (pathname === '/api/health' && request.method === 'GET') {
      try {
        await env.DB!.prepare('SELECT COUNT(*) FROM voting_rounds').first();
        return json(request, { ok: true, service: 'meeple-corner-api' });
      } catch {
        return json(request, { ok: false, error: '数据服务尚未就绪。' }, 503);
      }
    }
    try {
      if (pathname === '/api/interactions' && request.method === 'GET') return await interactions(request);
      if (pathname === '/api/identity' && request.method === 'POST') return await identity(request);
      if (pathname === '/api/admin/verify' && request.method === 'POST') return await verify(request);
      if (pathname === '/api/rounds' && request.method === 'POST') return await rounds(request);
      const match = pathname.match(/^\/api\/games\/([^/]+)\/(want|vote|rating)$/);
      if (match && request.method === 'PUT') {
        const context = { params: Promise.resolve({ id: decodeURIComponent(match[1]) }) };
        return await ({ want, vote, rating }[match[2] as 'want'|'vote'|'rating'])(request, context);
      }
      return json(request, { error: '接口不存在。' }, 404);
    } catch {
      return json(request, { error: '数据服务暂时不可用，请稍后重试。' }, 500);
    }
  },
};
