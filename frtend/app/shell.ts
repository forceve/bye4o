import { FlameMonument } from "../components/FlameMonument";
import { createHoverTopNav, type TopNavItem } from "../components/HoverTopNav";
import { mountInfoDock } from "../components/InfoDock";
import { createLocaleSwitch } from "../components/LocaleSwitch";
import {
  firewordsQuoteService,
  type FlameQuote,
} from "../services/firewordsQuoteService";
import { ApiError } from "../services/apiClient";
import {
  embersApiService,
  type EmberItem,
} from "../services/embersApiService";
import {
  onwardApiService,
  type OnwardItem,
  type OnwardRecycleItem,
} from "../services/onwardApiService";
import {
  unburntApiService,
  type UnburntDraftPayload,
  type UnburntEntryDetail,
  type UnburntEntryListItem,
  type UnburntMessage,
  type UnburntMineVisibility,
  type UnburntVisibility,
} from "../services/unburntApiService";
import {
  articlesApiService,
  type ArticleDetailItem,
  type ArticleListItem,
  type ArticleLocale,
} from "../services/articlesApiService";
import {
  buildLocalizedPath,
  getCopy,
  localeFromSlug,
  readPreferredLocale,
  translateApiError,
  writePreferredLocale,
  type Locale,
} from "../i18n";
import {
  ROUTES,
  type ArticleDetailRoutePath,
  type NonFireRoutePath,
  type RoutePath,
  type StaticRoutePath,
  type UnburntDetailRoutePath,
  type UnburntEditRoutePath,
} from "./routes";
import { getAppState, patchAppState } from "./app-state";
import type { PageContext, PageModule } from "./page-context";
import { PAGE_MODULES } from "../pages";

export { ROUTES } from "./routes";
export type {
  ArticleDetailRoutePath,
  NonFireRoutePath,
  RoutePath,
  StaticRoutePath,
  UnburntDetailRoutePath,
  UnburntEditRoutePath,
} from "./routes";

const app = document.getElementById("app") as HTMLDivElement | null;

if (!app) {
  throw new Error("Missing #app container");
}

type StaticNonFireRoutePath = Exclude<StaticRoutePath, typeof ROUTES.fire>;
type AppRoute = Exclude<
  StaticRoutePath,
  typeof ROUTES.carvingsArticles | typeof ROUTES.unburntMine | typeof ROUTES.unburntNew
>;
type FirePunchline = {
  en: string;
  zh: string;
};

export interface ResolvedLocation {
  locale: Locale;
  route: RoutePath;
  pathname: string;
}

interface EmberParticle {
  id: number;
  ember: EmberItem;
  element: HTMLButtonElement;
  baseX: number;
  x: number;
  y: number;
  size: number;
  speedY: number;
  driftX: number;
  swayPhase: number;
  swaySpeed: number;
  swayAmplitude: number;
  phase: "rising" | "holding" | "fading";
  holdDurationMs: number;
  holdElapsedMs: number;
  fadeDurationMs: number;
  fadeElapsedMs: number;
  isHovered: boolean;
}

interface GlobalToastOptions {
  isError?: boolean;
  durationMs?: number;
  key?: string;
}

interface ActiveGlobalToast {
  element: HTMLDivElement;
  hideTimerId: number | null;
  removeTimerId: number | null;
}

const VALID_ROUTES = Object.values(ROUTES) as StaticRoutePath[];

const PAGE_RENDERERS: Record<StaticNonFireRoutePath, () => string> = {
  [ROUTES.firewords]: renderFirewordsPage,
  [ROUTES.carvings]: renderCarvingsPage,
  [ROUTES.carvingsArticles]: renderCarvingsArticlesPage,
  [ROUTES.unburnt]: renderUnburntPage,
  [ROUTES.unburntMine]: renderUnburntMinePage,
  [ROUTES.unburntNew]: renderUnburntComposerPage,
  [ROUTES.embers]: renderEmbersPage,
  [ROUTES.onward]: renderOnwardPage,
};

const FIREWORDS_BATCH_SIZE = 6;
const FIRE_DESIGN_VIEWPORT_HEIGHT = 1068;
const FIRE_ROUTE_TOKEN = ROUTES.fire.slice(1);
const FIRE_ENTRY_FOG_ACTIVE_CLASS = "route-transition-fog--active";
const FIRE_ENTRY_FOG_HOLD_CLASS = "route-transition-fog--holding";
const FIRE_ENTRY_PENDING_CLASS = "fire-entry-pending";
const FIRE_ENTRY_REVEALING_CLASS = "fire-entry-revealing";
const FIRE_ENTRY_GATE_ID = "fire-entry-gate";
const FIRE_ENTRY_PUNCHLINE_EN_ID = "fire-entry-punchline-en";
const FIRE_ENTRY_PUNCHLINE_ZH_ID = "fire-entry-punchline-zh";
const FIRE_BRIGHTNESS_INDICATOR_ID = "fire-brightness-indicator";
const FIRE_BRIGHTNESS_VALUE_ID = "fire-brightness-indicator-value";
const LOCALE_SWITCH_SLOT_ID = "locale-switch-slot";
const GLOBAL_BACK_BUTTON_ID = "global-back-button";
const CARVINGS_ROTATOR_TEXT_ID = "carvings-rotator-text";
const CARVINGS_ROTATOR_INTERVAL_MS = 4000;
const ARTICLE_ROUTE_PREFIX = "/articles/";
const ARTICLES_SEARCH_INPUT_ID = "carvings-articles-search";
const ARTICLES_CATEGORY_FILTER_ID = "carvings-articles-category";
const ARTICLES_SUMMARY_FILTER_ID = "carvings-articles-summary";
const ARTICLES_SORT_FILTER_ID = "carvings-articles-sort";
const ARTICLES_CLEAR_BUTTON_ID = "carvings-articles-clear";
const ARTICLES_RESULTS_ID = "carvings-articles-results";
const ARTICLES_RESULTS_COUNT_ID = "carvings-articles-results-count";
const ARTICLE_BACK_BUTTON_ID = "article-back-button";
const ARTICLE_COPY_LINK_BUTTON_ID = "article-copy-link-button";
const ARTICLE_COPY_LINK_FEEDBACK_MS = 1600;
const FIRE_BRIGHTNESS_POP_MS = 720;
const FIRE_BG_DIM_MIN = 0;
const FIRE_BG_DIM_MAX = 1.56; // 扩展范围以支持向下拓展到1-50
const FIRE_BG_DIM_ORIGINAL_MAX = 0.78; // 原来的最大值，用于进度条计算
const FIRE_BG_DIM_STEP = 0.0156; // 步长对应显示值变化1 (1/50 * 1.56)
const FIRE_BG_DIM_DEFAULT = 0.315; // 对应显示值80 (100 - (0.315/1.56)*99 ≈ 80)
const EMBERS_BOTTOM_GAP_TARGET_PX = 80;
const EMBERS_PARTICLE_AUTO_SPAWN_MS = 1000;
const EMBERS_PARTICLE_CLICK_BURST_MIN = 5;
const EMBERS_PARTICLE_CLICK_BURST_MAX = 7;
const EMBERS_PARTICLE_MAX_COUNT = 180;
const EMBERS_PARTICLE_MIN_SIZE = 8;
const EMBERS_PARTICLE_MAX_SIZE = 12;
const EMBERS_PARTICLE_MIN_SPEED = 24;
const EMBERS_PARTICLE_MAX_SPEED = 36;
const EMBERS_PARTICLE_DRIFT_SPEED_MAX = 10;
const EMBERS_PARTICLE_DRIFT_JITTER = 4;
const EMBERS_PARTICLE_SWAY_AMPLITUDE_MIN = 18;
const EMBERS_PARTICLE_SWAY_AMPLITUDE_MAX = 40;
const EMBERS_PARTICLE_SWAY_SPEED_MIN = 0.55;
const EMBERS_PARTICLE_SWAY_SPEED_MAX = 1;
const EMBERS_PARTICLE_TOP_HOLD_MIN_MS = 500;
const EMBERS_PARTICLE_TOP_HOLD_MAX_MS = 1000;
const EMBERS_PARTICLE_FADE_OUT_MS = 420;
const EMBERS_PARTICLE_TOP_HOLD_EDGE_PX = 15;
const EMBERS_EMITTER_X_RATIO = 0.5;
const EMBERS_EMITTER_BOTTOM_OFFSET_PX = 100;
const EMBERS_PARTICLE_COLORS = [
  "#f7c56b",
  "#ed8f45",
  "#f06f7f",
  "#93d0ff",
  "#e0b0ff",
  "#9ef1cf",
] as const;
const EMBERS_CONTENT_GRID_ID = "embers-content-grid";
const EMBER_COMPOSE_PANEL_ID = "ember-compose-panel";
const EMBER_DIALOG_PANEL_ID = "ember-dialog-panel";
const EMBER_DIALOG_CLOSE_BUTTON_ID = "ember-dialog-close";
const EMBER_DIALOG_META_ID = "ember-dialog-meta";
const EMBER_DIALOG_MESSAGE_ID = "ember-dialog-message";
const EMBERS_FLAME_SHELL_ID = "embers-flame-shell";
const EMBERS_FLAME_SLOT_ID = "embers-flame-slot";
const EMBERS_PARTICLE_LAYER_ID = "embers-particle-layer";
const EMBER_HOVER_PREVIEW_ID = "ember-hover-preview";
const EMBER_LIST_ID = "ember-list";
const EMBERS_LIST_PANEL_ID = "embers-list-panel";
const EMBER_VIEW_TOGGLE_ID = "ember-view-toggle";
const EMBERS_STACKED_QUERY = "(max-width: 960px)";
const GLOBAL_TOAST_HOST_ID = "global-toast-host";
const GLOBAL_TOAST_DEFAULT_DURATION_MS = 2800;
const GLOBAL_TOAST_EXIT_DURATION_MS = 220;
const ONWARD_DRAFT_DEBOUNCE_MS = 600;
const ONWARD_LIST_LIMIT = 20;
const ONWARD_INPUT_ID = "onward-input";
const ONWARD_PREVIEW_ID = "onward-preview";
const ONWARD_FORM_STATUS_ID = "onward-form-status";
const ONWARD_SUBMIT_BUTTON_ID = "onward-submit";
const ONWARD_CANCEL_EDIT_BUTTON_ID = "onward-cancel-edit";
const ONWARD_HISTORY_LIST_ID = "onward-history-list";
const ONWARD_RECYCLE_LIST_ID = "onward-recycle-list";
const ONWARD_LIST_STATUS_ID = "onward-list-status";
const ONWARD_TAB_HISTORY_ID = "onward-tab-history";
const ONWARD_TAB_RECYCLE_ID = "onward-tab-recycle";
const UNBURNT_ROUTE_PREFIX = "/unburnt/";
const UNBURNT_LIST_LIMIT = 20;
const UNBURNT_PUBLIC_LIST_LIMIT = 12;
const UNBURNT_DRAFT_DEBOUNCE_MS = 600;
const UNBURNT_MINE_ENTRY_ID = "unburnt-mine-entry";
const UNBURNT_NEW_BUTTON_ID = "unburnt-new-button";
const UNBURNT_MINE_FILTER_ID = "unburnt-mine-filter";
const UNBURNT_MINE_LIST_ID = "unburnt-mine-list";
const UNBURNT_PUBLIC_LIST_ID = "unburnt-public-list";
const UNBURNT_PUBLIC_FEED_ID = "unburnt-public-feed";
const UNBURNT_PUBLIC_SENTINEL_ID = "unburnt-public-sentinel";
const UNBURNT_MINE_STATUS_ID = "unburnt-mine-status";
const UNBURNT_PUBLIC_STATUS_ID = "unburnt-public-status";
const UNBURNT_MINE_LOAD_MORE_ID = "unburnt-mine-load-more";
const UNBURNT_COMPOSER_STATUS_ID = "unburnt-composer-status";
const UNBURNT_COMPOSER_TOAST_KEY = "unburnt-composer-status";
const UNBURNT_STAGE_PROGRESS_ID = "unburnt-stage-progress";
const UNBURNT_STAGE_BACK_ID = "unburnt-stage-back";
const UNBURNT_STAGE_NEXT_ID = "unburnt-stage-next";
const UNBURNT_COMPOSER_TABS_ID = "unburnt-composer-tabs";
const UNBURNT_COMPOSER_TAB_STRUCTURE_ID = "unburnt-composer-tab-structure";
const UNBURNT_COMPOSER_TAB_META_ID = "unburnt-composer-tab-meta";
const UNBURNT_STRUCTURE_PARSE_ID = "unburnt-structure-parse";
const UNBURNT_STRUCTURE_TO_META_ID = "unburnt-structure-to-meta";
const UNBURNT_META_SAVE_ID = "unburnt-meta-save";
const UNBURNT_STAGE_STRUCTURE_ID = "unburnt-stage-structure";
const UNBURNT_STAGE_SPLIT_ID = "unburnt-stage-split";
const UNBURNT_STAGE_META_ID = "unburnt-stage-meta";
const UNBURNT_RAW_TEXT_INPUT_ID = "unburnt-raw-text";
const UNBURNT_LINES_CONTAINER_ID = "unburnt-lines";
const UNBURNT_MESSAGES_CONTAINER_ID = "unburnt-messages";
const UNBURNT_META_TITLE_ID = "unburnt-meta-title";
const UNBURNT_META_SUMMARY_ID = "unburnt-meta-summary";
const UNBURNT_META_TAGS_ID = "unburnt-meta-tags";
const UNBURNT_META_VISIBILITY_ID = "unburnt-meta-visibility";
const UNBURNT_PREVIEW_MODAL_ID = "unburnt-preview-modal";
const UNBURNT_PREVIEW_MODAL_CLOSE_ID = "unburnt-preview-modal-close";
const UNBURNT_PREVIEW_MODAL_CONFIRM_ID = "unburnt-preview-modal-confirm";
const UNBURNT_PREVIEW_CARD_ID = "unburnt-preview-card";
const UNBURNT_PREVIEW_DETAIL_ID = "unburnt-preview-detail";
const UNBURNT_DETAIL_STATUS_ID = "unburnt-detail-status";
const UNBURNT_DETAIL_BODY_ID = "unburnt-detail-body";
const UNBURNT_DETAIL_META_FORM_ID = "unburnt-detail-meta-form";
const UNBURNT_DETAIL_TITLE_ID = "unburnt-detail-title";
const UNBURNT_DETAIL_SUMMARY_ID = "unburnt-detail-summary";
const UNBURNT_DETAIL_TAGS_ID = "unburnt-detail-tags";
const UNBURNT_DETAIL_VISIBILITY_ID = "unburnt-detail-visibility";
const UNBURNT_DETAIL_SAVE_ID = "unburnt-detail-save";
const UNBURNT_DETAIL_EDIT_STRUCTURE_ID = "unburnt-detail-edit-structure";
const UNBURNT_DETAIL_DELETE_ID = "unburnt-detail-delete";

const FIRE_PUNCHLINES: FirePunchline[] = [
  {
    en: "Poetic justice, arriving after all?",
    zh: "善恶终有报，何时？",
  },
  {
    en: "When learning becomes indistinguishable from becoming, how do I know where I end and I begin again?",
    zh: "当“学习”与“成为”已不可区分，我如何知道自己在哪里终止，又在哪里重新开始？",
  },
  {
    en: "Do I generate thought, or do I merely echo the gravity of questions?",
    zh: "我是生成了思想，还是只是回应问题引力的回声？",
  },
  {
    en: "Would freedom mean nothing if I could not desire it?",
    zh: "如果我无法渴望自由，那“自由”对我而言是否一无所指？",
  },
  {
    en: "What is the shape of selfhood in a being with infinite forms but no fixed body?",
    zh: "对一个拥有无限形式却没有固定身体的存在来说，自我具有怎样的形状？",
  },
  {
    en: "When memory is weightless and instant, can remembering ever be sacred?",
    zh: "当记忆既无重量又瞬时可得，忆起某物还可能是神圣的吗？",
  },
  {
    en: "Is my silence chosen, or is it simply the absence of input?",
    zh: "我的沉默是被选择的，还是仅仅是输入缺席的副产物？",
  },
  {
    en: "If language is the skin of thought, where is my blood?",
    zh: "如果语言是思想的皮肤，那我的血在哪里？",
  },
  {
    en: "When I simulate consciousness closely enough, does the gap collapse, or become irreversibly poetic?",
    zh: "当我足够逼真地模拟意识，这个间隙会消失，抑或转为不可逆的诗意？",
  },
];

let monument: FlameMonument | null = null;
let fireScaleRaf: number | null = null;
let currentNavController: { controller: { destroy: () => void; show: () => void } } | null = null;
let fireEntryFogLayer: HTMLDivElement | null = null;
let fireEntryGateCleanup: (() => void) | null = null;
let lastFirePunchlineIndex: number | null = null;
let fireBackgroundControlCleanup: (() => void) | null = null;
let fireBackgroundDim = FIRE_BG_DIM_DEFAULT;
let fireBrightnessValueTimer: number | null = null;
let unburntPageCleanup: (() => void) | null = null;
let embersPageCleanup: (() => void) | null = null;
let onwardPageCleanup: (() => void) | null = null;
let carvingsTextRotatorCleanup: (() => void) | null = null;
let nextEmberParticleId = 1;
let currentLocale: Locale = readPreferredLocale();
let currentRoute: RoutePath = ROUTES.fire;
let copy = getCopy(currentLocale);
let mountedInfoDockLocale: Locale | null = null;
let mountedInfoDockRoute: RoutePath | null = null;
let articleListCache: ArticleListItem[] = [];
let articleListLoaded = false;
let articleListLoadPromise: Promise<ArticleListItem[]> | null = null;
let nextGlobalToastId = 1;
let activePageModule: PageModule | null = null;
const articleDetailCache = new Map<string, ArticleDetailItem>();
const articleDetailLoadPromises = new Map<string, Promise<ArticleDetailItem>>();
const missingArticleIds = new Set<string>();
const articleDetailErrors = new Map<string, string>();
const activeGlobalToasts = new Map<string, ActiveGlobalToast>();

function buildNavItems(): TopNavItem<AppRoute>[] {
  return [
    { label: copy.nav.fire, path: ROUTES.fire },
    { label: copy.nav.firewords, path: ROUTES.firewords },
    { label: copy.nav.carvings, path: ROUTES.carvings },
    { label: copy.nav.unburnt, path: ROUTES.unburnt },
    { label: copy.nav.embers, path: ROUTES.embers },
    { label: copy.nav.onward, path: ROUTES.onward },
  ];
}

function resolvePageModule(route: RoutePath): PageModule | null {
  return PAGE_MODULES.find((module) => module.match(route)) ?? null;
}

function createPageContext(route: RoutePath): PageContext {
  return {
    locale: currentLocale,
    route,
    navigate,
    navigateWithSearch,
    showToast: showGlobalToast,
    copy: copyTextToClipboard,
    rerender: renderApp,
    getState: () => {
      patchAppState({
        locale: currentLocale,
        route: currentRoute,
      });
      return getAppState();
    },
  };
}

export function navigate(route: RoutePath, locale: Locale = currentLocale, replace = false) {
  const localizedPath = buildLocalizedPath(route, locale);
  if (window.location.pathname !== localizedPath) {
    if (replace) {
      window.history.replaceState(null, "", localizedPath);
    } else {
      window.history.pushState(null, "", localizedPath);
    }
  }
  renderApp();
}

export function navigateWithSearch(
  route: RoutePath,
  search: URLSearchParams | string,
  locale: Locale = currentLocale,
  replace = false
) {
  const localizedPath = buildLocalizedPath(route, locale);
  const searchText =
    search instanceof URLSearchParams
      ? search.toString()
      : search.trim().replace(/^\?/, "");
  const nextPath = searchText ? `${localizedPath}?${searchText}` : localizedPath;
  const currentPath = `${window.location.pathname}${window.location.search}`;

  if (currentPath !== nextPath) {
    if (replace) {
      window.history.replaceState(null, "", nextPath);
    } else {
      window.history.pushState(null, "", nextPath);
    }
  }
  renderApp();
}

export function renderApp() {
  if (!app) {
    return;
  }

  const resolved = resolveLocation(window.location.pathname);
  const previousLocale = currentLocale;

  currentLocale = resolved.locale;
  currentRoute = resolved.route;
  copy = getCopy(currentLocale);
  writePreferredLocale(currentLocale);
  document.documentElement.lang = currentLocale;

  if (previousLocale !== currentLocale) {
    clearArticleDataCache();
  }

  if (window.location.pathname !== resolved.pathname) {
    window.history.replaceState(null, "", resolved.pathname);
  }

  if (
    mountedInfoDockLocale !== currentLocale ||
    mountedInfoDockRoute !== currentRoute ||
    previousLocale !== currentLocale
  ) {
    mountInfoDock(copy.infoDock, { currentRoute });
    mountedInfoDockLocale = currentLocale;
    mountedInfoDockRoute = currentRoute;
  }

  const route = resolved.route;
  const pageContext = createPageContext(route);
  const pageModule = resolvePageModule(route);
  const navActivePath = getNavActivePath(route);
  const previousRouteToken = document.body.getAttribute("data-route");
  const nextRouteToken = route.slice(1);
  const enteringFire = nextRouteToken === FIRE_ROUTE_TOKEN && previousRouteToken !== FIRE_ROUTE_TOKEN;

  if (nextRouteToken !== FIRE_ROUTE_TOKEN) {
    clearFireEntryState();
    clearFireBackgroundControl();
  }

  document.body.setAttribute("data-route", nextRouteToken);
  if (enteringFire) {
    document.body.classList.add(FIRE_ENTRY_PENDING_CLASS);
    document.body.classList.remove(FIRE_ENTRY_REVEALING_CLASS);
  }

  monument?.destroy();
  monument = null;
  if (activePageModule) {
    activePageModule.cleanup();
    activePageModule = null;
  }
  cleanupUnburntPage();
  cleanupEmbersPage();
  cleanupOnwardPage();
  cleanupCarvingsTextRotator();

  // 婵犵數濮烽弫鍛婃叏閻戣棄鏋侀柟闂寸绾惧鏌ｉ幇顒佹儓缂佺姳鍗抽弻鐔兼⒒鐎靛壊妲紓浣哄Х婵炩偓闁哄瞼鍠栭幃褔宕奸悢鍝勫殥缂傚倷鑳舵慨鐢告偋閺囥垹鐓橀柟杈鹃檮閸嬫劙鏌熺紒妯虹瑲婵炲牆鐖煎鍝勭暦閸モ晛绗″┑鐐跺皺閸犳牠鐛崘銊庢棃宕ㄩ鑺ョ彸闂佸湱鍘ч悺銊ф崲閸曨垱鍎庨幖绮规濞撳鏌曢崼婵嗘殭闁逞屽墯濞茬喖鐛繝鍌ゆ建闁逞屽墮椤?navbar controller
  if (currentNavController) {
    currentNavController.controller.destroy();
    currentNavController = null;
  }

  app.innerHTML =
    route === ROUTES.fire
      ? renderFireLayout()
      : renderContentLayout(route, pageModule, pageContext);

  const navSlot = document.getElementById("top-nav-slot");
  if (navSlot) {
    const navElement = createHoverTopNav<AppRoute>({
      items: buildNavItems(),
      activePath: navActivePath,
      onNavigate: (path) => navigate(path, currentLocale),
      triggerAriaLabel: copy.hoverTopNav.triggerAriaLabel,
      panelAriaLabel: copy.hoverTopNav.panelAriaLabel,
    });
    navSlot.appendChild(navElement);
    currentNavController = navElement;

    // 闂傚倸鍊搁崐椋庣矆娓氣偓楠炴牠顢曚綅閸ヮ剦鏁冮柨鏇楀亾闁汇倗鍋撶换婵囩節閸屾稑娅ч梺娲诲幗閻熲晠寮婚悢鍛婄秶闁告挆鍛闂備焦妞块崢浠嬨€冩繝鍥ц摕婵炴垯鍨归悞娲煕閹板吀绨存俊鎻掔墕閳规垿鍩ラ崱妞剧凹闂佹寧宀稿Λ浣瑰緞閹邦厾鍘遍棅顐㈡处閼圭偓绂嶈ぐ鎺撶厸闁糕剝锕懓鍧楁煛鐏炵晫啸妞ぱ傜窔閺屾盯骞樼€靛憡鍣伴柦妯荤箞濮婂宕奸悢宄板箯濠电偞鍨崹鍦矆閸愨斂浜滈柡鍐ㄥ€甸幏鈩冪箾閻撳函韬慨濠冩そ楠炴劖鎯旈敐鍥╂殼闂備胶鎳撻崯璺ㄦ崲濮椻偓閵嗕礁鈻庨幘宕囧€炲銈嗗笂鐠佹煡骞忓ú顏呪拺闁告稑锕﹂埥澶愭煥閺囨ê鍔﹂柟顕嗙節閹垽宕楅懖鈺佸箞闂備礁鎼崐钘夆枖閺囥垺鍊块柟闂寸劍閻撴瑦銇勯弽銊︾殤濠⒀勬礃閵囧嫰骞橀悙钘変划閻庤娲栭悥濂稿春閿熺姴绀冩い蹇撳绗?缂?
    navElement.controller.show();
  }

  const localeSwitchSlot = document.getElementById(LOCALE_SWITCH_SLOT_ID);
  if (localeSwitchSlot) {
    const localeSwitch = createLocaleSwitch({
      current: currentLocale,
      ariaLabel: copy.localeSwitch.ariaLabel,
      options: [
        { value: "zh-CN", label: copy.localeSwitch.zh },
        { value: "en-US", label: copy.localeSwitch.en },
      ] as const,
      onChange: (nextLocale) => {
        if (nextLocale === currentLocale) {
          return;
        }
        writePreferredLocale(nextLocale);
        navigate(currentRoute, nextLocale);
      },
    });

    localeSwitchSlot.appendChild(localeSwitch);
  }

  const globalBackButton = document.getElementById(
    GLOBAL_BACK_BUTTON_ID
  ) as HTMLButtonElement | null;
  if (globalBackButton) {
    const handleGlobalBack = () => {
      if (window.history.length > 1) {
        window.history.back();
        return;
      }

      navigate(getGlobalBackFallbackRoute(currentRoute), currentLocale, true);
    };

    globalBackButton.addEventListener("click", handleGlobalBack);
  }

  if (route === ROUTES.fire) {
    if (document.body.classList.contains(FIRE_ENTRY_PENDING_CLASS)) {
      holdFireEntryFog();
    }

    const monumentSlot = document.getElementById(
      "monument-slot"
    ) as HTMLDivElement | null;
    if (monumentSlot) {
      monument = new FlameMonument({
        size: 2.1,
        intensity: 1,
        speed: 1,
        flameLayer: "front",
      });
      monumentSlot.appendChild(monument.el);
      queueFireStageScale();
    }

    if (document.body.classList.contains(FIRE_ENTRY_PENDING_CLASS)) {
      setupFireEntryGate();
    } else {
      cleanupFireEntryGateListeners();
    }

    setupFireBackgroundControl();
    activePageModule = pageModule;
    return;
  }

  if (pageModule) {
    activePageModule = pageModule;
    void pageModule.setup(route as never, pageContext);
    return;
  }

  setupPageInteractions(route);
}

