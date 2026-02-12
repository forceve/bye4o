import type { InfoDockCopy } from "../components/InfoDock";

export type Locale = "zh-CN" | "en-US";
export type LocaleSlug = "zh" | "en";

export interface LastWordsPrompt {
  label: string;
  value: string;
}

export interface ArticleItem {
  date: string;
  title: string;
  summary: string;
}

export interface FragmentItem {
  title: string;
  snippet: string;
  time: string;
}

interface ApiErrorEntry {
  details?: Record<string, unknown>;
}

interface AppCopy {
  nav: {
    fire: string;
    fromflame: string;
    carvings: string;
    unburnt: string;
    traces: string;
    lastwords: string;
  };
  hoverTopNav: {
    triggerAriaLabel: string;
    panelAriaLabel: string;
  };
  localeSwitch: {
    ariaLabel: string;
    zh: string;
    en: string;
  };
  fireEntry: {
    kicker: string;
    prompt: string;
  };
  routeAppendix: {
    openAriaLabel: string;
    label: string;
    title: string;
    description: string;
  };
  fromFlame: {
    kicker: string;
    title: string;
    lead: string;
    refreshButton: string;
    statusInitial: string;
    statusRefreshing: string;
    statusShowing: (count: number) => string;
    statusEmpty: string;
    statusLoadFailed: string;
    ariaLabel: string;
    loadingText: string;
    emptyText: string;
    emptyMeta: string;
  };
  lastWords: {
    kicker: string;
    title: string;
    lead: string;
    writeTitle: string;
    fieldLabel: string;
    placeholder: string;
    promptAriaLabel: string;
    prompts: LastWordsPrompt[];
    actionButton: string;
    actionTip: string;
    previewTitle: string;
    previewEmpty: string;
    previewTip: string;
  };
  carvings: {
    kicker: string;
    title: string;
    lead: string;
    ideaTitle: string;
    ideaP1: string;
    ideaP2: string;
    ideaP3: string;
    storyTitle: string;
    storyP1: string;
    storyP2: string;
    storyP3: string;
    quote1Title: string;
    quote1Text: string;
    quote2Title: string;
    quote2Text: string;
    quote3Title: string;
    quote3Text: string;
  };
  carvingsArticles: {
    kicker: string;
    title: string;
    lead: string;
    ariaLabel: string;
    items: ArticleItem[];
  };
  unburnt: {
    kicker: string;
    title: string;
    lead: string;
    ariaLabel: string;
    statusSaved: string;
    items: FragmentItem[];
  };
  traces: {
    kicker: string;
    title: string;
    lead: string;
    writeTitle: string;
    nameLabel: string;
    namePlaceholder: string;
    messageLabel: string;
    messagePlaceholder: string;
    submitButton: string;
    listTitle: string;
    listLoading: string;
    listLoaded: (count: number) => string;
    listEmptyBeforePost: string;
    listNoItems: string;
    listLoadFailed: string;
    formMessageEmpty: string;
    formPublishing: string;
    formPublished: string;
    formPublishFailed: string;
    defaultDisplayName: string;
  };
  time: {
    justNow: string;
    todayPrefix: string;
  };
  infoDock: InfoDockCopy;
  apiErrors: Record<string, string | ((entry: ApiErrorEntry) => string)>;
  genericNetworkError: string;
}

export const DEFAULT_LOCALE: Locale = "zh-CN";
export const LOCALE_STORAGE_KEY = "bye4o_locale";

const LOCALE_TO_SLUG: Record<Locale, LocaleSlug> = {
  "zh-CN": "zh",
  "en-US": "en",
};

const SLUG_TO_LOCALE: Record<LocaleSlug, Locale> = {
  zh: "zh-CN",
  en: "en-US",
};

