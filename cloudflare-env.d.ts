declare namespace Cloudflare {
  interface Env {
    DB?: D1Database;
    KIKALMO_ADMIN_PASSWORD?: string;
    KIKALMO_ADMIN_SESSION_SECRET?: string;
    BUCKET?: R2Bucket;
  }
}
