/** One navigation for every viewport; without JavaScript its links stay visible. */
export function initializeNavigation() {
  const header = document.querySelector<HTMLElement>(".landing-header");
  const toggle = header?.querySelector<HTMLButtonElement>(".menu-toggle");
  const navigation = header?.querySelector<HTMLElement>("#landing-navigation");
  if (!header || !toggle || !navigation) return () => {};

  const compact = window.matchMedia("(max-width: 1240px)");
  function setOpen(open: boolean) {
    toggle!.setAttribute("aria-expanded", String(open && compact.matches));
    navigation!.hidden = compact.matches && !open;
  }
  function resize() {
    const focused = document.activeElement;
    toggle!.hidden = !compact.matches;
    setOpen(false);
    if (compact.matches && navigation!.contains(focused))
      toggle!.focus({ preventScroll: true });
    else if (!compact.matches && focused === toggle)
      navigation!
        .querySelector<HTMLAnchorElement>("a")
        ?.focus({ preventScroll: true });
  }
  function toggleMenu() {
    setOpen(toggle!.getAttribute("aria-expanded") !== "true");
  }
  function escape(event: KeyboardEvent) {
    if (
      event.key !== "Escape" ||
      toggle!.getAttribute("aria-expanded") !== "true"
    )
      return;
    event.preventDefault();
    setOpen(false);
    toggle!.focus({ preventScroll: true });
  }
  function outside(event: PointerEvent) {
    if (event.target instanceof Node && !header!.contains(event.target))
      setOpen(false);
  }
  function leave(event: FocusEvent) {
    if (
      event.relatedTarget instanceof Node &&
      !header!.contains(event.relatedTarget)
    )
      setOpen(false);
  }
  function navigate(event: MouseEvent) {
    if (!(event.target instanceof Element) || !compact.matches) return;
    const link = event.target.closest<HTMLAnchorElement>("a");
    if (
      !link ||
      event.ctrlKey ||
      event.metaKey ||
      event.shiftKey ||
      event.altKey ||
      event.button !== 0
    )
      return;
    setOpen(false);
    // Keep keyboard focus at the destination after hiding the activated link.
    // The anchor's default action still owns the hash and smooth scrolling.
    if (link.hash) {
      const target = document.getElementById(link.hash.slice(1));
      if (target) {
        const previous = target.getAttribute("tabindex");
        target.tabIndex = -1;
        target.focus({ preventScroll: true });
        target.addEventListener(
          "blur",
          () => {
            if (previous === null) target.removeAttribute("tabindex");
            else target.setAttribute("tabindex", previous);
          },
          { once: true },
        );
      }
    }
  }

  toggle.addEventListener("click", toggleMenu);
  document.addEventListener("keydown", escape);
  header.addEventListener("focusout", leave);
  navigation.addEventListener("click", navigate);
  document.addEventListener("pointerdown", outside);
  compact.addEventListener("change", resize);
  resize();

  return () => {
    toggle.removeEventListener("click", toggleMenu);
    document.removeEventListener("keydown", escape);
    header.removeEventListener("focusout", leave);
    navigation.removeEventListener("click", navigate);
    document.removeEventListener("pointerdown", outside);
    compact.removeEventListener("change", resize);
    toggle.hidden = true;
    navigation.hidden = false;
    toggle.setAttribute("aria-expanded", "false");
  };
}
