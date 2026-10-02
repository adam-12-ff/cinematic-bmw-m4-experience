import { useLayoutEffect, useRef, type CSSProperties, type ReactNode } from "react";
import { gsap, ScrollTrigger } from "../lib/gsap";
import SplitText from "../components/SplitText";
import imgSide from "../assets/m4-side.jpg";
import imgRoof from "../assets/m4-roof.jpg";
import imgInterior from "../assets/m4-interior.jpg";
import imgBrake from "../assets/m4-brake.jpg";
import imgExhaust from "../assets/m4-exhaust.jpg";

interface PanelData {
  title: string;
  kicker: string;
  desc: string;
  chips: string[];
  img: string;
  accent: string;
  position: string;
  textPos: "top" | "bottom";
  extra: ReactNode;
  /** nudge the photo so the copy doesn't sit on top of the subject */
  imgShift?: boolean;
}

const FLOW_PATHS = [
  { d: "M -100 150 C 500 150, 900 100, 1700 160", delay: 0, dur: 2.8, w: 2 },
  { d: "M -100 250 C 400 250, 600 190, 900 200 S 1400 260, 1700 250", delay: 0.3, dur: 2.4, w: 2.5 },
  { d: "M -100 320 C 300 320, 520 230, 860 240 S 1300 330, 1700 320", delay: 0.8, dur: 2.6, w: 2 },
  { d: "M -100 420 C 400 420, 700 400, 1100 410 S 1500 430, 1700 420", delay: 1.2, dur: 3, w: 1.5 },
  { d: "M -100 650 C 500 660, 900 690, 1700 650", delay: 0.5, dur: 2.7, w: 2 },
  { d: "M -100 730 C 400 730, 900 750, 1700 725", delay: 1.4, dur: 3.1, w: 2.5 },
  { d: "M -100 90 C 300 90, 800 40, 1700 80", delay: 1.9, dur: 3.3, w: 1.5 },
];

// Smoke rises from the quad tips (image is nudged right by ~12%, so the tips sit near 52% and 72%)
const PUFFS = [
  { l: 51, b: 33, s: 110, dx: -30, delay: 0 },
  { l: 55, b: 32, s: 140, dx: -10, delay: 1.1 },
  { l: 53, b: 34, s: 120, dx: -22, delay: 2.4 },
  { l: 49, b: 31, s: 160, dx: -36, delay: 3.4 },
  { l: 71, b: 33, s: 110, dx: 30, delay: 0.5 },
  { l: 74, b: 32, s: 140, dx: 14, delay: 1.7 },
  { l: 72, b: 34, s: 120, dx: 24, delay: 2.9 },
  { l: 76, b: 31, s: 160, dx: 38, delay: 4 },
  { l: 62, b: 36, s: 190, dx: 0, delay: 1.4 },
];

