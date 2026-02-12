export interface TopNavItem<TPath extends string = string> {
  label: string;
  path: TPath;
}

interface CreateHoverTopNavOptions<TPath extends string = string> {
  items: TopNavItem<TPath>[];
  activePath: TPath;
  onNavigate: (path: TPath) => void;
}

export function createHoverTopNav<TPath extends string = string>({
  items,
  activePath,
  onNavigate,
}: CreateHoverTopNavOptions<TPath>): HTMLElement {
  const shell = document.createElement("header");
  shell.className = "hover-top-nav";

  const trigger = document.createElement("button");
  trigger.type = "button";
  trigger.className = "hover-top-nav__trigger";
  trigger.setAttribute("aria-label", "显示导航");

  const panel = document.createElement("nav");
  panel.className = "hover-top-nav__panel";
  panel.setAttribute("aria-label", "主导航");

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

  return shell;
}
