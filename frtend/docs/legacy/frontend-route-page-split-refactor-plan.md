# Frontend 页面按路由一文件拆分计划

## Summary
1. 目标：把 `frtend/main.ts` 中每个路由页面的“同时渲染内容 + 交互挂载 + 页面私有 cleanup”收敛到单独文件，严格按“每个页面一个文件”执行。
2. 约束：不改产品行为、不改后端接口、不改 URL 语义；仅做结构重组与类型收敛。
3. 你已确认的策略：`每个路由独立文件` + `全局状态集中在 app-state 模块`。

## Target Structure
1. 新增目录 `frtend/app/`：
- `frtend/app/routes.ts`：`ROUTES`、`RoutePath`、`ArticleDetailRoutePath`、`UnburntDetailRoutePath`、路由判定工具。
- `frtend/app/app-state.ts`：全局运行态与缓存（locale/route、article 缓存、toast 状态、cleanup 注册器等）。
- `frtend/app/page-context.ts`：页面上下文类型与能力注入（`navigate`、`showToast`、`copy`、`getState` 等）。
- `frtend/app/router.ts`：`resolveLocation`、`toRoutePath`、`extractArticleId`、`extractUnburntId`、localized path 相关流程编排。
- `frtend/app/shell.ts`：`renderApp`、顶层布局拼装、top-nav/locale-switch/info-dock 挂载、route 切换时 cleanup 编排。
- `frtend/app/shared/`：跨页面复用工具（markdown/escape/debounce/time format/random/clamp 等）。

2. 新增目录 `frtend/pages/`（每个路由一个文件）：
- `frtend/pages/fire.page.ts`
- `frtend/pages/firewords.page.ts`
- `frtend/pages/carvings.page.ts`
- `frtend/pages/carvings-articles.page.ts`
- `frtend/pages/article-detail.page.ts`
- `frtend/pages/unburnt-public.page.ts`
- `frtend/pages/unburnt-mine.page.ts`
- `frtend/pages/unburnt-new.page.ts`
- `frtend/pages/unburnt-detail.page.ts`
- `frtend/pages/embers.page.ts`
- `frtend/pages/onward.page.ts`

3. `frtend/main.ts` 最终职责：
- 仅保留 `import "./style.css"` 与应用启动入口（初始化 state + 调用 shell 渲染）。
- 不再承载页面实现细节。

## Page File Contract (Decision Complete)
1. 每个 `*.page.ts` 必须同时包含：
- `render`：返回该页面完整 HTML（含当前 route 需要同时渲染的附属块）。
- `setup`：绑定该页面事件、异步加载、DOM 刷新逻辑。
- `cleanup`：释放该页面 interval/raf/listener/observer/timer。
- 若页面无可释放资源，`cleanup` 也必须提供 noop（`() => {}`），保证生命周期契约一致。
2. 统一导出接口：
```ts
export interface PageModule<R extends RoutePath = RoutePath> {
  id: string;
  match: (route: RoutePath) => route is R;
  render: (route: R, ctx: PageContext) => string;
  setup: (route: R, ctx: PageContext) => void | Promise<void>;
  cleanup: () => void;
}
```
3. 路由注册表：
- `frtend/app/shell.ts` 内以数组注册全部 `PageModule`，按 `match` 命中页面。
- 匹配顺序固定为：`/fire`、`/firewords`、`/carvings`、`/carvings/articles`、`/unburnt`、`/unburnt/mine`、`/unburnt/new`、`/embers`、`/onward`、`/articles/:id`、`/unburnt/:id`。
- `unburnt-detail` 的 `match` 必须排除保留段 `mine/new`，避免静态路由被动态路由误吞。

## Boundary Rules (按你的 guideline 落地)
1. `carvings` 页独立包含原 `renderRouteAppendix` 的附属入口，不再在 shell 额外拼接。
2. `fire` 页独立承接 gate/fog/brightness/monument 的渲染与 setup/cleanup。
3. `carvings-articles` 与 `article-detail` 各自独立文件，但共享 `article` 缓存 store（在 `app-state`）。
4. `unburnt` 四个路由（public/mine/new/detail）严格一页一文件；共享解析与保存逻辑放 `app/shared/unburnt-utils.ts`。
5. `onward` 与 `embers` 维持页面内完整闭环（render+setup+cleanup），仅抽通用工具到 shared。

