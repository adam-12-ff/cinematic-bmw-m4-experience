/**
 * Procedural BMW M4-style engine audio built on the native Web Audio API.
 * No external files → no CORS / 404 risk, and the pitch follows the tachometer in real time.
 *
 * - Starts MUTED (browser autoplay policy). The first user gesture (UNLEASH / START ENGINE / mute toggle)
 *   unlocks the AudioContext.
 * - Hero bass rumble (scroll-reactive)
 * - Starter motor crank → ignition boom → live RPM-driven twin-turbo inline-6 voice
 * - Exhaust crackle / pops on throttle lift
 */
import { useSyncExternalStore } from "react";

export interface AudioState {
  muted: boolean;
  unlocked: boolean;
}

interface EngineNodes {
  out: GainNode;
  filter: BiquadFilterNode;
  oscs: { osc: OscillatorNode; ratio: number }[];
  lfo: OscillatorNode;
  noiseFilter: BiquadFilterNode;
  noiseGain: GainNode;
  turbo: OscillatorNode;
  turboGain: GainNode;
  sources: AudioScheduledSourceNode[];
}

interface RumbleNodes {
  gain: GainNode;
  filter: BiquadFilterNode;
}

function makeCurve(amount: number): Float32Array<ArrayBuffer> {
  const n = 1024;
  const curve = new Float32Array(new ArrayBuffer(n * 4));
  for (let i = 0; i < n; i++) {
    const x = (i * 2) / n - 1;
    curve[i] = Math.tanh(x * amount);
  }
  return curve;
}

class EngineAudio {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private noiseBuf: AudioBuffer | null = null;
  private rumble: RumbleNodes | null = null;
  private engine: EngineNodes | null = null;
  private rumbleActive = false;
  private rumbleLevel = 0;
  private lastRpmUpdate = 0;
  private state: AudioState = { muted: true, unlocked: false };
  private listeners = new Set<() => void>();

  /* ------------------------------ store ------------------------------ */
  subscribe = (l: () => void) => {
    this.listeners.add(l);
    return () => {
      this.listeners.delete(l);
    };
  };
  getState = () => this.state;
  private setState(patch: Partial<AudioState>) {
    this.state = { ...this.state, ...patch };
    this.listeners.forEach((l) => l());
  }

  /* ------------------------------ context ---------------------------- */
  private ensure(): AudioContext | null {
    if (typeof window === "undefined") return null;
    if (!this.ctx) {
      const AC: typeof AudioContext | undefined =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AC) return null;
      const ctx = new AC();
      const master = ctx.createGain();
      master.gain.value = this.state.muted ? 0 : 0.9;
      const comp = ctx.createDynamicsCompressor();
      comp.threshold.value = -16;
      comp.knee.value = 20;
      comp.ratio.value = 6;
      comp.attack.value = 0.004;
      comp.release.value = 0.22;
      master.connect(comp);
      comp.connect(ctx.destination);
      this.ctx = ctx;
      this.master = master;

      // 2s of white noise, reused everywhere
      const len = ctx.sampleRate * 2;
      const buf = ctx.createBuffer(1, len, ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
      this.noiseBuf = buf;

      this.buildRumble();
    }
    if (this.ctx.state === "suspended") void this.ctx.resume();
    return this.ctx;
  }

  private applyMaster() {
    if (!this.ctx || !this.master) return;
    this.master.gain.setTargetAtTime(this.state.muted ? 0 : 0.9, this.ctx.currentTime, 0.05);
  }

  /** First user gesture: enables audio + un-mutes. */
  unlock() {
    const ctx = this.ensure();
    if (!ctx) return;
    if (!this.state.unlocked) {
      this.setState({ unlocked: true, muted: false });
      this.applyMaster();
      this.applyRumble();
    }
  }

  toggleMute() {
    const ctx = this.ensure();
    if (!ctx) return;
    this.setState({ unlocked: true, muted: !this.state.muted });
    this.applyMaster();
    this.applyRumble();
  }

  setMuted(muted: boolean) {
    const ctx = this.ensure();
    if (!ctx) return;
    this.setState({ unlocked: true, muted });
    this.applyMaster();
    this.applyRumble();
  }

