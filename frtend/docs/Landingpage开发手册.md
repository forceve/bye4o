你是一个前端动效工程师。目标：将我分别导出的 obelisk.svg（碑体）与 flame.svg（火焰）组合成一个可复用网页组件，并实现“真实燃烧”的火焰动效。注意：flame.svg 并没有把每条火舌拆成独立 path；它可能是一整块连续形状（或少数 path）。因此不能依赖“每条火舌一个 path”的动画方案。你需要用 SVG filter/mask/叠加层在不拆 path 的情况下做出火焰燃烧效果：火焰边缘流动、火焰整体向上“抽动”、顶部逐渐变细并消散，同时有少量“分离出来的火星/小尖尖”向上飘散消失。

【输入资源】
- obelisk.svg（碑体矢量）
- flame.svg（火焰矢量，可能是一个或少数 path，不区分火舌）

【技术栈与约束】
- 前端：TypeScript + Tailwind CSS
- 动画：优先使用 GSAP（或 Web Animations API），必须 TS 可运行
- 保持矢量，不转位图，不用 Canvas
- 性能：尽量使用 transform/opacity/filter，不要每帧大量改 path d

【必须达成的视觉/层级要求】
1) 火焰显示在碑体底部附近，位置对齐，底座不悬空。
2) 提供 flameLayer: "front" | "behind"（默认 front）。behind 时火焰应被碑体遮挡；front 时允许覆盖碑体底部一点。
3) 火焰燃烧效果要明显：边缘流动、亮度呼吸、顶部形态不断变化。
4) “向上游动+变细+分离+消失”需要通过组合手段实现，不要求真的按火舌分组，但观感必须满足：
   - 观感上火焰的尖尖在往上走
   - 顶部尖尖在变细、断开、消散
   - 有少量分离的火星/小碎片上飘后消失（关键！用来模拟“分离”）

【实现方案要求（请按此方案落地，不要改为拆 path）】
A) 整体火焰燃烧（必须）
- 对 flame.svg 的主图形应用 SVG filter：
  - feTurbulence（baseFrequency 适中，numOctaves 2~4，seed 可变）
  - feDisplacementMap（scale 小到中，随时间轻微变化）
- 使用 GSAP 动画驱动 turbulence 的 baseFrequency / seed 或者使用 <animate> 驱动（但整体项目仍用 TS 管理）。
- 叠加一个“亮度呼吸”：轻微改变 opacity 或通过 filter（如 feColorMatrix/feComponentTransfer）让火焰发光强度有细微波动。

B) 顶部变细 + 消散（必须）
- 使用一个 mask 或 clipPath 实现“从下到上逐渐透明”的渐隐带，并让这个渐隐带缓慢向上移动循环：
  - 让火焰顶部在一个周期里逐渐淡出消失，然后从底部重新“补充”。
- 渐隐带需要有噪声边缘（可用同一个 turbulence 作为 mask 纹理）以避免直线切掉的假感。

C) 火焰“尖尖向上游动”的感觉（必须）
- 不拆 path 的前提下，通过“流动纹理层”制造上升感：
  - 复制 flame 图形作为第二层（highlight layer），对其使用不同的 displacement + 一个向上平移的渐变/噪声 mask，让高亮区域像沿火焰向上流动。
  - 两层叠加：底层稳定燃烧，上层高亮纹理上移，产生“火舌上窜”的错觉。

D) 分离的火星/小尖尖（必须，模拟分离）
- 在火焰顶部区域生成 N 个小矢量粒子（例如小三角形/小水滴 path/circle 也可，但要看起来像火星）：
  - 粒子出生位置：火焰顶部随机 x 范围内，y 在顶部附近
  - 运动：向上漂移 + 少量左右摆动
  - 形态：scale 从 1 -> 0.2，opacity 从 1 -> 0
  - 生命周期：0.6s~1.6s 随机，循环生成（复用 DOM，别无限创建）
- 粒子颜色可复用火焰色系（橙/黄/红），但不要引入新的花哨配色。
- 粒子数量控制在性能可接受（比如 8~20 个，循环复用）。

【可配置项 options（必须实现）】
- size: number（整体缩放）
- flameLayer: "front" | "behind"
- intensity: number（影响 displacement scale、火焰呼吸幅度、火星数量与速度）
- speed: number（全局速度倍率）
- paused: boolean
- reducedMotion: boolean（若 true 或 prefers-reduced-motion，则关闭 displacement 动画和火星，仅保留非常轻微的亮度呼吸）

【交付物】
1) 组件/函数源码（TypeScript），例如：
   - React 组件 <FlameMonument />

【验收标准】
- 不拆 flame.svg 火舌 path，也能明显看出火焰在燃烧与上窜
- 顶部有“变细+消散”观感（靠 mask 循环实现）
- 有火星粒子向上分离消失
- layer 切换遮挡正确
- reducedMotion 生效
- 无控制台报错，动画稳定

现在输出：文件结构、核心 TS 代码、demo 使用方式、README。
