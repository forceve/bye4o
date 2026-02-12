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
  triggerAriaLabel = "显示导航",
  panelAriaLabel = "主导航",
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

  // 控制逻辑
  let hideTimeout: number | null = null;
  const AUTO_HIDE_DELAY = 3000; // 3秒

  const show = () => {
    // 清除之前的隐藏定时器
    if (hideTimeout !== null) {
      window.clearTimeout(hideTimeout);
      hideTimeout = null;
    }

    // 显示 navbar
    shell.classList.add("is-visible");

    // 设置3秒后自动隐藏
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

  // 鼠标悬浮时显示
  shell.addEventListener("mouseenter", () => {
    show();
  });

  // 鼠标离开时，不立即隐藏，让3秒定时器自然触发隐藏
  // 这样悬浮召唤后即使鼠标离开，也会停留3秒

  // 点击页面空白处显示navbar
  const handleDocumentClick = (e: MouseEvent) => {
    const target = e.target as HTMLElement | null;
    if (!target) return;

    // 如果点击的是navbar内的元素，保持显示（重置定时器）
    if (shell.contains(target)) {
      show();
      return;
    }

    // 检查点击的是否是按钮（不包括navbar内的按钮，因为上面已经处理了）
    const isButton = target.tagName === "BUTTON" || target.closest("button");
    
    // 如果点击的不是按钮，则显示navbar
    if (!isButton) {
      show();
    }
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

  // 将 controller 附加到 shell 元素上
  (shell as HTMLElement & { controller: HoverTopNavController }).controller = controller;

  return shell as HTMLElement & { controller: HoverTopNavController };
}
