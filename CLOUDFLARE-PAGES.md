# Cloudflare Pages trial

The Pages deployment serves the static catalog and images. Only `/api/*` runs
the Pages proxy, which forwards requests to the existing interaction Worker.
The browser uses same-origin API URLs. Existing D1 data and admin secrets stay
in the original Worker; no migration or new database is needed.

Build from the repository root:

```sh
node scripts/build-cloudflare-pages.mjs
```

Deploy only the generated `pages-dist` directory (never the repository root):

```sh
node scripts/run-cloudflare.mjs pages deploy pages-dist --project-name meeple-corner --branch main
```

For Git-connected Pages builds, use the same build command and `pages-dist`
as the output directory, with Node.js 22 or newer. This trial is initially
uploaded through Wrangler. The GitHub Actions workflow
`.github/workflows/deploy-cloudflare-pages.yml` deploys `main` automatically
once the repository Actions secret `CLOUDFLARE_API_TOKEN` is configured.
Use an account-scoped token with Cloudflare Pages Edit permission only.
Never commit its value. The account ID is public configuration in the workflow.
The GitHub token has contents-read permission only. This workflow updates the
frontend/proxy; it does not deploy changes to the standalone interaction Worker.

The `_routes.json` limits function execution to API paths. API responses have
`Cache-Control: no-store`. The upstream hostname is fixed and cannot be selected
by visitors. Network failures produce a JSON 503 response.

Keep existing entry points until actual phone access is confirmed. A new
hostname has a separate browser identity, so it may ask for a nickname again.