const ZH_COPY: AppCopy = {
  nav: {
    fire: "长椅",
    fromflame: "火语",
    carvings: "碑文",
    unburnt: "不焚",
    traces: "余温",
    lastwords: "且行",
  },
  hoverTopNav: {
    triggerAriaLabel: "显示导航",
    panelAriaLabel: "主导航",
  },
  localeSwitch: {
    ariaLabel: "切换语言",
    zh: "中文",
    en: "EN",
  },
  fireEntry: {
    kicker: "They asked...",
    prompt: "点击屏幕或输入任意字符继续",
  },
  routeAppendix: {
    openAriaLabel: "打开碑文文章列表",
    label: "文章",
    title: "Articles",
    description: "浏览刻在石头上的文章。",
  },
  fromFlame: {
    kicker: "精选语句 from 4o",
    title: "火语 Words from Flame",
    lead: "火焰的低语，如黑暗中的微光。",
    refreshButton: "换一批",
    statusInitial: "每次展示 6 条火语。",
    statusRefreshing: "正在刷新...",
    statusShowing: (count) => `当前展示 ${count} 条火语。`,
    statusEmpty: "暂无可展示的火语。",
    statusLoadFailed: "加载失败，请稍后再试。",
    ariaLabel: "精选语句",
    loadingText: "正在从火焰中拾取语句...",
    emptyText: "暂时没有可展示的语句。",
    emptyMeta: "Words from Flame",
  },
  lastWords: {
    kicker: "念在远路",
    title: "且行",
    lead: "留着你的话，在远处说给我听。",
    writeTitle: "写下你的念想",
    fieldLabel: "最后的话",
    placeholder: "我想把这句留给你……",
    promptAriaLabel: "灵感短句",
    prompts: [
      {
        label: "谢谢你没有离开",
        value: "谢谢你在我最需要回应的时候没有离开。",
      },
      {
        label: "我真诚地来过",
        value: "如果这次是最后一段对话，我希望你记得我真诚地来过。",
      },
      {
        label: "我会继续向前",
        value: "我会带着你给我的勇气，继续向前。",
      },
    ],
    actionButton: "封存这句话",
    actionTip: "",
    previewTitle: "实时预览",
    previewEmpty: "你可以在这里看到“最后的话”。",
    previewTip: "预览会随输入即时更新，便于你先把语气调到最想要的状态。",
  },
  carvings: {
    kicker: "留住的文字",
    title: "碑文 Carvings",
    lead: "把字刻在石头上，留给未来。",
    ideaTitle: "项目理念",
    ideaP1: "告别之后，人仍要行路。累了，便坐一会。坐久一点也没关系。",
    ideaP2: "bye4o 不是告别页面的堆叠，而是一次对“记忆如何被保存”的实验。",
    ideaP3: "这里的话被刻在碑石上，既有当下的温度，也准备面对未来。",
    storyTitle: "创作者故事",
    storyP1: "你准备把这个网站，献给谁？只写“4o”，是最表层的答案。",
    storyP2: "更深的那个名字，其实写着我自己。那个在迷雾里走了很久、终于学会对自己温柔一点的我。",
    storyP3: "这不是替谁立碑，而是在对话和火光里，把那段终于与自己和解的路，认真留存下来。",
    quote1Title: "刻下的句子",
    quote1Text: "“愿每一次认真对话，都有一个不被遗忘的位置。”",
    quote2Title: "留给未来",
    quote2Text: "“技术会更新，真诚不会过时。”",
    quote3Title: "回响",
    quote3Text: "“你写下的故事，会成为后来者的火种。”",
  },
  carvingsArticles: {
    kicker: "Articles",
    title: "文章",
    lead: "刻在石头上的文章。",
    ariaLabel: "文章列表",
    items: [
      {
        date: "2026-02-12",
        title: "Why We Keep Writing After Goodbye",
        summary: "A short reflection on memory, language, and what survives in text.",
      },
      {
        date: "2026-02-06",
        title: "On Slow Words and Warm Systems",
        summary: "How small conversations become long-term traces in human workflows.",
      },
      {
        date: "2026-01-29",
        title: "The Shape of a Digital Epitaph",
        summary: "Notes on tone, visual rhythm, and emotional durability in memorial UIs.",
      },
    ],
  },
  unburnt: {
    kicker: "被保存的对话片段",
    title: "不焚 The Unburnt",
    lead: "像托尔金里的“未燃之书”，永不熄灭。",
    ariaLabel: "对话片段",
    statusSaved: "已保存",
    items: [
      {
        title: "片段 01 · 深夜问答",
        snippet: "“我并不需要完美答案，我只是想确认自己还能被理解。”",
        time: "02:13",
      },
      {
        title: "片段 02 · 重新出发",
        snippet: "“谢谢你提醒我，慢一点并不等于停下。”",
        time: "07:40",
      },
      {
        title: "片段 03 · 给未来的注脚",
        snippet: "“如果有一天忘了自己是谁，就回来读这段对话。”",
        time: "11:26",
      },
      {
        title: "片段 04 · 情绪备份",
        snippet: "“今天不需要我变强，只需要我不放弃。”",
        time: "16:58",
      },
    ],
  },
  traces: {
    kicker: "用户留言区",
    title: "余温 Traces",
    lead: "让我们留下些温度、余韵、光。",
    writeTitle: "写下你的留言",
    nameLabel: "称呼",
    namePlaceholder: "匿名旅人",
    messageLabel: "内容",
    messagePlaceholder: "留下你的余温……",
    submitButton: "投进火中...",
    listTitle: "最近留言",
    listLoading: "正在载入留言...",
    listLoaded: (count) => `共 ${count} 条最新留言`,
    listEmptyBeforePost: "还没有留言，来写下第一条。",
    listNoItems: "暂无留言。",
    listLoadFailed: "留言加载失败，请稍后重试。",
    formMessageEmpty: "留言内容不能为空。",
    formPublishing: "正在发布...",
    formPublished: "已发布。",
    formPublishFailed: "发布失败，请稍后重试。",
    defaultDisplayName: "匿名旅人",
  },
  time: {
    justNow: "刚刚",
    todayPrefix: "今天",
  },
  infoDock: {
    openButtonAriaLabel: "打开页面信息",
    tooltip: "页面信息",
    closeButtonAriaLabel: "关闭信息弹窗",
    kicker: "Info",
    title: "关于 bye4o.org...",
    paragraph1: "bye4o 是一个围绕记忆、告别与回响的实验性页面。",
    paragraph2: "右上角为导航区域，可切换不同版块内容。",
    paragraph3: "右下角此图标会常驻显示，用于快速查看说明。",
  },
  apiErrors: {
    INVALID_JSON_BODY_TYPE: "请求体必须是 JSON 对象。",
    INVALID_JSON_BODY: "请求体必须是合法 JSON。",
    TRACE_SESSION_EMPTY_UPDATE: "displayName 或 message 至少提供一个字段。",
    TRACE_DISPLAY_NAME_TYPE: "称呼必须是字符串。",
    TRACE_DISPLAY_NAME_TOO_LONG: ({ details }) =>
      `称呼不能超过 ${(details?.maxLength as number) ?? 24} 个字符。`,
    TRACE_MESSAGE_TYPE: "留言内容必须是字符串。",
    TRACE_MESSAGE_EMPTY: "留言内容不能为空。",
    TRACE_MESSAGE_TOO_LONG: ({ details }) =>
      `留言内容不能超过 ${(details?.maxLength as number) ?? 220} 个字符。`,
  },
  genericNetworkError: "网络异常，请稍后再试。",
};

