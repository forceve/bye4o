const INFO_DOCK_ID = "global-info-dock";
const INFO_MODAL_OPEN_CLASS = "info-modal--open";

let cleanupInfoDock: (() => void) | null = null;

export interface InfoDockCopy {
  openButtonAriaLabel: string;
  tooltip: string;
  closeButtonAriaLabel: string;
  kicker: string;
  title: string;
  paragraph1: string;
  paragraph2: string;
  paragraph3: string;
}

const DEFAULT_COPY: InfoDockCopy = {
  openButtonAriaLabel: "Open page info",
  tooltip: "页面信息",
  closeButtonAriaLabel: "Close info dialog",
  kicker: "Info",
  title: "关于 bye4o.org...",
  paragraph1: "bye4o 是一个围绕记忆、告别与回响的实验性页面。",
  paragraph2: "右上角为导航区域，可切换不同版块内容。",
  paragraph3: "右下角此图标会常驻显示，用于快速查看说明。",
};

export function mountInfoDock(copy: InfoDockCopy = DEFAULT_COPY) {
  if (cleanupInfoDock) {
    cleanupInfoDock();
    cleanupInfoDock = null;
  }

  const dock = document.createElement("div");
  dock.id = INFO_DOCK_ID;
  dock.className = "info-dock";
  dock.innerHTML = `
    <button
      type="button"
      class="info-dock__button"
      aria-label="${copy.openButtonAriaLabel}"
      aria-controls="site-info-modal"
      aria-haspopup="dialog"
    >
      <span class="info-dock__icon" aria-hidden="true">i</span>
      <span class="info-dock__tooltip" role="tooltip">${copy.tooltip}</span>
    </button>

    <div
      id="site-info-modal"
      class="info-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="site-info-title"
      aria-hidden="true"
    >
      <div class="info-modal__backdrop" data-info-close="true"></div>
      <section class="info-modal__panel">
        <button
          type="button"
          class="info-modal__close"
          aria-label="${copy.closeButtonAriaLabel}"
          data-info-close="true"
        >
          ×
        </button>
        <p class="info-modal__kicker">${copy.kicker}</p>
        <h2 id="site-info-title" class="info-modal__title">${copy.title}</h2>
        <p class="info-modal__text">${copy.paragraph1}</p>
        <p class="info-modal__text">${copy.paragraph2}</p>
        <p class="info-modal__text">${copy.paragraph3}</p>
      </section>
    </div>
  `;

  document.body.appendChild(dock);

  const button = dock.querySelector(".info-dock__button") as HTMLButtonElement | null;
  const modal = dock.querySelector(".info-modal") as HTMLDivElement | null;

  if (!button || !modal) {
    return;
  }

  const openModal = () => {
    modal.classList.add(INFO_MODAL_OPEN_CLASS);
    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("info-modal-open");
  };

  const closeModal = () => {
    modal.classList.remove(INFO_MODAL_OPEN_CLASS);
    modal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("info-modal-open");
  };

  const handleButtonClick = () => {
    if (modal.classList.contains(INFO_MODAL_OPEN_CLASS)) {
      closeModal();
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
    document.body.classList.remove("info-modal-open");
  };
}
