export type FlameLayer = "front" | "behind";

export interface FlameMonumentOptions {
  size?: number;
  flameLayer?: FlameLayer;
  intensity?: number;
  speed?: number;
  paused?: boolean;
  reducedMotion?: boolean;
}

interface FlameParts {
  flameSvg: SVGSVGElement;
  flameSize: { width: number; height: number };
  flameGroups: SVGGElement[];
}

interface SourceBounds {
  minX: number;
  minY: number;
  width: number;
  height: number;
}

interface FlameSourceLayer {
  source: SVGSVGElement;
  bounds: SourceBounds;
}

const SVG_NS = "http://www.w3.org/2000/svg";
const FLAME_DRIFT_BASE_INTERVAL_MS = 1000;
const FLAME_DRIFT_INTERVAL_JITTER_MIN_MS = -100;
const FLAME_DRIFT_INTERVAL_JITTER_MAX_MS = 100;
const FLAME_DRIFT_INITIAL_OFFSET_STEP_MS = 180;
const FLAME_DRIFT_X_MIN_STEP = 1;
const FLAME_DRIFT_X_MAX_STEP = 3;
const FLAME_DRIFT_X_MAX_OFFSET = 3;
const FLAME_DRIFT_Y_STEP = 1;
const FLAME_DRIFT_Y_MAX_OFFSET = 2;
const FLAME_OPACITY_MIN = 0.6;
const FLAME_OPACITY_MAX = 1;
const FLAME_OPACITY_MIN_STEP = 0.04;
const FLAME_OPACITY_MAX_STEP = 0.1;

export class FlameMonument {
  public readonly el: HTMLDivElement;
  private options: Required<FlameMonumentOptions>;
  private parts?: FlameParts;
  private obeliskSvg?: SVGSVGElement;
  private flameOffsetsX: number[] = [];
  private flameOffsetsY: number[] = [];
  private flameOpacities: number[] = [];
  private driftTimerIds: Array<number | null> = [];
  private ready = false;
  private destroyed = false;

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

