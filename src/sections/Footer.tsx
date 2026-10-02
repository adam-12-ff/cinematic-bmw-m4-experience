import { useLayoutEffect, useRef } from "react";
import { gsap } from "../lib/gsap";
import { getLenis } from "../lib/scroll";
import SplitText from "../components/SplitText";

const NAV = [
  { label: "Power", target: "#reveal" },
  { label: "Performance", target: "#specs" },
  { label: "Sound", target: "#engine" },
  { label: "Details", target: "#gallery" },
  { label: "Colours", target: "#customizer" },
];

const MARQUEE = ["BORN TO DOMINATE", "503 HP", "3.4 SEC", "650 NM", "290 KM/H", "M xDRIVE", "TWIN-TURBO INLINE-6"];

export default function Footer() {
  const rootRef = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    const root = rootRef.current!;
    const ctx = gsap.context(() => {
      const qa = (s: string) => gsap.utils.toArray<HTMLElement>(s, root);
      const chars = qa(".ft-word .split-char");

      gsap.set(".ft-stripe", { scaleX: 0, transformOrigin: "0% 50%" });
      gsap.set(chars, { yPercent: 120, opacity: 0 });
      gsap.set(qa(".ft-fade"), { y: 30, opacity: 0 });

      gsap
        .timeline({ scrollTrigger: { trigger: root, start: "top 85%", once: true } })
        .to(".ft-stripe", { scaleX: 1, duration: 1.8, ease: "expo.out" })
        .to(chars, { yPercent: 0, opacity: 1, duration: 1.2, ease: "expo.out", stagger: 0.04 }, 0.2)
        .to(qa(".ft-fade"), { y: 0, opacity: 1, duration: 1, ease: "power3.out", stagger: 0.1 }, 0.6);

      // marquee drifts faster while scrolling
      const tween = gsap.to(".ft-marquee", { xPercent: -50, duration: 30, ease: "none", repeat: -1 });
      let timer = 0;
      const lenis = getLenis();
      const onScroll = () => {
        const v = Math.min(6, 1 + Math.abs(lenis?.velocity ?? 0) / 8);
        gsap.to(tween, { timeScale: v, duration: 0.4, overwrite: true });
        window.clearTimeout(timer);
        timer = window.setTimeout(() => gsap.to(tween, { timeScale: 1, duration: 1.2, ease: "power3.out" }), 140);
      };
      lenis?.on("scroll", onScroll);
      return () => {
        lenis?.off("scroll", onScroll);
        window.clearTimeout(timer);
      };
    }, root);
    return () => ctx.revert();
  }, []);

  const go = (target: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    const l = getLenis();
    if (l) l.scrollTo(target, { duration: 2.2, easing: (t: number) => 1 - Math.pow(1 - t, 4) });
    else document.querySelector(target)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <footer ref={rootRef} className="relative overflow-hidden bg-[#050505]">
      {/* M-stripe accent line */}
      <div className="ft-stripe m-stripe absolute top-0 left-0 h-[4px] w-full" style={{ boxShadow: "0 0 24px rgba(28,105,212,0.7)" }} />

      {/* marquee */}
      <div className="overflow-hidden border-b border-white/10 py-5">
        <div className="ft-marquee flex w-max items-center gap-10 whitespace-nowrap">
          {[...MARQUEE, ...MARQUEE, ...MARQUEE, ...MARQUEE].map((m, i) => (
            <span key={i} className="flex items-center gap-10">
              <span
                className="font-display-wide text-outline"
                style={{ fontSize: "clamp(1.4rem, 3vw, 2.4rem)", WebkitTextStroke: "1px rgba(255,255,255,0.28)" }}
              >
                {m}
              </span>
              <span className="m-stripe inline-block h-[3px] w-8 -skew-x-[30deg]" />
            </span>
          ))}
        </div>
      </div>

      <div className="mx-auto max-w-[1300px] px-5 pt-16 pb-28 sm:px-8 sm:pb-14">
        <h2 className="ft-word font-display-wide text-white" style={{ fontSize: "clamp(2.2rem, 8.5vw, 8rem)" }}>
          <SplitText text="M4 COMPETITION" as="span" />
        </h2>

        <div className="mt-12 grid gap-12 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr]">
          <div className="ft-fade">
            <p className="subtitle-thin max-w-sm text-white/55" style={{ fontSize: "1.05rem" }}>
              Built for those who feel the road through the soles of their feet. 503 HP of twin-turbo conviction.
            </p>
            <div className="mt-8 inline-flex items-center gap-3 rounded-full border border-white/12 bg-white/[0.03] px-5 py-3">
              <span className="blink-dot h-2.5 w-2.5 rounded-full bg-[#22ff78]" />
              <span className="font-mono text-[0.68rem] tracking-[0.28em] text-white/80 uppercase">
                M Performance: <span className="text-[#22ff78]">ACTIVE</span>
              </span>
            </div>
          </div>

          <nav className="ft-fade" aria-label="Footer">
            <p className="eyebrow mb-5 text-m-light">Explore</p>
            <ul className="space-y-3">
              {NAV.map((n) => (
                <li key={n.label}>
                  <a
                    href={n.target}
                    onClick={go(n.target)}
                    className="group inline-flex items-center gap-3 font-display-cond text-xl tracking-[0.1em] text-white/60 transition-colors duration-300 hover:text-white"
                  >
                    <span className="m-stripe h-[2px] w-0 transition-all duration-500 group-hover:w-6" />
                    {n.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div className="ft-fade">
            <p className="eyebrow mb-5 text-m-red">Specs at a glance</p>
            <ul className="space-y-3 font-mono text-[0.72rem] tracking-[0.18em] text-white/55 uppercase">
              <li className="flex justify-between gap-6 border-b border-white/10 pb-2"><span>Engine</span><span className="text-white/85">3.0L Twin-Turbo I6</span></li>
              <li className="flex justify-between gap-6 border-b border-white/10 pb-2"><span>Drive</span><span className="text-white/85">M xDrive AWD</span></li>
              <li className="flex justify-between gap-6 border-b border-white/10 pb-2"><span>0–100</span><span className="text-white/85">3.4 sec</span></li>
              <li className="flex justify-between gap-6 border-b border-white/10 pb-2"><span>Top speed</span><span className="text-white/85">290 km/h</span></li>
            </ul>
          </div>
        </div>

        <div className="ft-fade mt-14 flex flex-col gap-3 border-t border-white/10 pt-6 font-mono text-[0.62rem] tracking-[0.2em] text-white/35 uppercase sm:flex-row sm:items-center sm:justify-between">
          <span>© 2026 — A fan-made concept experience</span>
          <span>Not affiliated with or endorsed by BMW AG. All trademarks belong to their owners.</span>
        </div>
      </div>
    </footer>
  );
}