const PANELS: PanelData[] = [
  {
    title: "AERODYNAMICS",
    kicker: "Chapter 01 — Airflow",
    desc: "Active cooling flaps, a carbon rear spoiler and a flat, M-tuned underbody — engineered to keep 503 HP glued to the tarmac at 290 km/h.",
    chips: ["Active air flaps", "Carbon spoiler", "Flat underbody"],
    img: imgSide,
    accent: "#00a8e8",
    position: "50% 50%",
    textPos: "top",
    extra: (
      <svg viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice" className="pointer-events-none absolute inset-0 h-full w-full">
        <defs>
          <linearGradient id="flow-grad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#00a8e8" stopOpacity="0" />
            <stop offset="0.5" stopColor="#bfeaff" />
            <stop offset="1" stopColor="#1c69d4" stopOpacity="0" />
          </linearGradient>
        </defs>
        {FLOW_PATHS.map((p, i) => (
          <path
            key={i}
            d={p.d}
            pathLength={400}
            fill="none"
            stroke="url(#flow-grad)"
            strokeWidth={p.w}
            strokeLinecap="round"
            className="airflow"
            style={{
              animationDelay: `${p.delay}s`,
              animationDuration: `${p.dur}s`,
              filter: "drop-shadow(0 0 6px rgba(0,168,232,0.9))",
            }}
          />
        ))}
      </svg>
    ),
  },
  {
    title: "CARBON FIBER ROOF",
    kicker: "Chapter 02 — Lightweight",
    desc: "A hand-laid carbon-fibre roof drops weight where it matters most — high up — lowering the centre of gravity and sharpening every turn-in.",
    chips: ["CFRP roof", "Lower centre of gravity", "Deep clear-coat"],
    img: imgRoof,
    accent: "#1c69d4",
    position: "50% 40%",
    textPos: "bottom",
    extra: (
      <>
        <div
          className="pointer-events-none absolute inset-0 opacity-70 mix-blend-overlay"
          style={{
            backgroundImage:
              "repeating-linear-gradient(45deg, rgba(255,255,255,0.07) 0 4px, transparent 4px 8px), repeating-linear-gradient(-45deg, rgba(0,0,0,0.35) 0 4px, transparent 4px 8px)",
          }}
        />
        <div className="roof-sheen pointer-events-none absolute inset-y-0 -left-1/4 w-1/2 mix-blend-screen" style={{ background: "linear-gradient(105deg, transparent 30%, rgba(0,168,232,0.35) 50%, transparent 70%)" }} />
      </>
    ),
  },
  {
    title: "M CARBON BUCKET SEATS",
    kicker: "Chapter 03 — Cockpit",
    desc: "Motorsport-grade carbon shells that hold you through every apex. M tricolour belts, illuminated M badges — the office, redefined.",
    chips: ["Carbon shells", "M tricolour belts", "Illuminated badge"],
    img: imgInterior,
    accent: "#e4002b",
    position: "50% 50%",
    textPos: "bottom",
    extra: null,
  },
  {
    title: "M COMPOUND BRAKES",
    kicker: "Chapter 04 — Stopping Power",
    desc: "Six-piston fixed calipers clamp cross-drilled discs. When the engine writes the cheque, these cash it — again and again, lap after lap.",
    chips: ["6-piston front", "Cross-drilled discs", "Red M calipers"],
    img: imgBrake,
    accent: "#e4002b",
    position: "50% 50%",
    textPos: "bottom",
    extra: (
      <>
        <div
          className="red-throb pointer-events-none absolute top-1/2 left-1/2 aspect-square w-[85vmin] -translate-x-1/2 -translate-y-1/2 rounded-full mix-blend-screen"
          style={{ background: "radial-gradient(circle, rgba(255,40,60,0.55) 0%, rgba(228,0,43,0.3) 30%, rgba(228,0,43,0.08) 55%, transparent 70%)", filter: "blur(10px)" }}
        />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_55%,transparent_30%,rgba(60,0,8,0.6)_100%)]" />
      </>
    ),
  },
  {
    title: "QUAD EXHAUST TIPS",
    kicker: "Chapter 05 — Voice",
    desc: "Four tips, one flap, a soundtrack that rattles windows. Crackle on the overrun, thunder on the throttle — the M4 doesn't whisper.",
    chips: ["Active M exhaust", "Quad tips", "Overrun crackle"],
    img: imgExhaust,
    accent: "#ff8a1e",
    position: "50% 55%",
    textPos: "bottom",
    imgShift: true,
    extra: (
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {PUFFS.map((p, i) => (
          <span
            key={i}
            className="smoke-puff"
            style={
              {
                left: `${p.l}%`,
                bottom: `${p.b}%`,
                width: p.s,
                height: p.s,
                marginLeft: -p.s / 2,
                "--dx": `${p.dx}px`,
                animationDelay: `${p.delay}s`,
              } as CSSProperties
            }
          />
        ))}
      </div>
    ),
  },
];

