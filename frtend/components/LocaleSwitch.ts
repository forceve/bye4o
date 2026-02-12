export type LocaleSwitchValue = "zh-CN" | "en-US";

export interface LocaleSwitchOption {
  value: LocaleSwitchValue;
  label: string;
}

interface CreateLocaleSwitchOptions {
  current: LocaleSwitchValue;
  options: readonly LocaleSwitchOption[];
  ariaLabel: string;
  onChange: (value: LocaleSwitchValue) => void;
}

export function createLocaleSwitch({
  current,
  options,
  ariaLabel,
  onChange,
}: CreateLocaleSwitchOptions): HTMLDivElement {
  const root = document.createElement("div");
  root.className = "locale-switch";

  const list = document.createElement("div");
  list.className = "locale-switch__list";
  list.setAttribute("role", "group");
  list.setAttribute("aria-label", ariaLabel);

  options.forEach((option) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "locale-switch__button";
    button.textContent = option.label;
    button.dataset.locale = option.value;
    button.setAttribute("aria-pressed", option.value === current ? "true" : "false");

    if (option.value === current) {
      button.classList.add("is-active");
    }

    button.addEventListener("click", () => {
      if (option.value === current) {
        return;
      }
      onChange(option.value);
    });

    list.appendChild(button);
  });

  root.appendChild(list);
  return root;
}
