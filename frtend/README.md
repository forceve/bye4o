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
