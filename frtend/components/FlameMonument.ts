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

interface FlameParts {
  flameSvg: SVGSVGElement;
  sparkSvg: SVGSVGElement;
  baseGroup: SVGGElement;
  highlightGroup: SVGGElement;
  fadeRect: SVGRectElement;
  highlightRect: SVGRectElement;
  turbulenceBase: SVGFETurbulenceElement;
  turbulenceHighlight: SVGFETurbulenceElement;
  turbulenceMask: SVGFETurbulenceElement;
  displacementBase: SVGFEDisplacementMapElement;
  displacementHighlight: SVGFEDisplacementMapElement;
  sparkGroup: SVGGElement;
  sparkElements: SVGPathElement[];
  flameSize: { width: number; height: number };
}

const SVG_NS = "http://www.w3.org/2000/svg";

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const randomInRange = (min: number, max: number) =>
  min + Math.random() * (max - min);

export class FlameMonument {
  public readonly el: HTMLDivElement;
  private options: Required<FlameMonumentOptions>;
  private parts?: FlameParts;
  private obeliskSvg?: SVGSVGElement;
  private tweens: gsap.core.Tween[] = [];
  private sparkTweens: gsap.core.Tween[] = [];
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
      const [flameSource, obeliskSource] = await Promise.all([
        this.fetchSvg("/flame.svg"),
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

      this.parts = this.buildFlame(flameSource);
      this.obeliskSvg = this.buildObelisk(obeliskSource);

      flameLayer.appendChild(this.parts.flameSvg);
      flameLayer.appendChild(this.parts.sparkSvg);
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
    this.sparkTweens.forEach((tween) => tween.timeScale(speed));
  }

  private applyPaused() {
    const paused = this.options.paused;
    this.tweens.forEach((tween) => tween.paused(paused));
    this.sparkTweens.forEach((tween) => tween.paused(paused));
  }

  private killTweens() {
    this.tweens.forEach((tween) => tween.kill());
    this.tweens = [];
    this.sparkTweens.forEach((tween) => tween.kill());
    this.sparkTweens = [];
  }

  private setupAnimations() {
    if (!this.parts) {
      return;
    }

    this.killTweens();

    const {
      baseGroup,
      highlightGroup,
      fadeRect,
      highlightRect,
      turbulenceBase,
      turbulenceHighlight,
      turbulenceMask,
      displacementBase,
      displacementHighlight,
      sparkSvg,
      sparkElements,
      flameSize,
    } = this.parts;

    const intensity = this.intensityActive;
    const reduced = this.reducedMotionActive;

    const baseScale = 8 + intensity * 6;
    const highlightScale = 4 + intensity * 4;
    displacementBase.setAttribute("scale", baseScale.toFixed(2));
    displacementHighlight.setAttribute("scale", highlightScale.toFixed(2));

    if (reduced) {
      gsap.set(this.parts.flameSvg, { scaleX: 1, scaleY: 1 });
      gsap.set(baseGroup, { opacity: 0.95 });
      gsap.set(highlightGroup, { opacity: 0.35 });
      displacementBase.setAttribute("scale", "0");
      displacementHighlight.setAttribute("scale", "0");
      sparkSvg.style.opacity = "0";
      sparkElements.forEach((spark) => {
        spark.style.opacity = "0";
      });

      const softBreath = gsap.to(baseGroup, {
        opacity: 0.96,
        duration: 2.4,
        yoyo: true,
        repeat: -1,
        ease: "sine.inOut",
      });
      const highlightBreath = gsap.to(highlightGroup, {
        opacity: 0.35,
        duration: 2.8,
        yoyo: true,
        repeat: -1,
        ease: "sine.inOut",
      });
      this.tweens.push(softBreath, highlightBreath);
      this.applySpeed();
      this.applyPaused();
      return;
    }

    sparkSvg.style.opacity = "1";
    gsap.set(baseGroup, { opacity: 0.92 });
    gsap.set(highlightGroup, { opacity: 0.55 });

    const baseFreqX = 0.012 + intensity * 0.002;
    const baseFreqY = 0.05 + intensity * 0.008;
    const highlightFreqX = 0.018 + intensity * 0.003;
    const highlightFreqY = 0.09 + intensity * 0.01;
    const maskFreq = 0.4 + intensity * 0.08;

    turbulenceBase.setAttribute(
      "baseFrequency",
      `${baseFreqX.toFixed(3)} ${baseFreqY.toFixed(3)}`
    );
    turbulenceHighlight.setAttribute(
      "baseFrequency",
      `${highlightFreqX.toFixed(3)} ${highlightFreqY.toFixed(3)}`
    );
    turbulenceMask.setAttribute(
      "baseFrequency",
      `${maskFreq.toFixed(3)}`
    );

    const baseNoise = gsap.to(turbulenceBase, {
      attr: {
        baseFrequency: `${(baseFreqX * 1.3).toFixed(3)} ${(
          baseFreqY * 1.2
        ).toFixed(3)}`,
      },
      duration: 2.2,
      yoyo: true,
      repeat: -1,
      ease: "sine.inOut",
    });

    const highlightNoise = gsap.to(turbulenceHighlight, {
      attr: {
        baseFrequency: `${(highlightFreqX * 1.2).toFixed(3)} ${(
          highlightFreqY * 1.15
        ).toFixed(3)}`,
      },
      duration: 1.8,
      yoyo: true,
      repeat: -1,
      ease: "sine.inOut",
    });

    const maskNoise = gsap.to(turbulenceMask, {
      attr: {
        baseFrequency: `${(maskFreq * 0.9).toFixed(3)}`,
      },
      duration: 3.2,
      yoyo: true,
      repeat: -1,
      ease: "sine.inOut",
    });

    const seedPulse = gsap.to(turbulenceBase, {
      duration: 0.01,
      repeat: -1,
      repeatDelay: 0.7,
      onRepeat: () => {
        turbulenceBase.setAttribute(
          "seed",
          `${Math.floor(randomInRange(1, 30))}`
        );
      },
    });

    const seedHighlight = gsap.to(turbulenceHighlight, {
      duration: 0.01,
      repeat: -1,
      repeatDelay: 0.6,
      onRepeat: () => {
        turbulenceHighlight.setAttribute(
          "seed",
          `${Math.floor(randomInRange(1, 30))}`
        );
      },
    });

    const displacementPulse = gsap.to(displacementBase, {
      attr: { scale: (baseScale * 1.2).toFixed(2) },
      duration: 2.6,
      yoyo: true,
      repeat: -1,
      ease: "sine.inOut",
    });

    const highlightDisplacement = gsap.to(displacementHighlight, {
      attr: { scale: (highlightScale * 1.3).toFixed(2) },
      duration: 2.1,
      yoyo: true,
      repeat: -1,
      ease: "sine.inOut",
    });

    const fadeTravel = gsap.to(fadeRect, {
      attr: { y: -(flameSize.height * 0.25).toFixed(2) },
      duration: 2.8,
      repeat: -1,
      ease: "none",
    });

    const highlightTravel = gsap.to(highlightRect, {
      attr: { y: -(flameSize.height * 0.5).toFixed(2) },
      duration: 2.2,
      repeat: -1,
      ease: "none",
    });

    const breathing = gsap.to(baseGroup, {
      opacity: clamp(0.88 + intensity * 0.04, 0.88, 0.98),
      duration: 1.6,
      yoyo: true,
      repeat: -1,
      ease: "sine.inOut",
    });

    const highlightBreathing = gsap.to(highlightGroup, {
      opacity: clamp(0.45 + intensity * 0.08, 0.45, 0.7),
      duration: 1.4,
      yoyo: true,
      repeat: -1,
      ease: "sine.inOut",
    });

    const pull = gsap.to(this.parts.flameSvg, {
      scaleY: 1.04,
      scaleX: 0.985,
      duration: 2.4,
      yoyo: true,
      repeat: -1,
      ease: "sine.inOut",
    });

    this.tweens.push(
      baseNoise,
      highlightNoise,
      maskNoise,
      seedPulse,
      seedHighlight,
      displacementPulse,
      highlightDisplacement,
      fadeTravel,
      highlightTravel,
      breathing,
      highlightBreathing,
      pull
    );

    this.setupSparks(intensity);
    this.applySpeed();
    this.applyPaused();
  }

  private setupSparks(intensity: number) {
    if (!this.parts) {
      return;
    }

    const { sparkElements } = this.parts;
    const targetCount = Math.round(clamp(8 + intensity * 6, 8, 20));

    sparkElements.forEach((spark, index) => {
      if (index < targetCount) {
        this.startSpark(spark, index, intensity);
      } else {
        spark.style.opacity = "0";
        if (this.sparkTweens[index]) {
          this.sparkTweens[index].kill();
        }
      }
    });
  }

  private startSpark(spark: SVGPathElement, index: number, intensity: number) {
    if (!this.parts || this.reducedMotionActive) {
      return;
    }

    const { flameSize } = this.parts;
    const minX = flameSize.width * 0.35;
    const maxX = flameSize.width * 0.65;
    const minY = flameSize.height * 0.08;
    const maxY = flameSize.height * 0.28;

    const spawnX = randomInRange(minX, maxX);
    const spawnY = randomInRange(minY, maxY);
    const drift = randomInRange(
      -flameSize.width * 0.06,
      flameSize.width * 0.06
    );
    const rise = randomInRange(
      flameSize.height * 0.18,
      flameSize.height * 0.32
    );
    const duration = randomInRange(0.6, 1.6);
    const delay = randomInRange(0, 0.7);

    gsap.set(spark, {
      x: spawnX,
      y: spawnY,
      opacity: 1,
      scale: 1,
      transformOrigin: "50% 50%",
    });

    const tween = gsap.to(spark, {
      x: spawnX + drift,
      y: spawnY - rise * (0.7 + intensity * 0.25),
      opacity: 0,
      scale: 0.2,
      duration,
      delay,
      ease: "power1.out",
      onComplete: () => {
        if (!this.destroyed) {
          this.startSpark(spark, index, intensity);
        }
      },
    });

    this.sparkTweens[index] = tween;
  }

  private buildFlame(source: SVGSVGElement): FlameParts {
    const viewBox = source.getAttribute("viewBox") ?? "0 0 100 100";
    const { width, height } = this.parseViewBox(viewBox);

    const flameSvg = this.createSvg("svg");
    flameSvg.setAttribute("viewBox", viewBox);
    flameSvg.setAttribute("class", "flame-monument__flame");
    flameSvg.setAttribute("aria-hidden", "true");
    flameSvg.setAttribute("preserveAspectRatio", "xMidYMax meet");

    const defs = this.createSvg("defs");

    const ids = {
      distortion: `${this.uid}-distortion`,
      highlight: `${this.uid}-highlight`,
      maskNoise: `${this.uid}-mask-noise`,
      fadeGradient: `${this.uid}-fade-gradient`,
      highlightGradient: `${this.uid}-highlight-gradient`,
      fadeMask: `${this.uid}-fade-mask`,
      highlightMask: `${this.uid}-highlight-mask`,
    };

    const baseFilter = this.createSvg("filter");
    baseFilter.setAttribute("id", ids.distortion);
    baseFilter.setAttribute("x", "-20%");
    baseFilter.setAttribute("y", "-20%");
    baseFilter.setAttribute("width", "140%");
    baseFilter.setAttribute("height", "140%");
    baseFilter.setAttribute("color-interpolation-filters", "sRGB");

    const turbulenceBase = this.createSvg("feTurbulence");
    turbulenceBase.setAttribute("type", "fractalNoise");
    turbulenceBase.setAttribute("baseFrequency", "0.014 0.05");
    turbulenceBase.setAttribute("numOctaves", "3");
    turbulenceBase.setAttribute("seed", "2");
    turbulenceBase.setAttribute("result", "noise");

    const displacementBase = this.createSvg("feDisplacementMap");
    displacementBase.setAttribute("in", "SourceGraphic");
    displacementBase.setAttribute("in2", "noise");
    displacementBase.setAttribute("scale", "10");
    displacementBase.setAttribute("xChannelSelector", "R");
    displacementBase.setAttribute("yChannelSelector", "G");

    baseFilter.appendChild(turbulenceBase);
    baseFilter.appendChild(displacementBase);

    const highlightFilter = this.createSvg("filter");
    highlightFilter.setAttribute("id", ids.highlight);
    highlightFilter.setAttribute("x", "-25%");
    highlightFilter.setAttribute("y", "-25%");
    highlightFilter.setAttribute("width", "150%");
    highlightFilter.setAttribute("height", "150%");
    highlightFilter.setAttribute("color-interpolation-filters", "sRGB");

    const turbulenceHighlight = this.createSvg("feTurbulence");
    turbulenceHighlight.setAttribute("type", "turbulence");
    turbulenceHighlight.setAttribute("baseFrequency", "0.02 0.1");
    turbulenceHighlight.setAttribute("numOctaves", "2");
    turbulenceHighlight.setAttribute("seed", "4");
    turbulenceHighlight.setAttribute("result", "noise");

    const displacementHighlight = this.createSvg("feDisplacementMap");
    displacementHighlight.setAttribute("in", "SourceGraphic");
    displacementHighlight.setAttribute("in2", "noise");
    displacementHighlight.setAttribute("scale", "5");
    displacementHighlight.setAttribute("xChannelSelector", "R");
    displacementHighlight.setAttribute("yChannelSelector", "G");

    const highlightColor = this.createSvg("feColorMatrix");
    highlightColor.setAttribute("type", "matrix");
    highlightColor.setAttribute(
      "values",
      "1.35 0 0 0 0  0 1.15 0 0 0  0 0.6 0 0 0  0 0 0 1 0"
    );

    highlightFilter.appendChild(turbulenceHighlight);
    highlightFilter.appendChild(displacementHighlight);
    highlightFilter.appendChild(highlightColor);

    const maskFilter = this.createSvg("filter");
    maskFilter.setAttribute("id", ids.maskNoise);
    maskFilter.setAttribute("x", "-20%");
    maskFilter.setAttribute("y", "-20%");
    maskFilter.setAttribute("width", "140%");
    maskFilter.setAttribute("height", "140%");

    const turbulenceMask = this.createSvg("feTurbulence");
    turbulenceMask.setAttribute("type", "fractalNoise");
    turbulenceMask.setAttribute("baseFrequency", "0.45");
    turbulenceMask.setAttribute("numOctaves", "1");
    turbulenceMask.setAttribute("seed", "3");
    turbulenceMask.setAttribute("result", "noise");

    const displacementMask = this.createSvg("feDisplacementMap");
    displacementMask.setAttribute("in", "SourceGraphic");
    displacementMask.setAttribute("in2", "noise");
    displacementMask.setAttribute("scale", "6");

    maskFilter.appendChild(turbulenceMask);
    maskFilter.appendChild(displacementMask);

    const fadeGradient = this.createSvg("linearGradient");
    fadeGradient.setAttribute("id", ids.fadeGradient);
    fadeGradient.setAttribute("gradientUnits", "userSpaceOnUse");
    fadeGradient.setAttribute("x1", "0");
    fadeGradient.setAttribute("y1", "0");
    fadeGradient.setAttribute("x2", "0");
    fadeGradient.setAttribute("y2", `${height}`);

    const fadeStops = [
      { offset: "0%", color: "#000", opacity: "0" },
      { offset: "55%", color: "#fff", opacity: "0.25" },
      { offset: "75%", color: "#fff", opacity: "0.85" },
      { offset: "100%", color: "#fff", opacity: "1" },
    ];

    fadeStops.forEach((stop) => {
      const stopEl = this.createSvg("stop");
      stopEl.setAttribute("offset", stop.offset);
      stopEl.setAttribute("stop-color", stop.color);
      stopEl.setAttribute("stop-opacity", stop.opacity);
      fadeGradient.appendChild(stopEl);
    });

    const highlightGradient = this.createSvg("linearGradient");
    highlightGradient.setAttribute("id", ids.highlightGradient);
    highlightGradient.setAttribute("gradientUnits", "userSpaceOnUse");
    highlightGradient.setAttribute("x1", "0");
    highlightGradient.setAttribute("y1", "0");
    highlightGradient.setAttribute("x2", "0");
    highlightGradient.setAttribute("y2", `${height}`);

    const highlightStops = [
      { offset: "0%", color: "#000", opacity: "0" },
      { offset: "35%", color: "#fff", opacity: "0.15" },
      { offset: "55%", color: "#fff", opacity: "0.8" },
      { offset: "70%", color: "#fff", opacity: "0.2" },
      { offset: "100%", color: "#000", opacity: "0" },
    ];

    highlightStops.forEach((stop) => {
      const stopEl = this.createSvg("stop");
      stopEl.setAttribute("offset", stop.offset);
      stopEl.setAttribute("stop-color", stop.color);
      stopEl.setAttribute("stop-opacity", stop.opacity);
      highlightGradient.appendChild(stopEl);
    });

    const fadeMask = this.createSvg("mask");
    fadeMask.setAttribute("id", ids.fadeMask);
    fadeMask.setAttribute("maskUnits", "userSpaceOnUse");

    const fadeRect = this.createSvg("rect");
    fadeRect.setAttribute("x", "0");
    fadeRect.setAttribute("y", "0");
    fadeRect.setAttribute("width", `${width}`);
    fadeRect.setAttribute("height", `${height * 1.2}`);
    fadeRect.setAttribute("fill", `url(#${ids.fadeGradient})`);
    fadeRect.setAttribute("filter", `url(#${ids.maskNoise})`);
    fadeMask.appendChild(fadeRect);

    const highlightMask = this.createSvg("mask");
    highlightMask.setAttribute("id", ids.highlightMask);
    highlightMask.setAttribute("maskUnits", "userSpaceOnUse");

    const highlightRect = this.createSvg("rect");
    highlightRect.setAttribute("x", "0");
    highlightRect.setAttribute("y", "0");
    highlightRect.setAttribute("width", `${width}`);
    highlightRect.setAttribute("height", `${height * 1.4}`);
    highlightRect.setAttribute("fill", `url(#${ids.highlightGradient})`);
    highlightRect.setAttribute("filter", `url(#${ids.maskNoise})`);
    highlightMask.appendChild(highlightRect);

    defs.appendChild(baseFilter);
    defs.appendChild(highlightFilter);
    defs.appendChild(maskFilter);
    defs.appendChild(fadeGradient);
    defs.appendChild(highlightGradient);
    defs.appendChild(fadeMask);
    defs.appendChild(highlightMask);
    flameSvg.appendChild(defs);

    const flameGraphic = this.cloneGraphic(source);
    const highlightGraphic = this.cloneGraphic(source);

    const baseGroup = this.createSvg("g");
    baseGroup.setAttribute("filter", `url(#${ids.distortion})`);
    baseGroup.setAttribute("mask", `url(#${ids.fadeMask})`);
    baseGroup.appendChild(flameGraphic);

    const highlightGroup = this.createSvg("g");
    highlightGroup.setAttribute("filter", `url(#${ids.highlight})`);
    highlightGroup.setAttribute("mask", `url(#${ids.highlightMask})`);
    highlightGroup.setAttribute("class", "flame-monument__flame-highlight");
    highlightGroup.appendChild(highlightGraphic);

    flameSvg.appendChild(baseGroup);
    flameSvg.appendChild(highlightGroup);

    const sparkSvg = this.createSvg("svg");
    sparkSvg.setAttribute("viewBox", viewBox);
    sparkSvg.setAttribute("class", "flame-monument__sparks");
    sparkSvg.setAttribute("aria-hidden", "true");

    const sparkGroup = this.createSvg("g");
    sparkSvg.appendChild(sparkGroup);

    const sparkElements: SVGPathElement[] = [];
    for (let i = 0; i < 20; i += 1) {
      const spark = this.createSvg("path");
      spark.setAttribute("d", "M0 -2 L2 0 L0 2 L-2 0 Z");
      spark.setAttribute("fill", "#ffd27d");
      spark.style.opacity = "0";
      sparkGroup.appendChild(spark);
      sparkElements.push(spark);
    }

    return {
      flameSvg,
      sparkSvg,
      baseGroup,
      highlightGroup,
      fadeRect,
      highlightRect,
      turbulenceBase,
      turbulenceHighlight,
      turbulenceMask,
      displacementBase,
      displacementHighlight,
      sparkGroup,
      sparkElements,
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

  private stripIds(element: Element) {
    if (element.hasAttribute("id")) {
      element.removeAttribute("id");
    }
    Array.from(element.children).forEach((child) => this.stripIds(child));
  }

  private parseViewBox(viewBox: string) {
    const parts = viewBox.split(/[\s,]+/).map(Number);
    return {
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
