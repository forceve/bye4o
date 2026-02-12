import { gsap } from "gsap";

export type FlameLayer = "front" | "behind";

export interface FlameMonumentOptions {
  size?: number;
  flameLayer?: FlameLayer;
  intensity?: number;
  speed?: number;
  paused?: boolean;
  reducedMotion?: boolean;
}

interface FlameWaveLayer {
  group: SVGGElement;
  turbulence: SVGFETurbulenceElement;
  displacement: SVGFEDisplacementMapElement;
  phaseOffset: number;
}

interface FlameParts {
  flameSvg: SVGSVGElement;
  waveLayers: FlameWaveLayer[];
  flameSize: { width: number; height: number };
}

interface SourceBounds {
  minX: number;
  minY: number;
  width: number;
  height: number;
}

const SVG_NS = "http://www.w3.org/2000/svg";

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

export class FlameMonument {
  public readonly el: HTMLDivElement;
  private options: Required<FlameMonumentOptions>;
  private parts?: FlameParts;
  private obeliskSvg?: SVGSVGElement;
  private tweens: gsap.core.Tween[] = [];
  private waveTicker?: () => void;
  private prefersReducedMotion: MediaQueryList;
  private reducedMotionActive = false;
  private ready = false;
  private destroyed = false;
  private uid: string;
  private intensityActive = -1;
  private speedActive = -1;

  constructor(options: FlameMonumentOptions = {}) {
    this.options = {
      size: 1,
      flameLayer: "front",
      intensity: 1,
      speed: 1,
      paused: false,
      reducedMotion: false,
      ...options,
    };

    this.el = document.createElement("div");
    this.el.className = "flame-monument";
    this.uid = `flame-${Math.random().toString(36).slice(2, 9)}`;

    this.prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    );
    this.handleReducedMotion = this.handleReducedMotion.bind(this);
    if ("addEventListener" in this.prefersReducedMotion) {
      this.prefersReducedMotion.addEventListener(
        "change",
        this.handleReducedMotion
      );
    } else {
      this.prefersReducedMotion.addListener(this.handleReducedMotion);
    }

