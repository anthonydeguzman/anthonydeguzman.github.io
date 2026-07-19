import { prompts, promptById } from "./prompts.js";
import { stream } from "./stream.js";

export function initPalette() {
  const dialog = document.querySelector("#prompt-dialog");
  const input = document.querySelector("#prompt-input");
  const options = document.querySelector("#prompt-options");
  const log = document.querySelector("#prompt-log");
  const closeButton = dialog?.querySelector(".dialog-close");
  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
  let filtered = [...prompts];
  let activeIndex = 0;
  let invoker = null;
  let activeStream = null;

  if (!dialog || !input || !options || !log || !closeButton) return;

  function renderOptions() {
    options.replaceChildren();
    if (!filtered.length) {
      const empty = document.createElement("li");
      empty.className = "prompt-empty";
      empty.textContent = "out of distribution — try one of these: stack, AI pivot, contact";
      options.append(empty);
      input.removeAttribute("aria-activedescendant");
      return;
    }

    filtered.forEach((prompt, index) => {
      const item = document.createElement("li");
      const optionId = `prompt-option-${prompt.id}`;
      item.className = "prompt-option";
      item.setAttribute("role", "option");
      item.setAttribute("aria-selected", String(index === activeIndex));
      item.id = optionId;
      item.innerHTML = `<span>${String(index + 1).padStart(2, "0")}</span><span>${prompt.question}</span><span aria-hidden="true">↵</span>`;
      item.addEventListener("click", () => runPrompt(prompt));
      options.append(item);
    });
    input.setAttribute("aria-activedescendant", `prompt-option-${filtered[activeIndex].id}`);
  }

  function setActive(next) {
    if (!filtered.length) return;
    activeIndex = (next + filtered.length) % filtered.length;
    options.querySelectorAll('[role="option"]').forEach((option, index) => {
      option.setAttribute("aria-selected", String(index === activeIndex));
    });
    const id = `prompt-option-${filtered[activeIndex].id}`;
    input.setAttribute("aria-activedescendant", id);
    document.getElementById(id)?.scrollIntoView({ block: "nearest" });
  }

  function showOptions() {
    activeStream?.finish();
    log.classList.remove("active");
    options.classList.remove("hidden");
    input.setAttribute("aria-expanded", "true");
  }

  function filterOptions() {
    const query = input.value.trim().toLowerCase();
    filtered = prompts.filter((prompt) => `${prompt.question} ${prompt.keywords}`.toLowerCase().includes(query));
    activeIndex = 0;
    showOptions();
    renderOptions();
  }

  function makeElement(tag, className, text) {
    const element = document.createElement(tag);
    element.className = className;
    element.textContent = text;
    return element;
  }

  function runPrompt(prompt) {
    activeStream?.finish();
    options.classList.add("hidden");
    log.classList.add("active");
    input.setAttribute("aria-expanded", "false");
    log.setAttribute("aria-live", "off");
    log.replaceChildren();

    const question = makeElement("p", "log-question", prompt.question);
    const marker = document.createElement("span");
    marker.textContent = ">";
    marker.setAttribute("aria-hidden", "true");
    question.prepend(marker);

    const meta = makeElement("p", "log-meta", `adg-3 · temperature 0 · ${prompt.tokens} tok · ${prompt.ms} ms`);
    const answer = makeElement("p", "log-answer", prompt.answer);
    answer.setAttribute("aria-hidden", "true");
    const announcement = makeElement("p", "sr-only", prompt.answer);
    announcement.setAttribute("role", "status");

    const followups = document.createElement("div");
    followups.className = "followups";
    const label = document.createElement("span");
    label.textContent = "follow up";
    followups.append(label);
    for (const id of prompt.followups) {
      const next = promptById.get(id);
      if (!next) continue;
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = next.question;
      button.addEventListener("click", () => runPrompt(next));
      followups.append(button);
    }

    log.append(question, meta, answer, announcement, followups);
    requestAnimationFrame(() => {
      log.setAttribute("aria-live", "polite");
      if (reducedMotion.matches) {
        answer.classList.add("is-streamed");
      } else {
        activeStream = stream(answer, { mode: "token", rate: 18 });
      }
    });
  }

  function openPalette(source) {
    if (dialog.open) return;
    invoker = source instanceof HTMLElement ? source : document.activeElement;
    filtered = [...prompts];
    activeIndex = 0;
    input.value = "";
    showOptions();
    renderOptions();
    dialog.showModal();
    document.body.classList.add("dialog-open");
    requestAnimationFrame(() => input.focus());
  }

  function closePalette() {
    activeStream?.finish();
    if (dialog.open) dialog.close();
  }

  document.querySelectorAll("[data-prompt-open]").forEach((button) => {
    button.addEventListener("click", () => openPalette(button));
  });

  document.addEventListener("keydown", (event) => {
    const target = event.target;
    const isTyping = target instanceof HTMLElement && (target.matches("input, textarea, select") || target.isContentEditable);
    const shortcut = (event.key === "/" && !isTyping && !event.metaKey && !event.ctrlKey && !event.altKey) ||
      (event.key.toLowerCase() === "k" && (event.metaKey || event.ctrlKey));
    if (!shortcut) return;
    event.preventDefault();
    openPalette(document.activeElement);
  });

  input.addEventListener("input", filterOptions);
  input.addEventListener("keydown", (event) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActive(activeIndex + 1);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive(activeIndex - 1);
    } else if (event.key === "Enter" && filtered.length) {
      event.preventDefault();
      runPrompt(filtered[activeIndex]);
    }
  });

  closeButton.addEventListener("click", closePalette);
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) closePalette();
  });
  dialog.addEventListener("close", () => {
    document.body.classList.remove("dialog-open");
    if (invoker instanceof HTMLElement) invoker.focus();
  });
}
