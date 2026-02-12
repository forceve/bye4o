export interface TopNavItem<TPath extends string = string> {
  label: string;
  path: TPath;
}

interface CreateHoverTopNavOptions<TPath extends string = string> {
  items: TopNavItem<TPath>[];
  activePath: TPath;
  onNavigate: (path: TPath) => void;
  triggerAriaLabel?: string;
  panelAriaLabel?: string;
}

export interface HoverTopNavController {
  show: () => void;
  hide: () => void;
  destroy: () => void;
}

export function createHoverTopNav<TPath extends string = string>({
  items,
  activePath,
  onNavigate,
  triggerAriaLabel = "Show navigation",
  panelAriaLabel = "Main navigation",
}: CreateHoverTopNavOptions<TPath>): HTMLElement & { controller: HoverTopNavController } {
  const shell = document.createElement("header");
  shell.className = "hover-top-nav";

  const trigger = document.createElement("button");
  trigger.type = "button";
  trigger.className = "hover-top-nav__trigger";
  trigger.setAttribute("aria-label", triggerAriaLabel);

  const panel = document.createElement("nav");
  panel.className = "hover-top-nav__panel";
  panel.setAttribute("aria-label", panelAriaLabel);

  const list = document.createElement("ul");
  list.className = "hover-top-nav__list";

  items.forEach((item) => {
    const listItem = document.createElement("li");
    listItem.className = "hover-top-nav__item";

    const button = document.createElement("button");
    button.type = "button";
    button.className = "hover-top-nav__button";
    button.textContent = item.label;
    button.dataset.path = item.path;

    if (item.path === activePath) {
      button.classList.add("is-active");
      button.setAttribute("aria-current", "page");
    }

    button.addEventListener("click", () => {
      onNavigate(item.path);
    });

    listItem.appendChild(button);
    list.appendChild(listItem);
  });

  panel.appendChild(list);
  shell.appendChild(trigger);
  shell.appendChild(panel);

  // 鎺у埗閫昏緫
  let hideTimeout: number | null = null;
  const AUTO_HIDE_DELAY = 3000; // 3绉?

  const show = () => {
    // 娓呴櫎涔嬪墠鐨勯殣钘忓畾鏃跺櫒
    if (hideTimeout !== null) {
      window.clearTimeout(hideTimeout);
      hideTimeout = null;
    }

    // 鏄剧ず navbar
    shell.classList.add("is-visible");

    // 璁剧疆3绉掑悗鑷姩闅愯棌
    hideTimeout = window.setTimeout(() => {
      hide();
    }, AUTO_HIDE_DELAY);
  };

  const hide = () => {
    if (hideTimeout !== null) {
      window.clearTimeout(hideTimeout);
      hideTimeout = null;
    }
    shell.classList.remove("is-visible");
  };

  // 榧犳爣鎮诞鏃舵樉绀?
  shell.addEventListener("mouseenter", () => {
    show();
  });

  // 榧犳爣绂诲紑鏃讹紝涓嶇珛鍗抽殣钘忥紝璁?绉掑畾鏃跺櫒鑷劧瑙﹀彂闅愯棌
  // 杩欐牱鎮诞鍙敜鍚庡嵆浣块紶鏍囩寮€锛屼篃浼氬仠鐣?绉?

  // 鐐瑰嚮椤甸潰绌虹櫧澶勬樉绀簄avbar
  const handleDocumentClick = (e: MouseEvent) => {
    const target = e.target as HTMLElement | null;
    if (!target) return;

    // 濡傛灉鐐瑰嚮鐨勬槸navbar鍐呯殑鍏冪礌锛屼繚鎸佹樉绀猴紙閲嶇疆瀹氭椂鍣級
    if (shell.contains(target)) {
      show();
      return;
    }

    // 妫€鏌ョ偣鍑荤殑鏄惁鏄寜閽紙涓嶅寘鎷琻avbar鍐呯殑鎸夐挳锛屽洜涓轰笂闈㈠凡缁忓鐞嗕簡锛?
    const interactiveTarget = target.closest(
      "button, a, input, textarea, select, label, summary, [role='button'], [role='link'], [data-nav-summon='ignore']"
    );

    if (interactiveTarget) {
      return;
    }

    show();
  };

  document.addEventListener("click", handleDocumentClick);

  const destroy = () => {
    if (hideTimeout !== null) {
      window.clearTimeout(hideTimeout);
      hideTimeout = null;
    }
    document.removeEventListener("click", handleDocumentClick);
  };

  const controller: HoverTopNavController = { show, hide, destroy };

  // 灏?controller 闄勫姞鍒?shell 鍏冪礌涓?
  (shell as HTMLElement & { controller: HoverTopNavController }).controller = controller;

  return shell as HTMLElement & { controller: HoverTopNavController };
}

