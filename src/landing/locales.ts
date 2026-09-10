import type { InterfaceLocale } from "../i18n/core.ts";

export const landingPaths: Record<InterfaceLocale, string> = {
  en: "/",
  es: "/es/",
  "pt-BR": "/pt-br/",
};

export const agentPaths: Record<InterfaceLocale, string> = {
  en: "/agents/",
  es: "/es/agents/",
  "pt-BR": "/pt-br/agents/",
};

export function publicPagePaths(path: string) {
  return Object.values(agentPaths).some(
    (value) => path === value || path === value.slice(0, -1),
  )
    ? agentPaths
    : landingPaths;
}

export function landingLocale(path: string): InterfaceLocale {
  if (path === "/es" || path.startsWith("/es/")) return "es";
  if (path === "/pt-br" || path.startsWith("/pt-br/")) return "pt-BR";
  return "en";
}
