import { useLayoutEffect, useRef } from "react";
import { ChevronDown, Volume2 } from "lucide-react";
import { gsap, ScrollTrigger } from "../lib/gsap";
import { audio, useAudioState } from "../lib/audio";
import { getLenis } from "../lib/scroll";
import SplitText from "../components/SplitText";

/** Mirrored half of the headlight signature (left side; right side is the same group flipped). */
function LightHalf({ side }: { side: "l" | "r" }) {
  const flip = side === "r" ? "translate(1000 0) scale(-1 1)" : undefined;
  return (
    <g transform={flip}>
      {/* housing */}
      <path
        d="M70 168 L330 112 Q372 104 396 122 L404 150 Q380 168 340 172 L120 196 Z"
        fill="rgba(255,255,255,0.025)"
        stroke="rgba(255,255,255,0.12)"
        strokeWidth="1.5"
      />
      <g className="hl-lit" filter="url(#hl-glow)">
        {/* DRL blade */}
        <path d="M82 170 L330 119 L340 131 L112 185 Z" fill="url(#drl-grad)" />
        <path d="M120 188 L338 136 L342 142 L130 194 Z" fill="url(#drl-grad)" opacity="0.55" />
        {/* hex ring */}
        <polygon
          points="376,148 363,170.5 337,170.5 324,148 337,125.5 363,125.5"
          fill="none"
          stroke="#eaf6ff"
          strokeWidth="4.5"
          strokeLinejoin="round"
        />
        <polygon
          points="362,148 356,158 344,158 338,148 344,138 356,138"
          fill="rgba(180,225,255,0.55)"
        />
        <circle cx="350" cy="148" r="6" fill="#fff" />
      </g>
    </g>
  );
}

function Kidney({ flip }: { flip?: boolean }) {
  return (
    <g transform={flip ? "translate(1000 0) scale(-1 1)" : undefined}>
      <path
        d="M438 118 L494 120 L494 196 L448 196 Q432 160 438 118 Z"
        fill="#050608"
        stroke="rgba(160,200,255,0.35)"
        strokeWidth="1.5"
      />
      {[452, 461, 470, 479, 488].map((x) => (
        <line key={x} x1={x} y1="124" x2={x} y2="192" stroke="rgba(160,200,255,0.22)" strokeWidth="1.5" />
      ))}
    </g>
  );
}

