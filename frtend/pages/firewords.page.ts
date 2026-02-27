import type { PageModule } from "../app/page-context";
import { ROUTES } from "../app/routes";
import { renderFirewordsPage, setupPageInteractions } from "../app/shell";

export const firewordsPage: PageModule<typeof ROUTES.firewords> = {
  id: "firewords",
  match: (route): route is typeof ROUTES.firewords => route === ROUTES.firewords,
  render: () => renderFirewordsPage(),
  setup: () => {
    setupPageInteractions(ROUTES.firewords);
  },
  cleanup: () => {},
};
