const params = new URLSearchParams(location.search);

initYear();
scheduleRelief();

function initYear() {
  const year = document.querySelector("#year");
  if (year) year.textContent = String(new Date().getFullYear());
}

function scheduleRelief() {
  if (params.get("relief") === "off") return;
  if ("requestIdleCallback" in window) requestIdleCallback(() => void initRelief(), { timeout: 1200 });
  else setTimeout(() => void initRelief(), 32);
}

async function initRelief() {
  const canvas = document.querySelector("#relief");
  const force = params.get("relief") === "force" || params.get("relief") === "debug";
  if (!canvas || (navigator.connection?.saveData && !force)) return;

  const coarse = matchMedia("(pointer: coarse)").matches;
  const lowMemory = typeof navigator.deviceMemory === "number" && navigator.deviceMemory <= 2;
  const tier = coarse || innerWidth < 900 || lowMemory ? "M" : "D";

  try {
    const { init } = await import("/js/relief.js");
    await init(canvas, {
      tier,
      reducedMotionQuery: matchMedia("(prefers-reduced-motion: reduce)"),
      darkQuery: matchMedia("(prefers-color-scheme: dark)"),
      hero: document.querySelector(".hero"),
      terrainUrl: lowMemory ? "/assets/terrain/toronto-512.png" : "/assets/terrain/toronto-1024.png",
      allowSoftwareGL: force,
      debug: params.get("relief") === "debug",
      pinSun: params.get("sun"),
      scrollTo: params.get("scroll"),
      og: params.has("og")
    });
  } catch (error) {
    console.warn("Relief unavailable; keeping the CSS poster.", error);
  }
}
