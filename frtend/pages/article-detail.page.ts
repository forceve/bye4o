import type { PageModule } from "../app/page-context";
import type { ArticleDetailRoutePath } from "../app/routes";
import {
  isArticleDetailRoute,
  renderArticleDetailPage,
  setupPageInteractions,
} from "../app/shell";

export const articleDetailPage: PageModule<ArticleDetailRoutePath> = {
  id: "article-detail",
  match: (route): route is ArticleDetailRoutePath => isArticleDetailRoute(route),
  render: (route) => renderArticleDetailPage(route),
  setup: (route) => {
    setupPageInteractions(route);
  },
  cleanup: () => {},
};