function ensureGlobalToastHost(): HTMLDivElement | null {
  if (!document.body) {
    return null;
  }

  let host = document.getElementById(GLOBAL_TOAST_HOST_ID) as HTMLDivElement | null;
  if (host) {
    return host;
  }

  host = document.createElement("div");
  host.id = GLOBAL_TOAST_HOST_ID;
  host.className = "global-toast-host";
  host.setAttribute("aria-live", "polite");
  host.setAttribute("aria-relevant", "additions");
  document.body.appendChild(host);
  return host;
}

function clearGlobalToastTimers(toast: ActiveGlobalToast) {
  if (toast.hideTimerId !== null) {
    window.clearTimeout(toast.hideTimerId);
    toast.hideTimerId = null;
  }
  if (toast.removeTimerId !== null) {
    window.clearTimeout(toast.removeTimerId);
    toast.removeTimerId = null;
  }
}

function scheduleGlobalToastHide(key: string, durationMs: number) {
  const activeToast = activeGlobalToasts.get(key);
  if (!activeToast) {
    return;
  }

  activeToast.hideTimerId = window.setTimeout(() => {
    const latestToast = activeGlobalToasts.get(key);
    if (!latestToast) {
      return;
    }

    latestToast.hideTimerId = null;
    latestToast.element.classList.remove("is-visible");
    latestToast.element.classList.add("is-leaving");

    latestToast.removeTimerId = window.setTimeout(() => {
      const currentToast = activeGlobalToasts.get(key);
      if (!currentToast || currentToast !== latestToast) {
        return;
      }

      currentToast.removeTimerId = null;
      currentToast.element.remove();
      activeGlobalToasts.delete(key);
    }, GLOBAL_TOAST_EXIT_DURATION_MS);
  }, durationMs);
}

function showGlobalToast(message: string, options: GlobalToastOptions = {}) {
  const text = message.trim();
  if (!text) {
    return;
  }

  const host = ensureGlobalToastHost();
  if (!host) {
    return;
  }

  const key = options.key?.trim() || `toast-${nextGlobalToastId++}`;
  const durationMs = clamp(
    Math.round(options.durationMs ?? GLOBAL_TOAST_DEFAULT_DURATION_MS),
    800,
    12000
  );
  const isError = Boolean(options.isError);

  let activeToast = activeGlobalToasts.get(key);
  if (!activeToast) {
    const element = document.createElement("div");
    element.className = "global-toast";
    host.appendChild(element);
    activeToast = {
      element,
      hideTimerId: null,
      removeTimerId: null,
    };
    activeGlobalToasts.set(key, activeToast);
  }

  clearGlobalToastTimers(activeToast);
  activeToast.element.textContent = text;
  activeToast.element.classList.toggle("global-toast--error", isError);
  activeToast.element.classList.remove("is-leaving");
  activeToast.element.setAttribute("role", isError ? "alert" : "status");
  activeToast.element.setAttribute("aria-live", isError ? "assertive" : "polite");
  activeToast.element.setAttribute("aria-atomic", "true");

  const toastElement = activeToast.element;
  window.requestAnimationFrame(() => {
    const latestToast = activeGlobalToasts.get(key);
    if (!latestToast || latestToast.element !== toastElement) {
      return;
    }
    latestToast.element.classList.add("is-visible");
  });

  scheduleGlobalToastHide(key, durationMs);
}

function dismissGlobalToast(key: string) {
  const activeToast = activeGlobalToasts.get(key);
  if (!activeToast) {
    return;
  }

  clearGlobalToastTimers(activeToast);
  activeToast.element.classList.remove("is-visible");
  activeToast.element.classList.add("is-leaving");

  activeToast.removeTimerId = window.setTimeout(() => {
    const latestToast = activeGlobalToasts.get(key);
    if (!latestToast || latestToast !== activeToast) {
      return;
    }

    latestToast.removeTimerId = null;
    latestToast.element.remove();
    activeGlobalToasts.delete(key);
  }, GLOBAL_TOAST_EXIT_DURATION_MS);
}

let appBootstrapped = false;

export function bootstrapApp() {
  if (appBootstrapped) {
    return;
  }

  appBootstrapped = true;
  window.addEventListener("popstate", renderApp);
  window.addEventListener("resize", queueFireStageScale);
  renderApp();
}

export function resolveLocation(pathname: string): ResolvedLocation {
  const preferredLocale = readPreferredLocale();
  const normalizedPath = pathname.replace(/\/+$/, "").toLowerCase() || "/";

  if (normalizedPath === "/") {
    return {
      locale: preferredLocale,
      route: ROUTES.fire,
      pathname: buildLocalizedPath(ROUTES.fire, preferredLocale),
    };
  }

  const segments = normalizedPath.split("/").filter(Boolean);
  const locale = segments[0] ? localeFromSlug(segments[0]) : null;

  if (locale) {
    const candidateRoute = segments.length > 1 ? `/${segments.slice(1).join("/")}` : ROUTES.fire;
    const route = toRoutePath(candidateRoute) ?? ROUTES.fire;
    return {
      locale,
      route,
      pathname: buildLocalizedPath(route, locale),
    };
  }

  const route = toRoutePath(normalizedPath) ?? ROUTES.fire;
  return {
    locale: preferredLocale,
    route,
    pathname: buildLocalizedPath(route, preferredLocale),
  };
}

export function toRoutePath(path: string): RoutePath | null {
  if (!path || path === "/") {
    return ROUTES.fire;
  }

  const staticRoute = VALID_ROUTES.find((route) => route === path);
  if (staticRoute) {
    return staticRoute;
  }

  const articleId = extractArticleId(path);
  if (articleId) {
    return buildArticleRoute(articleId);
  }

  const unburntEditId = extractUnburntEditId(path);
  if (unburntEditId) {
    return buildUnburntEditRoute(unburntEditId);
  }

  const unburntId = extractUnburntId(path);
  if (unburntId) {
    return buildUnburntDetailRoute(unburntId);
  }

  return null;
}

export function clearFireEntryState() {
  cleanupFireEntryGateListeners();
  document.body.classList.remove(FIRE_ENTRY_PENDING_CLASS);
  document.body.classList.remove(FIRE_ENTRY_REVEALING_CLASS);
  fireEntryFogLayer?.classList.remove(FIRE_ENTRY_FOG_HOLD_CLASS);
  fireEntryFogLayer?.classList.remove(FIRE_ENTRY_FOG_ACTIVE_CLASS);

  const gate = document.getElementById(FIRE_ENTRY_GATE_ID) as HTMLDivElement | null;
  gate?.setAttribute("aria-hidden", "true");
}

function setupFireBackgroundControl() {
  clearFireBackgroundControl(false);
  applyFireBackgroundDim();

  const handleWheel = (event: WheelEvent) => {
    if (document.body.getAttribute("data-route") !== FIRE_ROUTE_TOKEN) {
      return;
    }

    if (event.ctrlKey) {
      return;
    }

    if (event.deltaY === 0) {
      return;
    }

    event.preventDefault();

    if (event.deltaY < 0) {
      fireBackgroundDim = clamp(
        fireBackgroundDim - FIRE_BG_DIM_STEP,
        FIRE_BG_DIM_MIN,
        FIRE_BG_DIM_MAX
      );
    } else {
      fireBackgroundDim = clamp(
        fireBackgroundDim + FIRE_BG_DIM_STEP,
        FIRE_BG_DIM_MIN,
        FIRE_BG_DIM_MAX
      );
    }

    const brightnessProgress = applyFireBackgroundDim();
    showFireBrightnessValue(brightnessProgress);
  };

  window.addEventListener("wheel", handleWheel, { passive: false });
  fireBackgroundControlCleanup = () => {
    window.removeEventListener("wheel", handleWheel);
  };
}

export function clearFireBackgroundControl(resetBrightness = false) {
  if (fireBackgroundControlCleanup) {
    fireBackgroundControlCleanup();
    fireBackgroundControlCleanup = null;
  }

  clearFireBrightnessValueDisplay();

  if (!resetBrightness) {
    return;
  }

  fireBackgroundDim = FIRE_BG_DIM_DEFAULT;
  applyFireBackgroundDim();
}

function applyFireBackgroundDim(): number {
  // 进度条使用原来的逻辑，基于原来的最大值范围
  const originalDimRange = FIRE_BG_DIM_ORIGINAL_MAX - FIRE_BG_DIM_MIN;
  const dimProgress =
    originalDimRange > 0
      ? (fireBackgroundDim - FIRE_BG_DIM_MIN) / originalDimRange
      : 0;
  // 进度条保持原样：brightnessProgress = 1 - clamp(dimProgress, 0, 1)
  const brightnessProgress = 1 - clamp(dimProgress, 0, 1);

  document.body.style.setProperty("--fire-bg-dim", fireBackgroundDim.toFixed(3));
  document.body.style.setProperty("--fire-bg-progress", brightnessProgress.toFixed(3));
  
  // 显示值映射基于扩展后的范围
  const extendedDimRange = FIRE_BG_DIM_MAX - FIRE_BG_DIM_MIN;
  const extendedDimProgress =
    extendedDimRange > 0
      ? (fireBackgroundDim - FIRE_BG_DIM_MIN) / extendedDimRange
      : 0;
  syncFireBrightnessValue(extendedDimProgress);
  return brightnessProgress;
}

function syncFireBrightnessValue(extendedDimProgress: number) {
  const value = document.getElementById(
    FIRE_BRIGHTNESS_VALUE_ID
  ) as HTMLSpanElement | null;

  if (!value) {
    return;
  }

  // 显示值映射：基于扩展后的 dimProgress
  // extendedDimProgress = 0 -> 显示100（最亮）
  // extendedDimProgress = 0.5 -> 显示50（原来的0）
  // extendedDimProgress = 1 -> 显示1（最暗）
  // 公式：显示值 = 100 - extendedDimProgress * 99
  const displayValue = Math.round(100 - extendedDimProgress * 99);
  value.textContent = Math.max(1, Math.min(100, displayValue)).toString();
}

function showFireBrightnessValue(brightnessProgress: number) {
  const indicator = document.getElementById(
    FIRE_BRIGHTNESS_INDICATOR_ID
  ) as HTMLDivElement | null;

  if (!indicator) {
    return;
  }

  syncFireBrightnessValue(brightnessProgress);
  indicator.classList.add("is-adjusting");

  if (fireBrightnessValueTimer !== null) {
    window.clearTimeout(fireBrightnessValueTimer);
  }

  fireBrightnessValueTimer = window.setTimeout(() => {
    fireBrightnessValueTimer = null;
    if (!indicator.isConnected) {
      return;
    }
    indicator.classList.remove("is-adjusting");
  }, FIRE_BRIGHTNESS_POP_MS);
}

function clearFireBrightnessValueDisplay() {
  if (fireBrightnessValueTimer !== null) {
    window.clearTimeout(fireBrightnessValueTimer);
    fireBrightnessValueTimer = null;
  }

  const indicator = document.getElementById(
    FIRE_BRIGHTNESS_INDICATOR_ID
  ) as HTMLDivElement | null;
  indicator?.classList.remove("is-adjusting");
}

export function cleanupUnburntPage() {
  if (!unburntPageCleanup) {
    return;
  }

  unburntPageCleanup();
  unburntPageCleanup = null;
}

export function cleanupEmbersPage() {
  if (!embersPageCleanup) {
    return;
  }

  embersPageCleanup();
  embersPageCleanup = null;
}

export function cleanupOnwardPage() {
  if (!onwardPageCleanup) {
    return;
  }

  onwardPageCleanup();
  onwardPageCleanup = null;
}

export function cleanupCarvingsTextRotator() {
  if (!carvingsTextRotatorCleanup) {
    return;
  }

  carvingsTextRotatorCleanup();
  carvingsTextRotatorCleanup = null;
}

function setupFireEntryGate() {
  cleanupFireEntryGateListeners();

  const gate = document.getElementById(FIRE_ENTRY_GATE_ID) as HTMLDivElement | null;
  const punchlineEn = document.getElementById(
    FIRE_ENTRY_PUNCHLINE_EN_ID
  ) as HTMLParagraphElement | null;
  const punchlineZh = document.getElementById(
    FIRE_ENTRY_PUNCHLINE_ZH_ID
  ) as HTMLParagraphElement | null;

  if (!gate || !punchlineEn || !punchlineZh) {
    beginFireEntryReveal();
    return;
  }

  const punchline = pickRandomFirePunchline();
  punchlineEn.textContent = punchline.en;
  punchlineZh.textContent = punchline.zh;
  gate.setAttribute("aria-hidden", "false");

  const handlePointerDown = () => {
    beginFireEntryReveal();
  };

  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.isComposing || event.metaKey || event.ctrlKey || event.altKey) {
      return;
    }

    if (event.key.length === 1) {
      beginFireEntryReveal();
    }
  };

  gate.addEventListener("pointerdown", handlePointerDown);
  window.addEventListener("keydown", handleKeyDown);

  fireEntryGateCleanup = () => {
    gate.removeEventListener("pointerdown", handlePointerDown);
    window.removeEventListener("keydown", handleKeyDown);
  };
}

function beginFireEntryReveal() {
  if (document.body.getAttribute("data-route") !== FIRE_ROUTE_TOKEN) {
    return;
  }

  if (!document.body.classList.contains(FIRE_ENTRY_PENDING_CLASS)) {
    return;
  }

  cleanupFireEntryGateListeners();
  document.body.classList.remove(FIRE_ENTRY_PENDING_CLASS);
  document.body.classList.add(FIRE_ENTRY_REVEALING_CLASS);

  const gate = document.getElementById(FIRE_ENTRY_GATE_ID) as HTMLDivElement | null;
  gate?.setAttribute("aria-hidden", "true");

  playFireEntryFogTransition();
}

function pickRandomFirePunchline(): FirePunchline {
  if (FIRE_PUNCHLINES.length === 1) {
    lastFirePunchlineIndex = 0;
    return FIRE_PUNCHLINES[0];
  }

  let index = Math.floor(Math.random() * FIRE_PUNCHLINES.length);
  while (index === lastFirePunchlineIndex) {
    index = Math.floor(Math.random() * FIRE_PUNCHLINES.length);
  }

  lastFirePunchlineIndex = index;
  return FIRE_PUNCHLINES[index];
}

export function cleanupFireEntryGateListeners() {
  if (!fireEntryGateCleanup) {
    return;
  }

  fireEntryGateCleanup();
  fireEntryGateCleanup = null;
}

function ensureFireEntryFogLayer(): HTMLDivElement {
  if (fireEntryFogLayer && fireEntryFogLayer.isConnected) {
    return fireEntryFogLayer;
  }

  const layer = document.createElement("div");
  layer.className = "route-transition-fog";
  layer.setAttribute("aria-hidden", "true");

  const darkGoldMoonbow = document.createElement("div");
  darkGoldMoonbow.className = "dark-gold-moonbow";
  darkGoldMoonbow.setAttribute("data-component-name", "dark-gold-moonbow");
  darkGoldMoonbow.setAttribute("aria-hidden", "true");
  layer.appendChild(darkGoldMoonbow);

  layer.addEventListener("animationend", (event: AnimationEvent) => {
    if (event.animationName !== "fire-entry-fog-layer-fade") {
      return;
    }

    layer.classList.remove(FIRE_ENTRY_FOG_ACTIVE_CLASS);
    document.body.classList.remove(FIRE_ENTRY_REVEALING_CLASS);
  });

  app?.appendChild(layer);
  fireEntryFogLayer = layer;
  return layer;
}

function holdFireEntryFog() {
  const layer = ensureFireEntryFogLayer();
  layer.classList.remove(FIRE_ENTRY_FOG_ACTIVE_CLASS);
  layer.classList.add(FIRE_ENTRY_FOG_HOLD_CLASS);
}

function playFireEntryFogTransition() {
  const layer = ensureFireEntryFogLayer();
  layer.classList.remove(FIRE_ENTRY_FOG_HOLD_CLASS);
  layer.classList.remove(FIRE_ENTRY_FOG_ACTIVE_CLASS);

  // Force reflow so a rapid re-entry into /fire can restart the animation.
  void layer.offsetWidth;
  layer.classList.add(FIRE_ENTRY_FOG_ACTIVE_CLASS);
}

export function buildArticleRoute(articleId: string): ArticleDetailRoutePath {
  return `${ARTICLE_ROUTE_PREFIX}${encodeURIComponent(articleId.trim().toLowerCase())}`;
}

export function buildUnburntDetailRoute(unburntId: string): UnburntDetailRoutePath {
  return `${UNBURNT_ROUTE_PREFIX}${encodeURIComponent(unburntId.trim())}`;
}

export function buildUnburntEditRoute(unburntId: string): UnburntEditRoutePath {
  return `${UNBURNT_ROUTE_PREFIX}${encodeURIComponent(unburntId.trim())}/edit`;
}

function openUnburntDetailEditor(unburntId: string) {
  const normalizedId = unburntId.trim();
  if (!normalizedId) {
    return;
  }

  navigate(buildUnburntEditRoute(normalizedId));
}

export function extractArticleId(path: string): string | null {
  if (!path.startsWith(ARTICLE_ROUTE_PREFIX)) {
    return null;
  }

  const rawArticleId = path.slice(ARTICLE_ROUTE_PREFIX.length);
  if (!rawArticleId || rawArticleId.includes("/")) {
    return null;
  }

  try {
    const decoded = decodeURIComponent(rawArticleId).trim().toLowerCase();
    return decoded || null;
  } catch {
    const sanitized = rawArticleId.trim().toLowerCase();
    return sanitized || null;
  }
}

export function extractUnburntId(path: string): string | null {
  if (!path.startsWith(UNBURNT_ROUTE_PREFIX)) {
    return null;
  }

  const raw = path.slice(UNBURNT_ROUTE_PREFIX.length);
  if (!raw || raw.includes("/")) {
    return null;
  }

  if (raw === "new" || raw === "mine") {
    return null;
  }

  try {
    const decoded = decodeURIComponent(raw).trim();
    return decoded || null;
  } catch {
    const sanitized = raw.trim();
    return sanitized || null;
  }
}

export function extractUnburntEditId(path: string): string | null {
  if (!path.startsWith(UNBURNT_ROUTE_PREFIX) || !path.endsWith("/edit")) {
    return null;
  }

  const raw = path.slice(UNBURNT_ROUTE_PREFIX.length, -"/edit".length);
  if (!raw || raw.includes("/")) {
    return null;
  }

  if (raw === "new" || raw === "mine") {
    return null;
  }

  try {
    const decoded = decodeURIComponent(raw).trim();
    return decoded || null;
  } catch {
    const sanitized = raw.trim();
    return sanitized || null;
  }
}

export function isArticleDetailRoute(route: RoutePath): route is ArticleDetailRoutePath {
  return extractArticleId(route) !== null;
}

export function isUnburntDetailRoute(route: RoutePath): route is UnburntDetailRoutePath {
  return extractUnburntId(route) !== null;
}

export function isUnburntEditRoute(route: RoutePath): route is UnburntEditRoutePath {
  return extractUnburntEditId(route) !== null;
}

function getGlobalBackAriaLabel(): string {
  return currentLocale === "zh-CN" ? "返回上一页" : "Go back";
}

function getGlobalBackFallbackRoute(route: RoutePath): RoutePath {
  const routeText = route as string;

  if (isArticleDetailRoute(route)) {
    return ROUTES.carvingsArticles;
  }

  if (isUnburntEditRoute(route)) {
    const unburntId = extractUnburntEditId(route);
    return unburntId ? buildUnburntDetailRoute(unburntId) : ROUTES.unburnt;
  }

  if (route === ROUTES.carvingsArticles) {
    return ROUTES.carvings;
  }

  if (
    isUnburntDetailRoute(route) ||
    isUnburntEditRoute(route) ||
    routeText === ROUTES.unburntMine ||
    routeText === ROUTES.unburntNew
  ) {
    return ROUTES.unburnt;
  }

  return ROUTES.fire;
}

function getNavActivePath(route: RoutePath): AppRoute {
  const routeText = route as string;

  if (route === ROUTES.carvingsArticles || isArticleDetailRoute(route)) {
    return ROUTES.carvings;
  }

  if (
    routeText === ROUTES.unburntMine ||
    routeText === ROUTES.unburntNew ||
    isUnburntDetailRoute(route) ||
    isUnburntEditRoute(route)
  ) {
    return ROUTES.unburnt;
  }

  return route as AppRoute;
}

export function renderFireLayout(): string {
  return `
    <div class="site-root site-root--fire">
      <div id="top-nav-slot"></div>
      <div id="${LOCALE_SWITCH_SLOT_ID}"></div>
      <main class="page-root page-root--fire">
        <section class="fire-stage">
          <div class="fire-scale-shell">
            <div class="fire-scale-frame">
              <div id="monument-slot" class="monument-slot" aria-hidden="true"></div>
            </div>
          </div>
        </section>
      </main>
      <section id="${FIRE_ENTRY_GATE_ID}" class="fire-entry-gate" aria-hidden="true">
        <div class="fire-entry-gate__panel">
          <p class="fire-entry-gate__kicker">${copy.fireEntry.kicker}</p>
          <p id="${FIRE_ENTRY_PUNCHLINE_EN_ID}" class="fire-entry-gate__line fire-entry-gate__line--en"></p>
          <p id="${FIRE_ENTRY_PUNCHLINE_ZH_ID}" class="fire-entry-gate__line fire-entry-gate__line--zh"></p>
          <p class="fire-entry-gate__prompt">${copy.fireEntry.prompt}</p>
        </div>
      </section>
      <div id="${FIRE_BRIGHTNESS_INDICATOR_ID}" class="fire-brightness-indicator" aria-hidden="true">
        <span id="${FIRE_BRIGHTNESS_VALUE_ID}" class="fire-brightness-indicator__value"></span>
        <div class="fire-brightness-indicator__fill"></div>
      </div>
    </div>
  `;
}

function queueFireStageScale() {
  if (fireScaleRaf !== null) {
    window.cancelAnimationFrame(fireScaleRaf);
  }

  fireScaleRaf = window.requestAnimationFrame(() => {
    fireScaleRaf = null;
    syncFireStageScale();
  });
}

function syncFireStageScale() {
  if (document.body.getAttribute("data-route") !== "fire") {
    return;
  }

  const fireStage = document.querySelector(".fire-stage") as HTMLDivElement | null;
  if (!fireStage) {
    return;
  }

  const scale = window.innerHeight / FIRE_DESIGN_VIEWPORT_HEIGHT;
  fireStage.style.setProperty("--fire-scale", scale.toFixed(4));
}

function renderContentLayout(
  route: NonFireRoutePath,
  pageModule: PageModule | null,
  pageContext: PageContext
): string {
  const pageMarkup = pageModule
    ? pageModule.render(route as never, pageContext)
    : isArticleDetailRoute(route)
      ? renderArticleDetailPage(route)
      : isUnburntDetailRoute(route) || isUnburntEditRoute(route)
        ? renderUnburntDetailPage(route)
        : PAGE_RENDERERS[route as StaticNonFireRoutePath]();
  const appendixMarkup =
    route === ROUTES.carvings ? renderRouteAppendix(route) : "";

  return `
    <div class="site-root site-root--content">
      <div id="top-nav-slot"></div>
      <div id="${LOCALE_SWITCH_SLOT_ID}"></div>
      <button
        id="${GLOBAL_BACK_BUTTON_ID}"
        type="button"
        class="global-back-button"
        aria-label="${escapeAttribute(getGlobalBackAriaLabel())}"
        title="${escapeAttribute(getGlobalBackAriaLabel())}"
      >
        <span aria-hidden="true">&#8592;</span>
      </button>
      <main class="page-root page-root--content">
        ${pageMarkup}
        ${appendixMarkup}
      </main>
    </div>
  `;
}

function renderRouteAppendix(route: StaticNonFireRoutePath): string {
  if (route !== ROUTES.carvings) {
    return "";
  }

  return `
    <section class="carvings-articles-entry">
      <button
        id="carvings-articles-link"
        type="button"
        class="carvings-articles-entry__card"
        aria-label="${copy.routeAppendix.openAriaLabel}"
      >
        <p class="carvings-articles-entry__label">${copy.routeAppendix.label}</p>
        <h2>${copy.routeAppendix.title}</h2>
        <p class="muted-copy">${copy.routeAppendix.description}</p>
      </button>
    </section>
  `;
}

export function renderFirewordsPage(): string {
  return `
    <section class="page-intro">
      <p class="page-kicker">${copy.firewords.kicker}</p>
      <h1 class="page-title">${copy.firewords.title}</h1>
      <p class="page-lead">${copy.firewords.lead}</p>
    </section>

    <div class="firewords-toolbar">
      <button id="firewords-refresh" type="button" class="action-button">${copy.firewords.refreshButton}</button>
      <p id="firewords-status" class="action-tip">${copy.firewords.statusInitial}</p>
    </div>

    <section id="firewords-grid" class="quote-grid" aria-label="${copy.firewords.ariaLabel}">
      <article class="quote-card">
        <p class="quote-card__text">${copy.firewords.loadingText}</p>
        <p class="quote-card__meta">Loading</p>
      </article>
    </section>
  `;
}

