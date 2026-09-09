import {
  getInterfaceLocale,
  initializeInterfaceLocale,
  localeOptions,
  setInterfaceLocale,
  subscribeInterfaceLocale,
  translate,
  type InterfaceLocale,
} from "../i18n/core";
import "../i18n/language-selector.css";
import { initializeScrollReveals } from "./reveal";

initializeInterfaceLocale();

const selector = document.querySelector<HTMLSelectElement>("#landing-language");
if (selector) {
  for (const { value, label } of localeOptions) {
    selector.add(new Option(label, value));
  }
  selector.addEventListener("change", () => {
    setInterfaceLocale(selector.value as InterfaceLocale);
  });
  selector.closest<HTMLElement>(".landing-language")?.removeAttribute("hidden");
}

function renderLanguage() {
  if (selector) selector.value = getInterfaceLocale();
  // Only explicitly marked marketing copy is translated. Example screenshots
  // and project content keep their original language.
  for (const element of document.querySelectorAll<HTMLElement>("[data-i18n]")) {
    element.textContent = translate(element.dataset.i18n!);
  }
  for (const attribute of ["aria-label", "alt", "content"] as const) {
    for (const element of document.querySelectorAll(
      `[data-i18n-${attribute}]`,
    )) {
      element.setAttribute(
        attribute,
        translate(element.getAttribute(`data-i18n-${attribute}`)!),
      );
    }
  }
}

renderLanguage();
subscribeInterfaceLocale(renderLanguage);

const stopScrollReveals = initializeScrollReveals();
if (import.meta.hot) import.meta.hot.dispose(stopScrollReveals);
