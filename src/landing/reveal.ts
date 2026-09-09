/** Enhance the static landing without hiding content when scripts are unavailable. */
export function initializeScrollReveals() {
  const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
  if (motion.matches || !("IntersectionObserver" in window)) return () => {};

  const elements = [...document.querySelectorAll<HTMLElement>("[data-reveal]")];
  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      observer.unobserve(entry.target);
      if (!entry.target.matches(":focus-within")) {
        entry.target.classList.add("reveal-enter");
      }
    }
  });

  function finish(event: AnimationEvent) {
    if (
      event.animationName === "landing-reveal" &&
      event.target instanceof HTMLElement
    ) {
      event.target.classList.remove("reveal-enter");
    }
  }

  function revealFocusedContent(event: FocusEvent) {
    if (!(event.target instanceof Element)) return;
    const element = event.target.closest("[data-reveal]");
    if (!element) return;
    observer.unobserve(element);
    element.classList.remove("reveal-enter");
  }

  function cleanup() {
    observer.disconnect();
    for (const element of elements) element.classList.remove("reveal-enter");
    document.removeEventListener("animationend", finish);
    document.removeEventListener("animationcancel", finish);
    document.removeEventListener("focusin", revealFocusedContent);
    motion.removeEventListener("change", onMotionChange);
  }

  function onMotionChange() {
    if (motion.matches) cleanup();
  }

  document.addEventListener("animationend", finish);
  document.addEventListener("animationcancel", finish);
  document.addEventListener("focusin", revealFocusedContent);
  motion.addEventListener("change", onMotionChange);

  for (const element of elements) {
    // Keep the initial viewport and restored scroll positions immediately readable.
    if (element.getBoundingClientRect().top >= window.innerHeight) {
      observer.observe(element);
    }
  }

  return cleanup;
}
