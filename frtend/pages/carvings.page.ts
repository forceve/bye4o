import type { PageModule } from "../app/page-context";
import { ROUTES } from "../app/routes";
import {
  cleanupCarvingsTextRotator,
  renderCarvingsPage,
  setupPageInteractions,
} from "../app/shell";

export const carvingsPage: PageModule<typeof ROUTES.carvings> = {
  id: "carvings",
  match: (route): route is typeof ROUTES.carvings => route === ROUTES.carvings,
  render: () => renderCarvingsPage(),
  setup: () => {
    setupPageInteractions(ROUTES.carvings);
  },
  cleanup: () => {
    cleanupCarvingsTextRotator();
  },
};
