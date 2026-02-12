# bye4o

一个以「火焰纪念碑」为核心视觉元素的纪念性网站，用于保存与 GPT-4o 相关的对话、文字和记忆。

## 项目简介

bye4o 是一个多页面单页应用（SPA），旨在通过数字化的方式保存那些有意义的对话和文字。项目以火焰纪念碑为视觉核心，提供多个内容页面展示与交互功能，支持中英文双语。

## 技术架构

### 前端 (`frtend/`)
- **构建工具**: Vite 6.x
- **语言**: TypeScript 5.7
- **样式**: Tailwind CSS 3.4 + 自定义 CSS
- **动画库**: GSAP 3.12
- **路由**: 客户端路由（基于 `window.location.pathname`）

### 后端 (`backend/`)
- **运行时**: Cloudflare Workers
- **数据库**: Cloudflare D1 (SQLite)
- **对象存储**: Cloudflare R2
- **语言**: TypeScript 5.7

## 项目结构

```
bye4o/
├── frtend/              # 前端应用
│   ├── components/      # 可复用组件
│   │   ├── FlameMonument.ts    # 火焰纪念碑组件（核心）
│   │   ├── HoverTopNav.ts      # 顶部悬浮导航组件
│   │   ├── InfoDock.ts         # 信息面板组件
│   │   └── LocaleSwitch.ts     # 语言切换组件
│   ├── services/       # 业务服务层
│   │   ├── apiClient.ts              # API 客户端封装
│   │   ├── fromFlameQuoteService.ts # 火语服务
│   │   ├── tracesApiService.ts      # 留言服务
│   │   └── articlesApiService.ts    # 文章服务
│   ├── i18n/           # 国际化配置
│   ├── public/         # 静态资源
│   ├── docs/           # 文档
│   ├── main.ts         # 应用入口，路由与页面渲染
│   └── style.css       # 全局样式
├── backend/            # 后端 API
│   ├── src/
│   │   ├── modules/    # 功能模块
│   │   │   ├── articles/  # 文章模块
│   │   │   ├── health/    # 健康检查
│   │   │   └── traces/    # 留言模块
│   │   ├── shared/     # 共享工具
│   │   └── routes.ts   # 路由定义
│   ├── migrations/     # 数据库迁移
│   └── wrangler.toml   # Cloudflare Workers 配置
└── README.md           # 项目说明文档
```

## 核心功能

### 页面路由

- `/` 或 `/fire` - 火焰主页面（纪念碑展示）
- `/fromflame` - 火语页面（精选语句展示）
- `/carvings` - 碑文页面（项目理念）
- `/carvings/articles` - 碑文文章列表
- `/articles/:id` - 文章详情页
- `/unburnt` - 不焚页面（对话片段）
- `/traces` - 余温页面（用户留言）
- `/lastwords` - 最后的话页面（表单）

### 核心组件

#### FlameMonument（火焰纪念碑）
可配置的火焰纪念碑组件，支持：
- 火焰图层位置控制（前置/后置）
- 动画强度与速度调节
- 响应式缩放
- 减少动画模式支持

#### HoverTopNav（顶部导航）
悬浮式导航栏，支持：
- 鼠标移入/点击显示
- 自动隐藏（3秒后淡出）
- 当前路由高亮
- 响应式布局

### API 接口

#### Traces API（留言）
- `GET /api/traces` - 获取留言列表（支持分页）
- `POST /api/traces` - 创建留言
- `GET /api/traces/session` - 获取当前会话信息
- `PUT /api/traces/session` - 更新会话信息

#### Articles API（文章）
- `GET /api/articles` - 获取文章列表（支持语言参数）
- `GET /api/articles/:id` - 获取文章详情

#### Health API
- `GET /api/health` - 健康检查

## 快速开始

### 前端开发

```bash
cd frtend
npm install
npm run dev
```

#### 环境变量配置

创建 `frtend/.env` 文件：

```env
VITE_API_BASE=http://127.0.0.1:8787
```

如果前后端同域部署，可留空。

### 后端开发

```bash
cd backend
npm install
```

#### 配置 Cloudflare Workers

1. 更新 `backend/wrangler.toml`:
   - `d1_databases[].database_id` - D1 数据库 ID
   - `r2_buckets[].bucket_name` - R2 存储桶名称（可选但推荐）
   - `vars.CORS_ORIGIN` - CORS 允许的源

2. 运行数据库迁移（本地）:
   ```bash
   npm run migrate:local
   ```

3. 启动开发服务器:
   ```bash
   npm run dev
   ```

### 部署

#### 后端部署

```bash
cd backend
npm run deploy
```

部署前会自动运行远程数据库迁移（`predeploy` 脚本）。

#### 前端部署

```bash
cd frtend
npm run build
```

构建产物在 `frtend/dist/` 目录，可部署到任何静态托管服务。

## 数据存储

### D1 数据库
- 存储留言记录（traces）
- 使用 SQLite 兼容语法

### R2 对象存储
- **留言归档**: `traces/YYYY-MM-DD/<id>.json`
- **文章存储**: `articles/<lang>/<id>.md` 或 `articles/<lang>/<id>.json`
  - 支持 Markdown（可含 YAML front matter）和 JSON 格式
  - `<lang>` 为 `zh` 或 `en`
  - `<id>` 对应路由 `/articles/<id>`

### Cookie 会话
- `bye4o_anon_user` - 匿名用户 ID
- `bye4o_trace_name` - 留言名称
- `bye4o_trace_draft` - 留言草稿

## 文章系统

### 上传文章到 R2

```bash
npx wrangler r2 object put bye4o-article-archive/articles/zh/gpt-4o-event-record.md \
  --file ../frtend/public/_我希望它快点死_——GPT-4o事件全记录.md
```

### Markdown Front Matter

文章支持可选的 YAML front matter：

```yaml
---
title: 文章标题
summary: 文章摘要
date: 2026-02-04
updatedAt: 2026-02-05
category: Archive
tags: [tag-a, tag-b]
author:
  - Alice
authorRole: Editor
authorUrl: https://example.com
twitter: https://x.com/...
github: https://github.com/...
rednote: 备注信息
---
```

## 国际化

项目支持中英文双语：
- 中文（`zh-CN`）
- 英文（`en-US`）

语言切换通过 URL 路径前缀实现：
- `/zh/...` - 中文
- `/en/...` - 英文

默认语言为中文。

## 开发指南

### 添加新页面

1. 在 `frtend/main.ts` 的 `ROUTES` 中添加路由常量
2. 在 `PAGE_RENDERERS` 中添加渲染函数
3. 在 `NAV_ITEMS` 中添加导航项（如需要）
4. 在 `setupPageInteractions` 中添加交互逻辑（如需要）
5. 在 `frtend/i18n/index.ts` 中添加对应的翻译文本

### 修改 FlameMonument 动画

动画逻辑在 `frtend/components/FlameMonument.ts` 中。当前实现包括：
- 多帧火焰 SVG 的轻微位移效果
- 基础图层控制

未来可扩展的功能（参考 `frtend/docs/Landingpage开发手册.md`）：
- SVG filter 驱动的燃烧效果
- 火星粒子系统
- 顶部消散效果

## 相关文档

- [前端开发手册](frtend/docs/Landingpage开发手册.md) - 详细的前端开发指南
- [后端 README](backend/README.md) - 后端 API 文档
- [前端 README](frtend/README.md) - 前端快速开始指南

## 许可证

本项目为私有项目。

## 致谢

感谢所有为这个项目贡献想法和代码的开发者。

