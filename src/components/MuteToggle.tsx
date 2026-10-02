import { Volume2, VolumeX } from "lucide-react";
import { audio, useAudioState } from "../lib/audio";

/** Fixed corner mute toggle. Also acts as the first user gesture that unlocks audio. */
export default function MuteToggle() {
  const { muted } = useAudioState();
  return (
    <button
      type="button"
      onClick={() => audio.toggleMute()}
      aria-label={muted ? "Turn sound on" : "Mute sound"}
      aria-pressed={!muted}
      className="group fixed right-4 bottom-4 z-[90] flex items-center gap-3 rounded-full border border-white/15 bg-black/60 py-2.5 pr-4 pl-3.5 backdrop-blur-xl transition-all duration-500 hover:border-m-light/60 hover:shadow-[0_0_30px_rgba(0,168,232,0.35)] sm:right-6 sm:bottom-6"
    >
      <span className="relative flex h-5 w-5 items-center justify-center text-white">
        {muted ? <VolumeX size={18} /> : <Volume2 size={18} className="text-m-light" />}
      </span>
      <span className="flex h-4 items-end gap-[3px]" aria-hidden="true">
        {[0, 1, 2, 3].map((i) => (
          <span
            key={i}
            className={`w-[3px] rounded-full ${muted ? "h-[3px] bg-white/30" : "eq-bar h-full bg-m-light"}`}
            style={muted ? undefined : { animationDelay: `${i * 0.13}s` }}
          />
        ))}
      </span>
      <span className="hidden font-mono text-[0.65rem] tracking-[0.25em] text-white/70 uppercase sm:inline">
        {muted ? "Sound off" : "Sound on"}
      </span>
    </button>
  );
}
