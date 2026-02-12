const INFO_DOCK_ID = "global-info-dock";
const INFO_MODAL_OPEN_CLASS = "info-modal--open";
const INFO_MODAL_ID = "site-info-modal";
const INFO_MODAL_TITLE_ID = "site-info-title";
const INFO_MODAL_TAB_PANEL_ID = "site-info-tab-panel";
const INFO_MODAL_TAB_ID_PREFIX = "site-info-tab";

let cleanupInfoDock: (() => void) | null = null;

export interface InfoDockGuideItem {
  page: string;
  route: string;
  operation: string;
  feature: string;
}

export interface InfoDockSupportItem {
  title: string;
  description: string;
  linkLabel?: string;
  href?: string;
}

export interface InfoDockMountOptions {
  currentRoute?: string;
}

export interface InfoDockCopy {
  openButtonAriaLabel: string;
  tooltip: string;
  closeButtonAriaLabel: string;
  kicker: string;
  title: string;
  intro: string;
  currentPageTitle?: string;
  supportTitle?: string;
  otherPagesTitle?: string;
  otherPagesTabsAriaLabel?: string;
  otherPagesEmptyText?: string;
  supportItems?: InfoDockSupportItem[];
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
  currentPageTitle: "\u5f53\u524d\u9875\u9762",
  supportTitle: "\u8054\u7cfb\u4e0e\u5e2e\u52a9",
  otherPagesTitle: "\u5176\u4ed6\u9875\u9762",
  otherPagesTabsAriaLabel: "\u9875\u9762\u6807\u7b7e",
  otherPagesEmptyText: "\u6682\u65e0\u5176\u4ed6\u9875\u9762",
  supportItems: [
    {
      title: "GitHub",
      description: "\u9879\u76ee\u4ed3\u5e93",
      linkLabel: "github.com/forceve/bye4o",
      href: "https://github.com/forceve/bye4o",
    },
    {
      title: "\u6295\u7a3f\u65b9\u5f0f",
      description:
        "\u90ae\u7bb1\uff1aforceve@163.com\uff08\u53ef\u6295\u7a3f firewords \u548c articles\uff09",
      linkLabel: "forceve@163.com",
      href: "mailto:forceve@163.com",
    },
    {
      title: "\u5e2e\u52a9 bye4o",
      description:
        "\u6211\u4eec\u9700\u8981\u4ec0\u4e48\uff1a\u6682\u65f6\u8bf7\u8054\u7cfb\u90ae\u7bb1\u54a8\u8be2\u3002",
      linkLabel: "forceve@163.com",
      href: "mailto:forceve@163.com",
    },
  ],
  operationLabel: "Action",
  featureLabel: "Feature",
  pages: [
    {
      page: "The bench / Fire",
      route: "/{locale}/fire",
      operation: "Click or press any key to enter the scene; use wheel to adjust brightness.",
      feature: "Landing page with scene entry and opening guidance.",
    },
    {
      page: "Embers",
      route: "/{locale}/embers",
      operation: "Submit a display name and message; new entries appear on top.",
      feature: "Message board with posting and draft persistence.",
    },
  ],
};

