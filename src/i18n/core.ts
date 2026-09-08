import { appMessages } from "./app-messages";
import { editorMessages } from "./editor-messages";
import { dialogMessages } from "./dialog-messages";
import { discoveryMessages } from "./discovery-messages";
import { landingMessages } from "./landing-messages";
import { errorMessages } from "./error-messages";
import { halloweenMessages } from "./halloween-messages";

export type InterfaceLocale = "en" | "es" | "pt-BR";
export type MessageValues = Record<string, string | number>;
export type Translate = (source: string, values?: MessageValues) => string;
export const localeOptions = [
  { value: "en", label: "English" },
  { value: "es", label: "Español" },
  { value: "pt-BR", label: "Português" },
] as const;
export const INTERFACE_LANGUAGE_KEY = "hen.interface-language";
export const messageCatalog: Record<string, readonly [string, string]> = {
  ...appMessages,
  ...editorMessages,
  ...dialogMessages,
  ...discoveryMessages,
  ...landingMessages,
  ...errorMessages,
  ...halloweenMessages,
};

export function detectInterfaceLocale(
  preferred: readonly string[],
): InterfaceLocale {
  for (const language of preferred) {
    const base = language.toLowerCase().split(/[-_]/)[0];
    if (base === "pt") return "pt-BR";
    if (base === "es" || base === "en") return base;
  }
  return "en";
}
export function isInterfaceLocale(value: unknown): value is InterfaceLocale {
  return localeOptions.some((option) => option.value === value);
}
let locale: InterfaceLocale = "en";
const listeners = new Set<() => void>();
let initialized = false;
export const getInterfaceLocale = () => locale;
export function subscribeInterfaceLocale(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
function publish(next: InterfaceLocale) {
  if (typeof document !== "undefined") document.documentElement.lang = next;
  if (locale === next) return;
  locale = next;
  listeners.forEach((listener) => listener());
}
function browserLocale() {
  return detectInterfaceLocale(
    typeof navigator === "undefined"
      ? []
      : (navigator.languages ?? [navigator.language]),
  );
}
export function initializeInterfaceLocale() {
  if (initialized || typeof window === "undefined") return;
  initialized = true;
  let preference: string | null = null;
  try {
    preference = window.localStorage.getItem(INTERFACE_LANGUAGE_KEY);
  } catch {
    /* Session-only selection still works. */
  }
  publish(isInterfaceLocale(preference) ? preference : browserLocale());
  window.addEventListener("storage", (event) => {
    if (event.key !== INTERFACE_LANGUAGE_KEY && event.key !== null) return;
    publish(
      isInterfaceLocale(event.newValue) ? event.newValue : browserLocale(),
    );
  });
}
export function setInterfaceLocale(next: InterfaceLocale) {
  if (!isInterfaceLocale(next)) return;
  try {
    window.localStorage.setItem(INTERFACE_LANGUAGE_KEY, next);
  } catch {
    /* Storage may be unavailable in private sessions. */
  }
  publish(next);
}
export function interpolate(message: string, values: MessageValues = {}) {
  return message.replace(/\{(\w+)\}/g, (token, key: string) =>
    Object.hasOwn(values, key) ? String(values[key]) : token,
  );
}
// English status/error strings can arrive from async domain operations. Match only
// catalogued whole messages; never inspect or rewrite project content or the DOM.
const runtimePatterns = Object.entries(messageCatalog)
  .filter(([source]) => /\{\w+\}/.test(source))
  .map(([source, translations]) => {
    const names: string[] = [];
    const escaped = source
      .split(/(\{\w+\})/g)
      .map((part) => {
        const match = /^\{(\w+)\}$/.exec(part);
        if (match) {
          names.push(match[1]);
          return "([\\s\\S]+?)";
        }
        return part.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      })
      .join("");
    return {
      pattern: new RegExp(`^${escaped}$`),
      source,
      translations,
      names,
      specificity: source.replace(/\{\w+\}/g, "").length,
    };
  })
  .sort((a, b) => b.specificity - a.specificity);
export function translateFor(
  language: InterfaceLocale,
  source: string,
  values?: MessageValues,
): string {
  return translateMessage(language, source, values, 0);
}
function translateMessage(
  language: InterfaceLocale,
  source: string,
  values: MessageValues | undefined,
  depth: number,
): string {
  const entry = Object.hasOwn(messageCatalog, source)
    ? messageCatalog[source]
    : undefined;
  if (entry || values || language === "en")
    return interpolate(
      language === "en" || !entry ? source : entry[language === "es" ? 0 : 1],
      values,
    );
  for (const item of runtimePatterns) {
    const match = item.pattern.exec(source);
    if (!match) continue;
    const captured = Object.fromEntries(
      item.names.map((name, index) => [
        name,
        depth < 4 && (name === "error" || name === "detail")
          ? translateMessage(language, match[index + 1], undefined, depth + 1)
          : match[index + 1],
      ]),
    );
    return interpolate(item.translations[language === "es" ? 0 : 1], captured);
  }
  return source;
}
export const translate: Translate = (source, values) =>
  translateFor(locale, source, values);
