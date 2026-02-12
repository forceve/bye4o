# bye4o backend (Cloudflare Workers, pure D1)

## Quick start
1. `npm install`
2. Update `wrangler.toml`:
   - `d1_databases[].database_id`
   - `vars.CORS_ORIGIN`
3. Run migrations:
   - local: `npm run migrate:local`
   - remote: `npm run migrate:remote`
4. Start worker:
   - `npm run dev`

## Auto-migration on deploy
- `npm run deploy` automatically runs remote D1 migrations first:
  - `predeploy -> npm run migrate:remote`
  - then `wrangler deploy`

## API
- `GET /api/health`
- `GET /api/embers?limit=20&cursor=<base64url>`
- `POST /api/embers`
  - body: `{ "displayName"?: string, "message": string }`
- `GET /api/embers/session`
- `PUT /api/embers/session`
  - body: `{ "displayName"?: string, "message"?: string }`
- `GET /api/articles?locale=zh|en`
- `GET /api/articles/:id?locale=zh|en`

## Data model
- `embers` table: user ember messages.
- `articles` table: article list/detail content.
  - `tags_json` stores string array JSON.
  - `links_json` stores `[{label, href, description?}]`.
  - `sections_json` stores `[{id, heading, paragraphs[]}]`.

## Article seeding example
```sql
INSERT OR REPLACE INTO articles (
  id, locale, title, summary, published_at, updated_at, read_minutes, category,
  tags_json, author_name, author_role, author_profile_url, links_json, sections_json
) VALUES (
  'gpt-4o-event-record',
  'zh',
  '“我希望它快点死”——GPT-4o事件全记录',
  '一份按时间线整理的事件记录。',
  '2026-02-04T00:00:00.000Z',
  '2026-02-05T00:00:00.000Z',
  8,
  'Archive',
  '["事件","记录"]',
  'bye4o',
  'Editor',
  NULL,
  '[]',
  '[{"id":"sec-1","heading":"背景","paragraphs":["这里是正文第一段。"]}]'
);
```

## Cookies
- `bye4o_anon_user`
- `bye4o_ember_name`
- `bye4o_ember_draft`
