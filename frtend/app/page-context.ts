import type { Locale } from "../i18n";
import type { AppState } from "./app-state";
import type { RoutePath } from "./routes";

export interface PageContext {
  locale: Locale;
  route: RoutePath;
  navigate: (route: RoutePath, locale?: Locale, replace?: boolean) => void;
  navigateWithSearch: (
    route: RoutePath,
    search: URLSearchParams | string,
    locale?: Locale,
    replace?: boolean
  ) => void;
  showToast: (message: string, options?: { isError?: boolean; durationMs?: number; key?: string }) => void;
  copy: (value: string) => Promise<boolean>;
  rerender: () => void;
  getState: () => AppState;
}

export interface PageModule<R extends RoutePath = RoutePath> {
  id: string;
  match: (route: RoutePath) => route is R;
  render: (route: R, ctx: PageContext) => string;
  setup: (route: R, ctx: PageContext) => void | Promise<void>;
  cleanup: () => void;
}
