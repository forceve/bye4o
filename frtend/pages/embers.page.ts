import type { PageModule } from "../app/page-context";
import { ROUTES } from "../app/routes";
import { cleanupEmbersPage, renderEmbersPage, setupPageInteractions } from "../app/shell";

export const embersPage: PageModule<typeof ROUTES.embers> = {
  id: "embers",
  match: (route): route is typeof ROUTES.embers => route === ROUTES.embers,
  render: () => renderEmbersPage(),
  setup: () => {
    setupPageInteractions(ROUTES.embers);
  },
  cleanup: () => {
    cleanupEmbersPage();
  },
};
