import type { PageModule } from "../app/page-context";
import { articleDetailPage } from "./article-detail.page";
import { carvingsArticlesPage } from "./carvings-articles.page";
import { carvingsPage } from "./carvings.page";
import { embersPage } from "./embers.page";
import { firePage } from "./fire.page";
import { firewordsPage } from "./firewords.page";
import { onwardPage } from "./onward.page";
import { unburntDetailPage } from "./unburnt-detail.page";
import { unburntMinePage } from "./unburnt-mine.page";
import { unburntNewPage } from "./unburnt-new.page";
import { unburntPublicPage } from "./unburnt-public.page";

export const PAGE_MODULES: PageModule[] = [
  firePage,
  firewordsPage,
  carvingsPage,
  carvingsArticlesPage,
  unburntPublicPage,
  unburntMinePage,
  unburntNewPage,
  embersPage,
  onwardPage,
  articleDetailPage,
  unburntDetailPage,
];
