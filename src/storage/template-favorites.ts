import { templateIds, type TemplateId } from "../core/model";
import { isPanoramaEnd } from "../core/panorama-families";

export const TEMPLATE_FAVORITE_PREFIX = "hen.template-favorite.";
const favoriteIds = templateIds.filter((id) => !isPanoramaEnd(id));
const allowedIds = new Set<string>(favoriteIds);
interface FavoritesSnapshot {
  ids: ReadonlySet<TemplateId>;
  sessionOnly: boolean;
}
let snapshot: FavoritesSnapshot = { ids: new Set(), sessionOnly: false };
const listeners = new Set<() => void>();
// Failed writes remain usable when reopening the library in this session.
const pending = new Map<TemplateId, boolean>();

export const getTemplateFavorites = () => snapshot;

function refresh() {
  let ids = new Set(snapshot.ids);
  let sessionOnly = pending.size > 0;
  try {
    const storage = window.localStorage;
    ids = new Set(
      favoriteIds.filter(
        (id) => storage.getItem(`${TEMPLATE_FAVORITE_PREFIX}${id}`) === "1",
      ),
    );
  } catch {
    sessionOnly = true;
  }
  for (const [id, favorite] of pending)
    if (favorite) ids.add(id);
    else ids.delete(id);
  if (
    snapshot.sessionOnly === sessionOnly &&
    snapshot.ids.size === ids.size &&
    [...ids].every((id) => snapshot.ids.has(id))
  )
    return;
  snapshot = { ids, sessionOnly };
  listeners.forEach((listener) => listener());
}

function onStorage(event: StorageEvent) {
  if (event.key === null || event.key.startsWith(TEMPLATE_FAVORITE_PREFIX))
    refresh();
}

export function subscribeTemplateFavorites(listener: () => void) {
  if (listeners.size === 0) window.addEventListener("storage", onStorage);
  listeners.add(listener);
  refresh();
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) window.removeEventListener("storage", onStorage);
  };
}

export function setTemplateFavorite(id: TemplateId, favorite: boolean) {
  if (!allowedIds.has(id)) return;
  try {
    // One key per template keeps simultaneous changes in other tabs independent.
    const key = `${TEMPLATE_FAVORITE_PREFIX}${id}`;
    if (favorite) window.localStorage.setItem(key, "1");
    else window.localStorage.removeItem(key);
    pending.delete(id);
  } catch {
    pending.set(id, favorite);
  }
  refresh();
}