export default function Gallery() {
  const rootRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const root = rootRef.current!;
    const track = trackRef.current!;
    const ctx = gsap.context(() => {
      const panels = gsap.utils.toArray<HTMLElement>(".gal-panel", root);
      const bar = root.querySelector<HTMLElement>(".gal-bar")!;
      const counter = root.querySelector<HTMLElement>(".gal-count")!;
      const label = root.querySelector<HTMLElement>(".gal-label")!;
      const mult = window.innerWidth < 768 ? 1.5 : 1;
      const dist = () => track.scrollWidth - window.innerWidth;

      gsap.set(bar, { scaleX: 0, transformOrigin: "0% 50%" });

      // THE horizontal pin: vertical scroll → horizontal travel
      const scrollTween = gsap.to(track, {
        x: () => -dist(),
        ease: "none",
        scrollTrigger: {
          trigger: root,
          pin: true,
          scrub: 1,
          start: "top top",
          end: () => `+=${dist() * mult}`,
          invalidateOnRefresh: true,
          anticipatePin: 1,
          onUpdate: (self) => {
            bar.style.transform = `scaleX(${self.progress})`;
            const i = Math.min(PANELS.length - 1, Math.round(self.progress * (PANELS.length - 1)));
            counter.textContent = String(i + 1).padStart(2, "0");
            label.textContent = PANELS[i].title;
          },
        },
      });

      panels.forEach((panel, i) => {
        const img = panel.querySelector<HTMLElement>(".panel-img")!;
        const imgWrap = panel.querySelector<HTMLElement>(".panel-img-wrap")!;
        const chars = gsap.utils.toArray<HTMLElement>(".panel-title .split-char", panel);
        const rest = gsap.utils.toArray<HTMLElement>(".panel-rest", panel);
        const bigNum = panel.querySelector<HTMLElement>(".panel-num")!;

        gsap.set(chars, { yPercent: 125, opacity: 0, rotation: 5, transformOrigin: "0% 100%" });
        gsap.set(rest, { y: 46, opacity: 0 });

        const textTl = gsap
          .timeline({
            paused: true,
            defaults: { ease: "expo.out" },
          })
          .to(chars, { yPercent: 0, opacity: 1, rotation: 0, duration: 1.2, stagger: 0.035 })
          .to(rest, { y: 0, opacity: 1, duration: 1, stagger: 0.12, ease: "power3.out" }, "-=0.8");

        if (i === 0) {
          // first panel is already in view when the pin begins
          gsap.fromTo(
            img,
            { scale: 1.25 },
            { scale: 1, ease: "none", scrollTrigger: { trigger: root, start: "top bottom", end: "top top", scrub: true } }
          );
          gsap.fromTo(
            imgWrap,
            { xPercent: 0 },
            {
              xPercent: -8,
              ease: "none",
              scrollTrigger: { trigger: panel, containerAnimation: scrollTween, start: "left left", end: "right left", scrub: true },
            }
          );
          gsap.fromTo(
            bigNum,
            { xPercent: 0 },
            {
              xPercent: -60,
              ease: "none",
              scrollTrigger: { trigger: panel, containerAnimation: scrollTween, start: "left left", end: "right left", scrub: true },
            }
          );
          ScrollTrigger.create({
            trigger: root,
            start: "top 55%",
            onEnter: () => textTl.play(),
            onLeaveBack: () => textTl.reverse(),
          });
        } else {
          // image zooms slightly on enter
          gsap.fromTo(
            img,
            { scale: 1.3 },
            {
              scale: 1,
              ease: "none",
              scrollTrigger: { trigger: panel, containerAnimation: scrollTween, start: "left right", end: "left 15%", scrub: true },
            }
          );
          // true parallax — image drifts slower than the panel
          gsap.fromTo(
            imgWrap,
            { xPercent: 9 },
            {
              xPercent: -9,
              ease: "none",
              scrollTrigger: { trigger: panel, containerAnimation: scrollTween, start: "left right", end: "right left", scrub: true },
            }
          );
          gsap.fromTo(
            bigNum,
            { xPercent: 90 },
            {
              xPercent: -60,
              ease: "none",
              scrollTrigger: { trigger: panel, containerAnimation: scrollTween, start: "left right", end: "right left", scrub: true },
            }
          );
          // text fades up with stagger
          ScrollTrigger.create({
            trigger: panel,
            containerAnimation: scrollTween,
            start: "left 62%",
            onEnter: () => textTl.play(),
            onLeaveBack: () => textTl.reverse(),
          });
        }

        // panel 3 — interior slides in with a clip-path reveal
        if (i === 2) {
          gsap.fromTo(
            panel.querySelector(".panel-img-wrap"),
            { clipPath: "inset(0% 0% 0% 100%)" },
            {
              clipPath: "inset(0% 0% 0% 0%)",
              ease: "power2.out",
              scrollTrigger: { trigger: panel, containerAnimation: scrollTween, start: "left 100%", end: "left 25%", scrub: true },
            }
          );
        }
        // panel 2 — roof gets an extra wipe on its copy rule
        if (i === 1) {
          gsap.fromTo(
            panel.querySelector(".panel-rule"),
            { scaleX: 0 },
            {
              scaleX: 1,
              transformOrigin: "0% 50%",
              ease: "expo.out",
              duration: 1.6,
              scrollTrigger: { trigger: panel, containerAnimation: scrollTween, start: "left 60%", toggleActions: "play none none reverse" },
            }
          );
        }
      });

      // roof sheen sweep
      gsap.fromTo(
        ".roof-sheen",
        { xPercent: -100 },
        { xPercent: 400, duration: 3.6, repeat: -1, repeatDelay: 1.4, ease: "power2.inOut" }
      );
    }, root);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={rootRef} id="gallery" className="relative w-full overflow-hidden bg-black" style={{ height: "100svh" }}>
      {/* progress */}
      <div className="absolute top-0 right-0 left-0 z-30 h-[3px] bg-white/10">
        <div className="gal-bar m-stripe h-full w-full" style={{ boxShadow: "0 0 14px rgba(0,168,232,0.8)" }} />
      </div>
      <div className="pointer-events-none absolute top-5 right-5 z-30 flex items-baseline gap-2 font-mono text-white sm:top-7 sm:right-8">
        <span className="gal-count text-2xl font-medium">01</span>
        <span className="text-xs text-white/40">/ 05</span>
      </div>
      <div className="pointer-events-none absolute top-6 left-5 z-30 hidden items-center gap-3 font-mono text-[0.62rem] tracking-[0.3em] text-white/50 uppercase sm:flex sm:left-8 sm:top-8">
        <span className="m-stripe h-[3px] w-8" />
        <span className="gal-label">AERODYNAMICS</span>
      </div>

      <div ref={trackRef} className="flex h-full will-change-transform" style={{ width: `${PANELS.length * 100}vw` }}>
        {PANELS.map((p, i) => (
          <article key={p.title} className="gal-panel relative h-full w-screen shrink-0 overflow-hidden bg-black">
            <div className="panel-img-wrap absolute -inset-x-[12%] -inset-y-[4%] will-change-transform">
              <img
                src={p.img}
                alt={p.title}
                draggable={false}
                className={`panel-img h-full w-full object-cover select-none ${p.imgShift ? "translate-x-[12%]" : ""}`}
                style={{
                  objectPosition: p.position,
                  ...(p.imgShift
                    ? {
                        WebkitMaskImage: "linear-gradient(to right, transparent 0%, #000 26%)",
                        maskImage: "linear-gradient(to right, transparent 0%, #000 26%)",
                      }
                    : null),
                }}
              />
            </div>

            {p.extra}

            {/* legibility gradients */}
            <div
              className="pointer-events-none absolute inset-0"
              style={{
                background:
                  p.textPos === "top"
                    ? "linear-gradient(to bottom, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.35) 38%, rgba(0,0,0,0.15) 60%, rgba(0,0,0,0.7) 100%)"
                    : "linear-gradient(to top, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.55) 36%, rgba(0,0,0,0.12) 70%, rgba(0,0,0,0.5) 100%)",
              }}
            />
            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(0,0,0,0.65)_0%,transparent_55%)]" />

            {/* big ghost numeral — moves at its own speed */}
            <span
              className="panel-num font-display-wide text-outline pointer-events-none absolute top-[14%] right-[-4%] select-none"
              style={{ fontSize: "clamp(10rem, 34vw, 32rem)", lineHeight: 0.8, WebkitTextStroke: `1.5px ${p.accent}55` }}
            >
              0{i + 1}
            </span>

            {/* copy */}
            <div
              className={`absolute left-[6vw] z-10 w-[88vw] max-w-[1100px] ${p.textPos === "top" ? "top-[14vh]" : "bottom-[10vh]"}`}
            >
              <p className="panel-rest eyebrow mb-4 flex items-center gap-3" style={{ color: p.accent }}>
                <span className="inline-block h-[2px] w-8" style={{ background: p.accent }} />
                {p.kicker}
              </p>
              <h2 className="panel-title font-display-wide max-w-[14ch] text-white" style={{ fontSize: "clamp(2.1rem, 6.6vw, 6.8rem)" }}>
                <SplitText text={p.title} as="span" />
              </h2>
              <span className="panel-rule m-stripe mt-5 block h-[3px] w-24 sm:w-40" />
              <p className="panel-rest subtitle-thin mt-5 max-w-[34rem] text-white/75" style={{ fontSize: "clamp(0.9rem, 1.25vw, 1.15rem)" }}>
                {p.desc}
              </p>
              <ul className="mt-5 flex flex-wrap gap-2">
                {p.chips.map((c) => (
                  <li
                    key={c}
                    className="panel-rest rounded-full border border-white/20 bg-black/40 px-3.5 py-1.5 font-mono text-[0.62rem] tracking-[0.2em] text-white/80 uppercase backdrop-blur-md"
                  >
                    {c}
                  </li>
                ))}
              </ul>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
