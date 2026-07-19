import { initPalette } from "./palette.js";
import { stream } from "./stream.js";

const root = document.documentElement;
const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");

initPalette();
initYear();
initIntro();
initReveals();
initNavigation();
scheduleHero();

function scheduleHero() {
  if ("requestIdleCallback" in window) requestIdleCallback(() => void initHero(), { timeout: 1200 });
  else setTimeout(() => void initHero(), 32);
}

function initYear() {
  const year = document.querySelector("#year");
  if (year) year.textContent = String(new Date().getFullYear());
}

function markIntroComplete() {
  root.classList.remove("intro");
  document.querySelectorAll(".intro-stream").forEach((element) => element.classList.add("is-streamed"));
  try { sessionStorage.setItem("adg3:intro", "1"); } catch (_) { /* Storage is optional. */ }
}

function initIntro() {
  if (!root.classList.contains("intro") || reducedMotion.matches) {
    markIntroComplete();
    return;
  }

  const name = document.querySelector('[data-intro="name"]');
  const tagline = document.querySelector('[data-intro="tagline"]');
  const timers = [];
  const controllers = [];
  const startY = scrollY;
  let finished = false;

  const complete = () => {
    if (finished) return;
    finished = true;
    timers.forEach(clearTimeout);
    controllers.forEach((controller) => controller.finish());
    markIntroComplete();
    removeEventListener("keydown", skip);
    removeEventListener("click", skip);
    removeEventListener("scroll", onScroll);
  };

  const skip = () => complete();
  const onScroll = () => {
    if (Math.abs(scrollY - startY) >= 40) complete();
  };

  addEventListener("keydown", skip, { once: true });
  addEventListener("click", skip, { once: true });
  addEventListener("scroll", onScroll, { passive: true });

  timers.push(setTimeout(() => {
    if (finished || !name) return;
    const nameStream = stream(name, { mode: "char", rate: 42 });
    controllers.push(nameStream);
    nameStream.done.then(() => {
      if (finished || !tagline) return;
      const taglineStream = stream(tagline, { mode: "token", rate: 30, onDone: complete });
      controllers.push(taglineStream);
    });
  }, 200));

  timers.push(setTimeout(complete, 2400));
}

function initReveals() {
  const elements = Array.from(document.querySelectorAll(".reveal"));
  if (reducedMotion.matches || !("IntersectionObserver" in window)) {
    elements.forEach((element) => element.classList.add("is-visible"));
    return;
  }

  root.classList.add("motion");
  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      entry.target.classList.add("is-visible");
      observer.unobserve(entry.target);
    }
  }, { rootMargin: "0px 0px -8%", threshold: 0.08 });
  elements.forEach((element) => observer.observe(element));
}

function initNavigation() {
  const links = Array.from(document.querySelectorAll(".site-nav a"));
  const sections = links.map((link) => document.querySelector(link.hash)).filter(Boolean);
  if (!("IntersectionObserver" in window)) return;

  const observer = new IntersectionObserver((entries) => {
    const visible = entries
      .filter((entry) => entry.isIntersecting)
      .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
    if (!visible) return;
    links.forEach((link) => {
      if (link.hash === `#${visible.target.id}`) link.setAttribute("aria-current", "location");
      else link.removeAttribute("aria-current");
    });
  }, { rootMargin: "-30% 0px -60%", threshold: [0, 0.2, 0.5] });
  sections.forEach((section) => observer.observe(section));
}

function supportsWebGL2() {
  try {
    const probe = document.createElement("canvas");
    return Boolean(probe.getContext("webgl2", { failIfMajorPerformanceCaveat: true }));
  } catch (_) {
    return false;
  }
}

async function initHero() {
  const canvas = document.querySelector("#terrain");
  if (!canvas || !supportsWebGL2() || navigator.connection?.saveData) return;

  const coarse = matchMedia("(pointer: coarse)").matches;
  const lowMemory = typeof navigator.deviceMemory === "number" && navigator.deviceMemory <= 2;
  const tier = coarse || innerWidth < 768 || lowMemory ? "M" : "D";

  try {
    const { initHero: boot } = await import("/js/hero.js");
    await boot(canvas, { tier, staticMode: reducedMotion.matches });
  } catch (error) {
    console.warn("Interactive background unavailable; retaining CSS poster.", error);
  }
}
