import {
  localeOptions,
  setInterfaceLocale,
  type InterfaceLocale,
} from "../i18n/core";
import "../i18n/language-selector.css";
import { initializeScrollReveals } from "./reveal";
import { landingLocale, landingPaths } from "./locales";

// A public page has one stable language for visitors and crawlers alike.
const pageLocale = landingLocale(window.location.pathname);
setInterfaceLocale(pageLocale);

const selector = document.querySelector<HTMLSelectElement>("#landing-language");
if (selector) {
  for (const { value, label } of localeOptions) {
    selector.add(new Option(label, value));
  }
  selector.value = pageLocale;
  selector.addEventListener("change", () => {
    const language = selector.value as InterfaceLocale;
    setInterfaceLocale(language);
    const url = new URL(window.location.href);
    url.pathname = landingPaths[language];
    window.location.assign(url.href);
  });
  selector.closest<HTMLElement>(".landing-language")?.removeAttribute("hidden");
}

const stopScrollReveals = initializeScrollReveals();
if (import.meta.hot) import.meta.hot.dispose(stopScrollReveals);
