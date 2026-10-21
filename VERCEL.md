# Vercel preview deployment

Import `nhsgqjy/meeple-corner` at the repository root. The tracked `vercel.json`
selects Vite, builds `pages-dist`, and sets the frontend API base to the same
origin. Do not deploy this repository with the Next.js preset.

Requests to `/api/*` are proxied by Vercel to the existing Cloudflare Worker.
The browser does not connect directly to `workers.dev`. There is no new
database, no data migration, and no need to copy ADMIN_KEY to Vercel.

The frontend uses hash routes (`/#/home`, `/#/library`), so no SPA catch-all
rewrite is needed. API responses must not be cached.

Keep the existing GitHub Pages and Sites URLs while evaluating the preview.
Phone access to the Vercel hostname and interaction save operations must be
verified before changing the main entry point. Preview deployments may require
Vercel authentication depending on the account's deployment protection settings.

Nickname and anonymous identity are browser-origin scoped: on the new hostname,
the same browser may ask for a nickname again and use a new identity. Existing
server data is retained, but personal selections will not automatically transfer.

GitHub Pages continues to use its own workflow API configuration; the Vercel
build settings do not change that deployment.