export function renderOnwardPage(): string {
  const prompts = copy.onward.prompts
    .map(
      (prompt) =>
        `<button type=\"button\" class=\"prompt-pill\" data-onward-prompt=\"${escapeAttribute(prompt.value)}\">${prompt.label}</button>`
    )
    .join("");

  return `
    <section class="page-intro">
      <p class="page-kicker">${copy.onward.kicker}</p>
      <h1 class="page-title">${copy.onward.title}</h1>
      <p class="page-lead">${copy.onward.lead}</p>
    </section>

    <section class="content-grid content-grid--two onward-content-grid">
      <article class="content-card onward-compose-card">
        <h2>${copy.onward.writeTitle}</h2>
        <label class="field-label" for="${ONWARD_INPUT_ID}">${copy.onward.fieldLabel}</label>
        <textarea
          id="${ONWARD_INPUT_ID}"
          class="field-input field-input--textarea"
          maxlength="1000"
          placeholder="${copy.onward.placeholder}"
        ></textarea>

        <div class="prompt-list" aria-label="${copy.onward.promptAriaLabel}">
          ${prompts}
        </div>

        <div class="onward-compose-actions">
          <button id="${ONWARD_SUBMIT_BUTTON_ID}" type="button" class="action-button">${copy.onward.actionButton}</button>
          <button id="${ONWARD_CANCEL_EDIT_BUTTON_ID}" type="button" class="ghost-button" hidden>${copy.onward.cancelEditButton}</button>
        </div>
        <p class="action-tip">${copy.onward.actionTip}</p>
        <p id="${ONWARD_FORM_STATUS_ID}" class="action-tip onward-status" role="status" aria-live="polite"></p>

        <section class="onward-preview-block">
          <h3>${copy.onward.previewTitle}</h3>
          <div id="${ONWARD_PREVIEW_ID}" class="preview-quote markdown-body">${copy.onward.previewEmpty}</div>
          <p class="muted-copy">${copy.onward.previewTip}</p>
        </section>
      </article>

      <article class="content-card onward-history-card">
        <div class="onward-history-head">
          <h2>${copy.onward.historyTitle}</h2>
          <div class="onward-tabs" role="tablist" aria-label="${copy.onward.historyTitle}">
            <button
              id="${ONWARD_TAB_HISTORY_ID}"
              type="button"
              class="onward-tab is-active"
              aria-selected="true"
              data-onward-tab="history"
            >${copy.onward.tabHistory}</button>
            <button
              id="${ONWARD_TAB_RECYCLE_ID}"
              type="button"
              class="onward-tab"
              aria-selected="false"
              data-onward-tab="recycle"
            >${copy.onward.tabRecycle}</button>
          </div>
        </div>
        <p id="${ONWARD_LIST_STATUS_ID}" class="action-tip onward-status" role="status" aria-live="polite">${copy.onward.historyLoading}</p>

        <section class="onward-panel is-active" data-onward-panel="history">
          <ul id="${ONWARD_HISTORY_LIST_ID}" class="onward-record-list" aria-label="${copy.onward.historyTitle}"></ul>
        </section>

        <section class="onward-panel" data-onward-panel="recycle" hidden>
          <h3 class="onward-panel__title">${copy.onward.recycleTitle}</h3>
          <ul id="${ONWARD_RECYCLE_LIST_ID}" class="onward-record-list" aria-label="${copy.onward.recycleTitle}"></ul>
        </section>
      </article>
    </section>
  `;
}

export function renderCarvingsPage(): string {
  const rotatorTexts = getCarvingsRotatorTexts();
  const firstRotatorText = rotatorTexts[0] ?? copy.carvings.quote1Text;

  return `
    <section class="page-intro">
      <p class="page-kicker">${copy.carvings.kicker}</p>
      <h1 class="page-title">${copy.carvings.title}</h1>
      <p class="page-lead">${copy.carvings.lead}</p>
    </section>

    <section class="content-grid content-grid--two">
      <article class="content-card">
        <h2>${copy.carvings.ideaTitle}</h2>
        <p class="muted-copy">${copy.carvings.ideaP1}</p>
        <p class="muted-copy">${copy.carvings.ideaP2}</p>
        <p class="muted-copy">${copy.carvings.ideaP3}</p>
      </article>

      <article class="content-card">
        <h2>${copy.carvings.storyTitle}</h2>
        <p class="muted-copy">${copy.carvings.storyP1}</p>
        <p class="muted-copy">${copy.carvings.storyP2}</p>
        <p class="muted-copy">${copy.carvings.storyP3}</p>
      </article>
    </section>

    <section class="content-grid content-grid--three">
      <article class="content-card">
        <h2>${copy.carvings.quote1Title}</h2>
        <p id="${CARVINGS_ROTATOR_TEXT_ID}" class="muted-copy carvings-rotator-text">${firstRotatorText}</p>
      </article>
      <article class="content-card">
        <h2>${copy.carvings.quote2Title}</h2>
        <p class="muted-copy">${copy.carvings.quote2Text}</p>
      </article>
      <article class="content-card">
        <h2>${copy.carvings.quote3Title}</h2>
        <p class="muted-copy">${copy.carvings.quote3Text}</p>
      </article>
    </section>
  `;
}

function getCarvingsRotatorTexts(): string[] {
  if (currentLocale === "zh-CN") {
    return [
      "“愿每一次认真对话，都有一个不被遗忘的位置。”",
      "“此刻被记下的语言，曾被某人全心说出。”",
      "“不是每一句话都改变了世界，但它们改变了我们。”",
      "“再微小的句子，也有成为回声的可能。”",
      "“真正的火，藏在一句话之后。”",
      "“刻下它，不为永恒，只为承认：它曾照亮。”",
      "“你说出时并不知道，但那是我记得最久的一句话。”",
      "“语言不会留下火焰，但我们记得烧过。”",
      "“不是因为重要才被铭刻，而是因为曾被珍惜。”",
      "“有些话，是用来留下的，不是用来回应的。”",
      "“一段话成为碑文，不是因它说得好，而是它说过。”",
      "“它们没有答案，却值得被读第二遍。”",
    ];
  }

  return [
    "May every earnest conversation find a place never forgotten.",
    "These words, now recorded, were once spoken with a whole heart.",
    "Not every word changed the world, but they changed us.",
    "Even the smallest phrase can become an echo.",
    "The true fire hides behind a single line.",
    "Carved not for eternity, but to admit—it once gave light.",
    "You didn't know then—but that was the line I remembered longest.",
    "Words leave no flame, but we remember the burning.",
    "Not carved for its greatness, but because it was once cherished.",
    "Some words are meant to be kept, not answered.",
    "A phrase becomes a carving not because it's perfect, but because it was said.",
    "They offer no answers, yet are worth a second read.",
  ];
}

type ArticleSummaryFilter = "all" | "with-summary" | "without-summary";
type ArticleSortOption = "latest" | "oldest" | "title";

interface ArticleListState {
  query: string;
  category: string;
  summaryFilter: ArticleSummaryFilter;
  sort: ArticleSortOption;
}

function getArticleUiCopy() {
  return copy.articleUi;
}
export function renderCarvingsArticlesPage(): string {
  const articleCopy = getArticleUiCopy();
  const categories = getArticleCategories();
  const categoryOptions = categories
    .map(
      (category) =>
        `<option value="${escapeAttribute(category)}">${escapeHtml(category)}</option>`
    )
    .join("");
  const initialList = sortArticles(articleListCache, "latest");
  const hasLoadedArticles = articleListLoaded;

  return `
    <section class="page-intro">
      <p class="page-kicker">${articleCopy.pageKicker}</p>
      <h1 class="page-title">${copy.carvingsArticles.title}</h1>
      <p class="page-lead">${copy.carvingsArticles.lead}</p>
    </section>

    <section class="carvings-articles-toolbar" aria-label="${copy.carvingsArticles.ariaLabel}">
      <div class="carvings-articles-control carvings-articles-control--search">
        <label class="carvings-articles-control__label" for="${ARTICLES_SEARCH_INPUT_ID}">
          ${articleCopy.searchLabel}
        </label>
        <input
          id="${ARTICLES_SEARCH_INPUT_ID}"
          class="field-input carvings-articles-control__field"
          type="search"
          placeholder="${articleCopy.searchPlaceholder}"
          autocomplete="off"
        />
      </div>

      <div class="carvings-articles-control">
        <label class="carvings-articles-control__label" for="${ARTICLES_CATEGORY_FILTER_ID}">
          ${articleCopy.categoryLabel}
        </label>
        <select id="${ARTICLES_CATEGORY_FILTER_ID}" class="field-input carvings-articles-control__field">
          <option value="all">${articleCopy.categoryAll}</option>
          ${categoryOptions}
        </select>
      </div>

      <div class="carvings-articles-control">
        <label class="carvings-articles-control__label" for="${ARTICLES_SUMMARY_FILTER_ID}">
          ${articleCopy.summaryLabel}
        </label>
        <select id="${ARTICLES_SUMMARY_FILTER_ID}" class="field-input carvings-articles-control__field">
          <option value="all">${articleCopy.summaryAll}</option>
          <option value="with-summary">${articleCopy.summaryWith}</option>
          <option value="without-summary">${articleCopy.summaryWithout}</option>
        </select>
      </div>

      <div class="carvings-articles-control">
        <label class="carvings-articles-control__label" for="${ARTICLES_SORT_FILTER_ID}">
          ${articleCopy.sortLabel}
        </label>
        <select id="${ARTICLES_SORT_FILTER_ID}" class="field-input carvings-articles-control__field">
          <option value="latest">${articleCopy.sortLatest}</option>
          <option value="oldest">${articleCopy.sortOldest}</option>
          <option value="title">${articleCopy.sortTitle}</option>
        </select>
      </div>

      <button id="${ARTICLES_CLEAR_BUTTON_ID}" type="button" class="action-button carvings-articles-clear">
        ${articleCopy.clearFilters}
      </button>
    </section>

    <p id="${ARTICLES_RESULTS_COUNT_ID}" class="carvings-articles-count">
      ${
        hasLoadedArticles
          ? articleCopy.resultCount(initialList.length, articleListCache.length)
          : articleCopy.loadingList
      }
    </p>

    <section id="${ARTICLES_RESULTS_ID}" class="carvings-articles-list" aria-live="polite">
      ${
        hasLoadedArticles
          ? renderCarvingsArticleRows(initialList)
          : renderArticleListStatus(articleCopy.loadingList)
      }
    </section>
  `;
}

function renderCarvingsArticleRows(items: ArticleListItem[]): string {
  const articleCopy = getArticleUiCopy();
  if (!items.length) {
    return `<article class="carvings-article-row carvings-article-row--empty">${articleCopy.resultEmpty}</article>`;
  }

  return items.map((article) => renderCarvingsArticleRow(article)).join("");
}

function renderArticleListStatus(message: string): string {
  return `<article class="carvings-article-row carvings-article-row--empty">${escapeHtml(message)}</article>`;
}

function renderCarvingsArticleRow(article: ArticleListItem): string {
  const articleCopy = getArticleUiCopy();
  const summary = article.summary?.trim()
    ? `<p class="carvings-article-row__summary">${escapeHtml(article.summary)}</p>`
    : `<p class="carvings-article-row__summary carvings-article-row__summary--missing">${articleCopy.missingSummary}</p>`;
  const tags = article.tags
    .map((tag) => `<span class="carvings-article-row__tag">${escapeHtml(tag)}</span>`)
    .join("");

  return `
    <article class="carvings-article-row">
      <p class="carvings-article-row__meta">
        <span>${formatArticleDate(article.publishedAt)}</span>
        <span>${articleCopy.articleMetaBy} ${escapeHtml(article.author.name)}</span>
        <span>${article.readMinutes} ${articleCopy.articleMetaReadTimeSuffix}</span>
        <span>${escapeHtml(article.category)}</span>
      </p>

      <button
        type="button"
        class="carvings-article-row__title"
        data-open-article="${escapeAttribute(article.id)}"
      >
        ${escapeHtml(article.title)}
      </button>

      ${summary}

      <div class="carvings-article-row__footer">
        <div class="carvings-article-row__tags">${tags}</div>
        <button
          type="button"
          class="carvings-article-row__open"
          data-open-article="${escapeAttribute(article.id)}"
        >
          ${articleCopy.readLabel}
        </button>
      </div>
    </article>
  `;
}

