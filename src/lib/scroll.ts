import Lenis from "lenis";
import { gsap, ScrollTrigger } from "./gsap";

let instance: Lenis | null = null;

/**
 * Buttery smooth scrolling (Lenis) driven by GSAP's ticker so ScrollTrigger
 * and every pinned/scrubbed timeline stay perfectly in sync.
 * Created once, outside React, so children can safely use it inside their effects.
 */
export function initScroll(): Lenis {
  if (instance) return instance;

  if ("scrollRestoration" in history) history.scrollRestoration = "manual";
  window.scrollTo(0, 0);

  const lenis = new Lenis({
    lerp: 0.085,
    smoothWheel: true,
    wheelMultiplier: 0.95,
    syncTouch: false, // keep native momentum on touch devices
  });

  lenis.on("scroll", ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);

  instance = lenis;
  return lenis;
}

export const getLenis = () => instance;