  get isAudible() {
    return this.state.unlocked && !this.state.muted;
  }

  /* ------------------------------ rumble ----------------------------- */
  private buildRumble() {
    const ctx = this.ctx!;
    const gain = ctx.createGain();
    gain.gain.value = 0;
    const throb = ctx.createGain();
    throb.gain.value = 0.75;
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 120;
    filter.Q.value = 2.5;

    const mk = (type: OscillatorType, f: number, g: number) => {
      const o = ctx.createOscillator();
      o.type = type;
      o.frequency.value = f;
      const og = ctx.createGain();
      og.gain.value = g;
      o.connect(og);
      og.connect(filter);
      o.start();
    };
    mk("sine", 36, 0.8);
    mk("triangle", 54.5, 0.5);
    mk("sawtooth", 27.5, 0.22);

    const n = ctx.createBufferSource();
    n.buffer = this.noiseBuf;
    n.loop = true;
    const nf = ctx.createBiquadFilter();
    nf.type = "lowpass";
    nf.frequency.value = 90;
    const ng = ctx.createGain();
    ng.gain.value = 0.9;
    n.connect(nf);
    nf.connect(ng);
    ng.connect(filter);
    n.start();

    const lfo = ctx.createOscillator();
    lfo.type = "sine";
    lfo.frequency.value = 3.1;
    const lfoDepth = ctx.createGain();
    lfoDepth.gain.value = 0.25;
    lfo.connect(lfoDepth);
    lfoDepth.connect(throb.gain);
    lfo.start();

    filter.connect(throb);
    throb.connect(gain);
    gain.connect(this.master!);
    this.rumble = { gain, filter };
  }

  private applyRumble() {
    if (!this.ctx || !this.rumble || !this.state.unlocked) return;
    const t = this.ctx.currentTime;
    const target = this.rumbleActive ? 0.2 + this.rumbleLevel * 0.55 : 0;
    this.rumble.gain.gain.setTargetAtTime(target, t, 0.14);
    this.rumble.filter.frequency.setTargetAtTime(100 + this.rumbleLevel * 170, t, 0.14);
  }

  /** Hero bass rumble. level 0..1 is scroll velocity. */
  setRumble(active: boolean, level = 0) {
    this.rumbleActive = active;
    this.rumbleLevel = Math.max(0, Math.min(1, level));
    this.applyRumble();
  }

