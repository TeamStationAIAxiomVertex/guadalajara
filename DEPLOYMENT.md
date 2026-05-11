# Sonia McRorey Guadalajara Deployment

## Cloudflare Pages settings

- Framework preset: None
- Build command: `npm run build`
- Build output directory: `dist`
- Root directory: `/`
- Production branch: `main`
- Production domain: `https://imagengdl.com`

## DNS expectation

- `imagengdl.com` should resolve to the Cloudflare Pages custom domain.
- `www.imagengdl.com` should either redirect to `https://imagengdl.com` or be consistently configured as an alias. Do not allow duplicate canonical versions.
- Canonical stays `https://imagengdl.com` unless explicitly changed.

## Build pipeline

The production build validates source SEO, creates a fresh static `dist` directory, and then validates the built artifact before Cloudflare Pages publishes it.

```bash
npm run build
```

Build steps:

1. `npm run validate:seo`
2. `npm run build:static`
3. `npm run validate:dist`

Launch note: if the production domain ever changes, update `SITE_URL` in `site.config.mjs` before deployment and rerun `npm run build`.
