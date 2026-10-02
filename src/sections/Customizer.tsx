import { useLayoutEffect, useRef, useState } from "react";
import { gsap } from "../lib/gsap";
import SplitText from "../components/SplitText";
import carSide from "../assets/m4-side.jpg";

interface PaintColor {
  name: string;
  swatch: string;
  glow: string;
  filter: string;
}

/** The base photo is Frozen Portimao Blue (~hue 220°). Other finishes are derived with hue-rotate + tone filters. */
const COLORS: PaintColor[] = [
  { name: "Alpine White", swatch: "#eeeeea", glow: "#cfe0ff", filter: "saturate(0) brightness(2.1) contrast(0.9)" },
  { name: "Black Sapphire", swatch: "#0a1124", glow: "#2c4a9a", filter: "saturate(0.4) brightness(0.34) contrast(1.3)" },
  { name: "Isle of Man Green", swatch: "#1c7048", glow: "#19c26f", filter: "hue-rotate(-72deg) saturate(1.15) brightness(0.92)" },
  { name: "Sao Paulo Yellow", swatch: "#f6c500", glow: "#ffd21a", filter: "hue-rotate(-168deg) saturate(1.7) brightness(1.28)" },
  { name: "Frozen Portimao Blue", swatch: "#1c69d4", glow: "#1c69d4", filter: "none" },
];

const INITIAL = 4;

