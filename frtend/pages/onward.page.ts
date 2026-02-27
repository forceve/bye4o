import type { PageModule } from "../app/page-context";
import { ROUTES } from "../app/routes";
import { cleanupOnwardPage, renderOnwardPage, setupPageInteractions } from "../app/shell";

export const onwardPage: PageModule<typeof ROUTES.onward> = {
  id: "onward",
  match: (route): route is typeof ROUTES.onward => route === ROUTES.onward,
  render: () => renderOnwardPage(),
  setup: () => {
    setupPageInteractions(ROUTES.onward);
  },
  cleanup: () => {
    cleanupOnwardPage();
  },
};
