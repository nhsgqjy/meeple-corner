declare namespace Cloudflare {
  interface Env {
    DB?: D1Database;
    BUCKET?: R2Bucket;
    ADMIN_KEY?: string;
  }
}

declare namespace Cloudflare { interface Env { PUBLIC_ORIGIN?: string; } }
