import { useLayoutEffect, useRef, type PointerEvent as RPointerEvent } from "react";
import { ArrowRight } from "lucide-react";
import { gsap } from "../lib/gsap";
import SplitText from "../components/SplitText";
import carSide from "../assets/m4-side.jpg";
import road from "../assets/road.jpg";

const SPEED_LINES = [
  { top: 22, w: 34, o: 0.5 },
  { top: 34, w: 22, o: 0.35 },
  { top: 46, w: 40, o: 0.6 },
  { top: 58, w: 28, o: 0.45 },
  { top: 66, w: 36, o: 0.55 },
  { top: 74, w: 24, o: 0.4 },
  { top: 82, w: 42, o: 0.6 },
  { top: 90, w: 30, o: 0.35 },
];

export default function Cta({ onBook }: { onBook: () => void }) {
  const rootRef = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    const root = rootRef.current!;
    const ctx = gsap.context(() => {
      const q = (s: string) => root.querySelector<HTMLElement>(s)!;
      const qa = (s: string) => gsap.utils.toArray<HTMLElement>(s, root);

      const car = q(".cta-car");
      const trail = q(".cta-trail");
      const bg = q(".cta-bg");
      const lines = qa(".cta-line");
      const chars = qa(".cta-title .split-char");
      const sub = q(".cta-sub");
      const btn = q(".cta-btn-wrap");
      const glow = q(".cta-glow");
      const hint = q(".cta-hint");

      gsap.set(chars, { yPercent: 125, opacity: 0, rotation: 7, transformOrigin: "0% 100%" });
      gsap.set(sub, { y: 40, opacity: 0 });
      gsap.set(btn, { autoAlpha: 0, y: 40, scale: 0.9 });
      gsap.set(trail, { scaleX: 0, transformOrigin: "100% 50%" });
      gsap.set(lines, { x: "40vw", opacity: 0 });
      gsap.set(glow, { opacity: 0, scale: 0.6 });

      const tl = gsap.timeline({
        defaults: { ease: "power3.out" },
        scrollTrigger: {
          trigger: root,
          start: "top top",
          end: "+=240%",
          pin: true,
          scrub: 1,
          anticipatePin: 1,
        },
      });

      tl
        // road dollies forward the entire time
        .to(bg, { scale: 1.3, duration: 10, ease: "none" }, 0)
        .to(hint, { opacity: 0, duration: 1 }, 0.4)
        // the car pulls away — accelerating, shrinking into the distance, motion-blurring
        .to(trail, { scaleX: 1, duration: 2.5, ease: "power2.out" }, 0.6)
        .to(
          car,
          { x: "128vw", scale: 0.72, duration: 5.2, ease: "power3.in" },
          0.8
        )
        .to(car, { filter: "blur(7px) brightness(1.3)", duration: 3, ease: "power2.in" }, 3)
        .to(car, { opacity: 0, duration: 0.8, ease: "power1.in" }, 5.4)
        .to(
          lines,
          { x: "-170vw", opacity: 1, duration: 4.2, ease: "power2.in", stagger: { each: 0.12, from: "random" } },
          1.2
        )
        .to(lines, { opacity: 0, duration: 0.6 }, 5.6)
        .to(glow, { opacity: 1, scale: 1, duration: 3, ease: "expo.out" }, 5)
        // now the headline
        .to(
          chars,
          { yPercent: 0, opacity: 1, rotation: 0, duration: 1.4, ease: "expo.out", stagger: { each: 0.07, ease: "power2.out" } },
          5.6
        )
        .to(sub, { y: 0, opacity: 1, duration: 1.2 }, 7.4)
        .to(btn, { autoAlpha: 1, y: 0, scale: 1, duration: 1.2, ease: "back.out(1.6)" }, 8.1)
        .to({}, { duration: 1.4 }, 9.4);

      // Ambient button breathing (independent of scroll)
      gsap.to(".cta-btn-halo", { opacity: 0.9, scale: 1.12, duration: 1.4, ease: "sine.inOut", yoyo: true, repeat: -1 });
    }, root);

    return () => ctx.revert();
  }, []);

  const ripple = (e: RPointerEvent<HTMLButtonElement>) => {
    const btn = e.currentTarget;
    const r = btn.getBoundingClientRect();
    const size = Math.max(r.width, r.height) * 2.2;
    const s = document.createElement("span");
    Object.assign(s.style, {
      position: "absolute",
      left: `${e.clientX - r.left - size / 2}px`,
      top: `${e.clientY - r.top - size / 2}px`,
      width: `${size}px`,
      height: `${size}px`,
      borderRadius: "9999px",
      pointerEvents: "none",
      background: "radial-gradient(circle, rgba(0,168,232,0.7) 0%, rgba(28,105,212,0.35) 45%, transparent 70%)",
    });
    btn.appendChild(s);
    gsap.fromTo(
      s,
      { scale: 0, opacity: 1 },
      { scale: 1, opacity: 0, duration: 1.1, ease: "expo.out", onComplete: () => s.remove() }
    );
  };

  return (
    <section ref={rootRef} id="cta" className="relative w-full overflow-hidden bg-black" style={{ height: "100svh" }}>
      {/* road backdrop */}
      <div className="cta-bg absolute inset-0 will-change-transform">
        <img src={road} alt="" draggable={false} className="h-full w-full object-cover opacity-60" />
      </div>
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_bottom,#000_0%,rgba(0,0,0,0.35)_35%,rgba(0,0,0,0.25)_65%,#000_100%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_70%,rgba(28,105,212,0.25),transparent_60%)]" />
      <div
        className="cta-glow pointer-events-none absolute top-[42%] left-1/2 aspect-square w-[80vmin] -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{ background: "radial-gradient(circle, rgba(28,105,212,0.35), rgba(228,0,43,0.12) 45%, transparent 70%)", filter: "blur(20px)" }}
      />

      {/* speed lines */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {SPEED_LINES.map((l, i) => (
          <span
            key={i}
            className="cta-line absolute left-full h-px"
            style={{
              top: `${l.top}%`,
              width: `${l.w}vw`,
              background: `linear-gradient(90deg, transparent, rgba(160,215,255,${l.o}), #fff)`,
              boxShadow: "0 0 10px rgba(0,168,232,0.7)",
            }}
          />
        ))}
      </div>

      {/* the car — drives away on scroll */}
      <div
        className="cta-car pointer-events-none absolute bottom-[10%] left-1/2 -translate-x-1/2 will-change-transform sm:bottom-[8%]"
        style={{ width: "min(94vw, 1020px)", mixBlendMode: "lighten" }}
      >
        <span
          className="cta-trail absolute h-[5px] rounded-full"
          style={{
            right: "88%",
            top: "49%",
            width: "70%",
            background: "linear-gradient(270deg, #e4002b, rgba(228,0,43,0.5) 35%, rgba(28,105,212,0.25) 70%, transparent)",
            boxShadow: "0 0 24px 4px rgba(228,0,43,0.6)",
            filter: "blur(1.5px)",
          }}
        />
        <img
          src={carSide}
          alt="BMW M4 Competition driving away"
          draggable={false}
          className="block h-auto w-full select-none"
          style={{
            WebkitMaskImage: "radial-gradient(ellipse 82% 78% at 50% 50%, #000 66%, transparent 100%)",
            maskImage: "radial-gradient(ellipse 82% 78% at 50% 50%, #000 66%, transparent 100%)",
          }}
        />
      </div>

      {/* hint while the car is still on screen */}
      <p className="cta-hint eyebrow pointer-events-none absolute top-[14%] left-1/2 -translate-x-1/2 text-center whitespace-nowrap text-white/50">
        Keep scrolling — watch it go
      </p>

      {/* headline + CTA */}
      <div className="absolute inset-0 z-10 flex flex-col items-center justify-center px-5 text-center">
        <h2 className="cta-title font-display-wide text-white" style={{ fontSize: "clamp(2.6rem, min(11vw, 17vh), 10rem)" }}>
          <SplitText text="THE ROAD" as="span" className="block" />
          <SplitText text="IS WAITING" as="span" className="block" wordClassNames={{ 1: "text-m-light" }} />
        </h2>
        <p className="cta-sub subtitle-thin mt-[2.5vh] max-w-lg text-white/70" style={{ fontSize: "clamp(0.95rem, 1.5vw, 1.35rem)" }}>
          503 horsepower. One seat with your name on it. Come and find out what you've been missing.
        </p>

        <div className="cta-btn-wrap relative mt-[5vh]">
          <span className="cta-btn-halo pointer-events-none absolute -inset-4 rounded-full opacity-40" style={{ background: "radial-gradient(ellipse, rgba(28,105,212,0.7), transparent 70%)", filter: "blur(18px)" }} />
          <button
            type="button"
            onClick={onBook}
            onPointerEnter={ripple}
            onPointerDown={ripple}
            className="group relative inline-flex items-center gap-4 overflow-hidden rounded-full border border-m-light/60 bg-gradient-to-r from-m-blue via-m-blue to-[#0e4fb0] px-8 py-4 font-display-wide text-sm tracking-[0.08em] text-white shadow-[0_0_50px_rgba(28,105,212,0.7),inset_0_0_20px_rgba(255,255,255,0.1)] transition-all duration-500 hover:shadow-[0_0_90px_rgba(0,168,232,0.9),inset_0_0_30px_rgba(255,255,255,0.2)] active:scale-95 sm:px-11 sm:py-5 sm:text-base"
          >
            <span className="m-stripe absolute inset-x-0 bottom-0 h-[3px]" />
            <span className="relative">Book Your M Experience</span>
            <ArrowRight size={20} className="relative transition-transform duration-500 group-hover:translate-x-1.5" />
          </button>
        </div>
      </div>
    </section>
  );
}
