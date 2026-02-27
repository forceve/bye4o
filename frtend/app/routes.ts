export const ROUTES = {
  fire: "/fire",
  firewords: "/firewords",
  carvings: "/carvings",
  carvingsArticles: "/carvings/articles",
  unburnt: "/unburnt",
  unburntMine: "/unburnt/mine",
  unburntNew: "/unburnt/new",
  embers: "/embers",
  onward: "/onward",
} as const;

export type StaticRoutePath = (typeof ROUTES)[keyof typeof ROUTES];
export type ArticleDetailRoutePath = `/articles/${string}`;
export type UnburntDetailRoutePath = `/unburnt/${string}`;
export type UnburntEditRoutePath = `/unburnt/${string}/edit`;
export type RoutePath =
  | StaticRoutePath
  | ArticleDetailRoutePath
  | UnburntDetailRoutePath
  | UnburntEditRoutePath;
export type NonFireRoutePath = Exclude<RoutePath, typeof ROUTES.fire>;
export type AppRoute = Exclude<
  StaticRoutePath,
  typeof ROUTES.carvingsArticles | typeof ROUTES.unburntMine | typeof ROUTES.unburntNew
>;

export const ROUTE_PRIORITY: RoutePath[] = [
  ROUTES.fire,
  ROUTES.firewords,
  ROUTES.carvings,
  ROUTES.carvingsArticles,
  ROUTES.unburnt,
  ROUTES.unburntMine,
  ROUTES.unburntNew,
  ROUTES.embers,
  ROUTES.onward,
  "/articles/:id",
  "/unburnt/:id/edit",
  "/unburnt/:id",
] as RoutePath[];

const STATIC_ROUTE_VALUES = Object.values(ROUTES) as StaticRoutePath[];

export function isStaticRoutePath(value: string): value is StaticRoutePath {
  return STATIC_ROUTE_VALUES.includes(value as StaticRoutePath);
}

export function isArticleDetailRoutePath(value: string): value is ArticleDetailRoutePath {
  const match = value.match(/^\/articles\/([a-z0-9][a-z0-9-]*)$/i);
  return Boolean(match);
}

export function isUnburntDetailRoutePath(value: string): value is UnburntDetailRoutePath {
  const match = value.match(/^\/unburnt\/([a-z0-9][a-z0-9-]*)$/i);
  if (!match) {
    return false;
  }
  const token = match[1].toLowerCase();
  return token !== "mine" && token !== "new";
}

export function isUnburntEditRoutePath(value: string): value is UnburntEditRoutePath {
  const match = value.match(/^\/unburnt\/([a-z0-9][a-z0-9-]*)\/edit$/i);
  if (!match) {
    return false;
  }
  const token = match[1].toLowerCase();
  return token !== "mine" && token !== "new";
}
