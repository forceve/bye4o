import type { PageModule } from "../app/page-context";
import { ROUTES } from "../app/routes";
import {
  cleanupUnburntPage,
  renderUnburntMinePage,
  setupPageInteractions,
} from "../app/shell";

export const unburntMinePage: PageModule<typeof ROUTES.unburntMine> = {
  id: "unburnt-mine",
  match: (route): route is typeof ROUTES.unburntMine => route === ROUTES.unburntMine,
  render: () => renderUnburntMinePage(),
  setup: () => {
    setupPageInteractions(ROUTES.unburntMine);
  },
  cleanup: () => {
    cleanupUnburntPage();
  },
};
