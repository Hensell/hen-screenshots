import { useT } from "../i18n/react";
import { useEffect, useLayoutEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Icon } from "./Icon";

export type SlideMenuTarget = {
  projectId: string;
  shotId: string;
  x: number;
  y: number;
  opener: HTMLElement;
};

export function SlideActionsMenu({
  target,
  label,
  panorama,
  emptyImage,
  canDuplicate,
  capacity,
  onClose,
  onEdit,
  onReplace,
  onDuplicate,
  onDelete,
}: {
  target: SlideMenuTarget;
  label: string;
  panorama: boolean;
  emptyImage: boolean;
  canDuplicate: boolean;
  capacity: number;
  onClose: (restoreFocus?: boolean) => void;
  onEdit: () => void;
  onReplace: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}) {
  const t = useT();
  const ref = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const menu = ref.current!;
    const bounds = menu.getBoundingClientRect();
    menu.style.left = `${Math.max(8, Math.min(target.x, document.documentElement.clientWidth - bounds.width - 8))}px`;
    menu.style.top = `${Math.max(8, Math.min(target.y, document.documentElement.clientHeight - bounds.height - 8))}px`;
    menu
      .querySelector<HTMLElement>('[role="menuitem"]')
      ?.focus({ preventScroll: true });
  }, [target]);

  useEffect(() => {
    function outside(event: Event) {
      // Let the trigger's click toggle its menu instead of reopening it.
      if (target.opener.contains(event.target as Node)) return;
      if (!ref.current?.contains(event.target as Node)) onClose(false);
    }
    function dismiss(event: Event) {
      if (!ref.current?.contains(event.target as Node)) onClose();
    }
    function resize() {
      onClose();
    }
    document.addEventListener("pointerdown", outside);
    document.addEventListener("focusin", outside);
    document.addEventListener("scroll", dismiss, true);
    window.addEventListener("resize", resize);
    return () => {
      document.removeEventListener("pointerdown", outside);
      document.removeEventListener("focusin", outside);
      document.removeEventListener("scroll", dismiss, true);
      window.removeEventListener("resize", resize);
    };
  }, [onClose, target.opener]);

  return createPortal(
    <div
      ref={ref}
      id="slide-actions-menu"
      role="menu"
      aria-label={label}
      className="slide-actions-menu"
      style={{ left: target.x, top: target.y }}
      onContextMenu={(event) => event.preventDefault()}
      onKeyDown={(event) => {
        const items = Array.from(
          ref.current!.querySelectorAll<HTMLElement>('[role="menuitem"]'),
        );
        const index = items.indexOf(document.activeElement as HTMLElement);
        let next: number | undefined;
        if (event.key === "ArrowDown") next = (index + 1) % items.length;
        if (event.key === "ArrowUp")
          next = (index + items.length - 1) % items.length;
        if (event.key === "Home") next = 0;
        if (event.key === "End") next = items.length - 1;
        if (next !== undefined) {
          event.preventDefault();
          items[next].focus();
        } else if (event.key === "Escape") {
          event.preventDefault();
          onClose();
        } else if (event.key === "Tab") {
          // Restore the trigger before the browser advances to the next control.
          onClose();
        }
      }}
    >
      <p className="slide-menu-label">{label}</p>
      <button
        role="menuitem"
        tabIndex={-1}
        onClick={() => {
          onClose();
          onEdit();
        }}
      >
        <Icon name="edit" />
        {t("Edit slide")}
      </button>
      <button
        role="menuitem"
        tabIndex={-1}
        onClick={() => {
          onClose();
          onReplace();
        }}
      >
        <Icon name="image" />
        {emptyImage
          ? t("Add image…")
          : panorama
            ? t("Replace panorama image…")
            : t("Replace image…")}
      </button>
      <button
        role="menuitem"
        tabIndex={-1}
        aria-disabled={!canDuplicate}
        aria-describedby={!canDuplicate ? "slide-menu-limit" : undefined}
        onClick={() => {
          if (!canDuplicate) return;
          onClose();
          onDuplicate();
        }}
      >
        <Icon name="copy" />
        {panorama ? t("Duplicate panorama") : t("Duplicate slide")}
      </button>
      {!canDuplicate && (
        <p id="slide-menu-limit" className="slide-menu-hint">
          {t("This format allows {count} slides.", { count: capacity })}
          {panorama ? ` ${t("A panorama needs two free slots.")}` : ""}
        </p>
      )}
      <button
        role="menuitem"
        tabIndex={-1}
        className="slide-menu-delete"
        onClick={() => {
          onClose();
          onDelete();
        }}
      >
        <Icon name="trash" />
        {panorama ? t("Delete panorama…") : t("Delete slide…")}
      </button>
    </div>,
    document.body,
  );
}
