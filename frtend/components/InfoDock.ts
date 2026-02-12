const INFO_DOCK_ID = "global-info-dock";
const INFO_MODAL_OPEN_CLASS = "info-modal--open";
const INFO_MODAL_ID = "site-info-modal";
const INFO_MODAL_TITLE_ID = "site-info-title";

let cleanupInfoDock: (() => void) | null = null;

export interface InfoDockGuideItem {
  page: string;
  route: string;
  operation: string;
  feature: string;
}

export interface InfoDockCopy {
  openButtonAriaLabel: string;
  tooltip: string;
  closeButtonAriaLabel: string;
  kicker: string;
  title: string;
  intro: string;
  operationLabel: string;
  featureLabel: string;
  pages: InfoDockGuideItem[];
}

const DEFAULT_COPY: InfoDockCopy = {
  openButtonAriaLabel: "Open page guide",
  tooltip: "Page guide",
  closeButtonAriaLabel: "Close page guide",
  kicker: "Guide",
  title: "Page actions and features",
  intro: "This dialog summarizes core actions and features across pages.",
  operationLabel: "Action",
  featureLabel: "Feature",
  pages: [
    {
      page: "Bench / Fire",
      route: "/{locale}/fire",
      operation: "Click or press any key to enter the scene; use wheel to adjust brightness.",
      feature: "Landing page with scene entry and opening guidance.",
    },
    {
      page: "Traces",
      route: "/{locale}/traces",
      operation: "Submit a display name and message; new entries appear on top.",
      feature: "Message board with posting and draft persistence.",
    },
  ],
};

export function mountInfoDock(copy: InfoDockCopy = DEFAULT_COPY) {
  if (cleanupInfoDock) {
    cleanupInfoDock();
    cleanupInfoDock = null;
  }

  const guideCards = copy.pages
    .map(
      (entry) => `
        <article class="info-modal__card" role="listitem">
          <header class="info-modal__card-head">
            <h3 class="info-modal__card-title">${escapeHtml(entry.page)}</h3>
            <span class="info-modal__route">${escapeHtml(entry.route)}</span>
          </header>
          <p class="info-modal__card-line">
            <span class="info-modal__label">${escapeHtml(copy.operationLabel)}</span>
            ${escapeHtml(entry.operation)}
          </p>
          <p class="info-modal__card-line">
            <span class="info-modal__label">${escapeHtml(copy.featureLabel)}</span>
            ${escapeHtml(entry.feature)}
          </p>
        </article>
      `
    )
    .join("");

  const dock = document.createElement("div");
  dock.id = INFO_DOCK_ID;
  dock.className = "info-dock";
  dock.innerHTML = `
    <button
      type="button"
      class="info-dock__button"
      aria-label="${escapeHtml(copy.openButtonAriaLabel)}"
      aria-controls="${INFO_MODAL_ID}"
      aria-expanded="false"
      aria-haspopup="dialog"
    >
      <span class="info-dock__icon" aria-hidden="true">i</span>
      <span class="info-dock__tooltip" role="tooltip">${escapeHtml(copy.tooltip)}</span>
    </button>

    <div
      id="${INFO_MODAL_ID}"
      class="info-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="${INFO_MODAL_TITLE_ID}"
      aria-hidden="true"
    >
      <div class="info-modal__backdrop" data-info-close="true"></div>
      <section class="info-modal__panel">
        <button
          type="button"
          class="info-modal__close"
          aria-label="${escapeHtml(copy.closeButtonAriaLabel)}"
          data-info-close="true"
        >
          &times;
        </button>
        <p class="info-modal__kicker">${escapeHtml(copy.kicker)}</p>
        <h2 id="${INFO_MODAL_TITLE_ID}" class="info-modal__title">${escapeHtml(copy.title)}</h2>
        <p class="info-modal__intro">${escapeHtml(copy.intro)}</p>
        <div class="info-modal__grid" role="list">
          ${guideCards}
        </div>
      </section>
    </div>
  `;

  document.body.appendChild(dock);

  const button = dock.querySelector(".info-dock__button") as HTMLButtonElement | null;
  const modal = dock.querySelector(".info-modal") as HTMLDivElement | null;
  const closeButton = dock.querySelector(
    ".info-modal__close"
  ) as HTMLButtonElement | null;

  if (!button || !modal) {
    return;
  }

  const openModal = () => {
    modal.classList.add(INFO_MODAL_OPEN_CLASS);
    modal.setAttribute("aria-hidden", "false");
    button.setAttribute("aria-expanded", "true");
    document.body.classList.add("info-modal-open");
    closeButton?.focus();
  };

  const closeModal = (restoreFocus = true) => {
    modal.classList.remove(INFO_MODAL_OPEN_CLASS);
    modal.setAttribute("aria-hidden", "true");
    button.setAttribute("aria-expanded", "false");
    document.body.classList.remove("info-modal-open");
    if (restoreFocus) {
      button.focus();
    }
  };

  const handleButtonClick = () => {
    if (modal.classList.contains(INFO_MODAL_OPEN_CLASS)) {
      closeModal(false);
      return;
    }

    openModal();
  };

  const handleModalClick = (event: MouseEvent) => {
    const target = event.target as HTMLElement | null;
    if (target?.closest("[data-info-close='true']")) {
      closeModal();
    }
  };

  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key !== "Escape") {
      return;
    }

    if (!modal.classList.contains(INFO_MODAL_OPEN_CLASS)) {
      return;
    }

    closeModal();
  };

  button.addEventListener("click", handleButtonClick);
  modal.addEventListener("click", handleModalClick);
  window.addEventListener("keydown", handleKeyDown);

  cleanupInfoDock = () => {
    button.removeEventListener("click", handleButtonClick);
    modal.removeEventListener("click", handleModalClick);
    window.removeEventListener("keydown", handleKeyDown);
    dock.remove();
    button.setAttribute("aria-expanded", "false");
    document.body.classList.remove("info-modal-open");
  };
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