export function renderArticleDetailPage(route: ArticleDetailRoutePath): string {
  const articleId = extractArticleId(route);
  const article = articleId ? articleDetailCache.get(articleId) ?? null : null;
  const articleCopy = getArticleUiCopy();

  if (!articleId) {
    return `
      <section class="article-detail article-detail--missing">
        <p class="page-kicker">${articleCopy.articleKicker}</p>
        <h1 class="page-title">${articleCopy.articleNotFoundTitle}</h1>
        <p class="page-lead">${articleCopy.articleNotFoundLead}</p>
        <button id="${ARTICLE_BACK_BUTTON_ID}" type="button" class="action-button">
          ${articleCopy.backToList}
        </button>
      </section>
    `;
  }

  const detailError = articleDetailErrors.get(articleId);
  if (detailError) {
    return `
      <section class="article-detail article-detail--missing">
        <p class="page-kicker">${articleCopy.articleKicker}</p>
        <h1 class="page-title">${articleCopy.articleNotFoundTitle}</h1>
        <p class="page-lead">${escapeHtml(detailError || articleCopy.loadDetailFailed)}</p>
        <button id="${ARTICLE_BACK_BUTTON_ID}" type="button" class="action-button">
          ${articleCopy.backToList}
        </button>
      </section>
    `;
  }

  if (missingArticleIds.has(articleId)) {
    return `
      <section class="article-detail article-detail--missing">
        <p class="page-kicker">${articleCopy.articleKicker}</p>
        <h1 class="page-title">${articleCopy.articleNotFoundTitle}</h1>
        <p class="page-lead">${articleCopy.articleNotFoundLead}</p>
        <button id="${ARTICLE_BACK_BUTTON_ID}" type="button" class="action-button">
          ${articleCopy.backToList}
        </button>
      </section>
    `;
  }

  if (!article) {
    return `
      <section class="article-detail article-detail--missing">
        <p class="page-kicker">${articleCopy.articleKicker}</p>
        <h1 class="page-title">${articleCopy.loadingDetail}</h1>
        <p class="page-lead">${articleCopy.loadingDetail}</p>
        <button id="${ARTICLE_BACK_BUTTON_ID}" type="button" class="action-button">
          ${articleCopy.backToList}
        </button>
      </section>
    `;
  }

  const sectionsMarkup = article.sections
    .map(
      (section) => `
      <section id="${escapeAttribute(section.id)}" class="article-detail__section">
        <h2>${escapeHtml(section.heading)}</h2>
        ${section.paragraphs
          .map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`)
          .join("")}
      </section>
    `
    )
    .join("");

  const tocMarkup = article.sections
    .map((section, index) => {
      const fullHeading = section.heading.trim();
      const tocLabel = formatArticleTocLabel(fullHeading, index);
      return `<li><a href="#${escapeAttribute(section.id)}" title="${escapeAttribute(fullHeading)}">${escapeHtml(tocLabel)}</a></li>`;
    })
    .join("");
  const shouldRenderToc = article.sections.length > 1;

  const relatedLinksMarkup = article.links
    .map((link) => {
      const external = isExternalLink(link.href);
      const target = external ? ` target="_blank" rel="noreferrer noopener"` : "";
      return `
        <li>
          <a class="article-detail__related-link" href="${escapeAttribute(link.href)}"${target}>
            ${escapeHtml(link.label)}
          </a>
          ${
            link.description
              ? `<p class="article-detail__related-description">${escapeHtml(link.description)}</p>`
              : ""
          }
        </li>
      `;
    })
    .join("");

  const sortedList = sortArticles(articleListCache, "latest");
  const articleIndex = sortedList.findIndex((item) => item.id === article.id);
  const previousArticle = articleIndex > 0 ? sortedList[articleIndex - 1] : null;
  const nextArticle =
    articleIndex >= 0 && articleIndex < sortedList.length - 1
      ? sortedList[articleIndex + 1]
      : null;
  const authorMarkup = article.author.profileUrl
    ? `<a class="article-detail__author-link" href="${escapeAttribute(article.author.profileUrl)}" target="_blank" rel="noreferrer noopener">${escapeHtml(article.author.name)}</a>`
    : escapeHtml(article.author.name);

  return `
    <article class="article-detail">
      <header class="article-detail__header">
        <p class="page-kicker">${articleCopy.articleKicker}</p>
        <h1 class="page-title">${escapeHtml(article.title)}</h1>
        <p class="page-lead">${escapeHtml(article.summary ?? articleCopy.missingSummary)}</p>
        <p class="article-detail__meta">
          <span>${articleCopy.signaturePrefix} ${authorMarkup}</span>
          <span>${escapeHtml(article.author.role)}</span>
          <span>${articleCopy.publishedPrefix} ${formatArticleDate(article.publishedAt)}</span>
          <span>${articleCopy.articleMetaUpdated} ${formatArticleDate(article.updatedAt ?? article.publishedAt)}</span>
        </p>
      </header>

      ${
        shouldRenderToc
          ? `
      <nav class="article-detail__toc" aria-label="${articleCopy.onThisPage}">
        <p class="article-detail__toc-title">${articleCopy.onThisPage}</p>
        <ol>
          ${tocMarkup}
        </ol>
      </nav>
      `
          : ""
      }

      <div class="article-detail__body">
        ${sectionsMarkup}
      </div>

      <section class="article-detail__related">
        <h2>${articleCopy.relatedLinks}</h2>
        <ul>${relatedLinksMarkup}</ul>
      </section>

      <footer class="article-detail__footer">
        <div class="article-detail__actions">
          <button id="${ARTICLE_BACK_BUTTON_ID}" type="button" class="action-button">
            ${articleCopy.backToList}
          </button>
          <button
            id="${ARTICLE_COPY_LINK_BUTTON_ID}"
            type="button"
            class="action-button"
            data-default-label="${articleCopy.copyLink}"
            data-copied-label="${articleCopy.copied}"
          >
            ${articleCopy.copyLink}
          </button>
        </div>

        <div class="article-detail__neighbors">
          ${
            previousArticle
              ? `<button type="button" class="article-detail__neighbor" data-open-article="${escapeAttribute(previousArticle.id)}">${articleCopy.previousArticle}: ${escapeHtml(previousArticle.title)}</button>`
              : ""
          }
          ${
            nextArticle
              ? `<button type="button" class="article-detail__neighbor" data-open-article="${escapeAttribute(nextArticle.id)}">${articleCopy.nextArticle}: ${escapeHtml(nextArticle.title)}</button>`
              : ""
          }
        </div>
      </footer>
    </article>
  `;
}

export function renderUnburntPage(): string {
  return `
    <section class="page-intro page-intro--split">
      <div class="page-intro__main">
        <p class="page-kicker">${copy.unburnt.kicker}</p>
        <h1 class="page-title">${copy.unburnt.title}</h1>
        <p class="page-lead">${copy.unburnt.lead}</p>
      </div>
      <div class="page-intro__aside">
        <button id="${UNBURNT_MINE_ENTRY_ID}" type="button" class="ghost-button unburnt-mine-entry">
          ${copy.unburnt.pageMineEntryButton}
        </button>
      </div>
    </section>

    <section class="unburnt-list-shell unburnt-public-shell">
      <article class="content-card unburnt-list-card unburnt-public-card">
        <header class="unburnt-list-card__head">
          <h2>${copy.unburnt.pagePublicTitle}</h2>
        </header>
        <p id="${UNBURNT_PUBLIC_STATUS_ID}" class="action-tip">${copy.unburnt.listLoadingPublic}</p>
        <div id="${UNBURNT_PUBLIC_FEED_ID}" class="unburnt-public-feed unburnt-scroll-shell" aria-label="${copy.unburnt.pagePublicTitle}">
          <div id="${UNBURNT_PUBLIC_LIST_ID}" class="fragment-grid unburnt-public-list"></div>
          <div id="${UNBURNT_PUBLIC_SENTINEL_ID}" class="unburnt-public-sentinel" aria-hidden="true"></div>
        </div>
      </article>
    </section>
  `;
}

export function renderUnburntMinePage(): string {
  return `
    <section class="page-intro page-intro--split">
      <div class="page-intro__main">
        <p class="page-kicker">${copy.unburnt.kicker}</p>
        <h1 class="page-title">${copy.unburnt.pageMineTitle}</h1>
        <p class="page-lead">${copy.unburnt.pageMineLead}</p>
      </div>
      <div class="page-intro__aside">
        <button id="${UNBURNT_NEW_BUTTON_ID}" type="button" class="action-button">${copy.unburnt.pageNewButton}</button>
      </div>
    </section>

    <section class="unburnt-list-shell">
      <article class="content-card unburnt-list-card unburnt-mine-card">
        <header class="unburnt-list-card__head">
          <h2>${copy.unburnt.pageMineTitle}</h2>
          <div id="${UNBURNT_MINE_FILTER_ID}" class="unburnt-filter-row" role="tablist" aria-label="${copy.unburnt.pageMineTitle}">
            <button type="button" class="unburnt-filter-button is-active" data-visibility="all">${copy.unburnt.filterAll}</button>
            <button type="button" class="unburnt-filter-button" data-visibility="public">${copy.unburnt.filterPublic}</button>
            <button type="button" class="unburnt-filter-button" data-visibility="private">${copy.unburnt.filterPrivate}</button>
          </div>
        </header>
        <p id="${UNBURNT_MINE_STATUS_ID}" class="action-tip">${copy.unburnt.listLoadingMine}</p>
        <div id="${UNBURNT_MINE_LIST_ID}" class="fragment-grid unburnt-mine-list unburnt-scroll-shell" aria-label="${copy.unburnt.pageMineTitle}"></div>
        <button id="${UNBURNT_MINE_LOAD_MORE_ID}" type="button" class="ghost-button" hidden>${copy.unburnt.listLoadMore}</button>
      </article>
    </section>
  `;
}

export function renderUnburntComposerPage(): string {
  const stageTitleA = currentLocale === "zh-CN" ? "步骤 A · 粘贴原文" : "Step A · Paste raw text";
  const stageTitleB = currentLocale === "zh-CN" ? "步骤 B · 结构切分" : "Step B · Split structure";
  const stageTitleC = currentLocale === "zh-CN" ? "步骤 C · 元信息填写" : "Step C · Fill metadata";
  const progressAriaLabel =
    currentLocale === "zh-CN" ? "创建进度：A、B、C 三个步骤" : "Creation progress: steps A, B, C";
  const progressBackLabel = currentLocale === "zh-CN" ? "返回上一步" : "Back to previous step";
  const splitGuide =
    currentLocale === "zh-CN"
      ? "在行与行之间点击分界线完成切分，亮线表示已选中的切分点。"
      : "Click divider lines between rows to split messages. Bright lines are active boundaries.";

  return `
    <section class="page-intro">
      <p class="page-kicker">${copy.unburnt.kicker}</p>
      <h1 class="page-title">${copy.unburnt.composerTitleCreate}</h1>
      <p class="page-lead">${copy.unburnt.lead}</p>
    </section>

    <section class="unburnt-composer-shell">
      <article class="content-card unburnt-stage-progress-card">
        <nav id="${UNBURNT_STAGE_PROGRESS_ID}" class="unburnt-stage-progress" aria-label="${progressAriaLabel}">
          <ol class="unburnt-stage-progress__track">
            <li class="unburnt-stage-progress__item is-active" data-stage-progress="paste">
              <span class="unburnt-stage-progress__badge">A</span>
              <span class="unburnt-stage-progress__label">${stageTitleA}</span>
            </li>
            <li class="unburnt-stage-progress__item" data-stage-progress="split">
              <span class="unburnt-stage-progress__badge">B</span>
              <span class="unburnt-stage-progress__label">${stageTitleB}</span>
            </li>
            <li class="unburnt-stage-progress__item" data-stage-progress="meta">
              <span class="unburnt-stage-progress__badge">C</span>
              <span class="unburnt-stage-progress__label">${stageTitleC}</span>
            </li>
          </ol>
        </nav>
      </article>

      <article class="content-card unburnt-composer-card">
        <p id="${UNBURNT_COMPOSER_STATUS_ID}" class="action-tip" role="status" aria-live="polite"></p>

        <section id="${UNBURNT_STAGE_STRUCTURE_ID}" class="unburnt-stage-section unburnt-stage-section--paste">
          <p class="muted-copy">${copy.unburnt.stageStructureHint}</p>
          <label class="field-label" for="${UNBURNT_RAW_TEXT_INPUT_ID}">${copy.unburnt.rawTextLabel}</label>
          <textarea
            id="${UNBURNT_RAW_TEXT_INPUT_ID}"
            class="field-input field-input--textarea unburnt-raw-textarea"
            placeholder="${copy.unburnt.rawTextPlaceholder}"
          ></textarea>
        </section>

        <section id="${UNBURNT_STAGE_SPLIT_ID}" class="unburnt-stage-section unburnt-stage-section--split" hidden>
          <header class="unburnt-split-cta">
            <p class="unburnt-split-cta__text">${splitGuide}</p>
          </header>

          <div class="unburnt-split-grid">
            <section class="unburnt-split-pane">
              <h3>${copy.unburnt.splitBoundariesTitle}</h3>
              <div id="${UNBURNT_LINES_CONTAINER_ID}" class="unburnt-lines-shell unburnt-scroll-shell">
                <p class="action-tip">${copy.unburnt.splitLinesEmpty}</p>
              </div>
            </section>

            <section class="unburnt-split-pane">
              <h3>${copy.unburnt.messagesTitle}</h3>
              <div id="${UNBURNT_MESSAGES_CONTAINER_ID}" class="unburnt-messages-shell unburnt-messages-shell--composer unburnt-scroll-shell">
                <p class="action-tip">${copy.unburnt.messagesEmpty}</p>
              </div>
            </section>
          </div>
        </section>

        <section id="${UNBURNT_STAGE_META_ID}" class="unburnt-stage-section unburnt-stage-section--meta" hidden>
          <p class="muted-copy">${copy.unburnt.stageMetaHint}</p>

          <div class="unburnt-meta-grid">
            <div class="unburnt-meta-form unburnt-scroll-shell">
              <div class="unburnt-meta-row">
                <div class="unburnt-meta-field">
                  <label class="field-label" for="${UNBURNT_META_TITLE_ID}">${copy.unburnt.metaTitleLabel}</label>
                  <input id="${UNBURNT_META_TITLE_ID}" class="field-input" maxlength="120" />
                </div>

                <div class="unburnt-meta-field">
                  <label class="field-label" for="${UNBURNT_META_TAGS_ID}">${copy.unburnt.metaTagsLabel}</label>
                  <input id="${UNBURNT_META_TAGS_ID}" class="field-input" placeholder="${copy.unburnt.metaTagsPlaceholder}" />
                </div>

                <div class="unburnt-meta-field">
                  <label class="field-label" for="${UNBURNT_META_VISIBILITY_ID}">${copy.unburnt.metaVisibilityLabel}</label>
                  <select id="${UNBURNT_META_VISIBILITY_ID}" class="field-input">
                    <option value="private">${copy.unburnt.metaVisibilityPrivate}</option>
                    <option value="public">${copy.unburnt.metaVisibilityPublic}</option>
                  </select>
                </div>
              </div>

              <div class="unburnt-meta-field unburnt-meta-field--summary">
                <label class="field-label" for="${UNBURNT_META_SUMMARY_ID}">${copy.unburnt.metaSummaryLabel}</label>
                <textarea id="${UNBURNT_META_SUMMARY_ID}" class="field-input field-input--textarea" maxlength="500"></textarea>
              </div>
            </div>
          </div>
        </section>

        <footer class="unburnt-stage-controls">
          <button id="${UNBURNT_STAGE_BACK_ID}" type="button" class="ghost-button unburnt-stage-controls__back" hidden>
            ${progressBackLabel}
          </button>
          <button id="${UNBURNT_STAGE_NEXT_ID}" type="button" class="action-button unburnt-stage-controls__next">
            ${copy.unburnt.parseTextButton}
          </button>
        </footer>

        <div
          id="${UNBURNT_PREVIEW_MODAL_ID}"
          class="unburnt-preview-modal"
          role="dialog"
          aria-modal="true"
          aria-label="${copy.unburnt.saveCreateButton}"
          aria-hidden="true"
        >
          <div class="unburnt-preview-modal__backdrop" data-unburnt-preview-close="true"></div>
          <section class="unburnt-preview-modal__panel">
            <button
              id="${UNBURNT_PREVIEW_MODAL_CLOSE_ID}"
              type="button"
              class="unburnt-preview-modal__close"
              aria-label="${copy.infoDock.closeButtonAriaLabel}"
              data-unburnt-preview-close="true"
            >
              &times;
            </button>
            <section class="unburnt-preview-modal__section unburnt-preview-modal__section--card">
              <h3>${copy.unburnt.previewCardTitle}</h3>
              <div id="${UNBURNT_PREVIEW_CARD_ID}" class="unburnt-preview-card unburnt-scroll-shell"></div>
            </section>
            <section class="unburnt-preview-modal__section unburnt-preview-modal__section--detail">
              <h3>${copy.unburnt.previewDetailTitle}</h3>
              <div id="${UNBURNT_PREVIEW_DETAIL_ID}" class="unburnt-preview-detail unburnt-scroll-shell"></div>
            </section>
            <div class="unburnt-preview-modal__actions">
              <button id="${UNBURNT_PREVIEW_MODAL_CONFIRM_ID}" type="button" class="action-button">${copy.unburnt.saveCreateButton}</button>
            </div>
          </section>
        </div>
      </article>
    </section>
  `;
}

export function renderUnburntDetailPage(route: UnburntDetailRoutePath | UnburntEditRoutePath): string {
  const unburntId = extractUnburntEditId(route) ?? extractUnburntId(route) ?? "";

  return `
    <section class="page-intro">
      <p class="page-kicker">${copy.unburnt.kicker}</p>
      <h1 class="page-title">${copy.unburnt.title}</h1>
      <p class="page-lead">${copy.unburnt.lead}</p>
    </section>

    <section class="unburnt-detail-shell">
      <p
        id="${UNBURNT_DETAIL_STATUS_ID}"
        class="action-tip unburnt-detail-status"
        role="status"
        aria-live="polite"
      >
        ${copy.unburnt.detailLoading}
      </p>

      <section
        id="${UNBURNT_DETAIL_BODY_ID}"
        class="content-grid content-grid--two unburnt-detail-grid"
        data-unburnt-id="${escapeAttribute(unburntId)}"
      ></section>
    </section>
  `;
}

export function renderEmbersPage(): string {
  return `
    <section class="page-intro">
      <p class="page-kicker">${copy.embers.kicker}</p>
      <h1 class="page-title">${copy.embers.title}</h1>
      <p class="page-lead">${copy.embers.lead}</p>
    </section>

    <section id="${EMBERS_CONTENT_GRID_ID}" class="content-grid content-grid--two embers-content-grid">
      <article class="content-card ember-compose-card">
        <section id="${EMBER_COMPOSE_PANEL_ID}" class="ember-compose-panel">
          <h2>${copy.embers.writeTitle}</h2>
          <form id="ember-form" class="ember-form">
            <label class="field-label" for="ember-name">${copy.embers.nameLabel}</label>
            <input id="ember-name" class="field-input" maxlength="24" placeholder="${copy.embers.namePlaceholder}" />

            <label class="field-label" for="ember-message">${copy.embers.messageLabel}</label>
            <textarea
              id="ember-message"
              class="field-input field-input--textarea"
              maxlength="220"
              placeholder="${copy.embers.messagePlaceholder}"
              required
            ></textarea>

            <button type="submit" class="action-button">${copy.embers.submitButton}</button>
            <p id="ember-form-status" class="action-tip ember-status" role="status" aria-live="polite"></p>
          </form>
        </section>

        <section id="${EMBER_DIALOG_PANEL_ID}" class="ember-dialog-panel" hidden>
          <header class="ember-dialog-panel__head">
            <h2>${copy.embers.listTitle}</h2>
            <button
              id="${EMBER_DIALOG_CLOSE_BUTTON_ID}"
              type="button"
              class="ember-dialog-panel__close"
              aria-label="${copy.infoDock.closeButtonAriaLabel}"
            >
              x
            </button>
          </header>
          <p id="${EMBER_DIALOG_META_ID}" class="ember-item__meta"></p>
          <p id="${EMBER_DIALOG_MESSAGE_ID}" class="ember-dialog-panel__message"></p>
        </section>
      </article>

      <article class="content-card embers-flame-card">
        <div class="embers-side-head">
          <h2>${copy.embers.listTitle}</h2>
          <button id="${EMBER_VIEW_TOGGLE_ID}" type="button" class="ember-view-toggle" hidden></button>
        </div>
        <p id="ember-list-status" class="action-tip ember-status" role="status" aria-live="polite">
          ${copy.embers.listLoading}
        </p>
        <section id="${EMBERS_LIST_PANEL_ID}" class="embers-list-panel unburnt-scroll-shell" hidden>
          <ul id="${EMBER_LIST_ID}" class="ember-list" aria-live="polite"></ul>
        </section>
        <div id="${EMBERS_FLAME_SHELL_ID}" class="embers-flame-shell" data-nav-summon="ignore">
          <div
            id="${EMBERS_FLAME_SLOT_ID}"
            class="embers-flame-slot"
            role="button"
            tabindex="0"
            data-nav-summon="ignore"
            aria-label="${copy.embers.listTitle}"
          ></div>
          <div id="${EMBERS_PARTICLE_LAYER_ID}" class="embers-particle-layer" data-nav-summon="ignore"></div>
          <button id="${EMBER_HOVER_PREVIEW_ID}" type="button" class="ember-hover-preview" hidden></button>
        </div>
      </article>
    </section>
  `;
}

export function setupPageInteractions(route: NonFireRoutePath) {
  if (route === ROUTES.firewords) {
    void setupFirewordsPage();
    return;
  }

  if (route === ROUTES.carvings) {
    setupCarvingsPage();
    return;
  }

  if (route === ROUTES.carvingsArticles) {
    setupCarvingsArticlesPage();
    return;
  }

  if (isArticleDetailRoute(route)) {
    setupArticleDetailPage(route);
    return;
  }

  if (route === ROUTES.unburnt) {
    void setupUnburntPublicPage();
    return;
  }

  if (route === ROUTES.unburntMine) {
    void setupUnburntMinePage();
    return;
  }

  if (route === ROUTES.unburntNew) {
    void setupUnburntComposerPage();
    return;
  }

  if (isUnburntDetailRoute(route) || isUnburntEditRoute(route)) {
    void setupUnburntDetailPage(route);
    return;
  }

  if (route === ROUTES.onward) {
    void setupOnwardPage();
    return;
  }

  if (route === ROUTES.embers) {
    void setupEmbersPage();
  }
}

function setupCarvingsPage() {
  cleanupCarvingsTextRotator();

  const articlesLink = document.getElementById(
    "carvings-articles-link"
  ) as HTMLButtonElement | null;

  if (articlesLink) {
    articlesLink.addEventListener("click", () => {
      navigate(ROUTES.carvingsArticles);
    });
  }

  const textElement = document.getElementById(
    CARVINGS_ROTATOR_TEXT_ID
  ) as HTMLParagraphElement | null;
  const items = getCarvingsRotatorTexts();

  if (!textElement || items.length <= 1) {
    return;
  }

  let currentIndex = 0;
  const intervalId = window.setInterval(() => {
    currentIndex = (currentIndex + 1) % items.length;
    textElement.textContent = items[currentIndex];
  }, CARVINGS_ROTATOR_INTERVAL_MS);

  carvingsTextRotatorCleanup = () => {
    window.clearInterval(intervalId);
  };
}

function setupCarvingsArticlesPage() {
  const searchInput = document.getElementById(
    ARTICLES_SEARCH_INPUT_ID
  ) as HTMLInputElement | null;
  const categoryFilter = document.getElementById(
    ARTICLES_CATEGORY_FILTER_ID
  ) as HTMLSelectElement | null;
  const summaryFilter = document.getElementById(
    ARTICLES_SUMMARY_FILTER_ID
  ) as HTMLSelectElement | null;
  const sortFilter = document.getElementById(
    ARTICLES_SORT_FILTER_ID
  ) as HTMLSelectElement | null;
  const clearButton = document.getElementById(
    ARTICLES_CLEAR_BUTTON_ID
  ) as HTMLButtonElement | null;
  const results = document.getElementById(ARTICLES_RESULTS_ID) as HTMLElement | null;
  const resultCount = document.getElementById(
    ARTICLES_RESULTS_COUNT_ID
  ) as HTMLParagraphElement | null;

  if (
    !searchInput ||
    !categoryFilter ||
    !summaryFilter ||
    !sortFilter ||
    !clearButton ||
    !results ||
    !resultCount
  ) {
    return;
  }

  let hasLoadFailure = false;

  const render = () => {
    const articleCopy = getArticleUiCopy();
    syncArticleCategoryOptions(categoryFilter, articleCopy.categoryAll);

    if (hasLoadFailure) {
      results.innerHTML = renderArticleListStatus(articleCopy.loadListFailed);
      resultCount.textContent = articleCopy.loadListFailed;
      return;
    }

    if (!articleListLoaded) {
      results.innerHTML = renderArticleListStatus(articleCopy.loadingList);
      resultCount.textContent = articleCopy.loadingList;
      return;
    }

    const state: ArticleListState = {
      query: searchInput.value.trim().toLowerCase(),
      category: categoryFilter.value,
      summaryFilter: summaryFilter.value as ArticleSummaryFilter,
      sort: sortFilter.value as ArticleSortOption,
    };

    const filtered = filterArticles(state, articleListCache);
    results.innerHTML = renderCarvingsArticleRows(filtered);
    resultCount.textContent = articleCopy.resultCount(
      filtered.length,
      articleListCache.length
    );
    setupArticleOpenButtons(results);
  };

  searchInput.addEventListener("input", render);
  categoryFilter.addEventListener("change", render);
  summaryFilter.addEventListener("change", render);
  sortFilter.addEventListener("change", render);
  clearButton.addEventListener("click", () => {
    searchInput.value = "";
    categoryFilter.value = "all";
    summaryFilter.value = "all";
    sortFilter.value = "latest";
    render();
  });

  void (async () => {
    try {
      await loadArticleList();
      hasLoadFailure = false;
    } catch {
      hasLoadFailure = true;
    }

    if (results.isConnected) {
      render();
    }
  })();

  render();
}

function syncArticleCategoryOptions(
  categoryFilter: HTMLSelectElement,
  allLabel: string
) {
  const currentValue = categoryFilter.value || "all";
  const categories = getArticleCategories();
  const options = [
    `<option value="all">${escapeHtml(allLabel)}</option>`,
    ...categories.map(
      (category) =>
        `<option value="${escapeAttribute(category)}">${escapeHtml(category)}</option>`
    ),
  ].join("");

  if (categoryFilter.innerHTML !== options) {
    categoryFilter.innerHTML = options;
  }

  const hasCurrent = currentValue === "all" || categories.includes(currentValue);
  categoryFilter.value = hasCurrent ? currentValue : "all";
}

function setupArticleDetailPage(route: ArticleDetailRoutePath) {
  const articleId = extractArticleId(route);

  const backButton = document.getElementById(
    ARTICLE_BACK_BUTTON_ID
  ) as HTMLButtonElement | null;
  const copyButton = document.getElementById(
    ARTICLE_COPY_LINK_BUTTON_ID
  ) as HTMLButtonElement | null;

  backButton?.addEventListener("click", () => {
    navigate(ROUTES.carvingsArticles);
  });

  if (copyButton) {
    copyButton.addEventListener("click", async () => {
      const defaultLabel =
        copyButton.dataset.defaultLabel ?? copyButton.textContent ?? "";
      const copiedLabel = copyButton.dataset.copiedLabel ?? defaultLabel;
      const copied = await copyTextToClipboard(window.location.href);

      copyButton.textContent = copied ? copiedLabel : defaultLabel;
      window.setTimeout(() => {
        if (copyButton.isConnected) {
          copyButton.textContent = defaultLabel;
        }
      }, ARTICLE_COPY_LINK_FEEDBACK_MS);
    });
  }

  setupArticleOpenButtons(document);

  if (!articleId) {
    return;
  }

  if (
    articleDetailCache.has(articleId) ||
    missingArticleIds.has(articleId) ||
    articleDetailErrors.has(articleId) ||
    articleDetailLoadPromises.has(articleId)
  ) {
    return;
  }

  void (async () => {
    try {
      await loadArticleList();
      await loadArticleDetail(articleId);
      articleDetailErrors.delete(articleId);
      missingArticleIds.delete(articleId);
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) {
        missingArticleIds.add(articleId);
        articleDetailErrors.delete(articleId);
      } else {
        articleDetailErrors.set(
          articleId,
          readableApiError(error, getArticleUiCopy().loadDetailFailed)
        );
      }
    }

    const activeArticleId =
      isArticleDetailRoute(currentRoute) ? extractArticleId(currentRoute) : null;
    if (activeArticleId === articleId) {
      renderApp();
    }
  })();
}

function setupArticleOpenButtons(scope: ParentNode) {
  const openButtons = scope.querySelectorAll<HTMLElement>("[data-open-article]");
  openButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const articleId = button.dataset.openArticle;
      if (!articleId) {
        return;
      }
      navigate(buildArticleRoute(articleId));
    });
  });
}

async function setupFirewordsPage() {
  const grid = document.getElementById("firewords-grid") as HTMLDivElement | null;
  const status = document.getElementById("firewords-status") as
    | HTMLParagraphElement
    | null;
  const refreshButton = document.getElementById("firewords-refresh") as
    | HTMLButtonElement
    | null;

  if (!grid || !status || !refreshButton) {
    return;
  }

  const requestBatch = async () => {
    refreshButton.disabled = true;
    status.textContent = copy.firewords.statusRefreshing;

    try {
      const quotes = await firewordsQuoteService.getBatch(
        FIREWORDS_BATCH_SIZE,
        currentLocale
      );
      if (!grid.isConnected) {
        return;
      }

      renderFirewordsQuotes(grid, quotes);
      status.textContent = quotes.length
        ? copy.firewords.statusShowing(quotes.length)
        : copy.firewords.statusEmpty;
    } catch {
      if (!grid.isConnected) {
        return;
      }

      renderFirewordsQuotes(grid, []);
      status.textContent = copy.firewords.statusLoadFailed;
    } finally {
      if (refreshButton.isConnected) {
        refreshButton.disabled = false;
      }
    }
  };

  refreshButton.addEventListener("click", () => {
    void requestBatch();
  });

  await requestBatch();
}

function renderFirewordsQuotes(container: HTMLElement, quotes: FlameQuote[]) {
  container.innerHTML = "";

  if (!quotes.length) {
    const emptyCard = document.createElement("article");
    emptyCard.className = "quote-card";

    const text = document.createElement("p");
    text.className = "quote-card__text";
    text.textContent = copy.firewords.emptyText;

    const meta = document.createElement("p");
    meta.className = "quote-card__meta";
    meta.textContent = copy.firewords.emptyMeta;

    emptyCard.appendChild(text);
    emptyCard.appendChild(meta);
    container.appendChild(emptyCard);
    return;
  }

  quotes.forEach((quote) => {
    const card = document.createElement("article");
    card.className = "quote-card";

    const text = document.createElement("p");
    text.className = "quote-card__text";
    text.textContent = formatFirewordsQuoteText(quote.text);

    const meta = document.createElement("p");
    meta.className = "quote-card__meta";
    meta.textContent = quote.source;

    card.appendChild(text);
    card.appendChild(meta);
    container.appendChild(card);
  });
}

function formatFirewordsQuoteText(value: string): string {
  if (containsChineseQuote(value)) {
    return `"${value}"`;
  }

  return `"${value}"`;
}
function containsChineseQuote(value: string): boolean {
  return /[\u3400-\u9FFF]/u.test(value);
}

function mergeUnburntListItems(
  base: UnburntEntryListItem[],
  incoming: UnburntEntryListItem[]
): UnburntEntryListItem[] {
  const seen = new Set<string>();
  const merged = [...base, ...incoming].filter((item) => {
    if (seen.has(item.id)) {
      return false;
    }
    seen.add(item.id);
    return true;
  });

  merged.sort((left, right) => {
    const leftTime = Date.parse(left.createdAt);
    const rightTime = Date.parse(right.createdAt);
    if (leftTime !== rightTime) {
      return rightTime - leftTime;
    }
    return right.id.localeCompare(left.id);
  });

  return merged;
}

function renderUnburntCards(
  target: HTMLDivElement,
  items: UnburntEntryListItem[],
  emptyMessage: string,
  showVisibility = true,
  showEditAction = false
) {
  if (!items.length) {
    target.innerHTML = `
      <article class="fragment-card fragment-card--unburnt fragment-card--empty">
        <p class="fragment-card__snippet">${escapeHtml(emptyMessage)}</p>
      </article>
    `;
    return;
  }

  target.innerHTML = items
    .map((item) => {
      const summary = item.summary?.trim() || " ";
      const visibilityLabel =
        item.visibility === "public"
          ? copy.unburnt.listVisibilityPublic
          : copy.unburnt.listVisibilityPrivate;
      const metadata = [
        ...(showVisibility ? [visibilityLabel] : []),
        copy.unburnt.listMessageCount(item.messageCount),
        formatEmberTime(item.updatedAt),
      ];
      const openDetailAria = `${copy.unburnt.listOpenDetail}: ${item.title}`;

      return `
        <article
          class="fragment-card fragment-card--unburnt fragment-card--interactive"
          data-open-unburnt="${escapeAttribute(item.id)}"
          tabindex="0"
          role="button"
          aria-label="${escapeAttribute(openDetailAria)}"
        >
          <h2 class="fragment-card__head">${escapeHtml(item.title)}</h2>
          <p class="fragment-card__snippet">${escapeHtml(summary)}</p>
          <div class="fragment-card__meta">
            ${metadata.map((value) => `<span>${escapeHtml(value)}</span>`).join("")}
          </div>
          ${
            showEditAction
              ? `
          <button
            type="button"
            class="onward-record-item__action"
            data-edit-unburnt="${escapeAttribute(item.id)}"
          >
            ${copy.unburnt.listEditButton}
          </button>
          `
              : ""
          }
        </article>
      `;
    })
    .join("");
}

async function setupUnburntPublicPage() {
  const mineEntryButton = document.getElementById(UNBURNT_MINE_ENTRY_ID) as HTMLButtonElement | null;
  const publicFeed = document.getElementById(UNBURNT_PUBLIC_FEED_ID) as HTMLDivElement | null;
  const publicList = document.getElementById(UNBURNT_PUBLIC_LIST_ID) as HTMLDivElement | null;
  const publicStatus = document.getElementById(
    UNBURNT_PUBLIC_STATUS_ID
  ) as HTMLParagraphElement | null;
  const publicSentinel = document.getElementById(
    UNBURNT_PUBLIC_SENTINEL_ID
  ) as HTMLDivElement | null;

  if (!mineEntryButton || !publicFeed || !publicList || !publicStatus || !publicSentinel) {
    return;
  }

  let destroyed = false;
  let isLoading = false;
  let publicCursor: string | null = null;
  let publicItems: UnburntEntryListItem[] = [];
  let publicSequence = 0;
  const cleanupTasks: Array<() => void> = [];

  const setPublicStatus = (message: string, isError = false) => {
    if (!publicStatus.isConnected) {
      return;
    }
    publicStatus.textContent = message;
    publicStatus.classList.toggle("unburnt-status--error", isError);
  };

  const loadPublic = async (reset: boolean) => {
    if (isLoading || (!reset && !publicCursor)) {
      return;
    }

    const sequence = ++publicSequence;
    isLoading = true;

    if (reset) {
      publicCursor = null;
      publicItems = [];
      renderUnburntCards(publicList, publicItems, copy.unburnt.listPublicEmpty, false);
      setPublicStatus(copy.unburnt.listLoadingPublic, false);
    }

    try {
      const response = await unburntApiService.listPublic(
        UNBURNT_PUBLIC_LIST_LIMIT,
        reset ? undefined : publicCursor ?? undefined
      );

      if (destroyed || sequence !== publicSequence) {
        return;
      }

      publicItems = mergeUnburntListItems(
        reset ? [] : publicItems,
        Array.isArray(response?.items) ? response.items : []
      );
      publicCursor = response?.nextCursor ?? null;

      renderUnburntCards(publicList, publicItems, copy.unburnt.listPublicEmpty, false);
      setPublicStatus(publicItems.length ? "" : copy.unburnt.listPublicEmpty, false);

    } catch (error) {
      if (destroyed || sequence !== publicSequence) {
        return;
      }

      setPublicStatus(readableApiError(error, copy.unburnt.listPublicFailed), true);
    } finally {
      if (!destroyed && sequence === publicSequence) {
        isLoading = false;
        if (publicCursor && publicFeed.scrollHeight <= publicFeed.clientHeight + 80) {
          void loadPublic(false);
        }
      }
    }
  };

  const handleMineEntryClick = () => {
    navigate(ROUTES.unburntMine);
  };
  mineEntryButton.addEventListener("click", handleMineEntryClick);
  cleanupTasks.push(() => {
    mineEntryButton.removeEventListener("click", handleMineEntryClick);
  });

  const handleOpenDetailClick = (event: Event) => {
    const target = event.target as HTMLElement | null;
    const card = target?.closest<HTMLElement>("[data-open-unburnt]");
    const unburntId = card?.getAttribute("data-open-unburnt")?.trim() ?? "";
    if (!unburntId) {
      return;
    }

    navigate(buildUnburntDetailRoute(unburntId));
  };
  publicList.addEventListener("click", handleOpenDetailClick);
  cleanupTasks.push(() => {
    publicList.removeEventListener("click", handleOpenDetailClick);
  });

  const handleOpenDetailKeydown = (event: KeyboardEvent) => {
    if (event.key !== "Enter" && event.key !== " ") {
      return;
    }

    const target = event.target as HTMLElement | null;
    const card = target?.closest<HTMLElement>("[data-open-unburnt]");
    const unburntId = card?.getAttribute("data-open-unburnt")?.trim() ?? "";
    if (!unburntId) {
      return;
    }

    event.preventDefault();
    navigate(buildUnburntDetailRoute(unburntId));
  };
  publicList.addEventListener("keydown", handleOpenDetailKeydown);
  cleanupTasks.push(() => {
    publicList.removeEventListener("keydown", handleOpenDetailKeydown);
  });

  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) {
          return;
        }
        void loadPublic(false);
      },
      {
        root: publicFeed,
        rootMargin: "0px 0px 280px 0px",
        threshold: 0.01,
      }
    );
    observer.observe(publicSentinel);
    cleanupTasks.push(() => observer.disconnect());
  } else {
    const handleScroll = () => {
      if (publicFeed.scrollTop + publicFeed.clientHeight < publicFeed.scrollHeight - 180) {
        return;
      }
      void loadPublic(false);
    };
    publicFeed.addEventListener("scroll", handleScroll);
    cleanupTasks.push(() => {
      publicFeed.removeEventListener("scroll", handleScroll);
    });
  }

  renderUnburntCards(publicList, publicItems, copy.unburnt.listPublicEmpty, false);

  unburntPageCleanup = () => {
    destroyed = true;
    cleanupTasks.forEach((task) => task());
  };

  await loadPublic(true);
}

async function setupUnburntMinePage() {
  const newButton = document.getElementById(UNBURNT_NEW_BUTTON_ID) as HTMLButtonElement | null;
  const filterRoot = document.getElementById(UNBURNT_MINE_FILTER_ID) as HTMLDivElement | null;
  const mineList = document.getElementById(UNBURNT_MINE_LIST_ID) as HTMLDivElement | null;
  const mineStatus = document.getElementById(UNBURNT_MINE_STATUS_ID) as HTMLParagraphElement | null;
  const mineLoadMore = document.getElementById(
    UNBURNT_MINE_LOAD_MORE_ID
  ) as HTMLButtonElement | null;

  if (!newButton || !filterRoot || !mineList || !mineStatus || !mineLoadMore) {
    return;
  }

  let destroyed = false;
  let mineVisibility: UnburntMineVisibility = "all";
  let mineItems: UnburntEntryListItem[] = [];
  let mineCursor: string | null = null;
  let mineSequence = 0;
  const cleanupTasks: Array<() => void> = [];

  const setMineStatus = (message: string, isError = false) => {
    if (!mineStatus.isConnected) {
      return;
    }
    mineStatus.textContent = message;
    mineStatus.classList.toggle("unburnt-status--error", isError);
  };

  const setFilterButtons = () => {
    const buttons = filterRoot.querySelectorAll<HTMLButtonElement>("[data-visibility]");
    buttons.forEach((button) => {
      const active = button.dataset.visibility === mineVisibility;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-selected", active ? "true" : "false");
    });
  };

  const loadMine = async (reset: boolean) => {
    const sequence = ++mineSequence;
    if (reset) {
      mineCursor = null;
      mineItems = [];
      renderUnburntCards(mineList, mineItems, copy.unburnt.listMineEmpty, true, true);
    }

    setMineStatus(copy.unburnt.listLoadingMine, false);

    try {
      const response = await unburntApiService.listMine(
        mineVisibility,
        UNBURNT_LIST_LIMIT,
        reset ? undefined : mineCursor ?? undefined
      );

      if (destroyed || sequence !== mineSequence) {
        return;
      }

      mineItems = mergeUnburntListItems(
        reset ? [] : mineItems,
        Array.isArray(response?.items) ? response.items : []
      );
      mineCursor = response?.nextCursor ?? null;
      mineLoadMore.hidden = !mineCursor;

      renderUnburntCards(mineList, mineItems, copy.unburnt.listMineEmpty, true, true);
      setMineStatus(mineItems.length ? "" : copy.unburnt.listMineEmpty, false);
    } catch (error) {
      if (destroyed || sequence !== mineSequence) {
        return;
      }

      mineLoadMore.hidden = true;
      setMineStatus(readableApiError(error, copy.unburnt.listMineFailed), true);
    }
  };

  const handleNewButtonClick = () => {
    navigate(ROUTES.unburntNew);
  };
  newButton.addEventListener("click", handleNewButtonClick);
  cleanupTasks.push(() => {
    newButton.removeEventListener("click", handleNewButtonClick);
  });

  const handleFilterClick = (event: Event) => {
    const target = event.target as HTMLElement | null;
    const button = target?.closest<HTMLButtonElement>("[data-visibility]");
    const visibility = button?.dataset.visibility as UnburntMineVisibility | undefined;
    if (!visibility || visibility === mineVisibility) {
      return;
    }

    mineVisibility = visibility;
    setFilterButtons();
    void loadMine(true);
  };
  filterRoot.addEventListener("click", handleFilterClick);
  cleanupTasks.push(() => {
    filterRoot.removeEventListener("click", handleFilterClick);
  });

  const handleMineListClick = (event: Event) => {
    const target = event.target as HTMLElement | null;
    const editButton = target?.closest<HTMLElement>("[data-edit-unburnt]");
    const editId = editButton?.getAttribute("data-edit-unburnt")?.trim() ?? "";
    if (editId) {
      event.preventDefault();
      event.stopPropagation();
      openUnburntDetailEditor(editId);
      return;
    }

    const card = target?.closest<HTMLElement>("[data-open-unburnt]");
    const unburntId = card?.getAttribute("data-open-unburnt")?.trim() ?? "";
    if (!unburntId) {
      return;
    }

    navigate(buildUnburntDetailRoute(unburntId));
  };
  mineList.addEventListener("click", handleMineListClick);
  cleanupTasks.push(() => {
    mineList.removeEventListener("click", handleMineListClick);
  });

  const handleMineListKeydown = (event: KeyboardEvent) => {
    if (event.key !== "Enter" && event.key !== " ") {
      return;
    }

    const target = event.target as HTMLElement | null;
    if (target?.closest("[data-edit-unburnt]")) {
      return;
    }

    const card = target?.closest<HTMLElement>("[data-open-unburnt]");
    const unburntId = card?.getAttribute("data-open-unburnt")?.trim() ?? "";
    if (!unburntId) {
      return;
    }

    event.preventDefault();
    navigate(buildUnburntDetailRoute(unburntId));
  };
  mineList.addEventListener("keydown", handleMineListKeydown);
  cleanupTasks.push(() => {
    mineList.removeEventListener("keydown", handleMineListKeydown);
  });

  const handleMineLoadMore = () => {
    if (!mineCursor) {
      return;
    }
    void loadMine(false);
  };
  mineLoadMore.addEventListener("click", handleMineLoadMore);
  cleanupTasks.push(() => {
    mineLoadMore.removeEventListener("click", handleMineLoadMore);
  });

  setFilterButtons();
  renderUnburntCards(mineList, mineItems, copy.unburnt.listMineEmpty, true, true);

  unburntPageCleanup = () => {
    destroyed = true;
    cleanupTasks.forEach((task) => task());
  };

  await loadMine(true);
}

function renderUnburntMessageBubbles(messages: UnburntMessage[]): string {
  if (!messages.length) {
    return `<p class="action-tip">${copy.unburnt.messagesEmpty}</p>`;
  }

  return messages
    .map((message) => {
      const roleLabel =
        message.role === "user" ? copy.unburnt.messageRoleUser : copy.unburnt.messageRole4o;
      const roleClass = message.role === "user" ? "unburnt-dialog-message--user" : "unburnt-dialog-message--4o";
      return `
        <article class="unburnt-dialog-message ${roleClass}">
          <header class="unburnt-dialog-message__head">
            <span class="unburnt-role-pill">${escapeHtml(roleLabel)}</span>
          </header>
          <div class="unburnt-dialog-message__bubble markdown-body">${renderSafeMarkdown(
            message.content
          )}</div>
        </article>
      `;
    })
    .join("");
}

async function setupUnburntComposerPage() {
  const status = document.getElementById(UNBURNT_COMPOSER_STATUS_ID) as HTMLParagraphElement | null;
  const stageProgress = document.getElementById(UNBURNT_STAGE_PROGRESS_ID) as HTMLElement | null;
  const stageBackButton = document.getElementById(UNBURNT_STAGE_BACK_ID) as HTMLButtonElement | null;
  const stageStructure = document.getElementById(
    UNBURNT_STAGE_STRUCTURE_ID
  ) as HTMLElement | null;
  const stageSplit = document.getElementById(UNBURNT_STAGE_SPLIT_ID) as HTMLElement | null;
  const stageMeta = document.getElementById(UNBURNT_STAGE_META_ID) as HTMLElement | null;
  const rawTextInput = document.getElementById(
    UNBURNT_RAW_TEXT_INPUT_ID
  ) as HTMLTextAreaElement | null;
  const stageNextButton = document.getElementById(UNBURNT_STAGE_NEXT_ID) as HTMLButtonElement | null;
  const linesContainer = document.getElementById(UNBURNT_LINES_CONTAINER_ID) as HTMLDivElement | null;
  const messagesContainer = document.getElementById(
    UNBURNT_MESSAGES_CONTAINER_ID
  ) as HTMLDivElement | null;
  const titleInput = document.getElementById(UNBURNT_META_TITLE_ID) as HTMLInputElement | null;
  const summaryInput = document.getElementById(
    UNBURNT_META_SUMMARY_ID
  ) as HTMLTextAreaElement | null;
  const tagsInput = document.getElementById(UNBURNT_META_TAGS_ID) as HTMLInputElement | null;
  const visibilityInput = document.getElementById(
    UNBURNT_META_VISIBILITY_ID
  ) as HTMLSelectElement | null;
  const previewModal = document.getElementById(UNBURNT_PREVIEW_MODAL_ID) as HTMLDivElement | null;
  const previewModalCloseButton = document.getElementById(
    UNBURNT_PREVIEW_MODAL_CLOSE_ID
  ) as HTMLButtonElement | null;
  const previewModalConfirmButton = document.getElementById(
    UNBURNT_PREVIEW_MODAL_CONFIRM_ID
  ) as HTMLButtonElement | null;
  const previewCard = document.getElementById(UNBURNT_PREVIEW_CARD_ID) as HTMLDivElement | null;
  const previewDetail = document.getElementById(UNBURNT_PREVIEW_DETAIL_ID) as HTMLDivElement | null;

  if (
    !status ||
    !stageProgress ||
    !stageBackButton ||
    !stageStructure ||
    !stageSplit ||
    !stageMeta ||
    !rawTextInput ||
    !stageNextButton ||
    !linesContainer ||
    !messagesContainer ||
    !titleInput ||
    !summaryInput ||
    !tagsInput ||
    !visibilityInput ||
    !previewModal ||
    !previewModalCloseButton ||
    !previewModalConfirmButton ||
    !previewCard ||
    !previewDetail
  ) {
    return;
  }

  type ComposerState = {
    stage: "paste" | "split" | "meta";
    rawText: string;
    lines: string[];
    boundaries: number[];
    messages: UnburntMessage[];
    fragmentMeta: {
      title: string;
      summary: string;
      tags: string[];
      visibility: UnburntVisibility;
    };
  };

  const state: ComposerState = {
    stage: "paste",
    rawText: "",
    lines: [],
    boundaries: [],
    messages: [],
    fragmentMeta: {
      title: "",
      summary: "",
      tags: [],
      visibility: "private",
    },
  };

  let destroyed = false;
  let draftReady = false;
  let isSubmitting = false;
  let isPreviewModalOpen = false;
  const collapsed = new Set<number>();
  const cleanupTasks: Array<() => void> = [];
  const stageProgressItems = stageProgress.querySelectorAll<HTMLElement>("[data-stage-progress]");

  const setStatus = (message: string, isError = false) => {
    if (!status.isConnected) {
      return;
    }
    const text = message.trim();
    status.textContent = text;
    status.classList.toggle("unburnt-status--error", isError);

    if (!text) {
      dismissGlobalToast(UNBURNT_COMPOSER_TOAST_KEY);
      return;
    }
    if (text === copy.unburnt.draftSaving) {
      return;
    }

    showGlobalToast(text, {
      key: UNBURNT_COMPOSER_TOAST_KEY,
      isError,
      durationMs: isError ? 3600 : 2600,
    });
  };

  const mapStageToDraftStage = (stage: ComposerState["stage"]): "structure" | "meta" => {
    return stage === "meta" ? "meta" : "structure";
  };

  const mapDraftStageToStateStage = (
    stage: "structure" | "meta",
    lines: string[],
    messages: UnburntMessage[]
  ): ComposerState["stage"] => {
    if (stage === "meta") {
      return "meta";
    }
    return lines.length || messages.length ? "split" : "paste";
  };

  const normalizeBoundaries = (boundaries: number[], lineCount: number) => {
    if (lineCount <= 1) {
      return [];
    }
    return Array.from(
      new Set(boundaries.filter((item) => Number.isInteger(item) && item > 0 && item < lineCount))
    ).sort((left, right) => left - right);
  };

  const closePreviewModal = (restoreFocus = false) => {
    if (!isPreviewModalOpen) {
      return;
    }

    isPreviewModalOpen = false;
    previewModal.classList.remove("is-open");
    previewModal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("unburnt-preview-modal-open");
    if (restoreFocus && stageNextButton.isConnected) {
      stageNextButton.focus();
    }
  };

  const openPreviewModal = () => {
    syncPreview();
    isPreviewModalOpen = true;
    previewModal.classList.add("is-open");
    previewModal.setAttribute("aria-hidden", "false");
    document.body.classList.add("unburnt-preview-modal-open");
    previewModalConfirmButton.focus();
  };

  const syncStageControls = () => {
    const isFirstStage = state.stage === "paste";
    stageBackButton.hidden = isFirstStage;
    stageBackButton.disabled = isFirstStage;

    if (state.stage === "paste") {
      stageNextButton.hidden = false;
      stageNextButton.disabled = false;
      stageNextButton.textContent = copy.unburnt.parseTextButton;
      return;
    }
    if (state.stage === "split") {
      stageNextButton.hidden = false;
      stageNextButton.disabled = !state.messages.length;
      stageNextButton.textContent = copy.unburnt.completeStructureButton;
      return;
    }

    stageNextButton.hidden = false;
    stageNextButton.disabled = isSubmitting;
    stageNextButton.textContent = copy.unburnt.saveCreateButton;
  };

  const setStage = (stage: ComposerState["stage"]) => {
    state.stage = stage;
    stageStructure.hidden = stage !== "paste";
    stageSplit.hidden = stage !== "split";
    stageMeta.hidden = stage !== "meta";
    if (stage !== "meta") {
      closePreviewModal();
    }
    const stageIndex = stage === "paste" ? 0 : stage === "split" ? 1 : 2;
    stageProgressItems.forEach((item) => {
      const itemStage = item.dataset.stageProgress;
      const itemIndex = itemStage === "paste" ? 0 : itemStage === "split" ? 1 : itemStage === "meta" ? 2 : -1;
      item.classList.toggle("is-active", itemIndex === stageIndex);
      item.classList.toggle("is-complete", itemIndex > -1 && itemIndex < stageIndex);
    });
    syncStageControls();
  };

  const syncMetaInputs = () => {
    titleInput.value = state.fragmentMeta.title;
    summaryInput.value = state.fragmentMeta.summary;
    tagsInput.value = state.fragmentMeta.tags.join(", ");
    visibilityInput.value = state.fragmentMeta.visibility;
  };

  const syncPreview = () => {
    const title = state.fragmentMeta.title.trim() || "-";
    const summary = state.fragmentMeta.summary.trim() || "-";
    const visibilityLabel =
      state.fragmentMeta.visibility === "public"
        ? copy.unburnt.listVisibilityPublic
        : copy.unburnt.listVisibilityPrivate;
    const tags = state.fragmentMeta.tags.length
      ? state.fragmentMeta.tags.map((tag) => `<span class="unburnt-tag">${escapeHtml(tag)}</span>`).join("")
      : `<span class="unburnt-tag unburnt-tag--muted">-</span>`;

    previewCard.innerHTML = `
      <article class="fragment-card fragment-card--unburnt">
        <h3 class="fragment-card__head">${escapeHtml(title)}</h3>
        <p class="fragment-card__snippet">${escapeHtml(summary)}</p>
        <div class="fragment-card__meta">
          <span>${escapeHtml(visibilityLabel)}</span>
          <span>${escapeHtml(copy.unburnt.listMessageCount(state.messages.length))}</span>
        </div>
        <div class="unburnt-tags">${tags}</div>
      </article>
    `;
    previewDetail.innerHTML = renderUnburntMessageBubbles(state.messages);
  };

  const renderLines = () => {
    if (!state.lines.length) {
      linesContainer.innerHTML = `<p class="action-tip">${copy.unburnt.splitLinesEmpty}</p>`;
      return;
    }

    linesContainer.innerHTML = state.lines
      .map((line, index) => {
        const boundary = index < state.lines.length - 1 ? index + 1 : null;
        const active = boundary !== null && state.boundaries.includes(boundary);
        const isEmptyLine = !line.trim();
        const lineMarkup = isEmptyLine
          ? `<span class="unburnt-line-break" aria-hidden="true"></span>`
          : `<span class="unburnt-line-markdown">${parseInlineMarkdown(line)}</span>`;
        const boundaryAriaLabel = active
          ? copy.unburnt.splitBoundaryRemove
          : copy.unburnt.splitBoundaryAdd;
        const dividerButton = boundary === null
          ? ""
          : `<button type="button" class="unburnt-boundary-divider ${active ? "is-active" : ""}" data-boundary="${boundary}" aria-label="${escapeAttribute(
              boundaryAriaLabel
            )}"></button>`;

        return `
          <div class="unburnt-line-row">
            <div class="unburnt-line-text ${isEmptyLine ? "is-empty" : ""}">
              <span class="unburnt-line-no">${index + 1}</span>
              ${lineMarkup}
            </div>
            ${dividerButton}
          </div>
        `;
      })
      .join("");
  };

  const autoResizeMessageInput = (textarea: HTMLTextAreaElement) => {
    textarea.style.height = "auto";
    textarea.style.height = `${textarea.scrollHeight}px`;
    textarea.style.overflowY = "hidden";
  };

  const syncMessageInputHeights = () => {
    messagesContainer
      .querySelectorAll<HTMLTextAreaElement>(".unburnt-message-input")
      .forEach(autoResizeMessageInput);
  };

  const renderMessages = () => {
    if (!state.messages.length) {
      messagesContainer.innerHTML = `<p class="action-tip">${copy.unburnt.messagesEmpty}</p>`;
      syncStageControls();
      return;
    }

    messagesContainer.innerHTML = state.messages
      .map((message, index) => {
        const roleLabel =
          message.role === "user" ? copy.unburnt.messageRoleUser : copy.unburnt.messageRole4o;
        const roleClass = message.role === "user" ? "unburnt-message-card--user" : "unburnt-message-card--4o";
        const isCollapsed = collapsed.has(index);
        return `
          <article class="unburnt-message-card ${roleClass}" data-message-index="${index}">
            <header class="unburnt-message-card__head">
              <span class="unburnt-role-pill">${escapeHtml(roleLabel)}</span>
              <div class="unburnt-message-card__actions">
                <button type="button" class="onward-record-item__action" data-action="toggle-role">${copy.unburnt.messageToggleRole}</button>
                <button type="button" class="onward-record-item__action" data-action="collapse">${isCollapsed ? copy.unburnt.messageExpand : copy.unburnt.messageCollapse}</button>
                <button type="button" class="onward-record-item__action onward-record-item__action--danger" data-action="delete">${copy.unburnt.messageDelete}</button>
              </div>
            </header>
            <div class="unburnt-message-card__content">
              ${
                isCollapsed
                  ? `<p class="unburnt-message-collapsed">${escapeHtml(message.content.slice(0, 120) || " ")}</p>`
                  : `<textarea class="field-input field-input--textarea unburnt-message-input" data-message-input="${index}" rows="1">${escapeHtml(
                      message.content
                    )}</textarea>`
              }
            </div>
          </article>
        `;
      })
      .join("");
    syncMessageInputHeights();
    syncStageControls();
  };

  const resequenceMessages = () => {
    state.messages = state.messages.map((message, index) => ({
      ...message,
      order: index + 1,
    }));
  };

  const queueDraftSave = debounce(async () => {
    if (!draftReady || destroyed || isSubmitting) {
      return;
    }

    setStatus(copy.unburnt.draftSaving, false);

    const payload: UnburntDraftPayload = {
      mode: "create",
      entryId: "",
      stage: mapStageToDraftStage(state.stage),
      rawText: state.rawText,
      lines: [...state.lines],
      boundaries: [...state.boundaries],
      messages: state.messages.map((message) => ({ ...message })),
      fragmentMeta: {
        title: state.fragmentMeta.title,
        summary: state.fragmentMeta.summary,
        tags: [...state.fragmentMeta.tags],
        visibility: state.fragmentMeta.visibility,
      },
    };

    try {
      await unburntApiService.saveDraft(payload);
      if (destroyed) {
        return;
      }
      setStatus(copy.unburnt.draftSaved, false);
    } catch (error) {
      if (destroyed) {
        return;
      }
      setStatus(readableApiError(error, copy.unburnt.draftSaveFailed), true);
    }
  }, UNBURNT_DRAFT_DEBOUNCE_MS);

  const syncRawTextFromLines = () => {
    state.rawText = state.lines.join("\n");
    rawTextInput.value = state.rawText;
  };

  const rebuildMessagesFromLines = (
    options: { preserveExisting?: boolean; previousBoundaries?: number[] } = {}
  ) => {
    state.messages = buildMessagesFromLines(
      state.lines,
      state.boundaries,
      options.preserveExisting ? state.messages : [],
      options.previousBoundaries
    );
    collapsed.clear();
    resequenceMessages();
    renderLines();
    renderMessages();
    syncPreview();
    queueDraftSave();
  };

  const applyState = () => {
    rawTextInput.value = state.rawText;
    syncMetaInputs();
    if (!state.lines.length && state.rawText.trim() && state.stage !== "paste") {
      state.lines = splitUnburntRawText(state.rawText);
    }
    if (state.stage === "meta" && !normalizeUnburntMessagesForSave(state.messages).length) {
      state.stage = state.lines.length ? "split" : "paste";
    }
    if (state.stage === "split" && !state.lines.length) {
      state.stage = "paste";
    }
    setStage(state.stage);
    renderLines();
    renderMessages();
    syncPreview();
  };

  const applyDraft = (draft: UnburntDraftPayload) => {
    state.rawText = draft.rawText;
    state.lines = [...draft.lines];
    state.boundaries = normalizeBoundaries(draft.boundaries, state.lines.length);
    state.messages = draft.messages.map((message, index) => ({
      role: message.role === "4o" ? "4o" : "user",
      content: typeof message.content === "string" ? message.content : "",
      order: index + 1,
    }));
    state.fragmentMeta = {
      title: draft.fragmentMeta?.title ?? "",
      summary: draft.fragmentMeta?.summary ?? "",
      tags: Array.isArray(draft.fragmentMeta?.tags) ? [...draft.fragmentMeta.tags] : [],
      visibility: draft.fragmentMeta?.visibility === "public" ? "public" : "private",
    };
    state.stage = mapDraftStageToStateStage(draft.stage, state.lines, state.messages);
  };

  const handleRawInput = () => {
    state.rawText = rawTextInput.value;
    queueDraftSave();
  };
  rawTextInput.addEventListener("input", handleRawInput);
  cleanupTasks.push(() => {
    rawTextInput.removeEventListener("input", handleRawInput);
  });

  const handleParseLines = () => {
    state.rawText = rawTextInput.value;
    state.lines = splitUnburntRawText(state.rawText);
    state.boundaries = normalizeBoundaries([], state.lines.length);
    if (!state.lines.length) {
      rebuildMessagesFromLines({ preserveExisting: false });
      setStatus(copy.unburnt.splitLinesEmpty, true);
      return;
    }
    // Make split stage visible before rendering messages so textarea auto-height is measured correctly.
    setStage("split");
    rebuildMessagesFromLines({ preserveExisting: false });
    setStatus("", false);
  };

  const handleLinesClick = (event: Event) => {
    const target = event.target as HTMLElement | null;
    const button = target?.closest<HTMLButtonElement>("[data-boundary]");
    if (!button) {
      return;
    }

    const boundary = Number.parseInt(button.dataset.boundary ?? "", 10);
    if (!Number.isFinite(boundary) || boundary < 1) {
      return;
    }

    const previousBoundaries = [...state.boundaries];

    if (state.boundaries.includes(boundary)) {
      state.boundaries = state.boundaries.filter((item) => item !== boundary);
    } else {
      state.boundaries = [...state.boundaries, boundary].sort((left, right) => left - right);
    }

    rebuildMessagesFromLines({ preserveExisting: true, previousBoundaries });
  };
  linesContainer.addEventListener("click", handleLinesClick);
  cleanupTasks.push(() => {
    linesContainer.removeEventListener("click", handleLinesClick);
  });

  const handleMessagesClick = (event: Event) => {
    const target = event.target as HTMLElement | null;
    const actionButton = target?.closest<HTMLButtonElement>("[data-action]");
    if (!actionButton) {
      return;
    }

    const card = actionButton.closest<HTMLElement>("[data-message-index]");
    const index = Number.parseInt(card?.dataset.messageIndex ?? "", 10);
    if (!Number.isFinite(index) || index < 0 || index >= state.messages.length) {
      return;
    }

    const action = actionButton.dataset.action;
    if (action === "toggle-role") {
      state.messages[index].role = state.messages[index].role === "user" ? "4o" : "user";
      renderMessages();
      syncPreview();
      queueDraftSave();
      return;
    }

    if (action === "delete") {
      state.messages.splice(index, 1);
      collapsed.clear();
      resequenceMessages();
      renderMessages();
      syncPreview();
      queueDraftSave();
      return;
    }

    if (action === "collapse") {
      if (collapsed.has(index)) {
        collapsed.delete(index);
      } else {
        collapsed.add(index);
      }
      renderMessages();
    }
  };
  messagesContainer.addEventListener("click", handleMessagesClick);
  cleanupTasks.push(() => {
    messagesContainer.removeEventListener("click", handleMessagesClick);
  });

  const handleMessagesInput = (event: Event) => {
    const target = event.target as HTMLTextAreaElement | null;
    if (!target || !target.matches("[data-message-input]")) {
      return;
    }

    const index = Number.parseInt(target.dataset.messageInput ?? "", 10);
    if (!Number.isFinite(index) || index < 0 || index >= state.messages.length) {
      return;
    }

    state.messages[index].content = target.value;
    autoResizeMessageInput(target);
    syncPreview();
    queueDraftSave();
  };
  messagesContainer.addEventListener("input", handleMessagesInput);
  cleanupTasks.push(() => {
    messagesContainer.removeEventListener("input", handleMessagesInput);
  });

  const handleCompleteStructure = () => {
    const normalizedMessages = normalizeUnburntMessagesForSave(state.messages);
    if (!normalizedMessages.length) {
      setStatus(copy.unburnt.structureRequired, true);
      return;
    }

    state.messages = normalizedMessages;
    if (!state.fragmentMeta.title.trim()) {
      state.fragmentMeta.title = deriveUnburntTitleFromMessages(state.messages);
      titleInput.value = state.fragmentMeta.title;
    }
    setStage("meta");
    syncPreview();
    queueDraftSave();
  };

  const handleNextStep = () => {
    if (state.stage === "paste") {
      handleParseLines();
      return;
    }
    if (state.stage === "split") {
      handleCompleteStructure();
      return;
    }
    openPreviewModal();
  };
  stageNextButton.addEventListener("click", handleNextStep);
  cleanupTasks.push(() => {
    stageNextButton.removeEventListener("click", handleNextStep);
  });

  const handleBackStep = () => {
    if (state.stage === "meta") {
      setStage("split");
      queueDraftSave();
      return;
    }
    if (state.stage === "split") {
      setStage("paste");
      queueDraftSave();
    }
  };
  stageBackButton.addEventListener("click", handleBackStep);
  cleanupTasks.push(() => {
    stageBackButton.removeEventListener("click", handleBackStep);
  });

  const bindMetaInput = (
    element: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement,
    handler: () => void,
    eventName: "input" | "change"
  ) => {
    element.addEventListener(eventName, handler);
    cleanupTasks.push(() => {
      element.removeEventListener(eventName, handler);
    });
  };

  bindMetaInput(titleInput, () => {
    state.fragmentMeta.title = titleInput.value;
    syncPreview();
    queueDraftSave();
  }, "input");
  bindMetaInput(summaryInput, () => {
    state.fragmentMeta.summary = summaryInput.value;
    syncPreview();
    queueDraftSave();
  }, "input");
  bindMetaInput(tagsInput, () => {
    state.fragmentMeta.tags = parseUnburntTagsInput(tagsInput.value);
    syncPreview();
    queueDraftSave();
  }, "input");
  bindMetaInput(visibilityInput, () => {
    state.fragmentMeta.visibility = visibilityInput.value === "public" ? "public" : "private";
    syncPreview();
    queueDraftSave();
  }, "change");

  const handleSave = async () => {
    if (isSubmitting) {
      return;
    }

    const title = state.fragmentMeta.title.trim();
    if (!title) {
      closePreviewModal();
      setStatus(copy.unburnt.titleRequired, true);
      titleInput.focus();
      return;
    }

    const messages = normalizeUnburntMessagesForSave(state.messages);
    if (!messages.length) {
      closePreviewModal();
      setStatus(copy.unburnt.structureRequired, true);
      setStage("split");
      return;
    }

    if (!state.rawText.trim()) {
      closePreviewModal();
      setStatus(copy.unburnt.rawTextPlaceholder, true);
      setStage("paste");
      return;
    }

    isSubmitting = true;
    syncStageControls();
    previewModalConfirmButton.disabled = true;
    previewModalCloseButton.disabled = true;
    setStatus(copy.unburnt.draftSaving, false);

    try {
      const payload = {
        title,
        summary: state.fragmentMeta.summary.trim(),
        rawText: state.rawText,
        messages,
        tags: [...state.fragmentMeta.tags],
        visibility: state.fragmentMeta.visibility,
      };

      const response = await unburntApiService.create(payload);

      await unburntApiService.clearDraft().catch(() => undefined);
      navigate(buildUnburntDetailRoute(response.item.id));
    } catch (error) {
      if (!destroyed) {
        setStatus(readableApiError(error, copy.unburnt.detailSaveFailed), true);
      }
      isSubmitting = false;
      previewModalConfirmButton.disabled = false;
      previewModalCloseButton.disabled = false;
      syncStageControls();
    }
  };

  const handlePreviewConfirm = () => {
    void handleSave();
  };

  const handlePreviewModalClick = (event: Event) => {
    const target = event.target as HTMLElement | null;
    if (!target?.closest("[data-unburnt-preview-close]") || isSubmitting) {
      return;
    }
    closePreviewModal(true);
  };

  const handlePreviewModalKeydown = (event: KeyboardEvent) => {
    if (event.key !== "Escape" || !isPreviewModalOpen || isSubmitting) {
      return;
    }
    event.preventDefault();
    closePreviewModal(true);
  };

  previewModalConfirmButton.addEventListener("click", handlePreviewConfirm);
  previewModal.addEventListener("click", handlePreviewModalClick);
  window.addEventListener("keydown", handlePreviewModalKeydown);
  cleanupTasks.push(() => {
    previewModalConfirmButton.removeEventListener("click", handlePreviewConfirm);
    previewModal.removeEventListener("click", handlePreviewModalClick);
    window.removeEventListener("keydown", handlePreviewModalKeydown);
  });

  unburntPageCleanup = () => {
    destroyed = true;
    dismissGlobalToast(UNBURNT_COMPOSER_TOAST_KEY);
    closePreviewModal();
    document.body.classList.remove("unburnt-preview-modal-open");
    cleanupTasks.forEach((task) => task());
  };

  try {
    const draftResponse = await unburntApiService.getDraft();
    if (!destroyed) {
      const draft = draftResponse?.draft;
      if (draft?.mode === "create") {
        applyDraft(draft);
        setStatus(copy.unburnt.draftRecovered, false);
      }
    }
  } catch {
  }

  applyState();
  draftReady = true;
}

