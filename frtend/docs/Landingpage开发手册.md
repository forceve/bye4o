# Landing Page 开发手册

## 项目概述

bye4o 是一个多页面单页应用（SPA），以「火焰纪念碑」为核心视觉元素，提供多个内容页面展示与交互功能。项目采用 TypeScript + Vite + Tailwind CSS 技术栈，前后端分离架构。

## 项目结构

```
frtend/
├── components/          # 可复用组件
│   ├── FlameMonument.ts    # 火焰纪念碑组件（核心）
│   └── HoverTopNav.ts      # 顶部悬浮导航组件
├── services/           # 业务服务层
│   ├── apiClient.ts        # API 客户端封装
│   ├── firewordsQuoteService.ts  # 火语服务
│   └── embersApiService.ts       # 留言服务
├── public/             # 静态资源
│   ├── obelisk.svg          # 碑体 SVG
│   ├── fire-0.svg           # 火焰 SVG（帧 0）
│   ├── fire-1.svg           # 火焰 SVG（帧 1）
│   ├── fire-2.svg           # 火焰 SVG（帧 2）
│   ├── bench-tight.svg      # 长椅 SVG
│   └── GPT-4o_Poetic_Quotes_Collection.md  # 火语数据源
├── docs/              # 文档
│   └── Landingpage开发手册.md
├── main.ts            # 应用入口，路由与页面渲染
├── style.css          # 全局样式（Tailwind + 自定义）
├── index.html         # HTML 入口
└── package.json       # 依赖配置
```

## 技术栈

- **构建工具**: Vite 6.x
- **语言**: TypeScript 5.7
- **样式**: Tailwind CSS 3.4 + 自定义 CSS
- **动画库**: GSAP 3.12（已安装，当前未使用）
- **路由**: 客户端路由（基于 `window.location.pathname`）

## 核心功能模块

### 1. 路由系统

**路由定义** (`main.ts`):
- `/` 或 `/fire` - 火焰主页面（纪念碑展示）
- `/firewords` - 火语页面（精选语句展示）
- `/carvings` - 碑文页面（项目理念）
- `/carvings/articles` - 碑文文章列表
- `/unburnt` - 不焚页面（对话片段）
- `/embers` - 余温页面（用户留言）
- `/onward` - 最后的话页面（表单）

**路由特性**:
- 基于 `popstate` 事件的历史路由
- 自动路由规范化与重定向
- 页面切换时的过渡动画（进入 `/fire` 时的雾化效果）
- 响应式缩放（`/fire` 页面根据视口高度自适应）

### 2. FlameMonument 组件

**当前实现状态**:
- ✅ 基础结构：碑体与火焰图层组合
- ✅ 图层控制：`flameLayer: "front" | "behind"` 支持
- ✅ 基础动画：多帧火焰 SVG 的轻微位移（drift）效果
- ✅ 配置项：`size`, `flameLayer`, `intensity`, `speed`, `paused`, `reducedMotion`

**实现方式**:
- 使用 3 个独立的火焰 SVG 文件（`fire-0.svg`, `fire-1.svg`, `fire-2.svg`）
- 通过 `setInterval` 驱动每帧的 `transform: translate()` 实现轻微抖动
- 简单的位移边界控制，避免过度偏移

**使用示例**:
```typescript
import { FlameMonument } from "./components/FlameMonument";

const monument = new FlameMonument({
  size: 2.1,
  flameLayer: "front",
  intensity: 1,
  speed: 1,
  paused: false,
  reducedMotion: false,
});

document.getElementById("slot")?.appendChild(monument.el);

// 动态更新配置
monument.update({ intensity: 1.2, flameLayer: "behind" });

// 销毁组件
monument.destroy();
```

### 3. HoverTopNav 组件

**功能**:
- 顶部悬浮导航栏（鼠标移入或点击页面时显示）
- 自动隐藏（3 秒后淡出）
- 当前路由高亮
- 响应式布局

