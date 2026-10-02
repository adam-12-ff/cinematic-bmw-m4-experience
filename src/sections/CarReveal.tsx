import { useLayoutEffect, useRef } from "react";
import { gsap } from "../lib/gsap";
import SplitText from "../components/SplitText";
import SmokeCanvas from "../components/SmokeCanvas";
import carFront from "../assets/m4-front.jpg";

const STREAKS = [
  { left: 8, h: 22, speed: 1.6, c: "#00a8e8" },
  { left: 19, h: 30, speed: 2.4, c: "#1c69d4" },
  { left: 31, h: 16, speed: 1.9, c: "#e4002b" },
  { left: 68, h: 26, speed: 2.2, c: "#00a8e8" },
  { left: 79, h: 34, speed: 2.8, c: "#e4002b" },
  { left: 91, h: 20, speed: 1.7, c: "#1c69d4" },
];

export default function CarReveal() {
  const rootRef = useRef<HTMLElement>(null);
  const smoke = useRef({ current: 0.25 });

  useLayoutEffect(() => {
    const root = rootRef.current!;
    const qa = (sel: string) => gsap.utils.toArray<HTMLElement>(sel, root);
    const q = (sel: string) => root.querySelector<HTMLElement>(sel)!;

    const mm = gsap.matchMedia();
    mm.add(
      { desktop: "(min-width: 768px)", mobile: "(max-width: 767px)" },
      (context) => {
        const isDesktop = !!context.conditions?.desktop;
        const car = q(".car-wrap");
        const img = q(".car-img");
        const bg = q(".rv-bg");
        const grid = q(".rv-grid");
        const mega = q(".rv-mega");
        const leftChars = qa(".rv-left .split-char");
        const rightChars = qa(".rv-right .split-char");
        const leftMeta = qa(".rv-left .rv-meta");
        const rightMeta = qa(".rv-right .rv-meta");
        const streaks = qa(".rv-streak");
        const hud = qa(".rv-hud");

        gsap.set(car, { scale: 0.5, y: "10vh", opacity: 0 });
        gsap.set(img, { filter: "brightness(0.35) saturate(0.7)" });
        gsap.set(leftChars, { xPercent: -115, opacity: 0 });
        gsap.set(rightChars, { xPercent: 115, opacity: 0 });
        gsap.set([...leftMeta, ...rightMeta], { opacity: 0, y: 20 });
        gsap.set(mega, { opacity: 0, scale: 0.85 });
        gsap.set(hud, { opacity: 0 });

        const tl = gsap.timeline({
          defaults: { ease: "power2.out" },
          scrollTrigger: {
            trigger: root,
            start: "top top",
            end: "+=260%",
            pin: true,
            scrub: 1,
            anticipatePin: 1,
          },
        });

        tl
          // car emerges from the dark and scales up — the hero move
          .to(car, { opacity: 1, duration: 1.2, ease: "power2.out" }, 0)
          .to(
            car,
            { scale: isDesktop ? 1.3 : 1.0, y: "-3vh", duration: 10, ease: "power2.inOut" },
            0
          )
          .to(img, { filter: "brightness(1.08) saturate(1.1)", duration: 6, ease: "power2.out" }, 0.4)
          // parallax layers — each at its own speed
          .to(bg, { yPercent: -5, scale: 1.12, duration: 10, ease: "none" }, 0)
          .to(grid, { backgroundPositionY: "+=420px", duration: 10, ease: "none" }, 0)
          .to(mega, { opacity: 1, scale: 1, duration: 3, ease: "expo.out" }, 0.5)
          .to(mega, { xPercent: -6, duration: 10, ease: "none" }, 0)
          .to(smoke.current, { current: 1, duration: 4, ease: "power2.out" }, 0)
          .to(hud, { opacity: 1, duration: 1.5, stagger: 0.2 }, 2);

        streaks.forEach((s, i) => {
          const speed = STREAKS[i].speed;
          gsap.fromTo(
            s,
            { y: "60vh", opacity: 0 },
            {
              y: `${-150 * speed}vh`,
              opacity: 0.9,
              ease: "none",
              scrollTrigger: { trigger: root, start: "top top", end: "+=260%", scrub: 0.5 },
            }
          );
        });

        tl
          // LEFT: "Twin-Turbo Inline-6" — slides in from the left, word by word
          .to(leftMeta, { opacity: 1, y: 0, duration: 1.2, stagger: 0.25 }, 3.2)
          .to(
            leftChars,
            { xPercent: 0, opacity: 1, duration: 2, ease: "expo.out", stagger: 0.45 },
            3.4
          )
          // RIGHT: "M xDrive AWD" — slides in from the right
          .to(rightMeta, { opacity: 1, y: 0, duration: 1.2, stagger: 0.25 }, 5.2)
          .to(
            rightChars,
            { xPercent: 0, opacity: 1, duration: 2, ease: "expo.out", stagger: 0.45 },
            5.4
          )
          .to({}, { duration: 1.2 }, 10);

        return () => {
          smoke.current.current = 0.25;
        };
      }
    );

    return () => mm.revert();
  }, []);

  return (
    <section
      ref={rootRef}
      id="reveal"
      className="relative w-full overflow-hidden bg-black"
      style={{ height: "100svh" }}
    >
      {/* ---------- BACKGROUND (slowest layer) ---------- */}
      <div className="rv-bg absolute inset-[-8%] will-change-transform">
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse at 50% 62%, rgba(28,105,212,0.38) 0%, rgba(0,0,0,0) 55%), radial-gradient(ellipse at 14% 18%, rgba(228,0,43,0.14), transparent 45%), radial-gradient(ellipse at 88% 24%, rgba(0,168,232,0.12), transparent 45%), #050505",
          }}
        />
        <div
          className="rv-grid absolute inset-x-0 bottom-0 h-[55%] origin-bottom"
          style={{
            transform: "perspective(520px) rotateX(64deg)",
            backgroundImage:
              "linear-gradient(rgba(0,168,232,0.28) 1px, transparent 1px), linear-gradient(90deg, rgba(0,168,232,0.28) 1px, transparent 1px)",
            backgroundSize: "72px 72px",
            WebkitMaskImage: "linear-gradient(to top, #000 10%, transparent 92%)",
            maskImage: "linear-gradient(to top, #000 10%, transparent 92%)",
          }}
        />
      </div>

      {/* giant outlined "M4" */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <span
          className="rv-mega font-display-wide text-outline select-none"
          style={{ fontSize: "clamp(14rem, 52vw, 50rem)", lineHeight: 0.8, WebkitTextStroke: "1.5px rgba(28,105,212,0.45)" }}
        >
          M4
        </span>
      </div>

      {/* ---------- SMOKE (behind car) ---------- */}
      <SmokeCanvas className="absolute inset-0 h-full w-full" intensity={smoke.current} />

      {/* ---------- CAR (middle layer — fastest scale) ---------- */}
      <div
        className="car-wrap pointer-events-none absolute top-[52%] left-1/2 -translate-x-1/2 -translate-y-1/2 will-change-transform"
        style={{ width: "min(108vw, 1180px)", mixBlendMode: "lighten" }}
      >
        <img
          src={carFront}
          alt="BMW M4 Competition front three-quarter view"
          draggable={false}
          className="car-img block h-auto w-full select-none"
          style={{
            WebkitMaskImage: "radial-gradient(ellipse 72% 70% at 50% 50%, #000 62%, transparent 100%)",
            maskImage: "radial-gradient(ellipse 72% 70% at 50% 50%, #000 62%, transparent 100%)",
          }}
        />
      </div>

      {/* ---------- FOREGROUND streaks (fastest layer) ---------- */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {STREAKS.map((s, i) => (
          <span
            key={i}
            className="rv-streak absolute top-0 w-px"
            style={{
              left: `${s.left}%`,
              height: `${s.h}vh`,
              background: `linear-gradient(to bottom, transparent, ${s.c}, transparent)`,
              boxShadow: `0 0 12px 1px ${s.c}`,
            }}
          />
        ))}
      </div>

      {/* ---------- COPY ---------- */}
      <div className="rv-left pointer-events-none absolute top-[13%] left-[5vw] z-10 max-w-[80vw] sm:top-[16%]">
        <p className="rv-meta eyebrow mb-3 text-m-light">01 — Powertrain</p>
        <h2 className="font-display-wide leading-[0.95] text-white" style={{ fontSize: "clamp(1.9rem, 5.6vw, 5.6rem)" }}>
          <SplitText text="Twin-Turbo" mode="words" as="span" className="block" />
          <SplitText text="Inline-6" mode="words" as="span" className="text-outline block" />
        </h2>
        <p className="rv-meta subtitle-thin mt-3 max-w-xs text-sm text-white/60 sm:text-base">
          3.0-litre S58. Two turbos, one purpose — 503 HP and a redline that begs to be reached.
        </p>
      </div>

      <div className="rv-right pointer-events-none absolute right-[5vw] bottom-[13%] z-10 max-w-[80vw] text-right sm:bottom-[14%]">
        <p className="rv-meta eyebrow mb-3 text-m-red">02 — Traction</p>
        <h2 className="font-display-wide leading-[0.95] text-white" style={{ fontSize: "clamp(1.9rem, 5.6vw, 5.6rem)" }}>
          <SplitText text="M xDrive" mode="words" as="span" className="block" />
          <SplitText text="AWD" mode="words" as="span" className="text-outline block" />
        </h2>
        <p className="rv-meta subtitle-thin mt-3 ml-auto max-w-xs text-sm text-white/60 sm:text-base">
          Rear-biased all-wheel drive. Every ounce of torque, planted to the tarmac.
        </p>
      </div>

      {/* HUD corners */}
      <div className="rv-hud pointer-events-none absolute top-6 right-6 z-10 hidden font-mono text-[0.62rem] tracking-[0.3em] text-white/40 uppercase sm:block">
        S58 · 2,993 cc · 8-spd M Steptronic
      </div>
      <div className="rv-hud pointer-events-none absolute bottom-6 left-6 z-10 hidden font-mono text-[0.62rem] tracking-[0.3em] text-white/40 uppercase sm:block">
        Scroll — the machine reveals itself
      </div>
    </section>
  );
}
