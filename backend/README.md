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

## Data flow
- D1: stores trace records.
- R2: archives each posted trace JSON (`traces/YYYY-MM-DD/<id>.json`, best-effort).
- Cookie-based anon user + draft:
  - `bye4o_anon_user`
  - `bye4o_trace_name`
  - `bye4o_trace_draft`