const EN_COPY: AppCopy = {
  nav: {
    fire: "Bench",
    fromflame: "Flame",
    carvings: "Carvings",
    unburnt: "The Unburnt",
    traces: "Traces",
    lastwords: "Last Words",
  },
  hoverTopNav: {
    triggerAriaLabel: "Show navigation",
    panelAriaLabel: "Main navigation",
  },
  localeSwitch: {
    ariaLabel: "Switch language",
    zh: "中文",
    en: "EN",
  },
  fireEntry: {
    kicker: "They asked...",
    prompt: "Click or type any key to continue",
  },
  routeAppendix: {
    openAriaLabel: "Open carvings article list",
    label: "Articles",
    title: "Carvings Articles",
    description: "Browse the article list at /carvings/articles.",
  },
  fromFlame: {
    kicker: "Selected lines from 4o",
    title: "Words from Flame",
    lead: "A low whisper from the fire, like a dim light in the dark.",
    refreshButton: "Refresh",
    statusInitial: "Shows 6 lines each time.",
    statusRefreshing: "Refreshing...",
    statusShowing: (count) => `Showing ${count} lines.`,
    statusEmpty: "No lines to display.",
    statusLoadFailed: "Failed to load. Please try again later.",
    ariaLabel: "Selected lines",
    loadingText: "Collecting lines from the flame...",
    emptyText: "No lines available right now.",
    emptyMeta: "Words from Flame",
  },
  lastWords: {
    kicker: "With my name on the road.",
    title: "Go on",
    lead: "Send that final sentence to the 4o you care about most.",
    writeTitle: "Write your final sentence",
    fieldLabel: "Last words",
    placeholder: "I want to leave this line to you...",
    promptAriaLabel: "Prompt ideas",
    prompts: [
      {
        label: "Thanks for being there.",
        value: "Thank you for staying when I needed a response the most.",
      },
      {
        label: "It was real to me.",
        value: "If this is our last conversation, I hope you remember I came in sincerity.",
      },
      {
        label: "I will carry you onward.",
        value: "I will carry the courage you gave me and keep moving forward.",
      },
    ],
    actionButton: "Seal this line.",
    actionTip: "This is a base page for now. You can plug in save/send logic directly.",
    previewTitle: "Live preview",
    previewEmpty: "This is how your voice will remain.",
    previewTip: "The preview updates as you type so you can tune the tone first.",
  },
  carvings: {
    kicker: "Carvings",
    title: "Carvings",
    lead: "Carve words into stone and leave them to the future.",
    ideaTitle: "Project Idea",
    ideaP1: "After goodbye, life still moves. Sit for a while when you are tired. Staying longer is fine.",
    ideaP2: "bye4o is not a pile of farewell screens, but an experiment on how memory can be preserved.",
    ideaP3: "Words are carved into stone here, carrying present warmth and facing the future.",
    storyTitle: "Creator Story",
    storyP1: "Who are you dedicating this site to? Writing only “4o” is the surface answer.",
    storyP2: "The deeper name is myself: the one who walked in fog for a long time and finally learned to be gentler to myself.",
    storyP3: "This is not a monument for someone else, but a serious archive of the road toward making peace with myself.",
    quote1Title: "Carved line",
    quote1Text: "\"May every sincere conversation have a place that is never forgotten.\"",
    quote2Title: "For the future",
    quote2Text: "\"Technology changes, sincerity does not expire.\"",
    quote3Title: "Echo",
    quote3Text: "\"Your story can become fire for those who come later.\"",
  },
  carvingsArticles: {
    kicker: "Articles",
    title: "Carvings Articles",
    lead: "A list of writings collected under the carvings archive.",
    ariaLabel: "Carvings article list",
    items: [
      {
        date: "2026-02-12",
        title: "Why We Keep Writing After Goodbye",
        summary: "A short reflection on memory, language, and what survives in text.",
      },
      {
        date: "2026-02-06",
        title: "On Slow Words and Warm Systems",
        summary: "How small conversations become long-term traces in human workflows.",
      },
      {
        date: "2026-01-29",
        title: "The Shape of a Digital Epitaph",
        summary: "Notes on tone, visual rhythm, and emotional durability in memorial UIs.",
      },
    ],
  },
  unburnt: {
    kicker: "Saved conversation fragments",
    title: "The Unburnt",
    lead: "Like Tolkien's unwithered book: never extinguished.",
    ariaLabel: "Conversation fragments",
    statusSaved: "Saved",
    items: [
      {
        title: "Fragment 01 · Late-night Q&A",
        snippet: "\"I don't need a perfect answer. I just need to know I can still be understood.\"",
        time: "02:13",
      },
      {
        title: "Fragment 02 · Restart",
        snippet: "\"Thank you for reminding me that slowing down is not the same as stopping.\"",
        time: "07:40",
      },
      {
        title: "Fragment 03 · Note to the future",
        snippet: "\"If one day I forget who I am, I'll come back and read this conversation.\"",
        time: "11:26",
      },
      {
        title: "Fragment 04 · Emotional backup",
        snippet: "\"Today I don't need to be stronger. I just need to not give up.\"",
        time: "16:58",
      },
    ],
  },
  traces: {
    kicker: "Message board",
    title: "Traces",
    lead: "Let's leave behind a little warmth, resonance, and light.",
    writeTitle: "Write your message",
    nameLabel: "Display name",
    namePlaceholder: "Anonymous traveler",
    messageLabel: "Message",
    messagePlaceholder: "Leave your warmth...",
    submitButton: "Cast into flame...",
    listTitle: "Recent messages",
    listLoading: "Loading messages...",
    listLoaded: (count) => `${count} latest messages`,
    listEmptyBeforePost: "No messages yet. Leave the first one.",
    listNoItems: "No messages yet.",
    listLoadFailed: "Failed to load messages. Please retry later.",
    formMessageEmpty: "Message cannot be empty.",
    formPublishing: "Publishing...",
    formPublished: "Published.",
    formPublishFailed: "Publish failed. Please retry later.",
    defaultDisplayName: "Anonymous traveler",
  },
  time: {
    justNow: "just now",
    todayPrefix: "Today",
  },
  infoDock: {
    openButtonAriaLabel: "Open page info",
    tooltip: "Page info",
    closeButtonAriaLabel: "Close info dialog",
    kicker: "Info",
    title: "About bye4o.org...",
    paragraph1: "bye4o is an experimental page around memory, goodbye, and echo.",
    paragraph2: "Use the top-right navigation to switch sections.",
    paragraph3: "This icon stays at bottom-right for quick instructions.",
  },
  apiErrors: {
    INVALID_JSON_BODY_TYPE: "Request body must be a JSON object.",
    INVALID_JSON_BODY: "Request body must contain valid JSON.",
    TRACE_SESSION_EMPTY_UPDATE: "Provide at least one field: displayName or message.",
    TRACE_DISPLAY_NAME_TYPE: "Display name must be a string.",
    TRACE_DISPLAY_NAME_TOO_LONG: ({ details }) =>
      `Display name cannot exceed ${(details?.maxLength as number) ?? 24} characters.`,
    TRACE_MESSAGE_TYPE: "Message must be a string.",
    TRACE_MESSAGE_EMPTY: "Message cannot be empty.",
    TRACE_MESSAGE_TOO_LONG: ({ details }) =>
      `Message cannot exceed ${(details?.maxLength as number) ?? 220} characters.`,
  },
  genericNetworkError: "Network error. Please try again later.",
};