export function mountInfoDock(
  copy: InfoDockCopy = DEFAULT_COPY,
  options: InfoDockMountOptions = {}
) {
  if (cleanupInfoDock) {
    cleanupInfoDock();
    cleanupInfoDock = null;
  }

  const pages = Array.isArray(copy.pages) ? copy.pages : [];
  const currentRoute = normalizePath(options.currentRoute ?? "");
  const currentPageIndex = resolveCurrentPageIndex(pages, currentRoute);
  const currentPage = currentPageIndex >= 0 ? pages[currentPageIndex] : null;
  const otherPages = pages.filter((_, index) => index !== currentPageIndex);
  const defaultOtherPageIndex =
    otherPages.length > 0 ? Math.floor(Math.random() * otherPages.length) : -1;
  const defaultOtherPage =
    defaultOtherPageIndex >= 0 ? otherPages[defaultOtherPageIndex] : null;
  const defaultOtherTabId =
    defaultOtherPageIndex >= 0 ? `${INFO_MODAL_TAB_ID_PREFIX}-${defaultOtherPageIndex}` : "";

  const supportTitle = copy.supportTitle ?? DEFAULT_COPY.supportTitle ?? "";
  const currentPageTitle = copy.currentPageTitle ?? DEFAULT_COPY.currentPageTitle ?? "Current page";
  const otherPagesTitle = copy.otherPagesTitle ?? DEFAULT_COPY.otherPagesTitle ?? "Other pages";
  const otherPagesTabsAriaLabel =
    copy.otherPagesTabsAriaLabel ??
    DEFAULT_COPY.otherPagesTabsAriaLabel ??
    "Other page tabs";
  const otherPagesEmptyText =
    copy.otherPagesEmptyText ?? DEFAULT_COPY.otherPagesEmptyText ?? "No other pages";
  const supportItems =
    copy.supportItems && copy.supportItems.length > 0
      ? copy.supportItems
      : (DEFAULT_COPY.supportItems ?? []);

  const supportCards = supportItems
    .map((entry) => {
      const href = entry.href ? normalizeSupportHref(entry.href) : null;
      const linkLabel = entry.linkLabel?.trim();
      const linkAttrs =
        href && isHttpHref(href) ? ' target="_blank" rel="noreferrer noopener"' : "";
      const link = href && linkLabel
        ? `<a class="info-modal__support-link" href="${escapeHtml(href)}"${linkAttrs}>${escapeHtml(linkLabel)}</a>`
        : "";

      return `
        <article class="info-modal__card info-modal__card--support" role="listitem">
          <h3 class="info-modal__card-title">${escapeHtml(entry.title)}</h3>
          <p class="info-modal__card-line">${escapeHtml(entry.description)}</p>
          ${link}
        </article>
      `;
    })
    .join("");

  const otherPageTabs = otherPages
    .map((entry, index) => {
      const selected = index === defaultOtherPageIndex;
      return `
        <button
          type="button"
          id="${INFO_MODAL_TAB_ID_PREFIX}-${index}"
          class="info-modal__tab${selected ? " is-active" : ""}"
          data-info-tab-index="${index}"
          role="tab"
          aria-selected="${selected ? "true" : "false"}"
          aria-controls="${INFO_MODAL_TAB_PANEL_ID}"
          tabindex="${selected ? "0" : "-1"}"
        >
          ${escapeHtml(entry.page)}
        </button>
      `;
    })
    .join("");

  const currentPageCard = currentPage
    ? buildGuideCardMarkup(currentPage, copy, "info-modal__card--current")
    : `<p class="info-modal__tab-empty">${escapeHtml(otherPagesEmptyText)}</p>`;

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
        <section class="info-modal__current" aria-label="${escapeHtml(currentPageTitle)}">
          <h3 class="info-modal__section-title">${escapeHtml(currentPageTitle)}</h3>
          <div class="info-modal__current-body" role="list">
            ${currentPageCard}
          </div>
        </section>
        <section class="info-modal__extras" aria-label="${escapeHtml(supportTitle)}">
          <h3 class="info-modal__section-title">${escapeHtml(supportTitle)}</h3>
          <div class="info-modal__extras-grid" role="list">
            ${supportCards}
          </div>
        </section>
        <section class="info-modal__tabs-section" aria-label="${escapeHtml(otherPagesTitle)}">
          <h3 class="info-modal__section-title">${escapeHtml(otherPagesTitle)}</h3>
          ${
            otherPages.length > 0
              ? `
                <div class="info-modal__tabs" role="tablist" aria-label="${escapeHtml(otherPagesTabsAriaLabel)}">
                  ${otherPageTabs}
                </div>
                <section
                  id="${INFO_MODAL_TAB_PANEL_ID}"
                  class="info-modal__tab-panel"
                  role="tabpanel"
                  aria-live="polite"
                  aria-labelledby="${defaultOtherTabId}"
                >
                  <div class="info-modal__tab-panel-body" role="list">
                    ${defaultOtherPage ? buildGuideCardMarkup(defaultOtherPage, copy, "info-modal__card--tab") : ""}
                  </div>
                </section>
              `
              : `<p class="info-modal__tab-empty">${escapeHtml(otherPagesEmptyText)}</p>`
          }
        </section>
      </section>
    </div>
  `;

  document.body.appendChild(dock);

  const button = dock.querySelector(".info-dock__button") as HTMLButtonElement | null;
  const modal = dock.querySelector(".info-modal") as HTMLDivElement | null;
  const closeButton = dock.querySelector(
    ".info-modal__close"
  ) as HTMLButtonElement | null;
  const tabPanel = dock.querySelector(`#${INFO_MODAL_TAB_PANEL_ID}`) as HTMLElement | null;
  const tabPanelBody = dock.querySelector(".info-modal__tab-panel-body") as HTMLDivElement | null;
  const tabButtons = Array.from(
    dock.querySelectorAll<HTMLButtonElement>(".info-modal__tab[data-info-tab-index]")
  );
  const tabCleanup: Array<() => void> = [];

  if (!button || !modal) {
    return;
  }

  if (tabButtons.length > 0 && tabPanel && tabPanelBody && otherPages.length > 0) {
    let activeTabIndex = defaultOtherPageIndex >= 0 ? defaultOtherPageIndex : 0;

    const setActiveTab = (nextIndex: number, focus = false) => {
      activeTabIndex = wrapIndex(nextIndex, otherPages.length);
      const selectedEntry = otherPages[activeTabIndex];
      const selectedButton = tabButtons[activeTabIndex] ?? null;

      tabButtons.forEach((tabButton, index) => {
        const isActive = index === activeTabIndex;
        tabButton.classList.toggle("is-active", isActive);
        tabButton.setAttribute("aria-selected", isActive ? "true" : "false");
        tabButton.setAttribute("tabindex", isActive ? "0" : "-1");
      });

      if (selectedEntry && selectedButton) {
        tabPanelBody.innerHTML = buildGuideCardMarkup(selectedEntry, copy, "info-modal__card--tab");
        tabPanel.setAttribute("aria-labelledby", selectedButton.id);
        if (focus) {
          selectedButton.focus();
        }
      }
    };

    tabButtons.forEach((tabButton, index) => {
      const handleClick = () => {
        setActiveTab(index);
      };

      const handleKeyDown = (event: KeyboardEvent) => {
        let targetIndex: number | null = null;
        if (event.key === "ArrowRight" || event.key === "ArrowDown") {
          targetIndex = activeTabIndex + 1;
        } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
          targetIndex = activeTabIndex - 1;
        } else if (event.key === "Home") {
          targetIndex = 0;
        } else if (event.key === "End") {
          targetIndex = otherPages.length - 1;
        }

        if (targetIndex === null) {
          return;
        }

        event.preventDefault();
        setActiveTab(targetIndex, true);
      };

      tabButton.addEventListener("click", handleClick);
      tabButton.addEventListener("keydown", handleKeyDown);
      tabCleanup.push(() => {
        tabButton.removeEventListener("click", handleClick);
        tabButton.removeEventListener("keydown", handleKeyDown);
      });
    });

    setActiveTab(activeTabIndex);
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
    tabCleanup.forEach((dispose) => {
      dispose();
    });
    button.removeEventListener("click", handleButtonClick);
    modal.removeEventListener("click", handleModalClick);
    window.removeEventListener("keydown", handleKeyDown);
    dock.remove();
    button.setAttribute("aria-expanded", "false");
    document.body.classList.remove("info-modal-open");
  };
}

