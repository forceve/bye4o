import type { PageModule } from "../app/page-context";
import { ROUTES } from "../app/routes";
import {
  clearFireBackgroundControl,
  clearFireEntryState,
  renderFireLayout,
} from "../app/shell";

export const firePage: PageModule<typeof ROUTES.fire> = {
  id: "fire",
  match: (route): route is typeof ROUTES.fire => route === ROUTES.fire,
  render: () => renderFireLayout(),
  setup: () => {},
  cleanup: () => {
    clearFireEntryState();
    clearFireBackgroundControl();
  },
};
