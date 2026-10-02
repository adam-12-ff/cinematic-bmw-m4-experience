import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { Power, Gauge, Zap } from "lucide-react";
import { gsap, ScrollTrigger } from "../lib/gsap";
import { audio, useAudioState } from "../lib/audio";
import SplitText from "../components/SplitText";

/* ---------------- gauge geometry ---------------- */
const CX = 300;
const CY = 300;
const MAX_RPM = 8000;
const IDLE = 950;
const START_DEG = -135;
const SWEEP = 270;
const ang = (rpm: number) => START_DEG + (rpm / MAX_RPM) * SWEEP;
const pt = (r: number, deg: number): [number, number] => {
  const a = (deg * Math.PI) / 180;
  return [CX + r * Math.sin(a), CY - r * Math.cos(a)];
};
const arcPath = (r: number, from: number, to: number) => {
  const [x1, y1] = pt(r, from);
  const [x2, y2] = pt(r, to);
  const large = Math.abs(to - from) > 180 ? 1 : 0;
  return `M ${x1.toFixed(2)} ${y1.toFixed(2)} A ${r} ${r} 0 ${large} 1 ${x2.toFixed(2)} ${y2.toFixed(2)}`;
};
const PROGRESS_R = 290;
const ARC_LEN = PROGRESS_R * ((SWEEP * Math.PI) / 180);
const LEDS = 36;
const REV_TARGETS = [4200, 5400, 6500, 7300, 8000];

/* ---------------- flames ---------------- */
const TONGUES = [
  { l: 7, h: 58, d: 0.17 },
  { l: 17, h: 76, d: 0.21 },
  { l: 28, h: 90, d: 0.15 },
  { l: 39, h: 100, d: 0.2 },
  { l: 50, h: 96, d: 0.16 },
  { l: 61, h: 100, d: 0.22 },
  { l: 72, h: 90, d: 0.14 },
  { l: 83, h: 76, d: 0.19 },
  { l: 93, h: 58, d: 0.18 },
];

interface EngineApi {
  start: () => void;
  rev: () => void;
  stop: () => void;
}

