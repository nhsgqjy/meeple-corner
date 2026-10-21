declare namespace Cloudflare {
  interface Env {
    DB?: D1Database;
    BUCKET?: R2Bucket;
    ADMIN_KEY?: string;
    INTERACTION_API_BASE?: string;
    INTERACTION_READ_ONLY?: string;
  }
}

declare namespace Cloudflare { interface Env { PUBLIC_ORIGIN?: string; } }