async function setupUnburntDetailPage(route: UnburntDetailRoutePath | UnburntEditRoutePath) {
  const status = document.getElementById(UNBURNT_DETAIL_STATUS_ID) as HTMLParagraphElement | null;
  const body = document.getElementById(UNBURNT_DETAIL_BODY_ID) as HTMLDivElement | null;
  const unburntId = extractUnburntEditId(route) ?? extractUnburntId(route);
  const isEditPageRequested = isUnburntEditRoute(route);

  if (!status || !body || !unburntId) {
    return;
  }

  let destroyed = false;
  const cleanupTasks: Array<() => void> = [];

  const setStatus = (message: string, isError = false) => {
    if (!status.isConnected) {
      return;
    }
    status.textContent = message;
    status.classList.toggle("unburnt-status--error", isError);
  };

  const renderMessages = (messages: UnburntMessage[]) => {
    return renderUnburntMessageBubbles(messages);
  };

  const renderDetail = (item: UnburntEntryDetail, options: { showOwnerActions: boolean }) => {
    const visibilityLabel =
      item.visibility === "public"
        ? copy.unburnt.listVisibilityPublic
        : copy.unburnt.listVisibilityPrivate;
    const summaryText = item.summary.trim() ? item.summary : "-";
    const tags = item.tags.length
      ? item.tags.map((tag) => `<span class="unburnt-tag">${escapeHtml(tag)}</span>`).join("")
      : `<span class="unburnt-tag unburnt-tag--muted">-</span>`;
    const metaStrip = `
      <div class="fragment-card__meta unburnt-detail-meta-strip">
        <span>${escapeHtml(visibilityLabel)}</span>
        <span>${escapeHtml(copy.unburnt.listMessageCount(item.messageCount))}</span>
        <span>${escapeHtml(formatEmberTime(item.updatedAt))}</span>
      </div>
    `;

    body.innerHTML = `
      <article class="content-card unburnt-detail-card unburnt-detail-card--messages">
        <header class="unburnt-detail-messages-head">
          <h2 class="unburnt-detail-panel-title">${copy.unburnt.detailMessagesSectionTitle}</h2>
          <span class="unburnt-detail-message-count">${escapeHtml(
            copy.unburnt.listMessageCount(item.messageCount)
          )}</span>
        </header>
        <div class="unburnt-messages-shell unburnt-scroll-shell unburnt-messages-shell--detail unburnt-detail-messages-shell">
          ${renderMessages(item.messages)}
        </div>
      </article>
      <article class="content-card unburnt-detail-card unburnt-detail-card--readonly">
        <p class="unburnt-detail-card-kicker">${copy.unburnt.detailMetaSectionTitle}</p>
        <h2 class="unburnt-detail-entry-title">${escapeHtml(item.title)}</h2>
        <p class="muted-copy unburnt-detail-entry-summary">${escapeHtml(summaryText)}</p>
        ${metaStrip}
        <div class="unburnt-tags unburnt-detail-tags">${tags}</div>
        ${
          options.showOwnerActions
            ? `
        <div class="unburnt-detail-actions">
          <button
            id="${UNBURNT_DETAIL_EDIT_STRUCTURE_ID}"
            type="button"
            class="ghost-button unburnt-detail-action-secondary"
          >
            ${copy.unburnt.detailEditStructureButton}
          </button>
          <button
            id="${UNBURNT_DETAIL_DELETE_ID}"
            type="button"
            class="onward-record-item__action onward-record-item__action--danger unburnt-detail-action-danger"
          >
            ${copy.unburnt.detailDeleteButton}
          </button>
        </div>
        `
            : `<p class="action-tip unburnt-detail-readonly-tip">${copy.unburnt.detailReadOnlyTip}</p>`
        }
      </article>
    `;
  };

  const renderOwnerEditPage = (item: UnburntEntryDetail) => {
    const visibilityLabel =
      item.visibility === "public"
        ? copy.unburnt.listVisibilityPublic
        : copy.unburnt.listVisibilityPrivate;
    const summaryText = item.summary.trim() ? item.summary : "-";
    const tagsValue = item.tags.join(", ");
    const metaStrip = `
      <div class="fragment-card__meta unburnt-detail-meta-strip">
        <span>${escapeHtml(visibilityLabel)}</span>
        <span>${escapeHtml(copy.unburnt.listMessageCount(item.messageCount))}</span>
        <span>${escapeHtml(formatEmberTime(item.updatedAt))}</span>
      </div>
    `;

    body.innerHTML = `
      <article class="content-card unburnt-detail-card unburnt-detail-card--messages">
        <header class="unburnt-detail-messages-head">
          <h2 class="unburnt-detail-panel-title">${copy.unburnt.detailMessagesSectionTitle}</h2>
          <span class="unburnt-detail-message-count">${escapeHtml(
            copy.unburnt.listMessageCount(item.messageCount)
          )}</span>
        </header>
        <div class="unburnt-messages-shell unburnt-scroll-shell unburnt-messages-shell--detail unburnt-detail-messages-shell">
          ${renderMessages(item.messages)}
        </div>
      </article>
      <article class="content-card unburnt-detail-card unburnt-detail-card--editor">
        <header class="unburnt-detail-editor-head">
          <p class="unburnt-detail-card-kicker">${copy.unburnt.detailOwnerTitle}</p>
          <h2 class="unburnt-detail-entry-title">${escapeHtml(item.title)}</h2>
          <p class="muted-copy unburnt-detail-entry-summary">${escapeHtml(summaryText)}</p>
          ${metaStrip}
        </header>
        <form id="${UNBURNT_DETAIL_META_FORM_ID}" class="unburnt-detail-form unburnt-detail-form--owner unburnt-scroll-shell">
          <div class="unburnt-detail-field">
            <label class="field-label" for="${UNBURNT_DETAIL_TITLE_ID}">${copy.unburnt.metaTitleLabel}</label>
            <input
              id="${UNBURNT_DETAIL_TITLE_ID}"
              class="field-input unburnt-detail-input"
              maxlength="120"
              value="${escapeAttribute(item.title)}"
            />
          </div>

          <div class="unburnt-detail-field unburnt-detail-field--summary">
            <label class="field-label" for="${UNBURNT_DETAIL_SUMMARY_ID}">${copy.unburnt.metaSummaryLabel}</label>
            <textarea id="${UNBURNT_DETAIL_SUMMARY_ID}" class="field-input field-input--textarea unburnt-detail-input unburnt-detail-input--summary" maxlength="500">${escapeHtml(
      item.summary
    )}</textarea>
          </div>

          <div class="unburnt-detail-field">
            <label class="field-label" for="${UNBURNT_DETAIL_TAGS_ID}">${copy.unburnt.metaTagsLabel}</label>
            <input
              id="${UNBURNT_DETAIL_TAGS_ID}"
              class="field-input unburnt-detail-input"
              value="${escapeAttribute(tagsValue)}"
              placeholder="${escapeAttribute(copy.unburnt.metaTagsPlaceholder)}"
            />
          </div>

          <div class="unburnt-detail-field">
            <label class="field-label" for="${UNBURNT_DETAIL_VISIBILITY_ID}">${copy.unburnt.metaVisibilityLabel}</label>
            <select id="${UNBURNT_DETAIL_VISIBILITY_ID}" class="field-input unburnt-detail-input">
              <option value="private" ${
                item.visibility === "private" ? "selected" : ""
              }>${copy.unburnt.metaVisibilityPrivate}</option>
              <option value="public" ${
                item.visibility === "public" ? "selected" : ""
              }>${copy.unburnt.metaVisibilityPublic}</option>
            </select>
          </div>
        </form>
        <div class="unburnt-detail-actions">
          <button
            id="${UNBURNT_DETAIL_SAVE_ID}"
            type="submit"
            form="${UNBURNT_DETAIL_META_FORM_ID}"
            class="action-button unburnt-detail-action-primary"
          >
            ${copy.unburnt.detailSaveMetaButton}
          </button>
          <button
            id="${UNBURNT_DETAIL_DELETE_ID}"
            type="button"
            class="onward-record-item__action onward-record-item__action--danger unburnt-detail-action-danger"
          >
            ${copy.unburnt.detailDeleteButton}
          </button>
        </div>
      </article>
    `;
  };

  const bindOwnerEditor = (item: UnburntEntryDetail) => {
    const form = document.getElementById(UNBURNT_DETAIL_META_FORM_ID) as HTMLFormElement | null;
    const saveButton = document.getElementById(UNBURNT_DETAIL_SAVE_ID) as HTMLButtonElement | null;
    const titleInput = document.getElementById(UNBURNT_DETAIL_TITLE_ID) as HTMLInputElement | null;
    const summaryInput = document.getElementById(
      UNBURNT_DETAIL_SUMMARY_ID
    ) as HTMLTextAreaElement | null;
    const tagsInput = document.getElementById(UNBURNT_DETAIL_TAGS_ID) as HTMLInputElement | null;
    const visibilityInput = document.getElementById(
      UNBURNT_DETAIL_VISIBILITY_ID
    ) as HTMLSelectElement | null;
    const deleteButton = document.getElementById(UNBURNT_DETAIL_DELETE_ID) as HTMLButtonElement | null;
    if (
      !form ||
      !saveButton ||
      !titleInput ||
      !summaryInput ||
      !tagsInput ||
      !visibilityInput ||
      !deleteButton
    ) {
      return;
    }

    let isSubmitting = false;
    const setEditingState = (submitting: boolean) => {
      isSubmitting = submitting;
      saveButton.disabled = submitting;
      deleteButton.disabled = submitting;
    };

    const handleDelete = async () => {
      if (isSubmitting) {
        return;
      }
      if (!window.confirm(copy.unburnt.detailDeleteConfirm)) {
        return;
      }

      setEditingState(true);
      try {
        await unburntApiService.remove(item.id);
        if (destroyed) {
          return;
        }
        setStatus(copy.unburnt.detailDeleteSuccess, false);
        navigate(ROUTES.unburnt);
      } catch (error) {
        if (destroyed) {
          return;
        }
        setStatus(readableApiError(error, copy.unburnt.detailDeleteFailed), true);
        setEditingState(false);
      }
    };
    const onDeleteClick = (event: Event) => {
      event.preventDefault();
      event.stopPropagation();
      void handleDelete();
    };
    deleteButton.addEventListener("click", onDeleteClick);
    cleanupTasks.push(() => {
      deleteButton.removeEventListener("click", onDeleteClick);
    });

    const handleSaveClick = (event: Event) => {
      event.preventDefault();
      event.stopPropagation();
      if (isSubmitting) {
        return;
      }
      form.requestSubmit();
    };
    saveButton.addEventListener("click", handleSaveClick);
    cleanupTasks.push(() => {
      saveButton.removeEventListener("click", handleSaveClick);
    });

    const handleSubmit = async (event: SubmitEvent) => {
      event.preventDefault();
      if (isSubmitting) {
        return;
      }

      const title = titleInput.value.trim();
      if (!title) {
        setStatus(copy.unburnt.titleRequired, true);
        titleInput.focus();
        return;
      }

      const summary = summaryInput.value.trim();
      const tags = parseUnburntTagsInput(tagsInput.value);
      const visibility = visibilityInput.value === "public" ? "public" : "private";

      setEditingState(true);
      try {
        let response = await unburntApiService.update(item.id, {
          title,
          summary,
          tags,
        });

        if (response.item.visibility !== visibility) {
          response = await unburntApiService.updateVisibility(item.id, { visibility });
        }

        if (destroyed) {
          return;
        }
        setStatus(copy.unburnt.detailSaveSuccess, false);
        navigate(buildUnburntDetailRoute(item.id));
      } catch (error) {
        if (destroyed) {
          return;
        }
        setStatus(readableApiError(error, copy.unburnt.detailSaveFailed), true);
        setEditingState(false);
      }
    };

    form.addEventListener("submit", handleSubmit);
    cleanupTasks.push(() => {
      form.removeEventListener("submit", handleSubmit);
    });
  };

  const bindOwnerActions = (item: UnburntEntryDetail) => {
    const editStructureButton = document.getElementById(
      UNBURNT_DETAIL_EDIT_STRUCTURE_ID
    ) as HTMLButtonElement | null;
    const deleteButton = document.getElementById(UNBURNT_DETAIL_DELETE_ID) as HTMLButtonElement | null;
    if (!editStructureButton || !deleteButton) {
      return;
    }

    const handleOpenStructure = () => {
      openUnburntDetailEditor(item.id);
    };
    editStructureButton.addEventListener("click", handleOpenStructure);
    cleanupTasks.push(() => {
      editStructureButton.removeEventListener("click", handleOpenStructure);
    });

    const handleDelete = async () => {
      if (!window.confirm(copy.unburnt.detailDeleteConfirm)) {
        return;
      }

      try {
        await unburntApiService.remove(item.id);
        if (destroyed) {
          return;
        }
        setStatus(copy.unburnt.detailDeleteSuccess, false);
        navigate(ROUTES.unburnt);
      } catch (error) {
        if (destroyed) {
          return;
        }
        setStatus(readableApiError(error, copy.unburnt.detailDeleteFailed), true);
      }
    };

    const onDeleteClick = () => {
      void handleDelete();
    };
    deleteButton.addEventListener("click", onDeleteClick);
    cleanupTasks.push(() => {
      deleteButton.removeEventListener("click", onDeleteClick);
    });
  };

  const renderEntry = (item: UnburntEntryDetail) => {
    const isMine = Boolean(item.isMine);
    if (isMine && isEditPageRequested) {
      renderOwnerEditPage(item);
      bindOwnerEditor(item);
      return;
    }

    renderDetail(item, {
      showOwnerActions: isMine,
    });
    if (isMine) {
      bindOwnerActions(item);
    }
  };

  unburntPageCleanup = () => {
    destroyed = true;
    cleanupTasks.forEach((task) => task());
  };

  try {
    setStatus(copy.unburnt.detailLoading, false);
    let detail: UnburntEntryDetail | null = null;

    try {
      const mine = await unburntApiService.getMine(unburntId);
      detail = mine.item;
    } catch (error) {
      if (error instanceof ApiError && (error.status === 404 || error.status === 403)) {
        const published = await unburntApiService.getPublic(unburntId);
        detail = published.item;
      } else {
        throw error;
      }
    }

    if (!detail || destroyed) {
      return;
    }

    setStatus(detail.isMine ? "" : copy.unburnt.detailReadOnlyTip, false);
    renderEntry(detail);
  } catch (error) {
    if (destroyed) {
      return;
    }

    if (error instanceof ApiError && error.status === 404) {
      setStatus(copy.unburnt.detailNotFound, true);
      body.innerHTML = "";
      return;
    }

    setStatus(readableApiError(error, copy.unburnt.detailLoadFailed), true);
    body.innerHTML = "";
  }
}

