import { Icon } from "../app/Icon";
import {
  localeOptions,
  setInterfaceLocale,
  type InterfaceLocale,
} from "./core";
import { useInterfaceLocale, useT } from "./react";
import "./language-selector.css";
export function LanguageSelector() {
  const locale = useInterfaceLocale();
  const t = useT();
  return (
    <label
      className="interface-language"
      title={t("Website language — does not change screenshot text")}
    >
      <Icon name="languages" size={17} />
      <span className="interface-language-label">
        {t("Interface language")}
      </span>
      <select
        aria-label={t("Interface language")}
        value={locale}
        onChange={(event) =>
          setInterfaceLocale(event.target.value as InterfaceLocale)
        }
      >
        {localeOptions.map((option) => (
          <option key={option.value} value={option.value} lang={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
