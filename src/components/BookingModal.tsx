import { useEffect, useLayoutEffect, useRef, useState, type FormEvent } from "react";
import { X, Check, Send } from "lucide-react";
import { gsap } from "../lib/gsap";
import { getLenis } from "../lib/scroll";

interface BookingModalProps {
  open: boolean;
  onClose: () => void;
}

const EXPERIENCES = ["M Track Day — Circuit", "Road Drive — Alpine Route", "Factory Delivery Experience", "Private Test Drive"];

export default function BookingModal({ open, onClose }: BookingModalProps) {
  const [render, setRender] = useState(false);
  const [status, setStatus] = useState<"idle" | "sending" | "done">("idle");
  const overlayRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const firstField = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) setRender(true);
  }, [open]);

  // Escape to close
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // spring in / slide out
  useLayoutEffect(() => {
    if (!render) return;
    const overlay = overlayRef.current;
    const panel = panelRef.current;
    if (!overlay || !panel) return;

    if (open) {
      getLenis()?.stop();
      gsap.killTweensOf([overlay, panel]);
      gsap.set(overlay, { opacity: 0 });
      gsap.set(panel, { y: window.innerHeight, opacity: 1 });
      gsap.to(overlay, { opacity: 1, duration: 0.5, ease: "power2.out" });
      gsap.to(panel, { y: 0, duration: 1.6, ease: "elastic.out(1, 0.82)" });
      gsap.fromTo(
        panel.querySelectorAll(".m-anim"),
        { y: 34, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.9, stagger: 0.06, delay: 0.3, ease: "power3.out" }
      );
      const t = window.setTimeout(() => firstField.current?.focus({ preventScroll: true }), 700);
      return () => window.clearTimeout(t);
    }

    gsap.killTweensOf([overlay, panel]);
    gsap.to(panel, { y: window.innerHeight, duration: 0.65, ease: "power3.in" });
    gsap.to(overlay, {
      opacity: 0,
      duration: 0.5,
      delay: 0.2,
      ease: "power2.out",
      onComplete: () => {
        setRender(false);
        setStatus("idle");
        getLenis()?.start();
      },
    });
  }, [open, render]);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    setStatus("sending");
    window.setTimeout(() => {
      setStatus("done");
      requestAnimationFrame(() => {
        const panel = panelRef.current;
        if (!panel) return;
        gsap.fromTo(
          panel.querySelectorAll(".done-anim"),
          { y: 30, opacity: 0, scale: 0.9 },
          { y: 0, opacity: 1, scale: 1, duration: 0.9, stagger: 0.1, ease: "back.out(1.8)" }
        );
      });
    }, 1100);
  };

  if (!render) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="Book your M Experience">
      <div ref={overlayRef} onClick={onClose} className="absolute inset-0 bg-black/75 backdrop-blur-sm" />
      <div
        ref={panelRef}
        data-lenis-prevent
        className="relative max-h-[92svh] w-full max-w-xl overflow-y-auto rounded-3xl border border-white/15 shadow-[0_-30px_120px_rgba(28,105,212,0.35),0_0_0_1px_rgba(255,255,255,0.04)] backdrop-blur-2xl"
        style={{ background: "linear-gradient(145deg, rgba(30,36,52,0.62), rgba(8,10,16,0.82))" }}
      >
        <div className="m-stripe sticky top-0 z-10 h-[3px] w-full" />
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute top-5 right-5 z-10 flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/5 text-white/80 transition-all duration-300 hover:rotate-90 hover:border-m-light hover:text-white"
        >
          <X size={18} />
        </button>

        {status === "done" ? (
          <div className="flex flex-col items-center px-8 py-16 text-center">
            <div className="done-anim mb-6 flex h-20 w-20 items-center justify-center rounded-full border border-m-light/60 bg-m-light/10 shadow-[0_0_50px_rgba(0,168,232,0.5)]">
              <Check size={38} className="text-m-light" />
            </div>
            <h3 className="done-anim font-display-wide text-3xl text-white sm:text-4xl">You're on the grid.</h3>
            <p className="done-anim subtitle-thin mt-4 max-w-sm text-white/65">
              Your M Experience request is in. An M specialist will contact you within 24 hours to lock in your date.
            </p>
            <button
              type="button"
              onClick={onClose}
              className="done-anim mt-8 rounded-full border border-white/20 px-8 py-3 font-mono text-xs tracking-[0.3em] text-white uppercase transition-all duration-300 hover:border-m-light hover:shadow-[0_0_30px_rgba(0,168,232,0.5)]"
            >
              Back to the road
            </button>
          </div>
        ) : (
          <form onSubmit={submit} className="px-6 py-9 sm:px-9 sm:py-11">
            <p className="m-anim eyebrow mb-3 text-m-light">Reserve your seat</p>
            <h3 className="m-anim font-display-wide pr-10 text-3xl text-white sm:text-4xl">Book Your M Experience</h3>
            <p className="m-anim subtitle-thin mt-3 mb-7 text-sm text-white/60">
              Tell us a little about you. We'll handle the rest — the keys, the road, the adrenaline.
            </p>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="m-anim block">
                <span className="mb-1.5 block font-mono text-[0.6rem] tracking-[0.25em] text-white/50 uppercase">Full name</span>
                <input ref={firstField} required name="name" type="text" autoComplete="name" placeholder="Your name" className="m-input" />
              </label>
              <label className="m-anim block">
                <span className="mb-1.5 block font-mono text-[0.6rem] tracking-[0.25em] text-white/50 uppercase">Email</span>
                <input required name="email" type="email" autoComplete="email" placeholder="you@email.com" className="m-input" />
              </label>
              <label className="m-anim block">
                <span className="mb-1.5 block font-mono text-[0.6rem] tracking-[0.25em] text-white/50 uppercase">Phone</span>
                <input name="phone" type="tel" autoComplete="tel" placeholder="+1 555 000 0000" className="m-input" />
              </label>
              <label className="m-anim block">
                <span className="mb-1.5 block font-mono text-[0.6rem] tracking-[0.25em] text-white/50 uppercase">Preferred date</span>
                <input required name="date" type="date" className="m-input" />
              </label>
              <label className="m-anim block sm:col-span-2">
                <span className="mb-1.5 block font-mono text-[0.6rem] tracking-[0.25em] text-white/50 uppercase">Experience</span>
                <select name="experience" defaultValue={EXPERIENCES[0]} className="m-input">
                  {EXPERIENCES.map((x) => (
                    <option key={x}>{x}</option>
                  ))}
                </select>
              </label>
              <label className="m-anim block sm:col-span-2">
                <span className="mb-1.5 block font-mono text-[0.6rem] tracking-[0.25em] text-white/50 uppercase">Anything we should know?</span>
                <textarea name="notes" rows={3} placeholder="Colour preference, track experience, questions…" className="m-input resize-none" />
              </label>
            </div>

            <button
              type="submit"
              disabled={status === "sending"}
              className="m-anim group relative mt-7 flex w-full items-center justify-center gap-3 overflow-hidden rounded-full bg-gradient-to-r from-m-blue to-[#0e4fb0] px-8 py-4 font-display-wide text-sm tracking-[0.08em] text-white shadow-[0_0_40px_rgba(28,105,212,0.55)] transition-all duration-500 hover:shadow-[0_0_70px_rgba(0,168,232,0.8)] disabled:opacity-70"
            >
              <span className="m-stripe absolute inset-x-0 bottom-0 h-[3px]" />
              {status === "sending" ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Sending…
                </>
              ) : (
                <>
                  Confirm Request
                  <Send size={16} className="transition-transform duration-500 group-hover:translate-x-1 group-hover:-translate-y-1" />
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