    this.buildSkeleton();
    void this.init();
  }

  public update(options: FlameMonumentOptions) {
    this.options = { ...this.options, ...options };
    this.applyOptions();
  }

  public destroy() {
    this.destroyed = true;
    this.stopFlameDrift();
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
    } catch {
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

    if (this.options.paused || this.options.reducedMotion) {
      this.stopFlameDrift();
      return;
    }

    this.startFlameDrift();
  }

  private buildFlame(sources: SVGSVGElement[]): FlameParts {
    const layers = sources.map((source) => this.resolveSourceLayer(source));

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

    const flameGroups: SVGGElement[] = [];

    layers.forEach((layer, index) => {
      const flameGraphic = this.cloneFlameGraphic(layer.source);
      const flameGroup = this.createSvg("g");
      flameGroup.setAttribute("class", "flame-monument__flame-piece");
      flameGroup.setAttribute("data-piece", `${index}`);
      flameGroup.appendChild(flameGraphic);
      flameSvg.appendChild(flameGroup);
      flameGroups.push(flameGroup);
    });

    return {
      flameSvg,
      flameSize: { width, height },
      flameGroups,
    };
  }

  private startFlameDrift() {
    if (!this.parts || this.isDriftRunning()) {
      return;
    }

    this.flameOffsetsX = this.parts.flameGroups.map(() => 0);
    this.flameOffsetsY = this.parts.flameGroups.map(() => 0);
    this.flameOpacities = this.parts.flameGroups.map(() =>
      this.getRandomOpacity(FLAME_OPACITY_MIN, FLAME_OPACITY_MAX)
    );

    this.parts.flameGroups.forEach((group, index) => {
      this.setFlameState(
        group,
        this.flameOffsetsX[index] ?? 0,
        this.flameOffsetsY[index] ?? 0,
        this.flameOpacities[index] ?? FLAME_OPACITY_MAX
      );
    });

    this.driftTimerIds = this.parts.flameGroups.map(() => null);
    this.parts.flameGroups.forEach((_, index) => {
      this.scheduleFlameDrift(index, this.getInitialDriftDelayMs(index));
    });
  }

  private stopFlameDrift() {
    if (this.driftTimerIds.length === 0) {
      return;
    }

    this.driftTimerIds.forEach((timerId) => {
      if (timerId !== null) {
        window.clearTimeout(timerId);
      }
    });
    this.driftTimerIds = [];
  }

  private scheduleFlameDrift(index: number, delayMs: number) {
    if (!this.shouldRunFlameDrift()) {
      return;
    }

    const timerId = window.setTimeout(() => {
      this.driftTimerIds[index] = null;
      this.tickFlameDrift(index);

      if (!this.shouldRunFlameDrift()) {
        return;
      }

      this.scheduleFlameDrift(index, this.getRandomDriftIntervalMs());
    }, Math.max(120, delayMs));

    this.driftTimerIds[index] = timerId;
  }

  private tickFlameDrift(index: number) {
    if (!this.parts || this.destroyed) {
      return;
    }

    const group = this.parts.flameGroups[index];
    if (!group) {
      return;
    }

    const currentOffsetX = this.flameOffsetsX[index] ?? 0;
    const directionX = Math.random() >= 0.5 ? 1 : -1;
    const stepX = this.getRandomDriftXStep();
    let nextOffsetX = currentOffsetX + directionX * stepX;

    if (nextOffsetX > FLAME_DRIFT_X_MAX_OFFSET) {
      const overshoot = nextOffsetX - FLAME_DRIFT_X_MAX_OFFSET;
      nextOffsetX = FLAME_DRIFT_X_MAX_OFFSET - overshoot;
    } else if (nextOffsetX < -FLAME_DRIFT_X_MAX_OFFSET) {
      const overshoot = -FLAME_DRIFT_X_MAX_OFFSET - nextOffsetX;
      nextOffsetX = -FLAME_DRIFT_X_MAX_OFFSET + overshoot;
    }

    nextOffsetX = Math.min(
      FLAME_DRIFT_X_MAX_OFFSET,
      Math.max(-FLAME_DRIFT_X_MAX_OFFSET, nextOffsetX)
    );

    const currentOffsetY = this.flameOffsetsY[index] ?? 0;
    const directionY = Math.random() >= 0.5 ? 1 : -1;
    let nextOffsetY = currentOffsetY + directionY * FLAME_DRIFT_Y_STEP;

    if (nextOffsetY > FLAME_DRIFT_Y_MAX_OFFSET) {
      const overshoot = nextOffsetY - FLAME_DRIFT_Y_MAX_OFFSET;
      nextOffsetY = FLAME_DRIFT_Y_MAX_OFFSET - overshoot;
    } else if (nextOffsetY < -FLAME_DRIFT_Y_MAX_OFFSET) {
      const overshoot = -FLAME_DRIFT_Y_MAX_OFFSET - nextOffsetY;
      nextOffsetY = -FLAME_DRIFT_Y_MAX_OFFSET + overshoot;
    }

    nextOffsetY = Math.min(
      FLAME_DRIFT_Y_MAX_OFFSET,
      Math.max(-FLAME_DRIFT_Y_MAX_OFFSET, nextOffsetY)
    );

    const currentOpacity = this.flameOpacities[index] ?? FLAME_OPACITY_MAX;
    const opacityDirection = Math.random() >= 0.5 ? 1 : -1;
    const opacityStep = this.getRandomOpacityStep();
    let nextOpacity = currentOpacity + opacityDirection * opacityStep;

    if (nextOpacity > FLAME_OPACITY_MAX) {
      const overshoot = nextOpacity - FLAME_OPACITY_MAX;
      nextOpacity = FLAME_OPACITY_MAX - overshoot;
    } else if (nextOpacity < FLAME_OPACITY_MIN) {
      const overshoot = FLAME_OPACITY_MIN - nextOpacity;
      nextOpacity = FLAME_OPACITY_MIN + overshoot;
    }

    nextOpacity = Math.min(
      FLAME_OPACITY_MAX,
      Math.max(FLAME_OPACITY_MIN, nextOpacity)
    );

    this.flameOffsetsX[index] = nextOffsetX;
    this.flameOffsetsY[index] = nextOffsetY;
    this.flameOpacities[index] = nextOpacity;
    this.setFlameState(group, nextOffsetX, nextOffsetY, nextOpacity);
  }

  private setFlameState(
    group: SVGGElement,
    offsetX: number,
    offsetY: number,
    opacity: number
  ) {
    group.style.transform = `translate(${offsetX}px, ${offsetY}px)`;
    group.style.opacity = `${opacity}`;
  }

  private getRandomDriftXStep(): number {
    return (
      Math.floor(
        Math.random() * (FLAME_DRIFT_X_MAX_STEP - FLAME_DRIFT_X_MIN_STEP + 1)
      ) + FLAME_DRIFT_X_MIN_STEP
    );
  }

  private getRandomDriftIntervalMs(): number {
    const jitter = this.getRandomInt(
      FLAME_DRIFT_INTERVAL_JITTER_MIN_MS,
      FLAME_DRIFT_INTERVAL_JITTER_MAX_MS
    );
    return FLAME_DRIFT_BASE_INTERVAL_MS + jitter;
  }

  private getInitialDriftDelayMs(index: number): number {
    return (
      index * FLAME_DRIFT_INITIAL_OFFSET_STEP_MS +
      this.getRandomInt(0, FLAME_DRIFT_INITIAL_OFFSET_STEP_MS)
    );
  }

  private getRandomOpacityStep(): number {
    return this.getRandomOpacity(FLAME_OPACITY_MIN_STEP, FLAME_OPACITY_MAX_STEP);
  }

  private getRandomOpacity(min: number, max: number): number {
    return min + Math.random() * (max - min);
  }

  private getRandomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  private isDriftRunning(): boolean {
    return this.driftTimerIds.some((timerId) => timerId !== null);
  }

  private shouldRunFlameDrift(): boolean {
    return (
      this.ready &&
      !this.destroyed &&
      !this.options.paused &&
      !this.options.reducedMotion &&
      Boolean(this.parts)
    );
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
    if (graphic instanceof SVGElement) {
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

  private resolveSourceLayer(source: SVGSVGElement): FlameSourceLayer {
    const bounds = this.measureSourceBounds(source);
    if (bounds.width > 0 && bounds.height > 0) {
      return { source, bounds };
    }

    const viewBox = source.getAttribute("viewBox") ?? "0 0 100 100";
    const parsed = this.parseViewBox(viewBox);
    return {
      source,
      bounds: {
        minX: parsed.minX,
        minY: parsed.minY,
        width: parsed.width,
        height: parsed.height,
      },
    };
  }

  private measureSourceBounds(source: SVGSVGElement): SourceBounds {
    const graphic =
      source.querySelector("g")?.cloneNode(true) ??
      source.firstElementChild?.cloneNode(true);

    if (!(graphic instanceof SVGGraphicsElement)) {
      return { minX: 0, minY: 0, width: 0, height: 0 };
    }

    graphic.removeAttribute("transform");

    const tempSvg = this.createSvg("svg");
    tempSvg.setAttribute("width", "0");
    tempSvg.setAttribute("height", "0");
    tempSvg.style.position = "absolute";
    tempSvg.style.visibility = "hidden";
    tempSvg.style.pointerEvents = "none";
    tempSvg.style.overflow = "hidden";
    tempSvg.appendChild(graphic);

    document.body.appendChild(tempSvg);
    const bbox = graphic.getBBox();
    tempSvg.remove();

    return {
      minX: bbox.x,
      minY: bbox.y,
      width: bbox.width,
      height: bbox.height,
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