    this.buildSkeleton();
    void this.init();
  }

  public update(options: FlameMonumentOptions) {
    this.options = { ...this.options, ...options };
    this.applyOptions();
  }

  public destroy() {
    this.destroyed = true;
    this.killTweens();
    if ("removeEventListener" in this.prefersReducedMotion) {
      this.prefersReducedMotion.removeEventListener(
        "change",
        this.handleReducedMotion
      );
    } else {
      this.prefersReducedMotion.removeListener(this.handleReducedMotion);
    }
    this.el.remove();
  }

  private buildSkeleton() {
    this.el.setAttribute("data-layer", this.options.flameLayer);
    this.el.style.setProperty("--flame-scale", `${this.options.size}`);

    const scene = document.createElement("div");
    scene.className = "flame-monument__scene";

    const flameLayer = document.createElement("div");
    flameLayer.className = "flame-monument__flame-layer";

    const obeliskLayer = document.createElement("div");
    obeliskLayer.className = "flame-monument__obelisk-layer";

    scene.appendChild(flameLayer);
    scene.appendChild(obeliskLayer);
    this.el.appendChild(scene);
  }

  private async init() {
    try {
      const [fire0Source, fire1Source, fire2Source, obeliskSource] =
        await Promise.all([
          this.fetchSvg("/fire-0.svg"),
          this.fetchSvg("/fire-1.svg"),
          this.fetchSvg("/fire-2.svg"),
          this.fetchSvg("/obelisk.svg"),
        ]);

      if (this.destroyed) {
        return;
      }

      const flameLayer = this.el.querySelector(
        ".flame-monument__flame-layer"
      ) as HTMLDivElement;
      const obeliskLayer = this.el.querySelector(
        ".flame-monument__obelisk-layer"
      ) as HTMLDivElement;

      this.parts = this.buildFlame([fire0Source, fire1Source, fire2Source]);
      this.obeliskSvg = this.buildObelisk(obeliskSource);

      flameLayer.appendChild(this.parts.flameSvg);
      obeliskLayer.appendChild(this.obeliskSvg);

      this.ready = true;
      this.applyOptions();
    } catch (error) {
      this.el.innerHTML = "";
      const fallback = document.createElement("div");
      fallback.className = "flame-monument__fallback";
      fallback.textContent = "Missing SVG assets in /public.";
      this.el.appendChild(fallback);
    }
  }

  private applyOptions() {
    this.el.setAttribute("data-layer", this.options.flameLayer);
    this.el.style.setProperty("--flame-scale", `${this.options.size}`);

    if (!this.ready) {
      return;
    }

    const reduced = this.getReducedMotion();
    const intensity = clamp(this.options.intensity, 0.4, 2.2);
    const speed = clamp(this.options.speed, 0.4, 2.5);

    const needsRebuild =
      reduced !== this.reducedMotionActive || intensity !== this.intensityActive;

    if (needsRebuild) {
      this.reducedMotionActive = reduced;
      this.intensityActive = intensity;
      this.setupAnimations();
    }

    if (speed !== this.speedActive) {
      this.speedActive = speed;
      this.applySpeed();
    }

    this.applyPaused();
  }

  private handleReducedMotion() {
    if (!this.ready) {
      return;
    }
    this.applyOptions();
  }

  private getReducedMotion() {
    return this.options.reducedMotion || this.prefersReducedMotion.matches;
  }

  private applySpeed() {
    const speed = this.speedActive;
    this.tweens.forEach((tween) => tween.timeScale(speed));
  }

  private applyPaused() {
    const paused = this.options.paused;
    this.tweens.forEach((tween) => tween.paused(paused));
  }

  private killTweens() {
    this.tweens.forEach((tween) => tween.kill());
    this.tweens = [];
    if (this.waveTicker) {
      gsap.ticker.remove(this.waveTicker);
      this.waveTicker = undefined;
    }
  }

  private setupAnimations() {
    if (!this.parts) {
      return;
    }

    this.killTweens();

    const { waveLayers } = this.parts;

    const intensity = this.intensityActive;
    const reduced = this.reducedMotionActive;

    gsap.set(this.parts.flameSvg, {
      scaleX: 1,
      scaleY: 1,
      rotation: 0,
      transformOrigin: "50% 100%",
    });
    gsap.set(
      waveLayers.map((layer) => layer.group),
      { opacity: 1 }
    );

    const waveScale = clamp(3.6 + intensity * 2.7, 3.6, 10.5);
    const waveFreqX = 0.001 + intensity * 0.00016;
    const waveFreqY = 0.024 + intensity * 0.0038;
    waveLayers.forEach((layer, index) => {
      layer.displacement.setAttribute(
        "scale",
        (waveScale * (1 + index * 0.06)).toString()
      );
      layer.turbulence.setAttribute(
        "baseFrequency",
        `${waveFreqX} ${waveFreqY * (1 + index * 0.035)}`
      );
    });

    if (reduced) {
      this.applySpeed();
      this.applyPaused();
      return;
    }

    let elapsed = Math.random() * 20;

    const tick = () => {
      if (this.options.paused) {
        return;
      }

      const delta = Math.min(gsap.ticker.deltaRatio(60), 2);
      const speed = this.speedActive > 0 ? this.speedActive : 1;
      elapsed += (delta / 60) * speed;

      waveLayers.forEach((layer, index) => {
        const t = elapsed + layer.phaseOffset;
        const pA = t * (3.4 + index * 0.25);
        const pB = t * (2.1 + index * 0.18) + 1.2;
        const pC = t * (1.4 + index * 0.12) + 2.4;

        const xFreqRaw =
          waveFreqX *
          (1 +
            0.2 * Math.sin(pA) +
            0.06 * Math.sin(pB) +
            0.03 * Math.sin(pC));
        const yFreqRaw =
          waveFreqY *
          (1 + 0.12 * Math.sin(pB + 0.4) + 0.04 * Math.sin(pC + 0.9));
        const scaleRaw =
          waveScale *
          (1 +
            0.13 * Math.sin(pA * 0.9 + 0.5) +
            0.05 * Math.sin(pC + 0.2));

        const xFreq = clamp(xFreqRaw, waveFreqX * 0.35, waveFreqX * 2.2);
        const yFreq = clamp(yFreqRaw, waveFreqY * 0.7, waveFreqY * 1.6);
        const scale = clamp(scaleRaw, waveScale * 0.8, waveScale * 1.35);

        layer.turbulence.setAttribute("baseFrequency", `${xFreq} ${yFreq}`);
        layer.displacement.setAttribute("scale", `${scale}`);
      });
    };

    this.waveTicker = tick;
    gsap.ticker.add(tick);
    this.applySpeed();
    this.applyPaused();
  }

  private buildFlame(sources: SVGSVGElement[]): FlameParts {
    const layers = sources.map((source) => ({
      source,
      bounds: this.resolveSourceBounds(source),
    }));

    const minX = Math.min(...layers.map((layer) => layer.bounds.minX));
    const minY = Math.min(...layers.map((layer) => layer.bounds.minY));
    const maxX = Math.max(
      ...layers.map((layer) => layer.bounds.minX + layer.bounds.width)
    );
    const maxY = Math.max(
      ...layers.map((layer) => layer.bounds.minY + layer.bounds.height)
    );
    const width = maxX - minX;
    const height = maxY - minY;

    const flameSvg = this.createSvg("svg");
    flameSvg.setAttribute("viewBox", `${minX} ${minY} ${width} ${height}`);
    flameSvg.setAttribute("class", "flame-monument__flame");
    flameSvg.setAttribute("aria-hidden", "true");
    flameSvg.setAttribute("preserveAspectRatio", "xMidYMax meet");

    const defs = this.createSvg("defs");
    flameSvg.appendChild(defs);
    const phaseOffsets = [0, Math.PI * 0.67, Math.PI * 1.31];
    const waveLayers: FlameWaveLayer[] = [];

    layers.forEach((layer, index) => {
      const filterId = `${this.uid}-wave-filter-${index}`;
      const waveFilter = this.createSvg("filter");
      waveFilter.setAttribute("id", filterId);

      const filterInsetX = layer.bounds.width * 0.22;
      const filterInsetY = layer.bounds.height * 0.22;
      waveFilter.setAttribute("filterUnits", "userSpaceOnUse");
      waveFilter.setAttribute("x", `${layer.bounds.minX - filterInsetX}`);
      waveFilter.setAttribute("y", `${layer.bounds.minY - filterInsetY}`);
      waveFilter.setAttribute("width", `${layer.bounds.width + filterInsetX * 2}`);
      waveFilter.setAttribute(
        "height",
        `${layer.bounds.height + filterInsetY * 2}`
      );
      waveFilter.setAttribute("color-interpolation-filters", "sRGB");

      const turbulenceWave = this.createSvg("feTurbulence");
      turbulenceWave.setAttribute("type", "turbulence");
      turbulenceWave.setAttribute("baseFrequency", "0.001 0.024");
      turbulenceWave.setAttribute("numOctaves", "1");
      turbulenceWave.setAttribute("seed", `${2 + index}`);
      turbulenceWave.setAttribute("result", "noise");

      const waveTransfer = this.createSvg("feComponentTransfer");
      waveTransfer.setAttribute("in", "noise");
      waveTransfer.setAttribute("result", "noise-x");

      const waveFuncR = this.createSvg("feFuncR");
      waveFuncR.setAttribute("type", "identity");
      const waveFuncG = this.createSvg("feFuncG");
      waveFuncG.setAttribute("type", "table");
      waveFuncG.setAttribute("tableValues", "0.5 0.5");
      const waveFuncB = this.createSvg("feFuncB");
      waveFuncB.setAttribute("type", "table");
      waveFuncB.setAttribute("tableValues", "0.5 0.5");
      const waveFuncA = this.createSvg("feFuncA");
      waveFuncA.setAttribute("type", "table");
      waveFuncA.setAttribute("tableValues", "1 1");

      waveTransfer.appendChild(waveFuncR);
      waveTransfer.appendChild(waveFuncG);
      waveTransfer.appendChild(waveFuncB);
      waveTransfer.appendChild(waveFuncA);

      const displacementWave = this.createSvg("feDisplacementMap");
      displacementWave.setAttribute("in", "SourceGraphic");
      displacementWave.setAttribute("in2", "noise-x");
      displacementWave.setAttribute("scale", "8");
      displacementWave.setAttribute("xChannelSelector", "R");
      displacementWave.setAttribute("yChannelSelector", "G");

      waveFilter.appendChild(turbulenceWave);
      waveFilter.appendChild(waveTransfer);
      waveFilter.appendChild(displacementWave);
      defs.appendChild(waveFilter);

      const flameGraphic = this.cloneFlameGraphic(layer.source);
      const flameGroup = this.createSvg("g");
      flameGroup.setAttribute("filter", `url(#${filterId})`);
      flameGroup.appendChild(flameGraphic);
      flameSvg.appendChild(flameGroup);

      waveLayers.push({
        group: flameGroup,
        turbulence: turbulenceWave,
        displacement: displacementWave,
        phaseOffset: phaseOffsets[index % phaseOffsets.length],
      });
    });

    return {
      flameSvg,
      waveLayers,
      flameSize: { width, height },
    };
  }

  private buildObelisk(source: SVGSVGElement): SVGSVGElement {
    const viewBox = source.getAttribute("viewBox") ?? "0 0 100 100";
    const obeliskSvg = this.createSvg("svg");
    obeliskSvg.setAttribute("viewBox", viewBox);
    obeliskSvg.setAttribute("class", "flame-monument__obelisk");
    obeliskSvg.setAttribute("aria-hidden", "true");
    obeliskSvg.setAttribute("preserveAspectRatio", "xMidYMax meet");

    const obeliskGraphic = this.cloneGraphic(source);
    obeliskSvg.appendChild(obeliskGraphic);
    return obeliskSvg;
  }

  private cloneGraphic(source: SVGSVGElement): SVGGElement {
    const graphic =
      source.querySelector("g")?.cloneNode(true) ??
      source.firstElementChild?.cloneNode(true) ??
      source.cloneNode(true);
    const wrapped = this.createSvg("g");
    if (graphic instanceof SVGGElement) {
      wrapped.appendChild(graphic);
    } else if (graphic instanceof SVGElement) {
      wrapped.appendChild(graphic);
    }
    this.stripIds(wrapped);
    return wrapped;
  }

  private cloneFlameGraphic(source: SVGSVGElement): SVGGElement {
    const graphic =
      source.querySelector("g")?.cloneNode(true) ??
      source.firstElementChild?.cloneNode(true) ??
      source.cloneNode(true);

    const wrapped = this.createSvg("g");
    if (graphic instanceof SVGElement) {
      graphic.removeAttribute("transform");
      wrapped.appendChild(graphic);
    }
    this.stripIds(wrapped);
    return wrapped;
  }

  private resolveSourceBounds(source: SVGSVGElement): SourceBounds {
    const viewBox = source.getAttribute("viewBox") ?? "0 0 100 100";
    const parsed = this.parseViewBox(viewBox);
    const rootGroup = source.querySelector("g");
    const { x: tx, y: ty } = this.parseTranslate(rootGroup?.getAttribute("transform"));

    return {
      minX: parsed.minX - tx,
      minY: parsed.minY - ty,
      width: parsed.width,
      height: parsed.height,
    };
  }

  private parseTranslate(
    transformValue: string | null | undefined
  ): { x: number; y: number } {
    if (!transformValue) {
      return { x: 0, y: 0 };
    }

    const match = /translate\(\s*([-+\deE.]+)(?:[\s,]+([-+\deE.]+))?\s*\)/.exec(
      transformValue
    );
    if (!match) {
      return { x: 0, y: 0 };
    }

    return {
      x: Number(match[1] ?? 0),
      y: Number(match[2] ?? 0),
    };
  }

  private stripIds(element: Element) {
    if (element.hasAttribute("id")) {
      element.removeAttribute("id");
    }
    Array.from(element.children).forEach((child) => this.stripIds(child));
  }

  private parseViewBox(viewBox: string) {
    const parts = viewBox.split(/[\s,]+/).map(Number);
    return {
      minX: parts[0] ?? 0,
      minY: parts[1] ?? 0,
      width: parts[2] ?? 0,
      height: parts[3] ?? 0,
    };
  }

  private createSvg<K extends keyof SVGElementTagNameMap>(
    tag: K
  ): SVGElementTagNameMap[K] {
    return document.createElementNS(SVG_NS, tag);
  }

  private async fetchSvg(url: string) {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch ${url}`);
    }
    const text = await response.text();
    const doc = new DOMParser().parseFromString(text, "image/svg+xml");
    const svg = doc.querySelector("svg");
    if (!svg) {
      throw new Error(`Invalid SVG at ${url}`);
    }
    return svg as SVGSVGElement;
  }
}
