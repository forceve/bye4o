import type { PageModule } from "../app/page-context";
import { ROUTES } from "../app/routes";
import { renderCarvingsArticlesPage, setupPageInteractions } from "../app/shell";

export const carvingsArticlesPage: PageModule<typeof ROUTES.carvingsArticles> = {
  id: "carvings-articles",
  match: (route): route is typeof ROUTES.carvingsArticles => route === ROUTES.carvingsArticles,
  render: () => renderCarvingsArticlesPage(),
  setup: () => {
    setupPageInteractions(ROUTES.carvingsArticles);
  },
  cleanup: () => {},
};
