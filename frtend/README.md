# Flame Monument Landing

Landing page with a reusable `FlameMonument` component that combines
`obelisk.svg` and `flame.svg` into a layered SVG animation.

## Setup
1. `npm install`
2. `npm run dev`

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
