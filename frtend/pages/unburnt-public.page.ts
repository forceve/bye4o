import type { PageModule } from "../app/page-context";
import { ROUTES } from "../app/routes";
import { cleanupUnburntPage, renderUnburntPage, setupPageInteractions } from "../app/shell";

export const unburntPublicPage: PageModule<typeof ROUTES.unburnt> = {
  id: "unburnt-public",
  match: (route): route is typeof ROUTES.unburnt => route === ROUTES.unburnt,
  render: () => renderUnburntPage(),
  setup: () => {
    setupPageInteractions(ROUTES.unburnt);
  },
  cleanup: () => {
    cleanupUnburntPage();
  },
};