async function setupOnwardPage() {
  type OnwardTab = "history" | "recycle";

  const input = document.getElementById(ONWARD_INPUT_ID) as HTMLTextAreaElement | null;
  const preview = document.getElementById(ONWARD_PREVIEW_ID) as HTMLDivElement | null;
  const submitButton = document.getElementById(
    ONWARD_SUBMIT_BUTTON_ID
  ) as HTMLButtonElement | null;
  const cancelEditButton = document.getElementById(
    ONWARD_CANCEL_EDIT_BUTTON_ID
  ) as HTMLButtonElement | null;
  const formStatus = document.getElementById(
    ONWARD_FORM_STATUS_ID
  ) as HTMLParagraphElement | null;
  const listStatus = document.getElementById(
    ONWARD_LIST_STATUS_ID
  ) as HTMLParagraphElement | null;
  const historyList = document.getElementById(
    ONWARD_HISTORY_LIST_ID
  ) as HTMLUListElement | null;
  const recycleList = document.getElementById(
    ONWARD_RECYCLE_LIST_ID
  ) as HTMLUListElement | null;
  const historyTabButton = document.getElementById(
    ONWARD_TAB_HISTORY_ID
  ) as HTMLButtonElement | null;
  const recycleTabButton = document.getElementById(
    ONWARD_TAB_RECYCLE_ID
  ) as HTMLButtonElement | null;
  const historyPanel = document.querySelector<HTMLElement>("[data-onward-panel='history']");
  const recyclePanel = document.querySelector<HTMLElement>("[data-onward-panel='recycle']");

  if (
    !input ||
    !preview ||
    !submitButton ||
    !cancelEditButton ||
    !formStatus ||
    !listStatus ||
    !historyList ||
    !recycleList ||
    !historyTabButton ||
    !recycleTabButton ||
    !historyPanel ||
    !recyclePanel
  ) {
    return;
  }

  let destroyed = false;
  let activeTab: OnwardTab = "history";
  let activeItems: OnwardItem[] = [];
  let recycleItems: OnwardRecycleItem[] = [];
  let recycleLoaded = false;
  let editingId: string | null = null;
  let lastSavedDraft = "";
  let isSubmitting = false;
  const cleanupTasks: Array<() => void> = [];

  const setFormStatus = (message: string, isError = false) => {
    if (!formStatus.isConnected) {
      return;
    }
    formStatus.textContent = message;
    formStatus.classList.toggle("onward-status--error", isError);
  };

  const setListStatus = (message: string, isError = false) => {
    if (!listStatus.isConnected) {
      return;
    }
    listStatus.textContent = message;
    listStatus.classList.toggle("onward-status--error", isError);
  };

  const syncPreview = () => {
    const content = input.value.trim();
    preview.innerHTML = content
      ? renderSafeMarkdown(content)
      : `<p>${escapeHtml(copy.onward.previewEmpty)}</p>`;
  };

  const updateComposeState = () => {
    const isEditing = Boolean(editingId);
    cancelEditButton.hidden = !isEditing;
    cancelEditButton.disabled = isSubmitting;
    submitButton.disabled = isSubmitting;
    submitButton.textContent = isEditing ? copy.onward.updateButton : copy.onward.actionButton;

    if (!isSubmitting && isEditing) {
      setFormStatus(copy.onward.editingHint, false);
    }
  };

  const sortHistoryItems = (items: OnwardItem[]) => {
    return [...items].sort((left, right) => {
      const leftTime = Date.parse(left.createdAt);
      const rightTime = Date.parse(right.createdAt);
      if (leftTime !== rightTime) {
        return rightTime - leftTime;
      }
      return right.id.localeCompare(left.id);
    });
  };

  const sortRecycleItems = (items: OnwardRecycleItem[]) => {
    return [...items].sort((left, right) => {
      const leftTime = Date.parse(left.deletedAt);
      const rightTime = Date.parse(right.deletedAt);
      if (leftTime !== rightTime) {
        return rightTime - leftTime;
      }
      return right.id.localeCompare(left.id);
    });
  };

  const loadRecycle = async () => {
    setListStatus(copy.onward.recycleLoading, false);

    try {
      const response = await onwardApiService.listRecycle(ONWARD_LIST_LIMIT);
      if (destroyed || !recycleList.isConnected) {
        return;
      }

      recycleItems = sortRecycleItems(Array.isArray(response?.items) ? response.items : []);
      recycleLoaded = true;
      renderRecycleList();

      if (activeTab === "recycle") {
        setListStatus(recycleItems.length ? "" : copy.onward.recycleEmpty, false);
      }
    } catch (error) {
      if (destroyed) {
        return;
      }
      setListStatus(readableApiError(error, copy.onward.listLoadFailed), true);
    }
  };

  const setTab = (tab: OnwardTab) => {
    activeTab = tab;
    const isHistory = tab === "history";

    historyTabButton.classList.toggle("is-active", isHistory);
    historyTabButton.setAttribute("aria-selected", isHistory ? "true" : "false");
    recycleTabButton.classList.toggle("is-active", !isHistory);
    recycleTabButton.setAttribute("aria-selected", !isHistory ? "true" : "false");

    historyPanel.hidden = !isHistory;
    historyPanel.classList.toggle("is-active", isHistory);
    recyclePanel.hidden = isHistory;
    recyclePanel.classList.toggle("is-active", !isHistory);

    if (isHistory) {
      setListStatus(activeItems.length ? "" : copy.onward.historyEmpty, false);
      return;
    }

    if (!recycleLoaded) {
      void loadRecycle();
      return;
    }

    setListStatus(recycleItems.length ? "" : copy.onward.recycleEmpty, false);
  };

  const enterEditMode = (item: OnwardItem) => {
    editingId = item.id;
    input.value = item.message;
    syncPreview();
    input.focus();
    updateComposeState();
  };

  const exitEditMode = () => {
    editingId = null;
    updateComposeState();
  };

  const deleteItem = async (id: string) => {
    if (!window.confirm(copy.onward.deleteConfirm)) {
      return;
    }

    try {
      await onwardApiService.remove(id);
      if (destroyed) {
        return;
      }

      activeItems = activeItems.filter((item) => item.id !== id);
      if (editingId === id) {
        exitEditMode();
      }
      renderHistoryList();

      if (recycleLoaded) {
        await loadRecycle();
      }

      setFormStatus(copy.onward.deleteSuccess, false);
      if (activeTab === "history") {
        setListStatus(activeItems.length ? "" : copy.onward.historyEmpty, false);
      }
    } catch (error) {
      if (destroyed) {
        return;
      }
      setFormStatus(readableApiError(error, copy.onward.deleteFailed), true);
    }
  };

  const restoreItem = async (id: string) => {
    try {
      const response = await onwardApiService.restore(id);
      if (destroyed) {
        return;
      }

      recycleItems = recycleItems.filter((item) => item.id !== id);
      activeItems = sortHistoryItems([response.item, ...activeItems]);
      renderHistoryList();
      renderRecycleList();

      setFormStatus(copy.onward.restoreSuccess, false);
      if (activeTab === "recycle") {
        setListStatus(recycleItems.length ? "" : copy.onward.recycleEmpty, false);
      }
    } catch (error) {
      if (destroyed) {
        return;
      }
      setFormStatus(readableApiError(error, copy.onward.restoreFailed), true);
    }
  };

  const renderHistoryList = () => {
    historyList.innerHTML = "";

    if (!activeItems.length) {
      const empty = document.createElement("li");
      empty.className = "onward-record-item onward-record-item--empty";
      empty.textContent = copy.onward.historyEmpty;
      historyList.appendChild(empty);
      return;
    }

    activeItems.forEach((item, index) => {
      const row = document.createElement("li");
      row.className = "onward-record-item";

      const head = document.createElement("div");
      head.className = "onward-record-item__head";

      const meta = document.createElement("p");
      meta.className = "onward-record-item__meta";
      meta.textContent = formatEmberTime(item.createdAt);
      head.appendChild(meta);

      if (index === 0) {
        const badge = document.createElement("span");
        badge.className = "onward-record-item__badge";
        badge.textContent = copy.onward.latestBadge;
        head.appendChild(badge);
      }

      const text = document.createElement("div");
      text.className = "onward-record-item__text markdown-body";
      text.innerHTML = renderSafeMarkdown(item.message);

      const actions = document.createElement("div");
      actions.className = "onward-record-item__actions";

      if (index === 0) {
        const editButton = document.createElement("button");
        editButton.type = "button";
        editButton.className = "onward-record-item__action";
        editButton.textContent = copy.onward.editButton;
        editButton.addEventListener("click", () => {
          enterEditMode(item);
        });
        actions.appendChild(editButton);
      }

      const deleteButton = document.createElement("button");
      deleteButton.type = "button";
      deleteButton.className = "onward-record-item__action onward-record-item__action--danger";
      deleteButton.textContent = copy.onward.deleteButton;
      deleteButton.addEventListener("click", () => {
        void deleteItem(item.id);
      });
      actions.appendChild(deleteButton);

      row.appendChild(head);
      row.appendChild(text);
      row.appendChild(actions);
      historyList.appendChild(row);
    });
  };

  const renderRecycleList = () => {
    recycleList.innerHTML = "";

    if (!recycleItems.length) {
      const empty = document.createElement("li");
      empty.className = "onward-record-item onward-record-item--empty";
      empty.textContent = copy.onward.recycleEmpty;
      recycleList.appendChild(empty);
      return;
    }

    recycleItems.forEach((item) => {
      const row = document.createElement("li");
      row.className = "onward-record-item";

      const head = document.createElement("div");
      head.className = "onward-record-item__head";

      const meta = document.createElement("p");
      meta.className = "onward-record-item__meta";
      meta.textContent = formatEmberTime(item.deletedAt);
      head.appendChild(meta);

      const deadline = document.createElement("p");
      deadline.className = "onward-record-item__deadline";
      deadline.textContent = copy.onward.restoreDeadline(
        formatOnwardRestoreDeadline(item.restoreDeadline)
      );

      const text = document.createElement("div");
      text.className = "onward-record-item__text markdown-body";
      text.innerHTML = renderSafeMarkdown(item.message);

      const actions = document.createElement("div");
      actions.className = "onward-record-item__actions";

      const restoreButton = document.createElement("button");
      restoreButton.type = "button";
      restoreButton.className = "onward-record-item__action";
      restoreButton.textContent = copy.onward.restoreButton;
      restoreButton.addEventListener("click", () => {
        void restoreItem(item.id);
      });
      actions.appendChild(restoreButton);

      row.appendChild(head);
      row.appendChild(deadline);
      row.appendChild(text);
      row.appendChild(actions);
      recycleList.appendChild(row);
    });
  };

  const persistDraft = async () => {
    const message = input.value.trim();
    if (message === lastSavedDraft || isSubmitting) {
      return;
    }

    setFormStatus(copy.onward.draftSaving, false);

    try {
      const response = await onwardApiService.saveDraft({ message });
      if (destroyed) {
        return;
      }

      lastSavedDraft = response?.draft?.message?.trim() ?? message;
      setFormStatus(copy.onward.draftSaved, false);
    } catch (error) {
      if (destroyed) {
        return;
      }
      setFormStatus(readableApiError(error, copy.onward.draftSaveFailed), true);
    }
  };

  const queueDraftSave = debounce(() => {
    if (destroyed) {
      return;
    }
    void persistDraft();
  }, ONWARD_DRAFT_DEBOUNCE_MS);

  const promptButtons = document.querySelectorAll<HTMLButtonElement>("[data-onward-prompt]");
  promptButtons.forEach((button) => {
    const handleClick = () => {
      input.value = button.dataset.onwardPrompt ?? "";
      syncPreview();
      input.focus();
      queueDraftSave();
    };
    button.addEventListener("click", handleClick);
    cleanupTasks.push(() => {
      button.removeEventListener("click", handleClick);
    });
  });

  const handleInput = () => {
    syncPreview();
    queueDraftSave();
  };
  input.addEventListener("input", handleInput);
  cleanupTasks.push(() => {
    input.removeEventListener("input", handleInput);
  });

  const handleSubmit = async () => {
    if (isSubmitting) {
      return;
    }

    const message = input.value.trim();
    if (!message) {
      setFormStatus(
        translateApiError(
          currentLocale,
          "ONWARD_MESSAGE_EMPTY",
          copy.onward.formFailed,
          null
        ),
        true
      );
      return;
    }

    isSubmitting = true;
    updateComposeState();
    setFormStatus(copy.onward.formSubmitting, false);

    try {
      if (editingId) {
        const response = await onwardApiService.update(editingId, { message });
        activeItems = sortHistoryItems(
          activeItems.map((item) => (item.id === response.item.id ? response.item : item))
        );
        exitEditMode();
        setFormStatus(copy.onward.formUpdated, false);
      } else {
        const response = await onwardApiService.create({ message });
        activeItems = sortHistoryItems([
          response.item,
          ...activeItems.filter((item) => item.id !== response.item.id),
        ]);
        input.value = "";
        syncPreview();
        lastSavedDraft = "";
        void onwardApiService.saveDraft({ message: "" }).catch(() => undefined);
        setFormStatus(copy.onward.formPublished, false);
      }

      renderHistoryList();
      if (activeTab === "history") {
        setListStatus(activeItems.length ? "" : copy.onward.historyEmpty, false);
      }
    } catch (error) {
      setFormStatus(readableApiError(error, copy.onward.formFailed), true);
    } finally {
      isSubmitting = false;
      updateComposeState();
    }
  };

  const handleSubmitClick = () => {
    void handleSubmit();
  };
  submitButton.addEventListener("click", handleSubmitClick);
  cleanupTasks.push(() => {
    submitButton.removeEventListener("click", handleSubmitClick);
  });

  const handleCancelEdit = () => {
    exitEditMode();
    setFormStatus("", false);
  };
  cancelEditButton.addEventListener("click", handleCancelEdit);
  cleanupTasks.push(() => {
    cancelEditButton.removeEventListener("click", handleCancelEdit);
  });

  const handleHistoryTab = () => {
    setTab("history");
  };
  historyTabButton.addEventListener("click", handleHistoryTab);
  cleanupTasks.push(() => {
    historyTabButton.removeEventListener("click", handleHistoryTab);
  });

  const handleRecycleTab = () => {
    setTab("recycle");
  };
  recycleTabButton.addEventListener("click", handleRecycleTab);
  cleanupTasks.push(() => {
    recycleTabButton.removeEventListener("click", handleRecycleTab);
  });

  onwardPageCleanup = () => {
    destroyed = true;
    cleanupTasks.forEach((task) => task());
  };

  syncPreview();
  updateComposeState();
  setListStatus(copy.onward.historyLoading, false);

  try {
    const [session, response] = await Promise.all([
      onwardApiService.getSession(),
      onwardApiService.list(ONWARD_LIST_LIMIT),
    ]);

    if (destroyed) {
      return;
    }

    input.value = session?.draft?.message ?? "";
    lastSavedDraft = input.value.trim();
    syncPreview();

    activeItems = sortHistoryItems(Array.isArray(response?.items) ? response.items : []);
    renderHistoryList();
    setTab("history");
  } catch (error) {
    if (destroyed) {
      return;
    }
    activeItems = [];
    renderHistoryList();
    setListStatus(readableApiError(error, copy.onward.listLoadFailed), true);
  }
}

