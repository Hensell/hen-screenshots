import type { InterfaceLocale } from "../i18n/core.ts";

export const landingPaths: Record<InterfaceLocale, string> = {
  en: "/",
  es: "/es/",
  "pt-BR": "/pt-br/",
};

export function landingLocale(path: string): InterfaceLocale {
  if (path === "/es" || path.startsWith("/es/")) return "es";
  if (path === "/pt-br" || path.startsWith("/pt-br/")) return "pt-BR";
  return "en";
}