function buildGuideCardMarkup(
  entry: InfoDockGuideItem,
  copy: InfoDockCopy,
  extraClass = ""
): string {
  const className = extraClass ? `info-modal__card ${extraClass}` : "info-modal__card";
  return `
    <article class="${className}" role="listitem">
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
  `;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function normalizeSupportHref(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  if (/^mailto:/i.test(trimmed)) {
    return trimmed;
  }

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  if (/^[a-z0-9.-]+\.[a-z]{2,}(?:[/?#:]|$)/i.test(trimmed)) {
    return `https://${trimmed}`;
  }

  return null;
}

function isHttpHref(value: string): boolean {
  return /^https?:\/\//i.test(value);
}

function resolveCurrentPageIndex(pages: InfoDockGuideItem[], currentRoute: string): number {
  if (pages.length === 0) {
    return -1;
  }

  const matchedIndex = pages.findIndex((entry) => {
    return routePatternMatches(entry.route, currentRoute);
  });

  if (matchedIndex >= 0) {
    return matchedIndex;
  }

  return 0;
}

function routePatternMatches(routePattern: string, currentRoute: string): boolean {
  const normalizedPattern = normalizeRoutePattern(routePattern);
  const normalizedCurrent = normalizePath(currentRoute);
  const patternSegments = normalizedPattern.split("/").filter(Boolean);
  const currentSegments = normalizedCurrent.split("/").filter(Boolean);

  if (patternSegments.length !== currentSegments.length) {
    return false;
  }

  for (let index = 0; index < patternSegments.length; index += 1) {
    const patternSegment = patternSegments[index];
    const currentSegment = currentSegments[index];

    if (!patternSegment || !currentSegment) {
      return false;
    }

    if (patternSegment.startsWith(":")) {
      continue;
    }

    if (patternSegment !== currentSegment) {
      return false;
    }
  }

  return true;
}

function normalizeRoutePattern(routePattern: string): string {
  const trimmed = routePattern.trim();
  const withoutLocale = trimmed.replace(/^\/\{locale\}/, "");
  return normalizePath(withoutLocale);
}

function normalizePath(path: string): string {
  const base = path.split(/[?#]/, 1)[0]?.trim() ?? "";
  if (!base) {
    return "/";
  }

  const withLeadingSlash = base.startsWith("/") ? base : `/${base}`;
  const normalized = withLeadingSlash.replace(/\/{2,}/g, "/");
  if (normalized !== "/" && normalized.endsWith("/")) {
    return normalized.slice(0, -1);
  }
  return normalized;
}

function wrapIndex(index: number, length: number): number {
  if (length <= 0) {
    return 0;
  }
  return ((index % length) + length) % length;
}