export default function EngineSound() {
  const rootRef = useRef<HTMLElement>(null);
  const api = useRef<EngineApi | null>(null);
  const [on, setOn] = useState(false);
  const [stage, setStage] = useState(0);
  const { muted, unlocked } = useAudioState();

  const ticks = useMemo(() => {
    const out: { x1: number; y1: number; x2: number; y2: number; major: boolean; red: boolean }[] = [];
    for (let i = 0; i <= 32; i++) {
      const rpm = i * 250;
      const major = i % 4 === 0;
      const a = ang(rpm);
      const [x1, y1] = pt(major ? 246 : 256, a);
      const [x2, y2] = pt(268, a);
      out.push({ x1, y1, x2, y2, major, red: rpm >= 7000 });
    }
    return out;
  }, []);

  const labels = useMemo(
    () =>
      Array.from({ length: 9 }, (_, k) => {
        const [x, y] = pt(214, ang(k * 1000));
        return { k, x, y };
      }),
    []
  );

  useLayoutEffect(() => {
    const root = rootRef.current!;
    const q = <T extends Element = HTMLElement>(sel: string) => root.querySelector<T>(sel)!;
    const qa = <T extends Element = HTMLElement>(sel: string) => gsap.utils.toArray<T>(sel, root);

    const ctx = gsap.context(() => {
      const needle = q<SVGGElement>(".needle");
      const arc = q<SVGPathElement>(".rpm-arc");
      const readout = q(".rpm-readout");
      const leds = qa(".led");
      const flameWrap = q(".flame-wrap");
      const popEl = q(".flame-pop");
      const redFlash = q(".red-flash");
      const gaugeGlow = q(".gauge-glow");
      const redArc = q(".red-arc");

      const state = { rpm: 0 };
      const wob = { v: 0 };
      let idle = false;
      let engineOn = false;
      let starting = false;
      let revCount = 0;
      let lastRev = 0;
      let tl: gsap.core.Timeline | null = null;
      let revTl: gsap.core.Timeline | null = null;
      let redTween: gsap.core.Tween | null = null;
      let redOn = false;
      let lastRaw = -1;
      let lastLit = -1;
      let stageTimer = 0;

      const wobTween = gsap.to(wob, {
        v: "random(-16, 16)",
        duration: 0.11,
        repeat: -1,
        repeatRefresh: true,
        ease: "sine.inOut",
      });
      wobTween.pause();

      gsap.set(needle, { attr: { transform: `rotate(${START_DEG} ${CX} ${CY})` } });
      gsap.set(arc, { strokeDasharray: ARC_LEN, strokeDashoffset: ARC_LEN });
      gsap.set(flameWrap, { scaleY: 0.1, opacity: 0, transformOrigin: "50% 100%" });
      gsap.set([popEl, redFlash], { opacity: 0 });

      /* ---------------- per-frame render ---------------- */
      const render = () => {
        const raw = state.rpm;
        if (raw === lastRaw && !idle) return;
        lastRaw = raw;
        const disp = Math.max(-140, raw + (idle ? wob.v : 0));
        const rpm = Math.max(0, Math.min(8400, disp));
        const k = Math.min(1, rpm / MAX_RPM);

        needle.setAttribute("transform", `rotate(${ang(disp).toFixed(2)} ${CX} ${CY})`);
        arc.style.strokeDashoffset = String(ARC_LEN * (1 - k));
        readout.textContent = String(Math.round(rpm)).padStart(4, "0");

        const lit = Math.round(k * LEDS);
        if (lit !== lastLit) {
          lastLit = lit;
          for (let i = 0; i < leds.length; i++) {
            leds[i].style.opacity = i < lit ? "1" : "0.12";
          }
        }

        if (audio.running) audio.setRpm(rpm);

        // exhaust flame level follows revs
        const lvl = engineOn ? Math.min(1, 0.07 + Math.pow(k, 1.6) * 1.05) : 0;
        flameWrap.style.opacity = String(lvl > 0 ? 0.2 + lvl * 0.8 : 0);
        flameWrap.style.transform = `scaleY(${(0.1 + lvl * 1.05).toFixed(3)})`;
        gaugeGlow.style.opacity = String(0.25 + k * 0.75);

        // red zone
        const inRed = rpm >= 7000;
        if (inRed && !redOn) {
          redOn = true;
          readout.style.color = "#E4002B";
          redArc.style.filter = "drop-shadow(0 0 10px #E4002B)";
          redTween?.kill();
          redTween = gsap.to(redFlash, { opacity: 0.6, duration: 0.09, yoyo: true, repeat: -1, ease: "sine.inOut" });
        } else if (!inRed && redOn) {
          redOn = false;
          readout.style.color = "";
          redArc.style.filter = "";
          redTween?.kill();
          gsap.to(redFlash, { opacity: 0, duration: 0.35 });
        }
      };
      gsap.ticker.add(render);

      /* ---------------- helpers ---------------- */
      const shake = (soft = false) => {
        const cls = soft ? "shake-soft" : "shake";
        root.classList.remove("shake", "shake-soft");
        void root.offsetWidth;
        root.classList.add(cls);
        window.setTimeout(() => root.classList.remove(cls), soft ? 300 : 520);
      };

      const pop = (strength = 1) => {
        gsap.fromTo(
          popEl,
          { opacity: Math.min(1, 0.5 + strength * 0.5), scaleY: 0.5 },
          { opacity: 0, scaleY: 1.25, duration: 0.32, ease: "power2.out", overwrite: true, transformOrigin: "50% 100%" }
        );
      };

      const setStageUi = (n: number) => {
        setStage(n);
        window.clearTimeout(stageTimer);
        stageTimer = window.setTimeout(() => {
          revCount = 0;
          setStage(0);
        }, 2600);
      };

      const killAll = () => {
        tl?.kill();
        revTl?.kill();
        tl = revTl = null;
      };

      /* ---------------- START sequence ---------------- */
      const start = () => {
        if (starting) return;
        audio.unlock();
        killAll();
        engineOn = true;
        starting = true;
        idle = false;
        wobTween.pause();
        setOn(true);
        setStage(0);
        revCount = 0;
        state.rpm = 0;

        shake();
        const crank = audio.crank();

        tl = gsap.timeline({
          onComplete: () => {
            starting = false;
            idle = true;
            wobTween.resume();
          },
        });
        tl
          // cranking — needle trembles upward
          .to(state, { rpm: 240, duration: crank, ease: "power1.in" }, 0)
          // IGNITION
          .call(() => {
            audio.fire();
            pop(1);
            shake(true);
          }, [], crank)
          .to(state, { rpm: 3400, duration: 0.22, ease: "power4.out" }, crank)
          .to(state, { rpm: 1700, duration: 0.5, ease: "power2.inOut" }, ">")
          // full sweep to the redline
          .to(state, { rpm: MAX_RPM, duration: 1.4, ease: "power3.in" }, ">+0.12")
          .call(() => pop(1), [], ">-0.15")
          // rev-limiter bounce
          .to(state, { rpm: 7650, duration: 0.07, repeat: 5, yoyo: true, ease: "sine.inOut" }, ">")
          .addLabel("drop")
          .call(() => {
            audio.crackle(10, 1.5);
            [0.08, 0.22, 0.4, 0.66, 0.9, 1.2].forEach((t, i) => gsap.delayedCall(t, () => pop(0.9 - i * 0.1)));
          }, [], "drop")
          // needle falls to idle with an elastic swing
          .to(state, { rpm: IDLE, duration: 2.6, ease: "elastic.out(1, 0.55)" }, "drop");
      };

      /* ---------------- REV IT ---------------- */
      const rev = () => {
        if (!engineOn) {
          // gentle hint: shake the start button
          gsap.fromTo(
            q(".start-btn"),
            { x: -8 },
            { x: 0, duration: 0.7, ease: "elastic.out(1, 0.25)" }
          );
          return;
        }
        if (starting) return;
        audio.unlock();
        const now = performance.now();
        if (now - lastRev > 2600) revCount = 0;
        lastRev = now;
        const idx = Math.min(revCount, REV_TARGETS.length - 1);
        const target = REV_TARGETS[idx];
        revCount = Math.min(revCount + 1, REV_TARGETS.length);
        setStageUi(revCount);

        revTl?.kill();
        idle = false;
        wobTween.pause();
        shake(true);
        revTl = gsap.timeline({
          onComplete: () => {
            idle = true;
            wobTween.resume();
          },
        });
        revTl
          .to(state, { rpm: target, duration: 0.3 + idx * 0.03, ease: "power4.out" })
          .call(() => pop(0.5 + idx * 0.12), [], "<0.1")
          .to(state, { rpm: target - 180, duration: 0.09, repeat: idx >= 3 ? 3 : 1, yoyo: true, ease: "sine.inOut" })
          .call(() => {
            audio.crackle(2 + idx * 2, 0.9);
            for (let i = 0; i < 1 + idx; i++) gsap.delayedCall(0.1 + i * 0.2, () => pop(0.5));
          })
          .to(state, { rpm: IDLE, duration: 1.7 + idx * 0.15, ease: "elastic.out(1, 0.6)" });
      };

      /* ---------------- STOP ---------------- */
      const stop = (silent = false) => {
        if (!engineOn) return;
        killAll();
        engineOn = false;
        starting = false;
        idle = false;
        wobTween.pause();
        audio.stopEngine(silent ? 0.5 : 0.8);
        setOn(false);
        setStage(0);
        revCount = 0;
        gsap.to(state, { rpm: 0, duration: 1.4, ease: "power3.out" });
      };

      api.current = { start, rev, stop: () => stop(false) };

      /* ---------------- entrance choreography ---------------- */
      const chars = qa(".en-title .split-char");
      gsap.set(chars, { yPercent: 120, opacity: 0, rotation: 5, transformOrigin: "0% 100%" });
      gsap.set(qa(".en-fade"), { y: 34, opacity: 0 });
      gsap.set(qa(".gauge-wrap"), { scale: 0.86, opacity: 0 });
      gsap.set(qa(".tick"), { opacity: 0 });
      gsap.set(qa(".gauge-label"), { opacity: 0 });
      gsap.set(qa(".en-ctrl"), { y: 40, opacity: 0 });

      gsap
        .timeline({ scrollTrigger: { trigger: ".en-title", start: "top 82%", once: true } })
        .to(chars, { yPercent: 0, opacity: 1, rotation: 0, duration: 1.3, ease: "expo.out", stagger: 0.045 })
        .to(qa(".en-fade"), { y: 0, opacity: 1, duration: 1, stagger: 0.12 }, "-=0.8");

      gsap
        .timeline({
          scrollTrigger: { trigger: ".gauge-wrap", start: "top 80%", once: true },
          onComplete: () => {
            // gauge "self-test" sweep, like a real M car on key-on
            if (engineOn) return;
            tl = gsap.timeline();
            tl.to(state, { rpm: MAX_RPM, duration: 1, ease: "power2.inOut" }).to(state, {
              rpm: 0,
              duration: 1.6,
              ease: "elastic.out(1, 0.55)",
            });
          },
        })
        .to(qa(".gauge-wrap"), { scale: 1, opacity: 1, duration: 1.4, ease: "expo.out" })
        .to(qa(".tick"), { opacity: 1, duration: 0.5, ease: "power2.out", stagger: 0.02 }, 0.1)
        .to(qa(".gauge-label"), { opacity: 1, duration: 0.6, stagger: 0.06 }, 0.3)
        .to(qa(".en-ctrl"), { y: 0, opacity: 1, duration: 1, stagger: 0.12 }, 0.5);

      // shut the engine down when the section leaves the viewport
      ScrollTrigger.create({
        trigger: root,
        start: "top 92%",
        end: "bottom 8%",
        onToggle: (self) => {
          if (!self.isActive && engineOn) stop(true);
        },
      });

      return () => {
        gsap.ticker.remove(render);
        window.clearTimeout(stageTimer);
        redTween?.kill();
        wobTween.kill();
        killAll();
        audio.stopEngine(0.2);
        api.current = null;
      };
    }, root);

    return () => ctx.revert();
  }, []);

  const soundNote = !unlocked ? "Tap START — sound unlocks on your first click" : muted ? "Sound is muted — use the speaker button" : "Audio live · M TwinPower synth";

  return (
    <section ref={rootRef} id="engine" className="relative overflow-hidden bg-black pt-[14vh] pb-[32vh]">
      {/* ambient */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 50% 38%, rgba(28,105,212,0.2), transparent 55%), radial-gradient(ellipse at 50% 100%, rgba(228,0,43,0.2), transparent 55%), linear-gradient(#000, #0b0b0b 55%, #000)",
        }}
      />
      <div
        className="red-flash pointer-events-none absolute inset-0 z-[1]"
        style={{ background: "radial-gradient(ellipse at 50% 45%, rgba(228,0,43,0.55), rgba(228,0,43,0.15) 45%, transparent 75%)" }}
      />

      {/* ---------------- EXHAUST FLAMES ---------------- */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[1] h-[44vh] overflow-hidden">
        <div className="flame-wrap absolute inset-x-0 bottom-0 h-full">
          <div
            className="absolute inset-x-0 bottom-[-6%] h-[36%]"
            style={{
              background:
                "radial-gradient(ellipse at 50% 100%, rgba(255,160,60,0.95) 0%, rgba(255,90,20,0.55) 30%, rgba(228,0,43,0.25) 55%, transparent 75%)",
              filter: "blur(18px)",
              mixBlendMode: "screen",
            }}
          />
          {TONGUES.map((t, i) => (
            <div
              key={i}
              className="flame-tongue absolute"
              style={{
                left: `${t.l}%`,
                bottom: "-6%",
                width: "17%",
                marginLeft: "-8.5%",
                height: `${t.h}%`,
                borderRadius: "50% 50% 46% 46% / 78% 78% 22% 22%",
                background:
                  "radial-gradient(ellipse at 50% 100%, #fff 0%, #ffe6a8 10%, #ff9a2e 32%, rgba(228,0,43,0.75) 56%, rgba(28,105,212,0.35) 78%, transparent 100%)",
                filter: "blur(7px)",
                mixBlendMode: "screen",
                animationDuration: `${t.d}s`,
                animationDelay: `-${(i * 0.037).toFixed(3)}s`,
              }}
            />
          ))}
        </div>
        <div
          className="flame-pop absolute inset-x-0 bottom-0 h-full"
          style={{
            background:
              "radial-gradient(ellipse 60% 70% at 50% 100%, rgba(255,255,255,0.95) 0%, rgba(255,190,90,0.85) 18%, rgba(255,90,20,0.5) 42%, transparent 72%)",
            transformOrigin: "50% 100%",
            mixBlendMode: "screen",
          }}
        />
      </div>

      <div className="relative z-10 mx-auto max-w-[1200px] px-5 text-center sm:px-8">
        {/* heading */}
        <p className="en-fade eyebrow mb-5 text-m-red">04 — Sound</p>
        <h2 className="en-title font-display-wide text-white" style={{ fontSize: "clamp(2.4rem, 9vw, 8.5rem)" }}>
          <SplitText text="HEAR THE BEAST" as="span" />
        </h2>
        <p className="en-fade subtitle-thin mx-auto mt-5 max-w-xl text-white/60" style={{ fontSize: "clamp(0.95rem, 1.4vw, 1.25rem)" }}>
          Light the fuse. Twin turbos spool, the exhaust flap snaps open — and the S58 does what it was built to do.
        </p>

        {/* ---------------- TACHOMETER ---------------- */}
        <div className="gauge-wrap relative mx-auto mt-[6vh] aspect-square w-[min(92vw,580px)]">
          <div
            className="gauge-glow pointer-events-none absolute -inset-[8%] rounded-full"
            style={{ background: "radial-gradient(circle, rgba(28,105,212,0.35), rgba(228,0,43,0.12) 55%, transparent 70%)", filter: "blur(30px)" }}
          />
          <svg viewBox="0 0 600 600" className="absolute inset-0 h-full w-full overflow-visible" aria-label="Tachometer">
            <defs>
              <radialGradient id="face" cx="50%" cy="50%" r="50%">
                <stop offset="0" stopColor="#0d0d10" />
                <stop offset="0.7" stopColor="#060607" />
                <stop offset="1" stopColor="#000" />
              </radialGradient>
              <linearGradient id="arc-grad" x1="0" y1="1" x2="1" y2="0">
                <stop offset="0" stopColor="#1c69d4" />
                <stop offset="0.65" stopColor="#00a8e8" />
                <stop offset="1" stopColor="#e4002b" />
              </linearGradient>
              <linearGradient id="needle-grad" x1="0" y1="1" x2="0" y2="0">
                <stop offset="0" stopColor="#8a0019" />
                <stop offset="1" stopColor="#ff3b5c" />
              </linearGradient>
              <filter id="needle-glow" x="-200%" y="-20%" width="500%" height="140%">
                <feGaussianBlur stdDeviation="4" result="b" />
                <feMerge>
                  <feMergeNode in="b" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            <circle cx={CX} cy={CY} r="296" fill="url(#face)" stroke="rgba(255,255,255,0.08)" strokeWidth="2" />
            <circle cx={CX} cy={CY} r="170" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="1" strokeDasharray="3 9" />
            <circle cx={CX} cy={CY} r="130" fill="none" stroke="rgba(28,105,212,0.25)" strokeWidth="1" />

            {/* track + live progress arc */}
            <path d={arcPath(PROGRESS_R, START_DEG, START_DEG + SWEEP)} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="5" strokeLinecap="round" />
            <path
              className="rpm-arc"
              d={arcPath(PROGRESS_R, START_DEG, START_DEG + SWEEP)}
              fill="none"
              stroke="url(#arc-grad)"
              strokeWidth="5"
              strokeLinecap="round"
              style={{ filter: "drop-shadow(0 0 8px rgba(0,168,232,0.8))" }}
            />
            {/* red zone */}
            <path className="red-arc" d={arcPath(279, ang(7000), ang(8000))} fill="none" stroke="#e4002b" strokeWidth="7" />

            {ticks.map((t, i) => (
              <line
                key={i}
                className="tick"
                x1={t.x1}
                y1={t.y1}
                x2={t.x2}
                y2={t.y2}
                stroke={t.red ? "#e4002b" : "rgba(255,255,255,0.7)"}
                strokeWidth={t.major ? 3.2 : 1.4}
                strokeLinecap="round"
              />
            ))}
            {labels.map((l) => (
              <text
                key={l.k}
                className="gauge-label"
                x={l.x}
                y={l.y}
                textAnchor="middle"
                dominantBaseline="central"
                fill={l.k >= 7 ? "#ff3b5c" : "#fff"}
                style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 30, fontStretch: "125%" }}
              >
                {l.k}
              </text>
            ))}
            <text
              x={CX}
              y="168"
              textAnchor="middle"
              fill="rgba(255,255,255,0.4)"
              style={{ fontFamily: "var(--font-mono)", fontSize: 13, letterSpacing: "0.45em" }}
            >
              x1000 RPM
            </text>

            {/* needle */}
            <g className="needle" transform={`rotate(${START_DEG} ${CX} ${CY})`}>
              <polygon points="294.5,300 300,62 305.5,300" fill="url(#needle-grad)" filter="url(#needle-glow)" />
              <polygon points="296,300 300,350 304,300" fill="#e4002b" />
            </g>
          </svg>

          {/* START ENGINE — the hub of the gauge */}
          <div className="absolute top-1/2 left-1/2 aspect-square w-[36%] -translate-x-1/2 -translate-y-1/2 sm:w-[31%]">
            <span className={`pulse-ring absolute inset-0 rounded-full border-2 ${on ? "border-m-light/70" : "border-m-red/80"}`} />
            <span
              className={`pulse-ring absolute inset-0 rounded-full border ${on ? "border-m-light/50" : "border-m-red/60"}`}
              style={{ animationDelay: "1.1s" }}
            />
            <button
              type="button"
              onClick={() => (on ? api.current?.stop() : api.current?.start())}
              aria-label={on ? "Stop engine" : "Start engine"}
              className={`start-btn group relative flex h-full w-full cursor-pointer flex-col items-center justify-center rounded-full border-2 transition-all duration-500 active:scale-95 ${
                on
                  ? "border-m-light shadow-[0_0_60px_rgba(0,168,232,0.6),inset_0_0_30px_rgba(0,168,232,0.3)]"
                  : "border-m-red shadow-[0_0_70px_rgba(228,0,43,0.65),inset_0_0_34px_rgba(228,0,43,0.35)] hover:shadow-[0_0_110px_rgba(228,0,43,0.95),inset_0_0_44px_rgba(228,0,43,0.55)]"
              }`}
              style={{ background: "radial-gradient(circle at 35% 28%, #25090e 0%, #0a0a0b 62%, #000 100%)" }}
            >
              <Power size={24} className={`mb-1 transition-colors duration-500 sm:mb-2 ${on ? "text-m-light" : "text-m-red"}`} />
              <span className="font-display-cond text-[0.8rem] leading-[1] tracking-[0.12em] text-white sm:text-[1.15rem]">{on ? "STOP" : "START"}</span>
              <span className="font-display-cond text-[0.8rem] leading-[1] tracking-[0.12em] text-white/80 sm:text-[1.15rem]">ENGINE</span>
            </button>
          </div>

          {/* digital readout in the gauge gap */}
          <div className="pointer-events-none absolute top-[73%] left-1/2 -translate-x-1/2 text-center">
            <div className="rpm-readout font-mono text-[1.9rem] font-medium text-white tabular-nums transition-colors sm:text-[2.6rem]" style={{ textShadow: "0 0 20px rgba(0,168,232,0.5)" }}>
              0000
            </div>
            <div className="font-mono text-[0.6rem] tracking-[0.5em] text-white/40">RPM</div>
          </div>
        </div>

        {/* LED rev bar */}
        <div className="en-ctrl mx-auto mt-6 flex w-[min(92vw,580px)] gap-[3px]" aria-hidden="true">
          {Array.from({ length: LEDS }, (_, i) => {
            const c = i >= LEDS * 0.83 ? "#e4002b" : i >= LEDS * 0.68 ? "#ff8a1e" : i >= LEDS * 0.35 ? "#00a8e8" : "#1c69d4";
            return (
              <span
                key={i}
                className="led h-3 flex-1 rounded-[2px] sm:h-4"
                style={{ background: c, opacity: 0.12, boxShadow: `0 0 8px ${c}` }}
              />
            );
          })}
        </div>

        {/* REV IT */}
        <div className="en-ctrl mt-9 flex flex-col items-center gap-4">
          <button
            type="button"
            onClick={() => api.current?.rev()}
            className={`group relative inline-flex items-center gap-3 overflow-hidden rounded-full border-2 px-9 py-4 font-display-wide text-lg tracking-[0.08em] text-white transition-all duration-300 active:scale-95 sm:text-xl ${
              on
                ? "border-m-red bg-m-red/10 shadow-[0_0_40px_rgba(228,0,43,0.55)] hover:bg-m-red hover:shadow-[0_0_70px_rgba(228,0,43,0.9)]"
                : "border-white/15 bg-white/[0.02] text-white/40"
            }`}
          >
            <Zap size={20} className={on ? "text-white" : "text-white/40"} />
            REV IT
          </button>

          <div className="flex items-center gap-2" aria-label={`Rev stage ${stage} of 5`}>
            {REV_TARGETS.map((_, i) => (
              <span
                key={i}
                className={`h-1.5 w-8 rounded-full transition-all duration-300 ${i < stage ? (i >= 3 ? "bg-m-red shadow-[0_0_10px_#e4002b]" : "bg-m-light shadow-[0_0_10px_#00a8e8]") : "bg-white/10"}`}
              />
            ))}
          </div>
          <p className="flex items-center gap-2 font-mono text-[0.62rem] tracking-[0.25em] text-white/45 uppercase">
            <Gauge size={13} className="text-m-light" />
            {on ? "Every tap goes higher — 5 stages to redline" : "Start the engine to unlock REV IT"}
          </p>
          <p className="font-mono text-[0.58rem] tracking-[0.25em] text-white/30 uppercase">{soundNote}</p>
        </div>
      </div>
    </section>
  );
}
