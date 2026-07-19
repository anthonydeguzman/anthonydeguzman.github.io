const root = document.documentElement;
const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");

initYear();
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

async function initHero() {
  const canvas = document.querySelector("#terrain");
  if (!canvas || navigator.connection?.saveData) return;

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
