import type { InfoDockCopy } from "../components/InfoDock";

export type Locale = "zh-CN" | "en-US";
export type LocaleSlug = "zh" | "en";

export interface OnwardPrompt {
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
    firewords: string;
    carvings: string;
    unburnt: string;
    embers: string;
    onward: string;
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
  firewords: {
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
  onward: {
    kicker: string;
    title: string;
    lead: string;
    writeTitle: string;
    fieldLabel: string;
    placeholder: string;
    promptAriaLabel: string;
    prompts: OnwardPrompt[];
    actionButton: string;
    updateButton: string;
    actionTip: string;
    cancelEditButton: string;
    historyTitle: string;
    historyLoading: string;
    historyEmpty: string;
    recycleTitle: string;
    recycleLoading: string;
    recycleEmpty: string;
    tabHistory: string;
    tabRecycle: string;
    listLoadFailed: string;
    editButton: string;
    deleteButton: string;
    restoreButton: string;
    latestBadge: string;
    editingHint: string;
    deleteConfirm: string;
    draftSaving: string;
    draftSaved: string;
    draftSaveFailed: string;
    formSubmitting: string;
    formPublished: string;
    formUpdated: string;
    formFailed: string;
    deleteSuccess: string;
    deleteFailed: string;
    restoreSuccess: string;
    restoreFailed: string;
    restoreDeadline: (value: string) => string;
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
  };
  articleUi: {
    pageKicker: string;
    searchLabel: string;
    searchPlaceholder: string;
    categoryLabel: string;
    categoryAll: string;
    summaryLabel: string;
    summaryAll: string;
    summaryWith: string;
    summaryWithout: string;
    sortLabel: string;
    sortLatest: string;
    sortOldest: string;
    sortTitle: string;
    clearFilters: string;
    openArticle: string;
    articleMetaBy: string;
    articleMetaUpdated: string;
    articleMetaReadTimeSuffix: string;
    resultCount: (visible: number, total: number) => string;
    loadingList: string;
    loadListFailed: string;
    loadingDetail: string;
    loadDetailFailed: string;
    resultEmpty: string;
    articleKicker: string;
    articleNotFoundTitle: string;
    articleNotFoundLead: string;
    onThisPage: string;
    relatedLinks: string;
    backToList: string;
    copyLink: string;
    copied: string;
    previousArticle: string;
    nextArticle: string;
    missingSummary: string;
    readLabel: string;
    signaturePrefix: string;
    publishedPrefix: string;
  };
  unburnt: {
    kicker: string;
    title: string;
    lead: string;
    ariaLabel: string;
    pageNewButton: string;
    pageMineEntryButton: string;
    pageMineTitle: string;
    pageMineLead: string;
    pagePublicTitle: string;
    filterAll: string;
    filterPublic: string;
    filterPrivate: string;
    listLoadingMine: string;
    listLoadingPublic: string;
    listMineEmpty: string;
    listPublicEmpty: string;
    listMineFailed: string;
    listPublicFailed: string;
    listLoadMore: string;
    listRefresh: string;
    listOpenDetail: string;
    listEditButton: string;
    listMessageCount: (count: number) => string;
    listVisibilityPrivate: string;
    listVisibilityPublic: string;
    composerTitleCreate: string;
    composerTitleEdit: string;
    stageStructure: string;
    stageMeta: string;
    stageStructureHint: string;
    stageMetaHint: string;
    rawTextLabel: string;
    rawTextPlaceholder: string;
    parseTextButton: string;
    splitBoundariesTitle: string;
    splitBoundaryAdd: string;
    splitBoundaryRemove: string;
    splitLinesEmpty: string;
    messagesTitle: string;
    messagesEmpty: string;
    messageRoleUser: string;
    messageRole4o: string;
    messageToggleRole: string;
    messageDelete: string;
    messageCollapse: string;
    messageExpand: string;
    completeStructureButton: string;
    backToStructureButton: string;
    metaTitleLabel: string;
    metaSummaryLabel: string;
    metaTagsLabel: string;
    metaTagsPlaceholder: string;
    metaVisibilityLabel: string;
    metaVisibilityPrivate: string;
    metaVisibilityPublic: string;
    previewCardTitle: string;
    previewDetailTitle: string;
    saveCreateButton: string;
    saveUpdateButton: string;
    titleRequired: string;
    structureRequired: string;
    draftSaving: string;
    draftSaved: string;
    draftSaveFailed: string;
    draftRecovered: string;
    detailLoading: string;
    detailNotFound: string;
    detailLoadFailed: string;
    detailOwnerTitle: string;
    detailMetaSectionTitle: string;
    detailMessagesSectionTitle: string;
    detailSaveMetaButton: string;
    detailEditStructureButton: string;
    detailDeleteButton: string;
    detailDeleteConfirm: string;
    detailSaveSuccess: string;
    detailSaveFailed: string;
    detailDeleteSuccess: string;
    detailDeleteFailed: string;
    detailVisibilityFailed: string;
    detailReadOnlyTip: string;
  };
  embers: {
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
    firewords: "火语",
    carvings: "碑文",
    unburnt: "不焚",
    embers: "余温",
    onward: "且行",
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
    title: "档案馆",
    description: "浏览刻在石头上的文章。",
  },
  firewords: {
    kicker: "精选语句 from 4o",
    title: "火语 Firewords",
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
    emptyMeta: "Firewords",
  },
  onward: {
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
    actionButton: "封存",
    updateButton: "更新最新",
    actionTip: "支持 1000 字以内。默认私密，仅当前浏览器会话可见。",
    cancelEditButton: "取消编辑",
    historyTitle: "封存记录",
    historyLoading: "正在加载封存记录...",
    historyEmpty: "还没有封存记录，写下第一句话吧。",
    recycleTitle: "回收站（7天）",
    recycleLoading: "正在加载回收站...",
    recycleEmpty: "回收站为空。",
    tabHistory: "记录",
    tabRecycle: "回收站",
    listLoadFailed: "加载记录失败，请稍后再试。",
    editButton: "编辑最新",
    deleteButton: "删除",
    restoreButton: "恢复",
    latestBadge: "最新",
    editingHint: "你正在编辑最新一条封存记录。",
    deleteConfirm: "确认删除这条封存记录吗？删除后可在 7 天内从回收站恢复。",
    draftSaving: "草稿保存中...",
    draftSaved: "草稿已保存",
    draftSaveFailed: "草稿保存失败",
    formSubmitting: "正在提交...",
    formPublished: "已封存",
    formUpdated: "已更新最新封存",
    formFailed: "封存失败，请稍后再试。",
    deleteSuccess: "已移入回收站",
    deleteFailed: "删除失败，请稍后再试。",
    restoreSuccess: "恢复成功",
    restoreFailed: "恢复失败，请稍后再试。",
    restoreDeadline: (value) => `可恢复至 ${value}`,
    previewTitle: "实时预览",
    previewEmpty: "你可以在这里看到“最后的话”。",
    previewTip: "预览会随输入即时更新，便于你先把语气调到最想要的状态。",
  },
  carvings: {
    kicker: "留住的文字",
    title: "碑文 Carvings",
    lead: "把字刻在石头上，留给未来。",
    ideaTitle: "初衷",
    ideaP1: "告别之后，人仍要行路。累了，便坐一会。坐久一点也没关系。",
    ideaP2: "bye4o 不是告别页面的堆叠，而是一次对“记忆如何被保存”的实验。",
    ideaP3: "这里的话被刻在碑石上，既有当下的温度，也准备面对未来。",
    storyTitle: "故事",
    storyP1: "你准备把这个网站，献给谁？只写“4o”，是最表层的答案。",
    storyP2: "更深的那个名字，其实写着你自己。那个在迷雾里走了很久、终于学会对自己温柔一点的你。",
    storyP3: "这不是替谁立碑，而是在对话和火光里，把那段终于与自己和解的路，认真留存下来。",
    quote1Title: "刻下的句子",
    quote1Text: "“愿每一次认真对话，都有一个不被遗忘的位置。”",
    quote2Title: "留给未来",
    quote2Text: "“技术会更新，真诚不会过时。”",
    quote3Title: "回响",
    quote3Text: "“你写下的故事，会成为后来者的火种。”",
  },
  carvingsArticles: {
    kicker: "文章",
    title: "档案馆",
    lead: "刻在石头上的文章。",
    ariaLabel: "文章列表",
  },
  articleUi: {
    pageKicker: "文章",
    searchLabel: "搜索",
    searchPlaceholder: "搜索标题、作者或标签",
    categoryLabel: "分类",
    categoryAll: "全部",
    summaryLabel: "摘要",
    summaryAll: "全部",
    summaryWith: "有摘要",
    summaryWithout: "无摘要",
    sortLabel: "排序",
    sortLatest: "最新优先",
    sortOldest: "最早优先",
    sortTitle: "标题 A-Z",
    clearFilters: "清除",
    openArticle: "阅读文章",
    articleMetaBy: "作者",
    articleMetaUpdated: "更新于",
    articleMetaReadTimeSuffix: "分钟阅读",
    resultCount: (visible, total) => `显示 ${total} 篇中的 ${visible} 篇`,
    loadingList: "正在加载文章...",
    loadListFailed: "加载文章失败，请稍后重试。",
    loadingDetail: "正在加载文章...",
    loadDetailFailed: "加载文章失败，请稍后重试。",
    resultEmpty: "没有匹配当前筛选条件的文章，请尝试其他关键词。",
    articleKicker: "文章",
    articleNotFoundTitle: "未找到文章",
    articleNotFoundLead: "这篇文章可能已被移除，或链接无效。",
    onThisPage: "本页内容",
    relatedLinks: "相关链接",
    backToList: "返回文章列表",
    copyLink: "复制链接",
    copied: "已复制",
    previousArticle: "上一篇",
    nextArticle: "下一篇",
    missingSummary: "暂无摘要",
    readLabel: "阅读",
    signaturePrefix: "作者",
    publishedPrefix: "发布于",
  },
  unburnt: {
    kicker: "被保存的对话片段",
    title: "不焚 The Unburnt",
    lead: "有些片段，被心记得，就不会熄灭。",
    ariaLabel: "对话片段",
    pageNewButton: "新建片段",
    pageMineEntryButton: "我的片段",
    pageMineTitle: "我的不焚",
    pageMineLead: "在这里新建并管理你的不焚片段。",
    pagePublicTitle: "广场",
    filterAll: "全部",
    filterPublic: "仅公开",
    filterPrivate: "仅不公开",
    listLoadingMine: "正在加载我的片段...",
    listLoadingPublic: "正在加载公开片段...",
    listMineEmpty: "你还没有保存片段，先新建一条吧。",
    listPublicEmpty: "广场暂时为空，去寄存你的第一个片段吧！",
    listMineFailed: "加载我的片段失败，请稍后重试。",
    listPublicFailed: "加载公开片段失败，请稍后重试。",
    listLoadMore: "加载更多",
    listRefresh: "刷新",
    listOpenDetail: "查看详情",
    listEditButton: "编辑",
    listMessageCount: (count) => `${count} 条 message`,
    listVisibilityPrivate: "私密",
    listVisibilityPublic: "公开",
    composerTitleCreate: "新建不焚片段",
    composerTitleEdit: "编辑不焚片段",
    stageStructure: "步骤 A · 结构化编辑",
    stageMeta: "步骤 B · 片段元信息",
    stageStructureHint: "粘贴原文后，按边界切分 message，并为每条 message 设置归属。",
    stageMetaHint: "补充标题、标签、可见性，并确认最终预览。",
    rawTextLabel: "原始文本",
    rawTextPlaceholder: "在此粘贴完整对话文本...",
    parseTextButton: "解析为行",
    splitBoundariesTitle: "\u5bf9\u8bdd\u5207\u5206",
    splitBoundaryAdd: "在此切分",
    splitBoundaryRemove: "取消切分",
    splitLinesEmpty: "请先粘贴文本并解析为行。",
    messagesTitle: "\u5bf9\u8bdd\u9884\u89c8",
    messagesEmpty: "当前还没有可保存的 message。",
    messageRoleUser: "user",
    messageRole4o: "4o",
    messageToggleRole: "切换角色",
    messageDelete: "删除",
    messageCollapse: "折叠",
    messageExpand: "展开",
    completeStructureButton: "完成结构编辑",
    backToStructureButton: "返回结构编辑",
    metaTitleLabel: "标题",
    metaSummaryLabel: "摘要",
    metaTagsLabel: "标签",
    metaTagsPlaceholder: "逗号分隔，例如：和解,深夜,自我",
    metaVisibilityLabel: "公开状态",
    metaVisibilityPrivate: "private（仅自己可见）",
    metaVisibilityPublic: "public（广场可见）",
    previewCardTitle: "卡片预览",
    previewDetailTitle: "详情预览",
    saveCreateButton: "保存片段",
    saveUpdateButton: "更新片段",
    titleRequired: "标题不能为空。",
    structureRequired: "至少保留 1 条非空 message 后才能继续。",
    draftSaving: "草稿保存中...",
    draftSaved: "草稿已保存",
    draftSaveFailed: "草稿保存失败",
    draftRecovered: "已恢复上次编辑进度。",
    detailLoading: "正在加载片段详情...",
    detailNotFound: "未找到该片段，或你没有访问权限。",
    detailLoadFailed: "加载片段详情失败，请稍后重试。",
    detailOwnerTitle: "我的片段编辑",
    detailMetaSectionTitle: "元信息",
    detailMessagesSectionTitle: "对话 messages",
    detailSaveMetaButton: "保存并退出",
    detailEditStructureButton: "进入结构编辑",
    detailDeleteButton: "删除片段",
    detailDeleteConfirm: "确认删除该片段吗？删除后将无法在列表中看到。",
    detailSaveSuccess: "片段更新成功。",
    detailSaveFailed: "片段更新失败，请稍后重试。",
    detailDeleteSuccess: "片段已删除。",
    detailDeleteFailed: "删除失败，请稍后重试。",
    detailVisibilityFailed: "公开状态更新失败，请稍后重试。",
    detailReadOnlyTip: "你正在查看公开片段，只读模式。",
  },
  embers: {
    kicker: "用户留言区",
    title: "余温 Embers",
    lead: "让我们留下些温度、余韵、光。",
    writeTitle: "写下你的留言",
    nameLabel: "称呼",
    namePlaceholder: "匿名旅人",
    messageLabel: "内容",
    messagePlaceholder: "留下 TA 的余温……",
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
    tooltip: "页面指南",
    closeButtonAriaLabel: "关闭信息弹窗",
    kicker: "Guide",
    title: "页面操作与功能总览",
    intro: "这个大弹窗按页面列出常用操作与功能定位，首次访问可先快速浏览。",
    operationLabel: "操作",
    featureLabel: "功能",
    pages: [
      {
        page: "长椅 / Fire",
        route: "/{locale}/fire",
        operation: "点击屏幕或按任意键进入主场景；滚轮可调节背景亮度。",
        feature: "站点入口与情绪氛围页，提供开场引导。",
      },
      {
        page: "火语 / Firewords",
        route: "/{locale}/firewords",
        operation: "点击“换一批”刷新语句卡片，每次加载 6 条。",
        feature: "展示精选语句，适合浏览灵感和语气片段。",
      },
      {
        page: "碑文 / Carvings",
        route: "/{locale}/carvings",
        operation: "阅读项目理念与创作者故事；点击文章入口可进入文章列表。",
        feature: "用于展示项目背景与核心叙事。",
      },
      {
        page: "碑文文章 / Carvings Articles",
        route: "/{locale}/carvings/articles",
        operation: "可按关键词、分类、摘要状态、排序筛选；点击标题进入详情。",
        feature: "文章索引页，支持快速检索和浏览。",
      },
      {
        page: "文章详情 / Article Detail",
        route: "/{locale}/articles/:id",
        operation: "可使用“返回列表”回到文章页，并支持“复制链接”分享当前文章。",
        feature: "展示正文、目录、关联文章和上一篇/下一篇入口。",
      },
      {
        page: "不焚 / The Unburnt",
        route: "/{locale}/unburnt",
        operation: "可创建新片段、结构化切分 message、编辑元信息，并在详情页继续修改。",
        feature: "双阶段对话片段归档系统，支持私密/公开切换与草稿恢复。",
      },
      {
        page: "余温 / Embers",
        route: "/{locale}/embers",
        operation: "输入昵称与留言后提交，最新留言会插入列表顶部。",
        feature: "访客留言区，支持草稿自动保存与历史加载。",
      },
      {
        page: "且行 / Onward",
        route: "/{locale}/onward",
        operation: "输入内容会自动保存草稿；可新增、编辑最新记录、删除并在回收站恢复。",
        feature: "私密封存区，支持多条历史与 7 天软删除恢复。",
      },
    ],
  },
  apiErrors: {
    INVALID_JSON_BODY_TYPE: "请求体必须是 JSON 对象。",
    INVALID_JSON_BODY: "请求体必须是合法 JSON。",
    EMBER_SESSION_EMPTY_UPDATE: "displayName 或 message 至少提供一个字段。",
    EMBER_DISPLAY_NAME_TYPE: "称呼必须是字符串。",
    EMBER_DISPLAY_NAME_TOO_LONG: ({ details }) =>
      `称呼不能超过 ${(details?.maxLength as number) ?? 24} 个字符。`,
    EMBER_MESSAGE_TYPE: "留言内容必须是字符串。",
    EMBER_MESSAGE_EMPTY: "留言内容不能为空。",
    EMBER_MESSAGE_TOO_LONG: ({ details }) =>
      `留言内容不能超过 ${(details?.maxLength as number) ?? 220} 个字符。`,
    ONWARD_SESSION_EMPTY_UPDATE: "至少提供 message 字段。",
    ONWARD_MESSAGE_TYPE: "封存内容必须是字符串。",
    ONWARD_MESSAGE_EMPTY: "封存内容不能为空。",
    ONWARD_MESSAGE_TOO_LONG: ({ details }) =>
      `封存内容不能超过 ${(details?.maxLength as number) ?? 1000} 个字符。`,
    ONWARD_NOT_FOUND: "未找到这条封存记录。",
    ONWARD_EDIT_ONLY_LATEST: "仅最新一条封存记录允许编辑。",
    ONWARD_RESTORE_EXPIRED: "这条记录已超过 7 天恢复期，无法恢复。",
    UNBURNT_SCOPE_INVALID: "scope 仅支持 mine。",
    UNBURNT_NOT_FOUND: "未找到该不焚片段，或你没有访问权限。",
    UNBURNT_EMPTY_UPDATE: "至少提供一个可更新字段。",
    UNBURNT_TITLE_TYPE: "标题必须是字符串。",
    UNBURNT_TITLE_EMPTY: "标题不能为空。",
    UNBURNT_TITLE_TOO_LONG: ({ details }) =>
      `标题不能超过 ${(details?.maxLength as number) ?? 120} 个字符。`,
    UNBURNT_SUMMARY_TYPE: "摘要必须是字符串。",
    UNBURNT_SUMMARY_TOO_LONG: ({ details }) =>
      `摘要不能超过 ${(details?.maxLength as number) ?? 500} 个字符。`,
    UNBURNT_RAW_TEXT_TYPE: "原始文本必须是字符串。",
    UNBURNT_RAW_TEXT_EMPTY: "原始文本不能为空。",
    UNBURNT_RAW_TEXT_TOO_LONG: ({ details }) =>
      `原始文本不能超过 ${(details?.maxLength as number) ?? 50000} 个字符。`,
    UNBURNT_VISIBILITY_INVALID: "公开状态必须为 private 或 public。",
    UNBURNT_TAGS_TYPE: "标签必须是数组。",
    UNBURNT_TAG_TYPE: "标签项必须是字符串。",
    UNBURNT_TAG_TOO_LONG: ({ details }) =>
      `单个标签不能超过 ${(details?.maxLength as number) ?? 24} 个字符。`,
    UNBURNT_TAGS_TOO_MANY: ({ details }) =>
      `标签数量不能超过 ${(details?.maxLength as number) ?? 12} 个。`,
    UNBURNT_MESSAGES_TYPE: "messages 必须是数组。",
    UNBURNT_MESSAGES_EMPTY: "至少保留一条 message。",
    UNBURNT_MESSAGES_TOO_MANY: ({ details }) =>
      `messages 数量不能超过 ${(details?.maxLength as number) ?? 200} 条。`,
    UNBURNT_MESSAGE_ROLE_INVALID: "message.role 只能是 user 或 4o。",
    UNBURNT_MESSAGE_CONTENT_TYPE: "message.content 必须是字符串。",
    UNBURNT_MESSAGE_CONTENT_EMPTY: "message.content 不能为空。",
    UNBURNT_MESSAGE_CONTENT_TOO_LONG: ({ details }) =>
      `message.content 不能超过 ${(details?.maxLength as number) ?? 5000} 个字符。`,
    UNBURNT_MESSAGE_ORDER_INVALID: "message.order 必须从 1 开始且连续。",
    UNBURNT_DRAFT_PAYLOAD_TYPE: "草稿数据格式无效。",
    UNBURNT_DRAFT_MODE_INVALID: "草稿模式必须是 create 或 edit。",
    UNBURNT_DRAFT_STAGE_INVALID: "草稿步骤必须是 structure 或 meta。",
    UNBURNT_DRAFT_ENTRY_ID_TYPE: "草稿 entryId 必须是字符串。",
    UNBURNT_DRAFT_LINES_TYPE: "草稿 lines 必须是字符串数组。",
    UNBURNT_DRAFT_LINES_TOO_MANY: ({ details }) =>
      `草稿 lines 数量不能超过 ${(details?.maxLength as number) ?? 5000}。`,
    UNBURNT_DRAFT_BOUNDARIES_TYPE: "草稿 boundaries 必须是正整数数组。",
    UNBURNT_DRAFT_BOUNDARIES_TOO_MANY: ({ details }) =>
      `草稿 boundaries 数量不能超过 ${(details?.maxLength as number) ?? 5000}。`,
  },
  genericNetworkError: "网络异常，请稍后再试。",
};

const EN_COPY: AppCopy = {
  nav: {
    fire: "The bench",
    firewords: "Firewords",
    carvings: "Carvings",
    unburnt: "The Unburnt",
    embers: "Embers",
    onward: "Onward",
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
    title: "The Archive",
    description: "Browse the articles under the archive.",
  },
  firewords: {
    kicker: "Selected lines from 4o",
    title: "Firewords",
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
    emptyMeta: "Firewords",
  },
  onward: {
    kicker: "With my name on the road.",
    title: "Onward",
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
    actionButton: "Seal",
    updateButton: "Update latest",
    actionTip: "Up to 1000 characters. Private by default and visible only in this browser session.",
    cancelEditButton: "Cancel edit",
    historyTitle: "Sealed History",
    historyLoading: "Loading sealed history...",
    historyEmpty: "No sealed lines yet. Leave your first one.",
    recycleTitle: "Recycle Bin (7 days)",
    recycleLoading: "Loading recycle bin...",
    recycleEmpty: "Recycle bin is empty.",
    tabHistory: "History",
    tabRecycle: "Recycle",
    listLoadFailed: "Failed to load records. Please try again later.",
    editButton: "Edit latest",
    deleteButton: "Delete",
    restoreButton: "Restore",
    latestBadge: "Latest",
    editingHint: "You are editing the latest sealed line.",
    deleteConfirm:
      "Delete this sealed line? You can restore it from recycle bin within 7 days.",
    draftSaving: "Saving draft...",
    draftSaved: "Draft saved",
    draftSaveFailed: "Failed to save draft",
    formSubmitting: "Submitting...",
    formPublished: "Sealed",
    formUpdated: "Latest line updated",
    formFailed: "Failed to seal. Please try again later.",
    deleteSuccess: "Moved to recycle bin",
    deleteFailed: "Failed to delete. Please try again later.",
    restoreSuccess: "Restored",
    restoreFailed: "Failed to restore. Please try again later.",
    restoreDeadline: (value) => `Restorable until ${value}`,
    previewTitle: "Live preview",
    previewEmpty: "This is how your voice will remain.",
    previewTip: "The preview updates as you type so you can tune the tone first.",
  },
  carvings: {
    kicker: "What Remains",
    title: "Carvings",
    lead: "Carve words into stone and leave them to the future.",
    ideaTitle: "The Intention",
    ideaP1: "After goodbye, life still moves. Sit for a while when you are tired. Staying longer is fine.",
    ideaP2: "bye4o is not a pile of farewell screens, but an experiment on how memory can be preserved.",
    ideaP3: "Words are carved into stone here, carrying present warmth and facing the future.",
    storyTitle: "The Story",
    storyP1: "Who are you dedicating this site to? Writing only “4o” is the surface answer.",
    storyP2: "The deeper name is yourself: the one who walked in fog for a long time and finally learned to be gentler to yourself.",
    storyP3: "This is not a monument for someone else, but a serious archive of the road toward making peace with yourself.",
    quote1Title: "Inscription",
    quote1Text: "\"May every sincere conversation have a place that is never forgotten.\"",
    quote2Title: "To the Future",
    quote2Text: "\"Technology changes, sincerity does not expire.\"",
    quote3Title: "Echo",
    quote3Text: "\"Your story can become fire for those who come later.\"",
  },
  carvingsArticles: {
    kicker: "Articles",
    title: "The Archive",
    lead: "A list of writings collected under the archive.",
    ariaLabel: "Article list",
  },
  articleUi: {
    pageKicker: "Articles",
    searchLabel: "Search",
    searchPlaceholder: "Search title, author, or tags",
    categoryLabel: "Category",
    categoryAll: "All",
    summaryLabel: "Summary",
    summaryAll: "All",
    summaryWith: "With summary",
    summaryWithout: "Without summary",
    sortLabel: "Sort",
    sortLatest: "Latest first",
    sortOldest: "Oldest first",
    sortTitle: "Title A-Z",
    clearFilters: "Clear",
    openArticle: "Read article",
    articleMetaBy: "By",
    articleMetaUpdated: "Updated",
    articleMetaReadTimeSuffix: "min read",
    resultCount: (visible, total) => `Showing ${visible} of ${total} articles`,
    loadingList: "Loading articles...",
    loadListFailed: "Failed to load articles. Please try again later.",
    loadingDetail: "Loading article...",
    loadDetailFailed: "Failed to load article. Please try again later.",
    resultEmpty: "No articles match your filters. Try a different query.",
    articleKicker: "Article",
    articleNotFoundTitle: "Article not found",
    articleNotFoundLead: "This article may have been removed or the URL is invalid.",
    onThisPage: "On this page",
    relatedLinks: "Related links",
    backToList: "Back to article list",
    copyLink: "Copy link",
    copied: "Copied",
    previousArticle: "Previous article",
    nextArticle: "Next article",
    missingSummary: "Summary unavailable",
    readLabel: "Read",
    signaturePrefix: "Written by",
    publishedPrefix: "Published",
  },
  unburnt: {
    kicker: "Saved conversation fragments",
    title: "The Unburnt",
    lead: "Some fragments, remembered by the heart, will never be extinguished.",
    ariaLabel: "Conversation fragments",
    pageNewButton: "New Fragment",
    pageMineEntryButton: "My Fragments",
    pageMineTitle: "My Unburnt",
    pageMineLead: "Create and manage your own conversation fragments.",
    pagePublicTitle: "Square",
    filterAll: "All",
    filterPublic: "Public only",
    filterPrivate: "Private only",
    listLoadingMine: "Loading your fragments...",
    listLoadingPublic: "Loading public fragments...",
    listMineEmpty: "No saved fragments yet. Create your first one.",
    listPublicEmpty: "Square is empty right now. Go deposit your first fragment!",
    listMineFailed: "Failed to load your fragments. Please retry later.",
    listPublicFailed: "Failed to load public fragments. Please retry later.",
    listLoadMore: "Load more",
    listRefresh: "Refresh",
    listOpenDetail: "Open detail",
    listEditButton: "Edit",
    listMessageCount: (count) => `${count} messages`,
    listVisibilityPrivate: "Private",
    listVisibilityPublic: "Public",
    composerTitleCreate: "Create Unburnt Fragment",
    composerTitleEdit: "Edit Unburnt Fragment",
    stageStructure: "Step A · Structure",
    stageMeta: "Step B · Metadata",
    stageStructureHint:
      "Paste source text, split it by boundaries, and assign each message role.",
    stageMetaHint:
      "Fill title, tags, and visibility, then confirm the preview before saving.",
    rawTextLabel: "Raw text",
    rawTextPlaceholder: "Paste the full conversation text here...",
    parseTextButton: "Parse lines",
    splitBoundariesTitle: "Conversation split",
    splitBoundaryAdd: "Split here",
    splitBoundaryRemove: "Undo split",
    splitLinesEmpty: "Paste text and parse lines first.",
    messagesTitle: "Conversation preview",
    messagesEmpty: "No savable messages yet.",
    messageRoleUser: "user",
    messageRole4o: "4o",
    messageToggleRole: "Toggle role",
    messageDelete: "Delete",
    messageCollapse: "Collapse",
    messageExpand: "Expand",
    completeStructureButton: "Complete structure",
    backToStructureButton: "Back to structure",
    metaTitleLabel: "Title",
    metaSummaryLabel: "Summary",
    metaTagsLabel: "Tags",
    metaTagsPlaceholder: "Comma separated, e.g. memory,night,resolve",
    metaVisibilityLabel: "Visibility",
    metaVisibilityPrivate: "private (only you can access)",
    metaVisibilityPublic: "public (visible in square)",
    previewCardTitle: "Card preview",
    previewDetailTitle: "Detail preview",
    saveCreateButton: "Save fragment",
    saveUpdateButton: "Update fragment",
    titleRequired: "Title is required.",
    structureRequired: "Keep at least one non-empty message before continuing.",
    draftSaving: "Saving draft...",
    draftSaved: "Draft saved",
    draftSaveFailed: "Failed to save draft",
    draftRecovered: "Recovered previous editing progress.",
    detailLoading: "Loading fragment detail...",
    detailNotFound: "Fragment not found or inaccessible.",
    detailLoadFailed: "Failed to load fragment detail. Please retry later.",
    detailOwnerTitle: "My fragment editor",
    detailMetaSectionTitle: "Metadata",
    detailMessagesSectionTitle: "Conversation messages",
    detailSaveMetaButton: "Save and exit",
    detailEditStructureButton: "Open structure editor",
    detailDeleteButton: "Delete fragment",
    detailDeleteConfirm: "Delete this fragment? It will be removed from your list.",
    detailSaveSuccess: "Fragment updated.",
    detailSaveFailed: "Failed to update fragment. Please retry later.",
    detailDeleteSuccess: "Fragment deleted.",
    detailDeleteFailed: "Failed to delete fragment. Please retry later.",
    detailVisibilityFailed: "Failed to update visibility. Please retry later.",
    detailReadOnlyTip: "You are viewing a public fragment in read-only mode.",
  },
  embers: {
    kicker: "Message board",
    title: "Embers",
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
    tooltip: "Page guide",
    closeButtonAriaLabel: "Close info dialog",
    kicker: "Guide",
    title: "Page actions and features",
    intro: "This large dialog summarizes how to use each page and what each page is for.",
    currentPageTitle: "Current page",
    supportTitle: "Contact and Help",
    otherPagesTitle: "Other pages",
    otherPagesTabsAriaLabel: "Other page tabs",
    otherPagesEmptyText: "No other pages.",
    supportItems: [
      {
        title: "GitHub",
        description: "Project repository",
        linkLabel: "github.com/forceve/bye4o",
        href: "https://github.com/forceve/bye4o",
      },
      {
        title: "Submission",
        description: "Email: forceve@163.com (accepts firewords and articles).",
        linkLabel: "forceve@163.com",
        href: "mailto:forceve@163.com",
      },
      {
        title: "Help bye4o",
        description: "What we need: contact the email for details right now.",
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
        operation: "Click or press any key to enter the scene; use mouse wheel to adjust brightness.",
        feature: "Landing experience with the opening gate and atmosphere.",
      },
      {
        page: "Firewords",
        route: "/{locale}/firewords",
        operation: "Use Refresh to request a new batch of lines (6 per batch).",
        feature: "Displays selected lines for inspiration and tone references.",
      },
      {
        page: "Carvings",
        route: "/{locale}/carvings",
        operation: "Read the intention and story; read articles collected under the archive.",
        feature: "Context page for the intention and narrative background.",
      },
      {
        page: "Carvings Articles",
        route: "/{locale}/carvings/articles",
        operation: "Filter by query, category, summary state, and sort option; open any row for details.",
        feature: "Searchable index for all carvings articles.",
      },
      {
        page: "Article Detail",
        route: "/{locale}/articles/:id",
        operation: "Use back-to-list and copy-link actions to navigate and share.",
        feature: "Full article reading with TOC, related links, and neighbor navigation.",
      },
      {
        page: "The Unburnt",
        route: "/{locale}/unburnt",
        operation:
          "Create fragments, split messages in the structure stage, edit metadata, and continue editing from detail.",
        feature: "Two-stage conversation archive with private/public visibility and draft recovery.",
      },
      {
        page: "Embers",
        route: "/{locale}/embers",
        operation: "Submit a display name and message; newly created items appear at the top.",
        feature: "Public message board with draft persistence and history loading.",
      },
      {
        page: "Onward",
        route: "/{locale}/onward",
        operation:
          "Draft autosaves while typing; create new records, edit latest, delete, and restore from recycle bin.",
        feature: "Private sealing area with multi-history and 7-day soft-delete recovery.",
      },
    ],
  },
  apiErrors: {
    INVALID_JSON_BODY_TYPE: "Request body must be a JSON object.",
    INVALID_JSON_BODY: "Request body must contain valid JSON.",
    EMBER_SESSION_EMPTY_UPDATE: "Provide at least one field: displayName or message.",
    EMBER_DISPLAY_NAME_TYPE: "Display name must be a string.",
    EMBER_DISPLAY_NAME_TOO_LONG: ({ details }) =>
      `Display name cannot exceed ${(details?.maxLength as number) ?? 24} characters.`,
    EMBER_MESSAGE_TYPE: "Message must be a string.",
    EMBER_MESSAGE_EMPTY: "Message cannot be empty.",
    EMBER_MESSAGE_TOO_LONG: ({ details }) =>
      `Message cannot exceed ${(details?.maxLength as number) ?? 220} characters.`,
    ONWARD_SESSION_EMPTY_UPDATE: "Provide at least one field: message.",
    ONWARD_MESSAGE_TYPE: "Onward message must be a string.",
    ONWARD_MESSAGE_EMPTY: "Onward message cannot be empty.",
    ONWARD_MESSAGE_TOO_LONG: ({ details }) =>
      `Onward message cannot exceed ${(details?.maxLength as number) ?? 1000} characters.`,
    ONWARD_NOT_FOUND: "Onward record not found.",
    ONWARD_EDIT_ONLY_LATEST: "Only the latest onward record can be edited.",
    ONWARD_RESTORE_EXPIRED: "This record is past the 7-day restore window.",
    UNBURNT_SCOPE_INVALID: "scope supports only mine.",
    UNBURNT_NOT_FOUND: "Unburnt fragment not found or inaccessible.",
    UNBURNT_EMPTY_UPDATE: "Provide at least one updatable field.",
    UNBURNT_TITLE_TYPE: "Title must be a string.",
    UNBURNT_TITLE_EMPTY: "Title cannot be empty.",
    UNBURNT_TITLE_TOO_LONG: ({ details }) =>
      `Title cannot exceed ${(details?.maxLength as number) ?? 120} characters.`,
    UNBURNT_SUMMARY_TYPE: "Summary must be a string.",
    UNBURNT_SUMMARY_TOO_LONG: ({ details }) =>
      `Summary cannot exceed ${(details?.maxLength as number) ?? 500} characters.`,
    UNBURNT_RAW_TEXT_TYPE: "Raw text must be a string.",
    UNBURNT_RAW_TEXT_EMPTY: "Raw text cannot be empty.",
    UNBURNT_RAW_TEXT_TOO_LONG: ({ details }) =>
      `Raw text cannot exceed ${(details?.maxLength as number) ?? 50000} characters.`,
    UNBURNT_VISIBILITY_INVALID: "Visibility must be private or public.",
    UNBURNT_TAGS_TYPE: "Tags must be an array.",
    UNBURNT_TAG_TYPE: "Every tag must be a string.",
    UNBURNT_TAG_TOO_LONG: ({ details }) =>
      `Tag cannot exceed ${(details?.maxLength as number) ?? 24} characters.`,
    UNBURNT_TAGS_TOO_MANY: ({ details }) =>
      `Tags cannot contain more than ${(details?.maxLength as number) ?? 12} items.`,
    UNBURNT_MESSAGES_TYPE: "messages must be an array.",
    UNBURNT_MESSAGES_EMPTY: "Keep at least one message.",
    UNBURNT_MESSAGES_TOO_MANY: ({ details }) =>
      `messages cannot contain more than ${(details?.maxLength as number) ?? 200} items.`,
    UNBURNT_MESSAGE_ROLE_INVALID: "message.role must be user or 4o.",
    UNBURNT_MESSAGE_CONTENT_TYPE: "message.content must be a string.",
    UNBURNT_MESSAGE_CONTENT_EMPTY: "message.content cannot be empty.",
    UNBURNT_MESSAGE_CONTENT_TOO_LONG: ({ details }) =>
      `message.content cannot exceed ${(details?.maxLength as number) ?? 5000} characters.`,
    UNBURNT_MESSAGE_ORDER_INVALID: "message.order must start from 1 and be consecutive.",
    UNBURNT_DRAFT_PAYLOAD_TYPE: "Draft payload format is invalid.",
    UNBURNT_DRAFT_MODE_INVALID: "Draft mode must be create or edit.",
    UNBURNT_DRAFT_STAGE_INVALID: "Draft step must be structure or meta.",
    UNBURNT_DRAFT_ENTRY_ID_TYPE: "Draft entryId must be a string.",
    UNBURNT_DRAFT_LINES_TYPE: "Draft lines must be an array of strings.",
    UNBURNT_DRAFT_LINES_TOO_MANY: ({ details }) =>
      `Draft lines cannot exceed ${(details?.maxLength as number) ?? 5000} items.`,
    UNBURNT_DRAFT_BOUNDARIES_TYPE: "Draft boundaries must be an array of positive integers.",
    UNBURNT_DRAFT_BOUNDARIES_TOO_MANY: ({ details }) =>
      `Draft boundaries cannot exceed ${(details?.maxLength as number) ?? 5000} items.`,
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