  /** Deep sub-bass hit (headlight flash / UNLEASH). */
  thump(strength = 1) {
    if (!this.isAudible) return;
    const ctx = this.ensure();
    if (!ctx || !this.master || !this.noiseBuf) return;
    const t = ctx.currentTime;
    const o = ctx.createOscillator();
    o.type = "sine";
    o.frequency.setValueAtTime(95, t);
    o.frequency.exponentialRampToValueAtTime(30, t + 0.55);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.9 * strength, t + 0.015);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.8);
    o.connect(g);
    g.connect(this.master);
    o.start(t);
    o.stop(t + 0.9);

    const n = ctx.createBufferSource();
    n.buffer = this.noiseBuf;
    const f = ctx.createBiquadFilter();
    f.type = "lowpass";
    f.frequency.setValueAtTime(420, t);
    f.frequency.exponentialRampToValueAtTime(60, t + 0.5);
    const ng = ctx.createGain();
    ng.gain.setValueAtTime(0.5 * strength, t);
    ng.gain.exponentialRampToValueAtTime(0.0001, t + 0.55);
    n.connect(f);
    f.connect(ng);
    ng.connect(this.master);
    n.start(t, Math.random() * 1.2);
    n.stop(t + 0.6);
  }

  /* ------------------------------ engine ----------------------------- */
  /** Starter-motor crank. Returns crank duration in seconds. */
  crank(): number {
    const crank = 0.9;
    const ctx = this.ensure();
    if (!ctx || !this.master) return crank;
    const t = ctx.currentTime;

    const o = ctx.createOscillator();
    o.type = "sawtooth";
    o.frequency.setValueAtTime(46, t);
    o.frequency.exponentialRampToValueAtTime(96, t + crank);
    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 780;
    const chopped = ctx.createGain();
    chopped.gain.value = 0.5;
    const chop = ctx.createOscillator();
    chop.type = "square";
    chop.frequency.setValueAtTime(8, t);
    chop.frequency.linearRampToValueAtTime(13, t + crank);
    const chopDepth = ctx.createGain();
    chopDepth.gain.value = 0.42;
    chop.connect(chopDepth);
    chopDepth.connect(chopped.gain);

    const env = ctx.createGain();
    env.gain.setValueAtTime(0.0001, t);
    env.gain.exponentialRampToValueAtTime(0.5, t + 0.06);
    env.gain.setValueAtTime(0.5, t + crank - 0.05);
    env.gain.exponentialRampToValueAtTime(0.0001, t + crank + 0.08);

    o.connect(lp);
    lp.connect(chopped);
    chopped.connect(env);
    env.connect(this.master);

    // electric whine
    const w = ctx.createOscillator();
    w.type = "sine";
    w.frequency.setValueAtTime(420, t);
    w.frequency.exponentialRampToValueAtTime(820, t + crank);
    const wg = ctx.createGain();
    wg.gain.setValueAtTime(0.0001, t);
    wg.gain.exponentialRampToValueAtTime(0.045, t + 0.1);
    wg.gain.exponentialRampToValueAtTime(0.0001, t + crank + 0.05);
    w.connect(wg);
    wg.connect(this.master);

    [o, chop, w].forEach((s) => {
      s.start(t);
      s.stop(t + crank + 0.15);
    });
    return crank;
  }

  /** Ignition: boom + engine voice comes alive. */
  fire() {
    const ctx = this.ensure();
    if (!ctx) return;
    this.thump(1.1);
    this.pop(ctx.currentTime + 0.01, 1);
    this.pop(ctx.currentTime + 0.09, 0.7);
    this.startEngine();
  }

  private startEngine() {
    if (this.engine) return;
    const ctx = this.ensure();
    if (!ctx || !this.master || !this.noiseBuf) return;
    const t = ctx.currentTime;

    const out = ctx.createGain();
    out.gain.setValueAtTime(0.0001, t);
    out.gain.exponentialRampToValueAtTime(0.4, t + 0.05);

    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.Q.value = 1.4;
    filter.frequency.value = 900;

    const shaper = ctx.createWaveShaper();
    shaper.curve = makeCurve(2.4);
    shaper.oversample = "2x";

    const am = ctx.createGain();
    am.gain.value = 0.8;
    const lfo = ctx.createOscillator();
    lfo.type = "sine";
    lfo.frequency.value = 20;
    const lfoDepth = ctx.createGain();
    lfoDepth.gain.value = 0.22;
    lfo.connect(lfoDepth);
    lfoDepth.connect(am.gain);

    const sources: AudioScheduledSourceNode[] = [lfo];

    const defs: { type: OscillatorType; ratio: number; gain: number }[] = [
      { type: "sawtooth", ratio: 1, gain: 0.5 },
      { type: "sawtooth", ratio: 2.012, gain: 0.28 },
      { type: "square", ratio: 0.5, gain: 0.4 },
      { type: "sawtooth", ratio: 3, gain: 0.14 },
      { type: "triangle", ratio: 1.006, gain: 0.3 },
    ];
    const oscs = defs.map((d) => {
      const osc = ctx.createOscillator();
      osc.type = d.type;
      osc.frequency.value = 40 * d.ratio;
      const g = ctx.createGain();
      g.gain.value = d.gain;
      osc.connect(g);
      g.connect(shaper);
      sources.push(osc);
      return { osc, ratio: d.ratio };
    });

    shaper.connect(filter);
    filter.connect(am);
    am.connect(out);

    // intake / exhaust roar
    const noise = ctx.createBufferSource();
    noise.buffer = this.noiseBuf;
    noise.loop = true;
    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = "bandpass";
    noiseFilter.frequency.value = 500;
    noiseFilter.Q.value = 0.7;
    const noiseGain = ctx.createGain();
    noiseGain.gain.value = 0.06;
    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(out);
    sources.push(noise);

    // twin-turbo whistle
    const turbo = ctx.createOscillator();
    turbo.type = "sine";
    turbo.frequency.value = 1800;
    const turboGain = ctx.createGain();
    turboGain.gain.value = 0;
    turbo.connect(turboGain);
    turboGain.connect(out);
    sources.push(turbo);

    out.connect(this.master);
    sources.forEach((s) => s.start(t));

    this.engine = { out, filter, oscs, lfo, noiseFilter, noiseGain, turbo, turboGain, sources };
    this.lastRpmUpdate = 0;
    this.setRpm(900, true);
  }

  /** Drive the voice from the tachometer value (called every frame, internally throttled). */
  setRpm(rpm: number, force = false) {
    const e = this.engine;
    const ctx = this.ctx;
    if (!e || !ctx) return;
    const now = ctx.currentTime;
    if (!force && now - this.lastRpmUpdate < 0.025) return;
    this.lastRpmUpdate = now;

    const r = Math.max(0, Math.min(8600, rpm));
    // inline-6 → 3 firing events per crank revolution
    const f = Math.max(12, (r / 60) * 3);
    e.oscs.forEach((o) => o.osc.frequency.setTargetAtTime(f * o.ratio, now, 0.03));
    e.lfo.frequency.setTargetAtTime(Math.max(3, f * 0.5), now, 0.03);
    e.filter.frequency.setTargetAtTime(380 + r * 0.62, now, 0.05);
    e.noiseFilter.frequency.setTargetAtTime(280 + r * 0.38, now, 0.05);
    const k = r / 8000;
    e.noiseGain.gain.setTargetAtTime(0.05 + k * 0.34, now, 0.05);
    e.out.gain.setTargetAtTime(0.34 + k * 0.5, now, 0.05);
    e.turbo.frequency.setTargetAtTime(1600 + r * 0.55, now, 0.08);
    e.turboGain.gain.setTargetAtTime(Math.max(0, (r - 2200) / 6000) * 0.05, now, 0.12);
  }

  stopEngine(fade = 0.6) {
    const e = this.engine;
    const ctx = this.ctx;
    if (!e || !ctx) return;
    this.engine = null;
    const t = ctx.currentTime;
    e.out.gain.cancelScheduledValues(t);
    e.out.gain.setTargetAtTime(0.0001, t, fade / 4);
    window.setTimeout(() => {
      e.sources.forEach((s) => {
        try {
          s.stop();
        } catch {
          /* already stopped */
        }
      });
      e.out.disconnect();
    }, fade * 1000 + 250);
  }

  get running() {
    return !!this.engine;
  }

  /* ------------------------------ crackle ---------------------------- */
  private pop(t: number, vol: number) {
    const ctx = this.ctx;
    if (!ctx || !this.master || !this.noiseBuf) return;
    const n = ctx.createBufferSource();
    n.buffer = this.noiseBuf;
    const bp = ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.value = 450 + Math.random() * 1400;
    bp.Q.value = 1.1;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.85 * vol, t + 0.004);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.07 + Math.random() * 0.04);
    n.connect(bp);
    bp.connect(g);
    g.connect(this.master);
    n.start(t, Math.random() * 1.5);
    n.stop(t + 0.14);

    const o = ctx.createOscillator();
    o.type = "sine";
    o.frequency.setValueAtTime(150, t);
    o.frequency.exponentialRampToValueAtTime(48, t + 0.09);
    const og = ctx.createGain();
    og.gain.setValueAtTime(0.0001, t);
    og.gain.exponentialRampToValueAtTime(0.5 * vol, t + 0.006);
    og.gain.exponentialRampToValueAtTime(0.0001, t + 0.11);
    o.connect(og);
    og.connect(this.master);
    o.start(t);
    o.stop(t + 0.15);
  }

  /** Exhaust pops & burbles on throttle lift. */
  crackle(count = 6, spread = 1.2, delay = 0) {
    if (!this.isAudible) return;
    const ctx = this.ensure();
    if (!ctx) return;
    const t0 = ctx.currentTime + delay;
    for (let i = 0; i < count; i++) {
      this.pop(t0 + 0.04 + Math.random() * spread, 0.45 + Math.random() * 0.55);
    }
  }
}

export const audio = new EngineAudio();

export function useAudioState(): AudioState {
  return useSyncExternalStore(audio.subscribe, audio.getState, audio.getState);
}