## Public APIs / Interfaces / Types Changes
1. 新增内部公共类型：
- `PageModule`
- `PageContext`
- `AppState`（含 `articleStore`、`unburntStore`、`uiStore`、`cleanupRegistry`）
2. 现有类型迁移：
- 路由相关类型从 `main.ts` 迁移到 `frtend/app/routes.ts` 并统一导出。
- `ResolvedLocation` 迁移到 `frtend/app/router.ts`。
3. 对外行为变化：
- 无外部 API 变化（浏览器 URL、服务调用、i18n 文案键、后端请求保持不变）。

## Implementation Steps
1. 建立骨架：
- 创建 `app` 与 `pages` 目录、基础类型文件、空页面模块与注册表。
- 在 `frtend` 新增 `tsconfig.json`，并在 `frtend/package.json` 增加 `typecheck` 脚本：`tsc --noEmit -p tsconfig.json`。
2. 锁定路由匹配优先级：
- 在 `shell` 注册表中按既定顺序注册 `PageModule`，并先补 `mine/new` 不误命中 detail 的回归用例。
3. 先迁移无依赖页面：
- `firewords`、`carvings`（含 rotator + appendix）先拆，验证框架可用。
4. 迁移详情链路：
- `carvings-articles` 与 `article-detail`，同时落地 `articleStore` 到 `app-state`。
5. 落地 locale 与缓存失效策略：
- locale 切换时清空 `articleStore` 及相关 detail/list 缓存，并确保旧 locale 的 in-flight 请求结果不会覆写当前页面。
6. 迁移高复杂页面：
- `unburnt-public`、`unburnt-mine`、`unburnt-new`、`unburnt-detail` 分步迁移，抽出共享解析函数。
7. 迁移 `onward` 与 `embers`：
- 保留现有交互行为，页面私有副作用写入各自 `cleanup`。
8. 收口 shell：
- 删除 `main.ts` 中旧 `renderX/setupX`，只保留启动代码并接入新注册表。
9. 清理与对齐：
- 删除重复常量，统一 DOM id 常量归属到对应 page 文件或 shared 常量文件。

## Test Cases And Scenarios
1. 构建与类型：
- `cd frtend && npm run build` 通过。
- `cd frtend && npm run typecheck` 通过。
2. 路由渲染：
- 直接访问每个路由均能正确首屏渲染，含 `zh-CN/en-US` locale path。
- `.../unburnt/mine` 与 `.../unburnt/new` 必须命中静态页，不得进入 `unburnt-detail`。
- `.../unburnt/{id}` 必须稳定命中 `unburnt-detail`。
3. 页面交互回归：
- `firewords` 刷新、`carvings` 轮播、`articles` 搜索筛选排序、`article-detail` 复制链接。
- `unburnt` 四页发布/编辑/预览/详情保存/删除。
- `onward` 草稿、历史/回收切换。
- `embers` 列表、火焰区域交互、粒子动画。
4. 生命周期：
- 路由切换后不重复绑定事件，不残留 interval/raf/observer。
- locale 切换后页面文本正确刷新，`article` list/detail 缓存立即失效。
- locale 切换前发起的旧请求返回后，不得覆写新 locale 页面状态（防请求串写）。
5. 回归重点：
- `navigate/navigateWithSearch/popstate` 行为一致。
- 全局 toast 与 global back button 行为一致。

## Assumptions And Defaults
1. 默认不拆 `style.css` 与 `i18n/index.ts`，本次仅聚焦页面逻辑结构。
2. 默认保持现有 DOM id/class 命名，避免 CSS 与测试受影响。
3. 默认维持现有服务层调用方式与错误处理文案。
4. 默认不引入新框架或状态管理库，仅用现有 TypeScript 模块化完成拆分。
