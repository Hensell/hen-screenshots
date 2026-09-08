import { useMemo, useSyncExternalStore } from "react";
import {
  getInterfaceLocale,
  subscribeInterfaceLocale,
  translateFor,
  type Translate,
} from "./core";
export function useInterfaceLocale() {
  return useSyncExternalStore(
    subscribeInterfaceLocale,
    getInterfaceLocale,
    () => "en" as const,
  );
}
export function useT(): Translate {
  const locale = useInterfaceLocale();
  return useMemo(
    () => (source, values) => translateFor(locale, source, values),
    [locale],
  );
}
