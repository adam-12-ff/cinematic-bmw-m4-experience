import { createElement, type ElementType } from "react";

interface SplitTextProps {
  text: string;
  /** chars → letter-by-letter, words → word-by-word */
  mode?: "chars" | "words";
  as?: ElementType;
  className?: string;
  /** Optional per-word class (e.g. to colour one word differently) */
  wordClassNames?: Record<number, string>;
}

/**
 * Renders text pre-split into masked words and (optionally) characters.
 * Every unit has the `.split-char` class so GSAP can target `root.querySelectorAll(".split-char")`.
 */
export default function SplitText({
  text,
  mode = "chars",
  as = "span",
  className = "",
  wordClassNames,
}: SplitTextProps) {
  const words = text.split(" ");
  return createElement(
    as,
    { className, "aria-label": text },
    words.map((word, wi) => (
      <span key={wi}>
        <span className={`split-word ${wordClassNames?.[wi] ?? ""}`} aria-hidden="true">
          {mode === "chars" ? (
            word.split("").map((ch, ci) => (
              <span key={ci} className="split-char">
                {ch}
              </span>
            ))
          ) : (
            <span className="split-char">{word}</span>
          )}
        </span>
        {wi < words.length - 1 ? " " : null}
      </span>
    ))
  );
}
