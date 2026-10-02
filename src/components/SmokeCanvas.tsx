import { useEffect, useRef } from "react";

interface SmokeCanvasProps {
  className?: string;
  /** 0..1 multiplier, mutate `.current` from GSAP to drive intensity from scroll */
  intensity?: { current: number };
  /** rgb triplets */
  colors?: string[];
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  life: number;
  max: number;
  alpha: number;
  sprite: number;
  spin: number;
}

/** M-coloured volumetric smoke drawn with additive soft sprites. Pauses when off-screen. */
export default function SmokeCanvas({
  className = "",
  intensity,
  colors = ["0,168,232", "28,105,212", "228,0,43", "28,105,212"],
}: SmokeCanvasProps) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    let w = 0;
    let h = 0;
    let raf = 0;
    let visible = false;
    let last = performance.now();

    const sprites = colors.map((c) => {
      const s = document.createElement("canvas");
      s.width = s.height = 128;
      const sc = s.getContext("2d")!;
      const g = sc.createRadialGradient(64, 64, 0, 64, 64, 64);
      g.addColorStop(0, `rgba(${c},0.9)`);
      g.addColorStop(0.4, `rgba(${c},0.35)`);
      g.addColorStop(1, `rgba(${c},0)`);
      sc.fillStyle = g;
      sc.fillRect(0, 0, 128, 128);
      return s;
    });

    const resize = () => {
      const r = canvas.getBoundingClientRect();
      w = r.width;
      h = r.height;
      canvas.width = Math.max(1, Math.floor(w * dpr));
      canvas.height = Math.max(1, Math.floor(h * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();

    const spawn = (p?: Particle): Particle => {
      const o = p ?? ({} as Particle);
      o.x = w * (0.18 + Math.random() * 0.64);
      o.y = h * (0.62 + Math.random() * 0.3);
      o.vx = (Math.random() - 0.5) * 40;
      o.vy = -(14 + Math.random() * 36);
      o.r = (w < 700 ? 90 : 150) + Math.random() * (w < 700 ? 110 : 200);
      o.max = 4 + Math.random() * 5;
      o.life = Math.random() * o.max;
      o.alpha = 0.16 + Math.random() * 0.26;
      o.sprite = Math.floor(Math.random() * sprites.length);
      o.spin = (Math.random() - 0.5) * 0.5;
      return o;
    };

    const count = window.innerWidth < 700 ? 22 : 40;
    const particles: Particle[] = Array.from({ length: count }, () => spawn());

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      if (!visible) return;
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const k = intensity ? intensity.current : 1;
      ctx.clearRect(0, 0, w, h);
      ctx.globalCompositeOperation = "lighter";
      for (const p of particles) {
        p.life += dt;
        if (p.life >= p.max) spawn(p);
        p.x += (p.vx + Math.sin(p.life * 1.3 + p.spin * 10) * 22) * dt;
        p.y += p.vy * dt;
        const t = p.life / p.max;
        const a = Math.sin(Math.PI * t) * p.alpha * k;
        if (a <= 0.002) continue;
        const r = p.r * (0.7 + t * 0.9);
        ctx.globalAlpha = Math.min(1, a);
        ctx.drawImage(sprites[p.sprite], p.x - r, p.y - r, r * 2, r * 2);
      }
      ctx.globalAlpha = 1;
    };

    const io = new IntersectionObserver(
      ([e]) => {
        visible = e.isIntersecting;
        last = performance.now();
      },
      { threshold: 0 }
    );
    io.observe(canvas);
    raf = requestAnimationFrame(frame);
    window.addEventListener("resize", resize);

    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      window.removeEventListener("resize", resize);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <canvas ref={ref} className={`pointer-events-none ${className}`} aria-hidden="true" />;
}
