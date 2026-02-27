import type { Locale } from "../i18n";
import type { RoutePath } from "./routes";

export interface ArticleStore {
  listCache: unknown[];
  detailCache: Map<string, unknown>;
  listRequestToken: number;
  detailRequestTokens: Map<string, number>;
}

export interface UnburntStore {
  listCache: unknown[];
  detailCache: Map<string, unknown>;
}

export interface UiStore {
  toastKeys: Set<string>;
}

export interface CleanupRegistry {
  currentRouteCleanup: (() => void) | null;
}

export interface AppState {
  locale: Locale;
  route: RoutePath;
  articleStore: ArticleStore;
  unburntStore: UnburntStore;
  uiStore: UiStore;
  cleanupRegistry: CleanupRegistry;
}

const appState: AppState = {
  locale: "zh-CN",
  route: "/fire",
  articleStore: {
    listCache: [],
    detailCache: new Map<string, unknown>(),
    listRequestToken: 0,
    detailRequestTokens: new Map<string, number>(),
  },
  unburntStore: {
    listCache: [],
    detailCache: new Map<string, unknown>(),
  },
  uiStore: {
    toastKeys: new Set<string>(),
  },
  cleanupRegistry: {
    currentRouteCleanup: null,
  },
};

export function getAppState(): AppState {
  return appState;
}

export function patchAppState(patch: Partial<Pick<AppState, "locale" | "route">>): AppState {
  if (patch.locale) {
    appState.locale = patch.locale;
  }
  if (patch.route) {
    appState.route = patch.route;
  }
  return appState;
}

export function clearArticleStoreCache(): void {
  appState.articleStore.listCache = [];
  appState.articleStore.detailCache.clear();
  appState.articleStore.listRequestToken += 1;
  appState.articleStore.detailRequestTokens.clear();
}
