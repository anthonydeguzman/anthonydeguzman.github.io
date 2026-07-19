/**
 * Reveals existing text without changing its layout. The original plain text node
 * is restored when the animation completes.
 */
export function stream(element, { mode = "token", rate = 20, onDone } = {}) {
  const text = element.textContent || "";
  const units = mode === "char" ? Array.from(text) : text.match(/\S+\s*|\s+/g) || [];
  const fragment = document.createDocumentFragment();
  const accessible = element.getAttribute("aria-hidden") !== "true";
  let frame = 0;
  let index = 0;
  let accumulator = 0;
  let previous = performance.now();
  let complete = false;
  let resolveDone;

  if (accessible) element.setAttribute("aria-label", text);
  element.classList.add("is-streaming");

  for (const unit of units) {
    const span = document.createElement("span");
    span.className = "stream-unit";
    span.setAttribute("aria-hidden", "true");
    span.textContent = unit;
    fragment.append(span);
  }

  element.replaceChildren(fragment);
  const spans = Array.from(element.children);
  const done = new Promise((resolve) => { resolveDone = resolve; });

  function finalize() {
    if (complete) return;
    complete = true;
    cancelAnimationFrame(frame);
    element.replaceChildren(document.createTextNode(text));
    element.classList.remove("is-streaming");
    element.classList.add("is-streamed");
    if (accessible) element.removeAttribute("aria-label");
    onDone?.();
    resolveDone();
  }

  function finish() {
    spans.forEach((span) => span.classList.add("visible"));
    finalize();
  }

  function tick(now) {
    const elapsed = Math.min(now - previous, 100);
    previous = now;
    const jitter = 0.9 + Math.sin(index * 2.17) * 0.12;
    accumulator += (elapsed / 1000) * rate * jitter;

    while (accumulator >= 1 && index < spans.length) {
      spans[index].classList.add("visible");
      index += 1;
      accumulator -= 1;
    }

    if (index >= spans.length) {
      finalize();
      return;
    }
    frame = requestAnimationFrame(tick);
  }

  if (!spans.length) finalize();
  else frame = requestAnimationFrame(tick);

  return { finish, done };
}
