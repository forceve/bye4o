# Flame Monument Landing

Landing page with a reusable `FlameMonument` component that combines
`obelisk.svg` and `flame.svg` into a layered SVG animation.

## Setup
1. `npm install`
2. `npm run dev`

## API config
`embers` 页面通过 `VITE_API_BASE` 请求后端。

1. 复制 `.env.example` 为 `.env`
2. 设置：
   - `VITE_API_BASE=http://127.0.0.1:8787`（本地 wrangler dev）
   - 若前后端同域可留空

## Component Usage
```ts
import { FlameMonument } from "./components/FlameMonument";

const monument = new FlameMonument({
  size: 1,
  flameLayer: "front",
  intensity: 1,
  speed: 1,
  paused: false,
  reducedMotion: false,
});

document.getElementById("slot")?.appendChild(monument.el);

// Update options later
monument.update({ intensity: 1.2, flameLayer: "behind" });
```

## Options
- `size`: number (overall scale)
- `flameLayer`: `"front"` | `"behind"`
- `intensity`: number (displacement strength, glow amplitude, spark density)
- `speed`: number (global animation speed multiplier)
- `paused`: boolean
- `reducedMotion`: boolean (also respects `prefers-reduced-motion`)

## Pages Gateway (forward mode)
This project now includes a Pages Function gateway at `functions/[[path]].ts`.

- Required env:
  - `WORKER_ORIGIN=https://api.bye4o.org`
- Optional env:
  - `GATEWAY_PROXY_ALL=1` to proxy all paths to Worker

Default behavior (without `GATEWAY_PROXY_ALL=1`):
- Proxy to Worker:
  - `/api/*`
  - `/carvings/articles`
  - `/zh/carvings/articles`
  - `/en/carvings/articles`
  - `/articles/:id`
  - `/zh/articles/:id`
  - `/en/articles/:id`
- Other paths continue to static assets / SPA.