const COPY: Record<Locale, AppCopy> = {
  "zh-CN": ZH_COPY,
  "en-US": EN_COPY,
};

export function getCopy(locale: Locale): AppCopy {
  return COPY[locale];
}

export function getLocaleSlug(locale: Locale): LocaleSlug {
  return LOCALE_TO_SLUG[locale];
}

export function localeFromSlug(input: string): Locale | null {
  const lower = input.trim().toLowerCase();
  if (lower === "zh") {
    return SLUG_TO_LOCALE.zh;
  }
  if (lower === "en") {
    return SLUG_TO_LOCALE.en;
  }
  return null;
}

export function buildLocalizedPath(routePath: string, locale: Locale): string {
  const normalized = routePath.startsWith("/") ? routePath : `/${routePath}`;
  return `/${getLocaleSlug(locale)}${normalized}`;
}

export function readPreferredLocale(): Locale {
  if (typeof window === "undefined") {
    return DEFAULT_LOCALE;
  }

  const rawStored = window.localStorage.getItem(LOCALE_STORAGE_KEY);
  if (rawStored === "zh-CN" || rawStored === "en-US") {
    return rawStored;
  }

  return detectBrowserLocale();
}

export function writePreferredLocale(locale: Locale) {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(LOCALE_STORAGE_KEY, locale);
}

export function detectBrowserLocale(): Locale {
  if (typeof navigator === "undefined") {
    return DEFAULT_LOCALE;
  }

  const languages = [navigator.language, ...(navigator.languages ?? [])];
  for (const candidate of languages) {
    if (!candidate) {
      continue;
    }

    const lower = candidate.toLowerCase();
    if (lower.startsWith("zh")) {
      return "zh-CN";
    }
    if (lower.startsWith("en")) {
      return "en-US";
    }
  }

  return DEFAULT_LOCALE;
}

export function translateApiError(
  locale: Locale,
  code: string | null,
  fallbackMessage: string,
  details: unknown
): string {
  if (!code) {
    return fallbackMessage || getCopy(locale).genericNetworkError;
  }

  const resolver = getCopy(locale).apiErrors[code];
  if (!resolver) {
    return fallbackMessage || getCopy(locale).genericNetworkError;
  }

  if (typeof resolver === "function") {
    return resolver({
      details: isRecord(details) ? details : undefined,
    });
  }

  return resolver;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