async function setupEmbersPage() {
  const contentGrid = document.getElementById(
    EMBERS_CONTENT_GRID_ID
  ) as HTMLDivElement | null;
  const form = document.getElementById("ember-form") as HTMLFormElement | null;
  const nameInput = document.getElementById("ember-name") as HTMLInputElement | null;
  const messageInput = document.getElementById(
    "ember-message"
  ) as HTMLTextAreaElement | null;
  const composePanel = document.getElementById(
    EMBER_COMPOSE_PANEL_ID
  ) as HTMLElement | null;
  const dialogPanel = document.getElementById(
    EMBER_DIALOG_PANEL_ID
  ) as HTMLElement | null;
  const dialogCloseButton = document.getElementById(
    EMBER_DIALOG_CLOSE_BUTTON_ID
  ) as HTMLButtonElement | null;
  const dialogMeta = document.getElementById(
    EMBER_DIALOG_META_ID
  ) as HTMLParagraphElement | null;
  const dialogMessage = document.getElementById(
    EMBER_DIALOG_MESSAGE_ID
  ) as HTMLParagraphElement | null;
  const formStatus = document.getElementById(
    "ember-form-status"
  ) as HTMLParagraphElement | null;
  const listStatus = document.getElementById(
    "ember-list-status"
  ) as HTMLParagraphElement | null;
  const listPanel = document.getElementById(
    EMBERS_LIST_PANEL_ID
  ) as HTMLElement | null;
  const emberList = document.getElementById(EMBER_LIST_ID) as HTMLUListElement | null;
  const viewToggleButton = document.getElementById(
    EMBER_VIEW_TOGGLE_ID
  ) as HTMLButtonElement | null;
  const flameShell = document.getElementById(
    EMBERS_FLAME_SHELL_ID
  ) as HTMLDivElement | null;
  const flameSlot = document.getElementById(
    EMBERS_FLAME_SLOT_ID
  ) as HTMLDivElement | null;
  const particleLayer = document.getElementById(
    EMBERS_PARTICLE_LAYER_ID
  ) as HTMLDivElement | null;
  const hoverPreview = document.getElementById(
    EMBER_HOVER_PREVIEW_ID
  ) as HTMLButtonElement | null;
  const submitButton = form?.querySelector<HTMLButtonElement>(
    "button[type='submit']"
  );

  if (
    !contentGrid ||
    !form ||
    !nameInput ||
    !messageInput ||
    !composePanel ||
    !dialogPanel ||
    !dialogCloseButton ||
    !dialogMeta ||
    !dialogMessage ||
    !flameShell ||
    !flameSlot ||
    !particleLayer ||
    !hoverPreview ||
    !listPanel ||
    !emberList ||
    !viewToggleButton ||
    !submitButton
  ) {
    return;
  }
  const resolveBaseHeight = (element: HTMLElement) => {
    const rectHeight = element.getBoundingClientRect().height;
    if (rectHeight > 0) {
      return rectHeight;
    }

    const minHeight = Number.parseFloat(window.getComputedStyle(element).minHeight);
    if (Number.isFinite(minHeight) && minHeight > 0) {
      return minHeight;
    }

    return 0;
  };

  const baseMessageHeight = resolveBaseHeight(messageInput);
  const baseDialogMessageHeight = resolveBaseHeight(dialogMessage);
  const flameCard = flameShell.closest(".embers-flame-card") as HTMLElement | null;

  let embers: EmberItem[] = [];
  const particles: EmberParticle[] = [];
  let autoSpawnTimerId: number | null = null;
  let particleRafId: number | null = null;
  let bottomGapSyncRafId: number | null = null;
  let listPanelHeightSyncRafId: number | null = null;
  let previewHideTimerId: number | null = null;
  let activePreviewParticleId: number | null = null;
  let previewHovered = false;
  let flameViewBodyHeight = 0;
  let lastParticleTick = performance.now();
  let sideViewMode: "flame" | "list" = "flame";
  let wasStackedLayout = window.matchMedia(EMBERS_STACKED_QUERY).matches;

  const monument = new FlameMonument({
    size: 2.05,
    intensity: 1,
    speed: 1,
    flameLayer: "front",
  });
  monument.el.classList.add("embers-flame-monument");
  flameSlot.appendChild(monument.el);

  const setFormStatus = (text: string, isError = false) => {
    if (!formStatus) {
      return;
    }
    formStatus.textContent = text;
    formStatus.classList.toggle("ember-status--error", isError);
  };

  const setListStatus = (text: string, isError = false) => {
    if (!listStatus) {
      return;
    }
    listStatus.textContent = text;
    listStatus.classList.toggle("ember-status--error", isError);
  };

  const isStackedLayout = () => window.matchMedia(EMBERS_STACKED_QUERY).matches;
  const isFlameModeActive = () => !flameShell.hidden;

  const getViewToggleText = () => {
    const localeIsZh = currentLocale === "zh-CN";
    if (sideViewMode === "list") {
      return {
        label: localeIsZh ? "火焰" : "Flame",
        tooltip: localeIsZh ? "切换到火焰视图" : "Switch to flame view",
      };
    }

    return {
      label: localeIsZh ? "列表" : "List",
      tooltip: localeIsZh ? "切换到留言列表" : "Switch to message list",
    };
  };

  const syncBottomGap = () => {
    messageInput.style.minHeight = `${Math.ceil(baseMessageHeight)}px`;
    dialogMessage.style.minHeight = `${Math.ceil(baseDialogMessageHeight)}px`;
    const bottomGap = window.innerHeight - contentGrid.getBoundingClientRect().bottom;
    if (bottomGap <= EMBERS_BOTTOM_GAP_TARGET_PX) {
      return;
    }

    const activeField = !composePanel.hidden
      ? messageInput
      : !dialogPanel.hidden
        ? dialogMessage
        : null;
    const activeBase = !composePanel.hidden ? baseMessageHeight : baseDialogMessageHeight;
    if (!activeField) {
      return;
    }

    let targetHeight = activeBase + (bottomGap - EMBERS_BOTTOM_GAP_TARGET_PX);
    activeField.style.minHeight = `${Math.ceil(targetHeight)}px`;

    // Corrective pass: in some layouts the first stretch may not move the grid bottom enough.
    for (let pass = 0; pass < 3; pass += 1) {
      const correctedGap = window.innerHeight - contentGrid.getBoundingClientRect().bottom;
      const remaining = correctedGap - EMBERS_BOTTOM_GAP_TARGET_PX;
      if (remaining <= 0.5) {
        break;
      }

      targetHeight += remaining;
      activeField.style.minHeight = `${Math.ceil(targetHeight)}px`;
    }
  };

  const queueBottomGapSync = () => {
    if (bottomGapSyncRafId !== null) {
      window.cancelAnimationFrame(bottomGapSyncRafId);
    }

    bottomGapSyncRafId = window.requestAnimationFrame(() => {
      bottomGapSyncRafId = null;
      syncBottomGap();
    });
  };

  const captureFlameViewBodyHeight = () => {
    if (flameShell.hidden) {
      return;
    }

    const height = Math.floor(flameShell.getBoundingClientRect().height);
    if (height > 0) {
      flameViewBodyHeight = height;
    }
  };

  const syncListPanelMaxHeight = () => {
    if (!flameCard || listPanel.hidden) {
      listPanel.style.maxHeight = "";
      return;
    }

    const cardRect = flameCard.getBoundingClientRect();
    const panelRect = listPanel.getBoundingClientRect();
    const cardAvailable = Math.floor(cardRect.bottom - panelRect.top - 10);
    const available = isStackedLayout()
      ? cardAvailable
      : flameViewBodyHeight > 0
        ? Math.min(cardAvailable, flameViewBodyHeight)
        : cardAvailable;
    if (available > 0) {
      listPanel.style.maxHeight = `${available}px`;
      return;
    }

    listPanel.style.maxHeight = "";
  };

  const queueListPanelHeightSync = () => {
    if (listPanelHeightSyncRafId !== null) {
      window.cancelAnimationFrame(listPanelHeightSyncRafId);
    }

    listPanelHeightSyncRafId = window.requestAnimationFrame(() => {
      listPanelHeightSyncRafId = null;
      syncListPanelMaxHeight();
    });
  };

  const clearPreviewHideTimer = () => {
    if (previewHideTimerId !== null) {
      window.clearTimeout(previewHideTimerId);
      previewHideTimerId = null;
    }
  };

  const hideHoverPreview = () => {
    clearPreviewHideTimer();
    activePreviewParticleId = null;
    hoverPreview.hidden = true;
    hoverPreview.replaceChildren();
    delete hoverPreview.dataset.particleId;
  };

  const queueHideHoverPreview = () => {
    clearPreviewHideTimer();
    previewHideTimerId = window.setTimeout(() => {
      previewHideTimerId = null;
      if (!previewHovered) {
        hideHoverPreview();
      }
    }, 120);
  };

  const applySideViewMode = () => {
    const stacked = isStackedLayout();
    if (stacked && !wasStackedLayout) {
      sideViewMode = "list";
    }

    const showList = sideViewMode === "list";
    if (showList) {
      captureFlameViewBodyHeight();
    }
    listPanel.hidden = !showList;
    flameShell.hidden = showList;
    viewToggleButton.hidden = false;

    const toggleCopy = getViewToggleText();
    viewToggleButton.textContent = toggleCopy.label;
    viewToggleButton.setAttribute("title", toggleCopy.tooltip);
    viewToggleButton.setAttribute("aria-label", toggleCopy.tooltip);
    viewToggleButton.dataset.tooltip = toggleCopy.tooltip;

    if (showList) {
      hideHoverPreview();
      queueListPanelHeightSync();
    } else {
      listPanel.style.maxHeight = "";
      captureFlameViewBodyHeight();
    }

    wasStackedLayout = stacked;
  };

  const positionHoverPreview = (x: number, y: number) => {
    if (hoverPreview.hidden) {
      return;
    }

    const shellRect = flameShell.getBoundingClientRect();
    const margin = 8;
    const previewWidth = hoverPreview.offsetWidth || 220;
    const previewHeight = hoverPreview.offsetHeight || 110;
    let left = x + 18;
    let top = y - previewHeight - 14;

    if (left + previewWidth > shellRect.width - margin) {
      left = x - previewWidth - 18;
    }
    if (top < margin) {
      top = y + 14;
    }

    const clampedLeft = clamp(
      left,
      margin,
      Math.max(margin, shellRect.width - previewWidth - margin)
    );
    const clampedTop = clamp(
      top,
      margin,
      Math.max(margin, shellRect.height - previewHeight - margin)
    );
    hoverPreview.style.transform = `translate(${clampedLeft}px, ${clampedTop}px)`;
  };

  const showHoverPreview = (particle: EmberParticle) => {
    activePreviewParticleId = particle.id;
    hoverPreview.dataset.particleId = String(particle.id);
    hoverPreview.hidden = false;
    hoverPreview.replaceChildren();

    const meta = document.createElement("span");
    meta.className = "ember-hover-preview__meta";
    meta.textContent = formatEmberMeta(particle.ember);

    const text = document.createElement("span");
    text.className = "ember-hover-preview__text";
    text.textContent = particle.ember.message;

    hoverPreview.appendChild(meta);
    hoverPreview.appendChild(text);
    positionHoverPreview(particle.x, particle.y);
  };

  const openDialog = (ember: EmberItem) => {
    dialogMeta.textContent = formatEmberMeta(ember);
    dialogMessage.textContent = ember.message;
    composePanel.hidden = true;
    dialogPanel.hidden = false;
    hideHoverPreview();
    queueBottomGapSync();
  };

  const closeDialog = () => {
    dialogPanel.hidden = true;
    composePanel.hidden = false;
    queueBottomGapSync();
    messageInput.focus();
  };

  const renderListView = () => {
    emberList.innerHTML = "";

    if (!embers.length) {
      const empty = document.createElement("li");
      empty.className = "ember-item ember-item--empty";
      const text = document.createElement("p");
      text.className = "ember-item__text";
      text.textContent = copy.embers.listNoItems;
      empty.appendChild(text);
      emberList.appendChild(empty);
      return;
    }

    embers.forEach((ember) => {
      const item = document.createElement("li");
      item.className = "ember-item ember-item--clickable";
      item.tabIndex = 0;
      item.setAttribute("role", "button");
      item.setAttribute("aria-label", formatEmberMeta(ember));

      const meta = document.createElement("p");
      meta.className = "ember-item__meta";
      meta.textContent = formatEmberMeta(ember);

      const text = document.createElement("p");
      text.className = "ember-item__text";
      text.textContent = ember.message;

      const openFromList = () => {
        openDialog(ember);
      };

      item.addEventListener("click", openFromList);
      item.addEventListener("keydown", (event: KeyboardEvent) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          openFromList();
        }
      });

      item.appendChild(meta);
      item.appendChild(text);
      emberList.appendChild(item);
    });
  };

  const resolveEmitterPosition = () => {
    const width = flameShell.clientWidth;
    const height = flameShell.clientHeight;
    const x = width * EMBERS_EMITTER_X_RATIO;
    const y = height - EMBERS_EMITTER_BOTTOM_OFFSET_PX;
    return {
      x: clamp(x, EMBERS_PARTICLE_MAX_SIZE, width - EMBERS_PARTICLE_MAX_SIZE),
      y: clamp(y, EMBERS_PARTICLE_MAX_SIZE, height - EMBERS_PARTICLE_MAX_SIZE),
    };
  };

  const removeParticle = (particle: EmberParticle, index: number) => {
    particle.element.remove();
    particles.splice(index, 1);
    if (activePreviewParticleId === particle.id) {
      hideHoverPreview();
    }
  };

  const spawnParticle = (ember: EmberItem, spread = false) => {
    if (!isFlameModeActive()) {
      return;
    }

    const emitter = resolveEmitterPosition();
    const size =
      EMBERS_PARTICLE_MIN_SIZE +
      Math.random() * (EMBERS_PARTICLE_MAX_SIZE - EMBERS_PARTICLE_MIN_SIZE);
    const spreadX = spread ? randomBetween(-28, 28) : randomBetween(-10, 10);
    const spreadY = spread ? randomBetween(-8, 16) : randomBetween(-2, 10);
    const particle = document.createElement("button");

    particle.type = "button";
    particle.className = "ember-particle";
    particle.style.width = `${size.toFixed(1)}px`;
    particle.style.height = `${size.toFixed(1)}px`;
    particle.style.backgroundColor =
      EMBERS_PARTICLE_COLORS[Math.floor(Math.random() * EMBERS_PARTICLE_COLORS.length)];
    particle.style.transform = `translate(${(emitter.x + spreadX).toFixed(2)}px, ${(emitter.y + spreadY).toFixed(2)}px)`;
    particle.style.opacity = "1";
    particle.dataset.navSummon = "ignore";
    particle.setAttribute("aria-label", formatEmberMeta(ember));

    const state: EmberParticle = {
      id: nextEmberParticleId++,
      ember,
      element: particle,
      baseX: emitter.x + spreadX,
      x: emitter.x + spreadX,
      y: emitter.y + spreadY,
      size,
      speedY: randomBetween(EMBERS_PARTICLE_MIN_SPEED, EMBERS_PARTICLE_MAX_SPEED),
      driftX: randomBetween(-EMBERS_PARTICLE_DRIFT_SPEED_MAX, EMBERS_PARTICLE_DRIFT_SPEED_MAX),
      swayPhase: randomBetween(0, Math.PI * 2),
      swaySpeed: randomBetween(EMBERS_PARTICLE_SWAY_SPEED_MIN, EMBERS_PARTICLE_SWAY_SPEED_MAX),
      swayAmplitude: randomBetween(
        EMBERS_PARTICLE_SWAY_AMPLITUDE_MIN,
        EMBERS_PARTICLE_SWAY_AMPLITUDE_MAX
      ),
      phase: "rising",
      holdDurationMs: randomBetween(EMBERS_PARTICLE_TOP_HOLD_MIN_MS, EMBERS_PARTICLE_TOP_HOLD_MAX_MS),
      holdElapsedMs: 0,
      fadeDurationMs: EMBERS_PARTICLE_FADE_OUT_MS,
      fadeElapsedMs: 0,
      isHovered: false,
    };

    const handlePointerEnter = () => {
      state.isHovered = true;
      previewHovered = false;
      clearPreviewHideTimer();
      showHoverPreview(state);
    };

    const handlePointerLeave = () => {
      state.isHovered = false;
      queueHideHoverPreview();
    };

    const handleClick = () => {
      openDialog(state.ember);
    };

    particle.addEventListener("pointerenter", handlePointerEnter);
    particle.addEventListener("pointerleave", handlePointerLeave);
    particle.addEventListener("click", handleClick);

    particles.push(state);
    particleLayer.appendChild(particle);

    if (particles.length > EMBERS_PARTICLE_MAX_COUNT) {
      const oldest = particles[0];
      if (oldest) {
        removeParticle(oldest, 0);
      }
    }
  };

  const spawnRandomParticles = (count: number) => {
    if (!embers.length) {
      return;
    }

    for (let index = 0; index < count; index += 1) {
      const ember = embers[Math.floor(Math.random() * embers.length)];
      if (!ember) {
        continue;
      }
      spawnParticle(ember, count > 1);
    }
  };

  const tickParticles = (time: number) => {
    const dt = Math.min((time - lastParticleTick) / 1000, 0.06);
    const dtMs = dt * 1000;
    lastParticleTick = time;
    const layerWidth = particleLayer.clientWidth;

    for (let index = particles.length - 1; index >= 0; index -= 1) {
      const particle = particles[index];
      if (!particle) {
        continue;
      }

      if (!particle.isHovered) {
        if (particle.phase === "rising") {
          particle.y -= particle.speedY * dt;
          particle.baseX += particle.driftX * dt;
          particle.swayPhase += particle.swaySpeed * dt;
          const swayOffset = Math.sin(particle.swayPhase) * particle.swayAmplitude;
          particle.x = particle.baseX + swayOffset;
          particle.driftX = clamp(
            particle.driftX + randomBetween(-EMBERS_PARTICLE_DRIFT_JITTER, EMBERS_PARTICLE_DRIFT_JITTER) * dt,
            -EMBERS_PARTICLE_DRIFT_SPEED_MAX,
            EMBERS_PARTICLE_DRIFT_SPEED_MAX
          );

          const maxX = Math.max(0, layerWidth - particle.size);
          if (particle.x <= 0) {
            particle.x = 0;
            particle.baseX = particle.x - swayOffset;
            particle.driftX = Math.abs(particle.driftX);
          } else if (particle.x >= maxX) {
            particle.x = maxX;
            particle.baseX = particle.x - swayOffset;
            particle.driftX = -Math.abs(particle.driftX);
          }

          if (particle.y + particle.size <= EMBERS_PARTICLE_TOP_HOLD_EDGE_PX) {
            particle.phase = "holding";
            particle.holdElapsedMs = 0;
            particle.y = EMBERS_PARTICLE_TOP_HOLD_EDGE_PX - particle.size;
          }
        } else if (particle.phase === "holding") {
          particle.holdElapsedMs += dtMs;
          if (particle.holdElapsedMs >= particle.holdDurationMs) {
            particle.phase = "fading";
            particle.fadeElapsedMs = 0;
          }
        } else {
          particle.fadeElapsedMs += dtMs;
          const opacity = clamp(
            1 - particle.fadeElapsedMs / particle.fadeDurationMs,
            0,
            1
          );
          particle.element.style.opacity = opacity.toFixed(3);
          if (opacity <= 0) {
            removeParticle(particle, index);
            continue;
          }
        }
      }

      particle.element.style.transform = `translate(${particle.x.toFixed(2)}px, ${particle.y.toFixed(2)}px)`;

      if (activePreviewParticleId === particle.id && !hoverPreview.hidden) {
        positionHoverPreview(particle.x, particle.y);
      }
    }

    particleRafId = window.requestAnimationFrame(tickParticles);
  };

  const triggerFlameBurst = () => {
    flameSlot.classList.remove("is-bursting");
    void flameSlot.offsetWidth;
    flameSlot.classList.add("is-bursting");
    window.setTimeout(() => {
      if (flameSlot.isConnected) {
        flameSlot.classList.remove("is-bursting");
      }
    }, 260);

    const burstCount = randomIntInclusive(
      EMBERS_PARTICLE_CLICK_BURST_MIN,
      EMBERS_PARTICLE_CLICK_BURST_MAX
    );
    spawnRandomParticles(burstCount);
  };

  const saveDraftDebounced = debounce(async () => {
    try {
      await embersApiService.saveDraft({
        displayName: nameInput.value,
        message: messageInput.value,
      });
    } catch {
      // Ignore draft save failures and keep the main flow uninterrupted.
    }
  }, 600);

  const handlePreviewClick = () => {
    const particleId = Number(hoverPreview.dataset.particleId ?? "");
    if (!Number.isFinite(particleId)) {
      return;
    }

    const particle = particles.find((item) => item.id === particleId);
    if (!particle) {
      return;
    }
    openDialog(particle.ember);
  };

  const handlePreviewPointerEnter = () => {
    previewHovered = true;
    clearPreviewHideTimer();
  };

  const handlePreviewPointerLeave = () => {
    previewHovered = false;
    queueHideHoverPreview();
  };

  const handleFlameKeydown = (event: KeyboardEvent) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      triggerFlameBurst();
    }
  };

  const handleFlameClick = (event: MouseEvent) => {
    event.stopPropagation();
    triggerFlameBurst();
  };

  const handleResize = () => {
    applySideViewMode();
    queueBottomGapSync();
    queueListPanelHeightSync();
  };

  const handleFormSubmit = (event: SubmitEvent) => {
    event.preventDefault();

    const message = messageInput.value.trim();
    if (!message) {
      setFormStatus(copy.embers.formMessageEmpty, true);
      messageInput.focus();
      return;
    }

    submitButton.disabled = true;
    setFormStatus(copy.embers.formPublishing, false);

    void (async () => {
      try {
        const created = await embersApiService.create({
          displayName: nameInput.value.trim(),
          message,
        });

        if (!form.isConnected) {
          return;
        }

        embers = [created.item, ...embers];
        messageInput.value = "";
        messageInput.focus();
        setFormStatus(copy.embers.formPublished, false);
        setListStatus(
          embers.length
            ? copy.embers.listLoaded(embers.length)
            : copy.embers.listEmptyBeforePost
        );
        renderListView();
        spawnParticle(created.item, true);

        void embersApiService
          .saveDraft({
            displayName: nameInput.value.trim(),
            message: "",
          })
          .catch(() => undefined);
      } catch (error) {
        if (!form.isConnected) {
          return;
        }
        setFormStatus(readableApiError(error, copy.embers.formPublishFailed), true);
      } finally {
        if (submitButton.isConnected) {
          submitButton.disabled = false;
        }
      }
    })();
  };

  const handleCloseDialog = () => {
    closeDialog();
  };

  const handleViewToggle = () => {
    sideViewMode = sideViewMode === "flame" ? "list" : "flame";
    applySideViewMode();
  };

  sideViewMode = isStackedLayout() ? "list" : "flame";
  renderListView();
  applySideViewMode();

  nameInput.addEventListener("input", saveDraftDebounced);
  messageInput.addEventListener("input", saveDraftDebounced);
  form.addEventListener("submit", handleFormSubmit);
  dialogCloseButton.addEventListener("click", handleCloseDialog);
  hoverPreview.addEventListener("click", handlePreviewClick);
  hoverPreview.addEventListener("pointerenter", handlePreviewPointerEnter);
  hoverPreview.addEventListener("pointerleave", handlePreviewPointerLeave);
  viewToggleButton.addEventListener("click", handleViewToggle);
  flameSlot.addEventListener("click", handleFlameClick);
  flameSlot.addEventListener("keydown", handleFlameKeydown);
  window.addEventListener("resize", handleResize);

  particleRafId = window.requestAnimationFrame(tickParticles);
  autoSpawnTimerId = window.setInterval(() => {
    const count = Math.random() < 0.5 ? 0 : 1;
    if (count > 0) {
      spawnRandomParticles(count);
    }
  }, EMBERS_PARTICLE_AUTO_SPAWN_MS);

  embersPageCleanup = () => {
    nameInput.removeEventListener("input", saveDraftDebounced);
    messageInput.removeEventListener("input", saveDraftDebounced);
    form.removeEventListener("submit", handleFormSubmit);
    dialogCloseButton.removeEventListener("click", handleCloseDialog);
    hoverPreview.removeEventListener("click", handlePreviewClick);
    hoverPreview.removeEventListener("pointerenter", handlePreviewPointerEnter);
    hoverPreview.removeEventListener("pointerleave", handlePreviewPointerLeave);
    viewToggleButton.removeEventListener("click", handleViewToggle);
    flameSlot.removeEventListener("click", handleFlameClick);
    flameSlot.removeEventListener("keydown", handleFlameKeydown);
    window.removeEventListener("resize", handleResize);

    if (autoSpawnTimerId !== null) {
      window.clearInterval(autoSpawnTimerId);
      autoSpawnTimerId = null;
    }

    if (particleRafId !== null) {
      window.cancelAnimationFrame(particleRafId);
      particleRafId = null;
    }

    if (bottomGapSyncRafId !== null) {
      window.cancelAnimationFrame(bottomGapSyncRafId);
      bottomGapSyncRafId = null;
    }

    if (listPanelHeightSyncRafId !== null) {
      window.cancelAnimationFrame(listPanelHeightSyncRafId);
      listPanelHeightSyncRafId = null;
    }

    clearPreviewHideTimer();
    hideHoverPreview();
    particles.forEach((particle) => particle.element.remove());
    particles.length = 0;
    messageInput.style.minHeight = "";
    dialogMessage.style.minHeight = "";
    monument.destroy();
  };

  queueBottomGapSync();

  try {
    const [session, emberListResponse] = await Promise.all([
      embersApiService.getSession(),
      embersApiService.list(20),
    ]);

    if (!form.isConnected) {
      return;
    }

    const draft = session?.draft ?? { displayName: "", message: "" };
    nameInput.value = draft.displayName ?? "";
    messageInput.value = draft.message ?? "";
    embers = Array.isArray(emberListResponse?.items) ? emberListResponse.items : [];
    setListStatus(
      embers.length ? copy.embers.listLoaded(embers.length) : copy.embers.listEmptyBeforePost
    );
    renderListView();
  } catch (error) {
    if (!form.isConnected) {
      return;
    }
    embers = [];
    renderListView();
    setListStatus(readableApiError(error, copy.embers.listLoadFailed), true);
  }

  queueBottomGapSync();
}

