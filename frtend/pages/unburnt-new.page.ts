import type { PageModule } from "../app/page-context";
import { ROUTES } from "../app/routes";
import {
  cleanupUnburntPage,
  renderUnburntComposerPage,
  setupPageInteractions,
} from "../app/shell";

export const unburntNewPage: PageModule<typeof ROUTES.unburntNew> = {
  id: "unburnt-new",
  match: (route): route is typeof ROUTES.unburntNew => route === ROUTES.unburntNew,
  render: () => renderUnburntComposerPage(),
  setup: () => {
    setupPageInteractions(ROUTES.unburntNew);
  },
  cleanup: () => {
    cleanupUnburntPage();
  },
};
