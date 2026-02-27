import type { PageModule } from "../app/page-context";
import type { UnburntDetailRoutePath, UnburntEditRoutePath } from "../app/routes";
import {
  cleanupUnburntPage,
  isUnburntEditRoute,
  isUnburntDetailRoute,
  renderUnburntDetailPage,
  setupPageInteractions,
} from "../app/shell";

export const unburntDetailPage: PageModule<UnburntDetailRoutePath | UnburntEditRoutePath> = {
  id: "unburnt-detail",
  match: (route): route is UnburntDetailRoutePath | UnburntEditRoutePath =>
    isUnburntDetailRoute(route) || isUnburntEditRoute(route),
  render: (route) => renderUnburntDetailPage(route),
  setup: (route) => {
    setupPageInteractions(route);
  },
  cleanup: () => {
    cleanupUnburntPage();
  },
};
