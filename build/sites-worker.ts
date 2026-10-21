import handler from "vinext/server/fetch-handler";
import { runWithConnectorBinding } from "../lib/connector-context";
import type { ConnectorBinding } from "../lib/connector-contract.mjs";

export default {
  fetch(request: Request, env: Cloudflare.Env, ctx: ExecutionContext<{ CONNECTORS?: ConnectorBinding }>) {
    const url = new URL(request.url);
    if (url.pathname.startsWith('/api/')) {
      if (env.INTERACTION_API_BASE) {
        const target = new URL(env.INTERACTION_API_BASE);
        if (target.protocol !== 'https:') return Response.json({ error: '接口配置无效。' }, { status: 503 });
        target.pathname = url.pathname;
        target.search = url.search;
        return fetch(new Request(target, request));
      }
      if (env.INTERACTION_READ_ONLY === '1' && !['GET', 'HEAD', 'OPTIONS'].includes(request.method)) {
        return Response.json({ error: '数据正在迁移，请稍后刷新再试，你的操作尚未保存。' }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
      }
    }
    let binding = ctx.props?.CONNECTORS;
    // Local preview emulates the same request-scoped capability. This branch and
    // the auxiliary service binding are absent from production builds.
    if (import.meta.env.DEV && !binding && env.CONNECTORS) {
      const preview = env.CONNECTORS;
      const expiresAt = Date.now() + 60_000;
      binding = {
        async getContext() {
          if (Date.now() >= expiresAt) return { status: "request_context_expired" };
          return preview.getContext?.() ?? { status: "binding_unavailable" };
        },
        async invoke(connectorId, actionName, args) {
          if (Date.now() >= expiresAt) {
            return { status: "request_context_expired", message: "This request has expired. Please try again." };
          }
          return preview.invoke(connectorId, actionName, args);
        },
      };
    }
    return runWithConnectorBinding(binding, () => handler.fetch(request, env, ctx));
  },
};