export default function Intro() {
  const rootRef = useRef<HTMLElement>(null);
  const { muted, unlocked } = useAudioState();
  const soundOn = unlocked && !muted;

  useLayoutEffect(() => {
    const root = rootRef.current!;
    const q = <T extends Element = HTMLElement>(sel: string) => root.querySelector<T>(sel)!;
    const qa = (sel: string) => gsap.utils.toArray<HTMLElement>(sel, root);

    // ---- mouse-follow glow + subtle light parallax ----
    const glow = q(".mouse-glow");
    const lightsWrap = q(".lights-wrap");
    const gx = gsap.quickTo(glow, "x", { duration: 0.7, ease: "power3.out" });
    const gy = gsap.quickTo(glow, "y", { duration: 0.7, ease: "power3.out" });
    const px = gsap.quickTo(lightsWrap, "x", { duration: 1.2, ease: "power3.out" });
    const py = gsap.quickTo(lightsWrap, "y", { duration: 1.2, ease: "power3.out" });
    const onMove = (e: PointerEvent) => {
      const r = root.getBoundingClientRect();
      const x = e.clientX - r.left;
      const y = e.clientY - r.top;
      gx(x);
      gy(y);
      px((x / r.width - 0.5) * 22);
      py((y / r.height - 0.5) * 12);
    };
    root.addEventListener("pointermove", onMove);
    gsap.set(glow, { x: window.innerWidth / 2, y: window.innerHeight * 0.4 });

    const ctx = gsap.context(() => {
      const line = q(".m-line");
      const lights = qa(".hl-lit");
      const glows = qa(".hl-glow");
      const flares = qa(".hl-flare");
      const floor = q(".hl-floor");
      const grille = q(".grille");
      const chars = qa(".intro-title .split-char");
      const sub = q(".intro-sub");
      const unleash = q(".unleash-wrap");
      const indicator = q(".scroll-indicator");

      gsap.set(line, { scaleX: 0, transformOrigin: "50% 50%" });
      gsap.set(lights, { opacity: 0 });
      gsap.set(glows, { opacity: 0, scale: 0.2 });
      gsap.set(flares, { opacity: 0, scaleX: 0 });
      gsap.set(floor, { opacity: 0 });
      gsap.set(grille, { opacity: 0 });
      gsap.set(chars, { yPercent: 125, rotation: 8, opacity: 0, transformOrigin: "0% 100%" });
      gsap.set(sub, { y: 46, opacity: 0 });
      gsap.set(unleash, { autoAlpha: 0, y: 24 });
      gsap.set(indicator, { opacity: 0, y: 12 });

      // Scroll hint is visible right away on a pitch-black screen
      gsap.to(indicator, { opacity: 1, y: 0, duration: 1.4, delay: 0.9, ease: "power3.out" });

      const tl = gsap.timeline({
        defaults: { ease: "power3.out" },
        scrollTrigger: {
          trigger: root,
          start: "top top",
          end: "+=320%",
          pin: true,
          scrub: 0.8,
          anticipatePin: 1,
        },
      });

      tl
        // 1 — the M light line draws across the dark
        .to(line, { scaleX: 1, duration: 2.2, ease: "expo.out" }, 0)
        .to(indicator, { opacity: 0.55, duration: 1 }, 1)
        .to(grille, { opacity: 0.35, duration: 1 }, 2.2)
        // 2 — headlights flash ON (stutter like HID ignition)
        .call(() => audio.thump(0.8), undefined, 3)
        .to(lights, { opacity: 1, duration: 0.18, ease: "power2.in" }, 3)
        .to(lights, { opacity: 0.12, duration: 0.18 }, 3.18)
        .to(lights, { opacity: 1, duration: 0.18 }, 3.36)
        .to(lights, { opacity: 0.45, duration: 0.12 }, 3.54)
        .to(lights, { opacity: 1, duration: 0.5, ease: "expo.out" }, 3.66)
        .to(glows, { opacity: 1, scale: 1, duration: 1.4, ease: "expo.out", stagger: 0.04 }, 3)
        .to(flares, { opacity: 1, scaleX: 1, duration: 1.5, ease: "expo.out" }, 3.1)
        .to(floor, { opacity: 1, duration: 2 }, 3.2)
        .to(grille, { opacity: 0.95, duration: 1.2 }, 3.4)
        .to(line, { opacity: 0.4, duration: 1.2 }, 3.6)
        .to(lightsWrap, { scale: 1.1, duration: 6.4, ease: "power1.inOut" }, 3)
        // 3 — massive title, letter by letter
        .to(
          chars,
          {
            yPercent: 0,
            rotation: 0,
            opacity: 1,
            duration: 1.3,
            ease: "expo.out",
            stagger: { each: 0.09, ease: "power2.out" },
          },
          4.5
        )
        .to(glows, { opacity: 0.55, duration: 2 }, 6.2)
        // 4 — subtitle slides up
        .to(sub, { y: 0, opacity: 1, duration: 1.5, ease: "expo.out" }, 7.6)
        // 5 — UNLEASH CTA
        .to(unleash, { autoAlpha: 1, y: 0, duration: 1.2, ease: "power3.out" }, 8.8)
        .to(indicator, { opacity: 1, duration: 1 }, 9.2)
        .to({}, { duration: 1 }, 10);

      // ---- bass rumble reacts to scroll velocity while the hero is on screen ----
      let lastPush = 0;
      const tick = () => {
        const now = performance.now();
        if (now - lastPush < 70) return;
        lastPush = now;
        const v = Math.abs(getLenis()?.velocity ?? 0);
        audio.setRumble(true, Math.min(1, v / 45));
      };
      ScrollTrigger.create({
        trigger: root,
        start: "top top",
        end: "+=320%",
        onToggle: (self) => {
          if (self.isActive) gsap.ticker.add(tick);
          else {
            gsap.ticker.remove(tick);
            audio.setRumble(false);
          }
        },
      });
      return () => {
        gsap.ticker.remove(tick);
        audio.setRumble(false);
      };
    }, root);

    return () => {
      root.removeEventListener("pointermove", onMove);
      ctx.revert();
    };
  }, []);

  const unleash = () => {
    if (!audio.getState().unlocked) {
      audio.unlock();
      audio.thump(1.2);
    } else {
      audio.toggleMute();
      if (!audio.getState().muted) audio.thump(1);
    }
    const root = rootRef.current!;
    gsap.fromTo(
      root.querySelectorAll(".hl-glow"),
      { scale: 1 },
      { scale: 1.7, opacity: 1, duration: 0.22, yoyo: true, repeat: 1, ease: "power2.out" }
    );
    gsap.fromTo(
      root.querySelector(".flash"),
      { opacity: 0.55 },
      { opacity: 0, duration: 0.9, ease: "expo.out" }
    );
  };

  return (
    <section
      ref={rootRef}
      id="intro"
      className="relative h-screen w-full overflow-hidden bg-black"
      style={{ height: "100svh" }}
    >
      {/* mouse-follow glow */}
      <div
        className="mouse-glow pointer-events-none absolute top-0 left-0 z-0 -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{
          width: "min(70vw, 720px)",
          height: "min(70vw, 720px)",
          background:
            "radial-gradient(circle, rgba(28,105,212,0.28) 0%, rgba(0,168,232,0.10) 35%, rgba(228,0,43,0.04) 55%, transparent 70%)",
          filter: "blur(10px)",
        }}
      />
      <div className="flash pointer-events-none absolute inset-0 z-[5] bg-[radial-gradient(circle_at_50%_30%,rgba(160,215,255,0.9),transparent_60%)] opacity-0" />

      <div className="absolute inset-0 z-10 flex flex-col items-center justify-center px-4 text-center">
        {/* ---- headlights ---- */}
        <div
          className="lights-wrap relative will-change-transform"
          style={{ width: "min(90vw, 880px, 78vh)", aspectRatio: "10 / 3" }}
        >
          {/* floor wash */}
          <div
            className="hl-floor pointer-events-none absolute top-[40%] left-1/2 h-[240%] w-[170%] -translate-x-1/2"
            style={{
              background:
                "radial-gradient(ellipse at 50% 20%, rgba(28,105,212,0.38) 0%, rgba(0,168,232,0.1) 35%, transparent 65%)",
            }}
          />
          {/* radial bloom behind each light */}
          {[35, 65].map((left) => (
            <div
              key={left}
              className="hl-glow pointer-events-none absolute aspect-square -translate-x-1/2 -translate-y-1/2 rounded-full"
              style={{
                left: `${left}%`,
                top: "49%",
                width: "42%",
                background:
                  "radial-gradient(circle, rgba(200,232,255,0.95) 0%, rgba(0,168,232,0.5) 18%, rgba(28,105,212,0.28) 38%, transparent 68%)",
                mixBlendMode: "screen",
              }}
            />
          ))}
          {/* anamorphic flares */}
          {[35, 65].map((left) => (
            <div
              key={left}
              className="hl-flare pointer-events-none absolute h-[2px] -translate-x-1/2"
              style={{
                left: `${left}%`,
                top: "49%",
                width: "75%",
                background:
                  "linear-gradient(90deg, transparent, rgba(0,168,232,0.9) 30%, #fff 50%, rgba(0,168,232,0.9) 70%, transparent)",
                boxShadow: "0 0 18px 3px rgba(0,168,232,0.7)",
                mixBlendMode: "screen",
              }}
            />
          ))}

          <svg viewBox="0 0 1000 300" className="absolute inset-0 h-full w-full overflow-visible" aria-hidden="true">
            <defs>
              <linearGradient id="drl-grad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0" stopColor="#00a8e8" />
                <stop offset="0.5" stopColor="#d7f1ff" />
                <stop offset="1" stopColor="#ffffff" />
              </linearGradient>
              <filter id="hl-glow" x="-30%" y="-60%" width="160%" height="220%">
                <feGaussianBlur in="SourceGraphic" stdDeviation="14" result="b2" />
                <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="b1" />
                <feMerge>
                  <feMergeNode in="b2" />
                  <feMergeNode in="b1" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
            <g className="grille">
              <Kidney />
              <Kidney flip />
            </g>
            <LightHalf side="l" />
            <LightHalf side="r" />
          </svg>

          {/* the M light line — draws across the whole viewport */}
          <div
            className="m-line pointer-events-none absolute h-[2px]"
            style={{
              top: "49%",
              left: "50%",
              width: "100vw",
              marginLeft: "-50vw",
              background:
                "linear-gradient(90deg, transparent 0%, #00a8e8 18%, #1c69d4 40%, #1c69d4 60%, #e4002b 82%, transparent 100%)",
              boxShadow: "0 0 14px 1px rgba(0,168,232,0.8), 0 0 40px 4px rgba(28,105,212,0.55)",
            }}
          />
        </div>

        {/* ---- title ---- */}
        <h1
          className="intro-title font-display-wide mt-[2.5vh] text-white"
          style={{ fontSize: "clamp(2.75rem, min(12vw, 15vh), 9.5rem)" }}
        >
          <SplitText text="BORN TO" as="span" className="block" />
          <SplitText text="DOMINATE" as="span" className="block" />
        </h1>

        <p
          className="intro-sub subtitle-thin mt-[2.2vh] max-w-[34rem] text-white/75"
          style={{ fontSize: "clamp(0.95rem, 1.5vw, 1.35rem)" }}
        >
          The BMW M4 Competition. <span className="font-light text-m-light">503 HP</span> of Pure Aggression.
        </p>

        <div className="unleash-wrap mt-[3.5vh]">
          <button
            type="button"
            onClick={unleash}
            className="group relative inline-flex items-center gap-3 overflow-hidden rounded-full border border-m-light/50 bg-black/50 px-8 py-3.5 font-mono text-xs tracking-[0.35em] text-white uppercase backdrop-blur-md transition-all duration-500 hover:border-m-light hover:shadow-[0_0_40px_rgba(0,168,232,0.55)]"
          >
            <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-m-blue/0 via-m-blue/40 to-m-blue/0 transition-transform duration-700 group-hover:translate-x-full" />
            {soundOn ? (
              <span className="flex h-4 items-end gap-[3px]" aria-hidden="true">
                {[0, 1, 2, 3, 4].map((i) => (
                  <span key={i} className="eq-bar h-full w-[3px] rounded-full bg-m-light" style={{ animationDelay: `${i * 0.11}s` }} />
                ))}
              </span>
            ) : (
              <Volume2 size={16} className="text-m-light" />
            )}
            <span className="relative">{soundOn ? "Sound Unleashed" : "Unleash"}</span>
          </button>
          <p className="mt-3 font-mono text-[0.6rem] tracking-[0.3em] text-white/35 uppercase">
            {soundOn ? "Engine audio enabled" : "Enable engine audio"}
          </p>
        </div>
      </div>

      {/* scroll indicator */}
      <div className="scroll-indicator pointer-events-none absolute bottom-6 left-1/2 z-10 flex -translate-x-1/2 flex-col items-center gap-2 sm:bottom-8">
        <span className="font-mono text-[0.62rem] tracking-[0.4em] whitespace-nowrap text-white/60 uppercase">
          Scroll to Feel the Power
        </span>
        <ChevronDown className="arrow-bounce text-m-light" size={22} />
      </div>
    </section>
  );
}