export default function Customizer() {
  const rootRef = useRef<HTMLElement>(null);
  const select = useRef<((i: number) => void) | null>(null);
  const [selected, setSelected] = useState(INITIAL);

  useLayoutEffect(() => {
    const root = rootRef.current!;
    const ctx = gsap.context(() => {
      const q = <T extends Element = HTMLElement>(s: string) => root.querySelector<T>(s)!;
      const qa = (s: string) => gsap.utils.toArray<HTMLElement>(s, root);

      const inner = q(".cz-inner");
      const layers = qa(".cz-layer");
      const glows = qa(".cz-glow");
      const nameEl = q(".cz-name");
      const stage = q(".cz-stage");
      let active = 0;
      let nameTween: gsap.core.Tween | null = null;

      layers[0].style.filter = COLORS[INITIAL].filter;
      gsap.set(layers[0], { opacity: 1, zIndex: 2 });
      gsap.set(layers[1], { opacity: 0, zIndex: 1 });
      gsap.set(glows, { backgroundColor: COLORS[INITIAL].glow });

      const typeName = (name: string) => {
        nameTween?.kill();
        const o = { n: 0 };
        nameEl.textContent = "";
        nameTween = gsap.to(o, {
          n: name.length,
          duration: Math.max(0.4, name.length * 0.055),
          ease: `steps(${name.length})`,
          onUpdate: () => {
            nameEl.textContent = name.slice(0, Math.round(o.n));
          },
        });
      };

      select.current = (i: number) => {
        const c = COLORS[i];
        const cur = layers[active];
        const nxt = layers[1 - active];
        gsap.killTweensOf([cur, nxt]);
        gsap.set(cur, { opacity: 1, zIndex: 1 });
        gsap.set(nxt, { opacity: 0, zIndex: 2 });
        nxt.style.filter = c.filter;
        gsap.to(nxt, { opacity: 1, duration: 0.95, ease: "power2.inOut" });
        active = 1 - active;

        // ambient glow follows the paint
        gsap.to(glows, { backgroundColor: c.glow, duration: 1.2, ease: "power2.out", overwrite: "auto" });
        // little "pulse" on the car
        gsap.fromTo(stage, { scale: 1.035 }, { scale: 1, duration: 1.2, ease: "expo.out", overwrite: "auto" });
        typeName(c.name);
      };

      // ---- entrance: the whole section fades + scales in as you scroll ----
      gsap.fromTo(
        inner,
        { opacity: 0, scale: 0.88, y: 90 },
        {
          opacity: 1,
          scale: 1,
          y: 0,
          ease: "power2.out",
          scrollTrigger: { trigger: root, start: "top 88%", end: "top 28%", scrub: 1 },
        }
      );

      // heading DROPS in from the top
      const chars = qa(".cz-title .split-char");
      gsap.set(chars, { yPercent: -170, opacity: 0, rotation: -6, transformOrigin: "50% 100%" });
      gsap.set(qa(".cz-fade"), { y: 30, opacity: 0 });
      gsap.set(stage, { xPercent: -14, opacity: 0 });
      gsap.set(qa(".cz-swatch"), { scale: 0, opacity: 0 });
      gsap.set(qa(".cz-name-row"), { opacity: 0 });

      gsap
        .timeline({ scrollTrigger: { trigger: ".cz-title", start: "top 75%", once: true } })
        .to(chars, { yPercent: 0, opacity: 1, rotation: 0, duration: 1.4, ease: "back.out(1.5)", stagger: 0.06 })
        .to(qa(".cz-fade"), { y: 0, opacity: 1, duration: 1, stagger: 0.12 }, "-=0.9")
        .to(stage, { xPercent: 0, opacity: 1, duration: 1.8, ease: "expo.out" }, "-=1.2")
        .to(qa(".cz-swatch"), { scale: 1, opacity: 1, duration: 0.8, ease: "back.out(2.2)", stagger: 0.09 }, "-=1")
        .to(qa(".cz-name-row"), { opacity: 1, duration: 0.4 }, "-=0.5")
        .call(() => typeName(COLORS[INITIAL].name), [], "<");

      // car parallax against the glow
      gsap.to(".cz-stage-wrap", {
        yPercent: -7,
        ease: "none",
        scrollTrigger: { trigger: root, start: "top bottom", end: "bottom top", scrub: true },
      });
      gsap.to(".cz-glow-big", {
        yPercent: 12,
        ease: "none",
        scrollTrigger: { trigger: root, start: "top bottom", end: "bottom top", scrub: true },
      });
    }, root);

    return () => {
      select.current = null;
      ctx.revert();
    };
  }, []);

  const pick = (i: number) => {
    if (i === selected) return;
    setSelected(i);
    select.current?.(i);
  };

  return (
    <section ref={rootRef} id="customizer" className="relative overflow-hidden bg-[#050505] py-[14vh]">
      {/* ambient glow (changes colour with the paint) */}
      <div
        className="cz-glow cz-glow-big pointer-events-none absolute top-[18%] left-1/2 h-[90vh] w-[130vw] -translate-x-1/2 opacity-[0.28]"
        style={{
          backgroundColor: COLORS[INITIAL].glow,
          WebkitMaskImage: "radial-gradient(ellipse at center, #000 0%, transparent 62%)",
          maskImage: "radial-gradient(ellipse at center, #000 0%, transparent 62%)",
          filter: "blur(30px)",
        }}
      />

      <div className="cz-inner relative z-10 mx-auto max-w-[1300px] px-5 text-center sm:px-8">
        <p className="cz-fade eyebrow mb-5 text-m-light">06 — Individual</p>
        <h2 className="cz-title font-display-wide text-white" style={{ fontSize: "clamp(2.4rem, 9vw, 8.5rem)" }}>
          <SplitText text="MAKE IT YOURS" as="span" />
        </h2>
        <p className="cz-fade subtitle-thin mx-auto mt-5 max-w-xl text-white/60" style={{ fontSize: "clamp(0.95rem, 1.4vw, 1.25rem)" }}>
          Five finishes. One attitude. Choose the colour that matches your intentions.
        </p>

        {/* car stage */}
        <div className="cz-stage-wrap relative mx-auto mt-[4vh] w-[min(98vw,1100px)]">
          <div
            className="cz-glow pointer-events-none absolute top-[48%] left-1/2 h-[72%] w-[78%] -translate-x-1/2 -translate-y-1/2 opacity-[0.5]"
            style={{
              backgroundColor: COLORS[INITIAL].glow,
              WebkitMaskImage: "radial-gradient(ellipse at center, #000 0%, transparent 68%)",
              maskImage: "radial-gradient(ellipse at center, #000 0%, transparent 68%)",
              filter: "blur(40px)",
            }}
          />
          <div className="cz-stage relative aspect-[16/9] w-full will-change-transform">
            {[0, 1].map((n) => (
              <img
                key={n}
                src={carSide}
                alt={n === 0 ? "BMW M4 Competition in your chosen colour" : ""}
                aria-hidden={n === 1}
                draggable={false}
                className="cz-layer absolute inset-0 h-full w-full object-contain select-none"
                style={{
                  WebkitMaskImage: "radial-gradient(ellipse 80% 76% at 50% 50%, #000 66%, transparent 100%)",
                  maskImage: "radial-gradient(ellipse 80% 76% at 50% 50%, #000 66%, transparent 100%)",
                  opacity: n === 0 ? 1 : 0,
                }}
              />
            ))}
          </div>
        </div>

        {/* swatches */}
        <div className="relative z-10 mt-2 flex flex-wrap items-start justify-center gap-x-5 gap-y-6 sm:gap-x-9" role="radiogroup" aria-label="Paint colour">
          {COLORS.map((c, i) => (
            <button
              key={c.name}
              type="button"
              role="radio"
              aria-checked={selected === i}
              aria-label={c.name}
              onClick={() => pick(i)}
              className="cz-swatch group flex w-[4.2rem] flex-col items-center gap-3 sm:w-24"
            >
              <span className="relative block h-12 w-12 sm:h-14 sm:w-14">
                <span
                  className={`absolute -inset-2 rounded-full border-2 transition-all duration-500 ${
                    selected === i ? "scale-100 border-white opacity-100" : "scale-75 border-white/40 opacity-0 group-hover:scale-100 group-hover:opacity-100"
                  }`}
                />
                <span
                  className="absolute inset-0 rounded-full transition-transform duration-500 group-hover:scale-110 group-active:scale-95"
                  style={{
                    background: `radial-gradient(circle at 30% 24%, rgba(255,255,255,0.65), transparent 42%), ${c.swatch}`,
                    boxShadow: `0 0 ${selected === i ? 34 : 14}px ${c.glow}${selected === i ? "bb" : "55"}, inset 0 -6px 12px rgba(0,0,0,0.4)`,
                    border: "1px solid rgba(255,255,255,0.18)",
                  }}
                />
              </span>
              <span
                className={`font-mono text-[0.55rem] leading-tight tracking-[0.16em] uppercase transition-colors duration-500 sm:text-[0.62rem] ${
                  selected === i ? "text-white" : "text-white/40 group-hover:text-white/70"
                }`}
              >
                {c.name}
              </span>
            </button>
          ))}
        </div>

        {/* typewriter */}
        <div className="cz-name-row mt-10 flex flex-col items-center gap-2">
          <span className="eyebrow text-white/40">Selected finish</span>
          <div className="flex min-h-[2.6rem] items-center justify-center">
            <span className="cz-name font-display-wide text-white" style={{ fontSize: "clamp(1.4rem, 3.6vw, 2.8rem)" }} aria-live="polite" />
            <span className="caret ml-1 inline-block h-[1.1em] w-[3px] translate-y-[1px] bg-m-light" style={{ fontSize: "clamp(1.4rem, 3.6vw, 2.8rem)" }} />
          </div>
        </div>
      </div>
    </section>
  );
}
