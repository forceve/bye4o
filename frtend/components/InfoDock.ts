const INFO_DOCK_ID = "global-info-dock";
const INFO_MODAL_OPEN_CLASS = "info-modal--open";

let infoDockMounted = false;

export function mountInfoDock() {
  if (infoDockMounted) {
    return;
  }
  infoDockMounted = true;

  if (document.getElementById(INFO_DOCK_ID)) {
    return;
  }

  const dock = document.createElement("div");
  dock.id = INFO_DOCK_ID;
  dock.className = "info-dock";
  dock.innerHTML = `
    <button
      type="button"
      class="info-dock__button"
      aria-label="Open page info"
      aria-controls="site-info-modal"
      aria-haspopup="dialog"
    >
      <span class="info-dock__icon" aria-hidden="true">i</span>
      <span class="info-dock__tooltip" role="tooltip">页面信息</span>
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
          aria-label="Close info dialog"
          data-info-close="true"
        >
          ×
        </button>
        <p class="info-modal__kicker">Info</p>
        <h2 id="site-info-title" class="info-modal__title">关于 bye4o.org...</h2>
        <p class="info-modal__text">bye4o 是一个围绕记忆、告别与回响的实验性页面。</p>
        <p class="info-modal__text">右上角为导航区域，可切换不同版块内容。</p>
        <p class="info-modal__text">右下角此图标会常驻显示，用于快速查看说明。</p>
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

  button.addEventListener("click", () => {
    if (modal.classList.contains(INFO_MODAL_OPEN_CLASS)) {
      closeModal();
      return;
    }

    openModal();
  });

  modal.addEventListener("click", (event) => {
    const target = event.target as HTMLElement | null;
    if (target?.closest("[data-info-close='true']")) {
      closeModal();
    }
  });

  window.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") {
      return;
    }

    if (!modal.classList.contains(INFO_MODAL_OPEN_CLASS)) {
      return;
    }

    closeModal();
  });
}