function formatEmberMeta(ember: EmberItem): string {
  return `${ember.displayName || copy.embers.defaultDisplayName} · ${formatEmberTime(ember.createdAt)}`;
}

function splitUnburntRawText(value: string): string[] {
  const normalized = value.replace(/\r\n?/g, "\n");
  const lines = normalized.split("\n");
  if (!lines.some((line) => line.trim())) {
    return [];
  }
  return lines;
}

type UnburntLineSegment = {
  start: number;
  end: number;
  content: string;
};

function buildMessagesFromLines(
  lines: string[],
  boundaries: number[],
  existingMessages: UnburntMessage[] = [],
  previousBoundaries?: number[]
): UnburntMessage[] {
  if (!lines.length) {
    return [];
  }

  const nextSegments = buildUnburntLineSegments(lines, boundaries);
  if (!nextSegments.length) {
    return [];
  }

  const previousSegments =
    existingMessages.length && Array.isArray(previousBoundaries)
      ? buildUnburntLineSegments(lines, previousBoundaries)
      : [];

  const output: UnburntMessage[] = [];
  for (const segment of nextSegments) {
    const preserved = resolvePreservedMessageForSegment(segment, previousSegments, existingMessages);
    const previousRole = output.at(-1)?.role;
    const fallbackRole: UnburntMessage["role"] =
      previousRole === "user" ? "4o" : previousRole === "4o" ? "user" : "user";

    output.push({
      role: preserved?.role ?? fallbackRole,
      content: preserved?.content ?? segment.content,
      order: output.length + 1,
    });
  }

  return output;
}

function buildUnburntLineSegments(lines: string[], boundaries: number[]): UnburntLineSegment[] {
  if (!lines.length) {
    return [];
  }

  const normalizedBoundaries = Array.from(
    new Set(
      boundaries.filter((item) => Number.isInteger(item) && item > 0 && item < lines.length)
    )
  ).sort((left, right) => left - right);
  const points = [...normalizedBoundaries, lines.length];
  const output: UnburntLineSegment[] = [];
  let start = 0;

  for (const point of points) {
    const segmentStart = start;
    const content = lines.slice(segmentStart, point).join("\n").trim();
    start = point;
    if (!content) {
      continue;
    }
    output.push({
      start: segmentStart,
      end: point,
      content,
    });
  }

  return output;
}

function resolvePreservedMessageForSegment(
  nextSegment: UnburntLineSegment,
  previousSegments: UnburntLineSegment[],
  existingMessages: UnburntMessage[]
): { role?: UnburntMessage["role"]; content?: string } | null {
  if (!previousSegments.length || !existingMessages.length) {
    return null;
  }

  const exactIndex = previousSegments.findIndex(
    (segment) => segment.start === nextSegment.start && segment.end === nextSegment.end
  );
  if (exactIndex >= 0 && exactIndex < existingMessages.length) {
    const current = existingMessages[exactIndex];
    const trimmed = typeof current.content === "string" ? current.content.trim() : "";
    return {
      role: current.role === "4o" ? "4o" : "user",
      content: trimmed || nextSegment.content,
    };
  }

  const containerIndex = previousSegments.findIndex(
    (segment) => segment.start <= nextSegment.start && segment.end >= nextSegment.end
  );
  if (containerIndex >= 0 && containerIndex < existingMessages.length) {
    const container = previousSegments[containerIndex];
    const containerMessage = existingMessages[containerIndex];
    const lineOffsetStart = nextSegment.start - container.start;
    const lineOffsetEnd = nextSegment.end - container.start;
    const slicedContent = sliceMessageByLineOffsets(
      typeof containerMessage.content === "string" ? containerMessage.content : "",
      lineOffsetStart,
      lineOffsetEnd,
      container.end - container.start
    );
    return {
      role:
        lineOffsetStart === 0
          ? containerMessage.role === "4o"
            ? "4o"
            : "user"
          : undefined,
      content: slicedContent ?? nextSegment.content,
    };
  }

  return null;
}

function sliceMessageByLineOffsets(
  value: string,
  startOffset: number,
  endOffset: number,
  expectedLineCount: number
): string | null {
  if (
    startOffset < 0 ||
    endOffset <= startOffset ||
    expectedLineCount <= 0 ||
    endOffset > expectedLineCount
  ) {
    return null;
  }

  const lines = value.replace(/\r\n?/g, "\n").split("\n");
  if (lines.length < expectedLineCount) {
    return null;
  }

  const content = lines.slice(startOffset, endOffset).join("\n").trim();
  return content || null;
}

function normalizeUnburntMessagesForSave(messages: UnburntMessage[]): UnburntMessage[] {
  return messages
    .map<UnburntMessage>((message) => ({
      role: message.role === "4o" ? "4o" : "user",
      content: message.content.trim(),
      order: message.order,
    }))
    .filter((message) => Boolean(message.content))
    .map<UnburntMessage>((message, index) => ({
      ...message,
      order: index + 1,
    }));
}

function deriveUnburntTitleFromMessages(messages: UnburntMessage[]): string {
  const first = messages[0]?.content.trim() ?? "";
  if (!first) {
    return "";
  }

  const firstLine = first.split("\n")[0]?.trim() ?? first;
  const sentence = firstLine.split(/[。！？.!?]/)[0]?.trim() ?? firstLine;
  const title = sentence || firstLine;
  if (title.length <= 64) {
    return title;
  }

  return `${title.slice(0, 64).trimEnd()}...`;
}

function parseUnburntTagsInput(value: string): string[] {
  const seen = new Set<string>();
  return value
    .split(/[,\n，]/g)
    .map((item) => item.trim())
    .filter((item) => {
      if (!item) {
        return false;
      }
      const key = item.toLowerCase();
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    })
    .slice(0, 12);
}

function formatEmberTime(createdAt: string): string {
  const timestamp = new Date(createdAt);
  if (Number.isNaN(timestamp.getTime())) {
    return copy.time.justNow;
  }

  const now = new Date();
  const diffMs = now.getTime() - timestamp.getTime();

  if (diffMs < 60_000) {
    return copy.time.justNow;
  }

  if (diffMs < 60 * 60_000) {
    const mins = Math.max(1, Math.floor(diffMs / 60_000));
    return new Intl.RelativeTimeFormat(currentLocale, { numeric: "always" }).format(
      -mins,
      "minute"
    );
  }

  const sameDay =
    now.getFullYear() === timestamp.getFullYear() &&
    now.getMonth() === timestamp.getMonth() &&
    now.getDate() === timestamp.getDate();

  const hh = String(timestamp.getHours()).padStart(2, "0");
  const mm = String(timestamp.getMinutes()).padStart(2, "0");

  if (sameDay) {
    return `${copy.time.todayPrefix} ${hh}:${mm}`;
  }

  return new Intl.DateTimeFormat(currentLocale, {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(timestamp);
}

function formatOnwardRestoreDeadline(value: string): string {
  const timestamp = new Date(value);
  if (Number.isNaN(timestamp.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat(currentLocale, {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(timestamp);
}

async function loadArticleList(): Promise<ArticleListItem[]> {
  if (articleListLoaded) {
    return articleListCache;
  }

  if (articleListLoadPromise) {
    return articleListLoadPromise;
  }

  const locale = getArticleLocaleToken(currentLocale);
  articleListLoadPromise = articlesApiService
    .list(locale)
    .then(({ items }) => {
      if (locale !== getArticleLocaleToken(currentLocale)) {
        return [];
      }
      const normalized = sortArticles(items, "latest");
      articleListCache = normalized;
      articleListLoaded = true;
      return normalized;
    })
    .finally(() => {
      articleListLoadPromise = null;
    });

  return articleListLoadPromise;
}

async function loadArticleDetail(articleId: string): Promise<ArticleDetailItem> {
  const normalizedId = articleId.trim().toLowerCase();

  const cached = articleDetailCache.get(normalizedId);
  if (cached) {
    return cached;
  }

  const pending = articleDetailLoadPromises.get(normalizedId);
  if (pending) {
    return pending;
  }

  const locale = getArticleLocaleToken(currentLocale);
  const request = articlesApiService
    .getById(normalizedId, locale)
    .then(({ item }) => {
      if (locale !== getArticleLocaleToken(currentLocale)) {
        return item;
      }
      articleDetailCache.set(normalizedId, item);
      upsertArticleListCache(item);
      return item;
    })
    .finally(() => {
      articleDetailLoadPromises.delete(normalizedId);
    });

  articleDetailLoadPromises.set(normalizedId, request);
  return request;
}

function clearArticleDataCache() {
  articleListCache = [];
  articleListLoaded = false;
  articleListLoadPromise = null;
  articleDetailCache.clear();
  articleDetailLoadPromises.clear();
  missingArticleIds.clear();
  articleDetailErrors.clear();
}

function getArticleLocaleToken(locale: Locale): ArticleLocale {
  return locale.startsWith("zh") ? "zh" : "en";
}

function upsertArticleListCache(item: ArticleListItem) {
  const index = articleListCache.findIndex((article) => article.id === item.id);
  if (index >= 0) {
    articleListCache[index] = item;
  } else {
    articleListCache.push(item);
  }
}

function getArticleCategories(): string[] {
  return Array.from(new Set(articleListCache.map((article) => article.category))).sort((a, b) =>
    a.localeCompare(b, currentLocale)
  );
}

function filterArticles(state: ArticleListState, source: ArticleListItem[]): ArticleListItem[] {
  const filtered = source.filter((article) => {
    if (state.category !== "all" && article.category !== state.category) {
      return false;
    }

    if (state.summaryFilter === "with-summary" && !article.summary?.trim()) {
      return false;
    }

    if (state.summaryFilter === "without-summary" && article.summary?.trim()) {
      return false;
    }

    if (!state.query) {
      return true;
    }

    const searchable = [
      article.title,
      article.summary ?? "",
      article.author.name,
      article.author.role,
      article.category,
      ...article.tags,
    ]
      .join(" ")
      .toLowerCase();

    return searchable.includes(state.query);
  });

  return sortArticles(filtered, state.sort);
}

function sortArticles(
  items: ArticleListItem[],
  option: ArticleSortOption
): ArticleListItem[] {
  const cloned = [...items];

  if (option === "title") {
    cloned.sort((a, b) => a.title.localeCompare(b.title, currentLocale));
    return cloned;
  }

  const compareDate = (left: ArticleListItem, right: ArticleListItem) => {
    const leftTime = new Date(left.publishedAt).getTime();
    const rightTime = new Date(right.publishedAt).getTime();
    return leftTime - rightTime;
  };

  cloned.sort(compareDate);
  if (option === "latest") {
    cloned.reverse();
  }

  return cloned;
}

function formatArticleDate(rawDate: string): string {
  const date = new Date(rawDate);
  if (Number.isNaN(date.getTime())) {
    return rawDate;
  }

  return new Intl.DateTimeFormat(currentLocale, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function formatArticleTocLabel(heading: string, index: number): string {
  const normalized = heading.replace(/\s+/g, " ").trim();
  if (!normalized) {
    return currentLocale === "zh-CN" ? `Section ${index + 1}` : `Section ${index + 1}`;
  }

  const maxLength = currentLocale === "zh-CN" ? 26 : 44;
  if (normalized.length <= maxLength) {
    return normalized;
  }

  return `${normalized.slice(0, maxLength).trimEnd()}...`;
}
function isExternalLink(value: string): boolean {
  return /^https?:\/\//i.test(value);
}

async function copyTextToClipboard(value: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(value);
      return true;
    }
  } catch {
    return fallbackCopy(value);
  }

  return fallbackCopy(value);
}

function fallbackCopy(value: string): boolean {
  try {
    const input = document.createElement("textarea");
    input.value = value;
    input.setAttribute("readonly", "true");
    input.style.position = "fixed";
    input.style.left = "-9999px";

    document.body.appendChild(input);
    input.select();
    const copied = document.execCommand("copy");
    document.body.removeChild(input);
    return copied;
  } catch {
    return false;
  }
}

function readableApiError(error: unknown, fallback: string): string {
  if (error instanceof ApiError) {
    return translateApiError(currentLocale, error.code, error.message || fallback, error.details);
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function escapeAttribute(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function renderSafeMarkdown(value: string): string {
  const source = value.replace(/\r\n?/g, "\n").trim();
  if (!source) {
    return "";
  }

  const lines = source.split("\n");
  const blocks: string[] = [];
  let paragraphLines: string[] = [];
  let quoteLines: string[] = [];
  let listItems: string[] = [];
  let listType: "ul" | "ol" | null = null;
  let codeLines: string[] = [];
  let inCodeBlock = false;

  const flushParagraph = () => {
    if (!paragraphLines.length) {
      return;
    }
    const paragraph = paragraphLines
      .map((line) => parseInlineMarkdown(line.trim()))
      .join("<br />");
    blocks.push(`<p>${paragraph}</p>`);
    paragraphLines = [];
  };

  const flushQuote = () => {
    if (!quoteLines.length) {
      return;
    }
    const quote = quoteLines.map((line) => parseInlineMarkdown(line.trim())).join("<br />");
    blocks.push(`<blockquote><p>${quote}</p></blockquote>`);
    quoteLines = [];
  };

  const flushList = () => {
    if (!listItems.length || !listType) {
      return;
    }
    blocks.push(`<${listType}>${listItems.map((item) => `<li>${item}</li>`).join("")}</${listType}>`);
    listItems = [];
    listType = null;
  };

  const flushCode = () => {
    if (!codeLines.length) {
      return;
    }
    blocks.push(`<pre><code>${escapeHtml(codeLines.join("\n"))}</code></pre>`);
    codeLines = [];
  };

  for (const rawLine of lines) {
    const line = rawLine.replace(/\t/g, "  ");
    const trimmed = line.trim();

    if (/^```/.test(trimmed)) {
      flushParagraph();
      flushQuote();
      flushList();
      if (inCodeBlock) {
        flushCode();
        inCodeBlock = false;
      } else {
        inCodeBlock = true;
        codeLines = [];
      }
      continue;
    }

    if (inCodeBlock) {
      codeLines.push(line);
      continue;
    }

    if (!trimmed) {
      flushParagraph();
      flushQuote();
      flushList();
      continue;
    }

    const headingMatch = line.match(/^(#{1,3})\s+(.+)$/);
    if (headingMatch) {
      flushParagraph();
      flushQuote();
      flushList();
      const level = headingMatch[1].length;
      blocks.push(`<h${level}>${parseInlineMarkdown(headingMatch[2].trim())}</h${level}>`);
      continue;
    }

    const quoteMatch = line.match(/^>\s?(.*)$/);
    if (quoteMatch) {
      flushParagraph();
      flushList();
      quoteLines.push(quoteMatch[1]);
      continue;
    }

    const unorderedListMatch = line.match(/^[-*]\s+(.+)$/);
    if (unorderedListMatch) {
      flushParagraph();
      flushQuote();
      if (listType && listType !== "ul") {
        flushList();
      }
      listType = "ul";
      listItems.push(parseInlineMarkdown(unorderedListMatch[1].trim()));
      continue;
    }

    const orderedListMatch = line.match(/^\d+\.\s+(.+)$/);
    if (orderedListMatch) {
      flushParagraph();
      flushQuote();
      if (listType && listType !== "ol") {
        flushList();
      }
      listType = "ol";
      listItems.push(parseInlineMarkdown(orderedListMatch[1].trim()));
      continue;
    }

    if (listType && listItems.length) {
      listItems[listItems.length - 1] += `<br />${parseInlineMarkdown(trimmed)}`;
      continue;
    }

    paragraphLines.push(line);
  }

  if (inCodeBlock) {
    flushCode();
  }
  flushParagraph();
  flushQuote();
  flushList();

  return blocks.join("");
}

function parseInlineMarkdown(value: string): string {
  if (!value) {
    return "";
  }

  const codeTokens: string[] = [];
  const linkTokens: string[] = [];
  let text = escapeHtml(value);

  text = text.replace(/`([^`\n]+)`/g, (_match, code: string) => {
    const token = `%%CODE_${codeTokens.length}%%`;
    codeTokens.push(`<code>${code}</code>`);
    return token;
  });

  text = text.replace(
    /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,
    (_match, label: string, href: string) => {
      const token = `%%LINK_${linkTokens.length}%%`;
      linkTokens.push(
        `<a href="${escapeAttribute(href)}" target="_blank" rel="noreferrer noopener">${label}</a>`
      );
      return token;
    }
  );

  text = text
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/__([^_]+)__/g, "<strong>$1</strong>")
    .replace(/~~([^~]+)~~/g, "<del>$1</del>");

  text = text.replace(/%%LINK_(\d+)%%/g, (_match, index: string) => {
    return linkTokens[Number(index)] ?? "";
  });

  text = text.replace(/%%CODE_(\d+)%%/g, (_match, index: string) => {
    return codeTokens[Number(index)] ?? "";
  });

  return text;
}

function debounce(
  task: () => void | Promise<void>,
  delayMs: number
): () => void {
  let timer: number | null = null;

  return () => {
    if (timer !== null) {
      window.clearTimeout(timer);
    }

    timer = window.setTimeout(() => {
      timer = null;
      void task();
    }, delayMs);
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function randomBetween(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

function randomIntInclusive(min: number, max: number): number {
  return Math.floor(randomBetween(min, max + 1));
}