**使用示例**:
```typescript
import { createHoverTopNav } from "./components/HoverTopNav";

const navElement = createHoverTopNav({
  items: [
    { label: "长椅", path: "/fire" },
    { label: "火语", path: "/firewords" },
    // ...
  ],
  activePath: currentRoute,
  onNavigate: (path) => navigate(path),
});

// 手动控制
navElement.controller.show();
navElement.controller.hide();
navElement.controller.destroy();
```

### 4. 服务层

#### firewordsQuoteService
- 从 Markdown 文件解析火语数据
- 随机批次获取（默认 6 条）
- 本地缓存与打乱逻辑
- 降级处理（加载失败时使用内置备用数据）

#### embersApiService
- 留言 CRUD 操作
- 草稿自动保存（防抖 600ms）
- 会话管理（匿名用户 ID）
- 基于后端 API（`/api/embers`）

### 5. 样式系统

**设计变量** (`style.css`):
- 深色主题（`color-scheme: dark`）
- 金色系配色（`--gold-main`, `--gold-bright` 等）
- 渐变背景（`--bg-content`, `--bg-fire`）
- 响应式断点（960px, 640px）

**关键样式类**:
- `.flame-monument` - 纪念碑容器
- `.fire-stage` - 火焰页面舞台（响应式缩放）
- `.route-transition-fog` - 路由切换雾化效果
- `.hover-top-nav` - 顶部导航
- `.content-card` - 内容卡片（通用样式）

## 原始需求（参考）

以下为 FlameMonument 组件的原始设计需求，当前实现**尚未完全达成**，可作为未来改进方向：

### 视觉要求
1. 火焰显示在碑体底部，位置对齐
2. `flameLayer` 支持前后层切换
3. 火焰燃烧效果：边缘流动、亮度呼吸、顶部形态变化
4. 向上游动+变细+分离+消失的观感

### 技术方案（待实现）
- **A) 整体燃烧**: SVG `feTurbulence` + `feDisplacementMap` 驱动边缘流动
- **B) 顶部消散**: 渐变 mask 循环上移，实现渐隐效果
- **C) 流动纹理**: 双层叠加，高亮层向上流动
- **D) 火星粒子**: 8~20 个循环复用的 SVG 粒子，向上飘散消失

### 配置项（已实现接口，部分功能待完善）
- `size`: number - 整体缩放 ✅
- `flameLayer`: "front" | "behind" ✅
- `intensity`: number - 当前仅影响动画开关 ⚠️
- `speed`: number - 当前未使用 ⚠️
- `paused`: boolean ✅
- `reducedMotion`: boolean ✅

## 开发指南

### 本地开发
```bash
cd frtend
npm install
npm run dev
```

### 构建生产版本
```bash
npm run build
```

### 环境变量
创建 `.env` 文件（参考 `.env.example`）:
```
VITE_API_BASE=http://127.0.0.1:8787
```

### 添加新页面
1. 在 `main.ts` 的 `ROUTES` 中添加路由常量
2. 在 `PAGE_RENDERERS` 中添加渲染函数
3. 在 `NAV_ITEMS` 中添加导航项（如需要）
4. 在 `setupPageInteractions` 中添加交互逻辑（如需要）

### 修改 FlameMonument 动画
当前动画逻辑在 `FlameMonument.ts` 的 `startFlameDrift()` 和 `tickFlameDrift()` 方法中。如需实现更复杂的 SVG filter 效果，可参考原始需求中的技术方案。

## 待改进项

1. **FlameMonument 动画增强**
   - 集成 GSAP 实现更流畅的动画
   - 实现 SVG filter 驱动的燃烧效果
   - 添加火星粒子系统
   - 实现顶部消散效果

2. **性能优化**
   - 火焰 SVG 资源预加载
   - 路由切换时的资源清理
   - 动画帧率优化

3. **可访问性**
   - 完善 ARIA 标签
   - 键盘导航支持
   - 屏幕阅读器优化

4. **测试**
   - 组件单元测试
   - 路由集成测试
   - E2E 测试

## 相关文档

- `README.md` - 项目快速开始指南
- `components/FlameMonument.ts` - 组件源码
- `main.ts` - 应用主逻辑
