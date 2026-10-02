import { useLayoutEffect, useRef } from "react";
import { gsap, ScrollTrigger } from "../lib/gsap";
import SplitText from "../components/SplitText";

const R = 90;
const C = 2 * Math.PI * R;

interface Spec {
  value: number;
  decimals: number;
  unit: string;
  label: string;
  sub: string;
  ring: number;
  duration: number;
}

const SPECS: Spec[] = [
  { value: 503, decimals: 0, unit: "HP", label: "Power", sub: "3.0L twin-turbo S58", ring: 0.84, duration: 1.5 },
  { value: 3.4, decimals: 1, unit: "sec", label: "0 – 100 km/h", sub: "M xDrive launch control", ring: 0.93, duration: 2.3 },
  { value: 650, decimals: 0, unit: "Nm", label: "Torque", sub: "Peak from 2,750 rpm", ring: 0.78, duration: 2.1 },
  { value: 290, decimals: 0, unit: "km/h", label: "Top speed", sub: "With M Driver's Package", ring: 0.9, duration: 2.7 },
];

const V_LINES = [12.5, 25, 37.5, 50, 62.5, 75, 87.5];
const H_LINES = [15, 38, 62, 85];

export default function Specs() {
  const rootRef = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    const root = rootRef.current!;
    const ctx = gsap.context(() => {
      const qa = (sel: string) => gsap.utils.toArray<HTMLElement>(sel, root);

      // ---- grid lines draw themselves as you scroll ----
      gsap.set(qa(".g-v"), { scaleY: 0, transformOrigin: "50% 0%" });
      gsap.set(qa(".g-h"), { scaleX: 0, transformOrigin: "0% 50%" });
      gsap.to(qa(".g-h"), {
        scaleX: 1,
        ease: "power2.out",
        stagger: 0.15,
        scrollTrigger: { trigger: root, start: "top 85%", end: "center 55%", scrub: 1 },
      });
      gsap.to(qa(".g-v"), {
        scaleY: 1,
        ease: "power2.out",
        stagger: 0.1,
        scrollTrigger: { trigger: root, start: "top 80%", end: "center 45%", scrub: 1 },
      });

      // ---- heading ----
      const chars = qa(".sp-title .split-char");
      gsap.set(chars, { yPercent: 120, opacity: 0, rotation: 6, transformOrigin: "0% 100%" });
      gsap.set(qa(".sp-fade"), { y: 30, opacity: 0 });
      gsap
        .timeline({ scrollTrigger: { trigger: ".sp-title", start: "top 82%" } })
        .to(chars, { yPercent: 0, opacity: 1, rotation: 0, duration: 1.2, ease: "expo.out", stagger: 0.05 })
        .to(qa(".sp-fade"), { y: 0, opacity: 1, duration: 1, stagger: 0.15 }, "-=0.7");

      // ---- cards + counters (only when scrolled into view) ----
      const cards = qa(".spec-card");
      gsap.set(cards, { y: 90, opacity: 0, scale: 0.92 });
      gsap.set(qa(".ring-progress"), { strokeDashoffset: C });

      ScrollTrigger.batch(cards, {
        start: "top 86%",
        once: true,
        onEnter: (batch) => {
          batch.forEach((el, i) => {
            const card = el as HTMLElement;
            const idx = Number(card.dataset.idx);
            const spec = SPECS[idx];
            const num = card.querySelector<HTMLElement>(".spec-num")!;
            const ring = card.querySelector<SVGCircleElement>(".ring-progress")!;
            const dot = card.querySelector<SVGCircleElement>(".ring-dot")!;
            const state = { v: 0 };
            const tl = gsap.timeline({ delay: i * 0.14 });
            tl.to(card, { y: 0, opacity: 1, scale: 1, duration: 1.1, ease: "expo.out" }, 0)
              .to(
                state,
                {
                  v: spec.value,
                  duration: spec.duration,
                  ease: "power3.out",
                  onUpdate: () => {
                    num.textContent = state.v.toFixed(spec.decimals);
                  },
                },
                0.15
              )
              .to(
                ring,
                { strokeDashoffset: C * (1 - spec.ring), duration: spec.duration, ease: "power3.out" },
                0.15
              )
              .to(
                dot,
                { rotation: 360 * spec.ring, svgOrigin: "100 100", duration: spec.duration, ease: "power3.out" },
                0.15
              )
              // glow pulse at the end of the count
              .fromTo(
                num,
                { textShadow: "0 0 0px rgba(0,168,232,0)" },
                {
                  textShadow: "0 0 36px rgba(0,168,232,1), 0 0 100px rgba(28,105,212,0.9)",
                  duration: 0.45,
                  ease: "power2.out",
                  yoyo: true,
                  repeat: 1,
                  onComplete: () => {
                    if (idx === 0) num.classList.add("glow-pulse");
                  },
                },
                `>-0.05`
              )
              .fromTo(
                ring,
                { filter: "drop-shadow(0 0 0px rgba(0,168,232,0))" },
                {
                  filter: "drop-shadow(0 0 10px rgba(0,168,232,0.95))",
                  duration: 0.45,
                  yoyo: true,
                  repeat: 1,
                  ease: "power2.out",
                },
                "<"
              );
          });
        },
      });

      // subtle parallax on the cards' rings
      qa(".spec-ring").forEach((el, i) => {
        gsap.to(el, {
          yPercent: i % 2 === 0 ? -8 : 8,
          ease: "none",
          scrollTrigger: { trigger: el, start: "top bottom", end: "bottom top", scrub: true },
        });
      });
    }, root);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={rootRef} id="specs" className="relative overflow-hidden bg-[#060606] py-[14vh]">
      {/* self-drawing grid */}
      <div className="pointer-events-none absolute inset-0">
        {V_LINES.map((l) => (
          <span key={l} className="g-v absolute top-0 h-full w-px bg-gradient-to-b from-m-blue/40 via-m-blue/15 to-transparent" style={{ left: `${l}%` }} />
        ))}
        {H_LINES.map((l) => (
          <span key={l} className="g-h absolute left-0 h-px w-full bg-gradient-to-r from-m-light/35 via-m-blue/15 to-transparent" style={{ top: `${l}%` }} />
        ))}
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse at 50% 0%, rgba(28,105,212,0.2), transparent 55%), radial-gradient(ellipse at 50% 100%, rgba(228,0,43,0.1), transparent 55%)",
          }}
        />
      </div>

      <div className="relative z-10 mx-auto max-w-[1400px] px-5 sm:px-8">
        <div className="mb-[9vh] text-center">
          <p className="sp-fade eyebrow mb-5 text-m-light">03 — Performance</p>
          <h2 className="sp-title font-display-wide text-white" style={{ fontSize: "clamp(2.4rem, 8vw, 7.5rem)" }}>
            <SplitText text="PURE NUMBERS" as="span" />
          </h2>
          <p className="sp-fade subtitle-thin mx-auto mt-5 max-w-xl text-white/60" style={{ fontSize: "clamp(0.95rem, 1.4vw, 1.25rem)" }}>
            Figures that don't need an introduction. Engineered on the Nürburgring, proven everywhere else.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-y-14 sm:grid-cols-2 lg:grid-cols-4 lg:gap-x-4">
          {SPECS.map((s, i) => (
            <div key={s.label} data-idx={i} className="spec-card flex flex-col items-center text-center">
              <div className="spec-ring relative aspect-square w-[min(68vw,290px)]">
                <svg viewBox="0 0 200 200" className="absolute inset-0 h-full w-full -rotate-90 overflow-visible">
                  <defs>
                    <linearGradient id={`ring-grad-${i}`} x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0" stopColor="#1c69d4" />
                      <stop offset="0.6" stopColor="#00a8e8" />
                      <stop offset="1" stopColor="#7fd8ff" />
                    </linearGradient>
                  </defs>
                  <circle cx="100" cy="100" r={R + 8} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="1" strokeDasharray="2 6" />
                  <circle cx="100" cy="100" r={R} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="5" />
                  <circle
                    className="ring-progress"
                    cx="100"
                    cy="100"
                    r={R}
                    fill="none"
                    stroke={`url(#ring-grad-${i})`}
                    strokeWidth="5"
                    strokeLinecap="round"
                    strokeDasharray={C}
                    strokeDashoffset={C}
                  />
                  <circle className="ring-dot" cx={100 + R} cy="100" r="4.5" fill="#fff" style={{ filter: "drop-shadow(0 0 6px #00a8e8)" }} />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span
                    className="spec-num font-display-wide text-white tabular-nums"
                    style={{ fontSize: "clamp(3rem, 6.2vw, 5.4rem)", letterSpacing: "-0.03em" }}
                  >
                    {(0).toFixed(s.decimals)}
                  </span>
                  <span className="font-mono text-xs tracking-[0.4em] text-m-light uppercase">{s.unit}</span>
                </div>
              </div>
              <h3 className="font-display-cond mt-6 text-2xl tracking-[0.12em] text-white sm:text-3xl">{s.label}</h3>
              <p className="subtitle-thin mt-1 text-sm text-white/50">{s.sub}</p>
              <span className="m-stripe mt-4 block h-[3px] w-12 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
