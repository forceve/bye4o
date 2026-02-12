# bye4o backend (Cloudflare Workers)

## Quick start
1. `npm install`
2. Update `wrangler.toml`:
   - `d1_databases[].database_id`
   - `r2_buckets[].bucket_name` (optional but recommended)
   - `vars.CORS_ORIGIN`
3. Run migration:
   - `npx wrangler d1 migrations apply bye4o --local`
4. Start worker:
   - `npm run dev`

## Auto-migration on deploy
- `npm run deploy` will auto run D1 remote migrations first:
  - `predeploy -> npm run migrate:remote`
  - then `wrangler deploy`

## Traces API
- `GET /api/health`
- `GET /api/traces?limit=20&cursor=<base64url>`
- `POST /api/traces`
  - body: `{ "displayName"?: string, "message": string }`
- `GET /api/traces/session`
- `PUT /api/traces/session`
  - body: `{ "displayName"?: string, "message"?: string }`

## Articles API
- `GET /api/articles?locale=zh|en`
- `GET /api/articles/:id?locale=zh|en`

### R2 naming rule (no D1 needed)
- Place article objects under the `articles/<lang>/` prefix.
- Supported formats:
  - Markdown: `articles/<lang>/<id>.md` (with optional YAML front matter)
  - JSON: `articles/<lang>/<id>.json`
- `<lang>` is `zh` or `en`.
- `<id>` becomes the route id: `/articles/<id>`.
- List endpoint scans `articles/<lang>/` and builds metadata from each object.
- If `locale` is omitted, backend will infer from `Accept-Language` (defaults to `zh`).
- Compatibility fallback: for `zh`, legacy flat keys `articles/<id>.*` are still readable.

Example upload:
```bash
npx wrangler r2 object put bye4o/articles/zh/gpt-4o-event-record.md --file ../frtend/public/_我希望它快点死_——GPT-4o事件全记录.md
```

### Markdown front matter (optional fields)
```yaml
---
title: ...
summary: ...
date: 2026-02-04
updatedAt: 2026-02-05
category: Archive
tags: [tag-a, tag-b]
author:
  - Alice
authorRole: Editor
authorUrl: https://example.com
twitter: https://x.com/...
github: https://github.com/...
rednote: ...
---
```

## Data flow
- D1: stores trace records.
- R2: archives each posted trace JSON (`traces/YYYY-MM-DD/<id>.json`, best-effort).
- R2: stores articles under `articles/` (uses `ARTICLE_ARCHIVE`, falls back to `TRACE_ARCHIVE`).
- Cookie-based anon user + draft:
  - `bye4o_anon_user`
  - `bye4o_trace_name`
  - `bye4o_trace_draft`
