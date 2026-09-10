import "./landing";

// Progressive enhancement: the instructions remain selectable without clipboard access.
const feedback = document.querySelector<HTMLElement>("#copy-feedback");
const success = document.querySelector("#copy-success")?.textContent ?? "";
const failure = document.querySelector("#copy-error")?.textContent ?? "";
const cleanups: (() => void)[] = [];
let feedbackTimer: ReturnType<typeof setTimeout> | undefined;
for (const button of document.querySelectorAll<HTMLButtonElement>(
  "[data-copy]",
)) {
  const code = document.getElementById(button.dataset.copy!);
  if (!code) continue;
  button.hidden = false;
  const copy = async () => {
    clearTimeout(feedbackTimer);
    if (feedback) feedback.textContent = "";
    button.disabled = true;
    try {
      await navigator.clipboard.writeText(code.textContent ?? "");
      if (feedback) feedback.textContent = success;
    } catch {
      const selection = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(code);
      selection?.removeAllRanges();
      selection?.addRange(range);
      code.closest("pre")?.focus({ preventScroll: true });
      if (feedback) feedback.textContent = failure;
    } finally {
      button.disabled = false;
      feedbackTimer = setTimeout(() => {
        if (feedback) feedback.textContent = "";
      }, 6000);
    }
  };
  button.addEventListener("click", copy);
  cleanups.push(() => button.removeEventListener("click", copy));
}
if (import.meta.hot)
  import.meta.hot.dispose(() => {
    clearTimeout(feedbackTimer);
    cleanups.forEach((stop) => stop());
  });
